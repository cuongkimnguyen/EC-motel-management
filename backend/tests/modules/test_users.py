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
    # Starlette 1.0.0: HTTPBearer returns 401 when Authorization header is absent
    resp = await client.get("/api/users")
    assert resp.status_code == 401
