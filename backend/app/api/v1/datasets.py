import os
import uuid
import shutil
from fastapi import UploadFile, APIRouter, File, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime,timezone
from app.services.analysis_service import run_analysis_and_save
from app.dependencies import get_db
from app.db.models.dataset import Datasets
from app.schemas.dataset import DatasetOut, DatasetPreview
from app.db.models.processing_job import ProcessingJob, JobStatus
import pandas as pd

router = APIRouter(prefix="/datasets", tags=["datasets"])

UPLOAD_DIR="uploads/raw_uploads"

@router.post("/upload", response_model=DatasetOut)
async def upload_dataset(
      background_tasks: BackgroundTasks,
      file:UploadFile = File(...),
      db:Session = Depends(get_db)
      ):
      if not file.filename.lower().endswith((".csv", ".xlsx", ".xls")):
            raise HTTPException(
                  status_code=400,
                  detail="Only CSV and Excel files are allowed"
            )
      
      os.makedirs(UPLOAD_DIR, exist_ok=True)
      file_path = os.path.join(UPLOAD_DIR, file.filename)
      if os.path.exists(file_path):
            
            name, ext = os.path.splitext(file.filename)
            file.filename = f"{name}_{uuid.uuid4().hex[:8]}.{ext}"
            file_path = os.path.join(UPLOAD_DIR, file.filename)

      #Saving the file
      with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
      
      file_size = os.path.getsize(file_path)
      mime_type = file.content_type

      db_dataset = Datasets(
            filename=file.filename,
            original_path = file_path,
            file_size_byte = file_size,
            mime_type=mime_type,
            uploaded_at = datetime.now(timezone.utc)
      )

      db.add(db_dataset)
      db.commit()
      db.refresh(db_dataset)

      upload_job = ProcessingJob(
            dataset_id = db_dataset.id,
            status=JobStatus.COMPLETED,
            operation_type="upload",
            parameters={"original_filename":file.filename},
            result_path=file_path,
            started_at=datetime.now(timezone.utc),
            completed_at=datetime.now(timezone.utc)
      )

      db.add(upload_job)
      db.commit()
      # try:
      #       run_analysis_and_save(db_dataset.id, file_path,db)
      #       db.refresh(db_dataset)
      # except Exception as e:
      #       print(f"Auto analysis failed:{str(e)}")
      
      background_tasks.add_task(
            run_analysis_and_save,
            dataset_id = db_dataset.id,
            file_path=file_path,
      )

      return db_dataset

@router.get("/{dataset_id}", response_model = DatasetOut)
def get_data(dataset_id:int,
      db:Session = Depends(get_db)):

      dataset = db.query(Datasets).filter(Datasets.id == dataset_id).first()
      if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")
      return dataset

@router.get("/", response_model=List[DatasetOut])
def list_datasets(skip:int = 0, limit:int = 20, db:Session = Depends(get_db)):
      datasets = db.query(Datasets).offset(skip).limit(limit).all()
      return datasets

@router.get("/{dataset_id}/preview", response_model=DatasetPreview)
def get_dataset_preview(dataset_id:int, rows:int = 20, db:Session = Depends(get_db)):
      dataset = db.query(Datasets).filter(Datasets.id == dataset_id).first()
      if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")
      
      file_path = dataset.original_path
      if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Original File no longer available")
      
      try:
            if file_path.lower().endswith(".csv"):
                  df = pd.read_csv(file_path, nrows = rows + 1)
            else:
                  df  =pd.read_excel(file_path, nrows = rows + 1, engine="openpyxl")
            
            preview_rows = df.head(rows).to_dict(orient="records")

            return DatasetPreview(
                  columns=list(df.columns),
                  dtypes=[str(dtype) for dtype in df.dtypes],
                  sample_rows=preview_rows,
                  total_rows=len(df) if len(df) >= rows else None,
            )
      
      except Exception as e:
            raise HTTPException(
                  status_code=500,
                  detail=f"Error reading file: {str(e)}"
            )
      

@router.post("/{dataset_id}/analyze", response_model=DatasetOut)
def analyze_dataset(dataset_id:int, db:Session = Depends(get_db)):
      dataset = db.query(Datasets).filter(Datasets.id == dataset_id).first()
      if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")
      
      if not dataset.original_path or not os.path.exists(dataset.original_path):
            raise HTTPException(status_code=404, detail="Original File missing")
      
      try:
            run_analysis_and_save(dataset_id, dataset.original_path, db)
            db.refresh(dataset)
            return dataset
      except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to analyze: {str(e)}")

@router.get("/{dataset_id}/analysis")
def get_analysis(dataset_id:int, db:Session = Depends(get_db)):
      dataset = db.query(Datasets).filter(Datasets.id == dataset_id).first()
      if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")
      
      if not dataset.original_path or not os.path.exists(dataset.original_path):
            raise HTTPException(status_code=404, detail="Original File missing")

      return {
            "dataset_id":dataset.id,
            "filename":dataset.filename,
            "analyzed_at":dataset.analyzed_at,
            "report":dataset.analysis_report
      }
      
