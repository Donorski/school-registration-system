"""File upload handling with validation for photos and documents via Cloudinary."""

import io

import cloudinary
import cloudinary.uploader
from fastapi import HTTPException, UploadFile, status

from app.config import settings

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
)

ALLOWED_PHOTO_TYPES = {"image/jpeg", "image/png"}
ALLOWED_DOCUMENT_TYPES = {"image/jpeg", "image/png", "application/pdf"}


def _validate_file(file: UploadFile, allowed_types: set[str]) -> None:
    if file.content_type not in allowed_types:
        allowed = ", ".join(allowed_types)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '{file.content_type}' not allowed. Allowed: {allowed}",
        )


async def _read_and_check_size(file: UploadFile) -> bytes:
    contents = await file.read()
    if len(contents) > settings.MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds {settings.MAX_FILE_SIZE_MB}MB limit",
        )
    return contents


_FORMAT_MAP = {
    "image/jpeg": ("image", "jpg"),
    "image/png": ("image", "png"),
    "application/pdf": ("raw", "pdf"),
}


def _upload_to_cloudinary(contents: bytes, folder: str, content_type: str) -> str:
    resource_type, fmt = _FORMAT_MAP.get(content_type, ("image", "jpg"))
    result = cloudinary.uploader.upload(
        io.BytesIO(contents),
        folder=f"school_registration/{folder}",
        resource_type=resource_type,
        format=fmt,
    )
    return result["secure_url"]


async def save_photo(file: UploadFile) -> str:
    _validate_file(file, ALLOWED_PHOTO_TYPES)
    contents = await _read_and_check_size(file)
    return _upload_to_cloudinary(contents, "photos", file.content_type)


async def save_document(file: UploadFile) -> str:
    _validate_file(file, ALLOWED_DOCUMENT_TYPES)
    contents = await _read_and_check_size(file)
    return _upload_to_cloudinary(contents, "documents", file.content_type)


async def save_receipt(file: UploadFile) -> str:
    _validate_file(file, ALLOWED_PHOTO_TYPES)
    contents = await _read_and_check_size(file)
    return _upload_to_cloudinary(contents, "receipts", file.content_type)


async def save_grades(file: UploadFile) -> str:
    _validate_file(file, ALLOWED_DOCUMENT_TYPES)
    contents = await _read_and_check_size(file)
    return _upload_to_cloudinary(contents, "grades", file.content_type)


async def save_voucher(file: UploadFile) -> str:
    _validate_file(file, ALLOWED_DOCUMENT_TYPES)
    contents = await _read_and_check_size(file)
    return _upload_to_cloudinary(contents, "vouchers", file.content_type)


async def save_psa_birth_cert(file: UploadFile) -> str:
    _validate_file(file, ALLOWED_DOCUMENT_TYPES)
    contents = await _read_and_check_size(file)
    return _upload_to_cloudinary(contents, "psa_birth_certs", file.content_type)


async def save_transfer_credential(file: UploadFile) -> str:
    _validate_file(file, ALLOWED_DOCUMENT_TYPES)
    contents = await _read_and_check_size(file)
    return _upload_to_cloudinary(contents, "transfer_credentials", file.content_type)


async def save_good_moral(file: UploadFile) -> str:
    _validate_file(file, ALLOWED_DOCUMENT_TYPES)
    contents = await _read_and_check_size(file)
    return _upload_to_cloudinary(contents, "good_moral_certs", file.content_type)
