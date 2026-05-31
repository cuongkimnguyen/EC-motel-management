import uuid
from sqlalchemy import Column, String, Text, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from app.core.database import Base


class AgentConversation(Base):
    __tablename__ = "agent_conversations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(String(100), nullable=False, index=True)
    role = Column(String(20), nullable=False)            # user | assistant
    content = Column(Text, nullable=False)
    message_type = Column(String(30), nullable=False, default="text")
    related_module = Column(String(30))
    suggested_actions = Column(JSONB)
    list_items = Column(JSONB)
    user_id = Column(UUID(as_uuid=True))
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
