"""File upload handling with validation for photos and documents."""

import os
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.config import settings

ALLOWED_PHOTO_TYPES = {"image/jpeg", "image/png"}
ALLOWED_DOCUMENT_TYPES = {"image/jpeg", "image/png", "application/pdf"}


def _validate_file(file: UploadFile, allowed_types: set[str]) -> None:
    """Validate file type and size."""
    if file.content_type not in allowed_types:
        allowed = ", ".join(allowed_types)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '{file.content_type}' not allowed. Allowed: {allowed}",
        )


async def _read_and_check_size(file: UploadFile) -> bytes:
    """Read file contents and enforce max size."""
    contents = await file.read()
    if len(contents) > settings.MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds {settings.MAX_FILE_SIZE_MB}MB limit",
        )
    return contents


def _save_file(contents: bytes, folder: str, original_filename: str) -> str:
    """Save file to disk and return the relative path."""
    ext = Path(original_filename).suffix.lower()
    unique_name = f"{uuid.uuid4().hex}{ext}"
    dir_path = os.path.join(settings.UPLOAD_DIR, folder)
    os.makedirs(dir_path, exist_ok=True)
    file_path = os.path.join(dir_path, unique_name)
    with open(file_path, "wb") as f:
        f.write(contents)
    # Return path with forward slashes for consistency
    return f"{folder}/{unique_name}"


async def save_photo(file: UploadFile) -> str:
    """Validate and save a student photo. Returns the relative file path."""
    _validate_file(file, ALLOWED_PHOTO_TYPES)
    contents = await _read_and_check_size(file)
    return _save_file(contents, "photos", file.filename or "photo.jpg")


async def save_document(file: UploadFile) -> str:
    """Validate and save a student document. Returns the relative file path."""
    _validate_file(file, ALLOWED_DOCUMENT_TYPES)
    contents = await _read_and_check_size(file)
    return _save_file(contents, "documents", file.filename or "document.pdf")


async def save_receipt(file: UploadFile) -> str:
    """Validate and save a payment receipt image. Returns the relative file path."""
    _validate_file(file, ALLOWED_PHOTO_TYPES)
    contents = await _read_and_check_size(file)
    return _save_file(contents, "receipts", file.filename or "receipt.jpg")


async def save_grades(file: UploadFile) -> str:
    """Validate and save a grades document. Returns the relative file path."""
    _validate_file(file, ALLOWED_DOCUMENT_TYPES)
    contents = await _read_and_check_size(file)
    return _save_file(contents, "grades", file.filename or "grades.pdf")


async def save_voucher(file: UploadFile) -> str:
    """Validate and save a voucher photo. Returns the relative file path."""
    _validate_file(file, ALLOWED_DOCUMENT_TYPES)
    contents = await _read_and_check_size(file)
    return _save_file(contents, "vouchers", file.filename or "voucher.jpg")


async def save_psa_birth_cert(file: UploadFile) -> str:
    """Validate and save a PSA birth certificate. Returns the relative file path."""
    _validate_file(file, ALLOWED_DOCUMENT_TYPES)
    contents = await _read_and_check_size(file)
    return _save_file(contents, "psa_birth_certs", file.filename or "psa_birth_cert.pdf")


async def save_transfer_credential(file: UploadFile) -> str:
    """Validate and save a transfer credential / Form 137. Returns the relative file path."""
    _validate_file(file, ALLOWED_DOCUMENT_TYPES)
    contents = await _read_and_check_size(file)
    return _save_file(contents, "transfer_credentials", file.filename or "transfer_credential.pdf")


async def save_good_moral(file: UploadFile) -> str:
    """Validate and save a good moral certificate. Returns the relative file path."""
    _validate_file(file, ALLOWED_DOCUMENT_TYPES)
    contents = await _read_and_check_size(file)
    return _save_file(contents, "good_moral_certs", file.filename or "good_moral.pdf")
