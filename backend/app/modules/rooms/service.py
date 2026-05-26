from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.pagination import PaginationParams, make_paginated_response
from app.modules.activity.service import ActivityService
from app.modules.rooms.repository import RoomRepository
from app.modules.rooms.schemas import RoomCreate, RoomResponse, RoomUpdate


class RoomService:
    def __init__(self, db: AsyncSession):
        self.repo = RoomRepository(db)
        self.activity = ActivityService(db)

    async def _to_response(self, room) -> RoomResponse:
        current = await self.repo.count_active_contracts(room.id)
        data = RoomResponse.model_validate(room)
        data.current_tenants = current
        return data

    async def list_rooms(self, params: PaginationParams, **filters) -> dict:
        rooms, total = await self.repo.list_rooms(params.page, params.limit, **filters)
        data = []
        for room in rooms:
            current = await self.repo.count_active_contracts(room.id)
            r = RoomResponse.model_validate(room)
            r.current_tenants = current
            data.append(r)
        return make_paginated_response(data, total, params)

    async def create_room(self, payload: RoomCreate) -> RoomResponse:
        existing = await self.repo.get_by_code(payload.code)
        if existing:
            raise HTTPException(status_code=409, detail="Mã phòng đã tồn tại")
        room = await self.repo.create(**payload.model_dump())
        await self.activity.log_event(
            event_type="room_created",
            description=f"Thêm phòng mới: {room.code} - {room.name}",
            module="rooms",
            reference_id=room.id,
            reference_type="room",
        )
        return await self._to_response(room)

    async def update_room(self, room_id: str, payload: RoomUpdate) -> RoomResponse:
        room = await self.repo.get_by_id(room_id)
        if not room:
            raise HTTPException(status_code=404, detail="Phòng không tồn tại")
        updates = payload.model_dump(exclude_none=True)
        room = await self.repo.update(room, **updates)
        return await self._to_response(room)

    async def delete_room(self, room_id: str) -> None:
        room = await self.repo.get_by_id(room_id)
        if not room:
            raise HTTPException(status_code=404, detail="Phòng không tồn tại")
        active = await self.repo.count_active_contracts(room.id)
        if active > 0:
            raise HTTPException(status_code=409, detail="Không thể xóa phòng đang có khách thuê")
        await self.activity.log_event(
            event_type="room_deleted",
            description=f"Xóa phòng: {room.code} - {room.name}",
            module="rooms",
            reference_id=room.id,
            reference_type="room",
        )
        await self.repo.delete(room)

    async def update_status(self, room_id: str, status: str) -> RoomResponse:
        room = await self.repo.get_by_id(room_id)
        if not room:
            raise HTTPException(status_code=404, detail="Phòng không tồn tại")
        room = await self.repo.update(room, status=status)
        return await self._to_response(room)
