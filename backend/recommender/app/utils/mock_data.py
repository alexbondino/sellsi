"""
Mock Data para desarrollo local
Simula productos de Supabase sin necesidad de conexión
"""
from typing import List, Dict, Any, Optional


# Mock products para testing
MOCK_PRODUCTS = [
    {
        "id": "prod-001",
        "name": "Laptop Dell XPS 13",
        "category": "Electrónica",
        "price": 1299.99,
        "stock": 15,
        "image_url": "https://via.placeholder.com/300x200?text=Laptop",
        "provider_id": "provider-001",
        "provider_name": "TechStore",
        "active": True
    },
    {
        "id": "prod-002",
        "name": "Mouse Logitech MX Master 3",
        "category": "Accesorios",
        "price": 99.99,
        "stock": 50,
        "image_url": "https://via.placeholder.com/300x200?text=Mouse",
        "provider_id": "provider-001",
        "provider_name": "TechStore",
        "active": True
    },
    {
        "id": "prod-003",
        "name": "Teclado Mecánico Keychron K2",
        "category": "Accesorios",
        "price": 89.99,
        "stock": 30,
        "image_url": "https://via.placeholder.com/300x200?text=Keyboard",
        "provider_id": "provider-002",
        "provider_name": "GamingPro",
        "active": True
    },
    {
        "id": "prod-004",
        "name": "Monitor LG UltraWide 34'",
        "category": "Electrónica",
        "price": 599.99,
        "stock": 8,
        "image_url": "https://via.placeholder.com/300x200?text=Monitor",
        "provider_id": "provider-002",
        "provider_name": "GamingPro",
        "active": True
    },
    {
        "id": "prod-005",
        "name": "Audífonos Sony WH-1000XM4",
        "category": "Audio",
        "price": 349.99,
        "stock": 20,
        "image_url": "https://via.placeholder.com/300x200?text=Headphones",
        "provider_id": "provider-003",
        "provider_name": "AudioMax",
        "active": True
    },
    {
        "id": "prod-006",
        "name": "Webcam Logitech C920",
        "category": "Accesorios",
        "price": 79.99,
        "stock": 40,
        "image_url": "https://via.placeholder.com/300x200?text=Webcam",
        "provider_id": "provider-001",
        "provider_name": "TechStore",
        "active": True
    },
    {
        "id": "prod-007",
        "name": "Silla Gamer DXRacer",
        "category": "Muebles",
        "price": 299.99,
        "stock": 12,
        "image_url": "https://via.placeholder.com/300x200?text=Chair",
        "provider_id": "provider-004",
        "provider_name": "OfficePro",
        "active": True
    },
    {
        "id": "prod-008",
        "name": "Escritorio Ajustable Electrónico",
        "category": "Muebles",
        "price": 499.99,
        "stock": 5,
        "image_url": "https://via.placeholder.com/300x200?text=Desk",
        "provider_id": "provider-004",
        "provider_name": "OfficePro",
        "active": True
    },
    {
        "id": "prod-009",
        "name": "iPhone 14 Pro",
        "category": "Electrónica",
        "price": 1099.99,
        "stock": 25,
        "image_url": "https://via.placeholder.com/300x200?text=iPhone",
        "provider_id": "provider-005",
        "provider_name": "MobileWorld",
        "active": True
    },
    {
        "id": "prod-010",
        "name": "iPad Air",
        "category": "Electrónica",
        "price": 599.99,
        "stock": 18,
        "image_url": "https://via.placeholder.com/300x200?text=iPad",
        "provider_id": "provider-005",
        "provider_name": "MobileWorld",
        "active": True
    },
    {
        "id": "prod-011",
        "name": "AirPods Pro 2",
        "category": "Audio",
        "price": 249.99,
        "stock": 60,
        "image_url": "https://via.placeholder.com/300x200?text=AirPods",
        "provider_id": "provider-005",
        "provider_name": "MobileWorld",
        "active": True
    },
    {
        "id": "prod-012",
        "name": "MacBook Pro 14'",
        "category": "Electrónica",
        "price": 1999.99,
        "stock": 10,
        "image_url": "https://via.placeholder.com/300x200?text=MacBook",
        "provider_id": "provider-001",
        "provider_name": "TechStore",
        "active": True
    },
]


def get_mock_products(
    category: Optional[str] = None,
    min_stock: int = 0,
    exclude_ids: Optional[List[str]] = None
) -> List[Dict[str, Any]]:
    """
    Retorna productos mock filtrados
    
    Args:
        category: Filtrar por categoría
        min_stock: Stock mínimo requerido
        exclude_ids: IDs de productos a excluir
        
    Returns:
        Lista de productos filtrados
    """
    products = MOCK_PRODUCTS.copy()
    
    # Filtrar por activos
    products = [p for p in products if p.get("active", True)]
    
    # Filtrar por stock
    if min_stock > 0:
        products = [p for p in products if p.get("stock", 0) >= min_stock]
    
    # Filtrar por categoría
    if category:
        products = [p for p in products if p.get("category") == category]
    
    # Excluir IDs específicos
    if exclude_ids:
        products = [p for p in products if p.get("id") not in exclude_ids]
    
    return products
