from fastapi import Depends 
from sqlalchemy.orm import Session
from contextlib import contextmanager
from app.db.session import SessionLocal

def get_db():
      db = SessionLocal()
      try:
            yield db
      finally:
            db.close()
      
@contextmanager
def get_db_for_task():
      db = SessionLocal()
      try:
            yield db
      finally:
            db.close()