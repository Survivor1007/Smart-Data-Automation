from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
      app_name: str = "Smart Data Automation Platform"
      debug:bool = True
      host: str = "0.0.0.0"
      port:int = 8000
      DATABASE_URL:str 

      model_config=SettingsConfigDict(
            env_file=".env",
            env_file_encoding="utf-8",
            case_sensitive=False
      )

      

      
      

@lru_cache()
def get_settings():
      return Settings()
