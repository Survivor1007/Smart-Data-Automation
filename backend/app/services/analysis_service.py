import pandas as pd
import os
from typing import Dict, Optional, Any
from datetime import datetime,timezone
from app.dependencies import get_db_for_task
from app.db.models.dataset import Datasets
from sqlalchemy.orm import Session
from fastapi import Depends

def generate_analysis_report(file_path:str) -> Dict[str, Any]:
      """
      Reads file and computes summary statistics
      Returns a dict ready to be stored as JSONB.
      """
      try:
            if file_path.lower().endswith(".csv"):
                  df = pd.read_csv(file_path)
            else:
                  df = pd.read_excel(file_path, engine= "openpyxl")
            
            # print("DataFrame shape after read:", df.shape)
            # print("Columns detected:", df.columns.tolist())
            
            report:Dict[str, Any] = {
                  "shape":{"rows":len(df), "columns":len(df.columns)},
                  "columns":list(df.columns),
                  "dtypes":df.dtypes.astype(str).to_dict(),
                  "missing":{
                        "counts": df.isna().sum().astype(int).to_dict(),
                        "percentage":(df.isna().sum() / len(df) * 100).round(2).astype(float).to_dict()
                  },
                  "duplicates":{
                        "count":int(df.duplicated().sum()),
                        "percentage":round(df.duplicated().sum() / len(df) * 100, 2) if len(df) > 0 else 0.0
                  },
                  "numeric_stats":{},
                  "categorial_top_values": {}
            }
            
            #Numeric Column stats
            num_cols = df.select_dtypes(include=["number"]).columns
            if len(num_cols) > 0:
                  report["numeric_stats"] = df[num_cols].describe().round(2).to_dict()
            
            #Categorial / object columns: top 5 values 
            cat_cols = df.select_dtypes(include=["object", "category"]).columns
            for col in cat_cols:
                  top  = df[col].value_counts().head(5).to_dict()
                  if top:
                        report["categorial_top_values"][col] = {
                              "top_values": top,
                              "unique_count":int(df[col].nunique())
                        }

            return report
      except Exception as e:
            raise Exception(f"Analysis failed: {str(e)}")
      
def run_analysis_and_save(dataset_id:int, file_path:str) -> None:
      """Run analysis and update dataset records"""

      report = generate_analysis_report(file_path=file_path)

      with get_db_for_task() as db_session:
            dataset = db_session.query(Datasets).filter(Datasets.id == dataset_id).first()
            if not dataset:
                  raise ValueError(f"Dataset {dataset_id} not found")
            
            dataset.analysis_report = report
            dataset.analyzed_at = datetime.now(timezone.utc)
            dataset.row_count = report["shape"]["rows"]
            dataset.col_count = report["shape"]["columns"]

            db_session.commit()

