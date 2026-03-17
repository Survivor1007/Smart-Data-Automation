from fastapi import HTTPException, APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Any
import os
from datetime import datetime, timezone
from app.dependencies import get_db
from app.db.models.dataset import Datasets
from app.db.models.processing_job import ProcessingJob, JobStatus
from app.services.cleaning_service import run_cleaning_job
from pydantic import BaseModel
from app.schemas.cleaning import CleaningOperation

router = APIRouter(prefix="/clean", tags=["cleaning"])

# class CleaningOperation(BaseModel):
#       type:str
#       column:str|None = None
#       value:Any = None

@router.post("/{dataset_id}")
def queue_cleaning(
      dataset_id:int, 
      operations:List[CleaningOperation],
      background_tasks:BackgroundTasks,
      db:Session = Depends(get_db)
):
      dataset = db.query(Datasets).filter(Datasets.id == dataset_id).first()
      if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")
      if not dataset.original_path or not os.path.exists(dataset.original_path):
            raise HTTPException(status_code=404, detail="Original File not found")
      
      job = ProcessingJob(
            dataset_id = dataset_id,
            status=JobStatus.PENDING,
            operation_type="clean,",
            parameters={"operations":[op.model_dump() for op in operations]},
            created_at=datetime.now(timezone.utc)
      )

      db.add(job)
      db.commit()
      db.refresh(job)

      background_tasks.add_task(
            run_cleaning_job,
            job_id = job.id,
            file_path = dataset.original_path
      )

      return {
            "job_id":job.id,
            "status":"queued",
            "message":f"Cleaning job queued for dataset {dataset_id}"
      }