import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Avatar,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Breadcrumbs,
  Link,
  TextField,
  InputAdornment,
  IconButton,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';
import {
  ArrowBack,
  Home,
  StorefrontOutlined,
  VerifiedUser,
  Business,
  Search as SearchIcon,
  Clear as ClearIcon,
  Category as CategoryIcon,
  Sort as SortIcon,
} from '@mui/icons-material';
import { ThemeProvider } from '@mui/material/styles';
import { dashboardThemeCore } from '../../styles/dashboardThemeCore';
import { SPACING_BOTTOM_MAIN } from '../../styles/layoutSpacing';
import { supabase } from '../../services/supabase';

import ProductCard from '../../shared/components/display/product-card/ProductCard';
import useCartStore from '../buyer/hooks/cartStore';
import { toast } from 'react-hot-toast';
import { filterActiveProducts } from '../../utils/productActiveStatus';
import { CATEGORIAS } from './CategoryNavigation/CategoryNavigation';

/**
 * ProviderCatalog - Catálogo de productos de un proveedor específico
 * Ruta: /catalog/:userNm/:userId
 */
const ProviderCatalog = () => {
  const { userNm, userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [provider, setProvider] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const addToCart = useCartStore(state => state.addItem);

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priceOrder, setPriceOrder] = useState('none'); // none, asc, desc
  const [filteredProducts, setFilteredProducts] = useState([]);
  // Usar las categorías estandarizadas
  const availableCategories = CATEGORIAS;

  // Determinar de dónde viene el usuario (para el botón de volver)
  const fromPath = location.state?.from || '/buyer/marketplace';
  const isFromBuyer = fromPath.includes('/buyer/');
  const isFromSupplier = fromPath.includes('/supplier/');

  // Obtener información del proveedor y sus productos
  useEffect(() => {
    const fetchProviderAndProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Obtener información del proveedor
        const { data: providerData, error: providerError } = await supabase
          .from('users')
          .select('user_id, user_nm, logo_url, main_supplier, descripcion_proveedor, verified')
          .eq('user_id', userId)
          .single();

        if (providerError) {
          throw new Error(`Error al obtener proveedor: ${providerError.message}`);
        }

        if (!providerData) {
          throw new Error('Proveedor no encontrado');
        }

        // 2. Obtener productos del proveedor
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select(`
            *,
            product_images (image_url)
          `)
          .eq('supplier_id', userId)
          .eq('is_active', true)
          .order('createddt', { ascending: false });

        if (productsError) {
          throw new Error(`Error al obtener productos: ${productsError.message}`);
        }

        // 3. Obtener quantity ranges (price tiers) por separado si es necesario
        let allQuantityRanges = [];
        if (productsData && productsData.length > 0) {
          const productIds = productsData.map(p => p.productid);
          const { data: quantityRangesData, error: quantityRangesError } = await supabase
            .from('product_quantity_ranges')
            .select('*')
            .in('product_id', productIds)
            .order('min_quantity', { ascending: true });

          if (!quantityRangesError) {
            allQuantityRanges = quantityRangesData || [];
          }
        }

        // 4. Formatear productos para compatibilidad
        const formattedProducts = (productsData || []).map(product => {
          const productQuantityRanges = allQuantityRanges.filter(range => range.product_id === product.productid);
          
          // Convertir quantity ranges a formato de price tiers para compatibilidad
          const priceTiers = productQuantityRanges.map(range => ({
            quantity_from: range.min_quantity,
            quantity_to: range.max_quantity,
            price: range.price
          }));

          // Obtener la primera imagen del producto y thumbnail
          let imagenPrincipal = null;
          let thumbnailUrl = null;
          if (product.product_images && Array.isArray(product.product_images) && product.product_images.length > 0) {
            imagenPrincipal = product.product_images[0].image_url;
            thumbnailUrl = product.product_images[0].thumbnail_url; // ✅ NUEVO: Obtener thumbnail_url
          }
          
          return {
            ...product,
            id: product.productid, // Mapear productid a id para compatibilidad
            nombre: product.productnm, // Mapear productnm a nombre
            imagen: imagenPrincipal, // Mapear image_url a imagen
            thumbnail_url: thumbnailUrl, // ✅ NUEVO: Agregar thumbnail_url
            precio: product.price, // Ya está correcto
            stock: product.productqty, // Mapear productqty a stock
            categoria: product.category, // Ya está correcto
            minimum_purchase: product.minimum_purchase || 1,
            compraMinima: product.minimum_purchase || 1, // Para compatibilidad
            negociable: product.negotiable || false,
            proveedor: providerData.user_nm,
            descripcion_proveedor: providerData.descripcion_proveedor,
            priceTiers: priceTiers,
            product_price_tiers: priceTiers, // Para compatibilidad
            supplier_id: product.supplier_id, // Para getProductImageUrl
            productid: product.productid, // Para getProductImageUrl
            is_active: product.is_active, // ✅ AGREGAR estado activo de BD
          };
        });

        // ✅ APLICAR FILTRO DE PRODUCTOS ACTIVOS: solo mostrar productos con stock >= compra mínima
        const activeProducts = filterActiveProducts(formattedProducts);

        setProvider({
          ...providerData,
          productCount: activeProducts.length, // ✅ USAR solo productos activos para el conteo
        });
        setProducts(activeProducts);

        // No extraer categorías dinámicamente, se usan las estandarizadas
        // setAvailableCategories(CATEGORIAS); // No necesario
        setFilteredProducts(activeProducts);

      } catch (err) {
        console.error('Error en fetchProviderAndProducts:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchProviderAndProducts();
    }
  }, [userId]);

  // Efecto para filtrar productos
  useEffect(() => {
    let filtered = [...products];

    // Filtrar por búsqueda
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product.nombre.toLowerCase().includes(search) ||
        product.categoria.toLowerCase().includes(search)
      );
    }

    // Filtrar por categoría
    if (categoryFilter && categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.categoria === categoryFilter);
    }

    // Ordenar por precio
    if (priceOrder === 'asc') {
      filtered.sort((a, b) => (a.precio || 0) - (b.precio || 0));
    } else if (priceOrder === 'desc') {
      filtered.sort((a, b) => (b.precio || 0) - (a.precio || 0));
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, categoryFilter, priceOrder]);

  // Manejar agregar al carrito
  const handleAddToCart = useMemo(() => (product) => {
    addToCart(product);
    
    // Mostrar toast de confirmación
    toast.success(
      `${product.nombre || product.name || 'Producto'} agregado al carrito`,
      {
        icon: '🛒',
        duration: 3000,
      }
    );
    
    // Navegar al carrito si estamos en contexto de buyer (con delay para mostrar toast)
    if (isFromBuyer) {
      setTimeout(() => {
        navigate('/buyer/cart');
      }, 1500); // 1.5 segundos de delay para ver el toast
    }
  }, [addToCart, isFromBuyer, navigate]);

  // Manejar navegación hacia atrás
  const handleGoBack = () => {
    if (isFromBuyer) {
      navigate('/buyer/marketplace', { 
        state: { 
          providerSwitchActive: true // Indicar que el switch de proveedores debe estar activo
        } 
      });
    } else if (isFromSupplier) {
      navigate('/supplier/marketplace', { 
        state: { 
          providerSwitchActive: true 
        } 
      });
    } else {
      navigate('/marketplace', {
        state: { 
          providerSwitchActive: true 
        } 
      });
    }
  };

  // Breadcrumbs dinámicos
  const breadcrumbs = useMemo(() => {
    const items = [
      {
        label: 'Inicio',
        icon: <Home fontSize="small" />,
        onClick: () => navigate(isFromBuyer ? '/buyer/marketplace' : isFromSupplier ? '/supplier/marketplace' : '/marketplace'),
      },
      {
        label: 'Marketplace',
        icon: <StorefrontOutlined fontSize="small" />,
        onClick: () => navigate(isFromBuyer ? '/buyer/marketplace' : isFromSupplier ? '/supplier/marketplace' : '/marketplace'),
      },
      {
        label: provider?.user_nm || 'Catálogo',
        icon: <Business fontSize="small" />,
        active: true,
      },
    ];
    return items;
  }, [provider, isFromBuyer, isFromSupplier, navigate]);

  // Descripción real del proveedor
  const providerDescription = useMemo(() => 
    provider?.descripcion_proveedor || 'Proveedor sin descripción.',
    [provider?.descripcion_proveedor]
  );

  if (loading) {
    return (
      <ThemeProvider theme={dashboardThemeCore}>
        <Box
          sx={{
            backgroundColor: 'background.default',
            minHeight: '100vh',
            pt: { xs: 2, md: 4 },
            px: 3,
            pb: 12,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress size={48} />
        </Box>
      </ThemeProvider>
    );
  }

  if (error) {
    return (
      <ThemeProvider theme={dashboardThemeCore}>
        <Box
          sx={{
            backgroundColor: 'background.default',
            minHeight: '100vh',
            pt: { xs: 2, md: 4 },
            px: 3,
            pb: 12,
            width: '100%',
          }}
        >
          <Box
            sx={{
              backgroundColor: 'white',
              maxWidth: '1450px',
              mx: 'auto',
              p: 3,
              mb: 6,
              border: '1.5px solid #e0e0e0',
              boxShadow: 6,
              borderRadius: 3,
            }}
          >
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
            <Button
              variant="contained"
              startIcon={<ArrowBack />}
              onClick={handleGoBack}
            >
              Volver al Marketplace
            </Button>
          </Box>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={dashboardThemeCore}>
      <Box
        sx={{
          backgroundColor: 'background.default',
          minHeight: '100vh',
          pt: { xs: 2, md: 4 },
          px: 3,
          pb: SPACING_BOTTOM_MAIN,
          width: '100%',
          // Prevenir desplazamiento horizontal al abrir dropdowns
          overflowX: 'hidden',
          // Mantener scrollbar vertical para evitar shifts
          overflowY: 'scroll',
        }}
      >
        <Box
          sx={{
            backgroundColor: 'white',
            maxWidth: '1450px',
            mx: 'auto',
            p: 3,
            mb: 6,
            border: '1.5px solid #e0e0e0',
            boxShadow: 6,
            borderRadius: 3,
          }}
        >
          {/* Header con botón de volver y breadcrumbs */}
          <Box sx={{ mb: 4, boxShadow: 'none', border: 'none', outline: 'none', backgroundImage: 'none' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Button
                startIcon={<ArrowBack />}
                onClick={handleGoBack}
                sx={{ textTransform: 'none' }}
              >
                Volver
              </Button>
            </Box>

            <Breadcrumbs sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
              {breadcrumbs.map((item, index) => (
                <Link
                  key={index}
                  underline="hover"
                  color={item.active ? 'primary' : 'inherit'}
                  onClick={item.onClick}
                  sx={{ 
                    cursor: item.onClick ? 'pointer' : 'default',
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.5,
                    fontWeight: item.active ? 600 : 400,
                  }}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </Breadcrumbs>
          </Box>

          {/* Información del proveedor */}
          <Paper
            elevation={2}
            sx={{
              p: 4,
              mb: 4,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
              <Avatar
                src={provider?.logo_url}
                alt={provider?.user_nm}
                sx={{
                  width: 120,
                  height: 120,
                  border: '3px solid',
                  borderColor: 'primary.main',
                }}
              >
                {provider?.user_nm?.charAt(0)?.toUpperCase() || '🏢'}
              </Avatar>
              
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    {provider?.user_nm || 'Proveedor'}
                  </Typography>
                  {provider?.verified === true && (
                    <Chip
                      icon={<VerifiedUser />}
                      label="Verificado"
                      color="primary"
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>
                
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ mb: 2, lineHeight: 1.6 }}
                >
                  {providerDescription}
                </Typography>
                
                <Typography variant="h6" color="primary.main" sx={{ fontWeight: 600 }}>
                  Este proveedor actualmente tiene {provider?.productCount || 0} productos activos publicados
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Filtros de búsqueda */}
          <Paper
            elevation={1}
            sx={{
              p: 3,
              mb: 4,
              borderRadius: 2,
              border: '1px solid #e0e0e0',
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              alignItems: 'center', 
              flexWrap: 'wrap',
              // Prevenir desplazamiento de la página al abrir dropdowns
              overflow: 'visible',
              position: 'relative',
            }}>
              {/* Barra de búsqueda - 30% más pequeña */}
              <TextField
                size="small"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setSearchTerm('')}
                        edge="end"
                        size="small"
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  width: 200,
                  flexShrink: 0,
                }}
              />

              {/* Dropdown de ordenamiento por precio */}
              <FormControl size="small" sx={{ minWidth: 180, flexShrink: 0 }}>
                <Select
                  value={priceOrder}
                  onChange={(e) => setPriceOrder(e.target.value)}
                  displayEmpty
                  startAdornment={
                    <InputAdornment position="start">
                      <SortIcon color="action" fontSize="small" />
                    </InputAdornment>
                  }
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        maxHeight: 300,
                        '& .MuiMenuItem-root': {
                          fontSize: '0.875rem',
                        },
                      },
                    },
                    anchorOrigin: {
                      vertical: 'bottom',
                      horizontal: 'left',
                    },
                    transformOrigin: {
                      vertical: 'top',
                      horizontal: 'left',
                    },
                    // Prevenir scroll en body cuando se abre el dropdown
                    disableScrollLock: true,
                  }}
                >
                  <MenuItem value="none">Ordenar por precio</MenuItem>
                  <MenuItem value="asc">Menor a mayor precio</MenuItem>
                  <MenuItem value="desc">Mayor a menor precio</MenuItem>
                </Select>
              </FormControl>

              {/* Dropdown de categorías */}
              <FormControl size="small" sx={{ minWidth: 200, flexShrink: 0 }}>
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  displayEmpty
                  startAdornment={
                    <InputAdornment position="start">
                      <CategoryIcon color="action" fontSize="small" />
                    </InputAdornment>
                  }
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        maxHeight: 300,
                        '& .MuiMenuItem-root': {
                          fontSize: '0.875rem',
                        },
                      },
                    },
                    anchorOrigin: {
                      vertical: 'bottom',
                      horizontal: 'left',
                    },
                    transformOrigin: {
                      vertical: 'top',
                      horizontal: 'left',
                    },
                    // Prevenir scroll en body cuando se abre el dropdown
                    disableScrollLock: true,
                  }}
                >
                  <MenuItem value="all">Todas las categorías</MenuItem>
                  {availableCategories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Indicadores de filtros activos */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', flex: 1 }}>
                {searchTerm && (
                  <Chip
                    label={`Búsqueda: "${searchTerm}"`}
                    onDelete={() => setSearchTerm('')}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
                {priceOrder !== 'none' && (
                  <Chip
                    label={`Orden: ${priceOrder === 'asc' ? 'Menor a mayor' : 'Mayor a menor'}`}
                    onDelete={() => setPriceOrder('none')}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
                {categoryFilter !== 'all' && (
                  <Chip
                    label={`Categoría: ${categoryFilter}`}
                    onDelete={() => setCategoryFilter('all')}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>
          </Paper>

          {/* Productos del proveedor */}
          <Box>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
              Productos Disponibles
              {(searchTerm || categoryFilter !== 'all' || priceOrder !== 'none') && (
                <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  ({filteredProducts.length} de {products.length})
                </Typography>
              )}
            </Typography>
            
            {filteredProducts.length === 0 ? (
              <Paper
                elevation={1}
                sx={{
                  p: 4,
                  textAlign: 'center',
                  borderRadius: 2,
                }}
              >
                <Typography variant="h6" color="text.secondary">
                  {searchTerm || categoryFilter !== 'all' || priceOrder !== 'none'
                    ? 'No se encontraron productos que coincidan con los filtros' 
                    : 'Este proveedor no tiene productos disponibles en este momento'
                  }
                </Typography>
                {(searchTerm || categoryFilter !== 'all' || priceOrder !== 'none') && (
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setSearchTerm('');
                      setCategoryFilter('all');
                      setPriceOrder('none');
                    }}
                    sx={{ mt: 2 }}
                  >
                    Limpiar filtros
                  </Button>
                )}
              </Paper>
            ) : (
              <Grid 
                container 
                spacing={3}
                sx={{
                  // Centrar los productos con espaciamiento igual a ambos lados
                  justifyContent: 'center',
                  
                  // Ajustar el espaciamiento para diferentes breakpoints
                  '& .MuiGrid-item': {
                    display: 'flex',
                    justifyContent: 'center',
                  },
                  
                  // Espaciamiento responsivo
                  [dashboardThemeCore.breakpoints.down('md')]: {
                    spacing: 2, // Mobile: espaciamiento menor
                  },
                  [dashboardThemeCore.breakpoints.up('md')]: {
                    spacing: 3, // Desktop: espaciamiento mayor
                  },
                  [dashboardThemeCore.breakpoints.up('xl')]: {
                    spacing: 2, // XL: espaciamiento optimizado para 5 columnas
                  },
                }}
              >
                {filteredProducts.map((product) => (
                  <Grid 
                    item 
                    xs={6}    // 2 columnas en mobile (12/6 = 2)
                    md={3}    // 4 columnas en medium y large (12/3 = 4)
                    xl={3}  // 5 columnas en extra large (12/2.4 = 5)
                    key={product.id}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      maxWidth: {
                        xs: '100%',
                        md: '300px', // Ancho máximo en md/lg para mejor proporción
                        xl: '320px', // Ancho máximo en xl para 5 columnas
                      },
                    }}
                  >
                    <ProductCard
                      product={product}
                      type="buyer"
                      onAddToCart={handleAddToCart}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default ProviderCatalog;
