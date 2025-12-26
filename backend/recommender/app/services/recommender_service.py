"""
Recommender Service
Orchestrates different recommendation strategies
"""
from typing import List, Dict, Any, Optional
from app.models.random_recommender import RandomRecommender
from app.utils.database import fetch_products


class RecommenderService:
    """
    Main recommender service that coordinates different strategies
    """
    
    def __init__(self):
        # Initialize strategies
        self.strategies = {
            'random': RandomRecommender(),
            # Future strategies:
            # 'collaborative': CollaborativeFilterRecommender(),
            # 'content_based': ContentBasedRecommender(),
            # 'hybrid': HybridRecommender(),
        }
        self.default_strategy = 'random'
    
    def get_recommendations(
        self,
        user_id: Optional[str] = None,
        product_id: Optional[str] = None,
        category: Optional[str] = None,
        exclude_ids: Optional[List[str]] = None,
        limit: int = 6,
        strategy: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get product recommendations
        
        Args:
            user_id: User ID for personalized recommendations
            product_id: Product ID for similar products
            category: Filter by category
            exclude_ids: Products to exclude
            limit: Number of recommendations
            strategy: Recommendation strategy to use
        
        Returns:
            Dictionary with recommendations and metadata
        """
        # Select strategy
        strategy_name = strategy or self.default_strategy
        recommender = self.strategies.get(strategy_name)
        
        if not recommender:
            raise ValueError(f"Unknown strategy: {strategy_name}")
        
        # Fetch products from database
        products = fetch_products(
            active_only=True,
            min_stock=1,
            category=category,
            exclude_ids=exclude_ids or [],
            limit=None  # Get all matching products, then sample
        )
        
        # Generate recommendations
        recommendations = recommender.recommend(
            products=products,
            user_id=user_id,
            limit=limit
        )
        
        return {
            'recommendations': recommendations,
            'total': len(recommendations),
            'strategy': strategy_name,
            'filters': {
                'category': category,
                'exclude_ids': exclude_ids or [],
                'limit': limit
            }
        }
    
    def get_similar_products(
        self,
        product_id: str,
        limit: int = 4
    ) -> Dict[str, Any]:
        """
        Get products similar to a specific product
        
        Args:
            product_id: Product ID
            limit: Number of similar products
        
        Returns:
            Dictionary with similar products
        """
        # TODO: Implement content-based similarity
        # For now, use random from same category
        
        # Get the product to find its category
        products = fetch_products(limit=1000)  # Get all products
        target_product = next((p for p in products if p['id'] == product_id), None)
        
        if not target_product:
            return {
                'recommendations': [],
                'total': 0,
                'strategy': 'similar',
                'product_id': product_id
            }
        
        category = target_product.get('categoria')
        
        return self.get_recommendations(
            category=category,
            exclude_ids=[product_id],
            limit=limit,
            strategy='random'
        )
    
    def get_personalized_recommendations(
        self,
        user_id: str,
        limit: int = 6
    ) -> Dict[str, Any]:
        """
        Get personalized recommendations for a user
        
        Args:
            user_id: User ID
            limit: Number of recommendations
        
        Returns:
            Dictionary with personalized recommendations
        """
        # TODO: Implement collaborative filtering
        # For now, use random strategy
        
        return self.get_recommendations(
            user_id=user_id,
            limit=limit,
            strategy='random'
        )
    
    def get_trending_products(
        self,
        category: Optional[str] = None,
        limit: int = 6
    ) -> Dict[str, Any]:
        """
        Get trending/popular products
        
        Args:
            category: Filter by category
            limit: Number of products
        
        Returns:
            Dictionary with trending products
        """
        # TODO: Implement based on views/purchases
        # For now, use random strategy
        
        return self.get_recommendations(
            category=category,
            limit=limit,
            strategy='random'
        )
    
    def set_strategy(self, strategy_name: str):
        """Set the default strategy"""
        if strategy_name in self.strategies:
            self.default_strategy = strategy_name
        else:
            raise ValueError(f"Unknown strategy: {strategy_name}")
    
    def get_available_strategies(self) -> List[str]:
        """Get list of available strategies"""
        return list(self.strategies.keys())


# Global service instance
recommender_service = RecommenderService()
