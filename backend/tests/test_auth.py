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


async def test_me_without_token_returns_401(client: AsyncClient):
    # Starlette 1.0.0: HTTPBearer returns 401 when Authorization header is absent
    resp = await client.get("/api/auth/me")
    assert resp.status_code == 401


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
