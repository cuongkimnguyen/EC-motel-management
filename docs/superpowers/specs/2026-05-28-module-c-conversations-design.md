# Module C: Conversations / Leads — Implementation Spec
## Phase 4 Backend — Facebook Messenger CRM-lite

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Conversations / Leads module that receives inbound Facebook Page Messenger messages via webhook, stores full message history, enables the admin to send outbound replies, and manages lead lifecycle.

**Architecture:** 3-layer module (`conversations/`) + a stateless webhook handler (`webhooks/facebook.py`) + an isolated HTTP client (`integrations/meta_send_api.py`). Webhook returns 200 immediately and processes in FastAPI `BackgroundTasks`. Outbound send auto-retries up to 3 times via `tenacity`.

**Tech Stack:** FastAPI, SQLAlchemy 2.x async, Alembic, Pydantic v2, `httpx` (async HTTP), `tenacity` (retry), PostgreSQL

---

## Decisions Made (from research + user answers)

| Decision | Choice | Reason |
|---|---|---|
| Conversation creation | Webhook-only (no `POST /api/conversations`) | User: "only reply conversations from fan page" |
| Customer name/avatar | Blank name; avatar = first char of PSID as fallback | No Meta User Profile API call needed |
| Multi-page support | Single token via env var now; `page_id` stored in DB for future | Q3: "first one page, in the future multiple" |
| 24h window expired | Send with `HUMAN_AGENT` tag (7-day window) | Q5: "allow with HUMAN_AGENT" |
| Failed send retry | Auto-retry 3× with exponential backoff via `tenacity` | Q6: "automatically" |
| Inbound notifications | Create/upsert a `new_message` Notification via NotificationsService | Q4: "yes, trigger app noti" |
| Manual creation | Not allowed | Q8: no manual creation |
| Webhook processing | FastAPI `BackgroundTasks` (no Celery/ARQ needed in Phase 4) | YAGNI — task queue deferred to Phase 5 |

---

## 1. Database Schema

### Migration: `0009_create_chat_conversations_messages.py`

#### `chat_conversations` table

```sql
CREATE TABLE chat_conversations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Facebook identifiers
    psid            TEXT NOT NULL,
    page_id         TEXT NOT NULL,

    -- Customer display
    customer_name   TEXT,                     -- NULL until admin fills in
    source          TEXT NOT NULL DEFAULT 'Facebook Page'
                    CHECK (source IN ('Facebook Page', 'Facebook Group', 'Zalo', 'manual')),

    -- Lead management
    lead_status     TEXT NOT NULL DEFAULT 'Mới'
                    CHECK (lead_status IN ('Mới','Đang tư vấn','Quan tâm cao','Đã chốt','Không quan tâm')),
    interest_level  TEXT NOT NULL DEFAULT 'Trung bình'
                    CHECK (interest_level IN ('Thấp','Trung bình','Cao','Rất cao')),
    tags            TEXT[] NOT NULL DEFAULT '{}',
    assignee        TEXT,
    interested_room TEXT,
    budget          INTEGER,
    appointment_date TIMESTAMPTZ,
    internal_note   TEXT,
    phone           TEXT,

    -- Denormalized summary (for list view performance)
    last_message              TEXT,
    last_message_at           TIMESTAMPTZ,
    last_customer_message_at  TIMESTAMPTZ,    -- used for 24h window check
    unread_count              INTEGER NOT NULL DEFAULT 0,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_conversation_psid_page UNIQUE (psid, page_id)
);

CREATE INDEX idx_conv_lead_status    ON chat_conversations (lead_status);
CREATE INDEX idx_conv_last_msg_at    ON chat_conversations (last_message_at DESC NULLS LAST);
```

#### `chat_messages` table

```sql
CREATE TABLE chat_messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,

    meta_mid        TEXT UNIQUE,              -- message.mid from Meta; NULL for system messages
    direction       TEXT NOT NULL CHECK (direction IN ('inbound','outbound')),
    message_type    TEXT NOT NULL DEFAULT 'text'
                    CHECK (message_type IN ('text','image','audio','file','system')),
    content         TEXT,                     -- text content
    attachment_url  TEXT,                     -- deferred: image/audio/file
    status          TEXT NOT NULL DEFAULT 'delivered'
                    CHECK (status IN ('delivered','sent','failed','read')),
    error_detail    TEXT,                     -- Meta API error body on send failure
    sender_type     TEXT NOT NULL DEFAULT 'customer'
                    CHECK (sender_type IN ('customer','admin','system')),
    sender_name     TEXT,
    sent_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_msg_conv_sent ON chat_messages (conversation_id, sent_at DESC);
```

**Notes:**
- `uq_conversation_psid_page` enables `INSERT … ON CONFLICT (psid, page_id) DO UPDATE` — upsert on each inbound message
- `meta_mid UNIQUE` is the deduplication guarantee for webhook retries; no additional Redis needed
- `page_id` stored on every row makes the schema ready for multi-page support without migration
- `last_customer_message_at` updated on inbound only — drives the 24h window check
- `attachment_url`, `message_type != 'text'` columns exist but are not implemented in Phase 4 (attachments deferred)

---

## 2. Module File Structure

```
backend/app/modules/conversations/
    __init__.py
    models.py           # ChatConversation, ChatMessage ORM models
    schemas.py          # Pydantic DTOs (response + update)
    repository.py       # DB: upsert_conversation, insert_message, list, get, stats
    service.py          # process_inbound_message(), send_outbound_message()
    router.py           # /api/conversations endpoints

backend/app/modules/webhooks/
    __init__.py
    facebook.py         # GET + POST /api/webhooks/facebook
    signature.py        # verify_x_hub_signature_256(raw_body, header, secret) → bool

backend/app/integrations/
    __init__.py
    meta_send_api.py    # send_message(psid, text, messaging_type, tag?) → meta_mid | raises
```

Each unit has one clear responsibility and can be tested independently.

---

## 3. Admin API Endpoints

### `GET /api/conversations`
List conversations with optional filters.

**Query params:** `lead_status`, `assignee`, `search` (matches `customer_name`, `phone`, `last_message`), `page=1`, `limit=20`

**Response:** Paginated list — same `{ data, total, page, limit }` envelope used elsewhere. Each item includes `unread_count`, `last_message`, `last_message_at`, `lead_status`, `source`.

**No auth-bypass:** `require_admin` dependency on all conversation endpoints.

---

### `GET /api/conversations/:id`
Return full conversation including all messages ordered by `sent_at ASC`.

**Response schema:**
```python
class ChatConversationDetail(BaseModel):
    id: str
    psid: str
    page_id: str
    customer_name: str | None
    source: str
    lead_status: str
    interest_level: str
    tags: list[str]
    assignee: str | None
    interested_room: str | None
    budget: int | None
    appointment_date: datetime | None
    internal_note: str | None
    phone: str | None
    last_message: str | None
    last_message_at: datetime | None
    unread_count: int
    created_at: datetime
    messages: list[ChatMessageResponse]
```

Side-effect: reset `unread_count = 0` when the admin opens a conversation.

---

### `PATCH /api/conversations/:id`
Update lead management fields.

**Allowed fields:** `lead_status`, `interest_level`, `tags`, `assignee`, `interested_room`, `budget`, `appointment_date`, `internal_note`, `phone`, `customer_name`

**Forbidden fields (immutable via this endpoint):** `psid`, `page_id`, `source`, `unread_count`, `last_message_at`

---

### `POST /api/conversations/:id/messages`
Send an outbound reply to the customer via Meta Send API.

**Request body:** `{ "text": "Phòng A101 còn trống, giá 3.000.000đ/tháng." }`

**Validations:**
1. Conversation must exist and have a non-null `psid`
2. `text` must be non-empty, max 2000 chars (Meta limit)
3. Determine `messaging_type`:
   - If `last_customer_message_at` is within 24 hours → `messaging_type = "RESPONSE"`
   - If expired or null → `messaging_type = "MESSAGE_TAG"`, `tag = "HUMAN_AGENT"`

**Processing:**
1. Call `meta_send_api.send_message()` (with auto-retry)
2. On success: insert `ChatMessage(direction=outbound, status=sent, meta_mid=response.message_id)`
3. On failure after all retries: insert `ChatMessage(direction=outbound, status=failed, error_detail=...)`, return HTTP 502
4. Update `conversation.last_message`, `conversation.last_message_at`

**Response:** `ChatMessageResponse` — the stored message (sent or failed).

---

### `GET /api/conversations/stats`
Return CRM header KPIs.

**Response:**
```python
class ConversationStats(BaseModel):
    total: int
    unread: int                              # conversations with unread_count > 0
    by_lead_status: dict[str, int]           # {"Mới": 5, "Đang tư vấn": 3, ...}
```

---

## 4. Webhook Endpoints

### `GET /api/webhooks/facebook` — Verification

Meta calls this once when you register or update the webhook URL.

```
GET /api/webhooks/facebook
  ?hub.mode=subscribe
  &hub.verify_token={FACEBOOK_VERIFY_TOKEN}
  &hub.challenge=123456789
```

**Logic:** If `hub.mode == "subscribe"` and `hub.verify_token == settings.FACEBOOK_VERIFY_TOKEN` → respond with HTTP 200, plain-text body = `hub.challenge`. Otherwise 403.

---

### `POST /api/webhooks/facebook` — Event Receiver

```
POST /api/webhooks/facebook
Headers: X-Hub-Signature-256: sha256={hmac}
Body: Meta webhook JSON
```

**Processing order (critical):**
1. Read raw body bytes (`await request.body()`)
2. Verify `X-Hub-Signature-256` — reject with 403 if invalid or missing  
   *(Unless `FACEBOOK_WEBHOOK_ENABLED=False` — skip verification in test mode)*
3. **Return HTTP 200 `"EVENT_RECEIVED"` immediately**
4. Add background task: `process_webhook_body(raw_json)`

**Important — DB session in background task:** FastAPI's `BackgroundTasks` runs after the response is sent, at which point the request-scoped DB session is already closed. The background task must open its own session using `async with TestSessionLocal() as db:` (or the production equivalent `async with async_sessionmaker()() as db:`). Pass the `sessionmaker` factory into the background task, not the session itself.

**Inside `process_webhook_body`:**
```
if body["object"] != "page" → return (ignore non-page events)

for entry in body["entry"]:
    page_id = entry["id"]
    for event in entry.get("messaging", []):
        sender_psid = event["sender"]["id"]
        msg = event.get("message")
        if not msg:
            continue                            # postback or other non-message event
        if msg.get("is_echo"):
            continue                            # skip echoes of our own sends
        
        mid      = msg["mid"]
        text     = msg.get("text")              # None if attachment
        sent_at  = datetime.fromtimestamp(event["timestamp"] / 1000, tz=timezone.utc)
        
        # idempotency: skip if mid already exists in DB
        if await repo.message_exists_by_mid(mid):
            continue
        
        # upsert conversation
        conv = await repo.upsert_conversation(psid=sender_psid, page_id=page_id, source="Facebook Page")
        
        # insert message
        await repo.insert_message(
            conversation_id=conv.id,
            meta_mid=mid,
            direction="inbound",
            content=text,
            sent_at=sent_at,
        )
        
        # update conversation summary
        await repo.update_after_inbound(conv.id, preview=text or "[attachment]", sent_at=sent_at)
        
        # trigger in-app notification (upsert — one per conversation)
        await notifications_svc.upsert(
            type="new_message",
            reference_id=str(conv.id),
            title="Tin nhắn mới từ Facebook",
            message=f"{text[:80] if text else '[attachment]'}",
            priority="medium",
        )
```

---

## 5. Meta Send API Client (`integrations/meta_send_api.py`)

Isolated module — knows nothing about DB or business logic. Accepts a PSID and text, calls Meta, returns the Meta `message_id`.

```python
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

GRAPH_API_BASE = "https://graph.facebook.com"

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=8),
    retry=retry_if_exception_type(httpx.HTTPStatusError),
    reraise=True,
)
async def send_message(
    psid: str,
    text: str,
    page_access_token: str,
    graph_api_version: str,
    messaging_type: str = "RESPONSE",
    tag: str | None = None,
) -> str:
    """Send a message via Meta Send API. Returns the Meta message_id."""
    url = f"{GRAPH_API_BASE}/{graph_api_version}/me/messages"
    
    payload: dict = {
        "recipient": {"id": psid},
        "message": {"text": text},
        "messaging_type": messaging_type,
    }
    if tag:
        payload["tag"] = tag
    
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            url,
            json=payload,
            params={"access_token": page_access_token},
            headers={"Content-Type": "application/json"},
            timeout=10.0,
        )
        resp.raise_for_status()               # raises HTTPStatusError on 4xx/5xx → triggers retry
        return resp.json()["message_id"]
```

**Retry policy:** 3 attempts, exponential backoff 1s → 2s → 4s (up to 8s cap). `reraise=True` means if all 3 fail, the original exception propagates to the service layer, which catches it and stores the message as `status=failed`.

**Note:** Only retries on `HTTPStatusError` (network/server errors). A 400 from Meta (bad request) is not retried.

---

## 6. HMAC Signature Verification (`webhooks/signature.py`)

```python
import hashlib
import hmac

def verify_x_hub_signature_256(raw_body: bytes, header: str, app_secret: str) -> bool:
    if not header or "=" not in header:
        return False
    method, provided = header.split("=", 1)
    if method != "sha256":
        return False
    expected = hmac.new(app_secret.encode(), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(provided, expected)   # constant-time comparison
```

---

## 7. Notification Integration

The `Notification` model has a `UniqueConstraint("type", "reference_id")`. This means there is at most **one active notification per conversation** of type `new_message`. When a second message arrives in the same conversation:
- Use an upsert: `INSERT … ON CONFLICT (type, reference_id) DO UPDATE SET message=…, read=false, updated_at=now()`
- This resets the notification to unread and updates the preview text

Add a `upsert()` method to `NotificationsRepository` (or use the existing service). The `reference_id` on the notification is the `conversation_id`.

---

## 8. Configuration

Add to `backend/app/core/config.py`:

```python
META_GRAPH_API_VERSION: str = "v21.0"
FACEBOOK_PAGE_ID: str = ""
FACEBOOK_PAGE_ACCESS_TOKEN: str = ""
FACEBOOK_VERIFY_TOKEN: str = ""
FACEBOOK_APP_SECRET: str = ""
FACEBOOK_WEBHOOK_ENABLED: bool = True
```

Add to `.env` (never commit to git):
```
META_GRAPH_API_VERSION=v21.0
FACEBOOK_PAGE_ID=
FACEBOOK_PAGE_ACCESS_TOKEN=
FACEBOOK_VERIFY_TOKEN=motelmanage_webhook_2026
FACEBOOK_APP_SECRET=
FACEBOOK_WEBHOOK_ENABLED=false   # true only when real Meta app is configured
```

**In tests:** `FACEBOOK_WEBHOOK_ENABLED=false` — signature verification is skipped, and `meta_send_api.send_message` is mocked.

---

## 9. Security

| Concern | Mitigation |
|---|---|
| Webhook spoofing | HMAC-SHA256 verification on every POST (`X-Hub-Signature-256`) |
| Timing attack | `hmac.compare_digest()` used (constant-time) |
| Token leakage | `PAGE_ACCESS_TOKEN` and `APP_SECRET` never logged; if needed, log first 8 chars + `…` |
| Duplicate delivery | `meta_mid UNIQUE` constraint; `message_exists_by_mid()` check before insert |
| Outbound auth | `require_admin` on all `/api/conversations` endpoints |
| Arbitrary PSID sending | Outbound only via existing conversation records; admin cannot specify a raw PSID |
| Secrets in source | All tokens from env vars; `.env` in `.gitignore` |

---

## 10. Testing Strategy

`FACEBOOK_WEBHOOK_ENABLED=false` has two effects in tests:
1. Webhook `POST /api/webhooks/facebook` skips HMAC signature verification — tests can POST raw JSON without computing an HMAC.
2. `meta_send_api.send_message` is mocked — no real Meta API calls are made.

The `signature.py` HMAC logic is covered by a **unit test** (not an integration test) — call `verify_x_hub_signature_256()` directly with a known key + body and assert the result.

**Integration tests:**
- **Inbound pipeline:** POST raw JSON directly to `/api/webhooks/facebook`. Verify conversation and message are created in DB. Note: `BackgroundTasks` in test must be awaited — use `httpx.AsyncClient` with `ASGITransport` (same as existing tests).
- **Deduplication:** POST same payload twice with the same `message.mid`. Verify only one `ChatMessage` row exists.
- **Outbound send:** Mock `meta_send_api.send_message` to return `"mid.fake123"`. Verify `ChatMessage(status=sent)` stored.
- **Failed send:** Mock `meta_send_api.send_message` to raise `httpx.HTTPStatusError` on all attempts. Verify `ChatMessage(status=failed)` stored, endpoint returns 502.
- **24h window — RESPONSE:** Set `last_customer_message_at = now() - 1 hour`, call send endpoint. Verify `messaging_type="RESPONSE"` passed to mock.
- **24h window — HUMAN_AGENT:** Set `last_customer_message_at = now() - 25 hours`, call send endpoint. Verify `messaging_type="MESSAGE_TAG"`, `tag="HUMAN_AGENT"` passed to mock.
- **Lead management:** PATCH endpoint — transition each `lead_status` value.
- **Notifications:** After inbound message, verify a `Notification(type="new_message")` exists. Second inbound on same conversation: verify still one notification (upserted), `read=False`.
- **Stats:** Verify counts match seeded data.
- **Unit test — signature.py:** `verify_x_hub_signature_256(body, "sha256="+valid_hmac, secret)` → True; tampered body → False.

---

## 11. Local Development with ngrok

1. Install ngrok: `brew install ngrok`
2. Start backend: `uvicorn app.main:app --reload --port 8000`
3. Start tunnel: `ngrok http 8000`
4. Copy the `https://<random>.ngrok-free.app` URL
5. In Meta App Dashboard → Messenger → Webhooks:
   - Callback URL: `https://<random>.ngrok-free.app/api/webhooks/facebook`
   - Verify Token: value of `FACEBOOK_VERIFY_TOKEN` in your `.env`
6. Click "Verify and Save" — Meta calls your GET endpoint
7. Subscribe fields: `messages`
8. Set `FACEBOOK_WEBHOOK_ENABLED=true` in `.env`
9. ngrok web UI at `http://localhost:4040` shows all webhook payloads for debugging

**Note:** Free ngrok generates a new URL on each restart. Re-register in Meta App Dashboard after each restart.

---

## 12. What is NOT in Phase 4 (Deferred)

| Feature | Deferred to |
|---|---|
| Image / audio / file attachments | Phase 5 |
| Meta app review submission | Before public launch |
| Zalo OA webhook | Phase 5 |
| AI auto-reply from Agent module | Phase D |
| Automation triggers from conversations | Phase E |
| Multiple Facebook Pages (token per page_id) | Phase 5 |
| Customer profile fetch from Meta User Profile API | Phase 5 |
| Read receipts / delivery confirmations | Phase 5 |
| Background retry job for permanently failed messages | Phase 5 |

---

## 13. Open Issues After This Spec

None — all research questions answered. Meta Developer App and Facebook Page setup is required before testing with real messages; the `FACEBOOK_WEBHOOK_ENABLED=false` flag allows full backend development and testing without a real Meta app.
