from fastapi import APIRouter
from . import datasets

api_router = APIRouter()

api_router.include_router(datasets.router)
