"""Notification model for in-app notifications."""

import enum
from datetime import datetime, timezone

from sqlalchemy import String, Text, Boolean, Enum, DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class NotificationType(str, enum.Enum):
    APPLICATION_APPROVED = "application_approved"
    APPLICATION_DENIED = "application_denied"
    PAYMENT_VERIFIED = "payment_verified"
    PAYMENT_REJECTED = "payment_rejected"
    SUBJECTS_ASSIGNED = "subjects_assigned"
    NEW_FORM_SUBMITTED = "new_form_submitted"
    NEW_RECEIPT_UPLOADED = "new_receipt_uploaded"
    STUDENT_APPROVED = "student_approved"


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[NotificationType] = mapped_column(
        Enum(NotificationType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    user = relationship("User", backref="notifications")
