import hashlib
import hmac


def verify_x_hub_signature_256(raw_body: bytes, header: str, app_secret: str) -> bool:
    """Verify Meta's X-Hub-Signature-256 header using HMAC-SHA256.

    Args:
        raw_body: Raw request body bytes.
        header: Value of the X-Hub-Signature-256 header (e.g. "sha256=abc123...").
        app_secret: Facebook App Secret from config.

    Returns:
        True if signature matches; False otherwise.
    """
    if not header or "=" not in header:
        return False
    method, provided = header.split("=", 1)
    if method != "sha256":
        return False
    expected = hmac.new(app_secret.encode(), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(provided, expected)
