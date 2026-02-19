"""Subject model for course/subject management."""

from datetime import datetime, timezone

from sqlalchemy import String, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Subject(Base):
    __tablename__ = "subjects"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    subject_code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    subject_name: Mapped[str] = mapped_column(String(200), nullable=False)
    units: Mapped[int] = mapped_column(Integer, nullable=False)
    schedule: Mapped[str] = mapped_column(String(100), nullable=False)
    strand: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    grade_level: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    semester: Mapped[str] = mapped_column(String(20), nullable=False, index=True, default="1st Semester")
    max_students: Mapped[int] = mapped_column(Integer, default=40, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    enrollments: Mapped[list["StudentSubject"]] = relationship(
        "StudentSubject", back_populates="subject", cascade="all, delete-orphan"
    )
