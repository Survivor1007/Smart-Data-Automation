import os 
import pandas as pd
from app.dependencies import get_db_for_task
from app.db.models.processing_job import ProcessingJob, JobStatus
from app.db.models.dataset import Datasets
from datetime import  datetime, timezone

def run_cleaning_job(job_id:int, file_path:str):
      with get_db_for_task() as db:
            job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
            if not job:
                  return
      
            job.status = JobStatus.RUNNING
            job.started_at = datetime.now(timezone.utc)
            db.commit()

            try:
                  if file_path.lower().endswith(".csv"):
                        df = pd.read_csv(file_path)
                  else:
                        df = pd.read_excel(file_path, engine="openpyxl")
                  
                  operations = job.parameters.get("operations",[])
                  for op in operations:
                        # if op.get("type") == "remove_duplicates":
                        #       before = len(df)
                        #       df = df.drop_duplicates()
                        #       print(f"Removed {before - len(df)} duplicates")
                        op_type = op.get("type")

                        if op_type == "remove_duplicates":
                              df = df.drop_duplicates()
                        
                        elif op_type == "fill_missing":
                              strategy = op.get("strategy", "mean")
                              columns = op.get("columns", df.columns.tolist())
                        
                              for col in columns:
                                    if col not in df.columns:
                                          continue
                                    if strategy == "mean" and pd.api.types.is_numeric_dtype(df[col]):
                                          df[col] = df[col].fillna(df[col].mean())
                                    elif strategy == "median" and pd.api.types.is_numeric_dtype(df[col]):
                                          df[col] = df[col].fillna(df[col].median())
                                    elif strategy == "constant":
                                          value = op.get("value", 0)
                                          df[col] = df[col].fillna(value)
                                    elif strategy in ["ffill", "bfill"]:
                                          df[col] = df[col].fillna(method = strategy)
                        elif op_type == "drop_columns":
                              columns_to_drop = op.get("columns", [])
                              df = df.drop(columns=[c for c in columns_to_drop if c in df.columns])
                        elif op_type == "rename_column":
                              old_name = op.get("old_name")
                              new_name = op.get("new_name")
                              if old_name in df.columns and new_name:
                                    df = df.rename(columns = {old_name:new_name})
                  
                  #Versioning based on previous cleaning jobs
                  prev_clean_jobs = db.query(ProcessingJob).filter(
                        ProcessingJob.dataset_id == job.dataset_id,
                        ProcessingJob.operation_type == "clean",
                        ProcessingJob.status == JobStatus.COMPLETED,   
                        ProcessingJob.id < job_id    
                  ).count()

                  version = prev_clean_jobs + 1




                  base_name, ext = os.path.splitext(os.path.basename(file_path))
                  output_filename = f"{base_name}_cleaned_v{version}{ext}"
                  output_dir = "uploads/processed"
                  os.makedirs(output_dir, exist_ok=True)
                  output_path = os.path.join(output_dir, output_filename)

                  if ext == ".csv":
                        df.to_csv(output_path, index=False)
                  else:
                        df.to_excel(output_path, index=False, engine="openpyxl")
                  
                  #Update job
                  job.status= JobStatus.COMPLETED
                  job.result_path= output_path
                  job.completed_at=datetime.now(timezone.utc)
                  db.commit()

                  #Update dataset metadata
                  dataset = db.query(Datasets).filter(Datasets.id == job.dataset_id).first()
                  if dataset:
                        dataset.row_count = len(df)
                        dataset.col_count =len(df.columns)
                        dataset.analyzed_at = datetime.now(timezone.utc)
                        db.commit()
                  


            except Exception as e:
                  job.status=JobStatus.FAILED
                  job.error_message=str(e)
                  db.commit()
                  raise

                  
      

