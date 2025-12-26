"""
Vercel Serverless Function - Recommendations Endpoint
Handles: POST /api/v1/recommendations
"""
import os
import sys
from pathlib import Path

# Add recommender module to path
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path / "recommender"))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional

# Import desde recommender
from app.services.recommender_service import RecommenderService
from app.utils.database import fetch_products

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Ajustar en producción
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RecommendationRequest(BaseModel):
    limit: Optional[int] = 10
    user_id: Optional[str] = None

recommender_service = RecommenderService()

@app.post("/api/v1/recommendations")
async def get_recommendations(request: RecommendationRequest):
    """Get product recommendations"""
    try:
        products = await fetch_products(limit=request.limit)
        recommendations = recommender_service.get_recommendations(
            products=products,
            limit=request.limit
        )
        return JSONResponse(content=recommendations)
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

# Vercel handler
handler = app
