"""Unit tests for HMAC webhook signature verification."""
import hashlib
import hmac

from app.modules.webhooks.signature import verify_x_hub_signature_256


SECRET = "test_secret_key"
BODY = b'{"object":"page"}'


def _make_header(body: bytes, secret: str) -> str:
    digest = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    return f"sha256={digest}"


def test_valid_signature_returns_true():
    header = _make_header(BODY, SECRET)
    assert verify_x_hub_signature_256(BODY, header, SECRET) is True


def test_tampered_body_returns_false():
    header = _make_header(BODY, SECRET)
    assert verify_x_hub_signature_256(b"tampered", header, SECRET) is False


def test_wrong_secret_returns_false():
    header = _make_header(BODY, "wrong_secret")
    assert verify_x_hub_signature_256(BODY, header, SECRET) is False


def test_missing_header_returns_false():
    assert verify_x_hub_signature_256(BODY, "", SECRET) is False


def test_missing_equals_in_header_returns_false():
    assert verify_x_hub_signature_256(BODY, "sha256", SECRET) is False


def test_wrong_method_returns_false():
    # Header says sha1 but function only accepts sha256
    digest = hmac.new(SECRET.encode(), BODY, hashlib.sha1).hexdigest()
    header = f"sha1={digest}"
    assert verify_x_hub_signature_256(BODY, header, SECRET) is False
