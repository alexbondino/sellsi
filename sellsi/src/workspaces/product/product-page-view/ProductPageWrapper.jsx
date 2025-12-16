import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Box, Container, Typography, Button, Paper } from '@mui/material';
import { StorefrontOutlined } from '@mui/icons-material';
import ProductPageView from './ProductPageView';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../infrastructure/providers';
import useCartStore from '../../../shared/stores/cart/cartStore';
import { extractProductIdFromSlug } from '../../../shared/utils/product/productUrl';
import { convertDbRegionsToForm } from '../../../utils/shippingRegionsUtils';

const ProductPageWrapper = ({ isLoggedIn }) => {
  const { session, currentAppRole } = useAuth();

  let isSupplier = false;
  const effectiveRole =
    currentAppRole ||
    (typeof window !== 'undefined' && window.currentAppRole) ||
    null;
  if (effectiveRole) {
    isSupplier = effectiveRole === 'supplier';
  }

  const { id, productSlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const addToCart = useCartStore(state => state.addItem);

  const fromValue = location.state?.from;
  const fromMyProducts = fromValue === '/supplier/myproducts';
  const isFromBuyer = fromValue === '/buyer/marketplace';
  const isFromSupplierMarketplace =
    !fromMyProducts && fromValue === '/supplier/marketplace';

  const didFetchRef = useRef(null);
  const lastProductIdRef = useRef(null);
  const lastFetchTsRef = useRef(0);
  const FETCH_TTL = 2500; // ms (suficiente para StrictMode remount y navegación inmediata)

  useEffect(() => {
    const fetchProduct = async () => {
      // Accept id or slug in either param; always extract UUID safely
      const candidate = id || productSlug;
      const productId = extractProductIdFromSlug(candidate);
      if (!productId) {
        setError('ID de producto no válido');
        setLoading(false);
        return;
      }
      // Guard contra remount StrictMode / re-ejecución inmediata con mismo productId
      const now = Date.now();
      if (
        didFetchRef.current &&
        lastProductIdRef.current === productId &&
        now - lastFetchTsRef.current < FETCH_TTL
      ) {
        return; // saltar fetch redundante
      }
      try {
        didFetchRef.current = true;
        lastProductIdRef.current = productId;
        lastFetchTsRef.current = now;
        setLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select(
            `*, product_images (*), product_quantity_ranges (*), product_delivery_regions (*), users!products_supplier_id_fkey (user_nm, logo_url, verified, minimum_purchase_amount) `
          )
          .eq('productid', productId)
          .eq('is_active', true)
          .single();
        if (error) {
          setError('Producto no encontrado');
        } else {
          const orderedImages = (data.product_images || [])
            .slice()
            .sort((a, b) => (a?.image_order || 0) - (b?.image_order || 0));
          const mainImageRecord =
            orderedImages.find(img => img && img.image_order === 0) ||
            orderedImages[0] ||
            null;
          setProduct({
            id: data.productid,
            productid: data.productid,
            supplier_id: data.supplier_id,
            nombre: data.productnm,
            imagen:
              (mainImageRecord && mainImageRecord.image_url) ||
              '/placeholder-product.jpg',
            thumbnail_url:
              (mainImageRecord && mainImageRecord.thumbnail_url) || null,
            precio: data.price,
            stock: data.productqty,
            categoria: data.category,
            descripcion: data.description,
            compraMinima: data.minimum_purchase,
            negociable: data.negotiable,
            tipo: data.product_type,
            activo: data.is_active,
            proveedor: data.users?.user_nm || 'Proveedor',
            logo_url: data.users?.logo_url || null,
            proveedorVerificado: data.users?.verified || false,
            verified: data.users?.verified || false,
            minimum_purchase_amount: data.users?.minimum_purchase_amount || 0,
            priceTiers: data.product_quantity_ranges || [],
            imagenes: orderedImages,
            images: orderedImages,
            shippingRegions: convertDbRegionsToForm(
              data.product_delivery_regions || []
            ),
            delivery_regions: data.product_delivery_regions || [],
            shipping_regions: data.product_delivery_regions || [],
            product_delivery_regions: data.product_delivery_regions || [],
            // ✅ FREE SHIPPING: Propagar campos de despacho gratuito
            free_shipping_enabled: data.free_shipping_enabled || false,
            free_shipping_min_quantity: data.free_shipping_min_quantity || null,
            freeShippingEnabled: data.free_shipping_enabled || false,
            freeShippingMinQuantity: data.free_shipping_min_quantity || null,
            createdAt: data.createddt || data.created_at || null,
            updatedAt: data.updateddt || data.updated_at || null,
            rating: 4.5,
            ventas: Math.floor(Math.random() * 100),
            fromMyProducts,
            isFromSupplierMarketplace,
            isSupplier,
          });
        }
      } catch (e) {
        setError('Error al cargar el producto');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, productSlug, fromMyProducts, isFromSupplierMarketplace, isSupplier]);

  const productWithContext = useMemo(() => {
    if (!product) return product;
    return {
      ...product,
      fromMyProducts,
      isFromSupplierMarketplace,
      isSupplier,
    };
  }, [product, fromMyProducts, isFromSupplierMarketplace, isSupplier]);

  const handleClose = () => {
    if (fromMyProducts) navigate('/supplier/myproducts');
    else if (isFromSupplierMarketplace) navigate('/supplier/marketplace');
    else if (isFromBuyer) navigate('/buyer/marketplace');
    else navigate('/marketplace');
  };
  const handleGoHome = () => {
    if (!session) return navigate('/');
    if (currentAppRole === 'supplier') return navigate('/supplier/home');
    return navigate('/buyer/marketplace');
  };
  const handleGoToMarketplace = () => handleClose();

  const handleAddToCart = cartProduct => {
    let productToAdd = { ...cartProduct };
    if (!productToAdd.quantity) productToAdd.quantity = 1;
    else {
      const q = parseInt(productToAdd.quantity);
      if (isNaN(q) || q <= 0 || q > 15000) return;
      productToAdd.quantity = Math.max(1, Math.min(q, 15000));
    }
    if (addToCart && productToAdd)
      addToCart(productToAdd, productToAdd.quantity);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <Box sx={{ pt: 0 }}>
        {loading ? (
          // 🆕 Mostrar loading mientras carga
          <Container maxWidth="md" sx={{ py: 4 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '50vh',
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                  Cargando producto...
                </Typography>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    border: '3px solid #f3f3f3',
                    borderTop: '3px solid #2E52B2',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    mx: 'auto',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' },
                    },
                  }}
                />
              </Box>
            </Box>
          </Container>
        ) : error || !product ? (
          // 🆕 Solo mostrar error después de terminar de cargar
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
                  : 'Volver al Marketplace'}
              </Button>
            </Paper>
          </Container>
        ) : (
          <ProductPageView
            product={productWithContext}
            onClose={handleClose}
            onAddToCart={handleAddToCart}
            isPageView={true}
            loading={loading}
            isLoggedIn={isLoggedIn}
            fromMyProducts={fromMyProducts}
            isFromSupplierMarketplace={isFromSupplierMarketplace}
            isSupplier={isSupplier}
            onGoHome={handleGoHome}
            onGoToMarketplace={handleGoToMarketplace}
          />
        )}
      </Box>
    </Box>
  );
};

export default ProductPageWrapper;
