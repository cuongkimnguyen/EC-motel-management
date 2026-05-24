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
