from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.pagination import PaginationParams, make_paginated_response
from app.modules.tenants.repository import TenantRepository
from app.modules.tenants.schemas import TenantCreate, TenantResponse, TenantUpdate


class TenantService:
    def __init__(self, db: AsyncSession):
        self.repo = TenantRepository(db)

    async def _to_response(self, tenant) -> TenantResponse:
        resp = TenantResponse.model_validate(tenant)
        if tenant.current_room_id:
            from app.modules.rooms.repository import RoomRepository
            room_repo = RoomRepository(self.repo.db)
            room = await room_repo.get_by_id(tenant.current_room_id)
            resp.current_room_code = room.code if room else None
        return resp

    async def list_tenants(self, params: PaginationParams, **filters) -> dict:
        tenants, total = await self.repo.list_tenants(params.page, params.limit, **filters)
        data = [await self._to_response(t) for t in tenants]
        return make_paginated_response(data, total, params)

    async def create_tenant(self, payload: TenantCreate) -> TenantResponse:
        if await self.repo.get_by_phone(payload.phone):
            raise HTTPException(status_code=409, detail="Số điện thoại đã tồn tại")
        if await self.repo.get_by_cccd(payload.cccd):
            raise HTTPException(status_code=409, detail="Số CCCD đã tồn tại")
        tenant = await self.repo.create(**payload.model_dump())
        return await self._to_response(tenant)

    async def update_tenant(self, tenant_id: str, payload: TenantUpdate) -> TenantResponse:
        tenant = await self.repo.get_by_id(tenant_id)
        if not tenant:
            raise HTTPException(status_code=404, detail="Khách thuê không tồn tại")
        updates = payload.model_dump(exclude_none=True)
        if "phone" in updates and updates["phone"] != tenant.phone:
            if await self.repo.get_by_phone(updates["phone"]):
                raise HTTPException(status_code=409, detail="Số điện thoại đã tồn tại")
        tenant = await self.repo.update(tenant, **updates)
        return await self._to_response(tenant)

    async def delete_tenant(self, tenant_id: str) -> None:
        tenant = await self.repo.get_by_id(tenant_id)
        if not tenant:
            raise HTTPException(status_code=404, detail="Khách thuê không tồn tại")
        if await self.repo.has_active_contract(tenant.id):
            raise HTTPException(
                status_code=409, detail="Không thể xóa khách thuê đang có hợp đồng"
            )
        await self.repo.delete(tenant)
