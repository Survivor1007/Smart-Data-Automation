from __future__ import annotations
from typing import TYPE_CHECKING

from sqlalchemy import String, Text, DateTime, func, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from datetime import datetime, timezone

if TYPE_CHECKING:
      from app.db.models.processing_job import ProcessingJob


class Datasets(Base):
      __tablename__ = "datasets"

      id:Mapped[int] = mapped_column(primary_key=True, index=True)
      filename:Mapped[str] = mapped_column(String(255), nullable=False, index=True)
      original_path:Mapped[str] = mapped_column(String(512), nullable=False)
      file_size_byte:Mapped[int] = mapped_column(default=None)
      row_count:Mapped[int | None] = mapped_column(default = None)
      col_count:Mapped[int | None] = mapped_column(default = None)
      mime_type:Mapped[str | None] = mapped_column(String(100))
      uploaded_at:Mapped[DateTime] = mapped_column(
            DateTime(timezone=True), server_default=func.now(), nullable = False
      )
      description:Mapped[str] = mapped_column(Text, nullable=True)
      analysis_report:Mapped[dict| None] = mapped_column(JSON, nullable=True)
      analyzed_at:Mapped[DateTime|None] = mapped_column(DateTime(timezone=True), nullable=True)


      jobs: Mapped[list["ProcessingJob"]] = relationship(back_populates="dataset",cascade="all, delete-orphan")