"""
Recommender Service
Orquesta las diferentes estrategias de recomendación
"""
from typing import List, Dict, Any, Optional
from app.models.random_recommender import RandomRecommender
from app.utils.database import fetch_products, fetch_product_by_id


class RecommenderService:
    """Servicio principal de recomendaciones"""
    
    def __init__(self):
        # MVP: Solo estrategia random
        self.strategies = {
            "random": RandomRecommender()
        }
        self.active_strategy = "random"
        
    def get_available_strategies(self) -> List[str]:
        """Retorna las estrategias disponibles"""
        return list(self.strategies.keys())
    
    def get_active_strategy(self) -> str:
        """Retorna la estrategia activa"""
        return self.active_strategy
    
    def set_strategy(self, strategy_name: str):
        """Cambia la estrategia activa"""
        if strategy_name not in self.strategies:
            raise ValueError(f"Strategy '{strategy_name}' not found")
        self.active_strategy = strategy_name
    
    async def get_recommendations(
        self,
        user_id: Optional[str] = None,
        category: Optional[str] = None,
        limit: int = 6,
        exclude_ids: List[str] = None
    ) -> List[Dict[str, Any]]:
        """Obtiene recomendaciones generales desde Supabase"""
        products = await fetch_products(
            category=category, 
            min_stock=1,  # Solo productos con stock
            exclude_ids=exclude_ids
        )
        
        strategy = self.strategies[self.active_strategy]
        return strategy.recommend(products, limit=limit)
    
    async def get_similar_products(
        self,
        product_id: str,
        limit: int = 6
    ) -> List[Dict[str, Any]]:
        """Obtiene productos similares desde Supabase"""
        # Buscar el producto base
        base_product = await fetch_product_by_id(product_id)
        
        if not base_product:
            raise ValueError(f"Product {product_id} not found")
        
        # Obtener productos de la misma categoría
        similar_products = await fetch_products(
            category=base_product["category"],
            min_stock=1,
            exclude_ids=[product_id]
        )
        
        strategy = self.strategies[self.active_strategy]
        return strategy.recommend(similar_products, limit=limit)
    
    async def get_personalized_recommendations(
        self,
        user_id: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Obtiene recomendaciones personalizadas"""
        # MVP: Por ahora retorna productos aleatorios desde Supabase
        # TODO: Implementar basado en historial del usuario
        products = await fetch_products(min_stock=1)
        
        strategy = self.strategies[self.active_strategy]
        return strategy.recommend(products, limit=limit)
    
    async def get_trending_products(
        self,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Obtiene productos en tendencia"""
        # MVP: Por ahora retorna productos aleatorios desde Supabase
        # TODO: Implementar basado en métricas reales
        products = await fetch_products(min_stock=1)
        
        strategy = self.strategies[self.active_strategy]
        return strategy.recommend(products, limit=limit)


# Singleton instance
recommender_service = RecommenderService()
