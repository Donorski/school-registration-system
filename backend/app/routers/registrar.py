"""Registrar endpoints — subject CRUD, enrollment management, payment verification."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.dependencies import require_role
from app.models.user import User, UserRole
from app.models.student import Student, StudentStatus
from app.models.subject import Subject
from app.models.student_subject import StudentSubject
from app.schemas.student import StudentResponse, StudentListResponse
from app.schemas.subject import (
    SubjectCreate, SubjectUpdate, SubjectResponse,
    AssignSubject, UnassignSubject, BulkAssignSubjects,
)
from app.schemas.common import MessageResponse
from app.models.notification import NotificationType
from app.utils.notifications import create_notification

router = APIRouter(prefix="/api/registrar", tags=["Registrar"])


def _generate_school_id(db: Session) -> str:
    """Generate sequential student number in DBTC-XX-YY format."""
    year_suffix = str(datetime.now(timezone.utc).year)[-2:]
    # Find the highest existing number for this year
    latest = db.query(Student).filter(
        Student.student_number.like(f"DBTC-%-{year_suffix}")
    ).order_by(Student.student_number.desc()).all()

    next_seq = 1
    for s in latest:
        try:
            seq = int(s.student_number.split("-")[1])
            if seq >= next_seq:
                next_seq = seq + 1
        except (IndexError, ValueError):
            continue

    return f"DBTC-{next_seq}-{year_suffix}"


def _student_to_response(student: Student) -> StudentResponse:
    data = {c.name: getattr(student, c.name) for c in student.__table__.columns}
    data["email"] = student.user.email if student.user else None
    if data.get("documents_path") is None:
        data["documents_path"] = []
    return StudentResponse(**data)


def _subject_to_response(subject: Subject, db: Session) -> SubjectResponse:
    enrolled_count = db.query(func.count(StudentSubject.id)).filter(
        StudentSubject.subject_id == subject.id
    ).scalar() or 0
    return SubjectResponse(
        id=subject.id,
        subject_code=subject.subject_code,
        subject_name=subject.subject_name,
        units=subject.units,
        schedule=subject.schedule,
        strand=subject.strand,
        grade_level=subject.grade_level,
        semester=subject.semester,
        max_students=subject.max_students,
        enrolled_count=enrolled_count,
        created_at=subject.created_at,
    )


# --- Approved Students ---

@router.get("/students/approved", response_model=StudentListResponse)
def list_approved_students(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    grade_level: str | None = None,
    strand: str | None = None,
    semester: str | None = None,
    payment_status: str | None = None,
    enrollment_type: str | None = None,
    search: str | None = None,
    _registrar: User = Depends(require_role(UserRole.REGISTRAR)),
    db: Session = Depends(get_db),
):
    """List approved students with optional grade/strand/semester/payment_status/enrollment_type filters."""
    query = db.query(Student).filter(Student.status == StudentStatus.APPROVED)
    if grade_level:
        query = query.filter(Student.grade_level_to_enroll == grade_level)
    if strand:
        query = query.filter(Student.strand == strand)
    if semester:
        query = query.filter(Student.semester == semester)
    if payment_status:
        query = query.filter(Student.payment_status == payment_status)
    if enrollment_type:
        try:
            from app.models.student import EnrollmentType as ET
            query = query.filter(Student.enrollment_type == ET(enrollment_type))
        except ValueError:
            pass
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Student.first_name.ilike(search_term))
            | (Student.last_name.ilike(search_term))
            | (Student.student_number.ilike(search_term))
        )

    total = query.count()
    students = query.order_by(Student.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    return StudentListResponse(
        students=[_student_to_response(s) for s in students],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/students/pending-payments", response_model=StudentListResponse)
def list_pending_payments(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    _registrar: User = Depends(require_role(UserRole.REGISTRAR)),
    db: Session = Depends(get_db),
):
    """List approved students whose payment receipt is pending verification."""
    query = db.query(Student).filter(
        Student.status == StudentStatus.APPROVED,
        Student.payment_status == "pending_verification",
    )
    total = query.count()
    students = query.order_by(Student.updated_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    return StudentListResponse(
        students=[_student_to_response(s) for s in students],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.put("/students/{student_id}/verify-payment", response_model=MessageResponse)
def verify_payment(
    student_id: int,
    _registrar: User = Depends(require_role(UserRole.REGISTRAR)),
    db: Session = Depends(get_db),
):
    """Verify a student's payment receipt."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    if student.payment_status != "pending_verification":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student does not have a pending payment receipt",
        )
    student.payment_status = "verified"
    student.payment_verified_at = datetime.now(timezone.utc)

    # Auto-assign student number on payment verification
    if not student.student_number:
        student.student_number = _generate_school_id(db)

    # Notify student
    create_notification(
        db, student.user_id,
        "Payment Verified",
        f"Your payment receipt has been verified successfully. Your student number is {student.student_number}.",
        NotificationType.PAYMENT_VERIFIED,
    )

    db.commit()
    return MessageResponse(message=f"Payment verified successfully. Student number: {student.student_number}")


@router.put("/students/{student_id}/reject-payment", response_model=MessageResponse)
def reject_payment(
    student_id: int,
    _registrar: User = Depends(require_role(UserRole.REGISTRAR)),
    db: Session = Depends(get_db),
):
    """Reject a student's payment receipt and reset to unpaid."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    if student.payment_status != "pending_verification":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student does not have a pending payment receipt",
        )
    student.payment_status = "unpaid"
    student.payment_receipt_path = None
    student.payment_verified_at = None

    # Notify student
    create_notification(
        db, student.user_id,
        "Payment Rejected",
        "Your payment receipt has been rejected. Please upload a new receipt.",
        NotificationType.PAYMENT_REJECTED,
    )

    db.commit()
    return MessageResponse(message="Payment receipt rejected")


@router.get("/students/{student_id}/complete-info", response_model=StudentResponse)
def get_student_complete_info(
    student_id: int,
    _registrar: User = Depends(require_role(UserRole.REGISTRAR)),
    db: Session = Depends(get_db),
):
    """View complete student registration form data."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    return _student_to_response(student)


# --- Subject CRUD ---

@router.post("/subjects", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
def create_subject(
    data: SubjectCreate,
    _registrar: User = Depends(require_role(UserRole.REGISTRAR)),
    db: Session = Depends(get_db),
):
    """Create a new subject."""
    existing = db.query(Subject).filter(Subject.subject_code == data.subject_code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Subject code '{data.subject_code}' already exists",
        )

    subject = Subject(**data.model_dump())
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return _subject_to_response(subject, db)


@router.get("/subjects", response_model=list[SubjectResponse])
def list_subjects(
    strand: str | None = None,
    grade_level: str | None = None,
    semester: str | None = None,
    _registrar: User = Depends(require_role(UserRole.REGISTRAR)),
    db: Session = Depends(get_db),
):
    """List all subjects with optional strand/grade/semester filters."""
    query = db.query(Subject)
    if strand:
        query = query.filter(Subject.strand == strand)
    if grade_level:
        query = query.filter(Subject.grade_level == grade_level)
    if semester:
        query = query.filter(Subject.semester == semester)
    subjects = query.order_by(Subject.subject_code).all()
    return [_subject_to_response(s, db) for s in subjects]


@router.put("/subjects/{subject_id}", response_model=SubjectResponse)
def update_subject(
    subject_id: int,
    data: SubjectUpdate,
    _registrar: User = Depends(require_role(UserRole.REGISTRAR)),
    db: Session = Depends(get_db),
):
    """Update an existing subject."""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    update_data = data.model_dump(exclude_unset=True)

    # Check for duplicate subject_code if being updated
    if "subject_code" in update_data:
        existing = (
            db.query(Subject)
            .filter(Subject.subject_code == update_data["subject_code"], Subject.id != subject_id)
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Subject code '{update_data['subject_code']}' already exists",
            )

    for field, value in update_data.items():
        setattr(subject, field, value)

    db.commit()
    db.refresh(subject)
    return _subject_to_response(subject, db)


@router.delete("/subjects/{subject_id}", response_model=MessageResponse)
def delete_subject(
    subject_id: int,
    _registrar: User = Depends(require_role(UserRole.REGISTRAR)),
    db: Session = Depends(get_db),
):
    """Delete a subject and all its enrollments."""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    db.delete(subject)
    db.commit()
    return MessageResponse(message=f"Subject '{subject.subject_code}' deleted")


# --- Subject Assignment ---

@router.post("/assign-subject", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def assign_subject(
    data: AssignSubject,
    _registrar: User = Depends(require_role(UserRole.REGISTRAR)),
    db: Session = Depends(get_db),
):
    """Assign a subject to a student. Validates strand/grade match and capacity."""
    student = db.query(Student).filter(Student.id == data.student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    if student.status != StudentStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only approved students can be assigned subjects",
        )
    if student.payment_status != "verified":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student's payment must be verified before assigning subjects",
        )

    subject = db.query(Subject).filter(Subject.id == data.subject_id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    # Check strand match
    if student.strand and subject.strand != student.strand:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Subject strand '{subject.strand}' does not match student strand '{student.strand}'",
        )

    # Check grade level match
    if student.grade_level_to_enroll and subject.grade_level != student.grade_level_to_enroll:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Subject grade level '{subject.grade_level}' does not match student grade '{student.grade_level_to_enroll}'",
        )

    # Check capacity
    enrolled_count = db.query(func.count(StudentSubject.id)).filter(
        StudentSubject.subject_id == subject.id
    ).scalar() or 0
    if enrolled_count >= subject.max_students:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Subject '{subject.subject_code}' is at full capacity ({subject.max_students})",
        )

    # Check duplicate enrollment
    existing = (
        db.query(StudentSubject)
        .filter(StudentSubject.student_id == data.student_id, StudentSubject.subject_id == data.subject_id)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student is already enrolled in this subject",
        )

    enrollment = StudentSubject(student_id=data.student_id, subject_id=data.subject_id)
    db.add(enrollment)

    # Notify student
    create_notification(
        db, student.user_id,
        "Subject Assigned",
        f"You have been assigned to {subject.subject_code} — {subject.subject_name}.",
        NotificationType.SUBJECTS_ASSIGNED,
    )

    db.commit()
    return MessageResponse(message=f"Student assigned to {subject.subject_code}")


@router.delete("/unassign-subject", response_model=MessageResponse)
def unassign_subject(
    data: UnassignSubject,
    _registrar: User = Depends(require_role(UserRole.REGISTRAR)),
    db: Session = Depends(get_db),
):
    """Remove a student from a subject."""
    enrollment = (
        db.query(StudentSubject)
        .filter(StudentSubject.student_id == data.student_id, StudentSubject.subject_id == data.subject_id)
        .first()
    )
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enrollment not found",
        )

    db.delete(enrollment)
    db.commit()
    return MessageResponse(message="Student removed from subject")


@router.get("/students/{student_id}/enrolled-subjects")
def get_student_enrolled_subjects(
    student_id: int,
    _registrar: User = Depends(require_role(UserRole.REGISTRAR)),
    db: Session = Depends(get_db),
):
    """Get the list of subject IDs a student is currently enrolled in."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    enrollments = db.query(StudentSubject).filter(StudentSubject.student_id == student_id).all()
    return {"subject_ids": [e.subject_id for e in enrollments]}


@router.post("/bulk-assign-subjects", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def bulk_assign_subjects(
    data: BulkAssignSubjects,
    _registrar: User = Depends(require_role(UserRole.REGISTRAR)),
    db: Session = Depends(get_db),
):
    """Assign multiple subjects to a student at once."""
    student = db.query(Student).filter(Student.id == data.student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    if student.status != StudentStatus.APPROVED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only approved students can be assigned subjects")
    if student.payment_status != "verified":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Student's payment must be verified before assigning subjects")

    assigned_count = 0
    for subject_id in data.subject_ids:
        subject = db.query(Subject).filter(Subject.id == subject_id).first()
        if not subject:
            continue

        # Skip if already enrolled
        existing = db.query(StudentSubject).filter(
            StudentSubject.student_id == data.student_id,
            StudentSubject.subject_id == subject_id,
        ).first()
        if existing:
            continue

        # Check capacity
        enrolled_count = db.query(func.count(StudentSubject.id)).filter(
            StudentSubject.subject_id == subject_id
        ).scalar() or 0
        if enrolled_count >= subject.max_students:
            continue

        enrollment = StudentSubject(student_id=data.student_id, subject_id=subject_id)
        db.add(enrollment)
        assigned_count += 1

    if assigned_count > 0:
        # Notify student once for all subjects
        create_notification(
            db, student.user_id,
            "Subjects Assigned",
            f"You have been assigned {assigned_count} subject(s). Check your dashboard for details.",
            NotificationType.SUBJECTS_ASSIGNED,
        )

    db.commit()
    return MessageResponse(message=f"{assigned_count} subject(s) assigned successfully")


@router.get("/subjects/{subject_id}/students", response_model=list[StudentResponse])
def list_subject_students(
    subject_id: int,
    _registrar: User = Depends(require_role(UserRole.REGISTRAR)),
    db: Session = Depends(get_db),
):
    """List all students enrolled in a specific subject."""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    enrollments = db.query(StudentSubject).filter(StudentSubject.subject_id == subject_id).all()
    students = [e.student for e in enrollments]
    return [_student_to_response(s) for s in students]
