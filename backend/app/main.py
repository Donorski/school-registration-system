"""FastAPI application entry point."""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.routers import auth, student, admin, registrar, utils, notification

# Rate limiter instance (shared across routers)
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="School Registration System API",
    description="Backend API for student registration, enrollment, and management.",
    version="1.0.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

# Serve uploaded files statically
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Register routers
app.include_router(auth.router)
app.include_router(student.router)
app.include_router(admin.router)
app.include_router(registrar.router)
app.include_router(utils.router)
app.include_router(notification.router)


@app.get("/", tags=["Root"])
def root():
    return {"message": "School Registration System API", "docs": "/docs"}
