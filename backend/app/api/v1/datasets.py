import os
import shutil
from fastapi import UploadFile, APIRouter, File, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime,timezone

from app.dependencies import get_db
from app.db.models.dataset import Datasets
from app.schemas.dataset import DatasetOut, DatasetPreview
import pandas as pd

router = APIRouter(prefix="/datasets", tags=["datasets"])

UPLOAD_DIR="uploads/raw_uploads"

@router.post("/upload", response_model=DatasetOut)
async def upload_dataset(
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
            raise HTTPException(status_code=500, detail="File not found on disk")
      
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