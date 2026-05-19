import asyncio
from collections.abc import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import settings
from app.core.database import Base, get_db
from app.core.security import hash_password
from app.main import app
from app.modules.contracts.models import Contract  # noqa: F401 — ensures table is registered
from app.modules.rooms.models import Room  # noqa: F401 — ensures table is registered
from app.modules.users.models import User  # noqa: F401 — ensures table is registered

TEST_DB_URL = settings.TEST_DATABASE_URL or settings.DATABASE_URL.replace(
    "/moteldb", "/moteldb_test"
)

# NullPool disables connection pooling so each operation gets a fresh connection.
# This is required because pytest-asyncio creates a new event loop per test;
# asyncpg connections are tied to the event loop they were created in and cannot
# be reused across different loops.
test_engine = create_async_engine(TEST_DB_URL, echo=False, poolclass=NullPool)
TestSessionLocal = async_sessionmaker(test_engine, expire_on_commit=False)


# ── Session-scoped SYNC fixtures (run outside pytest-asyncio's event loop) ────

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Create tables once before all tests; drop them when the session ends.

    Sync fixture using asyncio.run() avoids event-loop conflicts with
    pytest-asyncio's per-test event loops.
    """
    async def _create():
        engine = create_async_engine(TEST_DB_URL, echo=False)
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        await engine.dispose()

    async def _drop():
        engine = create_async_engine(TEST_DB_URL, echo=False)
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        await engine.dispose()

    asyncio.run(_create())
    yield
    asyncio.run(_drop())


@pytest.fixture(autouse=True)
def clean_tables():
    """Delete all rows after each test via a fresh engine + asyncio.run().

    Sync fixture so it runs after pytest-asyncio has finished the test's
    event loop, preventing 'another operation is in progress' conflicts.
    """
    yield

    async def _clean():
        engine = create_async_engine(TEST_DB_URL, echo=False)
        async with engine.begin() as conn:
            for table in reversed(Base.metadata.sorted_tables):
                await conn.execute(table.delete())
        await engine.dispose()

    asyncio.run(_clean())


# ── Function-scoped ASYNC fixtures (run inside pytest-asyncio's event loop) ───

@pytest_asyncio.fixture
async def db() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionLocal() as session:
        yield session


async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionLocal() as session:
        async with session.begin():
            yield session


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
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


@pytest_asyncio.fixture
async def auth_headers(client: AsyncClient, admin_user: User) -> dict:
    resp = await client.post(
        "/api/auth/login",
        json={"email": "admin@test.com", "password": "password123"},
    )
    assert resp.status_code == 200, resp.text
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
