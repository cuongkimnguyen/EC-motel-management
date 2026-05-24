import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field

VALID_CATEGORIES = (
    "Điện nước", "Internet", "Vệ sinh", "Sửa chữa",
    "Mua sắm", "Lương / quản lý", "Chi phí khác",
)
VALID_PAYMENT_STATUSES = ("Đã thanh toán", "Chưa thanh toán", "Chờ xử lý")
VALID_PAYMENT_METHODS = ("Tiền mặt", "Chuyển khoản", "Khác")


class ExpenseCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    category: str
    amount: int = Field(..., ge=1)
    expense_date: date
    payment_status: str = "Chưa thanh toán"
    payment_method: str = "Tiền mặt"
    building_name: str = "Khu A"
    note: str | None = None
    is_recurring: bool = False
    receipt_image: str | None = None

    def model_post_init(self, __context):
        if self.category not in VALID_CATEGORIES:
            raise ValueError(f"category phải là một trong: {VALID_CATEGORIES}")
        if self.payment_status not in VALID_PAYMENT_STATUSES:
            raise ValueError(f"payment_status phải là một trong: {VALID_PAYMENT_STATUSES}")
        if self.payment_method not in VALID_PAYMENT_METHODS:
            raise ValueError(f"payment_method phải là một trong: {VALID_PAYMENT_METHODS}")


class ExpenseUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=255)
    category: str | None = None
    amount: int | None = Field(None, ge=1)
    expense_date: date | None = None
    payment_status: str | None = None
    payment_method: str | None = None
    building_name: str | None = None
    note: str | None = None
    is_recurring: bool | None = None
    receipt_image: str | None = None

    def model_post_init(self, __context):
        if self.category is not None and self.category not in VALID_CATEGORIES:
            raise ValueError(f"category phải là một trong: {VALID_CATEGORIES}")
        if self.payment_status is not None and self.payment_status not in VALID_PAYMENT_STATUSES:
            raise ValueError(f"payment_status phải là một trong: {VALID_PAYMENT_STATUSES}")
        if self.payment_method is not None and self.payment_method not in VALID_PAYMENT_METHODS:
            raise ValueError(f"payment_method phải là một trong: {VALID_PAYMENT_METHODS}")


class ExpenseResponse(BaseModel):
    id: uuid.UUID
    code: str
    title: str
    category: str
    amount: int
    expense_date: date
    payment_status: str
    payment_method: str
    building_name: str
    note: str | None
    is_recurring: bool
    receipt_image: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ExpenseStats(BaseModel):
    total: int
    paid: int
    unpaid: int
    pending: int
    total_amount: int
