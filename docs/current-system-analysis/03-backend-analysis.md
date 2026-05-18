# 03 — Backend Analysis

> **WARNING: Backend is NOT implemented. This document describes the PLANNED architecture from `docs/backend-build-plan.md` only.**
>
> The `backend/` directory is **completely empty**. No source code, no configuration, no migrations exist. Every section below is prefixed with **[PLANNED — NOT IMPLEMENTED]** to make this explicit.
>
> _Confidence: High (directly from `docs/backend-build-plan.md`)_

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [Layered Architecture](#2-layered-architecture)
3. [Planned Folder Structure](#3-planned-folder-structure)
4. [Module Boundaries](#4-module-boundaries)
5. [Database Schema](#5-database-schema)
6. [Virtual / Computed Fields](#6-virtual--computed-fields)
7. [Partial Unique Indexes](#7-partial-unique-indexes)
8. [Entity Relationship Cardinalities](#8-entity-relationship-cardinalities)
9. [Authentication Plan](#9-authentication-plan)
10. [APScheduler Jobs](#10-apscheduler-jobs)
11. [Phase Rollout Order](#11-phase-rollout-order)
12. [Risk Register](#12-risk-register)

---

## 1. Tech Stack

**[PLANNED — NOT IMPLEMENTED]**

| Layer / Concern | Chosen Technology |
|---|---|
| Runtime | Python 3.12 |
| Web Framework | FastAPI |
| Database | PostgreSQL via Supabase |
| ORM | SQLAlchemy 2.x (async) |
| Migrations | Alembic |
| Data Validation | Pydantic v2 |
| Auth (JWT + password) | python-jose + passlib |
| Background Scheduling | APScheduler |
| LLM Integration | anthropic SDK (primary), OpenAI (fallback) |
| File Storage | supabase-py storage |
| Excel Export | openpyxl |
| PDF Export | WeasyPrint |
| HTTP Client | httpx |
| Testing | pytest + pytest-asyncio |

---

## 2. Layered Architecture

**[PLANNED — NOT IMPLEMENTED]**

Every module follows a strict 4-layer architecture. No layer may bypass its direct neighbour.

```
HTTP Request
     │
     ▼
┌──────────────────────────────────────────────────────┐
│  Router  (app/modules/<module>/router.py)             │
│  • Declares routes, HTTP verbs, path params           │
│  • Calls Service layer only                           │
│  • Returns HTTP response — zero business logic        │
└───────────────────────┬──────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────┐
│  Service  (app/modules/<module>/service.py)           │
│  • Business rules, validation, orchestration          │
│  • Calls Repository layer                             │
│  • Raises HTTPException on domain errors              │
└───────────────────────┬──────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────┐
│  Repository  (app/modules/<module>/repository.py)     │
│  • SQLAlchemy async queries only                      │
│  • Returns ORM models or plain dicts                  │
│  • Zero business logic                                │
└───────────────────────┬──────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────┐
│  Database  (PostgreSQL / Supabase)                    │
└──────────────────────────────────────────────────────┘
```

### Cross-cutting Concerns

**[PLANNED — NOT IMPLEMENTED]**

| File | Responsibility |
|---|---|
| `app/core/security.py` | JWT creation / verification, password hashing |
| `app/core/dependencies.py` | `get_current_user()`, `require_roles()`, `get_db()` FastAPI dependencies |
| `app/core/config.py` | `Settings` class (pydantic-settings), reads `.env` |
| `app/core/database.py` | SQLAlchemy async engine + async session factory |
| `app/common/exceptions.py` | `AppException`, global exception handlers |
| `app/common/schemas.py` | `PaginatedResponse[T]`, `MessageResponse` |
| `app/common/enums.py` | Vietnamese status enums as Python `Enum` |
| `app/common/pagination.py` | `PaginationParams`, `paginate()` helper |

---

## 3. Planned Folder Structure

**[PLANNED — NOT IMPLEMENTED]**

```
backend/
├── app/
│   ├── main.py
│   ├── core/
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── security.py
│   │   └── dependencies.py
│   ├── common/
│   │   ├── enums.py
│   │   ├── exceptions.py
│   │   ├── pagination.py
│   │   └── schemas.py
│   └── modules/
│       ├── auth/              # router.py, service.py, schemas.py
│       ├── users/             # router.py, service.py, repository.py, models.py, schemas.py
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
│   ├── conftest.py
│   └── modules/
├── .env
├── pyproject.toml
└── requirements.txt
```

---

## 4. Module Boundaries

**[PLANNED — NOT IMPLEMENTED]**

### 4.1 auth

- **Owns:** JWT strategy, login/logout flow, token refresh
- **Dependencies:** users module (for credential lookup)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Authenticate, return access + refresh tokens |
| POST | `/api/auth/logout` | Invalidate session / revoke token |
| GET | `/api/auth/me` | Return current authenticated user |
| POST | `/api/auth/refresh` | Exchange refresh token for new access token |

---

### 4.2 users

- **Owns:** `User` model — id, email, password_hash, full_name, role, is_active
- **Roles:**
  - `admin` — Chủ nhà (full access)
  - `manager` — Quản lý
  - `staff` — Nhân viên
- **Consumed by:** auth, expenses, posts, automations, notifications

---

### 4.3 rooms

- **Owns:** `Room` model
- **Business rules:**
  - `code` is globally unique
  - `current_tenants` is a denormalized counter updated by contract events
  - `has_active_post` is computed via LEFT JOIN on posts — NOT stored in DB
  - Status transitions: `Trống` ↔ `Đã đặt` ↔ `Đang thuê` ↔ `Bảo trì`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/rooms` | List rooms (pagination, filter, sort) |
| POST | `/api/rooms` | Create room |
| GET | `/api/rooms/:id` | Get room by ID |
| PUT | `/api/rooms/:id` | Update room |
| DELETE | `/api/rooms/:id` | Delete room |
| PATCH | `/api/rooms/:id/status` | Update room status |
| POST | `/api/rooms/bulk-delete` | Bulk delete rooms |
| POST | `/api/rooms/bulk-status` | Bulk status change |
| GET | `/api/rooms/stats` | Aggregate stats |

---

### 4.4 tenants

- **Owns:** `Tenant` model
- **Business rules:**
  - `cccd` (citizen ID) is globally unique
  - `debt` field is updated only by payment/contract flows — never directly via PATCH
  - `current_room_id`, `status`, `contract_code`, `start_date` are **virtual** fields computed from the active contract

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tenants` | List tenants |
| POST | `/api/tenants` | Create tenant |
| GET | `/api/tenants/:id` | Get tenant by ID |
| PUT | `/api/tenants/:id` | Update tenant |
| DELETE | `/api/tenants/:id` | Delete tenant |
| GET | `/api/tenants/:id/contracts` | Tenant's contract history |
| GET | `/api/tenants/:id/payments` | Tenant's payment records |
| GET | `/api/tenants/stats` | Aggregate stats |

---

### 4.5 contracts

- **Owns:** `Contract` model + full lifecycle management
- **Business rules:**
  - Only ONE contract per room with status `Đang hiệu lực` or `Sắp hết hạn` — enforced via partial unique index at DB level
  - `Sắp hết hạn` = end_date − today ≤ 30 days (computed, NOT stored)
  - `days_until_expiry` is a virtual field
  - **Renew:** mark old contract as `Đã hết hạn` + create new contract
  - **Terminate:** set status = `Đã chấm dứt` + write `termination_reason` + `termination_date`
  - APScheduler nightly job: `sync_expiry_statuses()` scans and updates statuses

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/contracts` | List contracts |
| POST | `/api/contracts` | Create contract |
| GET | `/api/contracts/:id` | Get contract by ID |
| PUT | `/api/contracts/:id` | Update contract |
| DELETE | `/api/contracts/:id` | Delete contract |
| POST | `/api/contracts/:id/renew` | Renew contract |
| POST | `/api/contracts/:id/terminate` | Terminate contract |
| GET | `/api/contracts/expiring` | List expiring contracts |
| GET | `/api/contracts/stats` | Aggregate stats |
| POST | `/api/contracts/bulk-delete` | Bulk delete |
| GET | `/api/contracts/export` | Export to Excel/PDF |

---

### 4.6 expenses

- **Owns:** `Expense` model
- **Business rules:**
  - `expense_code` is auto-generated in format `CP-{YYYY}-{NNN}`
  - `room_id` is nullable (motel-wide vs room-specific expenses)
  - `is_recurring` flag marks repeating expenses

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/expenses` | List expenses |
| POST | `/api/expenses` | Create expense |
| GET | `/api/expenses/:id` | Get expense by ID |
| PUT | `/api/expenses/:id` | Update expense |
| DELETE | `/api/expenses/:id` | Delete expense |
| PATCH | `/api/expenses/:id/mark-paid` | Mark expense as paid |
| GET | `/api/expenses/stats` | Aggregate stats |
| GET | `/api/expenses/export` | Export to Excel/PDF |

---

### 4.7 posts

- **Owns:** `Post` model
- **Business rules:**
  - **Publish immediately:** status = `Đã đăng` + `posted_date` = now()
  - **Schedule:** status = `Đã lên lịch` + `planned_date` set
  - **Duplicate:** deep copy of post + new id + status = `Nháp`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/posts` | List posts |
| POST | `/api/posts` | Create post |
| GET | `/api/posts/:id` | Get post by ID |
| PUT | `/api/posts/:id` | Update post |
| DELETE | `/api/posts/:id` | Delete post |
| POST | `/api/posts/:id/publish` | Publish immediately |
| POST | `/api/posts/:id/schedule` | Schedule for later |
| POST | `/api/posts/:id/duplicate` | Duplicate post |
| GET | `/api/posts/stats` | Aggregate stats |

---

### 4.8 conversations

- **Owns:** `ChatConversation` + `ChatMessage` models
- **Business rules:**
  - Lead lifecycle: `Mới` → `Đang tư vấn` → `Quan tâm cao` → `Đã chốt` / `Không quan tâm`
  - `unread_count` is decremented when messages are fetched

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/conversations` | List conversations |
| GET | `/api/conversations/:id` | Get conversation by ID |
| PATCH | `/api/conversations/:id` | Update conversation metadata |
| POST | `/api/conversations/:id/messages` | Send / create message |
| GET | `/api/conversations/stats` | Aggregate stats |

---

### 4.9 reports

- **Owns:** No ORM models — pure aggregation layer
- **Formulas:**
  - Revenue = `SUM(monthly_rent)` of active contracts
  - Expense = `SUM(amount)` from expenses
  - Occupancy = `occupied_rooms / total_rooms × 100`
  - Debt = `SUM(amount_due - amount_paid)` from payment records

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/reports/overview` | High-level KPIs |
| GET | `/api/reports/revenue-expense-trend` | Time-series revenue vs expense |
| GET | `/api/reports/expense-breakdown` | Expense by category |
| GET | `/api/reports/occupancy-by-building` | Occupancy rate per block |
| GET | `/api/reports/debt-trend` | Debt over time |
| GET | `/api/reports/tenant-debt-list` | Per-tenant debt detail |
| GET | `/api/reports/export` | Export full report |

---

### 4.10 notifications

- **Owns:** `Notification` model
- **Business rules:**
  - Notifications are **created by APScheduler jobs**, not by API callers directly
  - `user_id = NULL` means broadcast to all admins

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/notifications` | List notifications for current user |
| PATCH | `/api/notifications/:id/read` | Mark single notification as read |
| POST | `/api/notifications/mark-all-read` | Mark all as read |
| GET | `/api/notifications/count` | Unread count |

---

### 4.11 agent

- **Owns:** `AgentConversation` model (persisted chat history)
- **Business rules:**
  - `session_id` = UUID generated by the frontend on first chat message
  - System prompt is built by `AgentContextBuilder` which queries live room/contract/expense stats
  - Primary LLM: Anthropic Claude; fallback: OpenAI

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/agent/chat` | Send message to AI agent |
| GET | `/api/agent/overview` | Agent context overview |
| GET | `/api/agent/alerts` | Current system alerts |
| GET | `/api/agent/task-history` | AI task execution history |
| GET | `/api/agent/quick-actions` | Suggested quick actions |

---

### 4.12 automations

- **Owns:** `Automation` + `AgentTaskHistory` models
- **Business rules:**
  - On create/enable → register APScheduler cron job
  - On toggle off → remove job from scheduler + set `is_enabled = False`
  - Manual run → execute task immediately + write to task history
  - `status = error` if execution raises an unhandled exception

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/automations` | List automations |
| POST | `/api/automations` | Create automation |
| GET | `/api/automations/:id` | Get automation by ID |
| PUT | `/api/automations/:id` | Update automation |
| DELETE | `/api/automations/:id` | Delete automation |
| PATCH | `/api/automations/:id/toggle` | Enable / disable |
| POST | `/api/automations/:id/run` | Manual run |
| GET | `/api/automations/:id/logs` | Execution logs |
| GET | `/api/workflow-templates` | List workflow templates |
| POST | `/api/workflow-templates` | Create workflow template |
| POST | `/api/workflow-templates/:id/use` | Instantiate from template |

---

### 4.13 dashboard

- **Owns:** No ORM models — single aggregation endpoint
- **Dependencies:** rooms, contracts, tenants, expenses

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard/stats` | Aggregated dashboard KPIs |
| GET | `/api/dashboard/activity` | Recent activity feed |

---

### 4.14 activity

- **Owns:** `ActivityLog` model
- **Business rules:** Written by all modules via `ActivityService.log_event()` after significant mutations (creates, updates, deletes, status changes)

---

## 5. Database Schema

**[PLANNED — NOT IMPLEMENTED]**

### 5.1 users

```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(255) NOT NULL,
    role            VARCHAR(20)  NOT NULL DEFAULT 'staff',
    avatar_url      VARCHAR(500),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.2 rooms

```sql
CREATE TABLE rooms (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code                VARCHAR(20) UNIQUE NOT NULL,
    name                VARCHAR(255) NOT NULL,
    floor               VARCHAR(50) NOT NULL,
    block               VARCHAR(50) NOT NULL,
    area                NUMERIC(6,2) NOT NULL,
    rent_price          INTEGER NOT NULL,
    deposit             INTEGER NOT NULL,
    electricity_price   INTEGER NOT NULL,
    water_price         INTEGER NOT NULL,
    service_fee         INTEGER NOT NULL,
    max_tenants         SMALLINT DEFAULT 2,
    current_tenants     SMALLINT DEFAULT 0,
    status              VARCHAR(20) DEFAULT 'Trống',
    description         TEXT,
    images              JSONB DEFAULT '[]',
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rooms_block  ON rooms (block);
CREATE INDEX idx_rooms_status ON rooms (status);
```

### 5.3 tenants

```sql
CREATE TABLE tenants (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name           VARCHAR(255) NOT NULL,
    phone               VARCHAR(20) NOT NULL,
    cccd                VARCHAR(20) UNIQUE NOT NULL,
    gender              VARCHAR(10) NOT NULL,
    date_of_birth       DATE NOT NULL,
    permanent_address   TEXT NOT NULL,
    occupation          VARCHAR(255),
    license_plate       VARCHAR(50),
    debt                INTEGER DEFAULT 0,
    notes               TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tenants_phone ON tenants (phone);
CREATE INDEX idx_tenants_cccd  ON tenants (cccd);

-- VIRTUAL (computed at query time, not stored):
-- current_room_id, current_room_code, status, contract_code, start_date
```

### 5.4 contracts

```sql
CREATE TABLE contracts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code                VARCHAR(30) UNIQUE NOT NULL,
    room_id             UUID NOT NULL REFERENCES rooms(id),
    tenant_id           UUID NOT NULL REFERENCES tenants(id),
    start_date          DATE NOT NULL,
    end_date            DATE NOT NULL,
    monthly_rent        INTEGER NOT NULL,
    deposit             INTEGER NOT NULL,
    billing_cycle       SMALLINT DEFAULT 1,
    payment_due_day     SMALLINT NOT NULL,
    status              VARCHAR(30) DEFAULT 'Đang hiệu lực',
    termination_reason  TEXT,
    termination_date    DATE,
    notes               TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT chk_end_after_start CHECK (end_date > start_date)
);

-- Enforces at most one active contract per room at the DB level
CREATE UNIQUE INDEX uidx_contracts_active_room
    ON contracts (room_id)
    WHERE status IN ('Đang hiệu lực', 'Sắp hết hạn');

CREATE INDEX idx_contracts_room_id   ON contracts (room_id);
CREATE INDEX idx_contracts_tenant_id ON contracts (tenant_id);
CREATE INDEX idx_contracts_status    ON contracts (status);
CREATE INDEX idx_contracts_end_date  ON contracts (end_date);

-- VIRTUAL (computed, not stored):
-- days_until_expiry = (end_date - CURRENT_DATE)
```

### 5.5 expenses

```sql
CREATE TABLE expenses (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_code        VARCHAR(20) UNIQUE NOT NULL,  -- format: CP-{YYYY}-{NNN}
    title               VARCHAR(255) NOT NULL,
    category            VARCHAR(50) NOT NULL,
    amount              INTEGER NOT NULL,
    expense_date        DATE NOT NULL,
    payment_status      VARCHAR(30) NOT NULL,
    payment_method      VARCHAR(30) NOT NULL,
    building_name       VARCHAR(50) NOT NULL,
    room_id             UUID REFERENCES rooms(id) ON DELETE SET NULL,
    note                TEXT DEFAULT '',
    attachment_count    SMALLINT DEFAULT 0,
    receipt_image       VARCHAR(500),
    is_recurring        BOOLEAN DEFAULT FALSE,
    created_by          UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_expenses_date            ON expenses (expense_date);
CREATE INDEX idx_expenses_category        ON expenses (category);
CREATE INDEX idx_expenses_payment_status  ON expenses (payment_status);
CREATE INDEX idx_expenses_building_name   ON expenses (building_name);
CREATE INDEX idx_expenses_room_id         ON expenses (room_id);
```

### 5.6 posts

```sql
CREATE TABLE posts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(500) NOT NULL,
    content         TEXT NOT NULL,
    room_id         UUID REFERENCES rooms(id) ON DELETE SET NULL,
    post_type       VARCHAR(30) NOT NULL,
    channel         VARCHAR(30) NOT NULL,
    planned_date    TIMESTAMPTZ,
    posted_date     TIMESTAMPTZ,
    status          VARCHAR(20) DEFAULT 'Nháp',
    fb_link         VARCHAR(500),
    views           INTEGER DEFAULT 0,
    messages        INTEGER DEFAULT 0,
    leads           INTEGER DEFAULT 0,
    converted       INTEGER DEFAULT 0,
    hashtags        TEXT,
    price           INTEGER,
    area            NUMERIC(6,2),
    assignee        VARCHAR(255),
    thumbnail       VARCHAR(500),
    created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_posts_status       ON posts (status);
CREATE INDEX idx_posts_channel      ON posts (channel);
CREATE INDEX idx_posts_room_id      ON posts (room_id);
CREATE INDEX idx_posts_planned_date ON posts (planned_date);
```

### 5.7 chat_conversations

```sql
CREATE TABLE chat_conversations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name       VARCHAR(255) NOT NULL,
    customer_avatar     VARCHAR(10),
    source              VARCHAR(30) NOT NULL,
    last_message        TEXT,
    last_time           TIMESTAMPTZ,
    unread_count        SMALLINT DEFAULT 0,
    tags                JSONB DEFAULT '[]',
    lead_status         VARCHAR(30) DEFAULT 'Mới',
    phone               VARCHAR(20),
    interested_room     VARCHAR(50),
    budget              INTEGER,
    appointment_date    TIMESTAMPTZ,
    internal_note       TEXT,
    assignee            VARCHAR(255),
    interest_level      VARCHAR(20) DEFAULT 'Trung bình',
    external_id         VARCHAR(255),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.8 chat_messages

```sql
CREATE TABLE chat_messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    sender          VARCHAR(10) NOT NULL,   -- 'customer' | 'staff'
    text            TEXT,
    image           VARCHAR(500),
    timestamp       TIMESTAMPTZ DEFAULT NOW(),
    read            BOOLEAN DEFAULT FALSE
);
```

### 5.9 payment_records

Tracks individual rent payment instances per contract / tenant / billing month.

_(Full DDL to be defined during Phase 2 implementation.)_

### 5.10 automations

```sql
CREATE TABLE automations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    trigger_type    VARCHAR(50),
    frequency       VARCHAR(50),
    status          VARCHAR(30),
    last_run_at     TIMESTAMPTZ,
    next_run_at     TIMESTAMPTZ,
    module          VARCHAR(50),
    is_enabled      BOOLEAN DEFAULT TRUE,
    run_count       INTEGER DEFAULT 0,
    created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.11 agent_task_history

```sql
CREATE TABLE agent_task_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255),
    task_type       VARCHAR(50),
    trigger_source  VARCHAR(50),
    status          VARCHAR(30),
    result_summary  TEXT,
    module          VARCHAR(50),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.12 agent_conversations

```sql
CREATE TABLE agent_conversations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id          UUID NOT NULL,
    role                VARCHAR(20) NOT NULL,   -- 'user' | 'assistant' | 'system'
    content             TEXT NOT NULL,
    message_type        VARCHAR(30),
    related_module      VARCHAR(50),
    suggested_actions   JSONB,
    list_items          JSONB,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.13 notifications

```sql
CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,  -- NULL = all admins
    type        VARCHAR(50),
    title       VARCHAR(255),
    message     TEXT,
    date        TIMESTAMPTZ DEFAULT NOW(),
    read        BOOLEAN DEFAULT FALSE,
    priority    VARCHAR(20)
);
```

### 5.14 activity_log

```sql
CREATE TABLE activity_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type      VARCHAR(50),
    entity_type     VARCHAR(50),
    entity_id       UUID,
    description     TEXT,
    created_by      UUID,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.15 workflow_templates

Predefined automation templates. Full DDL to be defined during Phase 4 implementation.

---

## 6. Virtual / Computed Fields

**[PLANNED — NOT IMPLEMENTED]**

These fields are NOT stored as columns in the database. They are computed at query time or returned as enriched response fields.

| Model | Virtual Field | Computation |
|---|---|---|
| `Room` | `has_active_post` | LEFT JOIN on `posts` WHERE status = 'Đã đăng' |
| `Tenant` | `current_room_id` | FROM active contract (status IN 'Đang hiệu lực', 'Sắp hết hạn') |
| `Tenant` | `current_room_code` | JOIN through active contract → room |
| `Tenant` | `status` | Derived from active contract existence |
| `Tenant` | `contract_code` | FROM active contract |
| `Tenant` | `start_date` | FROM active contract start_date |
| `Contract` | `days_until_expiry` | `(end_date - CURRENT_DATE).days` |

> **Note on `contracts.status = 'Sắp hết hạn'`:** There is an ambiguity in the build plan. The status value `Sắp hết hạn` is described in two contradictory ways:
> 1. As a **computed** value (end_date − today ≤ 30 days) that should never be stored
> 2. As a **stored** status field that is updated nightly by `sync_expiry_statuses()` APScheduler job
>
> The partial unique index definition (`WHERE status IN ('Đang hiệu lực', 'Sắp hết hạn')`) implies the status IS stored in the column. The APScheduler job approach (writing the value to the row nightly) appears to be the intended implementation. This must be clarified before the contracts module is built.

---

## 7. Partial Unique Indexes

**[PLANNED — NOT IMPLEMENTED]**

| Table | Index | Purpose |
|---|---|---|
| `contracts` | `UNIQUE (room_id) WHERE status IN ('Đang hiệu lực', 'Sắp hết hạn')` | Enforces that at most one active contract can exist per room at the database level. Terminated/expired contracts are excluded from this constraint, allowing full contract history. |

---

## 8. Entity Relationship Cardinalities

**[PLANNED — NOT IMPLEMENTED]**

| Relationship | Type | Notes |
|---|---|---|
| Room → Contracts | 1:N | At most 1 active at a time (enforced by partial unique index) |
| Room → Expenses | 1:N | `room_id` nullable; expense can be motel-wide |
| Room → Posts | 1:N | |
| Tenant → Contracts | 1:N | Full history preserved |
| Contract → Room | N:1 | Partial unique index limits active contracts to 1 per room |
| Contract → Tenant | N:1 | |
| Contract → PaymentRecords | 1:N | One record per billing month |
| Post → ChatConversations | 1:N | Leads generated from posts |
| ChatConversation → ChatMessages | 1:N | |
| Automation → AgentTaskHistory | 1:N | |
| User → Expenses | 1:N | via `created_by` |
| User → Notifications | 1:N | `user_id = NULL` means broadcast to all admins |

---

## 9. Authentication Plan

**[PLANNED — NOT IMPLEMENTED]**

### JWT Flow

```
POST /api/auth/login
    ↓
Validate email + password (bcrypt via passlib)
    ↓
Issue: access_token (short TTL) + refresh_token (long TTL)
    ↓
Client stores tokens (httpOnly cookie OR localStorage)
    ↓
All subsequent API calls: Authorization: Bearer <access_token>
    ↓
POST /api/auth/refresh to obtain new access_token when expired
```

### Role Matrix

| Role | Vietnamese Label | Access Scope |
|---|---|---|
| `admin` | Chủ nhà | Full access to all modules |
| `manager` | Quản lý | rooms, contracts, tenants, expenses, reports |
| `staff` | Nhân viên | posts, chat/conversations |

### Route Protection

All protected endpoints use `Depends(get_current_user)`. Role-restricted endpoints additionally use `Depends(require_roles([...]))`. Both are defined in `app/core/dependencies.py`.

---

## 10. APScheduler Jobs

**[PLANNED — NOT IMPLEMENTED]**

| Job | Module | Schedule | Action |
|---|---|---|---|
| `sync_expiry_statuses()` | contracts | Nightly | Scan contracts; update status to `Sắp hết hạn` where `end_date - today ≤ 30`; create notifications for approaching expirations |
| Automation cron jobs | automations | Per automation config | Register/remove jobs dynamically when automations are enabled/disabled |
| `scheduled_post_publisher()` | posts | Phase 5 | Publish posts where `status = 'Đã lên lịch'` and `planned_date ≤ NOW()` |

> APScheduler will run **in-process** (same FastAPI process). This is a known risk for production scale — see Risk Register below.

---

## 11. Phase Rollout Order

**[PLANNED — NOT IMPLEMENTED]**

| Phase | Modules / Tasks |
|---|---|
| Phase 1 | Database schema (Alembic), Auth, Rooms |
| Phase 2 | Tenants, Contracts, Expenses |
| Phase 3 | Reports, Posts, Chat / Leads (conversations) |
| Phase 4 | Notifications, AI Agent chat, Automations |
| Phase 5 | Facebook API, Zalo API, Zalo notifications, Email delivery, File storage (Supabase) |

---

## 12. Risk Register

**[PLANNED — NOT IMPLEMENTED]**

| # | Risk | Description | Mitigation |
|---|---|---|---|
| R-01 | Tenant debt sync | `tenant.debt` is a denormalized field. It can drift out of sync if payment/contract events are not transactional. | Only update `debt` inside explicit service methods; never allow direct PATCH; add periodic reconciliation job |
| R-02 | Partial unique index edge case | PostgreSQL partial unique index on `contracts` includes `Sắp hết hạn` status. If APScheduler updates the status and there is a race condition with a new contract insert, constraint violations could occur. | Use `SELECT FOR UPDATE` or serializable transactions when changing contract status |
| R-03 | Vietnamese string encoding | Vietnamese characters in status enums, error messages, and DB data require consistent UTF-8 handling across Python, SQLAlchemy, and PostgreSQL. | Set `client_encoding = UTF8` on DB connection; use Python `str` (Unicode) throughout; never use `bytes` for text fields |
| R-04 | APScheduler in-process | Running APScheduler inside FastAPI means scheduler state is lost on restart and does not scale horizontally. | Acceptable for Phase 1–3; migrate to Celery + Redis or a dedicated worker process in production |
| R-05 | LLM context window | AgentContextBuilder queries live stats and injects them into the system prompt. As data grows, the prompt may exceed Claude's context window. | Summarise / truncate context; cache context snapshots; log token usage per request |
| R-06 | payment_records vs tenant.debt denormalization | `tenant.debt` may diverge from the sum of `(amount_due - amount_paid)` in `payment_records` if records are created asynchronously or errors occur. | Treat `payment_records` as the authoritative source; `tenant.debt` is a cached summary updated within the same transaction |
| R-07 | `Sắp hết hạn` status ambiguity | The build plan describes `Sắp hết hạn` both as a computed value and as a stored status. This needs resolution before the contracts module is implemented. | Clarify with stakeholder; recommended approach: store the status, update nightly via APScheduler |
| R-08 | Phase 5 external API integration | Facebook and Zalo APIs require app review, OAuth flows, and rate-limit handling. These are out of scope for Phases 1–4. | Stub integration points early; do not couple core business logic to external API availability |
