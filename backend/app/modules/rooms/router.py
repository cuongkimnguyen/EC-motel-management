from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.pagination import PaginationParams
from app.core.database import get_db
from app.core.dependencies import require_admin
from app.modules.rooms.schemas import RoomCreate, RoomResponse, RoomStatusUpdate, RoomUpdate
from app.modules.rooms.service import RoomService

router = APIRouter(prefix="/api/rooms", tags=["rooms"])


@router.get("", response_model=dict)
async def list_rooms(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    status: str | None = Query(None),
    block: str | None = Query(None),
    floor: str | None = Query(None),
    price_min: int | None = Query(None, alias="priceMin"),
    price_max: int | None = Query(None, alias="priceMax"),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    svc = RoomService(db)
    return await svc.list_rooms(
        PaginationParams(page=page, limit=limit),
        search=search,
        status=status,
        block=block,
        floor=floor,
        price_min=price_min,
        price_max=price_max,
    )


@router.post("", response_model=RoomResponse, status_code=201)
async def create_room(
    payload: RoomCreate,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await RoomService(db).create_room(payload)


@router.put("/{room_id}", response_model=RoomResponse)
async def update_room(
    room_id: str,
    payload: RoomUpdate,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await RoomService(db).update_room(room_id, payload)


@router.delete("/{room_id}", status_code=204)
async def delete_room(
    room_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    await RoomService(db).delete_room(room_id)


@router.patch("/{room_id}/status", response_model=RoomResponse)
async def update_room_status(
    room_id: str,
    payload: RoomStatusUpdate,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await RoomService(db).update_status(room_id, payload.status)
