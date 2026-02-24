"""EnrollmentRecord model — snapshot of a completed enrollment cycle."""

from datetime import datetime, timezone

from sqlalchemy import Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class EnrollmentRecord(Base):
    __tablename__ = "enrollment_records"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(
        ForeignKey("students.id", ondelete="CASCADE"), index=True
    )

    # Snapshot of enrollment metadata at time of archiving
    school_year: Mapped[str | None] = mapped_column(String(20))
    semester: Mapped[str | None] = mapped_column(String(20))
    grade_level: Mapped[str | None] = mapped_column(String(20))
    strand: Mapped[str | None] = mapped_column(String(50))
    enrollment_type: Mapped[str | None] = mapped_column(String(30))
    student_number: Mapped[str | None] = mapped_column(String(20))

    # JSON snapshot of subjects: [{subject_code, subject_name, schedule}]
    subjects_snapshot: Mapped[list | None] = mapped_column(JSON, default=list)

    # When this archive was created
    archived_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationship back to student
    student: Mapped["Student"] = relationship("Student", back_populates="enrollment_records")
