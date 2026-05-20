import re
import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field, field_validator


class TenantCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255)
    phone: str = Field(..., min_length=10, max_length=20)
    cccd: str = Field(..., min_length=12, max_length=20)
    gender: str = Field(..., pattern="^(Nam|Nữ)$")
    date_of_birth: date
    permanent_address: str = Field(..., min_length=5)
    occupation: str | None = None
    license_plate: str | None = None
    notes: str | None = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        if not re.match(r"^0[0-9]{9}$", v):
            raise ValueError("Số điện thoại phải có 10 chữ số và bắt đầu bằng 0")
        return v

    @field_validator("cccd")
    @classmethod
    def validate_cccd(cls, v: str) -> str:
        if not re.match(r"^[0-9]{12}$", v):
            raise ValueError("CCCD phải có đúng 12 chữ số")
        return v


class TenantUpdate(BaseModel):
    full_name: str | None = Field(None, min_length=2, max_length=255)
    phone: str | None = None
    gender: str | None = Field(None, pattern="^(Nam|Nữ)$")
    date_of_birth: date | None = None
    permanent_address: str | None = Field(None, min_length=5)
    occupation: str | None = None
    license_plate: str | None = None
    notes: str | None = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str | None) -> str | None:
        if v is not None and not re.match(r"^0[0-9]{9}$", v):
            raise ValueError("Số điện thoại phải có 10 chữ số và bắt đầu bằng 0")
        return v


class TenantResponse(BaseModel):
    id: uuid.UUID
    full_name: str
    phone: str
    cccd: str
    gender: str
    date_of_birth: date
    permanent_address: str
    current_room_id: uuid.UUID | None
    current_room_code: str | None = None  # populated in service layer
    occupation: str | None
    license_plate: str | None
    debt: int
    status: str
    notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
