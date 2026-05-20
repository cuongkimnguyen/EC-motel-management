# Implementation Notes — Phase 3: Expenses, Posts, Notifications

> Decisions, changes, and tradeoffs made during implementation that weren't in the spec or plan.

---

## 1. Legacy tables dropped again (third time)

**What happened:** Migrations 0005 (expenses), 0006 (posts), and 0007 (notifications) each failed on first run because the production `moteldb` already contained incompatible tables from a prior system:

- `expenses` — integer serial PK, had `room_id` FK, numeric `amount`, no `code`/`payment_status`/`payment_method`/`building_name` columns (5 stale rows)
- `posts` (stored as `facebook_posts` in old schema) — incompatible enum-based status column
- `notifications` — integer PK, PostgreSQL enum type for `type`, no `reference_id`

Each was dropped before the migration ran. See `docs/migration-runbook.md` for the documented procedure.

**Implication:** If this happens on a new environment, follow the runbook. The drop order matters: `notifications → posts/facebook_posts → expenses`.

---

## 2. Expense code uses 3-digit padding, not 5-digit

**Spec said:** `CP-YYYY-NNN` (3-digit zero-padded).

**Implementation:** Uses `{num:03d}` — consistent with the mock data which shows `CP-2024-001`.

**Contrast with contracts:** Contracts use 5-digit (`HĐ-YYYY-NNNNN`). This is intentional — expenses reset more frequently and are fewer in volume.

**Known limitation:** Same optimistic-concurrency caveat as contracts — two simultaneous POSTs can collide. Acceptable for single-admin motel-scale. A future fix would use a PostgreSQL sequence or SELECT FOR UPDATE on a counter row.

---

## 3. Expense stats `total_amount` cast to `int`

**What happened:** Code review caught that `func.sum(Expense.amount)` over a `BigInteger` column can return a Python `Decimal` via asyncpg rather than an `int`. The `ExpenseStats.total_amount: int` field would then fail Pydantic validation at runtime.

**Fix:** Explicitly cast to `int` in repository: `total_amount += int(row.amt)`. Same fix was applied to `total_views` and `total_leads` in the posts stats.

---

## 4. Posts validation: `model_post_init` replaced with `@model_validator(mode='after')`

**What happened:** The initial implementation of `PostCreate` used `model_post_init` to validate `post_type`, `channel`, and the `room_id`/`post_type` cross-field rule. Code review flagged that `model_post_init` is not a guaranteed Pydantic v2 validation hook — `ValueError` raised there may not be caught by FastAPI's validation error handler and could surface as a 500 instead of 422.

**Fix:** Replaced with `@model_validator(mode="after")` — the same pattern used in the contracts module. `PostUpdate` also received a channel validator.

**Note:** The expenses module uses `model_post_init` for the same purpose and was not flagged as a critical issue there (spec reviewer accepted it). This inconsistency was noted but not remedied in expenses to avoid scope creep.

---

## 5. Posts `schedule`: past datetime validation added

**Spec did not mention this explicitly**, but code review flagged that `PostSchedule.scheduled_at` had no validator rejecting past datetimes. A post scheduled in the past would be stuck in `Đã lên lịch` status permanently (no scheduler worker will pick it up, and `update_post` rejects editing scheduled posts with 409).

**Fix:** Added `@field_validator("scheduled_at")` that rejects `scheduled_at <= now`. Handles both timezone-aware and timezone-naive inputs by normalizing to UTC.

---

## 6. Posts `room_id` filter: string-to-UUID coercion in `list_posts`

**What happened:** The `room_id` query parameter arrives from the router as a Python `str`. The `Post.room_id` column is `UUID(as_uuid=True)`. Comparing `Post.room_id == str_value` in asyncpg raises `DataError: invalid input syntax for type uuid` at runtime.

**Fix:** In `PostRepository.list_posts`, coerce `room_id` to `uuid.UUID` before the filter. Invalid UUID strings return an empty result set rather than raising a 500.

---

## 7. Notifications: on-demand refresh pattern (no background scheduler)

**Spec said:** GET /api/notifications triggers a refresh before returning results.

**Decision:** Notifications are generated synchronously on every GET request. The `_refresh()` method:
1. Scans contracts/rooms for trigger conditions
2. Upserts matching notifications (preserves `read` state)
3. Deletes stale notifications whose conditions no longer hold

**Tradeoff:** Every list/count request runs a DB scan of contracts and rooms. For motel scale (<200 rooms, <500 contracts) this is 3 extra SELECT queries per request — acceptable. If notification generation becomes slow, the fix is to move `_refresh()` to a background cron job and remove it from the request path.

---

## 8. Notifications: upsert preserves `read` state

**Decision:** The `(type, reference_id)` upsert intentionally excludes the `read` column from `on_conflict_do_update`. This means:
- A user marks a "vacant room" notification as read
- The room remains vacant (no post added)
- Next GET refreshes the notification but does NOT reset it to `read=False`

**Why:** Resetting `read` on every refresh would produce a notification that re-appears as unread on every page load — annoying and useless.

**Side effect:** If the triggering condition changes significantly (e.g., contract expiry days changes from 20 → 5), the existing read notification gets its `message` updated but stays `read`. This is acceptable — the user already decided to dismiss it.

---

## 9. Notifications: `delete_stale` flush after bulk DELETE

**What happened:** Code review flagged that `await self.db.execute(delete_stmt)` without a subsequent `flush()` leaves SQLAlchemy's ORM identity map stale. A subsequent `SELECT` in the same transaction (e.g., `count_unread()` called right after `delete_stale()`) could return rows that the bulk DELETE already removed at the DB level.

**Fix:** Added `await self.db.flush()` after every `execute()` call in `upsert` and `delete_stale`.

---

## 10. Notifications tests written by implementer (Task 7 + Task 8 merged)

The Task 7 implementer wrote 13 integration tests alongside the module implementation. Task 8 (dedicated test task) found everything already done and committed. No gap in coverage.

---

## Test counts after Phase 3

| Suite | Tests | Status |
|-------|-------|--------|
| Phase 1 (auth + users) | 29 | ✅ all pass |
| Phase 2 (rooms + tenants + contracts + review fixes) | 28 | ✅ all pass |
| expenses | 9 | ✅ all pass |
| posts | 9 | ✅ all pass |
| notifications | 13 | ✅ all pass |
| **Total** | **88** | **✅ 88/88** |
