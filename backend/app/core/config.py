from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str
    TEST_DATABASE_URL: str = ""
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    ANTHROPIC_API_KEY: str = ""

    # Facebook / Meta Messenger
    META_GRAPH_API_VERSION: str = "v21.0"
    FACEBOOK_PAGE_ID: str = ""
    FACEBOOK_PAGE_ACCESS_TOKEN: str = ""
    FACEBOOK_VERIFY_TOKEN: str = ""
    FACEBOOK_APP_SECRET: str = ""
    FACEBOOK_WEBHOOK_ENABLED: bool = False


settings = Settings()
