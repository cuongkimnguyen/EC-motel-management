from datetime import date

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.pagination import PaginationParams, make_paginated_response
from app.modules.activity.service import ActivityService
from app.modules.expenses.repository import ExpenseRepository
from app.modules.expenses.schemas import ExpenseCreate, ExpenseResponse, ExpenseStats, ExpenseUpdate


class ExpenseService:
    def __init__(self, db: AsyncSession):
        self.repo = ExpenseRepository(db)
        self.activity = ActivityService(db)

    async def _generate_code(self) -> str:
        year = date.today().year
        last_code = await self.repo.get_last_code_for_year(year)
        if last_code:
            num = int(last_code.split("-")[-1]) + 1
        else:
            num = 1
        return f"CP-{year}-{num:03d}"

    async def list_expenses(self, params: PaginationParams, **filters) -> dict:
        expenses, total = await self.repo.list_expenses(params.page, params.limit, **filters)
        data = [ExpenseResponse.model_validate(e) for e in expenses]
        return make_paginated_response(data, total, params)

    async def get_stats(self) -> ExpenseStats:
        stats = await self.repo.get_stats()
        return ExpenseStats(**stats)

    async def get_expense(self, expense_id: str) -> ExpenseResponse:
        expense = await self.repo.get_by_id(expense_id)
        if not expense:
            raise HTTPException(status_code=404, detail="Chi phí không tồn tại")
        return ExpenseResponse.model_validate(expense)

    async def create_expense(self, payload: ExpenseCreate) -> ExpenseResponse:
        code = await self._generate_code()
        expense = await self.repo.create(code=code, **payload.model_dump())
        await self.activity.log_event(
            event_type="expense_created",
            description=f"Thêm chi phí: {expense.code} - {expense.title} ({expense.amount:,}đ)",
            module="expenses",
            reference_id=expense.id,
            reference_type="expense",
        )
        return ExpenseResponse.model_validate(expense)

    async def update_expense(self, expense_id: str, payload: ExpenseUpdate) -> ExpenseResponse:
        expense = await self.repo.get_by_id(expense_id)
        if not expense:
            raise HTTPException(status_code=404, detail="Chi phí không tồn tại")
        updates = payload.model_dump(exclude_none=True)
        expense = await self.repo.update(expense, **updates)
        return ExpenseResponse.model_validate(expense)

    async def delete_expense(self, expense_id: str) -> None:
        expense = await self.repo.get_by_id(expense_id)
        if not expense:
            raise HTTPException(status_code=404, detail="Chi phí không tồn tại")
        await self.repo.delete(expense)

    async def mark_paid(self, expense_id: str) -> ExpenseResponse:
        expense = await self.repo.get_by_id(expense_id)
        if not expense:
            raise HTTPException(status_code=404, detail="Chi phí không tồn tại")
        expense = await self.repo.update(expense, payment_status="Đã thanh toán")
        return ExpenseResponse.model_validate(expense)

    async def export_excel(self) -> tuple[list[str], list[list]]:
        """Return headers + rows for Excel export (all expenses, no pagination)."""
        expenses, _ = await self.repo.list_expenses(page=1, limit=10_000)
        headers = [
            "Mã chi phí", "Tiêu đề", "Danh mục", "Số tiền (VND)",
            "Ngày chi", "Trạng thái", "Phương thức", "Tòa nhà", "Ghi chú",
        ]
        rows = [
            [
                e.code, e.title, e.category, e.amount,
                str(e.expense_date), e.payment_status, e.payment_method,
                e.building_name, e.note or "",
            ]
            for e in expenses
        ]
        return headers, rows

    async def upload_receipt(self, expense_id: str, file_bytes: bytes, filename: str) -> ExpenseResponse:
        from app.integrations.storage import upload_expense_receipt

        expense = await self.repo.get_by_id(expense_id)
        if not expense:
            raise HTTPException(status_code=404, detail="Chi phí không tồn tại")
        url = await upload_expense_receipt(file_bytes, filename)
        expense = await self.repo.update(expense, receipt_image=url)
        return ExpenseResponse.model_validate(expense)
