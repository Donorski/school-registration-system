"""AcademicCalendar model — stores the current school year, semester, and enrollment window."""

from datetime import date, datetime, timezone

from sqlalchemy import Boolean, Date, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AcademicCalendar(Base):
    __tablename__ = "academic_calendar"

    id: Mapped[int] = mapped_column(primary_key=True)
    school_year: Mapped[str] = mapped_column(String(20))        # e.g. "2025-2026"
    semester: Mapped[str] = mapped_column(String(10))           # "1st" | "2nd"
    enrollment_start: Mapped[date | None] = mapped_column(Date, nullable=True)
    enrollment_end: Mapped[date | None] = mapped_column(Date, nullable=True)
    is_open: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
