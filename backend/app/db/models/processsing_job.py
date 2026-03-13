from enum import Enum as PyEnum
from sqlalchemy import String, Integer, Text, func, ForeignKey, DateTime, JSON
from sqlalchemy.orm import mapped_column, Mapped, relationship

from app.db.base import Base

class JobStatus(str, PyEnum):
      PENDING="pending"
      CANCELLED="cancelled"
      COMPLETED="completed"
      FAILED="failed"
      RUNNING="running"
      

class ProcessingJob(Base):
      __tablename__ = "processing_jobs"

      id: Mapped[int] = mapped_column(primary_key=True, index=True)
      dataset_id: Mapped[int] = mapped_column(
            ForeignKey("datasets.id", ondelete="CASCADE"),
            nullable=False,
            index=True
      )
      status: Mapped[JobStatus] = mapped_column(
            String(20), default=JobStatus.PENDING, nullable=False, index=True
      )
      operation_type: Mapped[str] = mapped_column(String(100), nullable=False)
      parameters: Mapped[dict | None] = mapped_column(JSON, nullable=True)
      result_path: Mapped[str | None] = mapped_column(String(512), nullable=True)
      error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
      started_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
      completed_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
      created_at: Mapped[DateTime] = mapped_column(
            DateTime(timezone=True), server_default=func.now(), nullable=False
      )


      # dataset: Mapped["Dataset"] = relationship(back_populates="jobs")