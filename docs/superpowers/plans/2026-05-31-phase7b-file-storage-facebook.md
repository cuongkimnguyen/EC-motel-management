# Phase 7b — File Storage + Facebook Post Publishing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** (1) Upload room images and expense receipts to Supabase Storage. (2) Wire Facebook Graph API post publishing into the existing `POST /api/posts/{id}/publish` endpoint so posts on channel "Facebook Page" or "Facebook Group" call the real Meta API when credentials are configured.

**Architecture:** A new `app/integrations/storage.py` client wraps `supabase-py` async storage. A new `app/integrations/facebook_graph.py` wraps the Graph API `/me/feed` call. Both are injected into their module's service layer — no new DB tables required. Facebook publishing is gated by `settings.FACEBOOK_WEBHOOK_ENABLED` so the endpoint degrades gracefully without credentials.

**Tech Stack:** `supabase` Python SDK (storage), `httpx` (already installed) for Facebook Graph API, FastAPI `UploadFile`

---

## File Map

**Create:**
- `backend/app/integrations/storage.py`
- `backend/app/integrations/facebook_graph.py`
- `backend/tests/test_storage.py`
- `backend/tests/test_facebook_publish.py`

**Modify:**
- `backend/app/core/config.py` — add `SUPABASE_URL`, `SUPABASE_KEY` settings
- `backend/app/modules/rooms/router.py` — add `POST /{room_id}/images`
- `backend/app/modules/rooms/service.py` — add `upload_image()`
- `backend/app/modules/expenses/router.py` — add `POST /{expense_id}/receipt`
- `backend/app/modules/expenses/service.py` — add `upload_receipt()`
- `backend/app/modules/posts/service.py` — extend `publish_post()` to call Facebook Graph API
- `backend/requirements.txt`

---

## Task 1: Install Dependencies + Config

- [ ] **Step 1: Install supabase**

```bash
cd backend
pip install supabase
```

Add to `backend/requirements.txt`:
```
supabase==2.9.1
```

- [ ] **Step 2: Add Supabase config fields to settings**

In `backend/app/core/config.py`, add to the `Settings` class:

```python
    # Supabase Storage
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""            # service-role key (not anon key)
    STORAGE_BUCKET_ROOMS: str = "room-images"
    STORAGE_BUCKET_EXPENSES: str = "expense-receipts"
```

- [ ] **Step 3: Verify config loads**

```bash
cd backend
python -c "from app.core.config import settings; print(settings.SUPABASE_URL or 'not set'); print('OK')"
```
Expected: `not set` (or the actual URL if `.env` has it) then `OK`

- [ ] **Step 4: Commit**

```bash
git add backend/requirements.txt backend/app/core/config.py
git commit -m "chore(config): add Supabase Storage settings for file upload"
```

---

## Task 2: Storage Integration Client

**Files:**
- Create: `backend/app/integrations/storage.py`

- [ ] **Step 1: Write storage.py**

```python
# backend/app/integrations/storage.py
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
    """Upload a room image to Supabase Storage.

    Args:
        file_bytes: Raw file content.
        original_filename: Used only to derive the MIME type.

    Returns:
        Public URL of the uploaded file.
    """
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
    """Upload an expense receipt to Supabase Storage.

    Returns:
        Public URL of the uploaded file.
    """
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
```

- [ ] **Step 2: Verify import**

```bash
cd backend
python -c "from app.integrations.storage import upload_room_image; print('OK')"
```
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add backend/app/integrations/storage.py
git commit -m "feat(storage): add Supabase Storage client for room images and expense receipts"
```

---

## Task 3: Room Image Upload Endpoint

**Files:**
- Modify: `backend/app/modules/rooms/service.py`
- Modify: `backend/app/modules/rooms/router.py`
- Test: `backend/tests/test_storage.py`

- [ ] **Step 1: Write failing tests**

```python
# backend/tests/test_storage.py
"""Storage upload endpoint tests — mock the Supabase client."""
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient

# ── Room images ───────────────────────────────────────────────────────────────

async def test_upload_room_image_returns_url(client: AsyncClient, auth_headers: dict):
    # Create a room first
    room_payload = {
        "code": "P101", "name": "Phòng 101", "floor": "Tầng 1", "block": "Khu A",
        "area": 25, "rent_price": 3_500_000, "deposit": 7_000_000,
        "electricity_price": 3500, "water_price": 15000, "service_fee": 100_000,
        "max_tenants": 2, "status": "Trống", "description": "",
    }
    room = (await client.post("/api/rooms", json=room_payload, headers=auth_headers)).json()
    room_id = room["id"]

    fake_url = "https://supabase.example.com/storage/v1/object/public/room-images/rooms/abc.jpg"
    with patch(
        "app.modules.rooms.service.upload_room_image",
        return_value=fake_url,
    ):
        resp = await client.post(
            f"/api/rooms/{room_id}/images",
            files={"file": ("photo.jpg", b"fake-image-bytes", "image/jpeg")},
            headers=auth_headers,
        )
    assert resp.status_code == 200
    body = resp.json()
    assert fake_url in body["images"]


async def test_upload_room_image_unknown_room_returns_404(client: AsyncClient, auth_headers: dict):
    import uuid
    with patch("app.modules.rooms.service.upload_room_image", return_value="http://x"):
        resp = await client.post(
            f"/api/rooms/{uuid.uuid4()}/images",
            files={"file": ("photo.jpg", b"fake", "image/jpeg")},
            headers=auth_headers,
        )
    assert resp.status_code == 404


async def test_upload_room_image_requires_auth(client: AsyncClient):
    import uuid
    resp = await client.post(
        f"/api/rooms/{uuid.uuid4()}/images",
        files={"file": ("photo.jpg", b"fake", "image/jpeg")},
    )
    assert resp.status_code == 401


# ── Expense receipts ──────────────────────────────────────────────────────────

async def test_upload_expense_receipt_returns_url(client: AsyncClient, auth_headers: dict):
    from datetime import date
    expense_payload = {
        "title": "Tiền điện", "category": "Điện nước", "amount": 1_000_000,
        "expense_date": str(date.today()), "payment_status": "Đã thanh toán",
        "payment_method": "Tiền mặt", "building_name": "Khu A", "note": "",
    }
    expense = (await client.post("/api/expenses", json=expense_payload, headers=auth_headers)).json()
    expense_id = expense["id"]

    fake_url = "https://supabase.example.com/storage/v1/object/public/expense-receipts/receipts/abc.pdf"
    with patch(
        "app.modules.expenses.service.upload_expense_receipt",
        return_value=fake_url,
    ):
        resp = await client.post(
            f"/api/expenses/{expense_id}/receipt",
            files={"file": ("receipt.pdf", b"fake-pdf-bytes", "application/pdf")},
            headers=auth_headers,
        )
    assert resp.status_code == 200
    assert resp.json()["receipt_image"] == fake_url


async def test_upload_expense_receipt_requires_auth(client: AsyncClient):
    import uuid
    resp = await client.post(
        f"/api/expenses/{uuid.uuid4()}/receipt",
        files={"file": ("r.pdf", b"x", "application/pdf")},
    )
    assert resp.status_code == 401
```

- [ ] **Step 2: Run to verify failure**

```bash
cd backend
pytest tests/test_storage.py -v
```
Expected: errors — routes don't exist yet

- [ ] **Step 3: Add upload_image() to RoomService**

Append to `backend/app/modules/rooms/service.py`:

```python
    async def upload_image(self, room_id: str, file_bytes: bytes, filename: str) -> "RoomResponse":
        from app.integrations.storage import upload_room_image
        room = await self.repo.get_by_id(room_id)
        if not room:
            raise HTTPException(status_code=404, detail="Phòng không tồn tại")
        url = await upload_room_image(file_bytes, filename)
        current_images = list(room.images or [])
        current_images.append(url)
        room = await self.repo.update(room, images=current_images)
        return RoomResponse.model_validate(room)
```

- [ ] **Step 4: Add image upload endpoint to rooms router**

Add to `backend/app/modules/rooms/router.py`:

```python
from fastapi import UploadFile, File

@router.post("/{room_id}/images", response_model=RoomResponse)
async def upload_room_image(
    room_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    file_bytes = await file.read()
    return await RoomService(db).upload_image(room_id, file_bytes, file.filename or "image.jpg")
```

- [ ] **Step 5: Add upload_receipt() to ExpenseService**

Append to `backend/app/modules/expenses/service.py`:

```python
    async def upload_receipt(self, expense_id: str, file_bytes: bytes, filename: str) -> ExpenseResponse:
        from app.integrations.storage import upload_expense_receipt
        expense = await self.repo.get_by_id(expense_id)
        if not expense:
            raise HTTPException(status_code=404, detail="Chi phí không tồn tại")
        url = await upload_expense_receipt(file_bytes, filename)
        expense = await self.repo.update(expense, receipt_image=url)
        return ExpenseResponse.model_validate(expense)
```

- [ ] **Step 6: Add receipt upload endpoint to expenses router**

Add to `backend/app/modules/expenses/router.py`:

```python
from fastapi import UploadFile, File

@router.post("/{expense_id}/receipt", response_model=ExpenseResponse)
async def upload_receipt(
    expense_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    file_bytes = await file.read()
    return await ExpenseService(db).upload_receipt(expense_id, file_bytes, file.filename or "receipt.bin")
```

- [ ] **Step 7: Run storage tests**

```bash
cd backend
pytest tests/test_storage.py -v
```
Expected: 6 passed

- [ ] **Step 8: Commit**

```bash
git add backend/app/modules/rooms/service.py backend/app/modules/rooms/router.py \
        backend/app/modules/expenses/service.py backend/app/modules/expenses/router.py \
        backend/tests/test_storage.py
git commit -m "feat(storage): room image + expense receipt upload via Supabase Storage"
```

---

## Task 4: Facebook Graph API — Post Publishing Integration

**Files:**
- Create: `backend/app/integrations/facebook_graph.py`
- Test: `backend/tests/test_facebook_publish.py`

- [ ] **Step 1: Write failing tests**

```python
# backend/tests/test_facebook_publish.py
"""Facebook post publishing integration tests — mock httpx."""
from datetime import date
from unittest.mock import AsyncMock, MagicMock, patch

from httpx import AsyncClient

POST_PAYLOAD = {
    "title": "Phòng trống tháng 7",
    "content": "Còn phòng đẹp, giá tốt!",
    "post_type": "Tuyển khách",
    "channel": "Facebook Page",
}


async def _create_draft(client, auth_headers) -> str:
    resp = await client.post("/api/posts", json=POST_PAYLOAD, headers=auth_headers)
    return resp.json()["id"]


async def test_publish_post_without_fb_credentials_stays_local(
    client: AsyncClient, auth_headers: dict
):
    """When FACEBOOK_WEBHOOK_ENABLED=False, publish still marks post as Đã đăng."""
    post_id = await _create_draft(client, auth_headers)
    resp = await client.post(f"/api/posts/{post_id}/publish", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "Đã đăng"
    assert body["fb_link"] is None   # no FB link without real credentials


async def test_publish_post_with_fb_credentials_calls_graph_api(
    client: AsyncClient, auth_headers: dict
):
    """When FACEBOOK_WEBHOOK_ENABLED=True, publish calls publish_page_post()."""
    post_id = await _create_draft(client, auth_headers)

    mock_fb_post_id = "123456789_987654321"
    with patch(
        "app.modules.posts.service.publish_page_post",
        new_callable=AsyncMock,
        return_value=mock_fb_post_id,
    ), patch("app.modules.posts.service.settings") as mock_settings:
        mock_settings.FACEBOOK_WEBHOOK_ENABLED = True
        mock_settings.FACEBOOK_PAGE_ACCESS_TOKEN = "fake-token"
        mock_settings.META_GRAPH_API_VERSION = "v21.0"
        mock_settings.FACEBOOK_PAGE_ID = "111"
        resp = await client.post(f"/api/posts/{post_id}/publish", headers=auth_headers)

    assert resp.status_code == 200
    assert resp.json()["status"] == "Đã đăng"
    assert mock_fb_post_id in (resp.json()["fb_link"] or "")


async def test_publish_post_fb_error_marks_as_loi(
    client: AsyncClient, auth_headers: dict
):
    """When Facebook API raises, post status becomes Lỗi."""
    post_id = await _create_draft(client, auth_headers)

    with patch(
        "app.modules.posts.service.publish_page_post",
        new_callable=AsyncMock,
        side_effect=Exception("Facebook API error"),
    ), patch("app.modules.posts.service.settings") as mock_settings:
        mock_settings.FACEBOOK_WEBHOOK_ENABLED = True
        mock_settings.FACEBOOK_PAGE_ACCESS_TOKEN = "fake-token"
        mock_settings.META_GRAPH_API_VERSION = "v21.0"
        mock_settings.FACEBOOK_PAGE_ID = "111"
        resp = await client.post(f"/api/posts/{post_id}/publish", headers=auth_headers)

    assert resp.status_code == 200
    assert resp.json()["status"] == "Lỗi"
```

- [ ] **Step 2: Run to verify failure**

```bash
cd backend
pytest tests/test_facebook_publish.py -v
```
Expected: test_publish_post_without_fb_credentials_stays_local passes (current behavior), others fail

- [ ] **Step 3: Write facebook_graph.py**

```python
# backend/app/integrations/facebook_graph.py
"""Facebook Graph API client for publishing posts to a Facebook Page.

Separate from meta_send_api.py (Messenger Send API).
This module handles organic page post publishing via /me/feed.

Graph API reference:
  POST https://graph.facebook.com/{version}/{page_id}/feed
  Params: message, access_token

Returns:
  Facebook post ID string in format "{page_id}_{post_id}"
"""
import httpx
from tenacity import retry, retry_if_exception, stop_after_attempt, wait_exponential

GRAPH_API_BASE = "https://graph.facebook.com"


def _is_retryable(exc: BaseException) -> bool:
    if isinstance(exc, httpx.HTTPStatusError):
        return exc.response.status_code >= 500
    return isinstance(exc, httpx.TransportError)


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=8),
    retry=retry_if_exception(_is_retryable),
    reraise=True,
)
async def publish_page_post(
    message: str,
    page_id: str,
    page_access_token: str,
    graph_api_version: str = "v21.0",
) -> str:
    """Publish a text post to a Facebook Page feed.

    Args:
        message: Post body text.
        page_id: Facebook Page ID (numeric string).
        page_access_token: Long-lived Page Access Token.
        graph_api_version: Graph API version string, e.g. "v21.0".

    Returns:
        Facebook post ID string, e.g. "111111111_222222222".

    Raises:
        httpx.HTTPStatusError: 4xx/5xx after retries exhausted.
        httpx.TransportError: Network failure after retries exhausted.
    """
    url = f"{GRAPH_API_BASE}/{graph_api_version}/{page_id}/feed"
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            url,
            data={"message": message, "access_token": page_access_token},
            timeout=15.0,
        )
        resp.raise_for_status()
        return resp.json()["id"]
```

- [ ] **Step 4: Wire publish_page_post() into PostService.publish_post()**

Replace the existing `publish_post` method in `backend/app/modules/posts/service.py`:

```python
    async def publish_post(self, post_id: str) -> PostResponse:
        from app.core.config import settings
        from app.integrations.facebook_graph import publish_page_post

        post = await self.repo.get_by_id(post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Bài đăng không tồn tại")
        if post.status == "Đã đăng":
            raise HTTPException(status_code=409, detail="Bài đăng đã được đăng rồi")

        fb_link: str | None = None
        final_status = "Đã đăng"

        # Only call Facebook API when credentials are configured
        is_fb_channel = post.channel in ("Facebook Page", "Facebook Group")
        if is_fb_channel and settings.FACEBOOK_WEBHOOK_ENABLED and settings.FACEBOOK_PAGE_ACCESS_TOKEN:
            try:
                fb_post_id = await publish_page_post(
                    message=post.content,
                    page_id=settings.FACEBOOK_PAGE_ID,
                    page_access_token=settings.FACEBOOK_PAGE_ACCESS_TOKEN,
                    graph_api_version=settings.META_GRAPH_API_VERSION,
                )
                fb_link = f"https://www.facebook.com/{fb_post_id}"
            except Exception:
                final_status = "Lỗi"

        post = await self.repo.update(
            post,
            status=final_status,
            posted_date=datetime.now(timezone.utc) if final_status == "Đã đăng" else post.posted_date,
            fb_link=fb_link,
        )
        await self._sync_room_active_post(post.room_id)
        return await self._to_response(post)
```

- [ ] **Step 5: Run Facebook publish tests**

```bash
cd backend
pytest tests/test_facebook_publish.py -v
```
Expected: 3 passed

- [ ] **Step 6: Run full suite to check for regressions**

```bash
cd backend
pytest tests/ -v --tb=short -q
```
Expected: all existing tests pass

- [ ] **Step 7: Commit**

```bash
git add backend/app/integrations/facebook_graph.py \
        backend/app/modules/posts/service.py \
        backend/tests/test_facebook_publish.py
git commit -m "feat(posts): wire Facebook Graph API into publish endpoint with graceful degradation"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** Room image upload (`PUT /api/rooms/:id/images`), expense receipt upload (`PUT /api/expenses/:id/receipt`), Facebook post publishing on `POST /api/posts/:id/publish` — all covered.
- [x] **No placeholders:** All code blocks complete; storage upload and graph API calls are fully implemented.
- [x] **Graceful degradation:** `publish_post` works without FB credentials (status = Đã đăng, fb_link = None). Storage client raises `RuntimeError` with a clear message when `SUPABASE_URL` is missing — no silent failures.
- [x] **Tests mock external calls:** Storage tests patch `upload_room_image` / `upload_expense_receipt`. Facebook tests patch `publish_page_post`. No real HTTP calls during CI.
- [x] **Type consistency:** `upload_image()` returns `RoomResponse`; `upload_receipt()` returns `ExpenseResponse`; `publish_page_post()` returns `str`. Consistent with existing service return types.
