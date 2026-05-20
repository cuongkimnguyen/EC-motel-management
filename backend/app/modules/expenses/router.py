from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.pagination import PaginationParams
from app.core.database import get_db
from app.core.dependencies import require_admin
from app.modules.expenses.schemas import ExpenseCreate, ExpenseResponse, ExpenseStats, ExpenseUpdate
from app.modules.expenses.service import ExpenseService

router = APIRouter(prefix="/api/expenses", tags=["expenses"])


@router.get("/stats", response_model=ExpenseStats)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await ExpenseService(db).get_stats()


@router.get("", response_model=dict)
async def list_expenses(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    category: str | None = Query(None),
    payment_status: str | None = Query(None),
    building_name: str | None = Query(None),
    from_date: date | None = Query(None),
    to_date: date | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await ExpenseService(db).list_expenses(
        PaginationParams(page=page, limit=limit),
        search=search,
        category=category,
        payment_status=payment_status,
        building_name=building_name,
        from_date=from_date,
        to_date=to_date,
    )


@router.get("/{expense_id}", response_model=ExpenseResponse)
async def get_expense(
    expense_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await ExpenseService(db).get_expense(expense_id)


@router.post("", response_model=ExpenseResponse, status_code=201)
async def create_expense(
    payload: ExpenseCreate,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await ExpenseService(db).create_expense(payload)


@router.put("/{expense_id}", response_model=ExpenseResponse)
async def update_expense(
    expense_id: str,
    payload: ExpenseUpdate,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await ExpenseService(db).update_expense(expense_id, payload)


@router.delete("/{expense_id}", status_code=204)
async def delete_expense(
    expense_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    await ExpenseService(db).delete_expense(expense_id)


@router.patch("/{expense_id}/mark-paid", response_model=ExpenseResponse)
async def mark_paid(
    expense_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await ExpenseService(db).mark_paid(expense_id)
