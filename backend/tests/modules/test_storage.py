"""Storage upload endpoint tests — mock the Supabase client."""
import uuid
from datetime import date
from unittest.mock import patch

from httpx import AsyncClient


# -- Room images -------------------------------------------------------------


async def test_upload_room_image_returns_url(client: AsyncClient, auth_headers: dict):
    room_payload = {
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
        "description": "",
    }
    room = (await client.post("/api/rooms", json=room_payload, headers=auth_headers)).json()
    room_id = room["id"]

    fake_url = "https://supabase.example.com/storage/v1/object/public/room-images/rooms/abc.jpg"
    with patch(
        "app.integrations.storage.upload_room_image",
        return_value=fake_url,
    ):
        resp = await client.post(
            f"/api/rooms/{room_id}/images",
            files={"file": ("photo.jpg", b"fake-image-bytes", "image/jpeg")},
            headers=auth_headers,
        )
    assert resp.status_code == 200
    body = resp.json()
    assert fake_url in body["images"]


async def test_upload_room_image_unknown_room_returns_404(
    client: AsyncClient, auth_headers: dict
):
    with patch("app.integrations.storage.upload_room_image", return_value="http://x"):
        resp = await client.post(
            f"/api/rooms/{uuid.uuid4()}/images",
            files={"file": ("photo.jpg", b"fake", "image/jpeg")},
            headers=auth_headers,
        )
    assert resp.status_code == 404


async def test_upload_room_image_requires_auth(client: AsyncClient):
    resp = await client.post(
        f"/api/rooms/{uuid.uuid4()}/images",
        files={"file": ("photo.jpg", b"fake", "image/jpeg")},
    )
    assert resp.status_code == 401


# -- Expense receipts --------------------------------------------------------


async def test_upload_expense_receipt_returns_url(
    client: AsyncClient, auth_headers: dict
):
    expense_payload = {
        "title": "Tiền điện",
        "category": "Điện nước",
        "amount": 1_000_000,
        "expense_date": str(date.today()),
        "payment_status": "Đã thanh toán",
        "payment_method": "Tiền mặt",
        "building_name": "Khu A",
        "note": "",
    }
    expense = (
        await client.post("/api/expenses", json=expense_payload, headers=auth_headers)
    ).json()
    expense_id = expense["id"]

    fake_url = "https://supabase.example.com/storage/v1/object/public/expense-receipts/receipts/abc.pdf"
    with patch(
        "app.integrations.storage.upload_expense_receipt",
        return_value=fake_url,
    ):
        resp = await client.post(
            f"/api/expenses/{expense_id}/receipt",
            files={"file": ("receipt.pdf", b"fake-pdf-bytes", "application/pdf")},
            headers=auth_headers,
        )
    assert resp.status_code == 200
    assert resp.json()["receipt_image"] == fake_url


async def test_upload_expense_receipt_requires_auth(client: AsyncClient):
    resp = await client.post(
        f"/api/expenses/{uuid.uuid4()}/receipt",
        files={"file": ("r.pdf", b"x", "application/pdf")},
    )
    assert resp.status_code == 401
