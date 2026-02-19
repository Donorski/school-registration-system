"""Pydantic schemas for student registration form data."""

import re
from datetime import date, datetime
from pydantic import BaseModel, Field, field_validator, model_validator


class StudentUpdate(BaseModel):
    """Schema for updating student profile — all registration form fields."""

    # Enrollment Type (selected by student)
    enrollment_type: str | None = None

    # A. Grade Level and School Information
    school_year: str | None = Field(None, max_length=20)
    semester: str | None = Field(None, max_length=20)
    lrn: str | None = Field(None, max_length=20)
    is_returning_student: bool | None = None
    grade_level_to_enroll: str | None = Field(None, max_length=20)
    last_grade_level_completed: str | None = Field(None, max_length=20)
    last_school_year_completed: str | None = Field(None, max_length=20)
    last_school_attended: str | None = Field(None, max_length=255)
    school_type: str | None = None
    strand: str | None = Field(None, max_length=50)
    school_to_enroll_in: str | None = Field(None, max_length=255)
    school_address: str | None = Field(None, max_length=500)

    # B. Student Information
    psa_birth_certificate_no: str | None = Field(None, max_length=50)
    lrn_learner_ref_no: str | None = Field(None, max_length=20)
    last_name: str | None = Field(None, max_length=100)
    first_name: str | None = Field(None, max_length=100)
    middle_name: str | None = Field(None, max_length=100)
    suffix: str | None = Field(None, max_length=20)
    birthday: date | None = None
    sex: str | None = None
    mother_tongue: str | None = Field(None, max_length=50)
    religion: str | None = Field(None, max_length=50)

    # C. Student Address
    province: str | None = Field(None, max_length=100)
    city_municipality: str | None = Field(None, max_length=100)
    barangay: str | None = Field(None, max_length=100)
    house_no_street: str | None = Field(None, max_length=255)
    region: str | None = Field(None, max_length=100)

    # D. Parent/Guardian Information
    father_full_name: str | None = Field(None, max_length=200)
    father_contact: str | None = Field(None, max_length=20)
    mother_full_name: str | None = Field(None, max_length=200)
    mother_contact: str | None = Field(None, max_length=20)
    guardian_full_name: str | None = Field(None, max_length=200)
    guardian_contact: str | None = Field(None, max_length=20)

    # Enrollment Info (filled by admin on approval)
    enrollment_date: date | None = None
    place_of_birth: str | None = Field(None, max_length=255)
    nationality: str | None = Field(None, max_length=100)
    civil_status: str | None = Field(None, max_length=50)

    @field_validator("enrollment_type")
    @classmethod
    def validate_enrollment_type(cls, v: str | None) -> str | None:
        if v is not None and v not in ("NEW_ENROLLEE", "TRANSFEREE", "RE_ENROLLEE"):
            raise ValueError("enrollment_type must be NEW_ENROLLEE, TRANSFEREE, or RE_ENROLLEE")
        return v

    @field_validator("school_type")
    @classmethod
    def validate_school_type(cls, v: str | None) -> str | None:
        if v is not None and v not in ("PUBLIC", "PRIVATE"):
            raise ValueError("school_type must be PUBLIC or PRIVATE")
        return v

    @field_validator("sex")
    @classmethod
    def validate_sex(cls, v: str | None) -> str | None:
        if v is not None and v not in ("Male", "Female"):
            raise ValueError("sex must be Male or Female")
        return v

    @field_validator("father_contact", "mother_contact", "guardian_contact")
    @classmethod
    def validate_contact_number(cls, v: str | None) -> str | None:
        if v is not None and v != "":
            cleaned = re.sub(r"[\s\-()]", "", v)
            if not re.match(r"^\+?\d{7,15}$", cleaned):
                raise ValueError("Contact number must be 7-15 digits (may start with +)")
        return v

    @field_validator("first_name", "last_name", "middle_name")
    @classmethod
    def validate_name_no_special(cls, v: str | None) -> str | None:
        if v is not None and v != "":
            if re.search(r"[<>{}\\\";\x00-\x1f]", v):
                raise ValueError("Name contains invalid characters")
        return v

    @model_validator(mode="after")
    def validate_guardian_contact(self):
        """At least one parent/guardian contact is required when contacts are provided."""
        contacts = [self.father_contact, self.mother_contact, self.guardian_contact]
        names = [self.father_full_name, self.mother_full_name, self.guardian_full_name]
        # Only enforce if any parent/guardian name is provided
        has_any_name = any(n for n in names)
        has_any_contact = any(c for c in contacts)
        if has_any_name and not has_any_contact:
            raise ValueError("At least one parent/guardian contact number is required")
        return self


class EnrollmentApproval(BaseModel):
    """Schema for admin enrollment approval form data."""
    enrollment_date: date | None = None
    place_of_birth: str | None = Field(None, max_length=255)
    nationality: str | None = Field(None, max_length=100)
    civil_status: str | None = Field(None, max_length=50)


class StudentResponse(BaseModel):
    """Full student profile response."""

    id: int
    user_id: int
    student_number: str | None = None
    status: str
    enrollment_type: str | None = None

    # A. Grade Level and School Information
    school_year: str | None = None
    semester: str | None = None
    lrn: str | None = None
    is_returning_student: bool | None = None
    grade_level_to_enroll: str | None = None
    last_grade_level_completed: str | None = None
    last_school_year_completed: str | None = None
    last_school_attended: str | None = None
    school_type: str | None = None
    strand: str | None = None
    school_to_enroll_in: str | None = None
    school_address: str | None = None

    # B. Student Information
    psa_birth_certificate_no: str | None = None
    lrn_learner_ref_no: str | None = None
    student_photo_path: str | None = None
    last_name: str | None = None
    first_name: str | None = None
    middle_name: str | None = None
    suffix: str | None = None
    birthday: date | None = None
    age: int | None = None
    sex: str | None = None
    mother_tongue: str | None = None
    religion: str | None = None

    # C. Student Address
    province: str | None = None
    city_municipality: str | None = None
    barangay: str | None = None
    house_no_street: str | None = None
    region: str | None = None

    # D. Parent/Guardian Information
    father_full_name: str | None = None
    father_contact: str | None = None
    mother_full_name: str | None = None
    mother_contact: str | None = None
    guardian_full_name: str | None = None
    guardian_contact: str | None = None

    # E. Documents
    documents_path: list[str] | None = None
    grades_path: str | None = None
    voucher_path: str | None = None
    psa_birth_cert_path: str | None = None
    transfer_credential_path: str | None = None
    good_moral_path: str | None = None

    # Payment
    payment_receipt_path: str | None = None
    payment_status: str = "unpaid"
    payment_verified_at: datetime | None = None

    # Enrollment Info
    enrollment_date: date | None = None
    place_of_birth: str | None = None
    nationality: str | None = None
    civil_status: str | None = None

    # Timestamps
    created_at: datetime
    updated_at: datetime

    # User email for display
    email: str | None = None

    model_config = {"from_attributes": True}


class StudentListResponse(BaseModel):
    """Paginated list of students."""

    students: list[StudentResponse]
    total: int
    page: int
    per_page: int


class StudentStatusResponse(BaseModel):
    student_number: str | None = None
    status: str
    first_name: str | None = None
    last_name: str | None = None
    payment_status: str = "unpaid"
