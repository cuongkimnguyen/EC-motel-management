from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.pagination import PaginationParams
from app.core.database import get_db
from app.core.dependencies import require_admin
from app.modules.contracts.schemas import (
    ContractCreate,
    ContractRenew,
    ContractResponse,
    ContractTerminate,
    ContractUpdate,
)
from app.modules.contracts.service import ContractService

router = APIRouter(prefix="/api/contracts", tags=["contracts"])


@router.get("", response_model=dict)
async def list_contracts(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    status: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await ContractService(db).list_contracts(
        PaginationParams(page=page, limit=limit),
        search=search,
        status=status,
    )


@router.post("", response_model=ContractResponse, status_code=201)
async def create_contract(
    payload: ContractCreate,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await ContractService(db).create_contract(payload)


@router.put("/{contract_id}", response_model=ContractResponse)
async def update_contract(
    contract_id: str,
    payload: ContractUpdate,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await ContractService(db).update_contract(contract_id, payload)


@router.post("/{contract_id}/renew", response_model=dict)
async def renew_contract(
    contract_id: str,
    payload: ContractRenew,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await ContractService(db).renew_contract(contract_id, payload)


@router.post("/{contract_id}/terminate", response_model=ContractResponse)
async def terminate_contract(
    contract_id: str,
    payload: ContractTerminate,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await ContractService(db).terminate_contract(contract_id, payload)


@router.delete("/{contract_id}", status_code=204)
async def delete_contract(
    contract_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    await ContractService(db).delete_contract(contract_id)
