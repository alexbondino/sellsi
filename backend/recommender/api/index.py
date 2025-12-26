"""
Vercel Serverless Function Entry Point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
import os
import sys

# Add app directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.api.routes import router
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Sellsi Backend API",
    description="Backend services for Sellsi Marketplace - Recommendations, ML models, and more",
    version="1.0.0"
)

# CORS
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in allowed_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(router, prefix="/api/v1")

@app.get("/")
async def root():
    return {
        "message": "Sellsi Backend API",
        "version": "1.0.0",
        "services": ["recommendations"],
        "docs": "/docs"
    }

# Mangum handler for Vercel
handler = Mangum(app)
