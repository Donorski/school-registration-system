"""Helper to create notifications atomically within a caller's transaction."""

from sqlalchemy.orm import Session

from app.models.notification import Notification, NotificationType


def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    notification_type: NotificationType,
) -> Notification:
    """Create a notification and flush (but don't commit) so it shares the caller's transaction."""
    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=notification_type,
    )
    db.add(notif)
    db.flush()
    return notif
