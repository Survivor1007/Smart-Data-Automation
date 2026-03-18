from fastapi import APIRouter
from . import datasets, cleaning,jobs, export

api_router = APIRouter()

api_router.include_router(datasets.router)
api_router.include_router(cleaning.router)
api_router.include_router(jobs.router)
api_router.include_router(export.router)
