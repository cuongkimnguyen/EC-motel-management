# Implementation Notes — Phase 2: Core Inventory (Rooms, Tenants, Contracts)

> Decisions, changes, and tradeoffs made during implementation that aren't in the spec or plan.

---

## 1. Legacy tables dropped from `moteldb`

**What happened:** When running migration `0002_create_rooms`, Alembic failed with `DuplicateTableError` because the production database already contained `rooms`, `tenants`, and `contracts` tables from a previous incompatible schema (integer PKs, PostgreSQL enum types for status, different column layout).

**Decision:** Inspected the existing data (10 rooms, 6 tenants, 5 contracts — all test/demo rows, no real tenant names or contracts). Dropped tables in dependency order via asyncpg:

```
rental_bills → facebook_posts → contracts → tenants → rooms
```

Then re-ran all migrations cleanly.

**Why this matters:** If this project is ever initialized on a fresh database, migrations will run cleanly. But if the old schema is re-encountered (e.g., on a staging DB that wasn't dropped), migrations will fail again. The solution is to always start from a clean DB or stamp the old schema with a baseline revision before migrating.

---

## 2. Contracts module stub created early (Task 3, not Task 6)

**What happened:** Room tests (Task 4) failed immediately because `RoomRepository.count_active_contracts()` does a lazy import of `Contract` at call time. When the contracts module didn't exist yet, this raised `ModuleNotFoundError` even in room-only tests.

**Decision:** Created a full `app/modules/contracts/models.py` with the complete `Contract` ORM model and `@property` methods during Task 3 (rooms implementation), before contracts tests were written in Task 6. This is a deviation from the plan's task order.

**Tradeoff:** The stub approach slightly front-loads work but prevents a false-blocked state where room tests can't run without contracts code.

---

## 3. Contract status computed at Python `@property`, not stored in DB

**Spec said:** "Status is NOT stored in the DB. It is computed at Python-level."

**Implementation:** The `Contract` model has two computed properties:

```python
@property
def status(self) -> str:
    if self.terminated_at is not None:
        return "Đã chấm dứt"
    today = date.today()
    if self.end_date < today:
        return "Đã hết hạn"
    if (self.end_date - today).days <= 30:
        return "Sắp hết hạn"
    return "Đang hiệu lực"

@property
def days_until_expiry(self) -> int | None:
    if self.terminated_at is not None:
        return None
    return max(0, (self.end_date - date.today()).days)
```

**Consequence for filtering:** Since `status` is not a DB column, list filtering by status had to be implemented via SQL date arithmetic in `ContractRepository.list_contracts()`. For example, `"Sắp hết hạn"` translates to:

```sql
WHERE terminated_at IS NULL
  AND end_date >= today
  AND end_date <= today + 30 days
```

This is correct and avoids stale data. It does mean status-based filtering logic exists in two places (Python property + SQL condition), which must stay in sync.

---

## 4. `uv run pytest` backgrounding workaround

**What happened:** Running `uv run pytest` within the `backend/` directory repeatedly caused the process to background (no output returned, shell returned immediately). This appears to be a terminal interaction issue when `uv run` spawns a subprocess in certain environments.

**Fix:** All test runs use:
```bash
source .venv/bin/activate && pytest
```

This activates the venv directly and runs pytest without the `uv run` indirection. Test results appear correctly.

**Note for future runs:** If you see `uv run pytest` hanging or returning no output, switch to the direct invocation above.

---

## 5. Tenant status is stored, not computed

**Contrast with contracts:** While contract status is fully computed at read time, tenant status (`Đang thuê`, `Sắp hết hạn`, `Đã trả phòng`, `Nợ tiền`) is stored as a DB column and explicitly updated during contract lifecycle events.

**Reasoning:** Tenant status depends on the *most recent active contract*, which requires a join. Computing it at read time for list queries (paginated, filtered) would require N+1 queries or a subquery per tenant. Storing it as a column makes read performance acceptable and keeps filtering simple.

**Side-effect contract:** Whenever a contract is created, renewed, or terminated, `TenantService` / `ContractService` must update `tenant.status` and `tenant.current_room_id` explicitly. This is a write-time coupling that's easy to miss if new code paths are added later.

---

## 6. `current_tenants` computed at read time via COUNT subquery

**The field:** `RoomResponse.current_tenants` (how many active tenants currently in the room).

**Decision:** Not stored in DB. Computed in `RoomRepository.count_active_contracts()` at read time by counting active (non-terminated, not expired) contracts for the room.

**Performance note:** This is an extra query per room in the list endpoint. For motel-scale data (< 200 rooms) this is acceptable. If performance becomes an issue, add a denormalized counter or use a SQL join.

---

## 7. Room `has_active_post` field deferred

**The field:** `RoomResponse.has_active_post` is in the API contract and `RoomResponse` schema but always returns `False` in Phase 2.

**Reason:** The Posts module is not implemented yet (Phase 3+). The field is wired to the schema so the frontend doesn't break, but the logic is a stub:

```python
has_active_post: bool = False  # populated when posts module is implemented
```

---

## 8. Contract renewal terminates old contract at its `end_date`

**Business rule (inferred):** When renewing, the old contract should be cleanly ended. The spec says "renew → creates new contract" but doesn't explicitly say what happens to the old one.

**Decision:** If the old contract is still active or expiring (not `Đã hết hạn`), set `terminated_at = contract.end_date`. If already expired, leave it as-is (expired status is sufficient).

This means the old contract will show status `Đã chấm dứt` after renewal, making the history unambiguous.

---

## 9. Test isolation via per-test DB transactions

**Approach inherited from Phase 1:** Each test runs inside a transaction that is rolled back after the test. This means tests are fully isolated — room/tenant/contract data created in one test is invisible to another.

**Implication for contract tests:** Tests that need rooms and tenants must create them within the same test (via `create_room_and_tenant()` helper). There's no shared fixture data.

---

## Test counts after Phase 2

| Suite | Tests | Status |
|-------|-------|--------|
| Phase 1 (auth + users) | 29 | ✅ all pass |
| rooms | 8 | ✅ all pass |
| tenants | 8 | ✅ all pass |
| contracts | 8 | ✅ all pass |
| **Total** | **53** | **✅ 53/53** |
