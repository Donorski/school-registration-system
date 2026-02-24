"""Student endpoints — profile management, file uploads, subject enrollment."""

from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.dependencies import require_role
from app.models.user import User, UserRole
from app.models.student import Student, StudentStatus
from app.schemas.student import StudentUpdate, StudentResponse, StudentStatusResponse, EnrollmentRecordResponse
from app.models.enrollment_record import EnrollmentRecord
from app.schemas.subject import EnrolledSubjectResponse
from app.utils.file_upload import save_photo, save_document, save_receipt, save_grades, save_voucher, save_psa_birth_cert, save_transfer_credential, save_good_moral
from app.models.notification import NotificationType
from app.utils.notifications import create_notification
from app.utils.audit_log import create_audit_log

router = APIRouter(prefix="/api/students", tags=["Student"])


def _get_student_or_404(user: User, db: Session) -> Student:
    student = db.query(Student).filter(Student.user_id == user.id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found")
    return student


def _calculate_age(birthday: date) -> int:
    today = date.today()
    return today.year - birthday.year - ((today.month, today.day) < (birthday.month, birthday.day))


def _should_archive(student: Student) -> bool:
    """Return True if the student has a completed enrollment that needs archiving."""
    return student.payment_status == "verified" and len(student.subjects) > 0


def _archive_enrollment(student: Student, db: Session) -> None:
    """Snapshot the current enrollment into enrollment_records then reset live state."""
    snapshot = [
        {
            "subject_code": e.subject.subject_code,
            "subject_name": e.subject.subject_name,
            "schedule": e.subject.schedule,
        }
        for e in student.subjects
        if e.subject
    ]

    record = EnrollmentRecord(
        student_id=student.id,
        school_year=student.school_year,
        semester=student.semester,
        grade_level=student.grade_level_to_enroll,
        strand=student.strand,
        enrollment_type=student.enrollment_type.value if student.enrollment_type else None,
        student_number=student.student_number,
        subjects_snapshot=snapshot,
    )
    db.add(record)

    # Reset live enrollment state for the new cycle
    student.payment_status = "unpaid"
    student.payment_receipt_path = None
    student.payment_verified_at = None
    student.payment_rejection_reason = None
    student.status = StudentStatus.PENDING
    student.denial_reason = None

    # Clear enrolled subjects
    for enrollment in list(student.subjects):
        db.delete(enrollment)


def _student_to_response(student: Student, email: str) -> StudentResponse:
    data = {c.name: getattr(student, c.name) for c in student.__table__.columns}
    data["email"] = email
    # Ensure documents_path is a list
    if data.get("documents_path") is None:
        data["documents_path"] = []
    return StudentResponse(**data)


@router.get("/lookup/{student_number}", response_model=StudentResponse)
def lookup_student(
    student_number: str,
    current_user: User = Depends(require_role(UserRole.STUDENT)),
    db: Session = Depends(get_db),
):
    """Look up a student by student number for re-enrollment.

    Only returns data if the student number belongs to the logged-in user's
    email (i.e. a previous record with the same email). This prevents
    students from looking up other students' data.
    """
    student = db.query(Student).filter(Student.student_number == student_number).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found with that student number")

    # Verify the student record belongs to the same person (match by email)
    if student.user and student.user.email != current_user.email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This student number does not belong to your account",
        )

    return _student_to_response(student, current_user.email)


@router.get("/me", response_model=StudentResponse)
def get_my_profile(
    current_user: User = Depends(require_role(UserRole.STUDENT)),
    db: Session = Depends(get_db),
):
    """Get the current student's complete profile."""
    student = _get_student_or_404(current_user, db)
    return _student_to_response(student, current_user.email)


@router.put("/me", response_model=StudentResponse)
def update_my_profile(
    data: StudentUpdate,
    current_user: User = Depends(require_role(UserRole.STUDENT)),
    db: Session = Depends(get_db),
):
    """Update the current student's profile with form data."""
    student = _get_student_or_404(current_user, db)

    update_data = data.model_dump(exclude_unset=True)

    # Archive previous enrollment if the student has a completed cycle
    if _should_archive(student):
        archive_label = student.student_number or f"{student.first_name or ''} {student.last_name or ''}".strip() or f"ID {student.id}"
        _archive_enrollment(student, db)
        create_audit_log(db, current_user, "ENROLLMENT_ARCHIVED", target_name=archive_label)

    # Detect first meaningful submission (first_name being set for the first time)
    is_first_submission = not student.first_name and bool(update_data.get("first_name"))

    # Auto-calculate age from birthday
    if "birthday" in update_data and update_data["birthday"] is not None:
        update_data["age"] = _calculate_age(update_data["birthday"])

    for field, value in update_data.items():
        setattr(student, field, value)

    student.updated_at = datetime.now(timezone.utc)

    # Notify all admins on first form submission
    if is_first_submission:
        admins = db.query(User).filter(User.role == UserRole.ADMIN, User.is_active == True).all()
        first = update_data.get("first_name", "")
        last = update_data.get("last_name", "")
        for admin in admins:
            create_notification(
                db, admin.id,
                "New Form Submitted",
                f"A new student registration form has been submitted by {first} {last}.",
                NotificationType.NEW_FORM_SUBMITTED,
            )
        submit_label = f"{first} {last}".strip() or current_user.email
        create_audit_log(db, current_user, "APPLICATION_SUBMITTED", target_name=submit_label)

    db.commit()
    db.refresh(student)
    return _student_to_response(student, current_user.email)


@router.post("/me/photo", response_model=StudentResponse)
async def upload_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(UserRole.STUDENT)),
    db: Session = Depends(get_db),
):
    """Upload a student photo (jpg/png, max 5MB)."""
    student = _get_student_or_404(current_user, db)
    path = await save_photo(file)
    student.student_photo_path = path
    student.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(student)
    return _student_to_response(student, current_user.email)


@router.post("/me/documents", response_model=StudentResponse)
async def upload_documents(
    files: list[UploadFile] = File(...),
    current_user: User = Depends(require_role(UserRole.STUDENT)),
    db: Session = Depends(get_db),
):
    """Upload required documents (pdf/jpg/png, max 5MB each). Appends to existing documents."""
    student = _get_student_or_404(current_user, db)

    existing = student.documents_path or []
    for file in files:
        path = await save_document(file)
        existing.append(path)

    student.documents_path = existing
    student.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(student)
    return _student_to_response(student, current_user.email)


@router.post("/me/grades", response_model=StudentResponse)
async def upload_grades(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(UserRole.STUDENT)),
    db: Session = Depends(get_db),
):
    """Upload grades from last school (pdf/jpg/png, max 5MB)."""
    student = _get_student_or_404(current_user, db)
    path = await save_grades(file)
    student.grades_path = path
    student.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(student)
    return _student_to_response(student, current_user.email)


@router.post("/me/voucher", response_model=StudentResponse)
async def upload_voucher(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(UserRole.STUDENT)),
    db: Session = Depends(get_db),
):
    """Upload voucher photo (pdf/jpg/png, max 5MB)."""
    student = _get_student_or_404(current_user, db)
    path = await save_voucher(file)
    student.voucher_path = path
    student.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(student)
    return _student_to_response(student, current_user.email)


@router.post("/me/psa-birth-cert", response_model=StudentResponse)
async def upload_psa_birth_cert(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(UserRole.STUDENT)),
    db: Session = Depends(get_db),
):
    """Upload PSA birth certificate soft copy (pdf/jpg/png, max 5MB)."""
    student = _get_student_or_404(current_user, db)
    path = await save_psa_birth_cert(file)
    student.psa_birth_cert_path = path
    student.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(student)
    return _student_to_response(student, current_user.email)


@router.post("/me/transfer-credential", response_model=StudentResponse)
async def upload_transfer_credential(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(UserRole.STUDENT)),
    db: Session = Depends(get_db),
):
    """Upload transfer credential / Form 137 (pdf/jpg/png, max 5MB)."""
    student = _get_student_or_404(current_user, db)
    path = await save_transfer_credential(file)
    student.transfer_credential_path = path
    student.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(student)
    return _student_to_response(student, current_user.email)


@router.post("/me/good-moral", response_model=StudentResponse)
async def upload_good_moral(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(UserRole.STUDENT)),
    db: Session = Depends(get_db),
):
    """Upload good moral certificate (pdf/jpg/png, max 5MB)."""
    student = _get_student_or_404(current_user, db)
    path = await save_good_moral(file)
    student.good_moral_path = path
    student.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(student)
    return _student_to_response(student, current_user.email)


@router.post("/me/payment-receipt", response_model=StudentResponse)
async def upload_payment_receipt(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(UserRole.STUDENT)),
    db: Session = Depends(get_db),
):
    """Upload a payment receipt photo (jpg/png, max 5MB). Only approved students can upload."""
    student = _get_student_or_404(current_user, db)
    if student.status != StudentStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only approved students can upload payment receipts",
        )
    path = await save_receipt(file)
    student.payment_receipt_path = path
    student.payment_status = "pending_verification"
    student.updated_at = datetime.now(timezone.utc)

    # Notify all registrars
    registrars = db.query(User).filter(User.role == UserRole.REGISTRAR, User.is_active == True).all()
    for reg in registrars:
        create_notification(
            db, reg.id,
            "New Payment Receipt",
            f"Student {student.first_name or ''} {student.last_name or ''} ({student.student_number}) uploaded a payment receipt.",
            NotificationType.NEW_RECEIPT_UPLOADED,
        )

    receipt_label = f"{student.first_name or ''} {student.last_name or ''}".strip() or current_user.email
    if student.student_number:
        receipt_label = f"{receipt_label} ({student.student_number})"
    create_audit_log(db, current_user, "RECEIPT_UPLOADED", target_name=receipt_label)
    db.commit()
    db.refresh(student)
    return _student_to_response(student, current_user.email)


@router.get("/me/subjects", response_model=list[EnrolledSubjectResponse])
def get_my_subjects(
    current_user: User = Depends(require_role(UserRole.STUDENT)),
    db: Session = Depends(get_db),
):
    """Get subjects the current student is enrolled in."""
    student = _get_student_or_404(current_user, db)
    results = []
    for enrollment in student.subjects:
        subj = enrollment.subject
        results.append(
            EnrolledSubjectResponse(
                id=subj.id,
                subject_code=subj.subject_code,
                subject_name=subj.subject_name,
                units=subj.units,
                schedule=subj.schedule,
                strand=subj.strand,
                grade_level=subj.grade_level,
                enrolled_at=enrollment.enrolled_at,
            )
        )
    return results


@router.get("/me/enrollment-history", response_model=list[EnrollmentRecordResponse])
def get_my_enrollment_history(
    current_user: User = Depends(require_role(UserRole.STUDENT)),
    db: Session = Depends(get_db),
):
    """Get the current student's archived enrollment history, newest first."""
    student = _get_student_or_404(current_user, db)
    return student.enrollment_records


@router.get("/me/status", response_model=StudentStatusResponse)
def get_my_status(
    current_user: User = Depends(require_role(UserRole.STUDENT)),
    db: Session = Depends(get_db),
):
    """Check current application status (pending/approved/denied)."""
    student = _get_student_or_404(current_user, db)
    return StudentStatusResponse(
        student_number=student.student_number,
        status=student.status.value,
        first_name=student.first_name,
        last_name=student.last_name,
        payment_status=student.payment_status,
    )
