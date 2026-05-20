import uuid
from datetime import date

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.expenses.models import Expense


class ExpenseRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, expense_id: str | uuid.UUID) -> Expense | None:
        result = await self.db.execute(select(Expense).where(Expense.id == expense_id))
        return result.scalar_one_or_none()

    async def get_last_code_for_year(self, year: int) -> str | None:
        prefix = f"CP-{year}-"
        result = await self.db.execute(
            select(Expense.code)
            .where(Expense.code.like(f"{prefix}%"))
            .order_by(Expense.code.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def create(self, **kwargs) -> Expense:
        expense = Expense(**kwargs)
        self.db.add(expense)
        await self.db.flush()
        await self.db.refresh(expense)
        return expense

    async def update(self, expense: Expense, **kwargs) -> Expense:
        for key, value in kwargs.items():
            setattr(expense, key, value)
        await self.db.flush()
        await self.db.refresh(expense)
        return expense

    async def delete(self, expense: Expense) -> None:
        await self.db.delete(expense)
        await self.db.flush()

    async def list_expenses(
        self,
        page: int,
        limit: int,
        search: str | None = None,
        category: str | None = None,
        payment_status: str | None = None,
        building_name: str | None = None,
        from_date: date | None = None,
        to_date: date | None = None,
    ) -> tuple[list[Expense], int]:
        q = select(Expense)
        if search:
            pattern = f"%{search}%"
            q = q.where(
                Expense.title.ilike(pattern)
                | Expense.code.ilike(pattern)
                | Expense.note.ilike(pattern)
            )
        if category:
            q = q.where(Expense.category == category)
        if payment_status:
            q = q.where(Expense.payment_status == payment_status)
        if building_name:
            q = q.where(Expense.building_name == building_name)
        if from_date:
            q = q.where(Expense.expense_date >= from_date)
        if to_date:
            q = q.where(Expense.expense_date <= to_date)

        count_q = select(func.count()).select_from(q.subquery())
        total = await self.db.scalar(count_q) or 0
        q = q.order_by(Expense.expense_date.desc(), Expense.code.desc())
        q = q.offset((page - 1) * limit).limit(limit)
        result = await self.db.execute(q)
        return list(result.scalars().all()), total

    async def get_stats(self) -> dict:
        rows = await self.db.execute(
            select(
                Expense.payment_status,
                func.count().label("cnt"),
                func.coalesce(func.sum(Expense.amount), 0).label("amt"),
            ).group_by(Expense.payment_status)
        )
        paid = unpaid = pending = total_amount = total = 0
        for row in rows:
            total += row.cnt
            total_amount += row.amt
            if row.payment_status == "Đã thanh toán":
                paid = row.cnt
            elif row.payment_status == "Chưa thanh toán":
                unpaid = row.cnt
            elif row.payment_status == "Chờ xử lý":
                pending = row.cnt
        return {"total": total, "paid": paid, "unpaid": unpaid, "pending": pending, "total_amount": total_amount}
