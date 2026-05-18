# Backend Plan 1: Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the FastAPI backend with auth (JWT login/me/refresh) and users CRUD, backed by PostgreSQL via async SQLAlchemy, with a full passing test suite — unblocking all subsequent module plans.

**Architecture:** Four-layer FastAPI app (router → service → repository → DB). All modules live under `backend/app/modules/<name>/`. Cross-cutting infrastructure lives in `backend/app/core/` and `backend/app/common/`. Alembic manages migrations. Tests use a dedicated test database via httpx AsyncClient.

**Tech Stack:** Python 3.12, FastAPI 0.115, SQLAlchemy 2.0 (async + asyncpg), Alembic 1.13, Pydantic v2, pydantic-settings 2, python-jose[cryptography] 3.3, passlib[bcrypt] 1.7, pytest 8 + pytest-asyncio 0.23 + httpx 0.27, uv (package manager)

---

## File Map

```
backend/
├── pyproject.toml
├── .env                        ← gitignored; copy from .env.example
├── .env.example
├── Makefile
├── alembic.ini
├── alembic/
│   ├── env.py
│   └── versions/
│       └── 0001_create_users.py   ← generated in Task 6
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── security.py
│   │   └── dependencies.py
│   ├── common/
│   │   ├── __init__.py
│   │   ├── enums.py
│   │   ├── exceptions.py
│   │   ├── pagination.py
│   │   └── schemas.py
│   └── modules/
│       ├── __init__.py
│       ├── auth/
│       │   ├── __init__.py
│       │   ├── router.py
│       │   ├── service.py
│       │   └── schemas.py
│       └── users/
│           ├── __init__.py
│           ├── router.py
│           ├── service.py
│           ├── repository.py
│           ├── models.py
│           └── schemas.py
├── tests/
│   ├── conftest.py
│   ├── test_auth.py
│   └── modules/
│       ├── __init__.py
│       └── test_users.py
└── docs/
    └── api-contracts/
        └── auth-users.md          ← written in Task 2
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `backend/pyproject.toml`
- Create: `backend/.env.example`
- Create: `backend/Makefile`
- Create: `backend/app/__init__.py` (and all `__init__.py` stubs)

- [ ] **Step 1: Create the backend directory structure**

```bash
mkdir -p backend/app/core backend/app/common backend/app/modules/auth backend/app/modules/users
mkdir -p backend/alembic/versions backend/tests/modules backend/docs/api-contracts
touch backend/app/__init__.py backend/app/core/__init__.py backend/app/common/__init__.py
touch backend/app/modules/__init__.py backend/app/modules/auth/__init__.py backend/app/modules/users/__init__.py
touch backend/tests/__init__.py backend/tests/modules/__init__.py
```

- [ ] **Step 2: Write `backend/pyproject.toml`**

```toml
[project]
name = "motelmanage-backend"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.30.0",
    "sqlalchemy>=2.0.36",
    "asyncpg>=0.29.0",
    "alembic>=1.13.0",
    "pydantic>=2.9.0",
    "pydantic-settings>=2.6.0",
    "pydantic[email]>=2.9.0",
    "python-jose[cryptography]>=3.3.0",
    "passlib[bcrypt]>=1.7.4",
    "python-multipart>=0.0.9",
]

[dependency-groups]
dev = [
    "pytest>=8.3.0",
    "pytest-asyncio>=0.23.0",
    "httpx>=0.27.0",
]

[tool.ruff]
line-length = 100
target-version = "py312"

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
```

- [ ] **Step 3: Write `backend/.env.example`**

```dotenv
# PostgreSQL (asyncpg driver)
# Supabase: postgresql+asyncpg://postgres:[password]@db.[ref].supabase.co:5432/postgres
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/motelmanage

# Test database — used by pytest (must exist, tables auto-created/dropped per run)
TEST_DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/motelmanage_test

# JWT
SECRET_KEY=change-me-to-a-random-64-char-hex-string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
REFRESH_TOKEN_EXPIRE_DAYS=30

# Anthropic (used in Plan 6)
ANTHROPIC_API_KEY=your-anthropic-api-key-here
```

- [ ] **Step 4: Write `backend/Makefile`**

```makefile
.PHONY: install dev test migrate seed

install:
	cd backend && uv sync

dev:
	cd backend && uv run uvicorn app.main:app --reload --port 8000

test:
	cd backend && uv run pytest -v

migrate:
	cd backend && uv run alembic upgrade head

seed:
	cd backend && uv run python -m scripts.seed
```

- [ ] **Step 5: Copy .env.example → .env and fill in real values**

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your real DATABASE_URL and SECRET_KEY
# Generate a SECRET_KEY: python -c "import secrets; print(secrets.token_hex(32))"
```

- [ ] **Step 6: Install dependencies**

Run from `backend/`:
```bash
cd backend && uv sync --dev
```

Expected: No errors. `.venv/` created.

- [ ] **Step 7: Add backend/.gitignore**

```gitignore
.env
.venv/
__pycache__/
*.pyc
*.egg-info/
dist/
.pytest_cache/
```

- [ ] **Step 8: Commit**

```bash
git add backend/
git commit -m "chore: scaffold backend project structure"
```

---

## Task 2: Write API Contract for Auth + Users

**Files:**
- Create: `backend/docs/api-contracts/auth-users.md`

> **CLAUDE.md rule:** Never start coding backend before writing or updating the module API contract.

- [ ] **Step 1: Write `backend/docs/api-contracts/auth-users.md`**

```markdown
# API Contract: Auth + Users

**Version:** 1.0  
**Base URL:** `/api`  
**Auth:** Bearer JWT (except /auth/login)

---

## POST /auth/login

**Request:**
```json
{ "email": "admin@example.com", "password": "secret" }
```
**Response 200:**
```json
{ "access_token": "...", "refresh_token": "...", "token_type": "bearer" }
```
**Response 401:** `{ "detail": "Invalid credentials" }`

---

## GET /auth/me

**Headers:** `Authorization: Bearer <access_token>`  
**Response 200:** UserResponse (see below)  
**Response 401:** `{ "detail": "Invalid token" }`

---

## POST /auth/refresh

**Request:** `{ "refresh_token": "..." }`  
**Response 200:** TokenResponse  
**Response 401:** `{ "detail": "Invalid refresh token" }`

---

## POST /auth/logout

**Response 200:** `{ "message": "Logged out" }`  
*(Stateless — client discards tokens)*

---

## GET /users/me

**Headers:** Bearer token  
**Response 200:** UserResponse

---

## PATCH /users/me

**Headers:** Bearer token  
**Request:** `{ "full_name"?: "...", "avatar_url"?: "..." }`  
**Response 200:** UserResponse

---

## GET /users

**Auth:** Admin only  
**Query:** `?page=1&limit=20`  
**Response 200:** PaginatedResponse[UserResponse]

---

## POST /users

**Auth:** Admin only  
**Request:** `{ "email": "...", "password": "...", "full_name": "...", "role": "admin|manager|staff" }`  
**Response 201:** UserResponse  
**Response 409:** `{ "detail": "Email already registered" }`

---

## UserResponse shape

```json
{
  "id": "uuid",
  "email": "string",
  "full_name": "string",
  "role": "admin|manager|staff",
  "avatar_url": "string|null",
  "is_active": true,
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-01-01T00:00:00Z"
}
```

---

## PaginatedResponse shape

```json
{
  "data": [...],
  "total": 42,
  "page": 1,
  "limit": 20,
  "total_pages": 3
}
```
```

- [ ] **Step 2: Commit**

```bash
git add backend/docs/api-contracts/auth-users.md
git commit -m "docs: add API contract for auth and users modules"
```

---

## Task 3: Core Config + Database

**Files:**
- Create: `backend/app/core/config.py`
- Create: `backend/app/core/database.py`

- [ ] **Step 1: Write failing test for config**

Create `backend/tests/test_config.py`:
```python
from app.core.config import settings

def test_settings_loads():
    assert settings.DATABASE_URL.startswith("postgresql")
    assert len(settings.SECRET_KEY) >= 32
    assert settings.ALGORITHM == "HS256"
    assert settings.ACCESS_TOKEN_EXPIRE_MINUTES > 0
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && uv run pytest tests/test_config.py -v
```
Expected: `ModuleNotFoundError: No module named 'app'` or `ImportError`

- [ ] **Step 3: Write `backend/app/core/config.py`**

```python
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str
    TEST_DATABASE_URL: str = ""
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    ANTHROPIC_API_KEY: str = ""


settings = Settings()
```

- [ ] **Step 4: Write `backend/app/core/database.py`**

```python
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=False, pool_pre_ping=True)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd backend && uv run pytest tests/test_config.py -v
```
Expected: `PASSED`

- [ ] **Step 6: Commit**

```bash
git add backend/app/core/config.py backend/app/core/database.py backend/tests/test_config.py
git commit -m "feat: add core config and async database engine"
```

---

## Task 4: Common Enums

**Files:**
- Create: `backend/app/common/enums.py`

- [ ] **Step 1: Write failing test**

Create `backend/tests/test_enums.py`:
```python
from app.common.enums import (
    RoomStatus, ContractStatus, TenantStatus, ExpenseCategory,
    ExpensePaymentStatus, PaymentMethod, PostStatus, UserRole,
)

def test_room_statuses():
    assert RoomStatus.TRONG == "Trống"
    assert RoomStatus.DANG_THUE == "Đang thuê"
    assert RoomStatus.DA_DAT == "Đã đặt"
    assert RoomStatus.BAO_TRI == "Bảo trì"

def test_contract_statuses():
    assert ContractStatus.DANG_HIEU_LUC == "Đang hiệu lực"
    assert ContractStatus.SAP_HET_HAN == "Sắp hết hạn"
    assert ContractStatus.DA_HET_HAN == "Đã hết hạn"
    assert ContractStatus.DA_CHAM_DUT == "Đã chấm dứt"

def test_expense_category_uses_types_ts_values():
    # IMPORTANT: uses expenses/types.ts values, NOT mockData.ts values
    assert ExpenseCategory.DIEN_NUOC == "Điện nước"
    assert ExpenseCategory.LUONG == "Lương / quản lý"
    assert ExpenseCategory.CHI_PHI_KHAC == "Chi phí khác"
    # These mockData.ts values must NOT exist:
    assert "Bảo trì" not in [e.value for e in ExpenseCategory]
    assert "Điện" not in [e.value for e in ExpenseCategory]
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && uv run pytest tests/test_enums.py -v
```
Expected: `ImportError`

- [ ] **Step 3: Write `backend/app/common/enums.py`**

```python
from enum import Enum


class RoomStatus(str, Enum):
    TRONG = "Trống"
    DANG_THUE = "Đang thuê"
    DA_DAT = "Đã đặt"
    BAO_TRI = "Bảo trì"


class ContractStatus(str, Enum):
    DANG_HIEU_LUC = "Đang hiệu lực"
    SAP_HET_HAN = "Sắp hết hạn"
    DA_HET_HAN = "Đã hết hạn"
    DA_CHAM_DUT = "Đã chấm dứt"


class TenantStatus(str, Enum):
    DANG_THUE = "Đang thuê"
    DA_TRA_PHONG = "Đã trả phòng"


# Uses frontend/src/app/expenses/types.ts values (NOT mockData.ts)
class ExpenseCategory(str, Enum):
    DIEN_NUOC = "Điện nước"
    INTERNET = "Internet"
    VE_SINH = "Vệ sinh"
    SUA_CHUA = "Sửa chữa"
    MUA_SAM = "Mua sắm"
    LUONG = "Lương / quản lý"
    CHI_PHI_KHAC = "Chi phí khác"


class ExpensePaymentStatus(str, Enum):
    DA_THANH_TOAN = "Đã thanh toán"
    CHUA_THANH_TOAN = "Chưa thanh toán"
    CHO_XU_LY = "Chờ xử lý"


class PaymentMethod(str, Enum):
    TIEN_MAT = "Tiền mặt"
    CHUYEN_KHOAN = "Chuyển khoản"
    KHAC = "Khác"


class PostStatus(str, Enum):
    NHAP = "Nháp"
    DA_LEN_LICH = "Đã lên lịch"
    DA_DANG = "Đã đăng"
    LOI = "Lỗi"


class UserRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    STAFF = "staff"


class NotificationType(str, Enum):
    CONTRACT_EXPIRY = "contract_expiry"
    VACANT_ROOM = "vacant_room"
    OVERDUE_PAYMENT = "overdue_payment"
    MAINTENANCE = "maintenance"


class NotificationPriority(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class LeadStatus(str, Enum):
    MOI = "Mới"
    DANG_TU_VAN = "Đang tư vấn"
    QUAN_TAM_CAO = "Quan tâm cao"
    DA_CHOT = "Đã chốt"
    KHONG_QUAN_TAM = "Không quan tâm"
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd backend && uv run pytest tests/test_enums.py -v
```
Expected: All `PASSED`

- [ ] **Step 5: Commit**

```bash
git add backend/app/common/enums.py backend/tests/test_enums.py
git commit -m "feat: add Vietnamese status enums (canonical source of truth)"
```

---

## Task 5: Common Schemas, Pagination, Exceptions

**Files:**
- Create: `backend/app/common/schemas.py`
- Create: `backend/app/common/pagination.py`
- Create: `backend/app/common/exceptions.py`

- [ ] **Step 1: Write failing test**

Create `backend/tests/test_common.py`:
```python
import math
from app.common.schemas import PaginatedResponse, MessageResponse
from app.common.pagination import PaginationParams, make_paginated_response
from app.common.exceptions import AppException


def test_paginated_response():
    resp = PaginatedResponse[str](data=["a", "b"], total=10, page=1, limit=2, total_pages=5)
    assert resp.total_pages == 5
    assert len(resp.data) == 2


def test_make_paginated_response():
    params = PaginationParams(page=2, limit=5)
    result = make_paginated_response(["x"], total=13, params=params)
    assert result["page"] == 2
    assert result["total_pages"] == math.ceil(13 / 5)
    assert result["data"] == ["x"]


def test_pagination_offset():
    p = PaginationParams(page=3, limit=10)
    assert p.offset == 20


def test_app_exception():
    exc = AppException(status_code=404, detail="Not found", code="NOT_FOUND")
    assert exc.status_code == 404
    assert exc.code == "NOT_FOUND"
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && uv run pytest tests/test_common.py -v
```
Expected: `ImportError`

- [ ] **Step 3: Write `backend/app/common/schemas.py`**

```python
from typing import Generic, Optional, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    data: list[T]
    total: int
    page: int
    limit: int
    total_pages: int


class MessageResponse(BaseModel):
    message: str


class ErrorResponse(BaseModel):
    detail: str
    code: Optional[str] = None
```

- [ ] **Step 4: Write `backend/app/common/pagination.py`**

```python
import math
from dataclasses import dataclass


@dataclass
class PaginationParams:
    page: int = 1
    limit: int = 20

    def __post_init__(self):
        if self.page < 1:
            self.page = 1
        if self.limit < 1:
            self.limit = 1
        if self.limit > 100:
            self.limit = 100

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.limit


def make_paginated_response(data: list, total: int, params: PaginationParams) -> dict:
    return {
        "data": data,
        "total": total,
        "page": params.page,
        "limit": params.limit,
        "total_pages": math.ceil(total / params.limit) if params.limit else 1,
    }
```

- [ ] **Step 5: Write `backend/app/common/exceptions.py`**

```python
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse


class AppException(HTTPException):
    def __init__(self, status_code: int, detail: str, code: str | None = None):
        super().__init__(status_code=status_code, detail=detail)
        self.code = code


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "code": exc.code},
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": str(exc.detail)},
    )
```

- [ ] **Step 6: Run test to verify it passes**

```bash
cd backend && uv run pytest tests/test_common.py -v
```
Expected: All `PASSED`

- [ ] **Step 7: Commit**

```bash
git add backend/app/common/ backend/tests/test_common.py
git commit -m "feat: add common schemas, pagination, and exception helpers"
```

---

## Task 6: User Model + Alembic Setup + First Migration

**Files:**
- Create: `backend/app/modules/users/models.py`
- Create: `backend/alembic.ini`
- Create: `backend/alembic/env.py`
- Generate: `backend/alembic/versions/0001_create_users.py`

- [ ] **Step 1: Write `backend/app/modules/users/models.py`**

```python
import uuid
from datetime import datetime

from sqlalchemy import Boolean, String, func
from sqlalchemy.dialects.postgresql import TIMESTAMPTZ, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="admin")
    avatar_url: Mapped[str | None] = mapped_column(String(500))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMPTZ, nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMPTZ, nullable=False, server_default=func.now(), onupdate=func.now()
    )
```

- [ ] **Step 2: Write `backend/alembic.ini`**

```ini
[alembic]
script_location = alembic
prepend_sys_path = .
version_path_separator = os

[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARN
handlers = console
qualname =

[logger_sqlalchemy]
level = WARN
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
handlers =
qualname = alembic

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
datefmt = %H:%M:%S
```

- [ ] **Step 3: Write `backend/alembic/env.py`**

```python
import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import settings
from app.core.database import Base

# Import all models so Alembic sees them
from app.modules.users.models import User  # noqa: F401

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online():
    connectable = create_async_engine(settings.DATABASE_URL)
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


asyncio.run(run_migrations_online())
```

- [ ] **Step 4: Generate the migration**

```bash
cd backend && uv run alembic revision --autogenerate -m "create_users"
```

Expected: `Generating .../alembic/versions/xxxx_create_users.py ... done`

- [ ] **Step 5: Run the migration against the main DB**

```bash
cd backend && uv run alembic upgrade head
```

Expected:
```
INFO  [alembic.runtime.migration] Running upgrade  -> xxxx, create_users
```

- [ ] **Step 6: Verify users table exists**

```bash
cd backend && uv run python -c "
import asyncio
from sqlalchemy import text
from app.core.database import AsyncSessionLocal

async def check():
    async with AsyncSessionLocal() as s:
        result = await s.execute(text(\"SELECT COUNT(*) FROM users\"))
        print('users table exists, row count:', result.scalar())

asyncio.run(check())
"
```

Expected: `users table exists, row count: 0`

- [ ] **Step 7: Commit**

```bash
git add backend/app/modules/users/models.py backend/alembic.ini backend/alembic/env.py backend/alembic/versions/
git commit -m "feat: add User model and Alembic migration for users table"
```

---

## Task 7: User Schemas + Repository + Service

**Files:**
- Create: `backend/app/modules/users/schemas.py`
- Create: `backend/app/modules/users/repository.py`
- Create: `backend/app/modules/users/service.py`

- [ ] **Step 1: Write `backend/app/modules/users/schemas.py`**

```python
import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "admin"


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


class UserResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    email: str
    full_name: str
    role: str
    avatar_url: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime
```

- [ ] **Step 2: Write `backend/app/modules/users/repository.py`**

```python
import uuid
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.users.models import User


class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: str | uuid.UUID) -> User | None:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def create(self, **kwargs) -> User:
        user = User(**kwargs)
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def update(self, user: User, **kwargs) -> User:
        for key, value in kwargs.items():
            setattr(user, key, value)
        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def list_all(self, page: int, limit: int) -> tuple[list[User], int]:
        total = await self.db.scalar(select(func.count()).select_from(User))
        result = await self.db.execute(
            select(User).offset((page - 1) * limit).limit(limit)
        )
        return list(result.scalars().all()), total or 0
```

- [ ] **Step 3: Write `backend/app/modules/users/service.py`**

```python
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.modules.users.repository import UserRepository
from app.modules.users.schemas import UserCreate, UserUpdate


class UserService:
    def __init__(self, db: AsyncSession):
        self.repo = UserRepository(db)

    async def create_user(self, data: UserCreate):
        existing = await self.repo.get_by_email(data.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )
        return await self.repo.create(
            email=data.email,
            password_hash=hash_password(data.password),
            full_name=data.full_name,
            role=data.role,
        )

    async def get_user(self, user_id: str):
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        return user

    async def update_user(self, user_id: str, data: UserUpdate):
        user = await self.get_user(user_id)
        updates = data.model_dump(exclude_none=True)
        if not updates:
            return user
        return await self.repo.update(user, **updates)

    async def list_users(self, page: int, limit: int):
        return await self.repo.list_all(page, limit)
```

- [ ] **Step 4: Commit**

```bash
git add backend/app/modules/users/
git commit -m "feat: add users schemas, repository, and service"
```

---

## Task 8: Security Utils

**Files:**
- Create: `backend/app/core/security.py`

- [ ] **Step 1: Write failing test**

Create `backend/tests/test_security.py`:
```python
import time
import pytest
from app.core.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token,
)


def test_hash_and_verify_password():
    hashed = hash_password("mypassword")
    assert hashed != "mypassword"
    assert verify_password("mypassword", hashed)
    assert not verify_password("wrongpassword", hashed)


def test_access_token_payload():
    token = create_access_token(user_id="abc-123", role="admin")
    payload = decode_token(token)
    assert payload["sub"] == "abc-123"
    assert payload["role"] == "admin"
    assert payload["type"] == "access"


def test_refresh_token_payload():
    token = create_refresh_token(user_id="abc-123")
    payload = decode_token(token)
    assert payload["sub"] == "abc-123"
    assert payload["type"] == "refresh"
    assert "role" not in payload


def test_invalid_token_raises():
    with pytest.raises(ValueError, match="Invalid token"):
        decode_token("not.a.valid.token")
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && uv run pytest tests/test_security.py -v
```
Expected: `ImportError`

- [ ] **Step 3: Write `backend/app/core/security.py`**

```python
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(user_id: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {"sub": user_id, "role": role, "exp": expire, "type": "access"}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {"sub": user_id, "exp": expire, "type": "refresh"}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError as e:
        raise ValueError("Invalid token") from e
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd backend && uv run pytest tests/test_security.py -v
```
Expected: All `PASSED`

- [ ] **Step 5: Commit**

```bash
git add backend/app/core/security.py backend/tests/test_security.py
git commit -m "feat: add JWT and bcrypt security utilities"
```

---

## Task 9: Core Dependencies

**Files:**
- Create: `backend/app/core/dependencies.py`

- [ ] **Step 1: Write `backend/app/core/dependencies.py`**

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_token
from app.modules.users.repository import UserRepository

bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
):
    try:
        payload = decode_token(credentials.credentials)
        if payload.get("type") != "access":
            raise ValueError("Not an access token")
        user_id = payload.get("sub")
        if not user_id:
            raise ValueError("Missing sub")
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    return user


def require_admin(current_user=Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin role required",
        )
    return current_user
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/core/dependencies.py
git commit -m "feat: add get_current_user and require_admin FastAPI dependencies"
```

---

## Task 10: Auth Module (Schemas + Service + Router)

**Files:**
- Create: `backend/app/modules/auth/schemas.py`
- Create: `backend/app/modules/auth/service.py`
- Create: `backend/app/modules/auth/router.py`

- [ ] **Step 1: Write `backend/app/modules/auth/schemas.py`**

```python
from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str
```

- [ ] **Step 2: Write `backend/app/modules/auth/service.py`**

```python
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_password,
)
from app.modules.users.repository import UserRepository


class AuthService:
    def __init__(self, db: AsyncSession):
        self.user_repo = UserRepository(db)

    async def login(self, email: str, password: str) -> dict:
        user = await self.user_repo.get_by_email(email)
        if not user or not verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive",
            )
        return {
            "access_token": create_access_token(str(user.id), user.role),
            "refresh_token": create_refresh_token(str(user.id)),
            "token_type": "bearer",
        }

    async def refresh(self, refresh_token: str) -> dict:
        try:
            payload = decode_token(refresh_token)
            if payload.get("type") != "refresh":
                raise ValueError("Not a refresh token")
            user_id = payload["sub"]
        except (ValueError, KeyError):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )

        user = await self.user_repo.get_by_id(user_id)
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )
        return {
            "access_token": create_access_token(str(user.id), user.role),
            "refresh_token": create_refresh_token(str(user.id)),
            "token_type": "bearer",
        }
```

- [ ] **Step 3: Write `backend/app/modules/auth/router.py`**

```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.modules.auth.schemas import LoginRequest, RefreshRequest, TokenResponse
from app.modules.auth.service import AuthService
from app.modules.users.schemas import UserResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    return await AuthService(db).login(data.email, data.password)


@router.get("/me", response_model=UserResponse)
async def me(current_user=Depends(get_current_user)):
    return current_user


@router.post("/refresh", response_model=TokenResponse)
async def refresh(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    return await AuthService(db).refresh(data.refresh_token)


@router.post("/logout")
async def logout():
    # Stateless JWT — client discards tokens
    return {"message": "Logged out"}
```

- [ ] **Step 4: Commit**

```bash
git add backend/app/modules/auth/
git commit -m "feat: add auth module (login, me, refresh, logout)"
```

---

## Task 11: Users Router

**Files:**
- Create: `backend/app/modules/users/router.py`

- [ ] **Step 1: Write `backend/app/modules/users/router.py`**

```python
import math

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.schemas import MessageResponse, PaginatedResponse
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin
from app.modules.users.schemas import UserCreate, UserResponse, UserUpdate
from app.modules.users.service import UserService

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_me(current_user=Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_me(
    data: UserUpdate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await UserService(db).update_user(str(current_user.id), data)


@router.get("", response_model=PaginatedResponse[UserResponse])
async def list_users(
    page: int = 1,
    limit: int = 20,
    _=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    users, total = await UserService(db).list_users(page, limit)
    return {
        "data": users,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": math.ceil(total / limit) if limit else 1,
    }


@router.post("", response_model=UserResponse, status_code=201)
async def create_user(
    data: UserCreate,
    _=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    return await UserService(db).create_user(data)
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/modules/users/router.py
git commit -m "feat: add users router (me, list, create)"
```

---

## Task 12: Main App Factory

**Files:**
- Create: `backend/app/main.py`

- [ ] **Step 1: Write `backend/app/main.py`**

```python
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.exceptions import HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.common.exceptions import AppException, app_exception_handler, http_exception_handler
from app.core.database import engine
from app.modules.auth.router import router as auth_router
from app.modules.users.router import router as users_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await engine.dispose()


def create_app() -> FastAPI:
    app = FastAPI(
        title="MotelManage API",
        version="0.1.0",
        description="Backend API for MotelManage motel management system",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.add_exception_handler(AppException, app_exception_handler)
    app.add_exception_handler(HTTPException, http_exception_handler)

    app.include_router(auth_router)
    app.include_router(users_router)

    return app


app = create_app()
```

- [ ] **Step 2: Verify the app starts**

```bash
cd backend && uv run uvicorn app.main:app --reload --port 8000
```

Expected output (no errors):
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000
```

Then visit `http://localhost:8000/docs` — Swagger UI should show auth and users endpoints.

Stop the server with `Ctrl+C`.

- [ ] **Step 3: Commit**

```bash
git add backend/app/main.py
git commit -m "feat: wire up FastAPI app factory with CORS, exception handlers, routers"
```

---

## Task 13: Test Infrastructure (conftest.py)

**Files:**
- Create: `backend/tests/conftest.py`

- [ ] **Step 1: Create the test database**

```bash
# Using psql or your Supabase dashboard, create the test database:
psql -U postgres -c "CREATE DATABASE motelmanage_test;"
# Or if using Supabase: create a second project, or use a test schema
```

- [ ] **Step 2: Write `backend/tests/conftest.py`**

```python
from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.core.database import Base, get_db
from app.core.security import hash_password
from app.main import app
from app.modules.users.models import User  # noqa: F401 — ensures table is registered

TEST_DB_URL = settings.TEST_DATABASE_URL or settings.DATABASE_URL.replace(
    "/motelmanage", "/motelmanage_test"
)

test_engine = create_async_engine(TEST_DB_URL, echo=False)
TestSessionLocal = async_sessionmaker(test_engine, expire_on_commit=False)


async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionLocal() as session:
        yield session


@pytest.fixture(scope="session", autouse=True)
async def setup_database():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await test_engine.dispose()


@pytest.fixture(autouse=True)
async def clean_tables():
    yield
    async with TestSessionLocal() as session:
        for table in reversed(Base.metadata.sorted_tables):
            await session.execute(table.delete())
        await session.commit()


@pytest.fixture
async def db() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionLocal() as session:
        yield session


@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.fixture
async def admin_user(db: AsyncSession) -> User:
    user = User(
        email="admin@test.com",
        password_hash=hash_password("password123"),
        full_name="Test Admin",
        role="admin",
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@pytest.fixture
async def auth_headers(client: AsyncClient, admin_user: User) -> dict:
    resp = await client.post(
        "/api/auth/login",
        json={"email": "admin@test.com", "password": "password123"},
    )
    assert resp.status_code == 200, resp.text
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
```

- [ ] **Step 3: Run conftest smoke test (no actual tests yet)**

```bash
cd backend && uv run pytest tests/ -v --collect-only 2>&1 | head -20
```

Expected: No import errors. Collection succeeds.

- [ ] **Step 4: Commit**

```bash
git add backend/tests/conftest.py
git commit -m "test: add pytest conftest with test DB, client, and admin user fixtures"
```

---

## Task 14: Auth Integration Tests

**Files:**
- Create: `backend/tests/test_auth.py`

- [ ] **Step 1: Write `backend/tests/test_auth.py`**

```python
import pytest
from httpx import AsyncClient

from app.modules.users.models import User


async def test_login_success(client: AsyncClient, admin_user: User):
    resp = await client.post(
        "/api/auth/login",
        json={"email": "admin@test.com", "password": "password123"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "access_token" in body
    assert "refresh_token" in body
    assert body["token_type"] == "bearer"


async def test_login_wrong_password(client: AsyncClient, admin_user: User):
    resp = await client.post(
        "/api/auth/login",
        json={"email": "admin@test.com", "password": "WRONG"},
    )
    assert resp.status_code == 401
    assert resp.json()["detail"] == "Invalid credentials"


async def test_login_unknown_email(client: AsyncClient):
    resp = await client.post(
        "/api/auth/login",
        json={"email": "nobody@test.com", "password": "password123"},
    )
    assert resp.status_code == 401


async def test_me_returns_current_user(client: AsyncClient, auth_headers: dict):
    resp = await client.get("/api/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["email"] == "admin@test.com"
    assert body["role"] == "admin"
    assert "password_hash" not in body


async def test_me_without_token_returns_403(client: AsyncClient):
    # HTTPBearer returns 403 (Forbidden) when Authorization header is absent
    resp = await client.get("/api/auth/me")
    assert resp.status_code == 403


async def test_me_with_invalid_token_returns_401(client: AsyncClient, admin_user: User):
    resp = await client.get(
        "/api/auth/me", headers={"Authorization": "Bearer not.a.real.token"}
    )
    assert resp.status_code == 401


async def test_refresh_returns_new_tokens(client: AsyncClient, admin_user: User):
    login = await client.post(
        "/api/auth/login",
        json={"email": "admin@test.com", "password": "password123"},
    )
    refresh_token = login.json()["refresh_token"]
    resp = await client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
    assert resp.status_code == 200
    assert "access_token" in resp.json()


async def test_refresh_with_access_token_fails(client: AsyncClient, admin_user: User):
    login = await client.post(
        "/api/auth/login",
        json={"email": "admin@test.com", "password": "password123"},
    )
    access_token = login.json()["access_token"]
    resp = await client.post("/api/auth/refresh", json={"refresh_token": access_token})
    assert resp.status_code == 401


async def test_logout_returns_ok(client: AsyncClient, auth_headers: dict):
    resp = await client.post("/api/auth/logout", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["message"] == "Logged out"
```

- [ ] **Step 2: Run auth tests**

```bash
cd backend && uv run pytest tests/test_auth.py -v
```

Expected:
```
tests/test_auth.py::test_login_success PASSED
tests/test_auth.py::test_login_wrong_password PASSED
tests/test_auth.py::test_login_unknown_email PASSED
tests/test_auth.py::test_me_returns_current_user PASSED
tests/test_auth.py::test_me_without_token_returns_403 PASSED
tests/test_auth.py::test_me_with_invalid_token_returns_401 PASSED
tests/test_auth.py::test_refresh_returns_new_tokens PASSED
tests/test_auth.py::test_refresh_with_access_token_fails PASSED
tests/test_auth.py::test_logout_returns_ok PASSED
9 passed
```

- [ ] **Step 3: Commit**

```bash
git add backend/tests/test_auth.py
git commit -m "test: add auth integration tests (login, me, refresh, logout)"
```

---

## Task 15: Users Integration Tests + Final Smoke Check

**Files:**
- Create: `backend/tests/modules/test_users.py`

- [ ] **Step 1: Write `backend/tests/modules/test_users.py`**

```python
import pytest
from httpx import AsyncClient


async def test_get_me(client: AsyncClient, auth_headers: dict):
    resp = await client.get("/api/users/me", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "admin@test.com"
    assert data["role"] == "admin"
    assert "password_hash" not in data


async def test_update_me_full_name(client: AsyncClient, auth_headers: dict):
    resp = await client.patch(
        "/api/users/me",
        json={"full_name": "Updated Admin"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["full_name"] == "Updated Admin"


async def test_update_me_avatar_url(client: AsyncClient, auth_headers: dict):
    resp = await client.patch(
        "/api/users/me",
        json={"avatar_url": "https://example.com/avatar.png"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["avatar_url"] == "https://example.com/avatar.png"


async def test_create_user_as_admin(client: AsyncClient, auth_headers: dict):
    resp = await client.post(
        "/api/users",
        json={
            "email": "staff@test.com",
            "password": "pass1234",
            "full_name": "New Staff",
            "role": "staff",
        },
        headers=auth_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["email"] == "staff@test.com"
    assert body["role"] == "staff"
    assert "password_hash" not in body


async def test_create_user_duplicate_email_returns_409(
    client: AsyncClient, auth_headers: dict
):
    payload = {
        "email": "dup@test.com",
        "password": "pass1234",
        "full_name": "Dup User",
        "role": "staff",
    }
    r1 = await client.post("/api/users", json=payload, headers=auth_headers)
    assert r1.status_code == 201
    r2 = await client.post("/api/users", json=payload, headers=auth_headers)
    assert r2.status_code == 409
    assert r2.json()["detail"] == "Email already registered"


async def test_list_users_as_admin(client: AsyncClient, auth_headers: dict):
    resp = await client.get("/api/users", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert "data" in body
    assert "total" in body
    assert "total_pages" in body
    assert body["page"] == 1
    assert isinstance(body["data"], list)


async def test_list_users_pagination(client: AsyncClient, auth_headers: dict):
    # Create 3 extra users
    for i in range(3):
        await client.post(
            "/api/users",
            json={"email": f"u{i}@test.com", "password": "pass", "full_name": f"User {i}"},
            headers=auth_headers,
        )
    resp = await client.get("/api/users?page=1&limit=2", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["data"]) == 2
    assert body["total"] >= 4  # 1 admin + 3 created


async def test_list_users_requires_admin(client: AsyncClient):
    resp = await client.get("/api/users")
    assert resp.status_code == 403
```

- [ ] **Step 2: Run all tests**

```bash
cd backend && uv run pytest -v
```

Expected:
```
tests/test_config.py::test_settings_loads PASSED
tests/test_enums.py::test_room_statuses PASSED
tests/test_enums.py::test_contract_statuses PASSED
tests/test_enums.py::test_expense_category_uses_types_ts_values PASSED
tests/test_common.py::test_paginated_response PASSED
tests/test_common.py::test_make_paginated_response PASSED
tests/test_common.py::test_pagination_offset PASSED
tests/test_common.py::test_app_exception PASSED
tests/test_security.py::test_hash_and_verify_password PASSED
tests/test_security.py::test_access_token_payload PASSED
tests/test_security.py::test_refresh_token_payload PASSED
tests/test_security.py::test_invalid_token_raises PASSED
tests/test_auth.py::test_login_success PASSED
tests/test_auth.py::test_login_wrong_password PASSED
tests/test_auth.py::test_login_unknown_email PASSED
tests/test_auth.py::test_me_returns_current_user PASSED
tests/test_auth.py::test_me_without_token_returns_403 PASSED
tests/test_auth.py::test_me_with_invalid_token_returns_401 PASSED
tests/test_auth.py::test_refresh_returns_new_tokens PASSED
tests/test_auth.py::test_refresh_with_access_token_fails PASSED
tests/test_auth.py::test_logout_returns_ok PASSED
tests/modules/test_users.py::test_get_me PASSED
tests/modules/test_users.py::test_update_me_full_name PASSED
tests/modules/test_users.py::test_update_me_avatar_url PASSED
tests/modules/test_users.py::test_create_user_as_admin PASSED
tests/modules/test_users.py::test_create_user_duplicate_email_returns_409 PASSED
tests/modules/test_users.py::test_list_users_as_admin PASSED
tests/modules/test_users.py::test_list_users_pagination PASSED
tests/modules/test_users.py::test_list_users_requires_admin PASSED
29 passed
```

- [ ] **Step 3: Update backend .gitignore and commit everything**

```bash
git add backend/tests/modules/test_users.py
git commit -m "test: add users integration tests — all 29 tests passing"
```

- [ ] **Step 4: Final smoke test — start server and hit /docs**

```bash
cd backend && uv run uvicorn app.main:app --reload --port 8000
# In another terminal:
curl http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"wrong"}' 
# Expected: {"detail":"Invalid credentials"}
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: complete Plan 1 — Foundation (auth, users, 29 tests passing)"
```

---

## Definition of Done

Plan 1 is complete when:
- [ ] `uv run pytest -v` shows 29 passing tests, 0 failures
- [ ] `uv run uvicorn app.main:app` starts without errors
- [ ] Swagger UI at `http://localhost:8000/docs` shows all endpoints
- [ ] `alembic upgrade head` runs cleanly against the main DB
- [ ] All code is committed with no unstaged changes
