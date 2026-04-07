"""Admin endpoints — student management, approvals, dashboard, account management."""

import io
import os
import re
import zipfile
from datetime import date, datetime, timezone
from io import BytesIO
from typing import Optional

import requests as http_requests
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import settings
from app.auth.dependencies import require_role
from app.auth.jwt_handler import hash_password
from app.models.user import User, UserRole
from app.models.student import Student, StudentStatus, EnrollmentType
from app.models.academic_calendar import AcademicCalendar
from app.schemas.student import StudentResponse, StudentListResponse, EnrollmentApproval, EnrollmentRecordResponse
from app.schemas.user import AccountCreate, AccountListResponse, UserResponse, PasswordReset
from app.schemas.common import MessageResponse, DashboardStats
from app.models.notification import NotificationType
from app.utils.notifications import create_notification
from app.utils.audit_log import create_audit_log
from app.utils.report_pdf import build_enrollment_report
from app.models.audit_log import AuditLog
from app.models.student_subject import StudentSubject
from app.models.announcement import Announcement
from app.utils.cloudinary_utils import delete_student_files, clear_student_file_fields, download_cloudinary_file


# ── Academic Calendar Schemas ────────────────────────────────────────


class AcademicCalendarUpdate(BaseModel):
    school_year: str
    semester: str
    enrollment_start: Optional[date] = None
    enrollment_end: Optional[date] = None
    is_open: bool


class AcademicCalendarResponse(BaseModel):
    id: int
    school_year: str
    semester: str
    enrollment_start: Optional[date]
    enrollment_end: Optional[date]
    is_open: bool
    updated_at: datetime

    class Config:
        from_attributes = True

class AuditLogResponse(BaseModel):
    id: int
    user_id: int | None
    user_email: str
    user_role: str
    action: str
    target_name: str | None
    details: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class AuditLogListResponse(BaseModel):
    logs: list[AuditLogResponse]
    total: int
    page: int
    per_page: int


router = APIRouter(prefix="/api/admin", tags=["Admin"])


def _student_to_response(student: Student) -> StudentResponse:
    data = {c.name: getattr(student, c.name) for c in student.__table__.columns}
    data["email"] = student.user.email if student.user else None
    if data.get("documents_path") is None:
        data["documents_path"] = []
    return StudentResponse(**data)


@router.get("/students", response_model=StudentListResponse)
def list_students(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status_filter: str | None = Query(None, alias="status"),
    grade_level: str | None = None,
    strand: str | None = None,
    semester: str | None = None,
    _admin: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    """List all students with pagination and optional filters."""
    query = db.query(Student)

    if status_filter:
        try:
            query = query.filter(Student.status == StudentStatus(status_filter))
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status: {status_filter}. Must be pending, approved, or denied",
            )
    if grade_level:
        query = query.filter(Student.grade_level_to_enroll == grade_level)
    if strand:
        query = query.filter(Student.strand == strand)
    if semester:
        query = query.filter(Student.semester == semester)

    total = query.count()
    students = query.order_by(Student.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    return StudentListResponse(
        students=[_student_to_response(s) for s in students],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/students/pending", response_model=StudentListResponse)
def list_pending_students(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    _admin: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    """List all students with pending status."""
    query = db.query(Student).filter(Student.status == StudentStatus.PENDING)
    total = query.count()
    students = query.order_by(Student.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    return StudentListResponse(
        students=[_student_to_response(s) for s in students],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/students/{student_id}/download-files")
def download_student_files(
    student_id: int,
    _admin: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    """Download all uploaded files for a student as a ZIP archive."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    student_name = re.sub(r"[^\w\s-]", "", f"{student.first_name or ''} {student.last_name or ''}".strip()) or f"student_{student_id}"
    folder_name = student_name.replace(" ", "_")

    file_entries = [
        ("photo", student.student_photo_path),
        ("grades", student.grades_path),
        ("voucher", student.voucher_path),
        ("psa_birth_cert", student.psa_birth_cert_path),
        ("transfer_credential", student.transfer_credential_path),
        ("good_moral", student.good_moral_path),
    ]
    for i, url in enumerate(student.documents_path or []):
        file_entries.append((f"document_{i + 1}", url))

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for label, url in file_entries:
            if not url:
                continue
            content = download_cloudinary_file(url)
            if not content:
                continue
            filename = url.split("?")[0].split("/")[-1]
            ext = filename.rsplit(".", 1)[-1] if "." in filename else "bin"
            zf.writestr(f"{folder_name}/{label}.{ext}", content)

    zip_buffer.seek(0)
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{folder_name}_files.zip"'},
    )


@router.put("/students/{student_id}/approve", response_model=MessageResponse)
def approve_student(
    student_id: int,
    enrollment_data: EnrollmentApproval | None = None,
    _admin: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    """Approve a pending student registration with enrollment form data."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    if student.status != StudentStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Student is already {student.status.value}",
        )

    # Save enrollment form fields from admin
    if enrollment_data:
        if enrollment_data.enrollment_date is not None:
            student.enrollment_date = enrollment_data.enrollment_date
        if enrollment_data.place_of_birth is not None:
            student.place_of_birth = enrollment_data.place_of_birth
        if enrollment_data.nationality is not None:
            student.nationality = enrollment_data.nationality
        if enrollment_data.civil_status is not None:
            student.civil_status = enrollment_data.civil_status

    student.status = StudentStatus.APPROVED
    student.updated_at = datetime.now(timezone.utc)

    # Notify student
    create_notification(
        db, student.user_id,
        "Application Approved",
        "Your registration application has been approved.",
        NotificationType.APPLICATION_APPROVED,
    )
    # Notify all registrars
    registrars = db.query(User).filter(User.role == UserRole.REGISTRAR, User.is_active == True).all()
    for reg in registrars:
        create_notification(
            db, reg.id,
            "Student Approved",
            f"Student {student.first_name or ''} {student.last_name or ''} has been approved by admin.",
            NotificationType.STUDENT_APPROVED,
        )

    student_label = student.student_number or f"{student.first_name or ''} {student.last_name or ''}".strip() or f"ID {student.id}"
    create_audit_log(db, _admin, "STUDENT_APPROVED", target_name=student_label)
    db.commit()
    return MessageResponse(message=f"Student {student_label} has been approved")


class DenyStudentRequest(BaseModel):
    reason: str | None = None


@router.put("/students/{student_id}/deny", response_model=MessageResponse)
def deny_student(
    student_id: int,
    body: DenyStudentRequest | None = None,
    _admin: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    """Deny a pending student registration with an optional reason."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    if student.status != StudentStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Student is already {student.status.value}",
        )

    student.status = StudentStatus.DENIED
    student.denial_reason = (body.reason.strip() if body and body.reason and body.reason.strip() else None)
    student.updated_at = datetime.now(timezone.utc)

    # Delete enrollment documents from Cloudinary — no longer needed after denial
    delete_student_files(student)
    clear_student_file_fields(student)

    # Build notification message
    notif_body = "Your registration application has been denied."
    if student.denial_reason:
        notif_body += f" Reason: {student.denial_reason}"
    else:
        notif_body += " Please contact the admin for details."

    create_notification(
        db, student.user_id,
        "Application Denied",
        notif_body,
        NotificationType.APPLICATION_DENIED,
    )

    student_label = student.student_number or f"{student.first_name or ''} {student.last_name or ''}".strip() or f"ID {student.id}"
    create_audit_log(db, _admin, "STUDENT_DENIED", target_name=student_label, details=student.denial_reason)
    db.commit()
    return MessageResponse(message=f"Student {student_label} has been denied")


@router.get("/students/{student_id}", response_model=StudentResponse)
def get_student(
    student_id: int,
    _admin: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    """Get a specific student's complete form data."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    return _student_to_response(student)


@router.delete("/students/{student_id}", response_model=MessageResponse)
def delete_student(
    student_id: int,
    _admin: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    """Delete a student record and their associated user account."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    if student.status == StudentStatus.DENIED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete a denied student. Denied students may reapply for enrollment.",
        )

    user = student.user
    student_label = student.student_number or f"{student.first_name or ''} {student.last_name or ''}".strip() or f"ID {student.id}"
    create_audit_log(db, _admin, "STUDENT_DELETED", target_name=student_label)
    db.delete(student)
    if user:
        db.delete(user)
    db.commit()
    return MessageResponse(message="Student deleted successfully")


@router.get("/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(
    _admin: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    """Dashboard statistics: totals, breakdown by grade level and strand."""
    total = db.query(func.count(Student.id)).scalar() or 0
    pending = db.query(func.count(Student.id)).filter(Student.status == StudentStatus.PENDING).scalar() or 0
    approved = db.query(func.count(Student.id)).filter(Student.status == StudentStatus.APPROVED).scalar() or 0
    denied = db.query(func.count(Student.id)).filter(Student.status == StudentStatus.DENIED).scalar() or 0

    # Breakdown by grade level
    grade_rows = (
        db.query(Student.grade_level_to_enroll, func.count(Student.id))
        .filter(Student.grade_level_to_enroll.isnot(None))
        .group_by(Student.grade_level_to_enroll)
        .all()
    )
    by_grade = {grade: count for grade, count in grade_rows}

    # Breakdown by strand
    strand_rows = (
        db.query(Student.strand, func.count(Student.id))
        .filter(Student.strand.isnot(None))
        .group_by(Student.strand)
        .all()
    )
    by_strand = {strand: count for strand, count in strand_rows}

    # Breakdown by sex
    sex_rows = (
        db.query(Student.sex, func.count(Student.id))
        .filter(Student.sex.isnot(None))
        .group_by(Student.sex)
        .all()
    )
    by_sex = {sex.value if hasattr(sex, "value") else sex: count for sex, count in sex_rows}

    # Breakdown by enrollment type
    enrollment_type_rows = (
        db.query(Student.enrollment_type, func.count(Student.id))
        .filter(Student.enrollment_type.isnot(None))
        .group_by(Student.enrollment_type)
        .all()
    )
    by_enrollment_type = {
        (et.value if hasattr(et, "value") else et).replace("_", " ").title(): count
        for et, count in enrollment_type_rows
    }

    return DashboardStats(
        total_students=total,
        pending_students=pending,
        approved_students=approved,
        denied_students=denied,
        by_grade_level=by_grade,
        by_strand=by_strand,
        by_sex=by_sex,
        by_enrollment_type=by_enrollment_type,
    )


@router.get("/students/{student_id}/enrollment-history", response_model=list[EnrollmentRecordResponse])
def get_student_enrollment_history(
    student_id: int,
    _admin: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    """Get enrollment history for a specific student, newest first."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    return student.enrollment_records


@router.get("/students/{student_id}/documents")
def get_student_documents(
    student_id: int,
    _admin: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    """Get the list of document paths for a student. Use individual paths to download."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    documents = student.documents_path or []
    result = []
    for doc_url in documents:
        result.append({
            "path": doc_url,
            "exists": True,
            "download_url": doc_url,
        })
    return {"student_id": student_id, "documents": result}


# ── Account Management ──────────────────────────────────────────────


@router.get("/accounts", response_model=AccountListResponse)
def list_accounts(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    role: str | None = None,
    search: str | None = None,
    _admin: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    """List all user accounts with pagination and optional role filter."""
    query = db.query(User)

    if role:
        try:
            query = query.filter(User.role == UserRole(role))
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role: {role}",
            )

    if search:
        search_term = f"%{search}%"
        # Search by email OR by student name (join with Student table)
        query = query.outerjoin(Student, Student.user_id == User.id).filter(
            (User.email.ilike(search_term))
            | (Student.first_name.ilike(search_term))
            | (Student.last_name.ilike(search_term))
            | (Student.student_number.ilike(search_term))
        )

    total = query.count()
    users = query.order_by(User.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    # Build response with display_name
    account_list = []
    for u in users:
        display_name = None
        if u.role == UserRole.STUDENT and u.student:
            if u.student.first_name:
                parts = [u.student.first_name, u.student.last_name]
                display_name = " ".join(p for p in parts if p)
        if not display_name:
            display_name = u.email.split("@")[0].replace(".", " ").title()
        account_list.append(UserResponse(
            id=u.id, email=u.email, role=u.role.value,
            is_active=u.is_active, created_at=u.created_at,
            display_name=display_name,
        ))

    return AccountListResponse(
        accounts=account_list,
        total=total,
        page=page,
        per_page=per_page,
    )


@router.post("/accounts", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def create_account(
    data: AccountCreate,
    _admin: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    """Create a new student or registrar account."""
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        role=UserRole(data.role),
    )
    db.add(user)
    db.flush()

    if data.role == "student":
        student = Student(
            user_id=user.id,
            status=StudentStatus.PENDING,
        )
        db.add(student)

    create_audit_log(db, _admin, "ACCOUNT_CREATED", target_name=f"{data.email} ({data.role})")
    db.commit()
    return MessageResponse(message=f"{data.role.capitalize()} account created successfully")


@router.put("/accounts/{user_id}/reset-password", response_model=MessageResponse)
def reset_password(
    user_id: int,
    data: PasswordReset,
    _admin: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    """Reset a user's password."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.password_hash = hash_password(data.new_password)
    create_audit_log(db, _admin, "PASSWORD_RESET", target_name=user.email)
    db.commit()
    return MessageResponse(message=f"Password reset successfully for {user.email}")


@router.delete("/accounts/{user_id}", response_model=MessageResponse)
def delete_account(
    user_id: int,
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    """Delete a user account. Admin cannot delete their own account."""
    if user_id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Delete associated student record if exists
    student = db.query(Student).filter(Student.user_id == user_id).first()
    if student:
        db.delete(student)

    create_audit_log(db, admin, "ACCOUNT_DELETED", target_name=f"{user.email} ({user.role.value})")
    db.delete(user)
    db.commit()
    return MessageResponse(message="Account deleted successfully")


# ── Academic Calendar ────────────────────────────────────────────────


@router.get("/academic-calendar", response_model=AcademicCalendarResponse)
def get_academic_calendar(
    _admin: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    """Get the current academic calendar settings."""
    calendar = db.query(AcademicCalendar).first()
    if not calendar:
        current_year = datetime.now(timezone.utc).year
        return AcademicCalendarResponse(
            id=0,
            school_year=f"{current_year}-{current_year + 1}",
            semester="1st",
            enrollment_start=None,
            enrollment_end=None,
            is_open=False,
            updated_at=datetime.now(timezone.utc),
        )
    return calendar


@router.put("/academic-calendar", response_model=AcademicCalendarResponse)
def upsert_academic_calendar(
    data: AcademicCalendarUpdate,
    _admin: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    """Create or update the academic calendar. Only one record is kept."""
    now = datetime.now(timezone.utc)
    calendar = db.query(AcademicCalendar).first()
    if calendar:
        calendar.school_year = data.school_year
        calendar.semester = data.semester
        calendar.enrollment_start = data.enrollment_start
        calendar.enrollment_end = data.enrollment_end
        calendar.is_open = data.is_open
        calendar.updated_at = now
    else:
        calendar = AcademicCalendar(
            school_year=data.school_year,
            semester=data.semester,
            enrollment_start=data.enrollment_start,
            enrollment_end=data.enrollment_end,
            is_open=data.is_open,
            created_at=now,
            updated_at=now,
        )
        db.add(calendar)
    create_audit_log(db, _admin, "CALENDAR_UPDATED", target_name=f"{data.school_year} {data.semester}")
    db.commit()
    db.refresh(calendar)
    return calendar


# ── Audit Logs ───────────────────────────────────────────────────────


@router.get("/audit-logs", response_model=AuditLogListResponse)
def list_audit_logs(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    action: str | None = None,
    role: str | None = None,
    search: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    _admin: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    """List audit logs with optional filters and pagination."""
    from sqlalchemy import or_

    query = db.query(AuditLog)

    if action:
        query = query.filter(AuditLog.action == action.upper())
    if role:
        query = query.filter(AuditLog.user_role == role.lower())
    if search:
        term = f"%{search}%"
        query = query.filter(
            or_(AuditLog.user_email.ilike(term), AuditLog.target_name.ilike(term))
        )
    if date_from:
        try:
            from datetime import date as date_type
            df = datetime.fromisoformat(date_from)
            query = query.filter(AuditLog.created_at >= df)
        except ValueError:
            pass
    if date_to:
        try:
            dt = datetime.fromisoformat(date_to)
            # include the full end day
            from datetime import timedelta
            dt = dt.replace(hour=23, minute=59, second=59)
            query = query.filter(AuditLog.created_at <= dt)
        except ValueError:
            pass

    total = query.count()
    logs = query.order_by(AuditLog.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    return AuditLogListResponse(logs=logs, total=total, page=page, per_page=per_page)


# ── Reports ───────────────────────────────────────────────────────────


@router.get("/reports/enrollment")
def generate_enrollment_report(
    school_year: str | None = Query(None),
    semester: str | None = Query(None),
    _admin: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    """Generate and stream a PDF enrollment report. Filters are optional."""
    base_q = db.query(Student)
    if school_year:
        base_q = base_q.filter(Student.school_year == school_year)
    if semester:
        base_q = base_q.filter(Student.semester == semester)

    total_count    = base_q.count()
    pending_count  = base_q.filter(Student.status == StudentStatus.PENDING).count()
    approved_count = base_q.filter(Student.status == StudentStatus.APPROVED).count()
    denied_count   = base_q.filter(Student.status == StudentStatus.DENIED).count()

    # Breakdown by strand
    strand_rows = (
        base_q.with_entities(Student.strand, func.count(Student.id))
        .filter(Student.strand.isnot(None))
        .group_by(Student.strand)
        .all()
    )
    by_strand = {strand: count for strand, count in strand_rows}

    # Breakdown by grade level
    grade_rows = (
        base_q.with_entities(Student.grade_level_to_enroll, func.count(Student.id))
        .filter(Student.grade_level_to_enroll.isnot(None))
        .group_by(Student.grade_level_to_enroll)
        .all()
    )
    by_grade = {grade: count for grade, count in grade_rows}

    # Breakdown by enrollment type
    et_rows = (
        base_q.with_entities(Student.enrollment_type, func.count(Student.id))
        .filter(Student.enrollment_type.isnot(None))
        .group_by(Student.enrollment_type)
        .all()
    )
    by_enrollment_type = {
        (et.value if hasattr(et, "value") else str(et)).replace("_", " ").title(): count
        for et, count in et_rows
    }

    # Sex breakdown
    sex_rows = (
        base_q.with_entities(Student.sex, func.count(Student.id))
        .filter(Student.sex.isnot(None))
        .group_by(Student.sex)
        .all()
    )
    by_sex = {(s.value if hasattr(s, "value") else str(s)).title(): cnt for s, cnt in sex_rows}

    # Payment status breakdown
    pay_rows = (
        base_q.with_entities(Student.payment_status, func.count(Student.id))
        .filter(Student.payment_status.isnot(None))
        .group_by(Student.payment_status)
        .all()
    )
    by_payment = {(p.value if hasattr(p, "value") else str(p)).replace("_", " ").title(): cnt
                  for p, cnt in pay_rows}

    # Fully enrolled = payment verified AND at least one subject assigned
    enrolled_q = (
        db.query(Student)
        .filter(Student.payment_status == "verified")
        .filter(
            db.query(StudentSubject)
            .filter(StudentSubject.student_id == Student.id)
            .exists()
        )
    )
    if school_year:
        enrolled_q = enrolled_q.filter(Student.school_year == school_year)
    if semester:
        enrolled_q = enrolled_q.filter(Student.semester == semester)

    enrolled_students = enrolled_q.order_by(Student.last_name, Student.first_name).all()

    pdf_bytes = build_enrollment_report(
        students=enrolled_students,
        school_year=school_year,
        semester=semester,
        total_count=total_count,
        pending_count=pending_count,
        approved_count=approved_count,
        denied_count=denied_count,
        enrolled_count=len(enrolled_students),
        by_strand=by_strand,
        by_grade_level=by_grade,
        by_enrollment_type=by_enrollment_type,
        by_sex=by_sex,
        by_payment=by_payment,
    )

    parts = ["enrollment_report"]
    if school_year:
        parts.append(school_year.replace("-", "_"))
    if semester:
        parts.append(semester.lower().replace(" ", "_"))
    filename = "_".join(parts) + ".pdf"

    create_audit_log(
        db, _admin, "REPORT_GENERATED",
        details=f"SY: {school_year or 'all'}, Sem: {semester or 'all'}",
    )
    db.commit()

    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ── Announcements ─────────────────────────────────────────────────────────────

class AnnouncementCreate(BaseModel):
    title: str
    message: str
    is_pinned: bool = False
    expires_at: Optional[date] = None


class AnnouncementResponse(BaseModel):
    id: int
    title: str
    message: str
    is_pinned: bool
    expires_at: Optional[date]
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("/announcements", response_model=list[AnnouncementResponse])
def list_announcements(
    db: Session = Depends(get_db),
):
    """Public — returns all non-expired announcements (pinned first, then newest)."""
    today = date.today()
    items = (
        db.query(Announcement)
        .filter(
            (Announcement.expires_at == None) | (Announcement.expires_at >= today)
        )
        .order_by(Announcement.is_pinned.desc(), Announcement.created_at.desc())
        .all()
    )
    return items


@router.post("/announcements", response_model=AnnouncementResponse, status_code=201)
def create_announcement(
    body: AnnouncementCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    ann = Announcement(
        title=body.title,
        message=body.message,
        is_pinned=body.is_pinned,
        expires_at=body.expires_at,
    )
    db.add(ann)
    db.flush()
    create_audit_log(db, _admin, "ANNOUNCEMENT_POSTED", details=body.title)
    db.commit()
    db.refresh(ann)
    return ann


@router.delete("/announcements/{ann_id}", response_model=MessageResponse)
def delete_announcement(
    ann_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    ann = db.query(Announcement).filter(Announcement.id == ann_id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found")
    create_audit_log(db, _admin, "ANNOUNCEMENT_DELETED", details=ann.title)
    db.delete(ann)
    db.commit()
    return {"message": "Announcement deleted"}
