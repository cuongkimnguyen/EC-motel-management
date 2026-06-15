import uuid
from datetime import date

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.pagination import PaginationParams, make_paginated_response
from app.modules.contracts.models import Contract
from app.modules.contracts.repository import ContractRepository
from app.modules.contracts.schemas import (
    ContractCreate,
    ContractRenew,
    ContractResponse,
    ContractTerminate,
    ContractUpdate,
)
from app.modules.activity.service import ActivityService
from app.modules.rooms.repository import RoomRepository
from app.modules.tenants.repository import TenantRepository


class ContractService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = ContractRepository(db)
        self.room_repo = RoomRepository(db)
        self.tenant_repo = TenantRepository(db)
        self.activity = ActivityService(db)

    async def _generate_code(self) -> str:
        year = date.today().year
        last_code = await self.repo.get_last_code_for_year(year)
        if last_code:
            num = int(last_code.split("-")[-1]) + 1
        else:
            num = 1
        return f"HĐ-{year}-{num:05d}"

    async def _compute_tenant_status(self, tenant_id: uuid.UUID) -> str:
        today = date.today()
        result = await self.db.execute(
            select(Contract).where(
                Contract.tenant_id == tenant_id,
                Contract.terminated_at.is_(None),
                Contract.end_date >= today,
            )
        )
        active = result.scalar_one_or_none()
        if active is None:
            return "Đã trả phòng"
        if active.days_until_expiry is not None and active.days_until_expiry <= 30:
            return "Sắp hết hạn"
        return "Đang thuê"

    async def _to_response(self, contract: Contract) -> ContractResponse:
        resp = ContractResponse.model_validate(contract)
        resp.status = contract.status
        resp.days_until_expiry = contract.days_until_expiry
        room = await self.room_repo.get_by_id(contract.room_id)
        if room:
            resp.room_code = room.code
            resp.room_name = room.name
        tenant = await self.tenant_repo.get_by_id(contract.tenant_id)
        if tenant:
            resp.tenant_name = tenant.full_name
            resp.tenant_phone = tenant.phone
            resp.tenant_cccd = tenant.cccd
        return resp

    async def list_contracts(self, params: PaginationParams, **filters) -> dict:
        contracts, total = await self.repo.list_contracts(params.page, params.limit, **filters)
        data = [await self._to_response(c) for c in contracts]
        return make_paginated_response(data, total, params)

    async def create_contract(self, payload: ContractCreate) -> ContractResponse:
        room = await self.room_repo.get_by_id(str(payload.room_id))
        if not room:
            raise HTTPException(status_code=404, detail="Phòng không tồn tại")
        tenant = await self.tenant_repo.get_by_id(str(payload.tenant_id))
        if not tenant:
            raise HTTPException(status_code=404, detail="Khách thuê không tồn tại")

        existing = await self.repo.get_active_for_room(payload.room_id)
        if existing:
            raise HTTPException(status_code=409, detail="Phòng đã có hợp đồng đang hiệu lực")

        code = await self._generate_code()
        contract = await self.repo.create(
            code=code,
            room_id=payload.room_id,
            tenant_id=payload.tenant_id,
            start_date=payload.start_date,
            end_date=payload.end_date,
            monthly_rent=payload.monthly_rent,
            deposit=payload.deposit,
            billing_cycle=payload.billing_cycle,
            payment_due_day=payload.payment_due_day,
            notes=payload.notes,
        )

        await self.room_repo.update(room, status="Đang thuê")
        tenant_status = await self._compute_tenant_status(tenant.id)
        await self.tenant_repo.update(tenant, current_room_id=room.id, status=tenant_status)

        await self.activity.log_event(
            event_type="contract_created",
            description=f"Tạo hợp đồng mới: {contract.code} - {tenant.full_name} - {room.code}",
            module="contracts",
            reference_id=contract.id,
            reference_type="contract",
        )
        return await self._to_response(contract)

    async def update_contract(self, contract_id: str, payload: ContractUpdate) -> ContractResponse:
        contract = await self.repo.get_by_id(contract_id)
        if not contract:
            raise HTTPException(status_code=404, detail="Hợp đồng không tồn tại")
        if contract.status not in ("Đang hiệu lực", "Sắp hết hạn"):
            raise HTTPException(status_code=409, detail="Chỉ cập nhật hợp đồng đang hiệu lực")
        updates = payload.model_dump(exclude_none=True)
        contract = await self.repo.update(contract, **updates)
        return await self._to_response(contract)

    async def renew_contract(self, contract_id: str, payload: ContractRenew) -> dict:
        contract = await self.repo.get_by_id(contract_id)
        if not contract:
            raise HTTPException(status_code=404, detail="Hợp đồng không tồn tại")
        if contract.status == "Đã chấm dứt":
            raise HTTPException(status_code=409, detail="Không thể gia hạn hợp đồng đã chấm dứt")

        existing = await self.repo.get_active_for_room(contract.room_id)
        if existing and str(existing.id) != contract_id:
            raise HTTPException(status_code=409, detail="Phòng đã có hợp đồng đang hiệu lực khác")

        code = await self._generate_code()
        new_contract = await self.repo.create(
            code=code,
            room_id=contract.room_id,
            tenant_id=contract.tenant_id,
            start_date=payload.new_start_date,
            end_date=payload.new_end_date,
            monthly_rent=payload.monthly_rent,
            deposit=payload.deposit,
            billing_cycle=payload.billing_cycle,
            payment_due_day=payload.payment_due_day,
            notes=payload.notes,
        )

        # Mark old contract as terminated (at its end_date) if not already expired
        if contract.status != "Đã hết hạn":
            await self.repo.update(contract, terminated_at=contract.end_date)

        # Recompute tenant status based on the new contract
        tenant = await self.tenant_repo.get_by_id(contract.tenant_id)
        if tenant:
            tenant_status = await self._compute_tenant_status(tenant.id)
            await self.tenant_repo.update(tenant, current_room_id=contract.room_id, status=tenant_status)

        await self.activity.log_event(
            event_type="contract_renewed",
            description=f"Gia hạn hợp đồng: {contract.code} → {new_contract.code}",
            module="contracts",
            reference_id=new_contract.id,
            reference_type="contract",
        )
        return {
            "old_contract": await self._to_response(contract),
            "new_contract": await self._to_response(new_contract),
        }

    async def terminate_contract(
        self, contract_id: str, payload: ContractTerminate
    ) -> ContractResponse:
        contract = await self.repo.get_by_id(contract_id)
        if not contract:
            raise HTTPException(status_code=404, detail="Hợp đồng không tồn tại")
        if contract.status not in ("Đang hiệu lực", "Sắp hết hạn"):
            raise HTTPException(status_code=409, detail="Chỉ chấm dứt hợp đồng đang hiệu lực")

        contract = await self.repo.update(contract, terminated_at=payload.termination_date)

        room = await self.room_repo.get_by_id(contract.room_id)
        if room:
            await self.room_repo.update(room, status="Trống")

        tenant = await self.tenant_repo.get_by_id(contract.tenant_id)
        if tenant:
            await self.tenant_repo.update(tenant, current_room_id=None, status="Đã trả phòng")

        await self.activity.log_event(
            event_type="contract_terminated",
            description=f"Chấm dứt hợp đồng: {contract.code}",
            module="contracts",
            reference_id=contract.id,
            reference_type="contract",
        )
        return await self._to_response(contract)

    async def delete_contract(self, contract_id: str) -> None:
        contract = await self.repo.get_by_id(contract_id)
        if not contract:
            raise HTTPException(status_code=404, detail="Hợp đồng không tồn tại")
        if contract.status in ("Đang hiệu lực", "Sắp hết hạn"):
            raise HTTPException(status_code=409, detail="Không thể xóa hợp đồng đang hiệu lực")
        await self.repo.delete(contract)

    async def export_excel(self) -> tuple[list[str], list[list]]:
        """Return headers + rows for Excel export with joined room/tenant data."""
        contracts, _ = await self.repo.list_contracts(page=1, limit=10_000)
        headers = [
            "Mã hợp đồng", "Phòng", "Khách thuê", "SĐT", "CCCD",
            "Ngày bắt đầu", "Ngày kết thúc", "Tiền thuê (VND)",
            "Đặt cọc (VND)", "Trạng thái", "Còn lại (ngày)", "Ghi chú",
        ]
        today = date.today()
        rows = []
        for c in contracts:
            room = await self.room_repo.get_by_id(c.room_id)
            tenant = await self.tenant_repo.get_by_id(c.tenant_id)
            days_left = c.days_until_expiry
            rows.append([
                c.code,
                room.code if room else "",
                tenant.full_name if tenant else "",
                tenant.phone if tenant else "",
                tenant.cccd if tenant else "",
                str(c.start_date),
                str(c.end_date),
                c.monthly_rent,
                c.deposit,
                c.status,
                days_left if days_left is not None else "–",
                c.notes or "",
            ])
        return headers, rows
