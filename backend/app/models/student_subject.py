"""Many-to-many relationship between students and subjects."""

from datetime import datetime, timezone

from sqlalchemy import ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class StudentSubject(Base):
    __tablename__ = "student_subjects"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"))
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id", ondelete="CASCADE"))
    enrolled_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    student: Mapped["Student"] = relationship("Student", back_populates="subjects")
    subject: Mapped["Subject"] = relationship("Subject", back_populates="enrollments")

    __table_args__ = (
        UniqueConstraint("student_id", "subject_id", name="uq_student_subject"),
    )
