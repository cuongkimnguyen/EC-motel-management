import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class RoomCreate(BaseModel):
    code: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=2, max_length=255)
    floor: str = Field(..., min_length=1, max_length=50)
    block: str = Field(..., min_length=1, max_length=50)
    area: int = Field(..., ge=5)
    rent_price: int = Field(..., ge=500_000)
    deposit: int = Field(0, ge=0)
    electricity_price: int = Field(0, ge=0)
    water_price: int = Field(0, ge=0)
    service_fee: int = Field(0, ge=0)
    max_tenants: int = Field(1, ge=1)
    status: str = "Trống"
    description: str | None = None


class RoomUpdate(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=255)
    floor: str | None = Field(None, min_length=1, max_length=50)
    block: str | None = Field(None, min_length=1, max_length=50)
    area: int | None = Field(None, ge=5)
    rent_price: int | None = Field(None, ge=500_000)
    deposit: int | None = Field(None, ge=0)
    electricity_price: int | None = Field(None, ge=0)
    water_price: int | None = Field(None, ge=0)
    service_fee: int | None = Field(None, ge=0)
    max_tenants: int | None = Field(None, ge=1)
    status: str | None = None
    description: str | None = None


class RoomStatusUpdate(BaseModel):
    status: str
    reason: str | None = None


class RoomResponse(BaseModel):
    id: uuid.UUID
    code: str
    name: str
    floor: str
    block: str
    area: int
    rent_price: int
    deposit: int
    electricity_price: int
    water_price: int
    service_fee: int
    max_tenants: int
    current_tenants: int = 0
    status: str
    description: str | None
    images: list[str]
    has_active_post: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
