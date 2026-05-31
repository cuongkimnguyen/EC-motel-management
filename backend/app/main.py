from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.exceptions import HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.common.exceptions import AppException, app_exception_handler, http_exception_handler
from app.core.database import engine
from app.modules.auth.router import router as auth_router
from app.modules.contracts.router import router as contracts_router
from app.modules.rooms.router import router as rooms_router
from app.modules.tenants.router import router as tenants_router
from app.modules.expenses.router import router as expenses_router
from app.modules.notifications.router import router as notifications_router
from app.modules.posts.router import router as posts_router
from app.modules.conversations.router import router as conversations_router
from app.modules.webhooks.facebook import router as webhooks_router
from app.modules.dashboard.router import router as dashboard_router
from app.modules.reports.router import router as reports_router
from app.modules.users.router import router as users_router
from app.modules.workflow_templates.router import router as workflow_templates_router
from app.modules.automations.router import router as automations_router
from app.modules.agent.router import router as agent_router
from app.scheduler import setup_scheduler, scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_scheduler()
    try:
        yield
    finally:
        try:
            if scheduler.running:
                scheduler.shutdown(wait=False)
        finally:
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
    app.include_router(tenants_router)
    app.include_router(contracts_router)
    app.include_router(expenses_router)
    app.include_router(posts_router)
    app.include_router(notifications_router)
    app.include_router(reports_router)
    app.include_router(conversations_router)
    app.include_router(webhooks_router)
    app.include_router(dashboard_router)
    app.include_router(workflow_templates_router)
    app.include_router(automations_router)
    app.include_router(agent_router)

    return app


app = create_app()
