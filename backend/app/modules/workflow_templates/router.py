from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import require_admin
from app.modules.workflow_templates.schemas import WorkflowTemplateResponse
from app.modules.workflow_templates.service import WorkflowTemplateService

router = APIRouter(prefix="/api/workflow-templates", tags=["workflow-templates"])


@router.get("", response_model=list[WorkflowTemplateResponse])
async def list_templates(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await WorkflowTemplateService(db).list_templates()


@router.post("/{template_id}/use", response_model=WorkflowTemplateResponse)
async def use_template(
    template_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    """Return template detail so the frontend can pre-fill the Create Automation form."""
    return await WorkflowTemplateService(db).get_template(template_id)
