"""Supabase Storage client for uploading room images and expense receipts.

All uploads produce a public URL using the storage bucket's public endpoint.
Bucket policies must be set to public read in the Supabase dashboard.
"""
import mimetypes
import uuid

from app.core.config import settings


def _get_client():
    """Lazy-init Supabase client so missing credentials don't break import."""
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_KEY must be set in .env to use file storage"
        )
    from supabase import create_client

    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)


def _public_url(bucket: str, path: str) -> str:
    return f"{settings.SUPABASE_URL}/storage/v1/object/public/{bucket}/{path}"


async def upload_room_image(file_bytes: bytes, original_filename: str) -> str:
    """Upload a room image to Supabase Storage. Returns public URL."""
    client = _get_client()
    mime_type, _ = mimetypes.guess_type(original_filename)
    mime_type = mime_type or "image/jpeg"
    ext = original_filename.rsplit(".", 1)[-1] if "." in original_filename else "jpg"
    path = f"rooms/{uuid.uuid4()}.{ext}"

    client.storage.from_(settings.STORAGE_BUCKET_ROOMS).upload(
        path=path,
        file=file_bytes,
        file_options={"content-type": mime_type},
    )
    return _public_url(settings.STORAGE_BUCKET_ROOMS, path)


async def upload_expense_receipt(file_bytes: bytes, original_filename: str) -> str:
    """Upload an expense receipt to Supabase Storage. Returns public URL."""
    client = _get_client()
    mime_type, _ = mimetypes.guess_type(original_filename)
    mime_type = mime_type or "application/octet-stream"
    ext = original_filename.rsplit(".", 1)[-1] if "." in original_filename else "bin"
    path = f"receipts/{uuid.uuid4()}.{ext}"

    client.storage.from_(settings.STORAGE_BUCKET_EXPENSES).upload(
        path=path,
        file=file_bytes,
        file_options={"content-type": mime_type},
    )
    return _public_url(settings.STORAGE_BUCKET_EXPENSES, path)
