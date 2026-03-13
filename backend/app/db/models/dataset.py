from sqlalchemy import String, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class Datasets(Base):
      __tablename__ = "datasets"

      id:Mapped[int] = mapped_column(primary_key=True, index=True)
      filename:Mapped[str] = mapped_column(String(255), nullable=False, index=True)
      original_path:Mapped[str] = mapped_column(String(512), nullable=False)
      file_size_byte:Mapped[int] = mapped_column(default=None)
      row_count:Mapped[int | None] = mapped_column(default = None)
      row_count:Mapped[int | None] = mapped_column(default = None)
      mime_type:Mapped[str | None] = mapped_column(String(100))
      uploaded_at:Mapped[DateTime] = mapped_column(
            DateTime(timezone=True), server_default=func.now(), nullable = False
      )
      description:Mapped[str] = mapped_column(Text, nullable=True)


      # jobs: Mapped[list["ProcessingJob"]] = relationship(back_populates="dataset")