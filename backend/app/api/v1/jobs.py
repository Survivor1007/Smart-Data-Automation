from fastapi import HTTPException,Depends, APIRouter
from sqlalchemy.orm import Session
from app.dependencies import get_db
from typing import List
from app.db.models.processing_job import ProcessingJob, JobStatus
from app.schemas.job import ProcessingJobOut


router = APIRouter(prefix="/jobs", tags=["jobs"])

@router.get("/", response_model=List[ProcessingJobOut])
def list_jobs(
      skip:int = 0,
      limit:int = 20,
      status:JobStatus | None = None,
      db:Session = Depends(get_db)
):
      query = db.query(ProcessingJob)
      if status:
            query = query.filter(ProcessingJob.status == status)

      jobs = query.offset(skip).limit(limit).all()

      return jobs

      

@router.get("/{job_id}", response_model=ProcessingJobOut)
def get_job(
      job_id:int,
      db:Session = Depends(get_db)
):
      job =  db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
      if not job:
            raise HTTPException(status_code=404, detail="Job not found")
      return job
