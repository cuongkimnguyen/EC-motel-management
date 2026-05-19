from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.modules.users.repository import UserRepository
from app.modules.users.schemas import UserCreate, UserUpdate


class UserService:
    def __init__(self, db: AsyncSession):
        self.repo = UserRepository(db)

    async def create_user(self, data: UserCreate):
        existing = await self.repo.get_by_email(data.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )
        return await self.repo.create(
            email=data.email,
            password_hash=hash_password(data.password),
            full_name=data.full_name,
            role=data.role,
        )

    async def get_user(self, user_id: str):
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        return user

    async def update_user(self, user_id: str, data: UserUpdate):
        user = await self.get_user(user_id)
        updates = data.model_dump(exclude_none=True)
        if not updates:
            return user
        return await self.repo.update(user, **updates)

    async def list_users(self, page: int, limit: int):
        return await self.repo.list_all(page, limit)
