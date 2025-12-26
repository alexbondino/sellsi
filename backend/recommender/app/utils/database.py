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


async def fetch_products(
    category: Optional[str] = None,
    min_stock: int = 0,
    exclude_ids: Optional[List[str]] = None,
    limit: Optional[int] = None
) -> List[Dict[str, Any]]:
    """
    Fetch products from Supabase
    
    Args:
        category: Filter by category
        min_stock: Minimum stock required
        exclude_ids: Product IDs to exclude
        limit: Maximum number of products to return
        
    Returns:
        List of products
    """
    client = get_supabase_client()
    
    # Start query with JOIN to product_images
    query = client.table("products").select("""
        productid,
        productnm,
        category,
        price,
        productqty,
        is_active,
        supplier_id,
        users!supplier_id(user_nm),
        product_images!product_id(image_url)
    """)
    
    # Filter by active products
    query = query.eq("is_active", True)
    
    # Filter by minimum stock
    if min_stock > 0:
        query = query.gte("productqty", min_stock)
    
    # Filter by category
    if category:
        query = query.eq("category", category)
    
    # Execute query
    response = query.execute()
    
    if not response.data:
        return []
    
    # Transform data to match expected format
    products = []
    for item in response.data:
        # Get first product image if available
        product_images = item.get("product_images", [])
        image_url = ""
        if product_images and len(product_images) > 0:
            image_url = product_images[0].get("image_url", "")
        
        product = {
            "id": str(item["productid"]),
            "name": item["productnm"],
            "category": item.get("category", "Sin categoría"),
            "price": float(item.get("price", 0)),
            "stock": item.get("productqty", 0),
            "image_url": image_url,
            "active": item.get("is_active", True),
            "provider_id": item.get("supplier_id", ""),
            "provider_name": item.get("users", {}).get("user_nm", "Desconocido") if item.get("users") else "Desconocido"
        }
        
        # Exclude specific IDs
        if exclude_ids and product["id"] in exclude_ids:
            continue
            
        products.append(product)
    
    # Limit results if specified
    if limit and len(products) > limit:
        products = products[:limit]
    
    return products


async def fetch_product_by_id(product_id: str) -> Optional[Dict[str, Any]]:
    """
    Fetch a single product by ID
    
    Args:
        product_id: Product ID
        
    Returns:
        Product data or None if not found
    """
    client = get_supabase_client()
    
    response = client.table("products").select("""
        productid,
        productnm,
        category,
        price,
        productqty,
        is_active,
        supplier_id,
        users!supplier_id(user_nm),
        product_images!product_id(image_url)
    """).eq("productid", product_id).execute()
    
    if not response.data or len(response.data) == 0:
        return None
    
    item = response.data[0]
    
    # Get first product image if available
    product_images = item.get("product_images", [])
    image_url = ""
    if product_images and len(product_images) > 0:
        image_url = product_images[0].get("image_url", "")
    
    return {
        "id": str(item["productid"]),
        "name": item["productnm"],
        "category": item.get("category", "Sin categoría"),
        "price": float(item.get("price", 0)),
        "stock": item.get("productqty", 0),
        "image_url": image_url,
        "active": item.get("is_active", True),
        "provider_id": item.get("supplier_id", ""),
        "provider_name": item.get("users", {}).get("user_nm", "Desconocido") if item.get("users") else "Desconocido"
    }


async def fetch_user_interactions(user_id: str) -> List[Dict[str, Any]]:
    """
    Fetch user interactions for personalized recommendations
    TODO: Implement when user_interactions table is created
    
    Args:
        user_id: User ID
        
    Returns:
        List of user interactions
    """
    # Placeholder for future implementation
    return []
