"""FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.routers import auth, student, admin, registrar, utils, notification


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


# Rate limiter instance (shared across routers)
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="School Registration System API",
    description="Backend API for student registration, enrollment, and management.",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
