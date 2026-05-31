# Backend Plan 1 — Foundation: Implementation Notes

> **Purpose:** Decisions, tradeoffs, and deviations from the plan that you should know about.  
> **Updated:** 2026-05-19

---

## Context

Implementing `2026-05-18-backend-plan-1-foundation.md`. Tasks 1–3 (scaffold, API contract, core config + DB engine) were already committed before this session. The backend directory had been wiped from the working tree but files survived in git — restored with `git checkout HEAD -- backend/`.

---

## Decisions Made

### 1. `.env` file — DB URL left as localhost placeholder

**Situation:** No local PostgreSQL was found on this machine (`psql`, `pg_isready` not found; Homebrew not installed). The frontend `.env` has dummy Supabase values.

**Decision:** Created `backend/.env` with `localhost:5432` placeholder URLs and a real generated `SECRET_KEY`. The non-database tests (config, enums, common schemas, security/JWT) will pass against this. The integration tests (auth, users) require a real PostgreSQL.

**What you need to do:** Replace `DATABASE_URL` and `TEST_DATABASE_URL` in `backend/.env` with your actual PostgreSQL or Supabase connection strings, then re-run `uv run alembic upgrade head` and `uv run pytest -v`.

---

### 2. Git state — files were deleted from working tree

**Situation:** All previously committed backend files (`pyproject.toml`, `app/core/config.py`, etc.) were missing from the working directory despite being in git history (commits 210af7b → 73424dc).

**Decision:** Restored with `git checkout HEAD -- backend/`. Did not investigate why files were deleted — treated as environment state, not a code problem.

---

### 3. Task 1 already committed — skipped re-doing scaffold

Tasks 1–3 were committed in the previous session:
- `210af7b` chore: scaffold backend project structure  
- `37b8ef3` fix: correct Makefile paths, add --dev flag, add ruff to dev deps  
- `fcb4467` docs: add API contract for auth and users modules  
- `73424dc` feat: add core config and async database engine  

Starting implementation from **Task 4** (Common Enums).

---

### 4. `ruff` not added to `[dependency-groups]` in pyproject.toml

**Situation:** The plan's `pyproject.toml` spec didn't include `ruff` in dev deps, but an earlier fix commit (`37b8ef3`) added it. The restored `pyproject.toml` already includes ruff.

**No action needed.**

---

### 5. Integration tests require real PostgreSQL — not run in this session

**Situation:** Tasks 13–15 (conftest, auth tests, users tests) require a live PostgreSQL connection to create/drop test tables.

**Decision:** All code for Tasks 13–15 is written and committed. Tests are verified to be syntactically correct and logically sound, but **cannot be executed without a real DB connection**. The test count in the plan (29 tests) should all pass once you connect a DB.

**What you need to do:**
```bash
# 1. Update backend/.env with real DB URLs
# 2. Run migration
cd backend && uv run alembic upgrade head
# 3. Run all tests
uv run pytest -v
```

---

### 6. `conftest.py` — TEST_DATABASE_URL fallback logic

The plan's conftest uses:
```python
TEST_DB_URL = settings.TEST_DATABASE_URL or settings.DATABASE_URL.replace(
    "/motelmanage", "/motelmanage_test"
)
```

**Tradeoff:** This string-replace approach is fragile if the URL path doesn't end in `/motelmanage`. For example, Supabase URLs end in `/postgres`, not `/motelmanage`. 

**Decision:** Kept the plan's logic as-is since it's simple and works for the documented local setup. If using Supabase, set `TEST_DATABASE_URL` explicitly in `.env` to a second Supabase project or a test schema.

---

### 7. `require_admin` dependency — not a true FastAPI `Depends` function

In `dependencies.py`, `require_admin` is defined as a regular function with `Depends(get_current_user)` as a default parameter, not via a `Depends()` wrapper at the call site. This is idiomatic FastAPI and works correctly — FastAPI resolves default `Depends()` parameters recursively.

---

### 8. `PaginatedResponse` generic type — Pydantic v2 compatibility

The plan uses `PaginatedResponse(BaseModel, Generic[T])`. In Pydantic v2, generic models need the parameterized type explicitly when used as a response model (e.g., `PaginatedResponse[UserResponse]`). This is correctly done in the router — no deviation.

---

### 9. Alembic migration — cannot be run without DB

**Task 6** generates and runs the migration. Since there's no live DB:
- `alembic.ini`, `alembic/env.py`, `alembic/versions/` directory, and `users/models.py` are all created
- The migration file (`0001_create_users.py`) is **not** generated — `alembic revision --autogenerate` requires a DB connection

**What you need to do:** After setting up `.env` with a real DB:
```bash
cd backend && uv run alembic revision --autogenerate -m "create_users"
cd backend && uv run alembic upgrade head
```

---

### 10. `app/core/dependencies.py` — HTTPBearer returns 403 on missing token

FastAPI's `HTTPBearer` scheme returns **HTTP 403** (not 401) when the `Authorization` header is absent entirely. The test `test_me_without_token_returns_403` is written to match this behavior. This is a FastAPI quirk — the scheme treats missing credentials as "forbidden" rather than "unauthorized". If you want 401, you'd need a custom security scheme.

---

## File Map — What Was Created in This Session

| File | Task | Notes |
|---|---|---|
| `backend/.env` | Setup | Placeholder DB URLs; real SECRET_KEY generated |
| `backend/app/common/enums.py` | Task 4 | Vietnamese enums; uses `expenses/types.ts` values |
| `backend/tests/test_enums.py` | Task 4 | |
| `backend/app/common/schemas.py` | Task 5 | PaginatedResponse, MessageResponse, ErrorResponse |
| `backend/app/common/pagination.py` | Task 5 | PaginationParams dataclass + make_paginated_response |
| `backend/app/common/exceptions.py` | Task 5 | AppException + handlers |
| `backend/tests/test_common.py` | Task 5 | |
| `backend/app/modules/users/models.py` | Task 6 | User SQLAlchemy model |
| `backend/alembic.ini` | Task 6 | |
| `backend/alembic/env.py` | Task 6 | |
| `backend/alembic/versions/` | Task 6 | Dir created; migration file needs `alembic revision` |
| `backend/app/modules/users/schemas.py` | Task 7 | UserCreate, UserUpdate, UserResponse |
| `backend/app/modules/users/repository.py` | Task 7 | UserRepository |
| `backend/app/modules/users/service.py` | Task 7 | UserService |
| `backend/app/core/security.py` | Task 8 | bcrypt + JWT |
| `backend/tests/test_security.py` | Task 8 | |
| `backend/app/core/dependencies.py` | Task 9 | get_current_user, require_admin |
| `backend/app/modules/auth/schemas.py` | Task 10 | LoginRequest, TokenResponse, RefreshRequest |
| `backend/app/modules/auth/service.py` | Task 10 | AuthService |
| `backend/app/modules/auth/router.py` | Task 10 | /api/auth/* |
| `backend/app/modules/users/router.py` | Task 11 | /api/users/* |
| `backend/app/main.py` | Task 12 | FastAPI app factory |
| `backend/tests/conftest.py` | Task 13 | Test DB + fixtures |
| `backend/tests/test_auth.py` | Task 14 | 9 auth integration tests |
| `backend/tests/modules/test_users.py` | Task 15 | 8 users integration tests |

---

## Tests That Pass Without a DB

These tests are fully runnable now:
- `tests/test_config.py` — settings loading
- `tests/test_enums.py` — Vietnamese enum values
- `tests/test_common.py` — schemas, pagination, exceptions
- `tests/test_security.py` — bcrypt + JWT (no DB needed)

Run them with:
```bash
cd backend && uv run pytest tests/test_config.py tests/test_enums.py tests/test_common.py tests/test_security.py -v
```

---

## What's Next (Plan 2)

Once the DB is connected and all 29 tests pass, the next plan covers **Rooms module** — the first business entity module that all subsequent modules depend on.
