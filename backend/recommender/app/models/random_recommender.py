"""
Random Recommender - MVP Strategy
Randomiza el orden de los productos usando Fisher-Yates shuffle
"""
import random
from typing import List, Dict, Any


class RandomRecommender:
    """
    Estrategia de recomendación aleatoria
    MVP: Mezcla productos de forma aleatoria
    """
    
    def recommend(
        self,
        products: List[Dict[str, Any]],
        limit: int = 6
    ) -> List[Dict[str, Any]]:
        """
        Retorna productos en orden aleatorio
        
        Args:
            products: Lista de productos disponibles
            limit: Número máximo de productos a retornar
            
        Returns:
            Lista de productos randomizados
        """
        if not products:
            return []
        
        # Fisher-Yates shuffle para aleatorización eficiente
        shuffled = random.sample(products, min(len(products), limit))
        
        # Agregar score aleatorio para simular "confianza" del modelo
        for product in shuffled:
            product["recommendation_score"] = round(random.uniform(0.5, 1.0), 2)
        
        # Ordenar por score (de mayor a menor)
        shuffled.sort(key=lambda x: x.get("recommendation_score", 0), reverse=True)
        
        return shuffled
