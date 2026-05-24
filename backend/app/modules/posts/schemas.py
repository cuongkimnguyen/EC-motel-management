import uuid
from datetime import datetime, timezone

from pydantic import BaseModel, Field, field_validator, model_validator

VALID_POST_TYPES = ("Tuyển khách", "Khuyến mãi", "Thông báo")
VALID_CHANNELS = ("Facebook Page", "Facebook Group", "Zalo")
ROOM_FREE_TYPES = ("Khuyến mãi", "Thông báo")


class PostCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1)
    room_id: uuid.UUID | None = None
    post_type: str
    channel: str
    planned_date: datetime | None = None
    hashtags: str | None = None
    price: int | None = Field(None, ge=0)
    area: int | None = Field(None, ge=1)
    assignee: str | None = None
    thumbnail: str | None = None

    @model_validator(mode="after")
    def validate_post_fields(self) -> "PostCreate":
        if self.post_type not in VALID_POST_TYPES:
            raise ValueError(f"post_type phải là một trong: {VALID_POST_TYPES}")
        if self.channel not in VALID_CHANNELS:
            raise ValueError(f"channel phải là một trong: {VALID_CHANNELS}")
        if self.post_type in ROOM_FREE_TYPES and self.room_id is not None:
            raise ValueError(f"Bài đăng loại {self.post_type} không được gắn phòng")
        return self


class PostUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=255)
    content: str | None = Field(None, min_length=1)
    room_id: uuid.UUID | None = None
    channel: str | None = None
    planned_date: datetime | None = None
    hashtags: str | None = None
    price: int | None = Field(None, ge=0)
    area: int | None = Field(None, ge=1)
    assignee: str | None = None
    thumbnail: str | None = None

    @model_validator(mode="after")
    def validate_channel(self) -> "PostUpdate":
        if self.channel is not None and self.channel not in VALID_CHANNELS:
            raise ValueError(f"channel phải là một trong: {VALID_CHANNELS}")
        return self


class PostSchedule(BaseModel):
    scheduled_at: datetime

    @field_validator("scheduled_at")
    @classmethod
    def must_be_future(cls, v: datetime) -> datetime:
        now = datetime.now(timezone.utc)
        # Make v timezone-aware if it isn't
        if v.tzinfo is None:
            v = v.replace(tzinfo=timezone.utc)
        if v <= now:
            raise ValueError("scheduled_at phải là thời điểm trong tương lai")
        return v


class PostResponse(BaseModel):
    id: uuid.UUID
    title: str
    content: str
    room_id: uuid.UUID | None
    room_code: str | None = None
    post_type: str
    channel: str
    planned_date: datetime | None
    posted_date: datetime | None
    status: str
    fb_link: str | None
    views: int
    messages: int
    leads: int
    converted: int
    hashtags: str | None
    price: int | None
    area: int | None
    assignee: str | None
    thumbnail: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PostStats(BaseModel):
    total: int
    published: int
    scheduled: int
    draft: int
    error: int
    total_views: int
    total_leads: int
