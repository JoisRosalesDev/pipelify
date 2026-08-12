import enum
from datetime import datetime
from typing import Optional, Any, List
from uuid import UUID, uuid4

from sqlalchemy import String, Text, Enum as SQLEnum, DateTime, ForeignKey, Integer, func
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

class Base(DeclarativeBase):
    pass

class ExecutionStatus(str, enum.Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class PipelineExecutionModel(Base):
    __tablename__ = "pipeline_executions"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    pipeline_id: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[ExecutionStatus] = mapped_column(
        SQLEnum(ExecutionStatus, name="execution_status_enum", create_type=False),
        default=ExecutionStatus.PENDING,
        nullable=False
    )
    dag_snapshot: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    error_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    finished_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    node_executions: Mapped[List["PipelineNodeExecutionModel"]] = relationship(
        back_populates="execution", cascade="all, delete-orphan"
    )

class PipelineNodeExecutionModel(Base):
    __tablename__ = "pipeline_node_executions"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    execution_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("pipeline_executions.id", ondelete="CASCADE"), nullable=False)
    node_id: Mapped[str] = mapped_column(String(64), nullable=False)
    node_type: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[ExecutionStatus] = mapped_column(
        SQLEnum(ExecutionStatus, name="execution_status_enum", create_type=False),
        default=ExecutionStatus.PENDING,
        nullable=False
    )
    attempt_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    input_data: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    output_data: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    finished_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    execution: Mapped["PipelineExecutionModel"] = relationship(back_populates="node_executions")
