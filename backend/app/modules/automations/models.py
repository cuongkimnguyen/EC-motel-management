import uuid
from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Automation(Base):
    __tablename__ = "automations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    trigger_type = Column(String(20), nullable=False)   # schedule | event | condition
    frequency = Column(String(20))                       # daily | weekly | monthly | custom
    run_time = Column(String(10))                        # "08:00"
    module = Column(String(30), nullable=False)
    condition = Column(Text)
    action = Column(Text, nullable=False)
    notify_recipient = Column(String(255))
    notify_channel = Column(String(20))                  # in_app | email | sms | zalo
    status = Column(String(20), nullable=False, default="draft")
    is_enabled = Column(Boolean, nullable=False, default=True)
    last_run_at = Column(TIMESTAMP(timezone=True))
    next_run_at = Column(TIMESTAMP(timezone=True))
    run_count = Column(Integer, nullable=False, default=0)
    created_by = Column(UUID(as_uuid=True))
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    task_history = relationship("AgentTaskHistory", back_populates="automation", lazy="select")


class AgentTaskHistory(Base):
    __tablename__ = "agent_task_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    task_type = Column(String(30), nullable=False)       # ai_summary | automation | ai_generated | scan | digest
    trigger_source = Column(String(30), nullable=False)  # manual | automation | ai_suggestion | schedule
    status = Column(String(20), nullable=False)          # completed | running | failed | cancelled
    result_summary = Column(Text)
    module = Column(String(30), nullable=False)
    automation_id = Column(UUID(as_uuid=True), ForeignKey("automations.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)

    automation = relationship("Automation", back_populates="task_history", foreign_keys=[automation_id])
