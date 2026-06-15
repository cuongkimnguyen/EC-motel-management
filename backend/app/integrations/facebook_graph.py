"""Facebook Graph API client for publishing posts to a Facebook Page.

Separate from meta_send_api.py (Messenger Send API).
This module handles organic page post publishing via /me/feed.
"""
import httpx
from tenacity import retry, retry_if_exception, stop_after_attempt, wait_exponential

GRAPH_API_BASE = "https://graph.facebook.com"


def _is_retryable(exc: BaseException) -> bool:
    if isinstance(exc, httpx.HTTPStatusError):
        return exc.response.status_code >= 500
    return isinstance(exc, httpx.TransportError)


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=8),
    retry=retry_if_exception(_is_retryable),
    reraise=True,
)
async def publish_page_post(
    message: str,
    page_id: str,
    page_access_token: str,
    graph_api_version: str = "v21.0",
) -> str:
    """Publish a text post to a Facebook Page feed.

    Returns Facebook post ID string, e.g. "111111111_222222222".
    """
    url = f"{GRAPH_API_BASE}/{graph_api_version}/{page_id}/feed"
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            url,
            data={"message": message, "access_token": page_access_token},
            timeout=15.0,
        )
        resp.raise_for_status()
        return resp.json()["id"]
