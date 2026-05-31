# Implementation Notes — Phase 4 Module C: Conversations / Leads

> Decisions, changes, and tradeoffs made during implementation that weren't in the spec or plan.

---

## 1. Schema fields typed as `uuid.UUID`, not `str`

**Spec/Plan said:** Pydantic response schemas had `id: str` and `conversation_id: str`.

**Problem:** SQLAlchemy ORM returns `uuid.UUID` objects for `UUID(as_uuid=True)` columns. Pydantic v2 with `from_attributes=True` does not auto-coerce `uuid.UUID → str`. Validation errors: `Input should be a valid string [type=string_type, input_value=UUID(...)]`.

**Fix:** Changed `id` and `conversation_id` fields in `ChatMessageResponse`, `ChatConversationSummary`, and `ChatConversationDetail` to `uuid.UUID` — matching the pattern used by all other modules in this codebase (see `rooms/schemas.py`, `contracts/schemas.py`, etc.).

**Tradeoff:** JSON serialization still works correctly because FastAPI/Pydantic serializes `uuid.UUID` to string by default. Frontend receives a string UUID as expected.

---

## 2. `require_admin` is in `app.core.dependencies`, not `app.core.security`

**Plan said:** `from app.core.security import require_admin`

**Reality:** The dependency is in `app.core.dependencies`. Discovered by grepping existing routers. Fixed in `conversations/router.py`.

**Note for future modules:** All auth dependencies live in `app.core.dependencies`.

---

## 3. Session identity map causes stale reads in webhook notification test

**What happened:** `test_webhook_second_message_resets_notification_unread` marked a notification `read=True` using the test's `db` session, then a background task (running via `_db_factory`) committed `read=False` via a separate session. The final assertion re-queried from `db` but got the cached `read=True` value from the SQLAlchemy identity map.

**Fix:** Added `db.expire_all()` before the final assertion to flush the identity map and force a fresh DB read.

**Why this happens:** SQLAlchemy's session identity map caches ORM objects. When another session commits a change to the same row, the existing session doesn't know about it. `expire_all()` marks all cached objects as "expired" so the next access re-fetches from DB.

**Applies to:** Any test that modifies data in `db` session AND separately reads the same rows after a background task (which uses `_db_factory`) has also modified them.

---

## 4. Background task uses module-level `_db_factory`, not request session

**Why:** FastAPI `BackgroundTasks` run after the HTTP response is sent. At that point, the request-scoped `AsyncSession` from `get_db()` is already closed. Using the closed session inside the background task raises `asyncpg.exceptions.InterfaceError`.

**Implementation:** `backend/app/modules/webhooks/facebook.py` declares `_db_factory = AsyncSessionLocal` at module level. The background task calls `async with _db_factory() as db: async with db.begin():` to open a fresh session with an explicit transaction.

**Test patching:** `conftest.py` has an autouse fixture `patch_webhook_db_factory` that replaces `fb_module._db_factory = TestSessionLocal` before each test. It wraps the import in `try/except ImportError` so tests run before Task 8 creates `facebook.py` don't break.

**Tradeoff:** Module-level mutable state is a code smell. Acceptable here because it's a well-known pattern for FastAPI background tasks and the patch point is isolated to one variable.

---

## 5. `FACEBOOK_WEBHOOK_ENABLED=False` default — two effects on service

**Spec said:** When `False`, skip HMAC verification.

**Extended behaviour in service:** `ConversationService.send_outbound_message()` also skips calling `meta_send_api.send_message()` when `FACEBOOK_WEBHOOK_ENABLED=False`. The message is stored with `status="sent"` and `meta_mid=None`.

**Why:** This allows the admin API tests for outbound messaging to run without mocking `meta_send_api`. Tests that need to verify `messaging_type` / `tag` selection explicitly patch the setting via `monkeypatch.setattr(..., True)` and then monkeypatch the `send_message` function.

**Tradeoff:** `status="sent"` with `meta_mid=None` in test/dev mode is slightly misleading — the message was never actually sent. Acceptable because `FACEBOOK_WEBHOOK_ENABLED=False` is clearly a dev/test flag. When set to `True` (production), real sends happen and `meta_mid` is populated.

---

## 6. `send_outbound_message` 502 error simplification

**Plan said:** On failure, return 502 with stored message body in detail.

**Problem:** Serializing the failed `ChatMessage` via `model_dump(mode="json")` requires the schema to handle UUID → JSON correctly and is over-engineering for an error response.

**Decision:** 502 response body is simplified to `{"message": "Gửi tin nhắn thất bại", "error": "<error string>"}`. The failed message is still written to the DB as `status="failed"` with `error_detail` populated — the frontend can retrieve it via `GET /api/conversations/:id`.

---

## 7. `tenacity` retry uses `retry_if_exception(_is_retryable)`, not `retry_if_exception_type`

**Why:** The plan initially considered `retry_if_exception_type(httpx.HTTPStatusError)`, which would retry ALL HTTP errors including 4xx. A 400 Bad Request from Meta (e.g. malformed payload) should NOT be retried — it will always fail. `retry_if_exception(_is_retryable)` calls a predicate that checks `status_code >= 500`, retrying only server-side errors and network failures.

**`_is_retryable` logic:**
```python
def _is_retryable(exc):
    if isinstance(exc, httpx.HTTPStatusError):
        return exc.response.status_code >= 500
    if isinstance(exc, httpx.TransportError):
        return True
    return False
```

---

## 8. `upsert_conversation` touches `updated_at` on conflict

**Why:** The `INSERT … ON CONFLICT (psid, page_id) DO UPDATE SET updated_at=now()` ensures the conversation row's `updated_at` is bumped on every inbound message even if no other fields change (e.g. no customer_name, no phone update). This keeps the row "active" for any future ordering-by-activity queries.

**Tradeoff:** A minor write on every webhook hit. Acceptable because this is the only mutation needed for an existing conversation on upsert (all other summary fields are updated in `update_after_inbound`).

---

## 9. `GET /api/conversations/stats` registered before `GET /api/conversations/{id}`

**Why:** FastAPI resolves routes in registration order. If `/{conversation_id}` were first, a request to `/stats` would match with `conversation_id="stats"` → 404 (no UUID parse).

**Fix:** In `conversations/router.py`, `/stats` is defined before `/{conversation_id}`.

**This is a general FastAPI gotcha:** Always register literal path segments before parameterized segments at the same prefix level.

---

## 10. Notification `new_message` uses `reference_id = str(conv.id)` (conversation UUID)

**Spec said:** `reference_id` on the notification is the `conversation_id`.

**Why `str()` explicitly:** `NotificationRepository.upsert()` takes `reference_id: str`. The `conv.id` is a `uuid.UUID`. Calling `str(conv.id)` converts it to the canonical lowercase hyphenated format `"xxxxxxxx-xxxx-..."` — consistent regardless of how PostgreSQL returns it.

**Downstream:** When the frontend clicks a `new_message` notification, it should navigate to `/conversations/{reference_id}`. The UUID string in the notification row is directly usable as a URL segment.

---

## 11. `conftest.py` `patch_webhook_db_factory` fixture guards against `ImportError`

**Why:** The autouse fixture that patches `_db_factory` is defined in the session-level `conftest.py`, which is loaded before any test file. At the time `conftest.py` is loaded, `facebook.py` already exists (it's committed), so the `ImportError` guard is just a safety net for local development states where the file might not exist yet.

**Note:** If `facebook.py` is not importable, the fixture yields without patching. Webhook tests would then fail because `_db_factory` would still be the production `AsyncSessionLocal`, opening sessions against the production DB. But this is a development-only edge case.

---

## 12. `tags` column default: ORM vs DB server default

**SQLAlchemy Mapped style:** `tags: Mapped[list[str]] = mapped_column(ARRAY(Text), nullable=False, default=list)` — the `default=list` is a Python-side callable that produces `[]` when the ORM creates a new instance. This is correct.

**Why not `server_default`:** ARRAY defaults (`'{}'`) need to be set as `server_default='\'{}\'::text[]'` in Alembic. The migration uses `server_default="{}"` which PostgreSQL interprets as an empty array literal for TEXT[]. Both approaches work; the migration handles DB-level defaults and the ORM model handles Python-level defaults.

---

## 13. `ChatMessage.sent_at` uses Python fallback `datetime.utcnow()` in `insert_message`

**Why:** `sent_at` in the webhook flow is computed from Meta's `event["timestamp"]` (millisecond epoch). Passing it explicitly to `insert_message(sent_at=sent_at)` sets the correct value from Meta's side.

The `datetime.utcnow()` fallback in `insert_message` only applies when `sent_at=None` — which happens for outbound messages where `sent_at = datetime.now(tz=timezone.utc)` is passed from the service. The fallback is therefore never reached in normal operation; it's a safety net for direct calls.

**Tradeoff:** `datetime.utcnow()` is timezone-naive. Should be `datetime.now(timezone.utc)`. Not a real issue because the fallback is never reached, but could be cleaned up for code quality.
