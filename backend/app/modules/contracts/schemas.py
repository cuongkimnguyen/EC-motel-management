import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field, model_validator


class ContractCreate(BaseModel):
    room_id: uuid.UUID
    tenant_id: uuid.UUID
    start_date: date
    end_date: date
    monthly_rent: int = Field(..., ge=100_000)
    deposit: int = Field(0, ge=0)
    billing_cycle: int = Field(1)
    payment_due_day: int = Field(5, ge=1, le=28)
    notes: str | None = None

    @model_validator(mode="after")
    def validate_dates_and_cycle(self):
        if self.end_date <= self.start_date:
            raise ValueError("Ngày kết thúc phải sau ngày bắt đầu")
        if self.billing_cycle not in (1, 3, 6, 12):
            raise ValueError("Kỳ thanh toán phải là 1, 3, 6 hoặc 12 tháng")
        return self


class ContractUpdate(BaseModel):
    monthly_rent: int | None = Field(None, ge=100_000)
    deposit: int | None = Field(None, ge=0)
    payment_due_day: int | None = Field(None, ge=1, le=28)
    notes: str | None = None


class ContractRenew(BaseModel):
    new_start_date: date
    new_end_date: date
    monthly_rent: int = Field(..., ge=100_000)
    deposit: int = Field(0, ge=0)
    billing_cycle: int = Field(1)
    payment_due_day: int = Field(5, ge=1, le=28)
    notes: str | None = None

    @model_validator(mode="after")
    def validate_dates_and_cycle(self):
        if self.new_end_date <= self.new_start_date:
            raise ValueError("Ngày kết thúc phải sau ngày bắt đầu")
        if self.billing_cycle not in (1, 3, 6, 12):
            raise ValueError("Kỳ thanh toán phải là 1, 3, 6 hoặc 12 tháng")
        return self


class ContractTerminate(BaseModel):
    termination_date: date
    reason: str | None = None


class ContractResponse(BaseModel):
    id: uuid.UUID
    code: str
    room_id: uuid.UUID
    room_code: str | None = None
    room_name: str | None = None
    tenant_id: uuid.UUID
    tenant_name: str | None = None
    tenant_phone: str | None = None
    tenant_cccd: str | None = None
    start_date: date
    end_date: date
    monthly_rent: int
    deposit: int
    billing_cycle: int
    payment_due_day: int
    terminated_at: date | None
    status: str
    days_until_expiry: int | None
    notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
