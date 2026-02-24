"""Pydantic schemas for subjects and enrollment."""

from datetime import datetime
from pydantic import BaseModel, field_validator


class SubjectCreate(BaseModel):
    subject_code: str
    subject_name: str
    units: int = 0
    schedule: str
    strand: str
    grade_level: str
    semester: str = "1st Semester"
    max_students: int = 40

    @field_validator("max_students")
    @classmethod
    def validate_max_students(cls, v: int) -> int:
        if v < 1:
            raise ValueError("Max students must be at least 1")
        return v


class SubjectUpdate(BaseModel):
    subject_code: str | None = None
    subject_name: str | None = None
    units: int | None = None
    schedule: str | None = None
    strand: str | None = None
    grade_level: str | None = None
    semester: str | None = None
    max_students: int | None = None


class SubjectResponse(BaseModel):
    id: int
    subject_code: str
    subject_name: str
    units: int
    schedule: str
    strand: str
    grade_level: str
    semester: str = "1st Semester"
    max_students: int
    enrolled_count: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}


class AssignSubject(BaseModel):
    student_id: int
    subject_id: int


class UnassignSubject(BaseModel):
    student_id: int
    subject_id: int


class BulkAssignSubjects(BaseModel):
    student_id: int
    subject_ids: list[int]


class EnrolledSubjectResponse(BaseModel):
    id: int
    subject_code: str
    subject_name: str
    units: int
    schedule: str
    strand: str
    grade_level: str
    semester: str = "1st Semester"
    enrolled_at: datetime

    model_config = {"from_attributes": True}
