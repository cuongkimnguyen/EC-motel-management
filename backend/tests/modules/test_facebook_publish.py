"""Facebook post publishing integration tests — mock httpx."""
from unittest.mock import AsyncMock, patch

from httpx import AsyncClient

from app.core.config import settings

POST_PAYLOAD = {
    "title": "Phòng trống tháng 7",
    "content": "Còn phòng đẹp, giá tốt!",
    "post_type": "Tuyển khách",
    "channel": "Facebook Page",
}


async def _create_draft(client: AsyncClient, auth_headers: dict) -> str:
    resp = await client.post("/api/posts", json=POST_PAYLOAD, headers=auth_headers)
    return resp.json()["id"]


async def test_publish_post_without_fb_credentials_stays_local(
    client: AsyncClient, auth_headers: dict
):
    """When FACEBOOK_WEBHOOK_ENABLED=False, publish still marks post as Đã đăng."""
    post_id = await _create_draft(client, auth_headers)
    resp = await client.post(f"/api/posts/{post_id}/publish", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "Đã đăng"
    assert body["fb_link"] is None


async def test_publish_post_with_fb_credentials_calls_graph_api(
    client: AsyncClient, auth_headers: dict
):
    """When FACEBOOK_WEBHOOK_ENABLED=True, publish calls publish_page_post()."""
    post_id = await _create_draft(client, auth_headers)

    mock_fb_post_id = "123456789_987654321"
    with (
        patch(
            "app.integrations.facebook_graph.publish_page_post",
            new_callable=AsyncMock,
            return_value=mock_fb_post_id,
        ),
        patch.object(settings, "FACEBOOK_WEBHOOK_ENABLED", True),
        patch.object(settings, "FACEBOOK_PAGE_ACCESS_TOKEN", "fake-token"),
        patch.object(settings, "META_GRAPH_API_VERSION", "v21.0"),
        patch.object(settings, "FACEBOOK_PAGE_ID", "111"),
    ):
        resp = await client.post(f"/api/posts/{post_id}/publish", headers=auth_headers)

    assert resp.status_code == 200
    assert resp.json()["status"] == "Đã đăng"
    assert mock_fb_post_id in (resp.json()["fb_link"] or "")


async def test_publish_post_fb_error_marks_as_loi(
    client: AsyncClient, auth_headers: dict
):
    """When Facebook API raises, post status becomes Lỗi."""
    post_id = await _create_draft(client, auth_headers)

    with (
        patch(
            "app.integrations.facebook_graph.publish_page_post",
            new_callable=AsyncMock,
            side_effect=Exception("Facebook API error"),
        ),
        patch.object(settings, "FACEBOOK_WEBHOOK_ENABLED", True),
        patch.object(settings, "FACEBOOK_PAGE_ACCESS_TOKEN", "fake-token"),
        patch.object(settings, "META_GRAPH_API_VERSION", "v21.0"),
        patch.object(settings, "FACEBOOK_PAGE_ID", "111"),
    ):
        resp = await client.post(f"/api/posts/{post_id}/publish", headers=auth_headers)

    assert resp.status_code == 200
    assert resp.json()["status"] == "Lỗi"
