"""Cloudinary delete utilities."""

import logging

import cloudinary
import cloudinary.uploader
import cloudinary.utils
import requests as _http

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
        # For raw resources (PDFs), the extension is part of the public_id in Cloudinary.
        # Only strip extension for image resources.
        if resource_type == "raw":
            public_id = public_id_with_ext
        else:
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


def download_cloudinary_file(url: str) -> bytes | None:
    """Download a file from Cloudinary. Tries direct URL first, falls back to signed URL."""
    if not url:
        return None

    # Try direct URL first (works when Cloudinary account allows public access)
    try:
        resp = _http.get(url, timeout=60, allow_redirects=True)
        if resp.status_code == 200:
            return resp.content
        logger.warning("Direct Cloudinary fetch returned %s for %s — trying signed URL", resp.status_code, url)
    except Exception as e:
        logger.warning("Direct Cloudinary fetch failed for %s: %s — trying signed URL", url, e)

    # Fall back to signed URL
    try:
        public_id, resource_type = _public_id_from_url(url)
        if not public_id:
            logger.error("Could not extract public_id from Cloudinary URL: %s", url)
            return None
        signed_url, _ = cloudinary.utils.cloudinary_url(
            public_id,
            resource_type=resource_type,
            sign_url=True,
            secure=True,
        )
        resp = _http.get(signed_url, timeout=60, allow_redirects=True)
        if resp.status_code == 200:
            return resp.content
        logger.error("Signed Cloudinary fetch returned %s for %s (signed url: %s)", resp.status_code, url, signed_url)
        return None
    except Exception as e:
        logger.error("Signed Cloudinary fetch failed for %s: %s", url, e)
        return None


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
