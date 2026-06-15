import uuid
from sqlalchemy import Boolean, Column, String, Text, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.core.database import Base


class WorkflowTemplate(Base):
    __tablename__ = "workflow_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    trigger = Column(String(255), nullable=False)
    outcome = Column(String(255), nullable=False)
    module = Column(String(30), nullable=False)
    estimated_time = Column(String(50), nullable=False)
    is_builtin = Column(Boolean, nullable=False, default=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
