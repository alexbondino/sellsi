"""
Random Recommender Strategy (MVP)
Simple random sampling with filters
"""
import random
from typing import List, Dict, Any, Optional


class RandomRecommender:
    """
    Random recommendation strategy
    Randomly samples products from the available pool
    """
    
    def __init__(self):
        self.name = "random"
    
    def recommend(
        self,
        products: List[Dict[str, Any]],
        user_id: Optional[str] = None,
        limit: int = 6,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """
        Generate random recommendations
        
        Args:
            products: List of available products
            user_id: User ID (not used in random strategy)
            limit: Number of recommendations to return
            **kwargs: Additional parameters (not used)
        
        Returns:
            List of recommended products with scores
        """
        if not products or len(products) == 0:
            return []
        
        # Randomly sample products
        sample_size = min(limit, len(products))
        sampled = random.sample(products, sample_size)
        
        # Add recommendation score (random for MVP)
        for product in sampled:
            product['recommendation_score'] = round(random.uniform(0.5, 1.0), 2)
        
        # Sort by score (highest first)
        sampled.sort(key=lambda x: x['recommendation_score'], reverse=True)
        
        return sampled
