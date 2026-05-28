"""Facebook Messenger webhook handler.

GET  /api/webhooks/facebook  — webhook verification (Meta calls this once on setup)
POST /api/webhooks/facebook  — inbound message events

Background task note:
    FastAPI BackgroundTasks run after the response is sent; at that point the
    request-scoped DB session is closed. The background task opens its own session
    via `_db_factory`, a module-level variable that tests can patch to use
    TestSessionLocal.
"""
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query, Request

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.modules.conversations.service import ConversationService
from app.modules.webhooks.signature import verify_x_hub_signature_256

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])

# Module-level factory — patched in tests to use TestSessionLocal
_db_factory = AsyncSessionLocal


async def _process_webhook_body(body: dict) -> None:
    """Process one webhook payload inside a fresh DB session."""
    if body.get("object") != "page":
        return

    async with _db_factory() as db:
        async with db.begin():
            svc = ConversationService(db)
            for entry in body.get("entry", []):
                page_id = entry.get("id", "")
                for event in entry.get("messaging", []):
                    msg = event.get("message")
                    if not msg:
                        continue
                    if msg.get("is_echo"):
                        continue

                    psid = event["sender"]["id"]
                    mid = msg.get("mid", "")
                    text = msg.get("text")
                    ts = event.get("timestamp", 0)
                    sent_at = datetime.fromtimestamp(ts / 1000, tz=timezone.utc)

                    await svc.process_inbound_message(
                        psid=psid,
                        page_id=page_id,
                        meta_mid=mid,
                        text=text,
                        sent_at=sent_at,
                    )


@router.get("/facebook")
async def verify_webhook(
    hub_mode: str = Query(alias="hub.mode", default=""),
    hub_verify_token: str = Query(alias="hub.verify_token", default=""),
    hub_challenge: str = Query(alias="hub.challenge", default=""),
):
    """Meta webhook verification handshake."""
    if hub_mode == "subscribe" and hub_verify_token == settings.FACEBOOK_VERIFY_TOKEN:
        return int(hub_challenge) if hub_challenge.isdigit() else hub_challenge
    raise HTTPException(status_code=403, detail="Verification failed")


@router.post("/facebook")
async def receive_webhook(request: Request, background_tasks: BackgroundTasks):
    """Receive inbound Facebook Messenger events."""
    raw_body = await request.body()

    if settings.FACEBOOK_WEBHOOK_ENABLED:
        sig_header = request.headers.get("X-Hub-Signature-256", "")
        if not verify_x_hub_signature_256(raw_body, sig_header, settings.FACEBOOK_APP_SECRET):
            raise HTTPException(status_code=403, detail="Invalid signature")

    body = await request.json()
    background_tasks.add_task(_process_webhook_body, body)
    return "EVENT_RECEIVED"
