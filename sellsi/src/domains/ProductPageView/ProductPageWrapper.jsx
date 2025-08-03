import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Paper, 
  Breadcrumbs, 
  Link,
  CircularProgress
} from '@mui/material';
import { 
  ArrowBack, 
  Home, 
  StorefrontOutlined, 
  Inventory2Outlined 
} from '@mui/icons-material';
import ProductPageView from './ProductPageView';
import { supabase } from '../../services/supabase';
import useCartStore from '../../shared/stores/cart/cartStore';
import { extractProductIdFromSlug } from '../marketplace/utils/productUrl';
import { convertDbRegionsToForm } from '../../utils/shippingRegionsUtils';

const ProductPageWrapper = ({ isLoggedIn }) => {
  // Obtener el tipo de vista desde App.jsx vía window o prop global
  // window.currentAppRole debe ser seteado en App.jsx (temporal/hack) o pásalo por contexto/prop
  let isSupplier = false;
  if (window.currentAppRole) {
    isSupplier = window.currentAppRole === 'supplier';
  } else if (typeof currentAppRole !== 'undefined') {
    isSupplier = currentAppRole === 'supplier';
  }
  // ...logs eliminados...
  // Soportar tanto /marketplace/product/:id como /supplier/myproducts/product/:productSlug
  const { id, productSlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const addToCart = useCartStore(state => state.addItem);

  // Detectar de dónde viene el usuario
  const fromValue = location.state?.from;
  const fromMyProducts = fromValue === '/supplier/myproducts';
  const isFromBuyer = fromValue === '/buyer/marketplace';
  const isFromSupplierMarketplace = !fromMyProducts && fromValue === '/supplier/marketplace';

  // ...existing code...

  useEffect(() => {
    const fetchProduct = async () => {
      // Soportar ambos casos: id directo o productSlug (formato: uuid-nombre)
      let productId = id;
      if (!productId && productSlug) {
        productId = extractProductIdFromSlug(productSlug);
      }
      if (!productId) {
        setError('ID de producto no válido');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Buscar el producto en Supabase
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            product_images (*),
            product_quantity_ranges (*),
            product_delivery_regions (*),
            users!products_supplier_id_fkey (
              user_nm,
              logo_url
            )
          `)
          .eq('productid', productId)
          .eq('is_active', true)
          .single();

        if (error) {
          console.error('Error fetching product:', error);
          setError('Producto no encontrado');
        } else {
          // Transformar los datos al formato esperado por ProductPageView
          const product = {
            id: data.productid,
            productid: data.productid,
            supplier_id: data.supplier_id,
            nombre: data.productnm,
            imagen: data.product_images?.[0]?.image_url || '/placeholder-product.jpg',
            thumbnail_url: data.product_images?.[0]?.thumbnail_url || null, // ✅ NUEVO: Agregar thumbnail_url
            precio: data.price,
            stock: data.productqty,
            categoria: data.category,
            descripcion: data.description,
            compraMinima: data.minimum_purchase,
            negociable: data.negotiable,
            tipo: data.product_type,
            activo: data.is_active,
            proveedor: data.users?.user_nm || 'Proveedor',
            priceTiers: data.product_quantity_ranges || [],
            imagenes: data.product_images || [],
            // Regiones de despacho mapeadas al formato correcto
            shippingRegions: convertDbRegionsToForm(data.product_delivery_regions || []),
            delivery_regions: data.product_delivery_regions || [],
            shipping_regions: data.product_delivery_regions || [],
            product_delivery_regions: data.product_delivery_regions || [],
            rating: 4.5, // Default rating
            ventas: Math.floor(Math.random() * 100), // Mock ventas
            // Flags para controlar visibilidad de acciones de compra
            fromMyProducts,
            isFromSupplierMarketplace,
            isSupplier,
          };
          setProduct(product);
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Error al cargar el producto');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, productSlug]);

  const handleClose = () => {
    if (fromMyProducts) {
      navigate('/supplier/myproducts');
    } else if (isFromSupplierMarketplace) {
      navigate('/supplier/marketplace');
    } else if (isFromBuyer) {
      navigate('/buyer/marketplace');
    } else {
      navigate('/marketplace');
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoToMarketplace = () => {
    if (fromMyProducts) {
      navigate('/supplier/myproducts');
    } else if (isFromSupplierMarketplace) {
      navigate('/supplier/marketplace');
    } else if (isFromBuyer) {
      navigate('/buyer/marketplace');
    } else {
      navigate('/marketplace');
    }
  };

  const handleAddToCart = (cartProduct) => {
    // Si no viene cantidad, agregar 1 por defecto
    let productToAdd = { ...cartProduct };
    if (!productToAdd.quantity) {
      productToAdd.quantity = 1;
    } else {
      const quantity = parseInt(productToAdd.quantity);
      if (isNaN(quantity) || quantity <= 0 || quantity > 15000) {
        console.error('[Cart] Cantidad inválida detectada:', productToAdd.quantity);
        return;
      }
      productToAdd.quantity = Math.max(1, Math.min(quantity, 15000));
    }
    // Agregar al carrito real
    if (addToCart && productToAdd) {
      addToCart(productToAdd, productToAdd.quantity);
    } else {
      console.error('[Cart] addToCart function or productToAdd missing', { addToCart, productToAdd });
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Content area - Condicional según el estado (igual que TechnicalSpecs) */}
      <Box sx={{ pt: 0 }}>
        {loading ? (
          // Loading state
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '50vh',
            }}
          >
            <CircularProgress color="primary" size={48} />
          </Box>
        ) : error || !product ? (
          // Error state - Sin duplicar header ni breadcrumbs
          <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h5" color="error" gutterBottom>
                {error || 'Producto no encontrado'}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                El producto que buscas no existe o ha sido removido.
              </Typography>
              <Button
                variant="contained"
                startIcon={<StorefrontOutlined />}
                onClick={handleGoToMarketplace}
              >
                {fromMyProducts
                  ? 'Volver a Mis Productos'
                  : isFromSupplierMarketplace
                    ? 'Volver a Marketplace'
                    : 'Volver al Marketplace'}
              </Button>
            </Paper>
          </Container>
        ) : (
          // Product view - Sin duplicar header ni breadcrumbs
          <ProductPageView
            product={product}
            onClose={handleClose}
            onAddToCart={handleAddToCart}
            isPageView={true}
            loading={loading}
            isLoggedIn={isLoggedIn}
            fromMyProducts={fromMyProducts}
            isFromSupplierMarketplace={isFromSupplierMarketplace}
            isSupplier={isSupplier}
            // Pasar handlers para breadcrumbs
            onGoHome={handleGoHome}
            onGoToMarketplace={handleGoToMarketplace}
          />
        )}
      </Box>
    </Box>
  );
};

export default ProductPageWrapper;
