# Backend Build Plan — MotelManage

> **Status:** Blueprint only — no code generated yet.
> **Scope:** Architecture, module boundaries, entity model, DB schema, API rollout order, risks.
> **Source of truth:** `docs/frontend-business-spec.md`, `frontend/src/lib/mockData.ts`,
>   all `types.ts` and `*Service.ts` files in the frontend.
> **Last updated:** 2026-04-04

---

## Table of Contents

1. [Target Architecture](#1-target-architecture)
2. [Module Boundaries](#2-module-boundaries)
3. [Entity Relationship Model](#3-entity-relationship-model)
4. [Database Design Draft](#4-database-design-draft)
5. [API Rollout Order](#5-api-rollout-order)
6. [Risk List](#6-risk-list)

---

## 1. Target Architecture

### Tech Stack

| Concern | Choice | Rationale |
|---|---|---|
| Language | **Python 3.12** | Modern typing, async support, rich ecosystem |
| Framework | **FastAPI** | Async-first, auto OpenAPI/Swagger, Pydantic validation built-in, dependency injection via `Depends()` |
| Database | **PostgreSQL** via Supabase | Already provisioned in `.env` (`NEXT_PUBLIC_SUPABASE_URL`) |
| ORM | **SQLAlchemy 2.x** (async) | Industry standard; `asyncpg` driver for async queries |
| Migrations | **Alembic** | Pairs with SQLAlchemy; auto-generates migration scripts |
| Validation | **Pydantic v2** | FastAPI's native schema layer; used for all DTOs |
| Auth | **python-jose** (JWT) + **passlib** (bcrypt) | Standard FastAPI auth recipe |
| Task scheduler | **APScheduler** (AsyncIOScheduler) | Lightweight in-process cron; fits single-instance MVP |
| LLM | **anthropic** Python SDK | `ANTHROPIC_API_KEY` in `.env`; fallback: `openai` SDK |
| File storage | **supabase-py** | Same Supabase instance; buckets: `room-images`, `expense-receipts` |
| Excel export | **openpyxl** | Pure Python, no dependencies |
| PDF export | **WeasyPrint** | HTML→PDF, works well for report layouts |
| HTTP client | **httpx** | Async; used for external API calls (Facebook, Zalo) |
| Testing | **pytest** + **pytest-asyncio** + **httpx** (`AsyncClient`) | |
| API docs | FastAPI built-in | Swagger UI at `/docs`, ReDoc at `/redoc` |
| Dependency management | **uv** (or pip + `requirements.txt`) | Fast, modern |
| Settings | **pydantic-settings** | Type-safe `.env` loading |

### Layered Architecture

Every module follows a strict four-layer structure. No layer may bypass its neighbour.

```
HTTP Request
     │
     ▼
┌───────────────────────────────────────────────────────┐
│  Router  (APIRouter)                                   │
│  • Declares routes, HTTP verbs, status codes           │
│  • Reads request, calls service, returns response      │
│  • No business logic                                   │
└──────────────────────┬────────────────────────────────┘
                       │
                       ▼
┌───────────────────────────────────────────────────────┐
│  Service                                               │
│  • Business rules, validations, orchestration          │
│  • Calls repository; never touches SQLAlchemy directly │
│  • Raises HTTPException on business rule violations    │
└──────────────────────┬────────────────────────────────┘
                       │
                       ▼
┌───────────────────────────────────────────────────────┐
│  Repository                                            │
│  • SQLAlchemy queries only                             │
│  • Returns ORM models or plain dicts                   │
│  • No business logic                                   │
└──────────────────────┬────────────────────────────────┘
                       │
                       ▼
┌───────────────────────────────────────────────────────┐
│  Database  (PostgreSQL / Supabase)                     │
└───────────────────────────────────────────────────────┘
```

Cross-cutting concerns live in `app/core/` and `app/common/`:

| File | Purpose |
|---|---|
| `core/security.py` | JWT creation/verification, password hashing |
| `core/dependencies.py` | `get_current_user()`, `require_roles()`, `get_db()` |
| `core/config.py` | `Settings` class (pydantic-settings, reads `.env`) |
| `core/database.py` | SQLAlchemy async engine + session factory |
| `common/exceptions.py` | Custom `AppException`, global exception handlers |
| `common/schemas.py` | Shared Pydantic models: `PaginatedResponse`, `DateRange` |
| `common/enums.py` | All Vietnamese status enums as Python `Enum` classes |
| `common/pagination.py` | `PaginationParams` dependency, `paginate()` helper |

### Folder Structure

```
backend/
├── app/
│   ├── main.py                     # FastAPI factory, middleware, lifespan hooks
│   ├── core/
│   │   ├── config.py               # pydantic-settings: Settings class
│   │   ├── database.py             # async SQLAlchemy engine, get_db()
│   │   ├── security.py             # JWT utils, bcrypt helpers
│   │   └── dependencies.py         # Shared FastAPI Depends()
│   ├── common/
│   │   ├── enums.py                # RoomStatus, ContractStatus, etc.
│   │   ├── exceptions.py           # AppException, handlers
│   │   ├── pagination.py           # PaginationParams, paginate()
│   │   └── schemas.py              # PaginatedResponse[T], MessageResponse
│   └── modules/
│       ├── auth/
│       │   ├── router.py
│       │   ├── service.py
│       │   └── schemas.py
│       ├── users/
│       │   ├── router.py
│       │   ├── service.py
│       │   ├── repository.py
│       │   ├── models.py           # SQLAlchemy ORM model
│       │   └── schemas.py          # Pydantic in/out
│       ├── rooms/
│       ├── tenants/
│       ├── contracts/
│       ├── expenses/
│       ├── posts/
│       ├── conversations/
│       ├── reports/
│       ├── notifications/
│       ├── agent/
│       ├── automations/
│       ├── dashboard/
│       └── activity/
├── alembic/
│   ├── env.py
│   └── versions/
├── tests/
│   ├── conftest.py                 # Fixtures: test DB, test client
│   └── modules/
│       ├── test_rooms.py
│       ├── test_contracts.py
│       └── ...
├── .env
├── pyproject.toml                  # Project metadata, tool config (ruff, mypy)
└── requirements.txt
```

Each module follows the same internal structure:

```
modules/<name>/
├── router.py       # APIRouter: routes, path params, response_model
├── service.py      # Business logic, calls repository
├── repository.py   # SQLAlchemy async queries
├── models.py       # SQLAlchemy ORM model (table mapping)
└── schemas.py      # Pydantic: CreateDTO, UpdateDTO, ResponseDTO, FilterParams
```

---

## 2. Module Boundaries

Each module owns its ORM models, schemas, service, repository, and router.
Cross-module data access is done via service-to-service injection (`Depends()`), never via
direct repository cross-calls.

### `auth`
- **Owns:** JWT strategy, login/logout, token refresh
- **Does not own:** User entity (that is `users`)
- **Inbound deps:** `users.service` (fetch user by email, verify password)
- **Endpoints:** `POST /login`, `POST /logout`, `GET /me`, `POST /refresh`

### `users`
- **Owns:** `User` model (id, email, password_hash, full_name, role, is_active)
- **Roles:** `admin` (Chủ nhà), `manager` (Quản lý), `staff` (Nhân viên)
- **Consumed by:** `auth`, `expenses` (created_by), `posts` (assignee FK), `automations`, `notifications`

### `rooms`
- **Owns:** `Room` model — all physical room data, status management
- **Exposes:** `RoomService.get_available_rooms()` — used by contracts and posts
- **Business rules:**
  - `code` must be globally unique
  - `current_tenants` is a denormalized counter; updated atomically with contract mutations
  - `has_active_post` is computed at query time via LEFT JOIN on posts — not stored
  - Status transitions: `Trống ↔ Đã đặt ↔ Đang thuê ↔ Bảo trì`
  - Bulk actions (status change, delete) implemented as batch operations in one DB round-trip

### `tenants`
- **Owns:** `Tenant` model — personal info, debt balance
- **Exposes:** `TenantService.get_by_id()` used by contracts
- **Business rules:**
  - `cccd` must be unique
  - `debt` field updated by payment/contract flows, never directly via tenant PATCH
  - Effective status derived from active contract: no active contract → `Đã trả phòng`
  - `current_room_id`, `contract_code`, `start_date` are virtual fields computed from active contract in the response DTO

### `contracts`
- **Owns:** `Contract` model — rental agreements and lifecycle transitions
- **Depends on:** `rooms` (room must exist, must have no active contract), `tenants`
- **Business rules:**
  - Only one contract per room may be `Đang hiệu lực` or `Sắp hết hạn` at a time
  - `Sắp hết hạn` = `end_date − today ≤ 30 days` — computed at query time, never stored
  - `days_until_expiry` is a computed virtual field in the response DTO
  - **Renew:** mark current contract `Đã hết hạn`, create new contract — immutable old record
  - **Terminate:** set `status = Đã chấm dứt`, write `termination_reason` + `termination_date`
  - APScheduler nightly job: `ContractService.sync_expiry_statuses()` → creates notifications

### `expenses`
- **Owns:** `Expense` model — operational costs
- **Depends on:** `rooms` (optional room link), `users` (created_by)
- **Business rules:**
  - `expense_code` auto-generated: `CP-{YYYY}-{NNN:03d}` using DB sequence
  - `room_id` nullable (building-wide vs room-specific)
  - `is_recurring = True` flag; recurring auto-creation handled by APScheduler (Phase 6)

### `posts`
- **Owns:** `Post` model — marketing content
- **Depends on:** `rooms` (vacant room picker — only `Trống` rooms)
- **Business rules:**
  - Publish immediately: `status = Đã đăng`, `posted_date = now()` (Phase 5: calls Facebook/Zalo API)
  - Schedule: `status = Đã lên lịch`, `planned_date = requested_time`; APScheduler triggers at that time
  - Duplicate: deep copy of all fields, new id, `status = Nháp`

### `conversations`
- **Owns:** `ChatConversation` + `ChatMessage` models — incoming leads
- **Depends on:** `rooms` (soft ref via `interested_room` room code)
- **Business rules:**
  - Lead lifecycle: `Mới → Đang tư vấn → Quan tâm cao → Đã chốt / Không quan tâm`
  - `unread_count` decremented when conversation is fetched
  - Phase 7: new conversations arrive via Facebook Messenger Webhook

### `reports`
- **Owns:** No ORM models. Pure aggregation queries across other tables.
- **Depends on:** `rooms`, `contracts`, `expenses`, `tenants`, `payment_records`
- **Query patterns:**
  - Revenue = `SUM(monthly_rent)` of active contracts in period
  - Expense = `SUM(amount)` from expenses in period
  - Occupancy = `COUNT(occupied rooms) / COUNT(all rooms) × 100`
  - Debt = `SUM(amount_due - amount_paid)` across unpaid payment_records

### `notifications`
- **Owns:** `Notification` model
- **Created by:** APScheduler jobs in `contracts`, `rooms`, `tenants` (not by API callers)
- **Business rules:**
  - `user_id = NULL` = broadcast to all admins
  - Polling-based delivery in Phase 2; WebSocket upgrade is a Phase 6+ option

### `agent`
- **Owns:** `AgentConversation` model (persisted chat history per session)
- **Depends on:** all modules (fetches live data to populate system prompt)
- **Business rules:**
  - `session_id` is a UUID generated by the frontend on first chat load
  - System prompt built by `AgentContextBuilder`: queries room/contract/expense stats
  - LLM: Anthropic Claude (primary via `anthropic` SDK), OpenAI (fallback)
  - Context cache: computed once per session, TTL 5 minutes (in-memory or Redis)

### `automations`
- **Owns:** `Automation` + `AgentTaskHistory` models
- **Business rules:**
  - On create/enable: register with APScheduler using cron expression
  - On toggle off: remove APScheduler job, set `is_enabled = False`
  - Manual run: execute action handler immediately, write to `agent_task_history`
  - `status = error` if last execution raised an unhandled exception

### `dashboard`
- **Owns:** No models. Single aggregation endpoint.
- **Depends on:** `rooms`, `contracts`, `expenses`, `tenants`
- **Returns:** all KPIs in one response to minimize frontend round-trips

### `activity`
- **Owns:** `ActivityLog` model — event log for the dashboard activity feed
- **Written by:** All modules call `ActivityService.log_event()` after significant mutations
  (create, update, delete, status change)

---

## 3. Entity Relationship Model

```
┌────────────┐          ┌───────────────┐           ┌─────────┐
│   users    │─────────►│   expenses    │◄──────────│  rooms  │
│            │   1:N    └───────────────┘  0..N     │         │
│            │                                      │         │
│            │          ┌───────────────┐  0..N     │         │
│            │─────────►│     posts     │◄──────────│         │
└────────────┘   1:N    └──────┬────────┘           │         │
                               │ 0..N               │         │
                               ▼                    │         │
                     ┌──────────────────┐           │         │
                     │chat_conversations│           │         │
                     └────────┬─────────┘           │  1..N   │
                              │ 1                   │         │
                              ▼                     ▼         │
                     ┌──────────────────┐  ┌──────────────┐  │
                     │  chat_messages   │  │  contracts   │  │
                     └──────────────────┘  │  room_id FK  │◄─┘
                                           │ tenant_id FK │
                     ┌─────────┐   0..N    └──────┬───────┘
                     │ tenants │◄──────────────────┘
                     └─────────┘
                          │ 1..N
                          ▼
                ┌────────────────────┐
                │  payment_records   │
                └────────────────────┘

┌────────────────┐    ┌─────────────────────┐
│  automations   │───►│  agent_task_history │
└────────────────┘    └─────────────────────┘

┌──────────────────────┐    ┌──────────────────────┐
│  agent_conversations │    │     notifications    │
└──────────────────────┘    └──────────────────────┘

┌──────────────────────┐    ┌────────────────┐
│  workflow_templates  │    │  activity_log  │
└──────────────────────┘    └────────────────┘
```

### Cardinalities

| Relationship | Type | Notes |
|---|---|---|
| Room → Contracts | 1 : N | Many contracts over time; at most 1 active at a time |
| Room → Expenses | 1 : N | Nullable; many expenses may reference a room |
| Room → Posts | 1 : N | One room may have many posts over time |
| Tenant → Contracts | 1 : N | Tenant may have rented multiple times |
| Contract → Room | N : 1 | Enforced at DB level via partial unique index |
| Contract → Tenant | N : 1 | Tenant can have one active contract |
| Contract → PaymentRecords | 1 : N | One record per billing month |
| Post → ChatConversations | 1 : N | Leads generated from a post |
| ChatConversation → ChatMessages | 1 : N | Message thread |
| Automation → AgentTaskHistory | 1 : N | Execution log entries |
| User → Expenses | 1 : N | created_by |
| User → Notifications | 1 : N | Per-user alerts (NULL = all admins) |

---

## 4. Database Design Draft

> **Conventions:**
> - All monetary values: `INTEGER` (VND, no decimals)
> - All PKs: `UUID` default `gen_random_uuid()`
> - All dates: `DATE` or `TIMESTAMPTZ` — never `VARCHAR`
> - Vietnamese status strings stored as-is (matches frontend TypeScript enums exactly)
> - `created_at` / `updated_at` on all mutable tables

---

### `users`

```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(255) NOT NULL,
  role          VARCHAR(20)  NOT NULL DEFAULT 'staff',   -- admin | manager | staff
  avatar_url    VARCHAR(500),
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

---

### `rooms`

```sql
CREATE TABLE rooms (
  id                UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  code              VARCHAR(20)   UNIQUE NOT NULL,      -- e.g. P101, PB03
  name              VARCHAR(255)  NOT NULL,
  floor             VARCHAR(50)   NOT NULL,             -- e.g. Tầng 1
  block             VARCHAR(50)   NOT NULL,             -- Khu A | Khu B | Khu C
  area              NUMERIC(6,2)  NOT NULL,             -- m²
  rent_price        INTEGER       NOT NULL,             -- VND/month
  deposit           INTEGER       NOT NULL,             -- VND
  electricity_price INTEGER       NOT NULL,             -- VND/kWh
  water_price       INTEGER       NOT NULL,             -- VND/m³
  service_fee       INTEGER       NOT NULL,             -- VND/month
  max_tenants       SMALLINT      NOT NULL DEFAULT 2,
  current_tenants   SMALLINT      NOT NULL DEFAULT 0,   -- denormalized counter
  status            VARCHAR(20)   NOT NULL DEFAULT 'Trống',
                      -- Trống | Đang thuê | Đã đặt | Bảo trì
  description       TEXT,
  images            JSONB         NOT NULL DEFAULT '[]',  -- string[] of storage URLs
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rooms_block   ON rooms(block);
CREATE INDEX idx_rooms_status  ON rooms(status);
```

`has_active_post` is **not stored** — computed via LEFT JOIN on `posts` at query time.

---

### `tenants`

```sql
CREATE TABLE tenants (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name         VARCHAR(255) NOT NULL,
  phone             VARCHAR(20)  NOT NULL,
  cccd              VARCHAR(20)  UNIQUE NOT NULL,       -- National ID
  gender            VARCHAR(10)  NOT NULL,              -- Nam | Nữ
  date_of_birth     DATE         NOT NULL,
  permanent_address TEXT         NOT NULL,
  occupation        VARCHAR(255),
  license_plate     VARCHAR(50),
  debt              INTEGER      NOT NULL DEFAULT 0,    -- VND outstanding (derived, see Risk R4)
  notes             TEXT,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tenants_phone ON tenants(phone);
CREATE INDEX idx_tenants_cccd  ON tenants(cccd);
```

`current_room_id`, `status`, `contract_code`, `start_date` are **virtual fields** computed
from the active contract in the Pydantic response schema — not stored on this table.

---

### `contracts`

```sql
CREATE TABLE contracts (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code                VARCHAR(30) UNIQUE NOT NULL,      -- e.g. HĐ-2025-001
  room_id             UUID        NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
  tenant_id           UUID        NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  start_date          DATE        NOT NULL,
  end_date            DATE        NOT NULL,
  monthly_rent        INTEGER     NOT NULL,
  deposit             INTEGER     NOT NULL,
  billing_cycle       SMALLINT    NOT NULL DEFAULT 1,   -- months between payments
  payment_due_day     SMALLINT    NOT NULL,             -- 1–31
  status              VARCHAR(30) NOT NULL DEFAULT 'Đang hiệu lực',
                        -- Đang hiệu lực | Sắp hết hạn | Đã hết hạn | Đã chấm dứt
  termination_reason  TEXT,
  termination_date    DATE,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_contract_dates CHECK (end_date > start_date)
);

CREATE INDEX idx_contracts_room_id   ON contracts(room_id);
CREATE INDEX idx_contracts_tenant_id ON contracts(tenant_id);
CREATE INDEX idx_contracts_status    ON contracts(status);
CREATE INDEX idx_contracts_end_date  ON contracts(end_date);

-- Enforce one active contract per room at the DB level
CREATE UNIQUE INDEX uq_active_contract_per_room
  ON contracts(room_id)
  WHERE status IN ('Đang hiệu lực', 'Sắp hết hạn');
```

`days_until_expiry` is a **computed virtual field** in the response DTO:
`(end_date - date.today()).days` if status is active, else `None`.

---

### `expenses`

```sql
CREATE TABLE expenses (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_code     VARCHAR(20) UNIQUE NOT NULL,         -- e.g. CP-2025-001
  title            VARCHAR(255) NOT NULL,
  category         VARCHAR(50)  NOT NULL,
                     -- Điện nước | Internet | Vệ sinh | Sửa chữa |
                     -- Mua sắm | Lương / quản lý | Chi phí khác
  amount           INTEGER      NOT NULL,               -- VND
  expense_date     DATE         NOT NULL,
  payment_status   VARCHAR(30)  NOT NULL,
                     -- Đã thanh toán | Chưa thanh toán | Chờ xử lý
  payment_method   VARCHAR(30)  NOT NULL,
                     -- Tiền mặt | Chuyển khoản | Khác
  building_name    VARCHAR(50)  NOT NULL,               -- Khu A | Khu B | Khu C
  room_id          UUID         REFERENCES rooms(id) ON DELETE SET NULL,  -- nullable
  note             TEXT         NOT NULL DEFAULT '',
  attachment_count SMALLINT     NOT NULL DEFAULT 0,
  receipt_image    VARCHAR(500),
  is_recurring     BOOLEAN      NOT NULL DEFAULT FALSE,
  created_by       UUID         REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_expenses_expense_date   ON expenses(expense_date);
CREATE INDEX idx_expenses_category       ON expenses(category);
CREATE INDEX idx_expenses_payment_status ON expenses(payment_status);
CREATE INDEX idx_expenses_building_name  ON expenses(building_name);
CREATE INDEX idx_expenses_room_id        ON expenses(room_id);
```

---

### `posts`

```sql
CREATE TABLE posts (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  title        VARCHAR(500) NOT NULL,
  content      TEXT         NOT NULL,
  room_id      UUID         REFERENCES rooms(id) ON DELETE SET NULL,  -- nullable
  post_type    VARCHAR(30)  NOT NULL,
                 -- Tuyển khách | Khuyến mãi | Thông báo
  channel      VARCHAR(30)  NOT NULL,
                 -- Facebook Page | Facebook Group | Zalo
  planned_date TIMESTAMPTZ,
  posted_date  TIMESTAMPTZ,
  status       VARCHAR(20)  NOT NULL DEFAULT 'Nháp',
                 -- Nháp | Đã lên lịch | Đã đăng | Lỗi
  fb_link      VARCHAR(500),
  views        INTEGER      NOT NULL DEFAULT 0,
  messages     INTEGER      NOT NULL DEFAULT 0,
  leads        INTEGER      NOT NULL DEFAULT 0,
  converted    INTEGER      NOT NULL DEFAULT 0,
  hashtags     TEXT,
  price        INTEGER,                                   -- VND
  area         NUMERIC(6,2),                              -- m²
  assignee     VARCHAR(255),
  thumbnail    VARCHAR(500),
  created_by   UUID         REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_posts_status       ON posts(status);
CREATE INDEX idx_posts_channel      ON posts(channel);
CREATE INDEX idx_posts_room_id      ON posts(room_id);
CREATE INDEX idx_posts_planned_date ON posts(planned_date);
```

---

### `chat_conversations`

```sql
CREATE TABLE chat_conversations (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name    VARCHAR(255) NOT NULL,
  customer_avatar  VARCHAR(10),                          -- initials fallback
  source           VARCHAR(30)  NOT NULL,
                     -- Facebook Page | Facebook Group | Zalo
  last_message     TEXT,
  last_time        TIMESTAMPTZ,
  unread_count     SMALLINT     NOT NULL DEFAULT 0,
  tags             JSONB        NOT NULL DEFAULT '[]',   -- string[]
  lead_status      VARCHAR(30)  NOT NULL DEFAULT 'Mới',
                     -- Mới | Đang tư vấn | Quan tâm cao | Đã chốt | Không quan tâm
  phone            VARCHAR(20),
  interested_room  VARCHAR(50),                          -- room code (soft reference)
  budget           INTEGER,
  appointment_date TIMESTAMPTZ,
  internal_note    TEXT,
  assignee         VARCHAR(255),
  interest_level   VARCHAR(20)  NOT NULL DEFAULT 'Trung bình',
                     -- Thấp | Trung bình | Cao | Rất cao
  external_id      VARCHAR(255),                         -- Facebook thread ID (Phase 7)
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conversations_lead_status ON chat_conversations(lead_status);
```

---

### `chat_messages`

```sql
CREATE TABLE chat_messages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID        NOT NULL
                    REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender          VARCHAR(20) NOT NULL,                  -- customer | staff
  text            TEXT,
  image           VARCHAR(500),
  timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read            BOOLEAN     NOT NULL DEFAULT FALSE,

  CONSTRAINT chk_message_content CHECK (text IS NOT NULL OR image IS NOT NULL)
);

CREATE INDEX idx_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX idx_messages_timestamp       ON chat_messages(timestamp);
```

---

### `notifications`

```sql
CREATE TABLE notifications (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  type           VARCHAR(30) NOT NULL,
                   -- contract_expiry | vacant_room | overdue_payment | maintenance
  title          VARCHAR(255) NOT NULL,
  message        TEXT         NOT NULL,
  priority       VARCHAR(10)  NOT NULL DEFAULT 'medium', -- high | medium | low
  read           BOOLEAN      NOT NULL DEFAULT FALSE,
  reference_id   UUID,                                   -- e.g. contract.id
  reference_type VARCHAR(30),                            -- 'contract' | 'room' | 'tenant'
  user_id        UUID         REFERENCES users(id) ON DELETE CASCADE,  -- NULL = all admins
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id    ON notifications(user_id);
CREATE INDEX idx_notifications_read       ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

---

### `automations`

```sql
CREATE TABLE automations (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name              VARCHAR(255) NOT NULL,
  description       TEXT,
  trigger_type      VARCHAR(20)  NOT NULL,               -- schedule | event | condition
  frequency         VARCHAR(20),                         -- daily | weekly | monthly | custom
  run_time          VARCHAR(10),                         -- e.g. "08:00"
  module            VARCHAR(30)  NOT NULL,
                      -- rooms | contracts | tenants | expenses | reports | posts | general
  condition         TEXT,
  action            TEXT         NOT NULL,
  notify_recipient  VARCHAR(255),
  notify_channel    VARCHAR(20),                         -- in_app | email | sms | zalo
  status            VARCHAR(20)  NOT NULL DEFAULT 'draft',
                      -- active | paused | error | draft
  is_enabled        BOOLEAN      NOT NULL DEFAULT TRUE,
  last_run_at       TIMESTAMPTZ,
  next_run_at       TIMESTAMPTZ,
  run_count         INTEGER      NOT NULL DEFAULT 0,
  created_by        UUID         REFERENCES users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_automations_status ON automations(status);
CREATE INDEX idx_automations_module ON automations(module);
```

---

### `agent_task_history`

```sql
CREATE TABLE agent_task_history (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(255) NOT NULL,
  task_type       VARCHAR(30)  NOT NULL,
                    -- ai_summary | automation | ai_generated | scan | digest
  trigger_source  VARCHAR(30)  NOT NULL,
                    -- manual | automation | ai_suggestion | schedule
  status          VARCHAR(20)  NOT NULL,
                    -- completed | running | failed | cancelled
  result_summary  TEXT,
  module          VARCHAR(30)  NOT NULL,
  automation_id   UUID         REFERENCES automations(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_task_history_status     ON agent_task_history(status);
CREATE INDEX idx_task_history_created_at ON agent_task_history(created_at DESC);
```

---

### `agent_conversations`

```sql
CREATE TABLE agent_conversations (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        VARCHAR(100) NOT NULL,               -- UUID from frontend
  role              VARCHAR(20)  NOT NULL,               -- user | assistant
  content           TEXT         NOT NULL,
  message_type      VARCHAR(30)  NOT NULL DEFAULT 'text',
                      -- text | summary | list | action_suggestion
  related_module    VARCHAR(30),
  suggested_actions JSONB,                               -- SuggestedAction[]
  list_items        JSONB,                               -- string[]
  user_id           UUID         REFERENCES users(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_conv_session_id ON agent_conversations(session_id);
CREATE INDEX idx_agent_conv_user_id    ON agent_conversations(user_id);
```

---

### `workflow_templates`

```sql
CREATE TABLE workflow_templates (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(255) NOT NULL,
  description    TEXT,
  trigger        VARCHAR(255) NOT NULL,
  outcome        VARCHAR(255) NOT NULL,
  module         VARCHAR(30)  NOT NULL,
  estimated_time VARCHAR(50)  NOT NULL,
  is_builtin     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

Seeded with the 6 templates visible in the frontend mock (`mockAgentData.ts`).

---

### `activity_log`

```sql
CREATE TABLE activity_log (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type     VARCHAR(50) NOT NULL,   -- e.g. room.created, contract.terminated
  description    TEXT        NOT NULL,
  module         VARCHAR(30) NOT NULL,
  reference_id   UUID,
  reference_type VARCHAR(30),
  actor_id       UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX idx_activity_log_module     ON activity_log(module);
```

---

### `payment_records` *(inferred — not in mock data, but required by Reports and Tenant tabs)*

```sql
CREATE TABLE payment_records (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id     UUID        NOT NULL REFERENCES contracts(id) ON DELETE RESTRICT,
  tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  billing_period  VARCHAR(20) NOT NULL,                  -- e.g. "2025-03"
  amount_due      INTEGER     NOT NULL,
  amount_paid     INTEGER     NOT NULL DEFAULT 0,
  paid_at         TIMESTAMPTZ,
  payment_method  VARCHAR(30),
  status          VARCHAR(30) NOT NULL DEFAULT 'Chưa thanh toán',
                    -- Đúng hạn | Sắp đến hạn | Quá hạn | Đã thanh toán
  note            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_records_contract_id   ON payment_records(contract_id);
CREATE INDEX idx_payment_records_tenant_id     ON payment_records(tenant_id);
CREATE INDEX idx_payment_records_billing_period ON payment_records(billing_period);
```

Auto-generated when a contract is created: one record per billing month for the contract duration.

---

## 5. API Rollout Order

Build phases follow the dependency chain. Each phase is independently deployable.

---

### Phase 1 — Foundation *(unblocks all authenticated routes)*

| # | Module | Key endpoints |
|---|---|---|
| 1 | **DB + Alembic** | `alembic revision --autogenerate`, `alembic upgrade head` |
| 2 | **auth** | `POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/me` · `POST /api/auth/refresh` |
| 3 | **users** | `GET /api/users/me` · `PATCH /api/users/me` · admin: full CRUD |

**Done when:** JWT flow works end-to-end; all subsequent routes reject unauthenticated requests.

---

### Phase 2 — Core Inventory *(unblocks room, tenant, contract screens)*

| # | Module | Key endpoints | Frontend unblocked |
|---|---|---|---|
| 4 | **rooms** | CRUD · `GET /stats` · `PATCH /:id/status` · `POST /bulk-delete` · `POST /bulk-status` | `/room-management` |
| 5 | **tenants** | CRUD · `GET /stats` · `GET /:id/contracts` · `GET /:id/payments` | `/tenant-management` |
| 6 | **contracts** | CRUD · `POST /:id/renew` · `POST /:id/terminate` · `GET /expiring` · `GET /stats` · `POST /bulk-delete` | `/contract-management` |

---

### Phase 3 — Financial Operations *(unblocks expenses and dashboard)*

| # | Module | Key endpoints | Frontend unblocked |
|---|---|---|---|
| 7 | **expenses** | CRUD · `PATCH /:id/mark-paid` · `GET /stats` · `GET /export` | `/expenses` |
| 8 | **activity** | Internal: `ActivityService.log_event()` wired into all Phase 2–3 mutations | Dashboard feed |
| 9 | **dashboard** | `GET /api/dashboard/stats` · `GET /api/dashboard/activity` | `/dashboard` |

---

### Phase 4 — Reporting & Notifications

| # | Module | Key endpoints | Frontend unblocked |
|---|---|---|---|
| 10 | **reports** | `GET /api/reports/overview` · `/revenue-expense-trend` · `/expense-breakdown` · `/occupancy-by-building` · `/debt-trend` · `/tenant-debt-list` · `/export` | `/reports` |
| 11 | **notifications** | `GET /api/notifications` · `PATCH /:id/read` · `POST /mark-all-read` · `GET /count` | Topbar bell |
| 12 | **APScheduler: expiry scan** | Nightly cron → `ContractService.sync_expiry_statuses()` → writes `notifications` | Alert panel |

---

### Phase 5 — Marketing & Leads

| # | Module | Key endpoints | Frontend unblocked |
|---|---|---|---|
| 13 | **posts** | CRUD · `POST /:id/publish` · `POST /:id/schedule` · `POST /:id/duplicate` · `GET /stats` | `/post-management` |
| 14 | **conversations** | `GET /api/conversations` · `GET /:id` · `PATCH /:id` · `POST /:id/messages` · `GET /stats` | Leads panel |

---

### Phase 6 — AI & Automation

| # | Module | Key endpoints | Frontend unblocked |
|---|---|---|---|
| 15 | **agent** | `POST /api/agent/chat` · `GET /api/agent/overview` · `GET /api/agent/alerts` · `GET /api/agent/task-history` | `/agent` chat |
| 16 | **automations** | CRUD · `PATCH /:id/toggle` · `POST /:id/run` · `GET /:id/logs` | `/agent` automation list |
| 17 | **workflow_templates** | `GET /api/workflow-templates` · `POST /:id/use` | `/agent` templates |

---

### Phase 7 — External Integrations

| # | Integration | Notes |
|---|---|---|
| 18 | **Facebook Graph API** | OAuth page token management, post publishing via `/me/feed`, incoming messages via Messenger Webhook |
| 19 | **Zalo API** | ZNS / OA message publishing; different auth model (OA access token) |
| 20 | **Email** (SMTP / Resend) | Tenant payment reminders, monthly digest |
| 21 | **File storage** | `supabase-py` Storage client; `PUT /api/rooms/:id/images`, `PUT /api/expenses/:id/receipt` |
| 22 | **Recurring expenses** | APScheduler monthly job: auto-create expense records where `is_recurring = True` |
| 23 | **Export (Excel/PDF)** | openpyxl for `.xlsx`; WeasyPrint for PDF; streamed as file response |

---

## 6. Risk List

### R1 — Contract status staleness (HIGH)
**Problem:** `status` is stored on the `contracts` row. A contract moves from `Đang hiệu lực` to
`Sắp hết hạn` when `end_date − today ≤ 30 days` — but only if something updates the row.

**Mitigation:**
- Compute `days_until_expiry` and effective status at read time in the repository query
  (`CURRENT_DATE - end_date` via SQLAlchemy expression).
- Do NOT rely on the stored `status` column alone for expiry checks.
- APScheduler nightly job `sync_expiry_statuses()` batch-updates `status` for correctness.
- Index `contracts.end_date` to make this scan fast.

---

### R2 — One-active-contract-per-room race condition (HIGH)
**Problem:** Two concurrent requests could both pass the application-level "is room free?" check
and both insert active contracts for the same room.

**Mitigation:**
- Enforce at DB level via partial unique index:
  ```sql
  CREATE UNIQUE INDEX uq_active_contract_per_room
    ON contracts(room_id)
    WHERE status IN ('Đang hiệu lực', 'Sắp hết hạn');
  ```
- The application layer checks first; the DB index is the last-resort safety net.

---

### R3 — `current_tenants` counter drift (MEDIUM)
**Problem:** `rooms.current_tenants` is denormalized. If the contract mutation and counter
update are not atomic, they can diverge.

**Mitigation:** Wrap all contract create/terminate operations and their `current_tenants`
side-effects in a single SQLAlchemy `async with session.begin()` transaction block. Never
update them in separate requests.

---

### R4 — Tenant `debt` not derived from payment records (MEDIUM)
**Problem:** `tenants.debt` is a raw integer field. Once `payment_records` is introduced,
debt should be `SUM(amount_due − amount_paid)` across unpaid records. Both can coexist
and diverge.

**Mitigation:** Once `payment_records` is live (Phase 3), make `tenants.debt` a read-only
computed field in the Pydantic response schema, derived via aggregate query. Mark the column
as non-writable in the ORM model. Use a DB view or computed column to back it if performance
requires.

---

### R5 — Vietnamese string enums as DB values (MEDIUM)
**Problem:** Storing `"Đang thuê"`, `"Trống"` etc. directly in the DB means typos or encoding
issues silently create orphan values.

**Mitigation:**
- Define Python `enum.Enum` classes for all status fields in `app/common/enums.py`.
- Use SQLAlchemy `Enum(PythonEnum, native_enum=False)` column type so the DB stores the
  string but the ORM enforces the allowed set.
- Add `CHECK` constraints in Alembic migrations as a belt-and-suspenders guard.

---

### R6 — Building is a loose string, not an entity (LOW-MEDIUM)
**Problem:** `"Khu A"` appears on `rooms`, `expenses`, and reports filters. Renaming a block
or adding one requires a multi-table data migration.

**Mitigation:** Do not create a `buildings` table yet — the spec explicitly marks this as
"inferred, not confirmed." Validate against an allowed list in the Pydantic schema using
`Literal["Khu A", "Khu B", "Khu C"]`. Record as known tech debt.

---

### R7 — LLM context quality for AI Agent (MEDIUM)
**Problem:** The mock agent uses keyword matching. Real LLM calls need a structured system prompt
loaded with live data (room stats, expiring contracts, overdue tenants) to produce useful answers.

**Mitigation:**
- Build `AgentContextBuilder` service: queries current stats from all modules, formats into a
  structured system prompt string.
- Cache the built context per session for 5 minutes (in-process dict or Redis).
- Keep system prompt under 4 000 tokens; summarize instead of raw-dumping data.

---

### R8 — APScheduler in multi-process deployment (MEDIUM)
**Problem:** FastAPI with `uvicorn --workers N` runs N separate processes. APScheduler runs
in-process, so each worker independently fires the same automation/cron job.

**Mitigation:**
- For MVP: single-worker deployment (`uvicorn app.main:app`). Document this constraint.
- For scaling: replace APScheduler with **Celery Beat** + Redis broker, or use a dedicated
  `scheduler` process that is not replicated.

---

### R9 — Facebook / Zalo API complexity (HIGH — Phase 7)
**Problem:** Facebook Graph API requires OAuth, page access tokens (expiry management),
webhook verification, rate-limit handling, and handling of comment/message events separately.
Zalo has a distinct auth model.

**Mitigation:**
- Design `posts` and `conversations` modules with a `ChannelProvider` abstract class from
  Phase 5. Phase 5 ships with `MockChannelProvider`; Phase 7 swaps in
  `FacebookChannelProvider` and `ZaloChannelProvider` behind the same interface.
- Isolate all external API logic in `app/integrations/` — never inside module services.

---

### R10 — Payment records entity is inferred (LOW)
**Problem:** The Tenant detail "Thanh toán" tab and the Reports "FinancialReport" both imply a
payment record per billing cycle, but no mock entity exists in the frontend. We are designing
this table from inference alone.

**Mitigation:** Auto-generate payment records when a contract is created (one per billing month
for the contract duration). Expose `GET /api/tenants/:id/payments` returning these records.
Validate the shape matches what the frontend renders in the detail modal before shipping Phase 2.

---

### R11 — No frontend login / settings page (LOW)
**Problem:** `/login` and `/settings` are not yet implemented in the frontend. The backend auth
endpoints will be ready but the frontend cannot use them until those pages are built.

**Mitigation:** Auth backend is built first (Phase 1) regardless. Test with Postman or Bruno.
Frontend login page is a parallel workstream — it must not block backend progress.

---

*End of backend build plan.*
*Next step: confirm tech stack and Phase 1 scope, then generate `backend/` scaffold starting with
`pyproject.toml`, `alembic/env.py`, and `prisma/schema.prisma` → Alembic equivalent (`models.py` + migration).*
