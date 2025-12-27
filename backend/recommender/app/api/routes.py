"""
API Routes
Endpoints para recomendaciones de productos
"""
from fastapi import APIRouter, HTTPException
from typing import Optional, List
from pydantic import BaseModel
from app.services.recommender_service import recommender_service

router = APIRouter()


class RecommendationRequest(BaseModel):
    """Request model para obtener recomendaciones"""
    user_id: Optional[str] = None
    category: Optional[str] = None
    limit: int = 6
    exclude_ids: Optional[List[str]] = None


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    service: str
    version: str


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Endpoint de salud del servicio"""
    return {
        "status": "healthy",
        "service": "sellsi-recommender",
        "version": "1.0.0"
    }


@router.get("/strategies")
async def list_strategies():
    """Lista las estrategias de recomendación disponibles"""
    return {
        "strategies": recommender_service.get_available_strategies(),
        "active": recommender_service.get_active_strategy()
    }


@router.post("/recommendations")
async def get_recommendations(request: RecommendationRequest):
    """
    Obtiene recomendaciones de productos
    MVP: Retorna productos en orden aleatorio
    """
    try:
        recommendations = await recommender_service.get_recommendations(
            user_id=request.user_id,
            category=request.category,
            limit=request.limit,
            exclude_ids=request.exclude_ids or []
        )
        
        return {
            "products": recommendations,
            "count": len(recommendations),
            "strategy": recommender_service.get_active_strategy()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/similar/{product_id}")
async def get_similar_products(
    product_id: str,
    limit: int = 6
):
    """
    Obtiene productos similares a uno dado
    MVP: Retorna productos aleatorios de la misma categoría
    """
    try:
        similar = await recommender_service.get_similar_products(
            product_id=product_id,
            limit=limit
        )
        
        return {
            "product_id": product_id,
            "similar_products": similar,
            "count": len(similar)
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Product not found: {str(e)}")


@router.get("/personalized/{user_id}")
async def get_personalized_recommendations(
    user_id: str,
    limit: int = 10
):
    """
    Obtiene recomendaciones personalizadas para un usuario
    MVP: Retorna productos aleatorios
    """
    try:
        personalized = await recommender_service.get_personalized_recommendations(
            user_id=user_id,
            limit=limit
        )
        
        return {
            "user_id": user_id,
            "recommendations": personalized,
            "count": len(personalized)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/trending")
async def get_trending_products(limit: int = 10):
    """
    Obtiene productos en tendencia
    MVP: Retorna productos aleatorios
    """
    try:
        trending = await recommender_service.get_trending_products(limit=limit)
        
        return {
            "trending_products": trending,
            "count": len(trending)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
