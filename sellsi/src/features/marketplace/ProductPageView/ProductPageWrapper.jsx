import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Paper, 
  Breadcrumbs, 
  Link 
} from '@mui/material';
import { 
  ArrowBack, 
  Home, 
  StorefrontOutlined, 
  Inventory2Outlined 
} from '@mui/icons-material';
import ProductPageView from './ProductPageView';
import { supabase } from '../../../services/supabase';

const ProductPageWrapper = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Detectar de dónde viene el usuario
  const fromMyProducts = location.state?.from === '/supplier/myproducts';
  const isFromBuyer = location.state?.from === '/buyer/marketplace';

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
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
            users!products_supplier_id_fkey (
              user_nm,
              logo_url
            )
          `)
          .eq('productid', id)
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
            rating: 4.5, // Default rating
            ventas: Math.floor(Math.random() * 100), // Mock ventas
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
  }, [id]);

  const handleClose = () => {
    if (fromMyProducts) {
      navigate('/supplier/myproducts');
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
    } else if (isFromBuyer) {
      navigate('/buyer/marketplace');
    } else {
      navigate('/marketplace');
    }
  };

  const handleAddToCart = (cartProduct) => {
    // Aquí podrías implementar la lógica del carrito
    console.log('Add to cart:', cartProduct);
  };

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            Producto no encontrado
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {error}
          </Typography>
          <Button
            variant="contained"
            startIcon={<StorefrontOutlined />}
            onClick={handleGoToMarketplace}
          >
            {fromMyProducts ? 'Volver a Mis Productos' : 'Volver al Marketplace'}
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Header with navigation */}
      <Box
        sx={{
          bgcolor: 'white',
          borderBottom: '1px solid',
          borderColor: 'grey.200',
          py: 2,
        }}
      >
        <Container maxWidth="xl">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            {/* Back button */}
            <Button
              startIcon={<ArrowBack />}
              onClick={handleClose}
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  bgcolor: 'grey.100',
                },
              }}
            >
              {fromMyProducts ? 'Volver a Mis Productos' : 'Volver al Marketplace'}
            </Button>
          </Box>

          {/* Breadcrumbs */}
          <Breadcrumbs
            sx={{
              fontSize: '0.875rem',
              color: 'text.secondary',
            }}
          >
            <Link
              underline="hover"
              color="inherit"
              onClick={handleGoHome}
              sx={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <Home fontSize="small" />
              Inicio
            </Link>
            <Link
              underline="hover"
              color="inherit"
              onClick={handleGoToMarketplace}
              sx={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              {fromMyProducts ? <Inventory2Outlined fontSize="small" /> : <StorefrontOutlined fontSize="small" />}
              {fromMyProducts ? 'Mis Productos' : 'Marketplace'}
            </Link>
            {product && (
              <Typography color="primary" sx={{ fontWeight: 600 }}>
                {product.nombre}
              </Typography>
            )}
          </Breadcrumbs>
        </Container>
      </Box>

      {/* Product Page View */}
      <Box sx={{ pt: 0 }}>
        <ProductPageView
          product={product}
          onClose={handleClose}
          onAddToCart={handleAddToCart}
          isPageView={true}
          loading={loading}
        />
      </Box>
    </Box>
  );
};

export default ProductPageWrapper;
