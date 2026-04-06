"""Cloudinary delete utilities."""

import logging

import cloudinary
import cloudinary.uploader

from app.config import settings

logger = logging.getLogger(__name__)

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
)


def _public_id_from_url(url: str) -> tuple[str, str]:
    """Extract public_id and resource_type from a Cloudinary URL.

    Cloudinary URLs look like:
      https://res.cloudinary.com/<cloud>/image/upload/v123/<folder>/<file>.jpg
      https://res.cloudinary.com/<cloud>/raw/upload/v123/<folder>/<file>.pdf
    Returns (public_id, resource_type).
    """
    try:
        # Strip query string
        url = url.split("?")[0]
        parts = url.split("/")
        # Find 'upload' index
        upload_idx = parts.index("upload")
        resource_type = parts[upload_idx - 1]  # 'image' or 'raw'
        # Everything after 'upload/vXXX/' or 'upload/' is the public_id (with extension stripped)
        after_upload = parts[upload_idx + 1:]
        # Skip version segment (starts with 'v' followed by digits)
        if after_upload and after_upload[0].startswith("v") and after_upload[0][1:].isdigit():
            after_upload = after_upload[1:]
        public_id_with_ext = "/".join(after_upload)
        # Strip file extension
        dot_idx = public_id_with_ext.rfind(".")
        public_id = public_id_with_ext[:dot_idx] if dot_idx != -1 else public_id_with_ext
        return public_id, resource_type
    except Exception:
        return "", "image"


def delete_cloudinary_file(url: str) -> None:
    """Delete a single file from Cloudinary by its URL."""
    if not url:
        return
    try:
        public_id, resource_type = _public_id_from_url(url)
        if public_id:
            result = cloudinary.uploader.destroy(public_id, resource_type=resource_type)
            if result.get("result") not in ("ok", "not found"):
                logger.warning("Cloudinary delete unexpected result for %s: %s", public_id, result)
        else:
            logger.warning("Could not extract public_id from Cloudinary URL: %s", url)
    except Exception as e:
        logger.error("Failed to delete Cloudinary file %s: %s", url, e)


def delete_student_files(student) -> None:
    """Delete all enrollment document files for a student from Cloudinary."""
    fields = [
        student.student_photo_path,
        student.grades_path,
        student.voucher_path,
        student.psa_birth_cert_path,
        student.transfer_credential_path,
        student.good_moral_path,
    ]
    for url in fields:
        delete_cloudinary_file(url)

    for url in (student.documents_path or []):
        delete_cloudinary_file(url)


def clear_student_file_fields(student) -> None:
    """Clear all enrollment document file fields on the student model (DB only)."""
    student.student_photo_path = None
    student.grades_path = None
    student.voucher_path = None
    student.psa_birth_cert_path = None
    student.transfer_credential_path = None
    student.good_moral_path = None
    student.documents_path = []
