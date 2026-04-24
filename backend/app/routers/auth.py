"""Authentication endpoints: register, login, current user."""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address
from pydantic import BaseModel
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import requests as http_requests

from app.database import get_db
from app.auth.jwt_handler import hash_password, verify_password, create_access_token
from app.auth.dependencies import get_current_user
from app.models.user import User, UserRole
from app.models.student import Student, StudentStatus
from app.schemas.user import UserRegister, UserLogin, TokenResponse, UserResponse
from app.config import settings


def verify_turnstile(token: str) -> bool:
    """Verify a Cloudflare Turnstile token. Returns True if valid."""
    if not settings.TURNSTILE_SECRET_KEY:
        return True  # Skip verification if not configured
    try:
        resp = http_requests.post(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            data={"secret": settings.TURNSTILE_SECRET_KEY, "response": token},
            timeout=5,
        )
        return resp.json().get("success", False)
    except Exception:
        return False

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
limiter = Limiter(key_func=get_remote_address)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def register(request: Request, data: UserRegister, db: Session = Depends(get_db)):
    """Register a new student account. Creates user + pending student record."""
    if not verify_turnstile(data.captcha_token):
        raise HTTPException(status_code=400, detail="Captcha verification failed. Please try again.")
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        role=UserRole.STUDENT,
    )
    db.add(user)
    db.flush()  # Get user.id before creating student

    student = Student(
        user_id=user.id,
        status=StudentStatus.PENDING,
    )
    db.add(student)
    db.commit()

    token = create_access_token({"user_id": user.id, "role": user.role.value})
    return TokenResponse(access_token=token, role=user.role.value)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
def login(request: Request, data: UserLogin, db: Session = Depends(get_db)):
    """Login for all user roles. Returns a JWT access token."""
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not user.password_hash or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    if user.role in (UserRole.ADMIN, UserRole.REGISTRAR):
        if user.active_token and not data.force:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="active_session",
            )

    token = create_access_token({"user_id": user.id, "role": user.role.value})
    if user.role in (UserRole.ADMIN, UserRole.REGISTRAR):
        user.active_token = token
        db.commit()
    return TokenResponse(access_token=token, role=user.role.value)


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Invalidate the current session token."""
    if current_user.role in (UserRole.ADMIN, UserRole.REGISTRAR):
        current_user.active_token = None
        db.commit()
    return {"detail": "Logged out successfully"}


class GoogleAuthRequest(BaseModel):
    credential: str  # Google ID token


@router.post("/google", response_model=TokenResponse)
def google_auth(data: GoogleAuthRequest, db: Session = Depends(get_db)):
    """Sign in or register via Google OAuth. Creates student account if new user."""
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google OAuth is not configured")

    try:
        id_info = id_token.verify_oauth2_token(
            data.credential,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
        )
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    google_id = id_info["sub"]
    email = id_info.get("email", "")

    # Find by google_id first, then fall back to email
    user = db.query(User).filter(User.google_id == google_id).first()
    if not user and email:
        user = db.query(User).filter(User.email == email).first()
        if user:
            # Link existing account to Google
            user.google_id = google_id

    if not user:
        # New user — create account + student record
        user = User(
            email=email,
            password_hash=None,
            google_id=google_id,
            role=UserRole.STUDENT,
        )
        db.add(user)
        db.flush()
        student = Student(user_id=user.id, status=StudentStatus.PENDING)
        db.add(student)

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    db.commit()
    token = create_access_token({"user_id": user.id, "role": user.role.value})
    return TokenResponse(access_token=token, role=user.role.value)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get the current authenticated user's info with display name."""
    display_name = None

    if current_user.role == UserRole.STUDENT:
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        if student and student.first_name:
            parts = [student.first_name, student.last_name]
            display_name = " ".join(p for p in parts if p)
    else:
        # For admin/registrar, use email username
        display_name = current_user.email.split("@")[0].replace(".", " ").title()

    response = UserResponse.model_validate(current_user)
    response.display_name = display_name
    return response
