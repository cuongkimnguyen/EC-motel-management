# Backend Plan 3 — Expenses, Posts, Notifications

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement three remaining CRUD modules — Expenses, Posts, and Notifications — with full lifecycle rules, side effects, integration tests, and updated API contracts.

**Architecture:** Same layered pattern as Phase 2 (model → schemas → repository → service → router). All three modules are independent of each other except that the Notifications service reads from the Contracts and Rooms tables to generate alerts on demand. The Posts service writes back to `rooms.has_active_post` as a side effect of publish/delete.

**Tech Stack:** FastAPI 0.115, SQLAlchemy 2.0 async, asyncpg, Pydantic v2, Alembic, pytest-asyncio. Run tests with: `cd backend && source .venv/bin/activate && pytest -v`

**Scope note:** Reports module (aggregation-heavy, depends on all other modules) is intentionally left for Phase 4. Implement that separately after this plan is merged.

---

## File Map

**New files:**
```
backend/alembic/versions/0005_create_expenses.py
backend/app/modules/expenses/__init__.py
backend/app/modules/expenses/models.py
backend/app/modules/expenses/schemas.py
backend/app/modules/expenses/repository.py
backend/app/modules/expenses/service.py
backend/app/modules/expenses/router.py
backend/tests/modules/test_expenses.py

backend/alembic/versions/0006_create_posts.py
backend/app/modules/posts/__init__.py
backend/app/modules/posts/models.py
backend/app/modules/posts/schemas.py
backend/app/modules/posts/repository.py
backend/app/modules/posts/service.py
backend/app/modules/posts/router.py
backend/tests/modules/test_posts.py

backend/alembic/versions/0007_create_notifications.py
backend/app/modules/notifications/__init__.py
backend/app/modules/notifications/models.py
backend/app/modules/notifications/schemas.py
backend/app/modules/notifications/repository.py
backend/app/modules/notifications/service.py
backend/app/modules/notifications/router.py
backend/tests/modules/test_notifications.py

docs/api-contracts/expenses-posts-notifications.md
```

**Modified files:**
```
backend/app/main.py               — register 3 new routers
backend/tests/conftest.py         — add noqa imports for 3 new models
```

---

## Task 1: API Contracts Documentation

**Files:**
- Create: `docs/api-contracts/expenses-posts-notifications.md`

- [ ] **Step 1: Write the API contract**

```markdown
# API Contract: Expenses, Posts, Notifications

> All endpoints require `Authorization: Bearer <token>` with `admin` role.

---

## Expenses — `/api/expenses`

| Method | Path | Status | Description |
|--------|------|--------|-------------|
| GET | /api/expenses | 200 | List expenses (paginated, filterable) |
| GET | /api/expenses/stats | 200 | Aggregate stats |
| GET | /api/expenses/{id} | 200 | Get single expense |
| POST | /api/expenses | 201 | Create expense |
| PUT | /api/expenses/{id} | 200 | Update expense |
| DELETE | /api/expenses/{id} | 204 | Delete expense |
| PATCH | /api/expenses/{id}/mark-paid | 200 | Mark as paid |

### GET /api/expenses query params
| Param | Type | Description |
|-------|------|-------------|
| page | int | Page number (default: 1) |
| limit | int | Items per page (default: 20, max: 100) |
| search | str | Substring on title / code / note |
| category | str | Exact match on category enum |
| payment_status | str | Exact match on payment status |
| building_name | str | Exact match: Khu A / Khu B / Khu C / Khu D |
| from_date | date | expense_date >= from_date |
| to_date | date | expense_date <= to_date |

### GET /api/expenses/stats response
```json
{
  "total": 42,
  "paid": 30,
  "unpaid": 8,
  "pending": 4,
  "total_amount": 125000000
}
```

### ExpenseResponse shape
```json
{
  "id": "uuid",
  "code": "CP-2026-001",
  "title": "Tiền điện tháng 5 khu A",
  "category": "Điện nước",
  "amount": 2850000,
  "expense_date": "2026-05-05",
  "payment_status": "Đã thanh toán",
  "payment_method": "Chuyển khoản",
  "building_name": "Khu A",
  "note": "Hóa đơn EVN tháng 5",
  "is_recurring": true,
  "receipt_image": null,
  "created_at": "2026-05-20T...",
  "updated_at": "2026-05-20T..."
}
```

### Validation rules
- `category`: must be one of `Điện nước | Internet | Vệ sinh | Sửa chữa | Mua sắm | Lương / quản lý | Chi phí khác`
- `payment_status`: must be one of `Đã thanh toán | Chưa thanh toán | Chờ xử lý`
- `payment_method`: must be one of `Tiền mặt | Chuyển khoản | Khác`
- `amount`: positive integer (VND)
- `expense_date`: valid ISO date
- Expense code auto-generated as `CP-YYYY-NNN` (3-digit zero-padded sequential per calendar year)

---

## Posts — `/api/posts`

| Method | Path | Status | Description |
|--------|------|--------|-------------|
| GET | /api/posts | 200 | List posts (paginated, filterable) |
| GET | /api/posts/stats | 200 | Aggregate stats |
| GET | /api/posts/{id} | 200 | Get single post |
| POST | /api/posts | 201 | Create post (status=Nháp) |
| PUT | /api/posts/{id} | 200 | Update post fields (draft/error only) |
| DELETE | /api/posts/{id} | 204 | Delete post |
| POST | /api/posts/{id}/publish | 200 | Publish immediately |
| POST | /api/posts/{id}/schedule | 200 | Schedule for later |
| POST | /api/posts/{id}/duplicate | 201 | Duplicate as new draft |

### GET /api/posts query params
| Param | Type | Description |
|-------|------|-------------|
| page | int | Page number |
| limit | int | Items per page |
| search | str | Substring on title |
| status | str | `Nháp | Đã lên lịch | Đã đăng | Lỗi` |
| channel | str | `Facebook Page | Facebook Group | Zalo` |
| post_type | str | `Tuyển khách | Khuyến mãi | Thông báo` |
| room_id | uuid | Filter by linked room |

### GET /api/posts/stats response
```json
{
  "total": 12,
  "published": 5,
  "scheduled": 3,
  "draft": 3,
  "error": 1,
  "total_views": 4821,
  "total_leads": 23
}
```

### PostResponse shape
```json
{
  "id": "uuid",
  "title": "Cho thuê phòng P103 - Khu A",
  "content": "Phòng rộng 25m²...",
  "room_id": "uuid or null",
  "room_code": "P103 or null",
  "post_type": "Tuyển khách",
  "channel": "Facebook Page",
  "planned_date": null,
  "posted_date": "2026-05-10T14:00:00Z",
  "status": "Đã đăng",
  "fb_link": null,
  "views": 1241,
  "messages": 12,
  "leads": 5,
  "converted": 1,
  "hashtags": "#chothuephong #nhatro",
  "price": 3500000,
  "area": 25,
  "assignee": null,
  "thumbnail": null,
  "created_at": "2026-05-09T...",
  "updated_at": "2026-05-10T..."
}
```

### Status lifecycle
- `Nháp` → publish → `Đã đăng`
- `Nháp` → schedule → `Đã lên lịch`
- `Đã lên lịch` → publish → `Đã đăng`
- Any status → duplicate → new `Nháp`
- `Đã đăng` or `Lỗi` → cannot be edited (409)

### Side effects
- publish/schedule with `room_id`: sets `room.has_active_post = true`
- delete where `status = Đã đăng` with `room_id`: sets `room.has_active_post = false` if no other published posts exist for that room

### Business rules
- Posts with `post_type = Khuyến mãi` or `Thông báo` must have `room_id = null`
- `schedule` payload requires `scheduled_at: datetime` field (future datetime)

---

## Notifications — `/api/notifications`

| Method | Path | Status | Description |
|--------|------|--------|-------------|
| GET | /api/notifications | 200 | List notifications (triggers refresh first) |
| GET | /api/notifications/count | 200 | Unread count |
| PATCH | /api/notifications/{id}/read | 200 | Mark single as read |
| POST | /api/notifications/mark-all-read | 200 | Mark all as read |

### GET /api/notifications query params
| Param | Type | Description |
|-------|------|-------------|
| read | bool | Filter by read state |
| type | str | `contract_expiry | vacant_room | overdue_payment | maintenance` |
| page | int | Page number (default: 1) |
| limit | int | Items per page (default: 20) |

### NotificationResponse shape
```json
{
  "id": "uuid",
  "type": "contract_expiry",
  "reference_id": "uuid-string",
  "title": "Hợp đồng sắp hết hạn",
  "message": "HĐ C101 (Trần Thị B) hết hạn sau 7 ngày",
  "date": "2026-05-20",
  "read": false,
  "priority": "high",
  "created_at": "2026-05-20T...",
  "updated_at": "2026-05-20T..."
}
```

### Notification generation rules (on GET /api/notifications)
| Type | Source | Condition | Priority |
|------|--------|-----------|----------|
| `contract_expiry` | contracts | terminated_at IS NULL AND end_date in [today, today+30] | high if ≤7d, medium if ≤30d |
| `vacant_room` | rooms | status='Trống' AND has_active_post=false | high |
| `maintenance` | rooms | status='Bảo trì' | low |

### Upsert key
`(type, reference_id)` — unique constraint. Refresh updates existing notifications or creates new ones. Read state is preserved across refreshes.

### GET /api/notifications/count response
```json
{ "unread": 4 }
```
```

- [ ] **Step 2: Commit**

```bash
git add -f docs/api-contracts/expenses-posts-notifications.md
git commit -m "docs: add Phase 3 API contract for expenses, posts, notifications"
```

---

## Task 2: Expenses Migration

**Files:**
- Create: `backend/alembic/versions/0005_create_expenses.py`

- [ ] **Step 1: Write the migration**

```python
"""create_expenses

Revision ID: 0005
Revises: 0004
Create Date: 2026-05-20

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0005"
down_revision: Union[str, None] = "0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "expenses",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("code", sa.String(20), nullable=False, unique=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("amount", sa.BigInteger(), nullable=False),
        sa.Column("expense_date", sa.Date(), nullable=False),
        sa.Column("payment_status", sa.String(30), nullable=False, server_default="Chưa thanh toán"),
        sa.Column("payment_method", sa.String(20), nullable=False, server_default="Tiền mặt"),
        sa.Column("building_name", sa.String(50), nullable=False, server_default="Khu A"),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("is_recurring", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("receipt_image", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_expenses_expense_date", "expenses", ["expense_date"])
    op.create_index("ix_expenses_category", "expenses", ["category"])
    op.create_index("ix_expenses_payment_status", "expenses", ["payment_status"])
    op.create_index("ix_expenses_building_name", "expenses", ["building_name"])


def downgrade() -> None:
    op.drop_table("expenses")
```

- [ ] **Step 2: Run migration**

```bash
cd backend && source .venv/bin/activate && alembic upgrade 0005
```

Expected: `Running upgrade 0004 -> 0005, create_expenses`

- [ ] **Step 3: Commit**

```bash
git add backend/alembic/versions/0005_create_expenses.py
git commit -m "feat: add migration 0005 — create expenses table"
```

---

## Task 3: Expenses Module

**Files:**
- Create: `backend/app/modules/expenses/__init__.py`
- Create: `backend/app/modules/expenses/models.py`
- Create: `backend/app/modules/expenses/schemas.py`
- Create: `backend/app/modules/expenses/repository.py`
- Create: `backend/app/modules/expenses/service.py`
- Create: `backend/app/modules/expenses/router.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Create `__init__.py`**

```python
# backend/app/modules/expenses/__init__.py
```

- [ ] **Step 2: Create `models.py`**

```python
# backend/app/modules/expenses/models.py
import uuid
from datetime import date, datetime

from sqlalchemy import BigInteger, Boolean, Date, DateTime, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    amount: Mapped[int] = mapped_column(BigInteger(), nullable=False)
    expense_date: Mapped[date] = mapped_column(Date(), nullable=False)
    payment_status: Mapped[str] = mapped_column(String(30), nullable=False, default="Chưa thanh toán")
    payment_method: Mapped[str] = mapped_column(String(20), nullable=False, default="Tiền mặt")
    building_name: Mapped[str] = mapped_column(String(50), nullable=False, default="Khu A")
    note: Mapped[str | None] = mapped_column(Text(), nullable=True)
    is_recurring: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=False)
    receipt_image: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )
```

- [ ] **Step 3: Create `schemas.py`**

```python
# backend/app/modules/expenses/schemas.py
import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field

VALID_CATEGORIES = (
    "Điện nước", "Internet", "Vệ sinh", "Sửa chữa",
    "Mua sắm", "Lương / quản lý", "Chi phí khác",
)
VALID_PAYMENT_STATUSES = ("Đã thanh toán", "Chưa thanh toán", "Chờ xử lý")
VALID_PAYMENT_METHODS = ("Tiền mặt", "Chuyển khoản", "Khác")


class ExpenseCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    category: str
    amount: int = Field(..., ge=1)
    expense_date: date
    payment_status: str = "Chưa thanh toán"
    payment_method: str = "Tiền mặt"
    building_name: str = "Khu A"
    note: str | None = None
    is_recurring: bool = False
    receipt_image: str | None = None

    def model_post_init(self, __context):
        if self.category not in VALID_CATEGORIES:
            raise ValueError(f"category phải là một trong: {VALID_CATEGORIES}")
        if self.payment_status not in VALID_PAYMENT_STATUSES:
            raise ValueError(f"payment_status phải là một trong: {VALID_PAYMENT_STATUSES}")
        if self.payment_method not in VALID_PAYMENT_METHODS:
            raise ValueError(f"payment_method phải là một trong: {VALID_PAYMENT_METHODS}")


class ExpenseUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=255)
    category: str | None = None
    amount: int | None = Field(None, ge=1)
    expense_date: date | None = None
    payment_status: str | None = None
    payment_method: str | None = None
    building_name: str | None = None
    note: str | None = None
    is_recurring: bool | None = None
    receipt_image: str | None = None

    def model_post_init(self, __context):
        if self.category is not None and self.category not in VALID_CATEGORIES:
            raise ValueError(f"category phải là một trong: {VALID_CATEGORIES}")
        if self.payment_status is not None and self.payment_status not in VALID_PAYMENT_STATUSES:
            raise ValueError(f"payment_status phải là một trong: {VALID_PAYMENT_STATUSES}")
        if self.payment_method is not None and self.payment_method not in VALID_PAYMENT_METHODS:
            raise ValueError(f"payment_method phải là một trong: {VALID_PAYMENT_METHODS}")


class ExpenseResponse(BaseModel):
    id: uuid.UUID
    code: str
    title: str
    category: str
    amount: int
    expense_date: date
    payment_status: str
    payment_method: str
    building_name: str
    note: str | None
    is_recurring: bool
    receipt_image: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ExpenseStats(BaseModel):
    total: int
    paid: int
    unpaid: int
    pending: int
    total_amount: int
```

- [ ] **Step 4: Create `repository.py`**

```python
# backend/app/modules/expenses/repository.py
import uuid
from datetime import date

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.expenses.models import Expense


class ExpenseRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, expense_id: str | uuid.UUID) -> Expense | None:
        result = await self.db.execute(select(Expense).where(Expense.id == expense_id))
        return result.scalar_one_or_none()

    async def get_last_code_for_year(self, year: int) -> str | None:
        prefix = f"CP-{year}-"
        result = await self.db.execute(
            select(Expense.code)
            .where(Expense.code.like(f"{prefix}%"))
            .order_by(Expense.code.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def create(self, **kwargs) -> Expense:
        expense = Expense(**kwargs)
        self.db.add(expense)
        await self.db.flush()
        await self.db.refresh(expense)
        return expense

    async def update(self, expense: Expense, **kwargs) -> Expense:
        for key, value in kwargs.items():
            setattr(expense, key, value)
        await self.db.flush()
        await self.db.refresh(expense)
        return expense

    async def delete(self, expense: Expense) -> None:
        await self.db.delete(expense)
        await self.db.flush()

    async def list_expenses(
        self,
        page: int,
        limit: int,
        search: str | None = None,
        category: str | None = None,
        payment_status: str | None = None,
        building_name: str | None = None,
        from_date: date | None = None,
        to_date: date | None = None,
    ) -> tuple[list[Expense], int]:
        q = select(Expense)
        if search:
            pattern = f"%{search}%"
            q = q.where(
                Expense.title.ilike(pattern)
                | Expense.code.ilike(pattern)
                | Expense.note.ilike(pattern)
            )
        if category:
            q = q.where(Expense.category == category)
        if payment_status:
            q = q.where(Expense.payment_status == payment_status)
        if building_name:
            q = q.where(Expense.building_name == building_name)
        if from_date:
            q = q.where(Expense.expense_date >= from_date)
        if to_date:
            q = q.where(Expense.expense_date <= to_date)

        count_q = select(func.count()).select_from(q.subquery())
        total = await self.db.scalar(count_q) or 0
        q = q.order_by(Expense.expense_date.desc(), Expense.code.desc())
        q = q.offset((page - 1) * limit).limit(limit)
        result = await self.db.execute(q)
        return list(result.scalars().all()), total

    async def get_stats(self) -> dict:
        rows = await self.db.execute(
            select(
                Expense.payment_status,
                func.count().label("cnt"),
                func.coalesce(func.sum(Expense.amount), 0).label("amt"),
            ).group_by(Expense.payment_status)
        )
        paid = unpaid = pending = total_amount = total = 0
        for row in rows:
            total += row.cnt
            total_amount += row.amt
            if row.payment_status == "Đã thanh toán":
                paid = row.cnt
            elif row.payment_status == "Chưa thanh toán":
                unpaid = row.cnt
            elif row.payment_status == "Chờ xử lý":
                pending = row.cnt
        return {"total": total, "paid": paid, "unpaid": unpaid, "pending": pending, "total_amount": total_amount}
```

- [ ] **Step 5: Create `service.py`**

```python
# backend/app/modules/expenses/service.py
from datetime import date

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.pagination import PaginationParams, make_paginated_response
from app.modules.expenses.repository import ExpenseRepository
from app.modules.expenses.schemas import ExpenseCreate, ExpenseResponse, ExpenseStats, ExpenseUpdate


class ExpenseService:
    def __init__(self, db: AsyncSession):
        self.repo = ExpenseRepository(db)

    async def _generate_code(self) -> str:
        year = date.today().year
        last_code = await self.repo.get_last_code_for_year(year)
        if last_code:
            num = int(last_code.split("-")[-1]) + 1
        else:
            num = 1
        return f"CP-{year}-{num:03d}"

    async def list_expenses(self, params: PaginationParams, **filters) -> dict:
        expenses, total = await self.repo.list_expenses(params.page, params.limit, **filters)
        data = [ExpenseResponse.model_validate(e) for e in expenses]
        return make_paginated_response(data, total, params)

    async def get_stats(self) -> ExpenseStats:
        stats = await self.repo.get_stats()
        return ExpenseStats(**stats)

    async def get_expense(self, expense_id: str) -> ExpenseResponse:
        expense = await self.repo.get_by_id(expense_id)
        if not expense:
            raise HTTPException(status_code=404, detail="Chi phí không tồn tại")
        return ExpenseResponse.model_validate(expense)

    async def create_expense(self, payload: ExpenseCreate) -> ExpenseResponse:
        code = await self._generate_code()
        expense = await self.repo.create(code=code, **payload.model_dump())
        return ExpenseResponse.model_validate(expense)

    async def update_expense(self, expense_id: str, payload: ExpenseUpdate) -> ExpenseResponse:
        expense = await self.repo.get_by_id(expense_id)
        if not expense:
            raise HTTPException(status_code=404, detail="Chi phí không tồn tại")
        updates = payload.model_dump(exclude_none=True)
        expense = await self.repo.update(expense, **updates)
        return ExpenseResponse.model_validate(expense)

    async def delete_expense(self, expense_id: str) -> None:
        expense = await self.repo.get_by_id(expense_id)
        if not expense:
            raise HTTPException(status_code=404, detail="Chi phí không tồn tại")
        await self.repo.delete(expense)

    async def mark_paid(self, expense_id: str) -> ExpenseResponse:
        expense = await self.repo.get_by_id(expense_id)
        if not expense:
            raise HTTPException(status_code=404, detail="Chi phí không tồn tại")
        expense = await self.repo.update(expense, payment_status="Đã thanh toán")
        return ExpenseResponse.model_validate(expense)
```

- [ ] **Step 6: Create `router.py`**

```python
# backend/app/modules/expenses/router.py
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.pagination import PaginationParams
from app.core.database import get_db
from app.core.dependencies import require_admin
from app.modules.expenses.schemas import ExpenseCreate, ExpenseResponse, ExpenseStats, ExpenseUpdate
from app.modules.expenses.service import ExpenseService

router = APIRouter(prefix="/api/expenses", tags=["expenses"])


@router.get("/stats", response_model=ExpenseStats)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await ExpenseService(db).get_stats()


@router.get("", response_model=dict)
async def list_expenses(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    category: str | None = Query(None),
    payment_status: str | None = Query(None),
    building_name: str | None = Query(None),
    from_date: date | None = Query(None),
    to_date: date | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await ExpenseService(db).list_expenses(
        PaginationParams(page=page, limit=limit),
        search=search,
        category=category,
        payment_status=payment_status,
        building_name=building_name,
        from_date=from_date,
        to_date=to_date,
    )


@router.get("/{expense_id}", response_model=ExpenseResponse)
async def get_expense(
    expense_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await ExpenseService(db).get_expense(expense_id)


@router.post("", response_model=ExpenseResponse, status_code=201)
async def create_expense(
    payload: ExpenseCreate,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await ExpenseService(db).create_expense(payload)


@router.put("/{expense_id}", response_model=ExpenseResponse)
async def update_expense(
    expense_id: str,
    payload: ExpenseUpdate,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await ExpenseService(db).update_expense(expense_id, payload)


@router.delete("/{expense_id}", status_code=204)
async def delete_expense(
    expense_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    await ExpenseService(db).delete_expense(expense_id)


@router.patch("/{expense_id}/mark-paid", response_model=ExpenseResponse)
async def mark_paid(
    expense_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await ExpenseService(db).mark_paid(expense_id)
```

- [ ] **Step 7: Register router in `backend/app/main.py`**

Add to the imports and `create_app()`:
```python
from app.modules.expenses.router import router as expenses_router
# in create_app():
app.include_router(expenses_router)
```

- [ ] **Step 8: Commit**

```bash
git add backend/app/modules/expenses/ backend/app/main.py
git commit -m "feat: add expenses module (model, schemas, repo, service, router)"
```

---

## Task 4: Expenses Tests

**Files:**
- Create: `backend/tests/modules/test_expenses.py`
- Modify: `backend/tests/conftest.py` (add Expense noqa import)

- [ ] **Step 1: Add Expense noqa import to conftest.py**

In `backend/tests/conftest.py`, add alongside the other noqa imports:
```python
from app.modules.expenses.models import Expense  # noqa: F401
```

- [ ] **Step 2: Write the tests**

```python
# backend/tests/modules/test_expenses.py
from datetime import date

from httpx import AsyncClient


PAYLOAD = {
    "title": "Tiền điện tháng 5 khu A",
    "category": "Điện nước",
    "amount": 2_850_000,
    "expense_date": "2026-05-05",
    "payment_status": "Chưa thanh toán",
    "payment_method": "Chuyển khoản",
    "building_name": "Khu A",
    "note": "Hóa đơn EVN",
    "is_recurring": True,
}


async def test_create_expense(client: AsyncClient, auth_headers: dict):
    resp = await client.post("/api/expenses", json=PAYLOAD, headers=auth_headers)
    assert resp.status_code == 201
    body = resp.json()
    assert body["code"].startswith("CP-")
    assert body["title"] == PAYLOAD["title"]
    assert body["payment_status"] == "Chưa thanh toán"
    assert body["is_recurring"] is True


async def test_expense_code_sequential(client: AsyncClient, auth_headers: dict):
    r1 = await client.post("/api/expenses", json=PAYLOAD, headers=auth_headers)
    r2 = await client.post(
        "/api/expenses",
        json={**PAYLOAD, "title": "Chi phí internet"},
        headers=auth_headers,
    )
    code1 = r1.json()["code"]
    code2 = r2.json()["code"]
    num1 = int(code1.split("-")[-1])
    num2 = int(code2.split("-")[-1])
    assert num2 == num1 + 1


async def test_create_expense_invalid_category_returns_422(client: AsyncClient, auth_headers: dict):
    resp = await client.post(
        "/api/expenses",
        json={**PAYLOAD, "category": "Không tồn tại"},
        headers=auth_headers,
    )
    assert resp.status_code == 422


async def test_list_expenses_with_filters(client: AsyncClient, auth_headers: dict):
    await client.post("/api/expenses", json=PAYLOAD, headers=auth_headers)
    await client.post(
        "/api/expenses",
        json={**PAYLOAD, "title": "Tiền vệ sinh", "category": "Vệ sinh", "payment_status": "Đã thanh toán"},
        headers=auth_headers,
    )

    resp = await client.get("/api/expenses?category=Điện+nước", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["total"] >= 1
    assert all(e["category"] == "Điện nước" for e in resp.json()["data"])

    resp2 = await client.get("/api/expenses?payment_status=Đã+thanh+toán", headers=auth_headers)
    assert all(e["payment_status"] == "Đã thanh toán" for e in resp2.json()["data"])


async def test_update_expense(client: AsyncClient, auth_headers: dict):
    created = (await client.post("/api/expenses", json=PAYLOAD, headers=auth_headers)).json()
    resp = await client.put(
        f"/api/expenses/{created['id']}",
        json={"amount": 3_000_000, "note": "Cập nhật hóa đơn"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["amount"] == 3_000_000
    assert resp.json()["note"] == "Cập nhật hóa đơn"


async def test_mark_paid(client: AsyncClient, auth_headers: dict):
    created = (await client.post("/api/expenses", json=PAYLOAD, headers=auth_headers)).json()
    assert created["payment_status"] == "Chưa thanh toán"

    resp = await client.patch(f"/api/expenses/{created['id']}/mark-paid", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["payment_status"] == "Đã thanh toán"


async def test_delete_expense(client: AsyncClient, auth_headers: dict):
    created = (await client.post("/api/expenses", json=PAYLOAD, headers=auth_headers)).json()
    del_resp = await client.delete(f"/api/expenses/{created['id']}", headers=auth_headers)
    assert del_resp.status_code == 204

    get_resp = await client.get(f"/api/expenses/{created['id']}", headers=auth_headers)
    assert get_resp.status_code == 404


async def test_expenses_stats(client: AsyncClient, auth_headers: dict):
    await client.post("/api/expenses", json=PAYLOAD, headers=auth_headers)
    paid_payload = {**PAYLOAD, "title": "Tiền internet", "payment_status": "Đã thanh toán"}
    await client.post("/api/expenses", json=paid_payload, headers=auth_headers)

    resp = await client.get("/api/expenses/stats", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] >= 2
    assert body["paid"] >= 1
    assert body["unpaid"] >= 1
    assert body["total_amount"] > 0


async def test_list_expenses_requires_auth(client: AsyncClient):
    resp = await client.get("/api/expenses")
    assert resp.status_code == 401
```

- [ ] **Step 3: Run tests**

```bash
cd backend && source .venv/bin/activate && pytest tests/modules/test_expenses.py -v
```

Expected: 8 passed

- [ ] **Step 4: Run full suite**

```bash
pytest -v
```

Expected: 65 passed (57 previous + 8 new)

- [ ] **Step 5: Commit**

```bash
git add backend/tests/modules/test_expenses.py backend/tests/conftest.py
git commit -m "test: add expenses integration tests (8 tests)"
```

---

## Task 5: Posts Migration + Module

**Files:**
- Create: `backend/alembic/versions/0006_create_posts.py`
- Create: `backend/app/modules/posts/__init__.py`
- Create: `backend/app/modules/posts/models.py`
- Create: `backend/app/modules/posts/schemas.py`
- Create: `backend/app/modules/posts/repository.py`
- Create: `backend/app/modules/posts/service.py`
- Create: `backend/app/modules/posts/router.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Write migration `0006_create_posts.py`**

```python
"""create_posts

Revision ID: 0006
Revises: 0005
Create Date: 2026-05-20

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0006"
down_revision: Union[str, None] = "0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "posts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("room_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("post_type", sa.String(20), nullable=False),
        sa.Column("channel", sa.String(30), nullable=False),
        sa.Column("planned_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("posted_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="Nháp"),
        sa.Column("fb_link", sa.String(500), nullable=True),
        sa.Column("views", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("messages", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("leads", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("converted", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("hashtags", sa.Text(), nullable=True),
        sa.Column("price", sa.BigInteger(), nullable=True),
        sa.Column("area", sa.Integer(), nullable=True),
        sa.Column("assignee", sa.String(255), nullable=True),
        sa.Column("thumbnail", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_posts_status", "posts", ["status"])
    op.create_index("ix_posts_room_id", "posts", ["room_id"])
    op.create_index("ix_posts_channel", "posts", ["channel"])


def downgrade() -> None:
    op.drop_table("posts")
```

- [ ] **Step 2: Run migration**

```bash
alembic upgrade 0006
```

Expected: `Running upgrade 0005 -> 0006, create_posts`

- [ ] **Step 3: Create `__init__.py`**

```python
# backend/app/modules/posts/__init__.py
```

- [ ] **Step 4: Create `models.py`**

```python
# backend/app/modules/posts/models.py
import uuid
from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text(), nullable=False)
    room_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    post_type: Mapped[str] = mapped_column(String(20), nullable=False)
    channel: Mapped[str] = mapped_column(String(30), nullable=False)
    planned_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    posted_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="Nháp")
    fb_link: Mapped[str | None] = mapped_column(String(500), nullable=True)
    views: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)
    messages: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)
    leads: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)
    converted: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)
    hashtags: Mapped[str | None] = mapped_column(Text(), nullable=True)
    price: Mapped[int | None] = mapped_column(BigInteger(), nullable=True)
    area: Mapped[int | None] = mapped_column(Integer(), nullable=True)
    assignee: Mapped[str | None] = mapped_column(String(255), nullable=True)
    thumbnail: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )
```

- [ ] **Step 5: Create `schemas.py`**

```python
# backend/app/modules/posts/schemas.py
import uuid
from datetime import datetime

from pydantic import BaseModel, Field

VALID_POST_TYPES = ("Tuyển khách", "Khuyến mãi", "Thông báo")
VALID_CHANNELS = ("Facebook Page", "Facebook Group", "Zalo")
VALID_STATUSES = ("Nháp", "Đã lên lịch", "Đã đăng", "Lỗi")
# These post types cannot be linked to a room
ROOM_FREE_TYPES = ("Khuyến mãi", "Thông báo")


class PostCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1)
    room_id: uuid.UUID | None = None
    post_type: str
    channel: str
    planned_date: datetime | None = None
    hashtags: str | None = None
    price: int | None = Field(None, ge=0)
    area: int | None = Field(None, ge=1)
    assignee: str | None = None
    thumbnail: str | None = None

    def model_post_init(self, __context):
        if self.post_type not in VALID_POST_TYPES:
            raise ValueError(f"post_type phải là một trong: {VALID_POST_TYPES}")
        if self.channel not in VALID_CHANNELS:
            raise ValueError(f"channel phải là một trong: {VALID_CHANNELS}")
        if self.post_type in ROOM_FREE_TYPES and self.room_id is not None:
            raise ValueError(f"Bài đăng loại {self.post_type} không được gắn phòng")


class PostUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=255)
    content: str | None = Field(None, min_length=1)
    room_id: uuid.UUID | None = None
    channel: str | None = None
    planned_date: datetime | None = None
    hashtags: str | None = None
    price: int | None = Field(None, ge=0)
    area: int | None = Field(None, ge=1)
    assignee: str | None = None
    thumbnail: str | None = None


class PostSchedule(BaseModel):
    scheduled_at: datetime


class PostResponse(BaseModel):
    id: uuid.UUID
    title: str
    content: str
    room_id: uuid.UUID | None
    room_code: str | None = None
    post_type: str
    channel: str
    planned_date: datetime | None
    posted_date: datetime | None
    status: str
    fb_link: str | None
    views: int
    messages: int
    leads: int
    converted: int
    hashtags: str | None
    price: int | None
    area: int | None
    assignee: str | None
    thumbnail: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PostStats(BaseModel):
    total: int
    published: int
    scheduled: int
    draft: int
    error: int
    total_views: int
    total_leads: int
```

- [ ] **Step 6: Create `repository.py`**

```python
# backend/app/modules/posts/repository.py
import uuid
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.posts.models import Post


class PostRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, post_id: str | uuid.UUID) -> Post | None:
        result = await self.db.execute(select(Post).where(Post.id == post_id))
        return result.scalar_one_or_none()

    async def create(self, **kwargs) -> Post:
        post = Post(**kwargs)
        self.db.add(post)
        await self.db.flush()
        await self.db.refresh(post)
        return post

    async def update(self, post: Post, **kwargs) -> Post:
        for key, value in kwargs.items():
            setattr(post, key, value)
        await self.db.flush()
        await self.db.refresh(post)
        return post

    async def delete(self, post: Post) -> None:
        await self.db.delete(post)
        await self.db.flush()

    async def count_published_for_room(self, room_id: uuid.UUID) -> int:
        """Count posts with status=Đã đăng for a given room (for has_active_post update)."""
        result = await self.db.execute(
            select(func.count()).where(
                Post.room_id == room_id,
                Post.status == "Đã đăng",
            )
        )
        return result.scalar() or 0

    async def list_posts(
        self,
        page: int,
        limit: int,
        search: str | None = None,
        status: str | None = None,
        channel: str | None = None,
        post_type: str | None = None,
        room_id: str | None = None,
    ) -> tuple[list[Post], int]:
        q = select(Post)
        if search:
            q = q.where(Post.title.ilike(f"%{search}%"))
        if status:
            q = q.where(Post.status == status)
        if channel:
            q = q.where(Post.channel == channel)
        if post_type:
            q = q.where(Post.post_type == post_type)
        if room_id:
            q = q.where(Post.room_id == room_id)

        count_q = select(func.count()).select_from(q.subquery())
        total = await self.db.scalar(count_q) or 0
        q = q.order_by(Post.created_at.desc()).offset((page - 1) * limit).limit(limit)
        result = await self.db.execute(q)
        return list(result.scalars().all()), total

    async def get_stats(self) -> dict:
        rows = await self.db.execute(
            select(
                Post.status,
                func.count().label("cnt"),
                func.coalesce(func.sum(Post.views), 0).label("views"),
                func.coalesce(func.sum(Post.leads), 0).label("leads"),
            ).group_by(Post.status)
        )
        published = scheduled = draft = error = total_views = total_leads = total = 0
        for row in rows:
            total += row.cnt
            total_views += row.views
            total_leads += row.leads
            if row.status == "Đã đăng":
                published = row.cnt
            elif row.status == "Đã lên lịch":
                scheduled = row.cnt
            elif row.status == "Nháp":
                draft = row.cnt
            elif row.status == "Lỗi":
                error = row.cnt
        return {
            "total": total,
            "published": published,
            "scheduled": scheduled,
            "draft": draft,
            "error": error,
            "total_views": total_views,
            "total_leads": total_leads,
        }
```

- [ ] **Step 7: Create `service.py`**

```python
# backend/app/modules/posts/service.py
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.pagination import PaginationParams, make_paginated_response
from app.modules.posts.repository import PostRepository
from app.modules.posts.schemas import (
    PostCreate,
    PostResponse,
    PostSchedule,
    PostStats,
    PostUpdate,
)
from app.modules.rooms.repository import RoomRepository


class PostService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = PostRepository(db)
        self.room_repo = RoomRepository(db)

    async def _to_response(self, post) -> PostResponse:
        resp = PostResponse.model_validate(post)
        if post.room_id:
            room = await self.room_repo.get_by_id(post.room_id)
            if room:
                resp.room_code = room.code
        return resp

    async def _sync_room_active_post(self, room_id) -> None:
        """Update room.has_active_post based on published posts count."""
        if room_id is None:
            return
        count = await self.repo.count_published_for_room(room_id)
        room = await self.room_repo.get_by_id(room_id)
        if room:
            await self.room_repo.update(room, has_active_post=(count > 0))

    async def list_posts(self, params: PaginationParams, **filters) -> dict:
        posts, total = await self.repo.list_posts(params.page, params.limit, **filters)
        data = [await self._to_response(p) for p in posts]
        return make_paginated_response(data, total, params)

    async def get_stats(self) -> PostStats:
        return PostStats(**await self.repo.get_stats())

    async def get_post(self, post_id: str) -> PostResponse:
        post = await self.repo.get_by_id(post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Bài đăng không tồn tại")
        return await self._to_response(post)

    async def create_post(self, payload: PostCreate) -> PostResponse:
        post = await self.repo.create(status="Nháp", **payload.model_dump())
        return await self._to_response(post)

    async def update_post(self, post_id: str, payload: PostUpdate) -> PostResponse:
        post = await self.repo.get_by_id(post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Bài đăng không tồn tại")
        if post.status in ("Đã đăng", "Đã lên lịch"):
            raise HTTPException(status_code=409, detail="Không thể sửa bài đăng đã đăng hoặc đã lên lịch")
        updates = payload.model_dump(exclude_none=True)
        post = await self.repo.update(post, **updates)
        return await self._to_response(post)

    async def delete_post(self, post_id: str) -> None:
        post = await self.repo.get_by_id(post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Bài đăng không tồn tại")
        room_id = post.room_id
        was_published = post.status == "Đã đăng"
        await self.repo.delete(post)
        if was_published and room_id:
            await self._sync_room_active_post(room_id)

    async def publish_post(self, post_id: str) -> PostResponse:
        post = await self.repo.get_by_id(post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Bài đăng không tồn tại")
        if post.status == "Đã đăng":
            raise HTTPException(status_code=409, detail="Bài đăng đã được đăng rồi")
        post = await self.repo.update(
            post,
            status="Đã đăng",
            posted_date=datetime.now(timezone.utc),
        )
        await self._sync_room_active_post(post.room_id)
        return await self._to_response(post)

    async def schedule_post(self, post_id: str, payload: PostSchedule) -> PostResponse:
        post = await self.repo.get_by_id(post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Bài đăng không tồn tại")
        if post.status == "Đã đăng":
            raise HTTPException(status_code=409, detail="Bài đăng đã được đăng rồi")
        post = await self.repo.update(
            post,
            status="Đã lên lịch",
            planned_date=payload.scheduled_at,
        )
        return await self._to_response(post)

    async def duplicate_post(self, post_id: str) -> PostResponse:
        post = await self.repo.get_by_id(post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Bài đăng không tồn tại")
        new_post = await self.repo.create(
            title=f"[Bản sao] {post.title}",
            content=post.content,
            room_id=post.room_id,
            post_type=post.post_type,
            channel=post.channel,
            hashtags=post.hashtags,
            price=post.price,
            area=post.area,
            assignee=post.assignee,
            thumbnail=post.thumbnail,
            status="Nháp",
        )
        return await self._to_response(new_post)
```

- [ ] **Step 8: Create `router.py`**

```python
# backend/app/modules/posts/router.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.pagination import PaginationParams
from app.core.database import get_db
from app.core.dependencies import require_admin
from app.modules.posts.schemas import PostCreate, PostResponse, PostSchedule, PostStats, PostUpdate
from app.modules.posts.service import PostService

router = APIRouter(prefix="/api/posts", tags=["posts"])


@router.get("/stats", response_model=PostStats)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await PostService(db).get_stats()


@router.get("", response_model=dict)
async def list_posts(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    status: str | None = Query(None),
    channel: str | None = Query(None),
    post_type: str | None = Query(None),
    room_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await PostService(db).list_posts(
        PaginationParams(page=page, limit=limit),
        search=search,
        status=status,
        channel=channel,
        post_type=post_type,
        room_id=room_id,
    )


@router.get("/{post_id}", response_model=PostResponse)
async def get_post(
    post_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await PostService(db).get_post(post_id)


@router.post("", response_model=PostResponse, status_code=201)
async def create_post(
    payload: PostCreate,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await PostService(db).create_post(payload)


@router.put("/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: str,
    payload: PostUpdate,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await PostService(db).update_post(post_id, payload)


@router.delete("/{post_id}", status_code=204)
async def delete_post(
    post_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    await PostService(db).delete_post(post_id)


@router.post("/{post_id}/publish", response_model=PostResponse)
async def publish_post(
    post_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await PostService(db).publish_post(post_id)


@router.post("/{post_id}/schedule", response_model=PostResponse)
async def schedule_post(
    post_id: str,
    payload: PostSchedule,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await PostService(db).schedule_post(post_id, payload)


@router.post("/{post_id}/duplicate", response_model=PostResponse, status_code=201)
async def duplicate_post(
    post_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await PostService(db).duplicate_post(post_id)
```

- [ ] **Step 9: Register router in `main.py`**

```python
from app.modules.posts.router import router as posts_router
# in create_app():
app.include_router(posts_router)
```

- [ ] **Step 10: Commit**

```bash
git add backend/alembic/versions/0006_create_posts.py backend/app/modules/posts/ backend/app/main.py
git commit -m "feat: add posts module with publish/schedule/duplicate lifecycle"
```

---

## Task 6: Posts Tests

**Files:**
- Create: `backend/tests/modules/test_posts.py`
- Modify: `backend/tests/conftest.py`

- [ ] **Step 1: Add Post noqa import to conftest.py**

```python
from app.modules.posts.models import Post  # noqa: F401
```

- [ ] **Step 2: Write tests**

For the room payload, use this helper that creates a room via API (the room migration must already be applied, which it is):

```python
# backend/tests/modules/test_posts.py
from datetime import datetime, timedelta, timezone

from httpx import AsyncClient


ROOM_PAYLOAD = {
    "code": "P103",
    "name": "Phòng P103",
    "floor": "Tầng 1",
    "block": "Khu A",
    "area": 25,
    "rent_price": 3_500_000,
    "deposit": 7_000_000,
    "electricity_price": 3500,
    "water_price": 15000,
    "service_fee": 100_000,
    "max_tenants": 2,
}

POST_PAYLOAD = {
    "title": "Cho thuê phòng P103",
    "content": "Phòng rộng 25m², đầy đủ tiện nghi...",
    "post_type": "Tuyển khách",
    "channel": "Facebook Page",
    "hashtags": "#chothuephong",
    "price": 3_500_000,
    "area": 25,
}


async def make_room(client, auth_headers) -> str:
    resp = await client.post("/api/rooms", json=ROOM_PAYLOAD, headers=auth_headers)
    return resp.json()["id"]


async def test_create_post_draft(client: AsyncClient, auth_headers: dict):
    resp = await client.post("/api/posts", json=POST_PAYLOAD, headers=auth_headers)
    assert resp.status_code == 201
    body = resp.json()
    assert body["status"] == "Nháp"
    assert body["title"] == POST_PAYLOAD["title"]
    assert body["posted_date"] is None


async def test_create_post_promo_with_room_returns_422(client: AsyncClient, auth_headers: dict):
    room_id = await make_room(client, auth_headers)
    resp = await client.post(
        "/api/posts",
        json={**POST_PAYLOAD, "post_type": "Khuyến mãi", "room_id": room_id},
        headers=auth_headers,
    )
    assert resp.status_code == 422


async def test_publish_post_updates_room_has_active_post(client: AsyncClient, auth_headers: dict):
    room_id = await make_room(client, auth_headers)
    post_resp = await client.post(
        "/api/posts",
        json={**POST_PAYLOAD, "room_id": room_id},
        headers=auth_headers,
    )
    post_id = post_resp.json()["id"]

    # Room should have has_active_post=False before publish
    rooms = await client.get("/api/rooms", headers=auth_headers)
    our_room = next(r for r in rooms.json()["data"] if r["id"] == room_id)
    assert our_room["has_active_post"] is False

    pub_resp = await client.post(f"/api/posts/{post_id}/publish", headers=auth_headers)
    assert pub_resp.status_code == 200
    assert pub_resp.json()["status"] == "Đã đăng"
    assert pub_resp.json()["posted_date"] is not None

    # Room should now have has_active_post=True
    rooms2 = await client.get("/api/rooms", headers=auth_headers)
    our_room2 = next(r for r in rooms2.json()["data"] if r["id"] == room_id)
    assert our_room2["has_active_post"] is True


async def test_delete_published_post_clears_room_active_post(client: AsyncClient, auth_headers: dict):
    room_id = await make_room(client, auth_headers)
    post_resp = await client.post(
        "/api/posts",
        json={**POST_PAYLOAD, "room_id": room_id},
        headers=auth_headers,
    )
    post_id = post_resp.json()["id"]
    await client.post(f"/api/posts/{post_id}/publish", headers=auth_headers)

    del_resp = await client.delete(f"/api/posts/{post_id}", headers=auth_headers)
    assert del_resp.status_code == 204

    rooms = await client.get("/api/rooms", headers=auth_headers)
    our_room = next(r for r in rooms.json()["data"] if r["id"] == room_id)
    assert our_room["has_active_post"] is False


async def test_schedule_post(client: AsyncClient, auth_headers: dict):
    post_resp = await client.post("/api/posts", json=POST_PAYLOAD, headers=auth_headers)
    post_id = post_resp.json()["id"]
    future = (datetime.now(timezone.utc) + timedelta(days=3)).isoformat()

    resp = await client.post(
        f"/api/posts/{post_id}/schedule",
        json={"scheduled_at": future},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "Đã lên lịch"
    assert resp.json()["planned_date"] is not None


async def test_update_published_post_returns_409(client: AsyncClient, auth_headers: dict):
    post_resp = await client.post("/api/posts", json=POST_PAYLOAD, headers=auth_headers)
    post_id = post_resp.json()["id"]
    await client.post(f"/api/posts/{post_id}/publish", headers=auth_headers)

    resp = await client.put(
        f"/api/posts/{post_id}",
        json={"title": "Sửa tiêu đề"},
        headers=auth_headers,
    )
    assert resp.status_code == 409


async def test_duplicate_post(client: AsyncClient, auth_headers: dict):
    post_resp = await client.post("/api/posts", json=POST_PAYLOAD, headers=auth_headers)
    post_id = post_resp.json()["id"]

    dup_resp = await client.post(f"/api/posts/{post_id}/duplicate", headers=auth_headers)
    assert dup_resp.status_code == 201
    dup = dup_resp.json()
    assert dup["status"] == "Nháp"
    assert dup["id"] != post_id
    assert "[Bản sao]" in dup["title"]


async def test_posts_stats(client: AsyncClient, auth_headers: dict):
    post_resp = await client.post("/api/posts", json=POST_PAYLOAD, headers=auth_headers)
    post_id = post_resp.json()["id"]
    await client.post(f"/api/posts/{post_id}/publish", headers=auth_headers)

    resp = await client.get("/api/posts/stats", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["published"] >= 1
    assert body["total"] >= 1


async def test_list_posts_requires_auth(client: AsyncClient):
    resp = await client.get("/api/posts")
    assert resp.status_code == 401
```

- [ ] **Step 3: Run posts tests**

```bash
pytest tests/modules/test_posts.py -v
```

Expected: 8 passed

- [ ] **Step 4: Run full suite**

```bash
pytest -v
```

Expected: 73 passed

- [ ] **Step 5: Commit**

```bash
git add backend/tests/modules/test_posts.py backend/tests/conftest.py
git commit -m "test: add posts integration tests (8 tests) including room side-effects"
```

---

## Task 7: Notifications Migration + Module

**Files:**
- Create: `backend/alembic/versions/0007_create_notifications.py`
- Create: `backend/app/modules/notifications/__init__.py`
- Create: `backend/app/modules/notifications/models.py`
- Create: `backend/app/modules/notifications/schemas.py`
- Create: `backend/app/modules/notifications/repository.py`
- Create: `backend/app/modules/notifications/service.py`
- Create: `backend/app/modules/notifications/router.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Write migration**

```python
"""create_notifications

Revision ID: 0007
Revises: 0006
Create Date: 2026-05-20

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0007"
down_revision: Union[str, None] = "0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "notifications",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("type", sa.String(30), nullable=False),
        sa.Column("reference_id", sa.String(36), nullable=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False, server_default=sa.func.current_date()),
        sa.Column("read", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("priority", sa.String(10), nullable=False, server_default="medium"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("type", "reference_id", name="uq_notification_type_ref"),
    )
    op.create_index("ix_notifications_read", "notifications", ["read"])
    op.create_index("ix_notifications_type", "notifications", ["type"])


def downgrade() -> None:
    op.drop_table("notifications")
```

- [ ] **Step 2: Run migration**

```bash
alembic upgrade 0007
```

Expected: `Running upgrade 0006 -> 0007, create_notifications`

- [ ] **Step 3: Create `__init__.py`**

```python
# backend/app/modules/notifications/__init__.py
```

- [ ] **Step 4: Create `models.py`**

```python
# backend/app/modules/notifications/models.py
import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Notification(Base):
    __tablename__ = "notifications"
    __table_args__ = (
        UniqueConstraint("type", "reference_id", name="uq_notification_type_ref"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type: Mapped[str] = mapped_column(String(30), nullable=False)
    reference_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text(), nullable=False)
    date: Mapped[date] = mapped_column(Date(), nullable=False, default=date.today)
    read: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=False)
    priority: Mapped[str] = mapped_column(String(10), nullable=False, default="medium")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )
```

- [ ] **Step 5: Create `schemas.py`**

```python
# backend/app/modules/notifications/schemas.py
import uuid
from datetime import date, datetime

from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: uuid.UUID
    type: str
    reference_id: str | None
    title: str
    message: str
    date: date
    read: bool
    priority: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class NotificationCount(BaseModel):
    unread: int
```

- [ ] **Step 6: Create `repository.py`**

```python
# backend/app/modules/notifications/repository.py
import uuid
from datetime import date

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.notifications.models import Notification


class NotificationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, notif_id: str | uuid.UUID) -> Notification | None:
        result = await self.db.execute(select(Notification).where(Notification.id == notif_id))
        return result.scalar_one_or_none()

    async def upsert(
        self,
        type: str,
        reference_id: str,
        title: str,
        message: str,
        priority: str,
    ) -> None:
        """Insert or update notification by (type, reference_id). Preserves read state on update."""
        stmt = (
            insert(Notification)
            .values(
                id=uuid.uuid4(),
                type=type,
                reference_id=reference_id,
                title=title,
                message=message,
                date=date.today(),
                priority=priority,
            )
            .on_conflict_do_update(
                constraint="uq_notification_type_ref",
                set_={
                    "title": title,
                    "message": message,
                    "date": date.today(),
                    "priority": priority,
                },
            )
        )
        await self.db.execute(stmt)

    async def delete_stale(self, valid_keys: list[tuple[str, str]]) -> None:
        """Delete notifications whose (type, reference_id) are no longer active."""
        if not valid_keys:
            # If no active notifications, delete all auto-generated types
            from sqlalchemy import delete

            await self.db.execute(
                delete(Notification).where(
                    Notification.type.in_(
                        ["contract_expiry", "vacant_room", "maintenance"]
                    )
                )
            )
            return
        from sqlalchemy import and_, delete, or_, tuple_

        types_refs = [(t, r) for t, r in valid_keys]
        await self.db.execute(
            delete(Notification).where(
                Notification.type.in_(["contract_expiry", "vacant_room", "maintenance"]),
                ~tuple_(Notification.type, Notification.reference_id).in_(types_refs),
            )
        )

    async def mark_read(self, notif_id: str | uuid.UUID) -> Notification | None:
        notif = await self.get_by_id(notif_id)
        if notif:
            notif.read = True
            await self.db.flush()
            await self.db.refresh(notif)
        return notif

    async def mark_all_read(self) -> None:
        from sqlalchemy import update

        await self.db.execute(update(Notification).values(read=True))
        await self.db.flush()

    async def count_unread(self) -> int:
        result = await self.db.execute(
            select(func.count()).where(Notification.read.is_(False))
        )
        return result.scalar() or 0

    async def list_notifications(
        self,
        page: int,
        limit: int,
        read: bool | None = None,
        type: str | None = None,
    ) -> tuple[list[Notification], int]:
        q = select(Notification)
        if read is not None:
            q = q.where(Notification.read == read)
        if type:
            q = q.where(Notification.type == type)

        count_q = select(func.count()).select_from(q.subquery())
        total = await self.db.scalar(count_q) or 0
        q = q.order_by(Notification.date.desc(), Notification.created_at.desc())
        q = q.offset((page - 1) * limit).limit(limit)
        result = await self.db.execute(q)
        return list(result.scalars().all()), total
```

- [ ] **Step 7: Create `service.py`**

```python
# backend/app/modules/notifications/service.py
from datetime import date, timedelta

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.pagination import PaginationParams, make_paginated_response
from app.modules.contracts.models import Contract, EXPIRY_WARNING_DAYS
from app.modules.notifications.repository import NotificationRepository
from app.modules.notifications.schemas import NotificationCount, NotificationResponse
from app.modules.rooms.models import Room


class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = NotificationRepository(db)

    async def _refresh(self) -> None:
        """Scan contracts and rooms; upsert active notifications; delete stale ones."""
        today = date.today()
        warning_date = today + timedelta(days=EXPIRY_WARNING_DAYS)
        active_keys: list[tuple[str, str]] = []

        # contract_expiry: non-terminated contracts expiring within 30 days
        result = await self.db.execute(
            select(Contract).where(
                Contract.terminated_at.is_(None),
                Contract.end_date >= today,
                Contract.end_date <= warning_date,
            )
        )
        contracts = result.scalars().all()
        for c in contracts:
            days_left = (c.end_date - today).days
            priority = "high" if days_left <= 7 else "medium"
            ref = str(c.id)
            await self.repo.upsert(
                type="contract_expiry",
                reference_id=ref,
                title="Hợp đồng sắp hết hạn",
                message=f"Hợp đồng {c.code} hết hạn sau {days_left} ngày",
                priority=priority,
            )
            active_keys.append(("contract_expiry", ref))

        # vacant_room: rooms that are empty and have no active post
        result = await self.db.execute(
            select(Room).where(
                Room.status == "Trống",
                Room.has_active_post.is_(False),
            )
        )
        vacant_rooms = result.scalars().all()
        for room in vacant_rooms:
            ref = str(room.id)
            await self.repo.upsert(
                type="vacant_room",
                reference_id=ref,
                title="Phòng trống chưa có bài đăng",
                message=f"Phòng {room.code} ({room.name}) đang trống, chưa có bài đăng marketing",
                priority="high",
            )
            active_keys.append(("vacant_room", ref))

        # maintenance: rooms under maintenance
        result = await self.db.execute(
            select(Room).where(Room.status == "Bảo trì")
        )
        maint_rooms = result.scalars().all()
        for room in maint_rooms:
            ref = str(room.id)
            await self.repo.upsert(
                type="maintenance",
                reference_id=ref,
                title="Phòng đang bảo trì",
                message=f"Phòng {room.code} ({room.name}) đang trong trạng thái bảo trì",
                priority="low",
            )
            active_keys.append(("maintenance", ref))

        await self.repo.delete_stale(active_keys)

    async def list_notifications(
        self,
        params: PaginationParams,
        read: bool | None = None,
        type: str | None = None,
    ) -> dict:
        await self._refresh()
        notifications, total = await self.repo.list_notifications(
            params.page, params.limit, read=read, type=type
        )
        data = [NotificationResponse.model_validate(n) for n in notifications]
        return make_paginated_response(data, total, params)

    async def get_count(self) -> NotificationCount:
        await self._refresh()
        return NotificationCount(unread=await self.repo.count_unread())

    async def mark_read(self, notif_id: str) -> NotificationResponse:
        notif = await self.repo.mark_read(notif_id)
        if not notif:
            raise HTTPException(status_code=404, detail="Thông báo không tồn tại")
        return NotificationResponse.model_validate(notif)

    async def mark_all_read(self) -> dict:
        await self.repo.mark_all_read()
        return {"ok": True}
```

- [ ] **Step 8: Create `router.py`**

```python
# backend/app/modules/notifications/router.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.pagination import PaginationParams
from app.core.database import get_db
from app.core.dependencies import require_admin
from app.modules.notifications.schemas import NotificationCount, NotificationResponse
from app.modules.notifications.service import NotificationService

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("/count", response_model=NotificationCount)
async def get_count(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await NotificationService(db).get_count()


@router.get("", response_model=dict)
async def list_notifications(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    read: bool | None = Query(None),
    type: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await NotificationService(db).list_notifications(
        PaginationParams(page=page, limit=limit),
        read=read,
        type=type,
    )


@router.patch("/{notif_id}/read", response_model=NotificationResponse)
async def mark_read(
    notif_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await NotificationService(db).mark_read(notif_id)


@router.post("/mark-all-read", response_model=dict)
async def mark_all_read(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await NotificationService(db).mark_all_read()
```

- [ ] **Step 9: Register router in `main.py`**

```python
from app.modules.notifications.router import router as notifications_router
# in create_app():
app.include_router(notifications_router)
```

- [ ] **Step 10: Commit**

```bash
git add backend/alembic/versions/0007_create_notifications.py backend/app/modules/notifications/ backend/app/main.py
git commit -m "feat: add notifications module with auto-refresh from contracts and rooms"
```

---

## Task 8: Notifications Tests

**Files:**
- Create: `backend/tests/modules/test_notifications.py`
- Modify: `backend/tests/conftest.py`

- [ ] **Step 1: Add Notification noqa import to conftest.py**

```python
from app.modules.notifications.models import Notification  # noqa: F401
```

- [ ] **Step 2: Write tests**

```python
# backend/tests/modules/test_notifications.py
from datetime import date, timedelta

from httpx import AsyncClient


ROOM_PAYLOAD = {
    "code": "N101",
    "name": "Phòng N101",
    "floor": "Tầng 1",
    "block": "Khu N",
    "area": 25,
    "rent_price": 3_500_000,
    "deposit": 7_000_000,
    "electricity_price": 3500,
    "water_price": 15000,
    "service_fee": 100_000,
    "max_tenants": 2,
}

TENANT_PAYLOAD = {
    "full_name": "Người Dùng Test",
    "phone": "0911222333",
    "cccd": "123456789012",
    "gender": "Nam",
    "date_of_birth": "1990-01-01",
    "permanent_address": "Hà Nội",
}


def future_date(days: int) -> str:
    return (date.today() + timedelta(days=days)).isoformat()


async def test_notifications_list_empty_initially(client: AsyncClient, auth_headers: dict):
    """With no rooms or contracts, notification list should return empty."""
    resp = await client.get("/api/notifications", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["total"] == 0


async def test_vacant_room_triggers_notification(client: AsyncClient, auth_headers: dict):
    """A vacant room with no active post generates a vacant_room notification."""
    await client.post("/api/rooms", json=ROOM_PAYLOAD, headers=auth_headers)

    resp = await client.get("/api/notifications?type=vacant_room", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["total"] >= 1
    notif = resp.json()["data"][0]
    assert notif["type"] == "vacant_room"
    assert notif["priority"] == "high"
    assert notif["read"] is False


async def test_contract_expiry_triggers_notification(client: AsyncClient, auth_headers: dict):
    """A contract expiring within 30 days generates a contract_expiry notification."""
    room_resp = await client.post("/api/rooms", json=ROOM_PAYLOAD, headers=auth_headers)
    room_id = room_resp.json()["id"]
    tenant_resp = await client.post("/api/tenants", json=TENANT_PAYLOAD, headers=auth_headers)
    tenant_id = tenant_resp.json()["id"]

    await client.post(
        "/api/contracts",
        json={
            "room_id": room_id,
            "tenant_id": tenant_id,
            "start_date": future_date(0),
            "end_date": future_date(15),  # 15 days → Sắp hết hạn
            "monthly_rent": 3_500_000,
            "deposit": 7_000_000,
            "billing_cycle": 1,
            "payment_due_day": 5,
        },
        headers=auth_headers,
    )

    resp = await client.get("/api/notifications?type=contract_expiry", headers=auth_headers)
    assert resp.json()["total"] >= 1
    notif = resp.json()["data"][0]
    assert notif["type"] == "contract_expiry"
    assert notif["priority"] in ("high", "medium")


async def test_contract_expiry_priority_high_within_7_days(client: AsyncClient, auth_headers: dict):
    """Contract expiring in ≤7 days → priority=high."""
    room_resp = await client.post("/api/rooms", json=ROOM_PAYLOAD, headers=auth_headers)
    room_id = room_resp.json()["id"]
    tenant_resp = await client.post("/api/tenants", json=TENANT_PAYLOAD, headers=auth_headers)
    tenant_id = tenant_resp.json()["id"]

    await client.post(
        "/api/contracts",
        json={
            "room_id": room_id,
            "tenant_id": tenant_id,
            "start_date": future_date(0),
            "end_date": future_date(5),
            "monthly_rent": 3_500_000,
            "deposit": 7_000_000,
            "billing_cycle": 1,
            "payment_due_day": 5,
        },
        headers=auth_headers,
    )

    resp = await client.get("/api/notifications?type=contract_expiry", headers=auth_headers)
    assert resp.json()["data"][0]["priority"] == "high"


async def test_mark_notification_read(client: AsyncClient, auth_headers: dict):
    await client.post("/api/rooms", json=ROOM_PAYLOAD, headers=auth_headers)

    list_resp = await client.get("/api/notifications", headers=auth_headers)
    notif_id = list_resp.json()["data"][0]["id"]

    read_resp = await client.patch(f"/api/notifications/{notif_id}/read", headers=auth_headers)
    assert read_resp.status_code == 200
    assert read_resp.json()["read"] is True


async def test_mark_all_read(client: AsyncClient, auth_headers: dict):
    await client.post("/api/rooms", json=ROOM_PAYLOAD, headers=auth_headers)

    resp = await client.post("/api/notifications/mark-all-read", headers=auth_headers)
    assert resp.status_code == 200

    count_resp = await client.get("/api/notifications/count", headers=auth_headers)
    assert count_resp.json()["unread"] == 0


async def test_notification_count(client: AsyncClient, auth_headers: dict):
    await client.post("/api/rooms", json=ROOM_PAYLOAD, headers=auth_headers)

    resp = await client.get("/api/notifications/count", headers=auth_headers)
    assert resp.status_code == 200
    assert "unread" in resp.json()
    assert resp.json()["unread"] >= 1


async def test_notifications_requires_auth(client: AsyncClient):
    resp = await client.get("/api/notifications")
    assert resp.status_code == 401
```

- [ ] **Step 3: Run notifications tests**

```bash
pytest tests/modules/test_notifications.py -v
```

Expected: 8 passed

- [ ] **Step 4: Run full suite**

```bash
pytest -v
```

Expected: 81 passed (57 + 8 + 8 + 8)

- [ ] **Step 5: Commit**

```bash
git add backend/tests/modules/test_notifications.py backend/tests/conftest.py
git commit -m "test: add notifications integration tests (8 tests)"
```

---

## Self-Review

### Spec coverage
- ✅ GET /api/expenses (paginated, 6 filters) — Task 3
- ✅ GET /api/expenses/stats — Task 3
- ✅ POST /api/expenses, PUT, DELETE, PATCH mark-paid — Task 3
- ✅ Expense code CP-YYYY-NNN auto-generated — Task 3
- ✅ Expense category/status/method validation — Task 3
- ✅ GET /api/posts (paginated, 4 filters) — Task 5
- ✅ GET /api/posts/stats — Task 5
- ✅ POST /api/posts, PUT, DELETE — Task 5
- ✅ POST publish/schedule/duplicate — Task 5
- ✅ Khuyến mãi/Thông báo cannot link room — Task 5 schema
- ✅ room.has_active_post side effect on publish/delete — Task 5 service
- ✅ GET /api/notifications (triggers refresh) — Task 7
- ✅ GET /api/notifications/count — Task 7
- ✅ PATCH /{id}/read, POST /mark-all-read — Task 7
- ✅ contract_expiry, vacant_room, maintenance notification generation — Task 7

### Placeholder scan
No TBDs or TODOs in code steps. All code blocks are complete.

### Type consistency
- `ExpenseCreate.model_post_init` validator used (not `model_validator`) — consistent with schemas not using `@model_validator` here
- `PostService._sync_room_active_post` calls `count_published_for_room` from PostRepository — defined in Task 5 Step 6
- `NotificationService._refresh` imports `EXPIRY_WARNING_DAYS` from contracts.models — defined in Phase 2
- `NotificationRepository.upsert` uses `postgresql.insert` with `on_conflict_do_update` — standard SQLAlchemy 2.0 pattern
