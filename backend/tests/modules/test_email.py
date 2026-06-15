"""Email notification endpoint tests — mock SMTP sending."""
from unittest.mock import AsyncMock, patch

from httpx import AsyncClient


async def test_send_reminders_endpoint_with_no_debtors(
    client: AsyncClient, auth_headers: dict
):
    """No tenants with debt -> returns 0 sent."""
    with patch(
        "app.integrations.email.send_email", new_callable=AsyncMock
    ):
        resp = await client.post(
            "/api/notifications/send-reminders", headers=auth_headers
        )
    assert resp.status_code == 200
    assert resp.json()["sent"] == 0


async def test_send_reminders_endpoint_requires_auth(client: AsyncClient):
    resp = await client.post("/api/notifications/send-reminders")
    assert resp.status_code == 401


async def test_send_expiry_warnings_endpoint_with_no_expiring(
    client: AsyncClient, auth_headers: dict
):
    with patch(
        "app.integrations.email.send_email", new_callable=AsyncMock
    ):
        resp = await client.post(
            "/api/notifications/send-expiry-warnings", headers=auth_headers
        )
    assert resp.status_code == 200
    assert resp.json()["sent"] == 0


async def test_send_expiry_warnings_requires_auth(client: AsyncClient):
    resp = await client.post("/api/notifications/send-expiry-warnings")
    assert resp.status_code == 401
