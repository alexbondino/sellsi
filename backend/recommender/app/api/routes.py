"""
API Routes for Recommendation Service
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List
from app.services.recommender_service import recommender_service

router = APIRouter()


# Pydantic Models
class RecommendationRequest(BaseModel):
    """Request model for recommendations"""
    user_id: Optional[str] = Field(None, description="User ID for personalized recommendations")
    product_id: Optional[str] = Field(None, description="Product ID for similar products")
    category: Optional[str] = Field(None, description="Filter by category")
    exclude_ids: List[str] = Field(default_factory=list, description="Product IDs to exclude")
    limit: int = Field(6, ge=1, le=50, description="Number of recommendations")
    strategy: Optional[str] = Field(None, description="Recommendation strategy")


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    service: str
    version: str


# Routes
@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "sellsi-backend-recommender",
        "version": "1.0.0"
    }


@router.get("/strategies")
async def get_strategies():
    """Get available recommendation strategies"""
    return {
        "strategies": recommender_service.get_available_strategies(),
        "default": recommender_service.default_strategy
    }


@router.post("/recommendations")
async def get_recommendations(request: RecommendationRequest):
    """
    Get product recommendations
    
    - **user_id**: Optional user ID for personalized recommendations
    - **product_id**: Optional product ID for similar products
    - **category**: Optional category filter
    - **exclude_ids**: List of product IDs to exclude
    - **limit**: Number of recommendations (1-50)
    - **strategy**: Recommendation strategy (random, collaborative, etc.)
    """
    try:
        result = recommender_service.get_recommendations(
            user_id=request.user_id,
            product_id=request.product_id,
            category=request.category,
            exclude_ids=request.exclude_ids,
            limit=request.limit,
            strategy=request.strategy
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recommendations/similar/{product_id}")
async def get_similar_products(
    product_id: str,
    limit: int = Query(4, ge=1, le=20, description="Number of similar products")
):
    """
    Get products similar to a specific product
    
    - **product_id**: ID of the product
    - **limit**: Number of similar products to return
    """
    try:
        result = recommender_service.get_similar_products(
            product_id=product_id,
            limit=limit
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recommendations/personalized/{user_id}")
async def get_personalized_recommendations(
    user_id: str,
    limit: int = Query(6, ge=1, le=50, description="Number of recommendations")
):
    """
    Get personalized recommendations for a user
    
    - **user_id**: ID of the user
    - **limit**: Number of recommendations to return
    """
    try:
        result = recommender_service.get_personalized_recommendations(
            user_id=user_id,
            limit=limit
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recommendations/trending")
async def get_trending_products(
    category: Optional[str] = Query(None, description="Filter by category"),
    limit: int = Query(6, ge=1, le=50, description="Number of trending products")
):
    """
    Get trending/popular products
    
    - **category**: Optional category filter
    - **limit**: Number of products to return
    """
    try:
        result = recommender_service.get_trending_products(
            category=category,
            limit=limit
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
