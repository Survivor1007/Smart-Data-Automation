from fastapi import HTTPException, Depends, APIRouter
from sqlalchemy.orm import Session
from fastapi.responses import FileResponse
import os

from app.db.models.processing_job import ProcessingJob, JobStatus
from app.dependencies import get_db

router = APIRouter(prefix="/export", tags=["export"])

@router.get("/{job_id}")
def download_cleaned_file(
      job_id:int, 
      db:Session = Depends(get_db)
):
      job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()

      if not job:
            raise HTTPException(status_code=404, detail="Job not found")
      
      if job.status != JobStatus.COMPLETED:
            raise HTTPException(status_code=400, detail="Job not completed yet")
      
      if not job.result_path or not os.path.exists(job.result_path):
            raise HTTPException(status_code=404, detail="Cleaned File not found on server")
      
      original_name = os.path.basename(job.result_path)

      cleaned_name = original_name
      #return as file response
      return FileResponse(
            path=job.result_path,
            filename=cleaned_name,
            media_type="text/csv" if job.result_path.endswith(".csv") else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      )