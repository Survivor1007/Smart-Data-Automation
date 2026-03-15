from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel, Field

class DatasetCreate(BaseModel):
      filename:str
      original_path:str
      file_size_byte:int
      mime_type:Optional[str] = None

class DatasetOut(BaseModel):
      id:int
      filename:str
      original_path:str
      file_size_byte:int
      mime_type:Optional[str] 
      uploaded_at:datetime
      row_count:Optional[int]
      col_count:Optional[int]

      class Config:
            from_attributes = True # allows mapping form ORM objects

      
class DatasetPreview(BaseModel):
      columns:List[str]
      dtypes:List[str]
      sample_rows: List[dict[str, Any]]
      total_rows:Optional[int] = None
      