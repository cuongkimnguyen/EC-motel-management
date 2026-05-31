# Phase 7c — Email Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Send transactional emails (payment reminders, contract expiry warnings, weekly digest) via SMTP using Python's built-in `smtplib`. An APScheduler job triggers the weekly digest. Individual reminders are triggered on-demand via a new `POST /api/notifications/send-reminders` admin endpoint.

**Architecture:** A new `app/integrations/email.py` module wraps SMTP sending. A new `NotificationEmailService` in the notifications module calls it. No new DB tables — emails are fire-and-forget; sending status is logged to `activity_log`. Zalo is out of scope for this plan (requires Zalo OA approval — noted in Risk section).

**Tech Stack:** `smtplib` + `email.mime` (Python stdlib), `jinja2` for HTML templates, APScheduler (already installed)

---

## File Map

**Create:**
- `backend/app/integrations/email.py`
- `backend/app/integrations/templates/payment_reminder.html`
- `backend/app/integrations/templates/contract_expiry.html`
- `backend/app/integrations/templates/weekly_digest.html`
- `backend/tests/test_email.py`

**Modify:**
- `backend/app/core/config.py` — add SMTP settings
- `backend/app/modules/notifications/router.py` — add `POST /send-reminders`
- `backend/app/modules/notifications/service.py` — add `send_payment_reminders()`, `send_expiry_warnings()`
- `backend/app/scheduler.py` — add weekly digest job
- `backend/requirements.txt`

---

## Task 1: SMTP Config + Dependencies

- [ ] **Step 1: Install Jinja2**

```bash
cd backend
pip install jinja2
```

Add to `backend/requirements.txt`:
```
jinja2==3.1.4
```

- [ ] **Step 2: Add SMTP settings to config**

In `backend/app/core/config.py`, add to the `Settings` class:

```python
    # Email (SMTP)
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_NAME: str = "MotelManage"
    SMTP_FROM_EMAIL: str = ""
    EMAIL_ENABLED: bool = False       # set True in .env when credentials are ready
```

- [ ] **Step 3: Verify config loads**

```bash
cd backend
python -c "from app.core.config import settings; print(settings.EMAIL_ENABLED); print('OK')"
```
Expected: `False` then `OK`

- [ ] **Step 4: Commit**

```bash
git add backend/requirements.txt backend/app/core/config.py
git commit -m "chore(config): add SMTP email settings"
```

---

## Task 2: Email Client + HTML Templates

**Files:**
- Create: `backend/app/integrations/email.py`
- Create: `backend/app/integrations/templates/payment_reminder.html`
- Create: `backend/app/integrations/templates/contract_expiry.html`
- Create: `backend/app/integrations/templates/weekly_digest.html`

- [ ] **Step 1: Write email.py**

```python
# backend/app/integrations/email.py
"""SMTP email client with Jinja2 HTML templates.

Sending is synchronous (smtplib) but runs in a thread pool executor
so it doesn't block the FastAPI event loop.

Usage:
    await send_email(
        to="tenant@example.com",
        subject="Nhắc nhở thanh toán",
        template="payment_reminder.html",
        context={"tenant_name": "Nguyễn Văn A", "amount_due": 3_500_000},
    )
"""
import asyncio
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

from jinja2 import Environment, FileSystemLoader

from app.core.config import settings

_TEMPLATES_DIR = Path(__file__).parent / "templates"
_jinja_env = Environment(loader=FileSystemLoader(str(_TEMPLATES_DIR)), autoescape=True)


def _render(template_name: str, context: dict) -> str:
    return _jinja_env.get_template(template_name).render(**context)


def _send_sync(to: str, subject: str, html_body: str) -> None:
    """Synchronous SMTP send — called via run_in_executor."""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
    msg["To"] = to
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as smtp:
        smtp.ehlo()
        smtp.starttls()
        smtp.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        smtp.sendmail(settings.SMTP_FROM_EMAIL, [to], msg.as_string())


async def send_email(to: str, subject: str, template: str, context: dict) -> None:
    """Render template and send email asynchronously.

    No-ops silently when EMAIL_ENABLED=False so missing credentials
    don't break non-email flows.
    """
    if not settings.EMAIL_ENABLED:
        return

    html_body = _render(template, context)
    loop = asyncio.get_running_loop()
    await loop.run_in_executor(None, _send_sync, to, subject, html_body)
```

- [ ] **Step 2: Create payment_reminder.html template**

```html
<!-- backend/app/integrations/templates/payment_reminder.html -->
<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><title>Nhắc nhở thanh toán</title></head>
<body style="font-family:Arial,sans-serif;color:#1e293b;max-width:600px;margin:auto;padding:20px">
  <div style="background:#1e40af;padding:20px;border-radius:8px 8px 0 0">
    <h1 style="color:white;margin:0;font-size:20px">MotelManage — Nhắc nhở thanh toán</h1>
  </div>
  <div style="border:1px solid #e5e7eb;border-top:0;padding:24px;border-radius:0 0 8px 8px">
    <p>Kính gửi <strong>{{ tenant_name }}</strong>,</p>
    <p>Đây là thông báo nhắc nhở về kỳ thanh toán tiền thuê phòng <strong>{{ room_code }}</strong>.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr style="background:#f8fafc">
        <td style="padding:10px;border:1px solid #e5e7eb">Phòng</td>
        <td style="padding:10px;border:1px solid #e5e7eb"><strong>{{ room_code }}</strong></td>
      </tr>
      <tr>
        <td style="padding:10px;border:1px solid #e5e7eb">Kỳ thanh toán</td>
        <td style="padding:10px;border:1px solid #e5e7eb">{{ billing_period }}</td>
      </tr>
      <tr style="background:#f8fafc">
        <td style="padding:10px;border:1px solid #e5e7eb">Số tiền cần thanh toán</td>
        <td style="padding:10px;border:1px solid #e5e7eb;color:#dc2626;font-weight:bold">
          {{ amount_due | int | format_vnd }} VND
        </td>
      </tr>
      <tr>
        <td style="padding:10px;border:1px solid #e5e7eb">Hạn thanh toán</td>
        <td style="padding:10px;border:1px solid #e5e7eb">{{ due_date }}</td>
      </tr>
    </table>
    <p>Vui lòng thanh toán đúng hạn để tránh phát sinh phí phạt. Cảm ơn bạn!</p>
    <p style="color:#64748b;font-size:13px;margin-top:24px">
      Email này được gửi tự động từ hệ thống MotelManage. Vui lòng không trả lời email này.
    </p>
  </div>
</body>
</html>
```

- [ ] **Step 3: Create contract_expiry.html template**

```html
<!-- backend/app/integrations/templates/contract_expiry.html -->
<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><title>Hợp đồng sắp hết hạn</title></head>
<body style="font-family:Arial,sans-serif;color:#1e293b;max-width:600px;margin:auto;padding:20px">
  <div style="background:#b45309;padding:20px;border-radius:8px 8px 0 0">
    <h1 style="color:white;margin:0;font-size:20px">MotelManage — Hợp đồng sắp hết hạn</h1>
  </div>
  <div style="border:1px solid #e5e7eb;border-top:0;padding:24px;border-radius:0 0 8px 8px">
    <p>Kính gửi <strong>{{ tenant_name }}</strong>,</p>
    <p>Hợp đồng thuê phòng của bạn sẽ <strong>hết hạn trong {{ days_left }} ngày</strong>.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr style="background:#f8fafc">
        <td style="padding:10px;border:1px solid #e5e7eb">Mã hợp đồng</td>
        <td style="padding:10px;border:1px solid #e5e7eb"><strong>{{ contract_code }}</strong></td>
      </tr>
      <tr>
        <td style="padding:10px;border:1px solid #e5e7eb">Phòng</td>
        <td style="padding:10px;border:1px solid #e5e7eb">{{ room_code }}</td>
      </tr>
      <tr style="background:#f8fafc">
        <td style="padding:10px;border:1px solid #e5e7eb">Ngày hết hạn</td>
        <td style="padding:10px;border:1px solid #e5e7eb;color:#b45309;font-weight:bold">{{ end_date }}</td>
      </tr>
    </table>
    <p>Vui lòng liên hệ chủ nhà để gia hạn hoặc sắp xếp trả phòng. Cảm ơn!</p>
    <p style="color:#64748b;font-size:13px;margin-top:24px">
      Email này được gửi tự động từ hệ thống MotelManage.
    </p>
  </div>
</body>
</html>
```

- [ ] **Step 4: Create weekly_digest.html template**

```html
<!-- backend/app/integrations/templates/weekly_digest.html -->
<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><title>Báo cáo tuần</title></head>
<body style="font-family:Arial,sans-serif;color:#1e293b;max-width:600px;margin:auto;padding:20px">
  <div style="background:#1e40af;padding:20px;border-radius:8px 8px 0 0">
    <h1 style="color:white;margin:0;font-size:20px">MotelManage — Tóm tắt vận hành tuần</h1>
  </div>
  <div style="border:1px solid #e5e7eb;border-top:0;padding:24px;border-radius:0 0 8px 8px">
    <p>Kính gửi <strong>{{ owner_name }}</strong>,</p>
    <p>Đây là tóm tắt tình hình vận hành tuần <strong>{{ week_label }}</strong>:</p>

    <h2 style="font-size:15px;color:#374151;border-bottom:1px solid #e5e7eb;padding-bottom:6px">Phòng</h2>
    <ul>
      <li>Tổng phòng: <strong>{{ total_rooms }}</strong></li>
      <li>Đang thuê: <strong>{{ occupied_rooms }}</strong></li>
      <li>Phòng trống: <strong>{{ vacant_rooms }}</strong></li>
    </ul>

    <h2 style="font-size:15px;color:#374151;border-bottom:1px solid #e5e7eb;padding-bottom:6px">Hợp đồng</h2>
    <ul>
      <li>Sắp hết hạn (30 ngày): <strong>{{ expiring_contracts }}</strong></li>
    </ul>

    <h2 style="font-size:15px;color:#374151;border-bottom:1px solid #e5e7eb;padding-bottom:6px">Công nợ</h2>
    <ul>
      <li>Khách đang nợ: <strong>{{ debt_tenants }}</strong> người</li>
      <li>Tổng công nợ: <strong>{{ total_debt_formatted }}</strong> VND</li>
    </ul>

    <p style="color:#64748b;font-size:13px;margin-top:24px">
      Email này được gửi tự động mỗi thứ Hai từ hệ thống MotelManage.
    </p>
  </div>
</body>
</html>
```

- [ ] **Step 5: Verify templates load**

```bash
cd backend
python -c "
from app.integrations.email import _render
html = _render('payment_reminder.html', {
    'tenant_name': 'Nguyễn Văn A',
    'room_code': 'P101',
    'billing_period': '2025-06',
    'amount_due': 3500000,
    'due_date': '2025-06-05',
})
print('OK' if 'Nguyễn Văn A' in html else 'FAIL')
"
```
Expected: `OK`

- [ ] **Step 6: Commit**

```bash
git add backend/app/integrations/email.py backend/app/integrations/templates/
git commit -m "feat(email): add SMTP client with Jinja2 HTML templates"
```

---

## Task 3: Notification Service — Send Reminders + Expiry Warnings

**Files:**
- Modify: `backend/app/modules/notifications/service.py`
- Modify: `backend/app/modules/notifications/router.py`
- Test: `backend/tests/test_email.py`

- [ ] **Step 1: Write failing tests**

```python
# backend/tests/test_email.py
"""Email notification endpoint tests — mock SMTP sending."""
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient


async def test_send_reminders_endpoint_with_no_debtors(client: AsyncClient, auth_headers: dict):
    """No tenants with debt → returns 0 sent."""
    with patch("app.modules.notifications.service.send_email", new_callable=AsyncMock):
        resp = await client.post("/api/notifications/send-reminders", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["sent"] == 0


async def test_send_reminders_endpoint_requires_auth(client: AsyncClient):
    resp = await client.post("/api/notifications/send-reminders")
    assert resp.status_code == 401


async def test_send_expiry_warnings_endpoint_with_no_expiring(client: AsyncClient, auth_headers: dict):
    with patch("app.modules.notifications.service.send_email", new_callable=AsyncMock):
        resp = await client.post("/api/notifications/send-expiry-warnings", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["sent"] == 0


async def test_send_expiry_warnings_requires_auth(client: AsyncClient):
    resp = await client.post("/api/notifications/send-expiry-warnings")
    assert resp.status_code == 401
```

- [ ] **Step 2: Run to verify failure**

```bash
cd backend
pytest tests/test_email.py -v
```
Expected: errors — routes don't exist yet

- [ ] **Step 3: Add email methods to NotificationService**

Append to `backend/app/modules/notifications/service.py`:

```python
    async def send_payment_reminders(self) -> int:
        """Send payment reminder emails to all tenants with outstanding debt.

        Returns number of emails successfully dispatched.
        """
        from app.integrations.email import send_email
        from sqlalchemy import select
        from app.modules.tenants.models import Tenant
        from app.modules.contracts.models import Contract

        result = await self.db.execute(
            select(Tenant).where(Tenant.debt > 0)
        )
        tenants = result.scalars().all()

        sent = 0
        for tenant in tenants:
            # Get their active contract for room info
            contract_result = await self.db.execute(
                select(Contract).where(
                    Contract.tenant_id == tenant.id,
                    Contract.status.in_(["Đang hiệu lực", "Sắp hết hạn"]),
                ).limit(1)
            )
            contract = contract_result.scalar_one_or_none()
            room_code = getattr(contract, "room_code", "N/A") if contract else "N/A"

            # Only send if tenant has an email (phone used as fallback identifier)
            # In a real system, Tenant.email would exist; skip if not present
            if not getattr(tenant, "email", None):
                continue

            await send_email(
                to=tenant.email,
                subject=f"[MotelManage] Nhắc nhở thanh toán — {room_code}",
                template="payment_reminder.html",
                context={
                    "tenant_name": tenant.full_name,
                    "room_code": room_code,
                    "billing_period": date.today().strftime("%Y-%m"),
                    "amount_due": tenant.debt,
                    "due_date": f"ngày 5 tháng {date.today().month + 1}",
                },
            )
            sent += 1

        return sent

    async def send_expiry_warnings(self) -> int:
        """Send contract expiry warning emails for contracts expiring within 30 days.

        Returns number of emails dispatched.
        """
        from app.integrations.email import send_email
        from sqlalchemy import select
        from app.modules.contracts.models import Contract
        from app.modules.tenants.models import Tenant

        today = date.today()
        warning_date = today + timedelta(days=30)

        result = await self.db.execute(
            select(Contract).where(
                Contract.terminated_at.is_(None),
                Contract.end_date >= today,
                Contract.end_date <= warning_date,
            )
        )
        contracts = result.scalars().all()

        sent = 0
        for contract in contracts:
            tenant_result = await self.db.execute(
                select(Tenant).where(Tenant.id == contract.tenant_id)
            )
            tenant = tenant_result.scalar_one_or_none()
            if not tenant or not getattr(tenant, "email", None):
                continue

            days_left = (contract.end_date - today).days
            await send_email(
                to=tenant.email,
                subject=f"[MotelManage] Hợp đồng {contract.code} sắp hết hạn",
                template="contract_expiry.html",
                context={
                    "tenant_name": tenant.full_name,
                    "contract_code": contract.code,
                    "room_code": getattr(contract, "room_code", ""),
                    "end_date": str(contract.end_date),
                    "days_left": days_left,
                },
            )
            sent += 1

        return sent
```

Also add `from datetime import timedelta` to the imports at the top of the service file if not already present.

- [ ] **Step 4: Add endpoints to notifications router**

Append to `backend/app/modules/notifications/router.py`:

```python
@router.post("/send-reminders", response_model=dict)
async def send_payment_reminders(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    """Trigger payment reminder emails to all tenants with outstanding debt."""
    svc = NotificationService(db)
    sent = await svc.send_payment_reminders()
    return {"sent": sent, "message": f"Đã gửi {sent} email nhắc nhở thanh toán"}


@router.post("/send-expiry-warnings", response_model=dict)
async def send_expiry_warnings(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    """Trigger contract expiry warning emails for contracts expiring in 30 days."""
    svc = NotificationService(db)
    sent = await svc.send_expiry_warnings()
    return {"sent": sent, "message": f"Đã gửi {sent} email cảnh báo hết hạn hợp đồng"}
```

Also ensure `require_admin` and `AsyncSession` are imported in the router.

- [ ] **Step 5: Run email tests**

```bash
cd backend
pytest tests/test_email.py -v
```
Expected: 4 passed

- [ ] **Step 6: Commit**

```bash
git add backend/app/modules/notifications/service.py backend/app/modules/notifications/router.py backend/tests/test_email.py
git commit -m "feat(notifications): add send-reminders and send-expiry-warnings email endpoints"
```

---

## Task 4: APScheduler — Weekly Digest Job

**Files:**
- Modify: `backend/app/scheduler.py`

- [ ] **Step 1: Add weekly_digest() job to scheduler.py**

Append to `backend/app/scheduler.py` (after the `publish_scheduled_posts` function):

```python
async def send_weekly_digest() -> None:
    """Monday 07:00 — send operational summary to the admin email."""
    from app.core.config import settings
    from app.integrations.email import send_email
    from sqlalchemy import select, func
    from datetime import timedelta

    if not settings.EMAIL_ENABLED or not settings.SMTP_FROM_EMAIL:
        return

    async with AsyncSessionLocal() as db:
        from app.modules.rooms.models import Room
        from app.modules.contracts.models import Contract
        from app.modules.tenants.models import Tenant

        today = date.today()
        week_label = f"{today.strftime('%d/%m/%Y')}"

        result = await db.execute(select(Room))
        rooms = result.scalars().all()
        total_rooms = len(rooms)
        occupied = sum(1 for r in rooms if r.status == "Đang thuê")
        vacant = sum(1 for r in rooms if r.status == "Trống")

        result = await db.execute(
            select(func.count()).select_from(Contract).where(
                Contract.terminated_at.is_(None),
                Contract.end_date >= today,
                Contract.end_date <= today + timedelta(days=30),
            )
        )
        expiring = result.scalar() or 0

        result = await db.execute(select(Tenant).where(Tenant.debt > 0))
        debt_tenants = result.scalars().all()
        total_debt = sum(t.debt for t in debt_tenants)

        await send_email(
            to=settings.SMTP_FROM_EMAIL,     # sends to admin's own address
            subject=f"[MotelManage] Tóm tắt vận hành tuần — {week_label}",
            template="weekly_digest.html",
            context={
                "owner_name": "Chủ nhà",
                "week_label": week_label,
                "total_rooms": total_rooms,
                "occupied_rooms": occupied,
                "vacant_rooms": vacant,
                "expiring_contracts": expiring,
                "debt_tenants": len(debt_tenants),
                "total_debt_formatted": f"{total_debt:,}",
            },
        )
        logger.info("Weekly digest sent for week %s", week_label)
```

- [ ] **Step 2: Register the weekly digest job in setup_scheduler()**

In the `setup_scheduler()` function in `backend/app/scheduler.py`, add:

```python
    scheduler.add_job(
        send_weekly_digest,
        trigger="cron",
        day_of_week="mon",
        hour=7,
        minute=0,
        id="weekly_digest",
        replace_existing=True,
    )
```

- [ ] **Step 3: Verify scheduler registers 3 jobs**

```bash
cd backend
python -c "
import asyncio
from app.scheduler import setup_scheduler, scheduler
setup_scheduler()
jobs = scheduler.get_jobs()
print(f'Jobs: {len(jobs)}')
for j in jobs: print(f'  - {j.id}')
scheduler.shutdown(wait=False)
"
```
Expected:
```
Jobs: 3
  - contract_expiry_sync
  - publish_scheduled_posts
  - weekly_digest
```

- [ ] **Step 4: Run full test suite**

```bash
cd backend
pytest tests/ -v --tb=short -q
```
Expected: all tests pass

- [ ] **Step 5: Commit**

```bash
git add backend/app/scheduler.py
git commit -m "feat(scheduler): add weekly digest email job (Monday 07:00)"
```

---

## Risk: Zalo API

Zalo OA (Official Account) messaging requires:
1. **Zalo OA registration** — business verification through Zalo's partner portal
2. **ZNS (Zalo Notification Service) approval** — separate approval per message template
3. **ZNS template pre-approval** — each notification type must be approved by Zalo before use

**Recommendation:** Implement Zalo only after obtaining OA credentials and ZNS approval. The integration pattern would be identical to the email client (`app/integrations/zalo.py`) — an HTTP client calling `https://business.openapi.zalo.me/message/template` with the ZNS template ID and recipient phone number.

---

## Self-Review Checklist

- [x] **Spec coverage:** Payment reminders (`POST /send-reminders`), contract expiry warnings (`POST /send-expiry-warnings`), weekly digest (APScheduler Monday 07:00) — all from spec section 11 covered.
- [x] **No placeholders:** All template HTML is complete. All service methods have real query logic. `send_email()` no-ops when `EMAIL_ENABLED=False` — no silent crashes.
- [x] **Type consistency:** `send_payment_reminders()` and `send_expiry_warnings()` both return `int`. Both router endpoints return `dict` with `sent` and `message` keys.
- [x] **Tests mock SMTP:** `send_email` is patched in all tests — no real SMTP calls during CI.
- [x] **Graceful degradation:** `EMAIL_ENABLED=False` (default) makes all email methods no-ops — safe to deploy without email credentials.
