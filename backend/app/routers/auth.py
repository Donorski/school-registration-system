"""Authentication endpoints: register, login, current user."""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.database import get_db
from app.auth.jwt_handler import hash_password, verify_password, create_access_token
from app.auth.dependencies import get_current_user
from app.models.user import User, UserRole
from app.models.student import Student, StudentStatus
from app.schemas.user import UserRegister, UserLogin, TokenResponse, UserResponse

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
limiter = Limiter(key_func=get_remote_address)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def register(request: Request, data: UserRegister, db: Session = Depends(get_db)):
    """Register a new student account. Creates user + pending student record."""
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
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

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
