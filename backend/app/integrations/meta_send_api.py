"""Meta Send API client with tenacity auto-retry.

Isolated from DB and business logic — only knows about HTTP and Meta's API shape.
"""
import httpx
from tenacity import retry, retry_if_exception, stop_after_attempt, wait_exponential

GRAPH_API_BASE = "https://graph.facebook.com"


def _is_retryable(exc: BaseException) -> bool:
    """Retry on 5xx server errors or transport failures (connection reset, timeout, etc.)."""
    if isinstance(exc, httpx.HTTPStatusError):
        return exc.response.status_code >= 500
    if isinstance(exc, httpx.TransportError):
        return True
    return False


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=8),
    retry=retry_if_exception(_is_retryable),
    reraise=True,
)
async def send_message(
    psid: str,
    text: str,
    page_access_token: str,
    graph_api_version: str,
    messaging_type: str = "RESPONSE",
    tag: str | None = None,
) -> str:
    """Send a text message to a Facebook Page user via Meta Send API.

    Args:
        psid: Page-scoped user ID of the recipient.
        text: Message text content (max 2000 chars, enforced by caller).
        page_access_token: Facebook Page Access Token.
        graph_api_version: Meta Graph API version string (e.g. "v21.0").
        messaging_type: "RESPONSE" (within 24h) or "MESSAGE_TAG" (expired window).
        tag: Required when messaging_type="MESSAGE_TAG" (e.g. "HUMAN_AGENT").

    Returns:
        Meta message_id string (e.g. "mid.xxx").

    Raises:
        httpx.HTTPStatusError: On 4xx/5xx after all retries exhausted.
        httpx.TransportError: On network failure after all retries exhausted.
    """
    url = f"{GRAPH_API_BASE}/{graph_api_version}/me/messages"

    payload: dict = {
        "recipient": {"id": psid},
        "message": {"text": text},
        "messaging_type": messaging_type,
    }
    if tag:
        payload["tag"] = tag

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            url,
            json=payload,
            params={"access_token": page_access_token},
            headers={"Content-Type": "application/json"},
            timeout=10.0,
        )
        resp.raise_for_status()
        return resp.json()["message_id"]
