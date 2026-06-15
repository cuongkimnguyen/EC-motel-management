# Research: Meta Facebook Messenger API
## Module C — Conversations / Leads CRM-lite Integration

> **Status:** Research document — awaiting review before implementation  
> **Scope:** Receive and send Facebook Page Messenger messages, store full message history, manage lead lifecycle  
> **Graph API version in use:** v21.0 (current stable; v25.0 is latest but v21.0 has the widest sample coverage)

---

## 1. Executive Summary

**Is Messenger integration feasible for Module C?** Yes, with one hard constraint: for production use (any user who is not an app admin/developer/tester), Meta requires **app review approval** for the `pages_messaging` permission. Development and internal testing work without review.

**High-level architecture:**

```
Customer (Facebook Messenger)
    │  sends message
    ▼
Meta Servers
    │  POST /api/webhooks/facebook
    │  (signed with X-Hub-Signature-256)
    ▼
FastAPI Backend
    ├── verify HMAC-SHA256 signature
    ├── deduplicate by message.mid
    ├── upsert ChatConversation (keyed on PSID + page_id)
    ├── insert ChatMessage
    └── update last_message_at, unread_count
    
Admin (Frontend)
    │  POST /api/conversations/:id/messages
    ▼
FastAPI Backend
    ├── validate conversation + PSID
    ├── POST https://graph.facebook.com/v21.0/me/messages  (Send API)
    ├── store outbound ChatMessage with status SENT or FAILED
    └── update last_message_at
```

---

## 2. Required Meta Setup

### 2.1 Meta Developer App
1. Go to `https://developers.facebook.com/apps` → **Create App** → Type: **Business**
2. Add the **Messenger** product from the app dashboard
3. Note **App ID** and **App Secret** (used for HMAC signature verification)
4. Set a **Verify Token** — an arbitrary string you define and store in your backend config

### 2.2 Facebook Page
1. Create or use an existing Facebook Page (must be a Page, not a personal profile)
2. In the App Dashboard → Messenger → Settings → **Access Tokens** section: link the Page and generate a **Page Access Token**
3. The Page Access Token is long-lived and does not expire unless the admin revokes it

### 2.3 Webhook Registration
| Setting | Value |
|---|---|
| Callback URL | `https://<your-domain>/api/webhooks/facebook` |
| Verify Token | Your `FACEBOOK_VERIFY_TOKEN` env var |
| Webhook Fields | `messages`, `messaging_postbacks`, `message_deliveries`, `message_reads` |

Webhook registration is a two-step process:
1. **App-level webhook** — set the callback URL and verify token in the App Dashboard under **Webhooks**
2. **Page-level subscription** — subscribe the specific Page to specific fields:
   ```
   POST https://graph.facebook.com/v21.0/{PAGE_ID}/subscribed_apps
     ?subscribed_fields=messages,messaging_postbacks
     &access_token={PAGE_ACCESS_TOKEN}
   ```

### 2.4 Required Permissions
| Permission | Purpose | App Review Required? |
|---|---|---|
| `pages_messaging` | Send and receive messages via Messenger | **Yes (for production)** |
| `pages_manage_metadata` | Subscribe to webhooks | **Yes** |
| `pages_show_list` | Dependency of `pages_messaging` | Yes |

**In development mode:** All permissions work for users with an admin, developer, or tester role assigned in the App Dashboard. Up to ~25 testers can be added.

---

## 3. Inbound Message Flow

### 3.1 Webhook Verification (GET)

When you register or update the webhook URL, Meta sends a GET request:

```
GET /api/webhooks/facebook
  ?hub.mode=subscribe
  &hub.verify_token=<your_verify_token>
  &hub.challenge=<integer>
```

**Required response:** HTTP 200 with the plain text value of `hub.challenge` as the body (no JSON wrapper).

```python
@router.get("/api/webhooks/facebook")
async def verify_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
):
    if hub_mode == "subscribe" and hub_verify_token == settings.FACEBOOK_VERIFY_TOKEN:
        return PlainTextResponse(content=hub_challenge, status_code=200)
    raise HTTPException(status_code=403, detail="Token mismatch")
```

**Requirements:**
- Must be HTTPS with a valid CA-signed certificate (self-signed is rejected)
- Must respond within Meta's timeout
- For local development: use ngrok (see Section 8)

### 3.2 Inbound Message Event Payload (POST)

```json
{
  "object": "page",
  "entry": [
    {
      "id": "PAGE_ID",
      "time": 1458692752478,
      "messaging": [
        {
          "sender":    { "id": "USER_PSID" },
          "recipient": { "id": "PAGE_ID" },
          "timestamp": 1458692752478,
          "message": {
            "mid":  "mid.1457764197618:41d102a3e1ae206a38",
            "text": "Xin chào, phòng A101 còn trống không?"
          }
        }
      ]
    }
  ]
}
```

**Key fields:**

| Field | Description |
|---|---|
| `entry[].id` | Your Facebook Page ID |
| `messaging[].sender.id` | **PSID** — Page-Scoped User ID; unique identifier for this customer on this page |
| `messaging[].recipient.id` | Your Page ID (same as `entry[].id`) |
| `messaging[].timestamp` | Unix timestamp in milliseconds |
| `message.mid` | **Message ID** — use as idempotency key for deduplication |
| `message.text` | Message text (absent if attachment) |
| `message.attachments[]` | Image/audio/file attachments (mutually exclusive with `text`) |
| `message.is_echo` | `true` if the message was sent by your Page (echo of your outbound) |

**Processing rules:**
- Always iterate `entry[]` (can contain multiple entries per batch)
- Always iterate `entry[].messaging[]` (can contain multiple events per entry)
- Skip events where `message.is_echo == true` (they are reflections of your own sends)
- Skip events with no `message` key (e.g. `postback` events have a different shape)

### 3.3 Processing Pipeline

```
POST /api/webhooks/facebook
  1. Read raw body bytes
  2. Verify X-Hub-Signature-256 (reject with 403 if invalid)
  3. Return 200 IMMEDIATELY (before any DB work)
  4. Enqueue background task:
     a. Parse JSON
     b. For each entry → each messaging event:
        - Extract: page_id, sender_psid, message_mid, text, timestamp
        - Idempotency check: if message_mid already in DB → skip
        - Upsert ChatConversation (by psid + page_id)
        - Insert ChatMessage (direction=inbound, status=delivered)
        - Update conversation: last_message_at, last_message_preview, unread_count += 1
```

**Return 200 immediately** — if processing takes too long and Meta does not receive 200, it will retry and you will receive duplicate events.

---

## 4. Outbound Message Flow

### 4.1 Send API

**Endpoint:**
```
POST https://graph.facebook.com/v21.0/me/messages?access_token={PAGE_ACCESS_TOKEN}
```

**Request body:**
```json
{
  "recipient": { "id": "USER_PSID" },
  "message":   { "text": "Phòng A101 hiện đang trống, giá 3.000.000đ/tháng." },
  "messaging_type": "RESPONSE"
}
```

**Success response:**
```json
{
  "recipient_id": "USER_PSID",
  "message_id":   "mid.xxxxxxxxxxxx"
}
```

**`messaging_type` values:**

| Value | When to use |
|---|---|
| `RESPONSE` | Within 24 hours of the last user message (standard window) |
| `MESSAGE_TAG` | Outside 24-hour window, with an approved tag (see Section 5) |

### 4.2 Backend Flow for Outbound

```
POST /api/conversations/:id/messages { text }
  1. Load conversation from DB, verify it exists and has a valid psid
  2. Check 24-hour window: last_customer_message_at > now - 24h → use RESPONSE
     Otherwise → reject with 422 ("Messaging window expired — cannot send outside 24h window")
  3. Call Meta Send API (POST graph.facebook.com/…/me/messages)
  4a. On success:
      - Insert ChatMessage (direction=outbound, status=sent, meta_mid from response)
      - Update conversation last_message_at
  4b. On failure (Meta API error):
      - Insert ChatMessage (direction=outbound, status=failed, error_payload=response.text)
      - Return 502 with the Meta error detail
```

---

## 5. 24-Hour Messaging Window Policy

Meta enforces a **24-hour standard messaging window** per user:

- After a customer sends a message to the Page, a 24-hour window opens.
- Within the window, you can send unlimited replies with `messaging_type: "RESPONSE"`.
- After the window closes, standard messaging is blocked.
- To message outside the window, use `messaging_type: "MESSAGE_TAG"` with an approved tag:

| Tag | Allowed use case |
|---|---|
| `CONFIRMED_EVENT_UPDATE` | Reminder for a confirmed event the user registered for |
| `POST_PURCHASE_UPDATE` | Order/purchase update |
| `ACCOUNT_UPDATE` | Update on an application/account the user submitted |
| `HUMAN_AGENT` | Human agent handoff — extends window to **7 days** |

**Implication for the backend:** Store `last_customer_message_at` on each conversation. Check this timestamp before sending. Reject sends after the window with a clear error; do not silently drop them.

---

## 6. App Review Requirements

**What works without review (development mode):**
- Full receive + send flow works for users with an Admin, Developer, or Tester role on the App Dashboard
- Up to ~25 testers

**What requires app review (production / any real customer):**
- `pages_messaging` permission requires Meta app review
- Review requires video screencasts showing:
  1. The Facebook Login flow granting the permission
  2. The complete inbound message flow OR outbound message being sent
  3. A cURL example demonstrating the API integration
- Meta's review team must be able to test your app end-to-end

**Practical impact for Phase 4:** The integration can be fully built and tested with dev/tester accounts without review. Submit for app review only when ready for real customers. App review is a **blocking gate** before any non-admin customer can reach the bot.

---

## 7. Proposed Database Design

### 7.1 `chat_conversations` table

```sql
CREATE TABLE chat_conversations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- External identifiers
    psid            TEXT NOT NULL,          -- Facebook Page-Scoped User ID (unique per user per page)
    page_id         TEXT NOT NULL,          -- The Facebook Page ID that received the message
    
    -- Customer info (populated from Meta User Profile API or admin input)
    customer_name   TEXT,
    customer_avatar TEXT,                   -- URL or initials fallback
    
    -- Source
    source          TEXT NOT NULL           -- 'Facebook Page' | 'Facebook Group' | 'Zalo' | 'manual'
                    CHECK (source IN ('Facebook Page', 'Facebook Group', 'Zalo', 'manual')),
    
    -- Lead management
    lead_status     TEXT NOT NULL DEFAULT 'Mới'
                    CHECK (lead_status IN ('Mới', 'Đang tư vấn', 'Quan tâm cao', 'Đã chốt', 'Không quan tâm')),
    interest_level  TEXT NOT NULL DEFAULT 'Trung bình'
                    CHECK (interest_level IN ('Thấp', 'Trung bình', 'Cao', 'Rất cao')),
    tags            TEXT[] NOT NULL DEFAULT '{}',
    assignee        TEXT,
    interested_room TEXT,                   -- free text e.g. "Phòng A101"
    budget          INTEGER,                -- VND
    appointment_date TIMESTAMPTZ,
    internal_note   TEXT,
    phone           TEXT,
    
    -- Message summary (denormalized for list view performance)
    last_message         TEXT,             -- preview of last message text
    last_message_at      TIMESTAMPTZ,
    unread_count         INTEGER NOT NULL DEFAULT 0,
    last_customer_message_at TIMESTAMPTZ, -- used for 24-hour window check
    
    -- Timestamps
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint: one conversation per (psid, page_id) pair
CREATE UNIQUE INDEX uq_conversation_psid_page ON chat_conversations (psid, page_id);
CREATE INDEX idx_conversation_lead_status ON chat_conversations (lead_status);
CREATE INDEX idx_conversation_last_message_at ON chat_conversations (last_message_at DESC);
```

### 7.2 `chat_messages` table

```sql
CREATE TABLE chat_messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    
    -- Meta identifiers
    meta_mid        TEXT UNIQUE,            -- message.mid from Meta (NULL for manually-created messages)
    
    -- Message content
    direction       TEXT NOT NULL
                    CHECK (direction IN ('inbound', 'outbound')),
    message_type    TEXT NOT NULL DEFAULT 'text'
                    CHECK (message_type IN ('text', 'image', 'audio', 'file', 'system')),
    content         TEXT,                   -- text content (NULL if attachment-only)
    attachment_url  TEXT,                   -- URL for image/audio/file
    
    -- Delivery tracking
    status          TEXT NOT NULL DEFAULT 'delivered'
                    CHECK (status IN ('delivered', 'sent', 'failed', 'read')),
    error_detail    TEXT,                   -- Meta API error body on failure
    
    -- Source actor
    sender_type     TEXT NOT NULL DEFAULT 'customer'
                    CHECK (sender_type IN ('customer', 'admin', 'system')),
    sender_name     TEXT,                   -- display name of sender
    
    -- Timing
    sent_at         TIMESTAMPTZ NOT NULL DEFAULT now(),  -- when Meta reports the message was sent
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_message_conversation_sent ON chat_messages (conversation_id, sent_at DESC);
-- meta_mid UNIQUE index already covers deduplication
```

### 7.3 Design notes

- `psid` + `page_id` uniquely identifies a conversation. When a new inbound webhook arrives, `INSERT … ON CONFLICT (psid, page_id) DO UPDATE …` handles both creation and re-activation.
- `meta_mid UNIQUE` on `chat_messages` provides the idempotency guarantee for duplicate webhook delivery.
- `last_customer_message_at` is updated only on inbound messages. Used to enforce the 24-hour window check.
- `source` field is extensible: adding `'Zalo'` later requires no schema change.
- No foreign key from `chat_conversations` to `rooms` — `interested_room` is a free-text field because the customer may mention a room that doesn't exist yet or use informal names.

---

## 8. Proposed Backend Endpoints

### 8.1 Admin API

```
GET  /api/conversations
     ?lead_status=Mới&assignee=&search=&page=1&limit=20
     → { data: ChatConversationResponse[], total, page, limit }

GET  /api/conversations/:id
     → ChatConversationResponse (includes messages[])

PATCH /api/conversations/:id
     { lead_status?, assignee?, tags?, internal_note?, interested_room?,
       budget?, appointment_date?, phone?, interest_level? }
     → ChatConversationResponse

POST /api/conversations
     { psid?, page_id?, customer_name, source, phone? }
     → ChatConversationResponse
     (manual creation for conversations that didn't come via webhook)

POST /api/conversations/:id/messages
     { text: string }
     → ChatMessageResponse
     (sends outbound message via Meta Send API, stores result)

GET  /api/conversations/stats
     → { total: int, unread: int, by_lead_status: { Mới: int, … } }
```

### 8.2 Facebook Webhook API

```
GET  /api/webhooks/facebook
     ?hub.mode=subscribe&hub.verify_token=…&hub.challenge=…
     → 200 plain text: hub.challenge value

POST /api/webhooks/facebook
     Headers: X-Hub-Signature-256: sha256=<hmac>
     Body: Meta webhook event JSON
     → 200 "EVENT_RECEIVED" immediately
     (processing in background task)
```

### 8.3 Module structure

```
backend/app/modules/conversations/
    __init__.py
    models.py           # ChatConversation, ChatMessage ORM models
    schemas.py          # Pydantic DTOs
    repository.py       # DB queries (upsert, insert, list, get)
    service.py          # business logic: process_inbound, send_outbound
    router.py           # /api/conversations endpoints

backend/app/modules/webhooks/
    __init__.py
    facebook.py         # GET + POST /api/webhooks/facebook handlers
    signature.py        # HMAC-SHA256 verification helper

backend/app/integrations/
    meta_send_api.py    # HTTP client for Meta Send API (isolated, testable)
```

---

## 9. Configuration Variables

Add to `backend/app/core/config.py` (all loaded from environment):

```python
# Meta / Facebook Messenger
META_GRAPH_API_VERSION: str = "v21.0"
FACEBOOK_PAGE_ID: str = ""                  # The Facebook Page ID
FACEBOOK_PAGE_ACCESS_TOKEN: str = ""        # Long-lived Page Access Token
FACEBOOK_VERIFY_TOKEN: str = ""             # Arbitrary string for webhook handshake
FACEBOOK_APP_SECRET: str = ""               # App Secret for HMAC-SHA256 verification
FACEBOOK_WEBHOOK_ENABLED: bool = False      # Feature flag — disable webhook processing in test
```

**`.env` entries:**
```
FACEBOOK_PAGE_ID=123456789012345
FACEBOOK_PAGE_ACCESS_TOKEN=EAABsbCS...
FACEBOOK_VERIFY_TOKEN=motelmanage_webhook_secret_2026
FACEBOOK_APP_SECRET=abc123def456...
FACEBOOK_WEBHOOK_ENABLED=true
```

---

## 10. Security Considerations

| Concern | Mitigation |
|---|---|
| Webhook spoofing | Always verify `X-Hub-Signature-256` using HMAC-SHA256 before processing |
| Timing attack on signature check | Use `hmac.compare_digest()` (constant-time) |
| Token leakage in logs | Never log `PAGE_ACCESS_TOKEN` or `APP_SECRET`; log only masked versions (first 8 chars + `…`) |
| Duplicate webhook delivery | Deduplicate on `message.mid` using a UNIQUE constraint in DB |
| Replay attacks | `message.mid` uniqueness covers this; optionally add timestamp staleness check (reject events older than 1 hour) |
| Outbound authorization | `POST /api/conversations/:id/messages` requires `require_admin` dependency; admin cannot send to arbitrary PSIDs — must use existing conversation record |
| Secrets in source code | All tokens via env vars; never hardcoded; add to `.gitignore` / secrets manager |
| Test vs production | `FACEBOOK_WEBHOOK_ENABLED=false` in test environment prevents real Meta calls during tests |

---

## 11. Phase 4 Implementation Recommendation

### Include in Phase 4

| Feature | Included | Notes |
|---|---|---|
| `chat_conversations` + `chat_messages` DB tables | ✅ | Full schema from Section 7 |
| Inbound webhook receive + process | ✅ | GET verify + POST receive |
| Outbound reply via Send API | ✅ | Text messages only |
| 24-hour window enforcement | ✅ | Check `last_customer_message_at` before send |
| HMAC-SHA256 signature verification | ✅ | Non-negotiable security |
| Deduplication by `message.mid` | ✅ | UNIQUE constraint + check in service |
| Admin CRUD: list / get / patch conversation | ✅ | Lead status, assignee, notes, tags |
| Manual conversation creation | ✅ | For testing and non-webhook leads |
| Conversation stats endpoint | ✅ | For the CRM header KPIs |
| Store failed outbound messages with error | ✅ | `status=failed`, `error_detail=…` |
| `FACEBOOK_WEBHOOK_ENABLED` feature flag | ✅ | Safe to run tests without Meta |
| ngrok local development guide | ✅ | Document in README |

### Defer to Phase 5 or later

| Feature | Deferred | Reason |
|---|---|---|
| Image / audio / file attachments | Phase 5 | Needs file storage (S3); complex edge cases |
| Message templates / quick replies | Phase 5 | Not needed for MVP |
| Post comments → lead creation | Phase 5 | Requires additional webhook subscription fields |
| Zalo OA webhook integration | Phase 5 | Different API; schema already extensible via `source` field |
| AI auto-reply | Phase D (AI Agent) | Depends on AI Agent module |
| Automation triggers from conversations | Phase E | Depends on Automations module |
| Meta app review submission | Before launch | Required before any real customer can message |
| Real customer name lookup via Meta User Profile API | Phase 5 | Requires `pages_user_gender` permission scope |
| One-Time Notification (OTN) for re-engagement | Phase 5 | Complex opt-in flow |
| Read receipts / delivery status sync | Phase 5 | Requires additional webhook field: `message_reads` |

### Test strategy without real Meta account

Since `FACEBOOK_WEBHOOK_ENABLED=false` disables webhook processing:
- Conversations can be created via `POST /api/conversations` (manual creation endpoint)
- Messages can be inserted via `POST /api/conversations/:id/messages` (outbound endpoint — will skip the Meta Send API call when webhook is disabled, or call a mock)
- Integration tests mock `meta_send_api.py` to return a fake `message_id`
- A separate test can send a raw POST to `/api/webhooks/facebook` with a correctly signed body to test the inbound pipeline end-to-end

---

## 12. Open Questions

These must be confirmed before implementation begins:

| # | Question | Impact | Answer
|---|---|---|---|
| 1 | Does the owner already have a Meta Developer App and Facebook Page configured? | Determines if setup steps are needed or just integration | No I don't have |
| 2 | Will app review be submitted before launch, or is this initially internal-only? | Affects whether public testing is blocked | It is initially internal-only |
| 3 | Should the backend support multiple Facebook Pages (multiple `page_id` values)? | If yes, Page Access Token must be looked up per `page_id` in a config table, not a single env var | In first need implement one page per 1 tenant, in the future must update to multiple pages |
 | 4 | Should inbound messages trigger in-app notifications (the existing `notifications` module)? | If yes, `NotificationsService` must be called from the webhook processor | Yes, it should trigger app noti
| 5 | What is the desired behavior when the 24-hour window has expired — hard reject or allow with `HUMAN_AGENT` tag? | Determines the send endpoint response for expired windows | allow with HUMAN_AGENT |
| 6 | Should outbound messages be retried automatically on failure, or is manual retry via the frontend sufficient? | Affects whether a task queue (ARQ/Celery) is needed in Phase 4 | automatically |
| 7 | Is customer name/avatar to be fetched from Meta User Profile API on first contact, or left blank until the admin fills it in? | Requires `pages_user_gender` scope and additional API call on new conversation | Left it blank or gen system image with First character of customer name |
| 8 | Should conversations created manually (no PSID) be allowed to send via Meta? | If yes, admin must enter a PSID manually, which is unusual UX | No, only reply the conversations from fan page dont need create chat manually

---

*Research synthesized from: Meta Graph API webhooks documentation, `pages_messaging` permission reference, Meta app review policy documentation, and official Meta sample code from `fbsamples/messenger-platform-samples`. Graph API docs at `developers.facebook.com/docs/messenger-platform` are JavaScript-rendered and require a browser session to view directly.*
