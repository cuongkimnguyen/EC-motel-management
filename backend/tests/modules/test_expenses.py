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
