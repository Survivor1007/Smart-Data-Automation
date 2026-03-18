from pydantic import BaseModel
from typing import List, Any, Optional

class CleaningOperation(BaseModel):
      type:str
      columns:Optional[List[str]] = None
      strategy:Optional[str] = None
      value:Optional[Any] = None
      old_name:Optional[str] = None
      new_name:Optional[str] = None
      case:Optional[str] = None
      old_value:Optional[Any] = None
      new_value:Optional[Any] = None
