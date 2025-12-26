"""
Supabase Database Utilities
Handles all database connections and queries
"""
import os
from typing import List, Dict, Any, Optional
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Supabase client singleton
_supabase_client: Optional[Client] = None


def get_supabase_client() -> Client:
    """Get or create Supabase client instance"""
    global _supabase_client
    
    if _supabase_client is None:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_KEY")
        
        if not url or not key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment")
        
        _supabase_client = create_client(url, key)
    
    return _supabase_client


def fetch_products(
    active_only: bool = True,
    min_stock: int = 0,
    category: Optional[str] = None,
    exclude_ids: Optional[List[str]] = None,
    limit: Optional[int] = None
) -> List[Dict[str, Any]]:
    """
    Fetch products from Supabase with filters
    
    Args:
        active_only: Only return active products
        min_stock: Minimum stock quantity
        category: Filter by category name
        exclude_ids: List of product IDs to exclude
        limit: Maximum number of products to return
    
    Returns:
        List of product dictionaries
    """
    client = get_supabase_client()
    
    # Build query
    query = client.table("products").select("""
        *,
        users:userid (
            nombre_negocio,
            email
        )
    """)
    
    # Apply filters
    if active_only:
        query = query.eq("activo", True)
    
    if min_stock > 0:
        query = query.gte("stock", min_stock)
    
    if category:
        query = query.eq("categoria", category)
    
    if exclude_ids and len(exclude_ids) > 0:
        query = query.not_.in_("id", exclude_ids)
    
    if limit:
        query = query.limit(limit)
    
    # Execute query
    response = query.execute()
    
    return response.data if response.data else []


def fetch_user_interactions(
    user_id: Optional[str] = None,
    product_id: Optional[str] = None,
    interaction_type: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Fetch user interactions (for future ML features)
    
    Args:
        user_id: Filter by user ID
        product_id: Filter by product ID
        interaction_type: Type of interaction (view, purchase, favorite)
    
    Returns:
        List of interaction dictionaries
    """
    # TODO: Implement when user_interactions table exists
    # This is a placeholder for future collaborative filtering
    return []


def fetch_product_stats(product_id: str) -> Dict[str, Any]:
    """
    Fetch statistics for a product (for content-based recommendations)
    
    Args:
        product_id: Product ID
    
    Returns:
        Dictionary with product statistics
    """
    # TODO: Implement aggregated stats
    # Views, purchases, avg rating, etc.
    return {}
