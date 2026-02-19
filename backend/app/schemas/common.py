"""Common/shared schemas for API responses."""

from pydantic import BaseModel


class MessageResponse(BaseModel):
    message: str


class DashboardStats(BaseModel):
    total_students: int
    pending_students: int
    approved_students: int
    denied_students: int
    by_grade_level: dict[str, int]
    by_strand: dict[str, int]
    by_sex: dict[str, int]
    by_enrollment_type: dict[str, int]
