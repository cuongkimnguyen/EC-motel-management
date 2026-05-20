import uuid
from datetime import datetime

from pydantic import BaseModel, Field

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

    def model_post_init(self, __context):
        if self.post_type not in VALID_POST_TYPES:
            raise ValueError(f"post_type phải là một trong: {VALID_POST_TYPES}")
        if self.channel not in VALID_CHANNELS:
            raise ValueError(f"channel phải là một trong: {VALID_CHANNELS}")
        if self.post_type in ROOM_FREE_TYPES and self.room_id is not None:
            raise ValueError(f"Bài đăng loại {self.post_type} không được gắn phòng")


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


class PostSchedule(BaseModel):
    scheduled_at: datetime


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
