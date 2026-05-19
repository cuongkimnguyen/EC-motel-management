import pytest
from app.core.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token,
)


def test_hash_and_verify_password():
    hashed = hash_password("mypassword")
    assert hashed != "mypassword"
    assert verify_password("mypassword", hashed)
    assert not verify_password("wrongpassword", hashed)


def test_access_token_payload():
    token = create_access_token(user_id="abc-123", role="admin")
    payload = decode_token(token)
    assert payload["sub"] == "abc-123"
    assert payload["role"] == "admin"
    assert payload["type"] == "access"


def test_refresh_token_payload():
    token = create_refresh_token(user_id="abc-123")
    payload = decode_token(token)
    assert payload["sub"] == "abc-123"
    assert payload["type"] == "refresh"
    assert "role" not in payload


def test_invalid_token_raises():
    with pytest.raises(ValueError, match="Invalid token"):
        decode_token("not.a.valid.token")
