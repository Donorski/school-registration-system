"""SchoolSettings model — singleton row (id=1) for school name and logo."""

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class SchoolSettings(Base):
    __tablename__ = "school_settings"

    id: Mapped[int] = mapped_column(primary_key=True, default=1)
    school_name: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    school_logo_url: Mapped[str | None] = mapped_column(Text, nullable=True)
