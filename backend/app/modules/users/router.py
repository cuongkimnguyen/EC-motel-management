import math

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.schemas import PaginatedResponse
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin
from app.modules.users.schemas import UserCreate, UserResponse, UserUpdate
from app.modules.users.service import UserService

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_me(current_user=Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_me(
    data: UserUpdate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await UserService(db).update_user(str(current_user.id), data)


@router.get("", response_model=PaginatedResponse[UserResponse])
async def list_users(
    page: int = 1,
    limit: int = 20,
    _=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    users, total = await UserService(db).list_users(page, limit)
    return {
        "data": users,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": math.ceil(total / limit) if limit else 1,
    }


@router.post("", response_model=UserResponse, status_code=201)
async def create_user(
    data: UserCreate,
    _=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    return await UserService(db).create_user(data)
