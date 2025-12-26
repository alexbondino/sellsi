"""
Recommender Service
Orquesta las diferentes estrategias de recomendación
"""
from typing import List, Dict, Any, Optional
from app.models.random_recommender import RandomRecommender
from app.utils.mock_data import get_mock_products


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
        """Obtiene recomendaciones generales"""
        products = get_mock_products(category=category, exclude_ids=exclude_ids)
        
        strategy = self.strategies[self.active_strategy]
        return strategy.recommend(products, limit=limit)
    
    async def get_similar_products(
        self,
        product_id: str,
        limit: int = 6
    ) -> List[Dict[str, Any]]:
        """Obtiene productos similares"""
        # Buscar el producto base
        all_products = get_mock_products()
        base_product = next((p for p in all_products if p["id"] == product_id), None)
        
        if not base_product:
            raise ValueError(f"Product {product_id} not found")
        
        # Filtrar por misma categoría y excluir el producto base
        similar_products = [
            p for p in all_products
            if p["category"] == base_product["category"] and p["id"] != product_id
        ]
        
        strategy = self.strategies[self.active_strategy]
        return strategy.recommend(similar_products, limit=limit)
    
    async def get_personalized_recommendations(
        self,
        user_id: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Obtiene recomendaciones personalizadas"""
        # MVP: Por ahora retorna productos aleatorios
        # TODO: Implementar basado en historial del usuario
        products = get_mock_products()
        
        strategy = self.strategies[self.active_strategy]
        return strategy.recommend(products, limit=limit)
    
    async def get_trending_products(
        self,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Obtiene productos en tendencia"""
        # MVP: Por ahora retorna productos aleatorios
        # TODO: Implementar basado en métricas reales
        products = get_mock_products()
        
        strategy = self.strategies[self.active_strategy]
        return strategy.recommend(products, limit=limit)


# Singleton instance
recommender_service = RecommenderService()
