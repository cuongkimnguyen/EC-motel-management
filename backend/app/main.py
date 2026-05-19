from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.exceptions import HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.common.exceptions import AppException, app_exception_handler, http_exception_handler
from app.core.database import engine
from app.modules.auth.router import router as auth_router
from app.modules.rooms.router import router as rooms_router
from app.modules.users.router import router as users_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await engine.dispose()


def create_app() -> FastAPI:
    app = FastAPI(
        title="MotelManage API",
        version="0.1.0",
        description="Backend API for MotelManage motel management system",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.add_exception_handler(AppException, app_exception_handler)
    app.add_exception_handler(HTTPException, http_exception_handler)

    app.include_router(auth_router)
    app.include_router(users_router)
    app.include_router(rooms_router)

    return app


app = create_app()
