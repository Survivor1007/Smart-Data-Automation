from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings

settings = get_settings()

app = FastAPI(
      title=settings.app_name,
      description="AI-powered Data Cleaning and Automation Platform",
      version="1.0.0.0",
      debug=settings.debug,
)

#For connecting to frontend
app.add_middleware(
      CORSMiddleware,
      allow_origins = ["http://localhost:5173","http://127.0.0.1:5173"],
      allow_credentials = True,
      allow_headers = ["*"],
      allow_methods = ["*"],
)

@app.get("/")
def read_root():
      return {
        "message": "🚀 Smart Data Automation Platform is running!",
        "docs": "/docs",
        "version": "1.0.0"
    }


@app.get("/health")
def health_check():
      return {"status": "healthy", "settings":settings.app_name}
