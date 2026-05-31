# Backend Plan 2: Core Inventory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Rooms, Tenants, and Contracts modules with full CRUD, business rules (contract lifecycle side-effects), and integration tests — all 29+ tests passing.

**Architecture:** Three interconnected modules following the same layered pattern as the users module (model → schemas → repository → service → router). Contract lifecycle events (create / renew / terminate) trigger side-effects on Room status and Tenant status/room assignment. Contract status is derived at query-time from `terminated_at` + dates; Tenant and Room status are stored and updated explicitly on contract events.

**Tech Stack:** FastAPI 0.115, SQLAlchemy 2.0 async + asyncpg, Pydantic v2, Alembic, pytest + pytest-asyncio 0.23.8, httpx AsyncClient

**Branch:** `feat/backend-phase2-core-inventory` (already created)

---

## File Map

**New files to create:**
```
backend/alembic/versions/0002_create_rooms.py
backend/alembic/versions/0003_create_tenants.py
backend/alembic/versions/0004_create_contracts.py
backend/app/modules/rooms/models.py
backend/app/modules/rooms/schemas.py
backend/app/modules/rooms/repository.py
backend/app/modules/rooms/service.py
backend/app/modules/rooms/router.py
backend/app/modules/tenants/models.py
backend/app/modules/tenants/schemas.py
backend/app/modules/tenants/repository.py
backend/app/modules/tenants/service.py
backend/app/modules/tenants/router.py
backend/app/modules/contracts/models.py
backend/app/modules/contracts/schemas.py
backend/app/modules/contracts/repository.py
backend/app/modules/contracts/service.py
backend/app/modules/contracts/router.py
backend/tests/modules/test_rooms.py
backend/tests/modules/test_tenants.py
backend/tests/modules/test_contracts.py
```

**Files to modify:**
```
backend/app/common/enums.py          — add SAP_HET_HAN, NO_TIEN to TenantStatus
backend/app/main.py                  — register 3 new routers
backend/tests/conftest.py            — add room/tenant/contract fixture helpers
```

---

## Key Design Decisions

- **Contract status** is computed at query-time from `terminated_at IS NOT NULL`, `end_date < today`, `end_date <= today+30` — not stored as a column. `days_until_expiry` is a computed int returned in the response.
- **Tenant status** is stored as a column and updated explicitly when contracts are created, renewed, or terminated. It reflects: `Đang thuê`, `Sắp hết hạn`, `Nợ tiền`, `Đã trả phòng`.
- **Room status** is stored and updated on contract events: `Trống` ↔ `Đang thuê`.
- **Room `current_tenants`** is a computed count of active contracts returned in the response (not a stored column).
- **Contract code** is auto-generated as `HĐ-YYYY-NNNNN` (max+1 per year, 5-digit zero-padded).
- **`__init__.py`** files for new modules are implied — create them as empty files. They are not shown in every step to avoid repetition.

---

## Task 1: Update TenantStatus Enum + DB Migrations

**Files:**
- Modify: `backend/app/common/enums.py`
- Create: `backend/alembic/versions/0002_create_rooms.py`
- Create: `backend/alembic/versions/0003_create_tenants.py`
- Create: `backend/alembic/versions/0004_create_contracts.py`

- [ ] **Step 1: Add missing TenantStatus values**

Edit `backend/app/common/enums.py`, replace the `TenantStatus` class:

```python
class TenantStatus(str, Enum):
    DANG_THUE = "Đang thuê"
    SAP_HET_HAN = "Sắp hết hạn"
    NO_TIEN = "Nợ tiền"
    DA_TRA_PHONG = "Đã trả phòng"
```

- [ ] **Step 2: Create rooms migration**

Create `backend/alembic/versions/0002_create_rooms.py`:

```python
"""create_rooms

Revision ID: 0002
Revises: 0001
Create Date: 2026-05-19
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "rooms",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("code", sa.String(50), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("floor", sa.String(50), nullable=False),
        sa.Column("block", sa.String(50), nullable=False),
        sa.Column("area", sa.Integer(), nullable=False),
        sa.Column("rent_price", sa.BigInteger(), nullable=False),
        sa.Column("deposit", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("electricity_price", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("water_price", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("service_fee", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("max_tenants", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("status", sa.String(20), nullable=False, server_default="Trống"),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("images", postgresql.JSONB(), nullable=False, server_default="[]"),
        sa.Column("has_active_post", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )
    op.create_index("ix_rooms_status", "rooms", ["status"])
    op.create_index("ix_rooms_block", "rooms", ["block"])


def downgrade() -> None:
    op.drop_index("ix_rooms_block", "rooms")
    op.drop_index("ix_rooms_status", "rooms")
    op.drop_table("rooms")
```

- [ ] **Step 3: Create tenants migration**

Create `backend/alembic/versions/0003_create_tenants.py`:

```python
"""create_tenants

Revision ID: 0003
Revises: 0002
Create Date: 2026-05-19
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "tenants",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(20), nullable=False),
        sa.Column("cccd", sa.String(20), nullable=False),
        sa.Column("gender", sa.String(10), nullable=False),
        sa.Column("date_of_birth", sa.Date(), nullable=False),
        sa.Column("permanent_address", sa.Text(), nullable=False),
        sa.Column(
            "current_room_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("rooms.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("occupation", sa.String(255), nullable=True),
        sa.Column("license_plate", sa.String(50), nullable=True),
        sa.Column("debt", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("status", sa.String(30), nullable=False, server_default="Đã trả phòng"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("phone"),
        sa.UniqueConstraint("cccd"),
    )
    op.create_index("ix_tenants_status", "tenants", ["status"])
    op.create_index("ix_tenants_current_room_id", "tenants", ["current_room_id"])


def downgrade() -> None:
    op.drop_index("ix_tenants_current_room_id", "tenants")
    op.drop_index("ix_tenants_status", "tenants")
    op.drop_table("tenants")
```

- [ ] **Step 4: Create contracts migration**

Create `backend/alembic/versions/0004_create_contracts.py`:

```python
"""create_contracts

Revision ID: 0004
Revises: 0003
Create Date: 2026-05-19
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "contracts",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("code", sa.String(20), nullable=False),
        sa.Column(
            "room_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("rooms.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column(
            "tenant_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tenants.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("monthly_rent", sa.BigInteger(), nullable=False),
        sa.Column("deposit", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("billing_cycle", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("payment_due_day", sa.Integer(), nullable=False, server_default="5"),
        sa.Column("terminated_at", sa.Date(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )
    op.create_index("ix_contracts_room_id", "contracts", ["room_id"])
    op.create_index("ix_contracts_tenant_id", "contracts", ["tenant_id"])
    op.create_index("ix_contracts_end_date", "contracts", ["end_date"])
    op.create_index("ix_contracts_terminated_at", "contracts", ["terminated_at"])


def downgrade() -> None:
    op.drop_index("ix_contracts_terminated_at", "contracts")
    op.drop_index("ix_contracts_end_date", "contracts")
    op.drop_index("ix_contracts_tenant_id", "contracts")
    op.drop_index("ix_contracts_room_id", "contracts")
    op.drop_table("contracts")
```

- [ ] **Step 5: Apply migrations to test DB**

```bash
cd backend
uv run alembic upgrade head
```

Expected output ends with: `Running upgrade 0003 -> 0004, create_contracts`

- [ ] **Step 6: Commit**

```bash
git add backend/app/common/enums.py backend/alembic/versions/
git commit -m "feat: add TenantStatus values + migrations for rooms, tenants, contracts"
```

---

## Task 2: Rooms Module

**Files:**
- Create: `backend/app/modules/rooms/__init__.py`
- Create: `backend/app/modules/rooms/models.py`
- Create: `backend/app/modules/rooms/schemas.py`
- Create: `backend/app/modules/rooms/repository.py`
- Create: `backend/app/modules/rooms/service.py`
- Create: `backend/app/modules/rooms/router.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Create `__init__.py`**

Create `backend/app/modules/rooms/__init__.py` as an empty file.

- [ ] **Step 2: Create Room model**

Create `backend/app/modules/rooms/models.py`:

```python
import uuid
from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Room(Base):
    __tablename__ = "rooms"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    floor: Mapped[str] = mapped_column(String(50), nullable=False)
    block: Mapped[str] = mapped_column(String(50), nullable=False)
    area: Mapped[int] = mapped_column(Integer(), nullable=False)
    rent_price: Mapped[int] = mapped_column(BigInteger(), nullable=False)
    deposit: Mapped[int] = mapped_column(BigInteger(), nullable=False, default=0)
    electricity_price: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)
    water_price: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)
    service_fee: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)
    max_tenants: Mapped[int] = mapped_column(Integer(), nullable=False, default=1)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="Trống")
    description: Mapped[str | None] = mapped_column(Text(), nullable=True)
    images: Mapped[list] = mapped_column(JSONB(), nullable=False, default=list)
    has_active_post: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )
```

- [ ] **Step 3: Create Room schemas**

Create `backend/app/modules/rooms/schemas.py`:

```python
import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class RoomCreate(BaseModel):
    code: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=2, max_length=255)
    floor: str = Field(..., min_length=1, max_length=50)
    block: str = Field(..., min_length=1, max_length=50)
    area: int = Field(..., ge=5)
    rent_price: int = Field(..., ge=500_000)
    deposit: int = Field(0, ge=0)
    electricity_price: int = Field(0, ge=0)
    water_price: int = Field(0, ge=0)
    service_fee: int = Field(0, ge=0)
    max_tenants: int = Field(1, ge=1)
    status: str = "Trống"
    description: str | None = None


class RoomUpdate(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=255)
    floor: str | None = Field(None, min_length=1, max_length=50)
    block: str | None = Field(None, min_length=1, max_length=50)
    area: int | None = Field(None, ge=5)
    rent_price: int | None = Field(None, ge=500_000)
    deposit: int | None = Field(None, ge=0)
    electricity_price: int | None = Field(None, ge=0)
    water_price: int | None = Field(None, ge=0)
    service_fee: int | None = Field(None, ge=0)
    max_tenants: int | None = Field(None, ge=1)
    status: str | None = None
    description: str | None = None


class RoomStatusUpdate(BaseModel):
    status: str
    reason: str | None = None


class RoomResponse(BaseModel):
    id: uuid.UUID
    code: str
    name: str
    floor: str
    block: str
    area: int
    rent_price: int
    deposit: int
    electricity_price: int
    water_price: int
    service_fee: int
    max_tenants: int
    current_tenants: int = 0
    status: str
    description: str | None
    images: list[str]
    has_active_post: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
```

- [ ] **Step 4: Create Room repository**

Create `backend/app/modules/rooms/repository.py`:

```python
import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.rooms.models import Room


class RoomRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, room_id: str | uuid.UUID) -> Room | None:
        result = await self.db.execute(select(Room).where(Room.id == room_id))
        return result.scalar_one_or_none()

    async def get_by_code(self, code: str) -> Room | None:
        result = await self.db.execute(select(Room).where(Room.code == code))
        return result.scalar_one_or_none()

    async def create(self, **kwargs) -> Room:
        room = Room(**kwargs)
        self.db.add(room)
        await self.db.flush()
        await self.db.refresh(room)
        return room

    async def update(self, room: Room, **kwargs) -> Room:
        for key, value in kwargs.items():
            setattr(room, key, value)
        await self.db.flush()
        await self.db.refresh(room)
        return room

    async def delete(self, room: Room) -> None:
        await self.db.delete(room)
        await self.db.flush()

    async def list_rooms(
        self,
        page: int,
        limit: int,
        search: str | None = None,
        status: str | None = None,
        block: str | None = None,
        floor: str | None = None,
        price_min: int | None = None,
        price_max: int | None = None,
    ) -> tuple[list[Room], int]:
        q = select(Room)
        if search:
            pattern = f"%{search}%"
            q = q.where(Room.code.ilike(pattern) | Room.name.ilike(pattern))
        if status:
            q = q.where(Room.status == status)
        if block:
            q = q.where(Room.block == block)
        if floor:
            q = q.where(Room.floor == floor)
        if price_min is not None:
            q = q.where(Room.rent_price >= price_min)
        if price_max is not None:
            q = q.where(Room.rent_price <= price_max)

        count_q = select(func.count()).select_from(q.subquery())
        total = await self.db.scalar(count_q) or 0

        q = q.order_by(Room.code).offset((page - 1) * limit).limit(limit)
        result = await self.db.execute(q)
        return list(result.scalars().all()), total

    async def count_active_contracts(self, room_id: uuid.UUID) -> int:
        """Count non-terminated, non-expired contracts for a room."""
        from datetime import date

        from app.modules.contracts.models import Contract

        today = date.today()
        result = await self.db.execute(
            select(func.count())
            .select_from(Contract)
            .where(
                Contract.room_id == room_id,
                Contract.terminated_at.is_(None),
                Contract.end_date >= today,
            )
        )
        return result.scalar() or 0
```

- [ ] **Step 5: Create Room service**

Create `backend/app/modules/rooms/service.py`:

```python
import uuid

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.pagination import PaginationParams, make_paginated_response
from app.modules.rooms.repository import RoomRepository
from app.modules.rooms.schemas import RoomCreate, RoomResponse, RoomUpdate


class RoomService:
    def __init__(self, db: AsyncSession):
        self.repo = RoomRepository(db)

    async def _to_response(self, room, db) -> RoomResponse:
        current = await self.repo.count_active_contracts(room.id)
        data = RoomResponse.model_validate(room)
        data.current_tenants = current
        return data

    async def list_rooms(self, params: PaginationParams, **filters) -> dict:
        rooms, total = await self.repo.list_rooms(params.page, params.limit, **filters)
        data = []
        for room in rooms:
            current = await self.repo.count_active_contracts(room.id)
            r = RoomResponse.model_validate(room)
            r.current_tenants = current
            data.append(r)
        return make_paginated_response(data, total, params)

    async def create_room(self, payload: RoomCreate) -> RoomResponse:
        existing = await self.repo.get_by_code(payload.code)
        if existing:
            raise HTTPException(status_code=409, detail="Mã phòng đã tồn tại")
        room = await self.repo.create(**payload.model_dump())
        return await self._to_response(room, None)

    async def update_room(self, room_id: str, payload: RoomUpdate) -> RoomResponse:
        room = await self.repo.get_by_id(room_id)
        if not room:
            raise HTTPException(status_code=404, detail="Phòng không tồn tại")
        updates = payload.model_dump(exclude_none=True)
        room = await self.repo.update(room, **updates)
        return await self._to_response(room, None)

    async def delete_room(self, room_id: str) -> None:
        room = await self.repo.get_by_id(room_id)
        if not room:
            raise HTTPException(status_code=404, detail="Phòng không tồn tại")
        active = await self.repo.count_active_contracts(room.id)
        if active > 0:
            raise HTTPException(status_code=409, detail="Không thể xóa phòng đang có khách thuê")
        await self.repo.delete(room)

    async def update_status(self, room_id: str, status: str) -> RoomResponse:
        room = await self.repo.get_by_id(room_id)
        if not room:
            raise HTTPException(status_code=404, detail="Phòng không tồn tại")
        room = await self.repo.update(room, status=status)
        return await self._to_response(room, None)
```

- [ ] **Step 6: Create Room router**

Create `backend/app/modules/rooms/router.py`:

```python
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.pagination import PaginationParams
from app.core.database import get_db
from app.core.dependencies import require_admin
from app.modules.rooms.schemas import RoomCreate, RoomResponse, RoomStatusUpdate, RoomUpdate
from app.modules.rooms.service import RoomService

router = APIRouter(prefix="/api/rooms", tags=["rooms"])


@router.get("", response_model=dict)
async def list_rooms(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    status: str | None = Query(None),
    block: str | None = Query(None),
    floor: str | None = Query(None),
    price_min: int | None = Query(None, alias="priceMin"),
    price_max: int | None = Query(None, alias="priceMax"),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    svc = RoomService(db)
    return await svc.list_rooms(
        PaginationParams(page=page, limit=limit),
        search=search,
        status=status,
        block=block,
        floor=floor,
        price_min=price_min,
        price_max=price_max,
    )


@router.post("", response_model=RoomResponse, status_code=201)
async def create_room(
    payload: RoomCreate,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await RoomService(db).create_room(payload)


@router.put("/{room_id}", response_model=RoomResponse)
async def update_room(
    room_id: str,
    payload: RoomUpdate,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await RoomService(db).update_room(room_id, payload)


@router.delete("/{room_id}", status_code=204)
async def delete_room(
    room_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    await RoomService(db).delete_room(room_id)


@router.patch("/{room_id}/status", response_model=RoomResponse)
async def update_room_status(
    room_id: str,
    payload: RoomStatusUpdate,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await RoomService(db).update_status(room_id, payload.status)
```

- [ ] **Step 7: Register rooms router in main.py**

In `backend/app/main.py`, add:

```python
from app.modules.rooms.router import router as rooms_router
# inside create_app(), after existing include_router calls:
app.include_router(rooms_router)
```

- [ ] **Step 8: Commit rooms module**

```bash
git add backend/app/modules/rooms/ backend/app/main.py
git commit -m "feat: add rooms module (model, schemas, repo, service, router)"
```

---

## Task 3: Rooms Integration Tests

**Files:**
- Create: `backend/tests/modules/test_rooms.py`

- [ ] **Step 1: Write failing tests**

Create `backend/tests/modules/test_rooms.py`:

```python
import pytest
from httpx import AsyncClient


ROOM_PAYLOAD = {
    "code": "P101",
    "name": "Phòng 101",
    "floor": "Tầng 1",
    "block": "Khu A",
    "area": 25,
    "rent_price": 3_500_000,
    "deposit": 7_000_000,
    "electricity_price": 3500,
    "water_price": 15000,
    "service_fee": 100_000,
    "max_tenants": 2,
    "status": "Trống",
    "description": "Test room",
}


async def test_list_rooms_empty(client: AsyncClient, auth_headers: dict):
    resp = await client.get("/api/rooms", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["data"] == []
    assert body["total"] == 0
    assert body["page"] == 1


async def test_create_room(client: AsyncClient, auth_headers: dict):
    resp = await client.post("/api/rooms", json=ROOM_PAYLOAD, headers=auth_headers)
    assert resp.status_code == 201
    body = resp.json()
    assert body["code"] == "P101"
    assert body["status"] == "Trống"
    assert body["current_tenants"] == 0
    assert "id" in body


async def test_create_room_duplicate_code_returns_409(client: AsyncClient, auth_headers: dict):
    await client.post("/api/rooms", json=ROOM_PAYLOAD, headers=auth_headers)
    resp = await client.post("/api/rooms", json=ROOM_PAYLOAD, headers=auth_headers)
    assert resp.status_code == 409


async def test_list_rooms_with_status_filter(client: AsyncClient, auth_headers: dict):
    await client.post("/api/rooms", json=ROOM_PAYLOAD, headers=auth_headers)
    resp = await client.get("/api/rooms?status=Trống", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["total"] == 1

    resp2 = await client.get("/api/rooms?status=Bảo+trì", headers=auth_headers)
    assert resp2.json()["total"] == 0


async def test_update_room(client: AsyncClient, auth_headers: dict):
    create_resp = await client.post("/api/rooms", json=ROOM_PAYLOAD, headers=auth_headers)
    room_id = create_resp.json()["id"]
    resp = await client.put(
        f"/api/rooms/{room_id}",
        json={"name": "Phòng 101 Updated", "area": 30},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Phòng 101 Updated"
    assert resp.json()["area"] == 30


async def test_delete_room_vacant(client: AsyncClient, auth_headers: dict):
    create_resp = await client.post("/api/rooms", json=ROOM_PAYLOAD, headers=auth_headers)
    room_id = create_resp.json()["id"]
    resp = await client.delete(f"/api/rooms/{room_id}", headers=auth_headers)
    assert resp.status_code == 204


async def test_update_room_status(client: AsyncClient, auth_headers: dict):
    create_resp = await client.post("/api/rooms", json=ROOM_PAYLOAD, headers=auth_headers)
    room_id = create_resp.json()["id"]
    resp = await client.patch(
        f"/api/rooms/{room_id}/status",
        json={"status": "Bảo trì", "reason": "Sửa chữa"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "Bảo trì"


async def test_list_rooms_requires_auth(client: AsyncClient):
    resp = await client.get("/api/rooms")
    assert resp.status_code == 401
```

- [ ] **Step 2: Run and verify tests pass**

```bash
cd backend
uv run pytest tests/modules/test_rooms.py -v
```

Expected: `8 passed`

- [ ] **Step 3: Commit tests**

```bash
git add backend/tests/modules/test_rooms.py
git commit -m "test: add rooms integration tests (8 tests)"
```

---

## Task 4: Tenants Module

**Files:**
- Create: `backend/app/modules/tenants/__init__.py`
- Create: `backend/app/modules/tenants/models.py`
- Create: `backend/app/modules/tenants/schemas.py`
- Create: `backend/app/modules/tenants/repository.py`
- Create: `backend/app/modules/tenants/service.py`
- Create: `backend/app/modules/tenants/router.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Create `__init__.py`**

Create `backend/app/modules/tenants/__init__.py` as an empty file.

- [ ] **Step 2: Create Tenant model**

Create `backend/app/modules/tenants/models.py`:

```python
import uuid
from datetime import date, datetime

from sqlalchemy import BigInteger, Date, DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Tenant(Base):
    __tablename__ = "tenants"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    cccd: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    gender: Mapped[str] = mapped_column(String(10), nullable=False)
    date_of_birth: Mapped[date] = mapped_column(Date(), nullable=False)
    permanent_address: Mapped[str] = mapped_column(Text(), nullable=False)
    current_room_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    occupation: Mapped[str | None] = mapped_column(String(255), nullable=True)
    license_plate: Mapped[str | None] = mapped_column(String(50), nullable=True)
    debt: Mapped[int] = mapped_column(BigInteger(), nullable=False, default=0)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="Đã trả phòng")
    notes: Mapped[str | None] = mapped_column(Text(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )
```

- [ ] **Step 3: Create Tenant schemas**

Create `backend/app/modules/tenants/schemas.py`:

```python
import re
import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field, field_validator


class TenantCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255)
    phone: str = Field(..., min_length=10, max_length=20)
    cccd: str = Field(..., min_length=12, max_length=20)
    gender: str = Field(..., pattern="^(Nam|Nữ)$")
    date_of_birth: date
    permanent_address: str = Field(..., min_length=5)
    occupation: str | None = None
    license_plate: str | None = None
    notes: str | None = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        if not re.match(r"^0[0-9]{9}$", v):
            raise ValueError("Số điện thoại phải có 10 chữ số và bắt đầu bằng 0")
        return v

    @field_validator("cccd")
    @classmethod
    def validate_cccd(cls, v: str) -> str:
        if not re.match(r"^[0-9]{12}$", v):
            raise ValueError("CCCD phải có đúng 12 chữ số")
        return v


class TenantUpdate(BaseModel):
    full_name: str | None = Field(None, min_length=2, max_length=255)
    phone: str | None = None
    gender: str | None = Field(None, pattern="^(Nam|Nữ)$")
    date_of_birth: date | None = None
    permanent_address: str | None = Field(None, min_length=5)
    occupation: str | None = None
    license_plate: str | None = None
    notes: str | None = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str | None) -> str | None:
        if v is not None and not re.match(r"^0[0-9]{9}$", v):
            raise ValueError("Số điện thoại phải có 10 chữ số và bắt đầu bằng 0")
        return v


class TenantResponse(BaseModel):
    id: uuid.UUID
    full_name: str
    phone: str
    cccd: str
    gender: str
    date_of_birth: date
    permanent_address: str
    current_room_id: uuid.UUID | None
    current_room_code: str | None = None  # populated in service layer
    occupation: str | None
    license_plate: str | None
    debt: int
    status: str
    notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
```

- [ ] **Step 4: Create Tenant repository**

Create `backend/app/modules/tenants/repository.py`:

```python
import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.tenants.models import Tenant


class TenantRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, tenant_id: str | uuid.UUID) -> Tenant | None:
        result = await self.db.execute(select(Tenant).where(Tenant.id == tenant_id))
        return result.scalar_one_or_none()

    async def get_by_phone(self, phone: str) -> Tenant | None:
        result = await self.db.execute(select(Tenant).where(Tenant.phone == phone))
        return result.scalar_one_or_none()

    async def get_by_cccd(self, cccd: str) -> Tenant | None:
        result = await self.db.execute(select(Tenant).where(Tenant.cccd == cccd))
        return result.scalar_one_or_none()

    async def create(self, **kwargs) -> Tenant:
        tenant = Tenant(**kwargs)
        self.db.add(tenant)
        await self.db.flush()
        await self.db.refresh(tenant)
        return tenant

    async def update(self, tenant: Tenant, **kwargs) -> Tenant:
        for key, value in kwargs.items():
            setattr(tenant, key, value)
        await self.db.flush()
        await self.db.refresh(tenant)
        return tenant

    async def delete(self, tenant: Tenant) -> None:
        await self.db.delete(tenant)
        await self.db.flush()

    async def list_tenants(
        self,
        page: int,
        limit: int,
        search: str | None = None,
        status: str | None = None,
        gender: str | None = None,
    ) -> tuple[list[Tenant], int]:
        q = select(Tenant)
        if search:
            pattern = f"%{search}%"
            q = q.where(
                Tenant.full_name.ilike(pattern)
                | Tenant.phone.ilike(pattern)
                | Tenant.cccd.ilike(pattern)
            )
        if status:
            q = q.where(Tenant.status == status)
        if gender:
            q = q.where(Tenant.gender == gender)

        count_q = select(func.count()).select_from(q.subquery())
        total = await self.db.scalar(count_q) or 0
        q = q.order_by(Tenant.full_name).offset((page - 1) * limit).limit(limit)
        result = await self.db.execute(q)
        return list(result.scalars().all()), total

    async def has_active_contract(self, tenant_id: uuid.UUID) -> bool:
        from datetime import date

        from app.modules.contracts.models import Contract

        today = date.today()
        result = await self.db.execute(
            select(func.count())
            .select_from(Contract)
            .where(
                Contract.tenant_id == tenant_id,
                Contract.terminated_at.is_(None),
                Contract.end_date >= today,
            )
        )
        return (result.scalar() or 0) > 0
```

- [ ] **Step 5: Create Tenant service**

Create `backend/app/modules/tenants/service.py`:

```python
import uuid

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.pagination import PaginationParams, make_paginated_response
from app.modules.tenants.repository import TenantRepository
from app.modules.tenants.schemas import TenantCreate, TenantResponse, TenantUpdate


class TenantService:
    def __init__(self, db: AsyncSession):
        self.repo = TenantRepository(db)

    async def _to_response(self, tenant, db=None) -> TenantResponse:
        resp = TenantResponse.model_validate(tenant)
        if tenant.current_room_id:
            from app.modules.rooms.repository import RoomRepository
            room_repo = RoomRepository(db or self.repo.db)
            room = await room_repo.get_by_id(tenant.current_room_id)
            resp.current_room_code = room.code if room else None
        return resp

    async def list_tenants(self, params: PaginationParams, **filters) -> dict:
        tenants, total = await self.repo.list_tenants(params.page, params.limit, **filters)
        data = [await self._to_response(t) for t in tenants]
        return make_paginated_response(data, total, params)

    async def create_tenant(self, payload: TenantCreate) -> TenantResponse:
        if await self.repo.get_by_phone(payload.phone):
            raise HTTPException(status_code=409, detail="Số điện thoại đã tồn tại")
        if await self.repo.get_by_cccd(payload.cccd):
            raise HTTPException(status_code=409, detail="Số CCCD đã tồn tại")
        tenant = await self.repo.create(**payload.model_dump())
        return await self._to_response(tenant)

    async def update_tenant(self, tenant_id: str, payload: TenantUpdate) -> TenantResponse:
        tenant = await self.repo.get_by_id(tenant_id)
        if not tenant:
            raise HTTPException(status_code=404, detail="Khách thuê không tồn tại")
        updates = payload.model_dump(exclude_none=True)
        if "phone" in updates and updates["phone"] != tenant.phone:
            existing = await self.repo.get_by_phone(updates["phone"])
            if existing:
                raise HTTPException(status_code=409, detail="Số điện thoại đã tồn tại")
        tenant = await self.repo.update(tenant, **updates)
        return await self._to_response(tenant)

    async def delete_tenant(self, tenant_id: str) -> None:
        tenant = await self.repo.get_by_id(tenant_id)
        if not tenant:
            raise HTTPException(status_code=404, detail="Khách thuê không tồn tại")
        if await self.repo.has_active_contract(tenant.id):
            raise HTTPException(
                status_code=409,
                detail="Không thể xóa khách thuê đang có hợp đồng"
            )
        await self.repo.delete(tenant)
```

- [ ] **Step 6: Create Tenant router**

Create `backend/app/modules/tenants/router.py`:

```python
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.pagination import PaginationParams
from app.core.database import get_db
from app.core.dependencies import require_admin
from app.modules.tenants.schemas import TenantCreate, TenantResponse, TenantUpdate
from app.modules.tenants.service import TenantService

router = APIRouter(prefix="/api/tenants", tags=["tenants"])


@router.get("", response_model=dict)
async def list_tenants(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    status: str | None = Query(None),
    gender: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await TenantService(db).list_tenants(
        PaginationParams(page=page, limit=limit),
        search=search,
        status=status,
        gender=gender,
    )


@router.post("", response_model=TenantResponse, status_code=201)
async def create_tenant(
    payload: TenantCreate,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await TenantService(db).create_tenant(payload)


@router.put("/{tenant_id}", response_model=TenantResponse)
async def update_tenant(
    tenant_id: str,
    payload: TenantUpdate,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await TenantService(db).update_tenant(tenant_id, payload)


@router.delete("/{tenant_id}", status_code=204)
async def delete_tenant(
    tenant_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    await TenantService(db).delete_tenant(tenant_id)
```

- [ ] **Step 7: Register tenants router in main.py**

In `backend/app/main.py`, add:

```python
from app.modules.tenants.router import router as tenants_router
# inside create_app():
app.include_router(tenants_router)
```

- [ ] **Step 8: Commit tenants module**

```bash
git add backend/app/modules/tenants/ backend/app/main.py
git commit -m "feat: add tenants module (model, schemas, repo, service, router)"
```

---

## Task 5: Tenants Integration Tests

**Files:**
- Create: `backend/tests/modules/test_tenants.py`

- [ ] **Step 1: Write failing tests**

Create `backend/tests/modules/test_tenants.py`:

```python
from httpx import AsyncClient

TENANT_PAYLOAD = {
    "full_name": "Nguyễn Văn A",
    "phone": "0901234567",
    "cccd": "001234567890",
    "gender": "Nam",
    "date_of_birth": "1995-03-15",
    "permanent_address": "45 Phố Huế, Hà Nội",
    "occupation": "Kỹ sư",
}


async def test_list_tenants_empty(client: AsyncClient, auth_headers: dict):
    resp = await client.get("/api/tenants", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["data"] == []
    assert body["total"] == 0


async def test_create_tenant(client: AsyncClient, auth_headers: dict):
    resp = await client.post("/api/tenants", json=TENANT_PAYLOAD, headers=auth_headers)
    assert resp.status_code == 201
    body = resp.json()
    assert body["full_name"] == "Nguyễn Văn A"
    assert body["phone"] == "0901234567"
    assert body["status"] == "Đã trả phòng"
    assert body["current_room_id"] is None
    assert "password_hash" not in body


async def test_create_tenant_invalid_phone_returns_422(client: AsyncClient, auth_headers: dict):
    bad = {**TENANT_PAYLOAD, "phone": "1234567890"}  # doesn't start with 0
    resp = await client.post("/api/tenants", json=bad, headers=auth_headers)
    assert resp.status_code == 422


async def test_create_tenant_duplicate_phone_returns_409(client: AsyncClient, auth_headers: dict):
    await client.post("/api/tenants", json=TENANT_PAYLOAD, headers=auth_headers)
    dup = {**TENANT_PAYLOAD, "cccd": "999999999999"}
    resp = await client.post("/api/tenants", json=dup, headers=auth_headers)
    assert resp.status_code == 409
    assert "điện thoại" in resp.json()["detail"]


async def test_create_tenant_duplicate_cccd_returns_409(client: AsyncClient, auth_headers: dict):
    await client.post("/api/tenants", json=TENANT_PAYLOAD, headers=auth_headers)
    dup = {**TENANT_PAYLOAD, "phone": "0987654321"}
    resp = await client.post("/api/tenants", json=dup, headers=auth_headers)
    assert resp.status_code == 409
    assert "CCCD" in resp.json()["detail"]


async def test_update_tenant(client: AsyncClient, auth_headers: dict):
    create_resp = await client.post("/api/tenants", json=TENANT_PAYLOAD, headers=auth_headers)
    tenant_id = create_resp.json()["id"]
    resp = await client.put(
        f"/api/tenants/{tenant_id}",
        json={"full_name": "Nguyễn Văn An", "occupation": "Senior Engineer"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["full_name"] == "Nguyễn Văn An"


async def test_delete_tenant_no_contract(client: AsyncClient, auth_headers: dict):
    create_resp = await client.post("/api/tenants", json=TENANT_PAYLOAD, headers=auth_headers)
    tenant_id = create_resp.json()["id"]
    resp = await client.delete(f"/api/tenants/{tenant_id}", headers=auth_headers)
    assert resp.status_code == 204


async def test_list_tenants_requires_auth(client: AsyncClient):
    resp = await client.get("/api/tenants")
    assert resp.status_code == 401
```

- [ ] **Step 2: Run and verify tests pass**

```bash
uv run pytest tests/modules/test_tenants.py -v
```

Expected: `8 passed`

- [ ] **Step 3: Commit tests**

```bash
git add backend/tests/modules/test_tenants.py
git commit -m "test: add tenants integration tests (8 tests)"
```

---

## Task 6: Contracts Module

**Files:**
- Create: `backend/app/modules/contracts/__init__.py`
- Create: `backend/app/modules/contracts/models.py`
- Create: `backend/app/modules/contracts/schemas.py`
- Create: `backend/app/modules/contracts/repository.py`
- Create: `backend/app/modules/contracts/service.py`
- Create: `backend/app/modules/contracts/router.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Create `__init__.py`**

Create `backend/app/modules/contracts/__init__.py` as an empty file.

- [ ] **Step 2: Create Contract model**

Create `backend/app/modules/contracts/models.py`:

```python
import uuid
from datetime import date, datetime

from sqlalchemy import BigInteger, Date, DateTime, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Contract(Base):
    __tablename__ = "contracts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    room_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    start_date: Mapped[date] = mapped_column(Date(), nullable=False)
    end_date: Mapped[date] = mapped_column(Date(), nullable=False)
    monthly_rent: Mapped[int] = mapped_column(BigInteger(), nullable=False)
    deposit: Mapped[int] = mapped_column(BigInteger(), nullable=False, default=0)
    billing_cycle: Mapped[int] = mapped_column(Integer(), nullable=False, default=1)
    payment_due_day: Mapped[int] = mapped_column(Integer(), nullable=False, default=5)
    terminated_at: Mapped[date | None] = mapped_column(Date(), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

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
        today = date.today()
        return max(0, (self.end_date - today).days)
```

- [ ] **Step 3: Create Contract schemas**

Create `backend/app/modules/contracts/schemas.py`:

```python
import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field, model_validator


class ContractCreate(BaseModel):
    room_id: uuid.UUID
    tenant_id: uuid.UUID
    start_date: date
    end_date: date
    monthly_rent: int = Field(..., ge=100_000)
    deposit: int = Field(0, ge=0)
    billing_cycle: int = Field(1, pattern=None)
    payment_due_day: int = Field(5, ge=1, le=28)
    notes: str | None = None

    @model_validator(mode="after")
    def end_after_start(self):
        if self.end_date <= self.start_date:
            raise ValueError("Ngày kết thúc phải sau ngày bắt đầu")
        if self.billing_cycle not in (1, 3, 6, 12):
            raise ValueError("Kỳ thanh toán phải là 1, 3, 6 hoặc 12 tháng")
        return self


class ContractUpdate(BaseModel):
    monthly_rent: int | None = Field(None, ge=100_000)
    deposit: int | None = Field(None, ge=0)
    payment_due_day: int | None = Field(None, ge=1, le=28)
    notes: str | None = None


class ContractRenew(BaseModel):
    new_start_date: date
    new_end_date: date
    monthly_rent: int = Field(..., ge=100_000)
    deposit: int = Field(0, ge=0)
    billing_cycle: int = Field(1)
    payment_due_day: int = Field(5, ge=1, le=28)
    notes: str | None = None

    @model_validator(mode="after")
    def end_after_start(self):
        if self.new_end_date <= self.new_start_date:
            raise ValueError("Ngày kết thúc phải sau ngày bắt đầu")
        if self.billing_cycle not in (1, 3, 6, 12):
            raise ValueError("Kỳ thanh toán phải là 1, 3, 6 hoặc 12 tháng")
        return self


class ContractTerminate(BaseModel):
    termination_date: date
    reason: str | None = None


class ContractResponse(BaseModel):
    id: uuid.UUID
    code: str
    room_id: uuid.UUID
    room_code: str | None = None       # populated in service
    room_name: str | None = None       # populated in service
    tenant_id: uuid.UUID
    tenant_name: str | None = None     # populated in service
    tenant_phone: str | None = None    # populated in service
    tenant_cccd: str | None = None     # populated in service
    start_date: date
    end_date: date
    monthly_rent: int
    deposit: int
    billing_cycle: int
    payment_due_day: int
    terminated_at: date | None
    status: str                        # computed property
    days_until_expiry: int | None      # computed property
    notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
```

- [ ] **Step 4: Create Contract repository**

Create `backend/app/modules/contracts/repository.py`:

```python
import uuid
from datetime import date, timedelta

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.contracts.models import Contract


class ContractRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, contract_id: str | uuid.UUID) -> Contract | None:
        result = await self.db.execute(
            select(Contract).where(Contract.id == contract_id)
        )
        return result.scalar_one_or_none()

    async def get_active_for_room(self, room_id: uuid.UUID) -> Contract | None:
        """Return the current active (non-terminated, non-expired) contract for a room."""
        today = date.today()
        result = await self.db.execute(
            select(Contract).where(
                Contract.room_id == room_id,
                Contract.terminated_at.is_(None),
                Contract.end_date >= today,
            )
        )
        return result.scalar_one_or_none()

    async def get_last_code_for_year(self, year: int) -> str | None:
        prefix = f"HĐ-{year}-"
        result = await self.db.execute(
            select(Contract.code)
            .where(Contract.code.like(f"{prefix}%"))
            .order_by(Contract.code.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def create(self, **kwargs) -> Contract:
        contract = Contract(**kwargs)
        self.db.add(contract)
        await self.db.flush()
        await self.db.refresh(contract)
        return contract

    async def update(self, contract: Contract, **kwargs) -> Contract:
        for key, value in kwargs.items():
            setattr(contract, key, value)
        await self.db.flush()
        await self.db.refresh(contract)
        return contract

    async def delete(self, contract: Contract) -> None:
        await self.db.delete(contract)
        await self.db.flush()

    async def list_contracts(
        self,
        page: int,
        limit: int,
        search: str | None = None,
        status: str | None = None,
    ) -> tuple[list[Contract], int]:
        today = date.today()
        thirty_days = today + timedelta(days=30)

        q = select(Contract)
        if search:
            pattern = f"%{search}%"
            q = q.where(Contract.code.ilike(pattern))

        # Status filter — translate to date/flag conditions
        if status == "Đã chấm dứt":
            q = q.where(Contract.terminated_at.isnot(None))
        elif status == "Đã hết hạn":
            q = q.where(Contract.terminated_at.is_(None), Contract.end_date < today)
        elif status == "Sắp hết hạn":
            q = q.where(
                Contract.terminated_at.is_(None),
                Contract.end_date >= today,
                Contract.end_date <= thirty_days,
            )
        elif status == "Đang hiệu lực":
            q = q.where(Contract.terminated_at.is_(None), Contract.end_date > thirty_days)

        count_q = select(func.count()).select_from(q.subquery())
        total = await self.db.scalar(count_q) or 0
        q = q.order_by(Contract.code.desc()).offset((page - 1) * limit).limit(limit)
        result = await self.db.execute(q)
        return list(result.scalars().all()), total
```

- [ ] **Step 5: Create Contract service**

Create `backend/app/modules/contracts/service.py`:

```python
import uuid
from datetime import date

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.pagination import PaginationParams, make_paginated_response
from app.modules.contracts.repository import ContractRepository
from app.modules.contracts.schemas import (
    ContractCreate,
    ContractRenew,
    ContractResponse,
    ContractTerminate,
    ContractUpdate,
)
from app.modules.contracts.models import Contract
from app.modules.rooms.repository import RoomRepository
from app.modules.tenants.repository import TenantRepository


class ContractService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = ContractRepository(db)
        self.room_repo = RoomRepository(db)
        self.tenant_repo = TenantRepository(db)

    async def _generate_code(self) -> str:
        year = date.today().year
        last_code = await self.repo.get_last_code_for_year(year)
        if last_code:
            num = int(last_code.split("-")[-1]) + 1
        else:
            num = 1
        return f"HĐ-{year}-{num:05d}"

    async def _compute_tenant_status(self, tenant_id: uuid.UUID) -> str:
        """Derive tenant status from their active contract state."""
        from app.modules.contracts.models import Contract
        from sqlalchemy import select, func

        today = date.today()
        result = await self.db.execute(
            select(Contract).where(
                Contract.tenant_id == tenant_id,
                Contract.terminated_at.is_(None),
                Contract.end_date >= today,
            )
        )
        active = result.scalar_one_or_none()
        if active is None:
            return "Đã trả phòng"
        if active.days_until_expiry is not None and active.days_until_expiry <= 30:
            return "Sắp hết hạn"
        return "Đang thuê"

    async def _to_response(self, contract: Contract) -> ContractResponse:
        resp = ContractResponse.model_validate(contract)
        resp.status = contract.status
        resp.days_until_expiry = contract.days_until_expiry
        room = await self.room_repo.get_by_id(contract.room_id)
        if room:
            resp.room_code = room.code
            resp.room_name = room.name
        tenant = await self.tenant_repo.get_by_id(contract.tenant_id)
        if tenant:
            resp.tenant_name = tenant.full_name
            resp.tenant_phone = tenant.phone
            resp.tenant_cccd = tenant.cccd
        return resp

    async def list_contracts(self, params: PaginationParams, **filters) -> dict:
        contracts, total = await self.repo.list_contracts(params.page, params.limit, **filters)
        data = [await self._to_response(c) for c in contracts]
        return make_paginated_response(data, total, params)

    async def create_contract(self, payload: ContractCreate) -> ContractResponse:
        room = await self.room_repo.get_by_id(str(payload.room_id))
        if not room:
            raise HTTPException(status_code=404, detail="Phòng không tồn tại")
        tenant = await self.tenant_repo.get_by_id(str(payload.tenant_id))
        if not tenant:
            raise HTTPException(status_code=404, detail="Khách thuê không tồn tại")

        # Room must not already have an active contract
        existing = await self.repo.get_active_for_room(payload.room_id)
        if existing:
            raise HTTPException(status_code=409, detail="Phòng đã có hợp đồng đang hiệu lực")

        code = await self._generate_code()
        contract = await self.repo.create(
            code=code,
            room_id=payload.room_id,
            tenant_id=payload.tenant_id,
            start_date=payload.start_date,
            end_date=payload.end_date,
            monthly_rent=payload.monthly_rent,
            deposit=payload.deposit,
            billing_cycle=payload.billing_cycle,
            payment_due_day=payload.payment_due_day,
            notes=payload.notes,
        )

        # Side effects: update room and tenant
        await self.room_repo.update(room, status="Đang thuê")
        tenant_status = await self._compute_tenant_status(tenant.id)
        await self.tenant_repo.update(
            tenant,
            current_room_id=room.id,
            status=tenant_status,
        )

        return await self._to_response(contract)

    async def update_contract(self, contract_id: str, payload: ContractUpdate) -> ContractResponse:
        contract = await self.repo.get_by_id(contract_id)
        if not contract:
            raise HTTPException(status_code=404, detail="Hợp đồng không tồn tại")
        if contract.status not in ("Đang hiệu lực", "Sắp hết hạn"):
            raise HTTPException(
                status_code=409, detail="Chỉ cập nhật hợp đồng đang hiệu lực"
            )
        updates = payload.model_dump(exclude_none=True)
        contract = await self.repo.update(contract, **updates)
        return await self._to_response(contract)

    async def renew_contract(self, contract_id: str, payload: ContractRenew) -> dict:
        contract = await self.repo.get_by_id(contract_id)
        if not contract:
            raise HTTPException(status_code=404, detail="Hợp đồng không tồn tại")
        if contract.status == "Đã chấm dứt":
            raise HTTPException(
                status_code=409, detail="Không thể gia hạn hợp đồng đã chấm dứt"
            )

        # Create new contract first (reuses same room + tenant)
        existing = await self.repo.get_active_for_room(contract.room_id)
        if existing and str(existing.id) != contract_id:
            raise HTTPException(status_code=409, detail="Phòng đã có hợp đồng đang hiệu lực khác")

        code = await self._generate_code()
        new_contract = await self.repo.create(
            code=code,
            room_id=contract.room_id,
            tenant_id=contract.tenant_id,
            start_date=payload.new_start_date,
            end_date=payload.new_end_date,
            monthly_rent=payload.monthly_rent,
            deposit=payload.deposit,
            billing_cycle=payload.billing_cycle,
            payment_due_day=payload.payment_due_day,
            notes=payload.notes,
        )

        # Mark old contract as expired if not already
        if contract.status != "Đã hết hạn":
            await self.repo.update(contract, terminated_at=contract.end_date)

        return {
            "old_contract": await self._to_response(contract),
            "new_contract": await self._to_response(new_contract),
        }

    async def terminate_contract(
        self, contract_id: str, payload: ContractTerminate
    ) -> ContractResponse:
        contract = await self.repo.get_by_id(contract_id)
        if not contract:
            raise HTTPException(status_code=404, detail="Hợp đồng không tồn tại")
        if contract.status not in ("Đang hiệu lực", "Sắp hết hạn"):
            raise HTTPException(
                status_code=409, detail="Chỉ chấm dứt hợp đồng đang hiệu lực"
            )

        contract = await self.repo.update(contract, terminated_at=payload.termination_date)

        # Side effects: free room + update tenant
        room = await self.room_repo.get_by_id(contract.room_id)
        if room:
            await self.room_repo.update(room, status="Trống")

        tenant = await self.tenant_repo.get_by_id(contract.tenant_id)
        if tenant:
            await self.tenant_repo.update(
                tenant,
                current_room_id=None,
                status="Đã trả phòng",
            )

        return await self._to_response(contract)

    async def delete_contract(self, contract_id: str) -> None:
        contract = await self.repo.get_by_id(contract_id)
        if not contract:
            raise HTTPException(status_code=404, detail="Hợp đồng không tồn tại")
        if contract.status in ("Đang hiệu lực", "Sắp hết hạn"):
            raise HTTPException(
                status_code=409, detail="Không thể xóa hợp đồng đang hiệu lực"
            )
        await self.repo.delete(contract)
```

- [ ] **Step 6: Create Contract router**

Create `backend/app/modules/contracts/router.py`:

```python
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.pagination import PaginationParams
from app.core.database import get_db
from app.core.dependencies import require_admin
from app.modules.contracts.schemas import (
    ContractCreate,
    ContractRenew,
    ContractResponse,
    ContractTerminate,
    ContractUpdate,
)
from app.modules.contracts.service import ContractService

router = APIRouter(prefix="/api/contracts", tags=["contracts"])


@router.get("", response_model=dict)
async def list_contracts(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    status: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await ContractService(db).list_contracts(
        PaginationParams(page=page, limit=limit),
        search=search,
        status=status,
    )


@router.post("", response_model=ContractResponse, status_code=201)
async def create_contract(
    payload: ContractCreate,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await ContractService(db).create_contract(payload)


@router.put("/{contract_id}", response_model=ContractResponse)
async def update_contract(
    contract_id: str,
    payload: ContractUpdate,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await ContractService(db).update_contract(contract_id, payload)


@router.post("/{contract_id}/renew", response_model=dict)
async def renew_contract(
    contract_id: str,
    payload: ContractRenew,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await ContractService(db).renew_contract(contract_id, payload)


@router.post("/{contract_id}/terminate", response_model=ContractResponse)
async def terminate_contract(
    contract_id: str,
    payload: ContractTerminate,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await ContractService(db).terminate_contract(contract_id, payload)


@router.delete("/{contract_id}", status_code=204)
async def delete_contract(
    contract_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    await ContractService(db).delete_contract(contract_id)
```

- [ ] **Step 7: Register contracts router in main.py**

In `backend/app/main.py`, add:

```python
from app.modules.contracts.router import router as contracts_router
# inside create_app():
app.include_router(contracts_router)
```

Also add the noqa import for contracts model in conftest.py to ensure table is registered:

In `backend/tests/conftest.py`, add after the existing noqa import:
```python
from app.modules.rooms.models import Room  # noqa: F401
from app.modules.tenants.models import Tenant  # noqa: F401
from app.modules.contracts.models import Contract  # noqa: F401
```

- [ ] **Step 8: Commit contracts module**

```bash
git add backend/app/modules/contracts/ backend/app/main.py backend/tests/conftest.py
git commit -m "feat: add contracts module with renew/terminate + room/tenant side effects"
```

---

## Task 7: Contracts Integration Tests

**Files:**
- Create: `backend/tests/modules/test_contracts.py`

- [ ] **Step 1: Write failing tests**

Create `backend/tests/modules/test_contracts.py`:

```python
from datetime import date, timedelta

import pytest
from httpx import AsyncClient


ROOM_PAYLOAD = {
    "code": "C101",
    "name": "Phòng C101",
    "floor": "Tầng 1",
    "block": "Khu C",
    "area": 25,
    "rent_price": 3_500_000,
    "deposit": 7_000_000,
    "electricity_price": 3500,
    "water_price": 15000,
    "service_fee": 100_000,
    "max_tenants": 2,
}

TENANT_PAYLOAD = {
    "full_name": "Trần Thị B",
    "phone": "0912345678",
    "cccd": "098765432109",
    "gender": "Nữ",
    "date_of_birth": "1998-06-20",
    "permanent_address": "12 Nguyễn Huệ, TP.HCM",
}


def future_date(days: int) -> str:
    return (date.today() + timedelta(days=days)).isoformat()


def past_date(days: int) -> str:
    return (date.today() - timedelta(days=days)).isoformat()


async def create_room_and_tenant(client, auth_headers):
    room_resp = await client.post("/api/rooms", json=ROOM_PAYLOAD, headers=auth_headers)
    tenant_resp = await client.post("/api/tenants", json=TENANT_PAYLOAD, headers=auth_headers)
    return room_resp.json()["id"], tenant_resp.json()["id"]


async def test_create_contract_updates_room_and_tenant(client: AsyncClient, auth_headers: dict):
    room_id, tenant_id = await create_room_and_tenant(client, auth_headers)
    contract_payload = {
        "room_id": room_id,
        "tenant_id": tenant_id,
        "start_date": future_date(0),
        "end_date": future_date(365),
        "monthly_rent": 3_500_000,
        "deposit": 7_000_000,
        "billing_cycle": 1,
        "payment_due_day": 5,
    }
    resp = await client.post("/api/contracts", json=contract_payload, headers=auth_headers)
    assert resp.status_code == 201
    body = resp.json()
    assert body["status"] == "Đang hiệu lực"
    assert body["days_until_expiry"] is not None
    assert body["room_code"] == "C101"
    assert body["tenant_name"] == "Trần Thị B"
    assert body["code"].startswith("HĐ-")

    # Room should now be occupied
    room_resp = await client.get("/api/rooms", headers=auth_headers)
    rooms = room_resp.json()["data"]
    assert any(r["status"] == "Đang thuê" for r in rooms if r["id"] == room_id)

    # Tenant should be assigned to room
    tenant_resp = await client.get("/api/tenants", headers=auth_headers)
    tenants = tenant_resp.json()["data"]
    tenant = next(t for t in tenants if t["id"] == tenant_id)
    assert tenant["current_room_id"] == room_id
    assert tenant["status"] == "Đang thuê"


async def test_create_contract_on_occupied_room_returns_409(
    client: AsyncClient, auth_headers: dict
):
    room_id, tenant_id = await create_room_and_tenant(client, auth_headers)
    payload = {
        "room_id": room_id,
        "tenant_id": tenant_id,
        "start_date": future_date(0),
        "end_date": future_date(365),
        "monthly_rent": 3_500_000,
        "deposit": 7_000_000,
        "billing_cycle": 1,
        "payment_due_day": 5,
    }
    await client.post("/api/contracts", json=payload, headers=auth_headers)

    # Second tenant
    second_tenant = await client.post(
        "/api/tenants",
        json={**TENANT_PAYLOAD, "phone": "0998877665", "cccd": "111111111111"},
        headers=auth_headers,
    )
    payload2 = {**payload, "tenant_id": second_tenant.json()["id"]}
    resp = await client.post("/api/contracts", json=payload2, headers=auth_headers)
    assert resp.status_code == 409


async def test_list_contracts_with_status_filter(client: AsyncClient, auth_headers: dict):
    room_id, tenant_id = await create_room_and_tenant(client, auth_headers)

    # Create active contract
    await client.post(
        "/api/contracts",
        json={
            "room_id": room_id,
            "tenant_id": tenant_id,
            "start_date": future_date(0),
            "end_date": future_date(365),
            "monthly_rent": 3_500_000,
            "deposit": 7_000_000,
            "billing_cycle": 1,
            "payment_due_day": 5,
        },
        headers=auth_headers,
    )

    resp = await client.get("/api/contracts?status=Đang+hiệu+lực", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["total"] >= 1

    resp2 = await client.get("/api/contracts?status=Đã+chấm+dứt", headers=auth_headers)
    assert resp2.json()["total"] == 0


async def test_terminate_contract_frees_room_and_tenant(client: AsyncClient, auth_headers: dict):
    room_id, tenant_id = await create_room_and_tenant(client, auth_headers)
    create_resp = await client.post(
        "/api/contracts",
        json={
            "room_id": room_id,
            "tenant_id": tenant_id,
            "start_date": future_date(0),
            "end_date": future_date(365),
            "monthly_rent": 3_500_000,
            "deposit": 7_000_000,
            "billing_cycle": 1,
            "payment_due_day": 5,
        },
        headers=auth_headers,
    )
    contract_id = create_resp.json()["id"]

    resp = await client.post(
        f"/api/contracts/{contract_id}/terminate",
        json={"termination_date": future_date(1), "reason": "Khách chuyển đi"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "Đã chấm dứt"
    assert resp.json()["days_until_expiry"] is None

    # Room should be vacant again
    room_resp = await client.get("/api/rooms", headers=auth_headers)
    rooms = room_resp.json()["data"]
    our_room = next(r for r in rooms if r["id"] == room_id)
    assert our_room["status"] == "Trống"

    # Tenant should be vacated
    tenant_resp = await client.get("/api/tenants", headers=auth_headers)
    tenants = tenant_resp.json()["data"]
    our_tenant = next(t for t in tenants if t["id"] == tenant_id)
    assert our_tenant["status"] == "Đã trả phòng"
    assert our_tenant["current_room_id"] is None


async def test_renew_contract(client: AsyncClient, auth_headers: dict):
    room_id, tenant_id = await create_room_and_tenant(client, auth_headers)
    create_resp = await client.post(
        "/api/contracts",
        json={
            "room_id": room_id,
            "tenant_id": tenant_id,
            "start_date": future_date(0),
            "end_date": future_date(30),
            "monthly_rent": 3_500_000,
            "deposit": 7_000_000,
            "billing_cycle": 1,
            "payment_due_day": 5,
        },
        headers=auth_headers,
    )
    contract_id = create_resp.json()["id"]

    renew_resp = await client.post(
        f"/api/contracts/{contract_id}/renew",
        json={
            "new_start_date": future_date(31),
            "new_end_date": future_date(365),
            "monthly_rent": 3_600_000,
            "deposit": 7_200_000,
            "billing_cycle": 1,
            "payment_due_day": 5,
        },
        headers=auth_headers,
    )
    assert renew_resp.status_code == 200
    body = renew_resp.json()
    assert "old_contract" in body
    assert "new_contract" in body
    assert body["new_contract"]["monthly_rent"] == 3_600_000
    assert body["new_contract"]["code"] != body["old_contract"]["code"]


async def test_delete_active_contract_returns_409(client: AsyncClient, auth_headers: dict):
    room_id, tenant_id = await create_room_and_tenant(client, auth_headers)
    create_resp = await client.post(
        "/api/contracts",
        json={
            "room_id": room_id,
            "tenant_id": tenant_id,
            "start_date": future_date(0),
            "end_date": future_date(365),
            "monthly_rent": 3_500_000,
            "deposit": 7_000_000,
            "billing_cycle": 1,
            "payment_due_day": 5,
        },
        headers=auth_headers,
    )
    contract_id = create_resp.json()["id"]
    resp = await client.delete(f"/api/contracts/{contract_id}", headers=auth_headers)
    assert resp.status_code == 409


async def test_delete_terminated_contract(client: AsyncClient, auth_headers: dict):
    room_id, tenant_id = await create_room_and_tenant(client, auth_headers)
    create_resp = await client.post(
        "/api/contracts",
        json={
            "room_id": room_id,
            "tenant_id": tenant_id,
            "start_date": future_date(0),
            "end_date": future_date(365),
            "monthly_rent": 3_500_000,
            "deposit": 7_000_000,
            "billing_cycle": 1,
            "payment_due_day": 5,
        },
        headers=auth_headers,
    )
    contract_id = create_resp.json()["id"]

    await client.post(
        f"/api/contracts/{contract_id}/terminate",
        json={"termination_date": future_date(1)},
        headers=auth_headers,
    )
    resp = await client.delete(f"/api/contracts/{contract_id}", headers=auth_headers)
    assert resp.status_code == 204


async def test_list_contracts_requires_auth(client: AsyncClient):
    resp = await client.get("/api/contracts")
    assert resp.status_code == 401
```

- [ ] **Step 2: Run all tests**

```bash
uv run pytest -v
```

Expected: all tests pass (previous 29 + 8 rooms + 8 tenants + 8 contracts = 53 tests)

If any test fails, check:
- `conftest.py` has the noqa imports for Room, Tenant, Contract models
- Migrations ran against `moteldb_test` (run `uv run alembic upgrade head` if tables are missing)

- [ ] **Step 3: Commit tests**

```bash
git add backend/tests/modules/test_contracts.py
git commit -m "test: add contracts integration tests (8 tests)"
```

---

## Task 8: Update API Contract Docs + Final Commit

**Files:**
- Create: `docs/api-contracts/rooms-tenants-contracts.md`

- [ ] **Step 1: Create API contract document**

Create `docs/api-contracts/rooms-tenants-contracts.md` documenting all endpoints exactly as implemented:

```markdown
# API Contract: Rooms, Tenants, Contracts

## Authentication
All endpoints require `Authorization: Bearer <token>` and `admin` role.

## Rooms  `/api/rooms`

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/rooms | List rooms (paginated, filterable) |
| POST | /api/rooms | Create room |
| PUT | /api/rooms/{id} | Update room |
| DELETE | /api/rooms/{id} | Delete room (fails if occupied) |
| PATCH | /api/rooms/{id}/status | Update room status |

**GET /api/rooms query params:** `page`, `limit`, `search`, `status`, `block`, `floor`, `priceMin`, `priceMax`

**Response shape (list):** `{data: RoomResponse[], total, page, limit, total_pages}`

## Tenants  `/api/tenants`

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/tenants | List tenants (paginated, filterable) |
| POST | /api/tenants | Create tenant |
| PUT | /api/tenants/{id} | Update tenant |
| DELETE | /api/tenants/{id} | Delete tenant (fails if active contract) |

**GET /api/tenants query params:** `page`, `limit`, `search`, `status`, `gender`

## Contracts  `/api/contracts`

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/contracts | List contracts (paginated, filterable) |
| POST | /api/contracts | Create contract (updates room+tenant) |
| PUT | /api/contracts/{id} | Update contract (rent/notes only) |
| POST | /api/contracts/{id}/renew | Renew contract (creates new, marks old expired) |
| POST | /api/contracts/{id}/terminate | Terminate contract (frees room+tenant) |
| DELETE | /api/contracts/{id} | Delete (only terminated/expired) |

**Contract status** is computed at read time from `terminated_at` + `end_date` — not stored as a column.  
**Side effects on create:** room.status → "Đang thuê", tenant.current_room_id, tenant.status updated.  
**Side effects on terminate:** room.status → "Trống", tenant.current_room_id → null, tenant.status → "Đã trả phòng".
```

- [ ] **Step 2: Run full test suite one last time**

```bash
uv run pytest -v
```

All tests must pass.

- [ ] **Step 3: Final commit**

```bash
git add docs/api-contracts/rooms-tenants-contracts.md
git commit -m "docs: add API contract for rooms, tenants, contracts modules"
```

---

## Completion Checklist

- [ ] All 3 migrations applied without error
- [ ] `uv run pytest -v` shows all tests green (53 total)
- [ ] `GET /api/rooms`, `GET /api/tenants`, `GET /api/contracts` return paginated results
- [ ] Creating a contract updates room status to `Đang thuê` and sets tenant's `current_room_id`
- [ ] Terminating a contract resets room to `Trống` and tenant to `Đã trả phòng`
- [ ] Renewing a contract creates a new contract with incremented code
- [ ] Deleting an occupied room returns 409
- [ ] Duplicate room code / tenant phone / tenant CCCD return 409
- [ ] All endpoints return 401 when no auth token provided
- [ ] API contract doc is committed to `docs/api-contracts/`
