"""Utility for creating audit log entries."""

from app.models.audit_log import AuditLog


def create_audit_log(db, user, action: str, target_name: str | None = None, details: str | None = None) -> None:
    """Create an audit log entry within the caller's transaction (uses flush, not commit)."""
    log = AuditLog(
        user_id=user.id,
        user_email=user.email,
        user_role=user.role.value,
        action=action,
        target_name=target_name,
        details=details,
    )
    db.add(log)
    db.flush()
