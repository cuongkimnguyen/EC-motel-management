from app.core.config import settings


def test_settings_loads():
    assert settings.DATABASE_URL.startswith("postgresql")
    assert len(settings.SECRET_KEY) >= 32
    assert settings.ALGORITHM == "HS256"
    assert settings.ACCESS_TOKEN_EXPIRE_MINUTES > 0
