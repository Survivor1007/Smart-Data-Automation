from datetime import datetime, timezone
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.db.models.processing_job import JobStatus

class ProcessingJobOut(BaseModel):
      id:int
      dataset_id:int
      status:JobStatus
      operation_type:str
      parameters:Optional[Dict[str, Any]] = None
      result_path:Optional[str] = None
      error_message:Optional[str] = None
      started_at:Optional[datetime] = None
      completed_at:Optional[datetime] = None
      created_at:Optional[datetime] = None

      class Config:
            from_attributes = True
