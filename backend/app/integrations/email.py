"""SMTP email client with Jinja2 HTML templates.

Sending is synchronous (smtplib) but runs in a thread pool executor
so it doesn't block the FastAPI event loop.

Usage:
    await send_email(
        to="tenant@example.com",
        subject="Nhac nho thanh toan",
        template="payment_reminder.html",
        context={"tenant_name": "Nguyen Van A", "amount_due": 3_500_000},
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
