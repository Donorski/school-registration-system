"""Student model containing all registration form fields."""

import enum
from datetime import date, datetime, timezone

from sqlalchemy import (
    String, Integer, Boolean, Date, DateTime, Enum, Text, ForeignKey, JSON,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class StudentStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    DENIED = "denied"


class EnrollmentType(str, enum.Enum):
    NEW_ENROLLEE = "NEW_ENROLLEE"
    TRANSFEREE = "TRANSFEREE"
    RE_ENROLLEE = "RE_ENROLLEE"


class SchoolType(str, enum.Enum):
    PUBLIC = "PUBLIC"
    PRIVATE = "PRIVATE"


class Sex(str, enum.Enum):
    MALE = "Male"
    FEMALE = "Female"


class Student(Base):
    __tablename__ = "students"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    student_number: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True, index=True)
    status: Mapped[StudentStatus] = mapped_column(
        Enum(StudentStatus), default=StudentStatus.PENDING, nullable=False
    )

    # A. Grade Level and School Information
    school_year: Mapped[str | None] = mapped_column(String(20))
    semester: Mapped[str | None] = mapped_column(String(20))
    lrn: Mapped[str | None] = mapped_column(String(20))
    is_returning_student: Mapped[bool | None] = mapped_column(Boolean)
    grade_level_to_enroll: Mapped[str | None] = mapped_column(String(20))
    last_grade_level_completed: Mapped[str | None] = mapped_column(String(20))
    last_school_year_completed: Mapped[str | None] = mapped_column(String(20))
    last_school_attended: Mapped[str | None] = mapped_column(String(255))
    school_type: Mapped[SchoolType | None] = mapped_column(Enum(SchoolType))
    strand: Mapped[str | None] = mapped_column(String(50))
    school_to_enroll_in: Mapped[str | None] = mapped_column(String(255))
    school_address: Mapped[str | None] = mapped_column(String(500))

    # B. Student Information
    psa_birth_certificate_no: Mapped[str | None] = mapped_column(String(50))
    lrn_learner_ref_no: Mapped[str | None] = mapped_column(String(20))
    student_photo_path: Mapped[str | None] = mapped_column(String(500))
    last_name: Mapped[str | None] = mapped_column(String(100))
    first_name: Mapped[str | None] = mapped_column(String(100))
    middle_name: Mapped[str | None] = mapped_column(String(100))
    suffix: Mapped[str | None] = mapped_column(String(20))
    birthday: Mapped[date | None] = mapped_column(Date)
    age: Mapped[int | None] = mapped_column(Integer)
    sex: Mapped[Sex | None] = mapped_column(Enum(Sex))
    mother_tongue: Mapped[str | None] = mapped_column(String(50))
    religion: Mapped[str | None] = mapped_column(String(50))

    # C. Student Address
    province: Mapped[str | None] = mapped_column(String(100))
    city_municipality: Mapped[str | None] = mapped_column(String(100))
    barangay: Mapped[str | None] = mapped_column(String(100))
    house_no_street: Mapped[str | None] = mapped_column(String(255))
    region: Mapped[str | None] = mapped_column(String(100))

    # D. Parent/Guardian Information
    father_full_name: Mapped[str | None] = mapped_column(String(200))
    father_contact: Mapped[str | None] = mapped_column(String(20))
    mother_full_name: Mapped[str | None] = mapped_column(String(200))
    mother_contact: Mapped[str | None] = mapped_column(String(20))
    guardian_full_name: Mapped[str | None] = mapped_column(String(200))
    guardian_contact: Mapped[str | None] = mapped_column(String(20))

    # Enrollment Info (filled by admin on approval)
    enrollment_type: Mapped[EnrollmentType | None] = mapped_column(Enum(EnrollmentType))
    enrollment_date: Mapped[date | None] = mapped_column(Date)
    place_of_birth: Mapped[str | None] = mapped_column(String(255))
    nationality: Mapped[str | None] = mapped_column(String(100))
    civil_status: Mapped[str | None] = mapped_column(String(50))

    # E. Required Documents
    documents_path: Mapped[list | None] = mapped_column(JSON, default=list)
    grades_path: Mapped[str | None] = mapped_column(String(500))
    voucher_path: Mapped[str | None] = mapped_column(String(500))
    psa_birth_cert_path: Mapped[str | None] = mapped_column(String(500))
    transfer_credential_path: Mapped[str | None] = mapped_column(String(500))
    good_moral_path: Mapped[str | None] = mapped_column(String(500))

    # Payment
    payment_receipt_path: Mapped[str | None] = mapped_column(String(500))
    payment_status: Mapped[str] = mapped_column(String(30), default="unpaid", server_default="unpaid")
    payment_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="student")
    subjects: Mapped[list["StudentSubject"]] = relationship(
        "StudentSubject", back_populates="student", cascade="all, delete-orphan"
    )
