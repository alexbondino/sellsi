import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
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
  Tooltip,
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
import { dashboardThemeCore } from '../../../styles/dashboardThemeCore';
import { SPACING_BOTTOM_MAIN } from '../../../styles/layoutSpacing';
import { supabase } from '../../../services/supabase';

import ProductCard from '../../../shared/components/display/product-card/ProductCard';
import useCartStore from '../../../shared/stores/cart/cartStore';
import { filterActiveProducts } from '../../../utils/productActiveStatus';
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
            px: { xs: 0, md: 3 },
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
            px: { xs: 0, md: 3 },
            pb: 12,
            width: '100%',
          }}
        >
          <Box
            sx={{
              backgroundColor: 'white',
              maxWidth: '1450px',
              mx: 'auto',
              p: { xs: 1.5, md: 3 },
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
          px: { xs: 0, md: 3 },
          pb: SPACING_BOTTOM_MAIN,
          width: '100%',
          // Prevenir desplazamiento horizontal al abrir dropdowns
          overflowX: 'hidden',
          // Mostrar scrollbar vertical solo cuando sea necesario
          overflowY: 'auto',
        }}
      >
        <Box
          sx={{
            backgroundColor: 'white',
            maxWidth: '1450px',
            mx: 'auto',
            p: { xs: 1.5, md: 3 },
            mb: 6,
            border: '1.5px solid #e0e0e0',
            boxShadow: 6,
            borderRadius: 3,
          }}
        >
          {/* Header con botón de volver y breadcrumbs */}
          <Box sx={{ 
            mb: { xs: 2, md: 4 }, 
            boxShadow: 'none', 
            border: 'none', 
            outline: 'none', 
            backgroundImage: 'none' 
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: { xs: 1, md: 2 }, 
              mb: { xs: 1, md: 2 } 
            }}>
              <Button
                startIcon={<ArrowBack />}
                onClick={handleGoBack}
                size="small"
                sx={{ 
                  textTransform: 'none',
                  fontSize: { xs: '0.75rem', md: '0.875rem' },
                  minWidth: { xs: 'auto', md: '64px' },
                  px: { xs: 1, md: 2 }
                }}
              >
                Volver
              </Button>
            </Box>

            <Breadcrumbs 
              sx={{ 
                fontSize: { xs: '0.75rem', md: '0.875rem' }, 
                color: 'text.secondary',
                '& .MuiBreadcrumbs-separator': {
                  mx: { xs: 1 }
                }
              }}
            >
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
                    gap: { xs: 0.3, md: 0.5 },
                    fontWeight: item.active ? 600 : 400,
                    fontSize: { xs: '0.75rem', md: '0.875rem' },
                    // Ocultar iconos en móvil para ahorrar espacio
                    '& svg': {
                      display: { xs: 'none', sm: 'block' },
                      fontSize: { xs: '1rem', md: '1.125rem' }
                    }
                  }}
                >
                  {item.icon}
                  <span style={{ 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    maxWidth: '120px'
                  }}>
                    {item.label}
                  </span>
                </Link>
              ))}
            </Breadcrumbs>
          </Box>

          {/* Información del proveedor */}
          <Paper
            elevation={2}
            sx={{
              p: { xs: 1.5, sm: 2, md: 4 },
              mb: { xs: 2, md: 4 },
              borderRadius: 3,
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: { xs: 'flex-start', sm: 'center' }, 
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 2, sm: 2, md: 3 }, 
              mb: { xs: 2, md: 3 }
            }}>
              <Avatar
                src={provider?.logo_url}
                alt={provider?.user_nm}
                sx={{
                  width: { xs: 60, sm: 80, md: 120 },
                  height: { xs: 60, sm: 80, md: 120 },
                  border: '3px solid',
                  borderColor: 'primary.main',
                  alignSelf: { xs: 'center', sm: 'flex-start' }
                }}
              >
                {provider?.user_nm?.charAt(0)?.toUpperCase() || '🏢'}
              </Avatar>
              
              <Box sx={{ flex: 1, width: '100%' }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: { xs: 0.5, md: 1 }, 
                  mb: { xs: 0.5, md: 1 },
                  flexWrap: 'wrap',
                  justifyContent: { xs: 'center', sm: 'flex-start' }
                }}>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 600, 
                      color: 'primary.main',
                      fontSize: { xs: '1.1rem', sm: '1.3rem', md: '2rem' },
                      textAlign: { xs: 'center', sm: 'left' },
                      lineHeight: 1.2
                    }}
                  >
                    {provider?.user_nm || 'Proveedor'}
                  </Typography>
                  {provider?.verified === true && (
                    <Tooltip
                      title="Este Proveedor ha sido verificado por Sellsi."
                      placement="right"
                      arrow
                    >
                      <Chip
                        icon={<VerifiedUser sx={{ fontSize: { xs: '0.8rem', md: '1rem' } }} />}
                        label="Verificado"
                        color="primary"
                        size="small"
                        variant="filled"
                        clickable={false}
                        onClick={() => {}}
                        sx={{
                          fontSize: { xs: '0.65rem', md: '0.75rem' },
                          height: { xs: 20, md: 24 }
                        }}
                      />
                    </Tooltip>
                  )}
                </Box>
                
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ 
                    mb: { xs: 1, md: 2 }, 
                    lineHeight: 1.6,
                    fontSize: { xs: '0.8rem', md: '1rem' },
                    textAlign: { xs: 'center', sm: 'left' }
                  }}
                >
                  {providerDescription}
                </Typography>
                
                <Typography 
                  variant="h6" 
                  color="primary.main" 
                  sx={{ 
                    fontWeight: 600,
                    fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' },
                    textAlign: { xs: 'center', sm: 'left' }
                  }}
                >
                  Este proveedor actualmente tiene {provider?.productCount || 0} productos activos publicados
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Filtros de búsqueda */}
          <Paper
            elevation={1}
            sx={{
              p: { xs: 0.5, md: 3 },
              mb: { xs: 2, md: 4 },
              borderRadius: 2,
              border: '1px solid #e0e0e0',
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              gap: { xs: 1, sm: 1.5, md: 2 }, 
              alignItems: { xs: 'stretch', md: 'center' }, 
              flexDirection: { xs: 'column', md: 'row' },
              flexWrap: { md: 'wrap' },
              // Prevenir desplazamiento de la página al abrir dropdowns
              overflow: 'visible',
              position: 'relative',
            }}>
              {/* Barra de búsqueda */}
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
                  width: { xs: '100%', md: 200 },
                  flexShrink: 0,
                  '& .MuiInputBase-input': {
                    fontSize: { xs: '0.875rem', md: '1rem' }
                  }
                }}
              />

              {/* Filtros en mobile: row layout para ahorrar espacio vertical */}
              <Box sx={{
                display: 'flex',
                gap: { xs: 0.5, md: 2 },
                flexDirection: { xs: 'row', md: 'row' },
                width: { xs: '100%', md: 'auto' },
                '& > *': {
                  flex: { xs: 1, md: 'none' },
                  maxWidth: { xs: 'calc(50% - 4px)', md: 'none' }
                }
              }}>
                {/* Dropdown de ordenamiento por precio */}
                <FormControl size="small" sx={{ 
                  minWidth: { xs: 0, md: 180 },
                  width: { xs: '100%', md: 180 },
                  flexShrink: 0 
                }}>
                  <Select
                    value={priceOrder}
                    onChange={(e) => setPriceOrder(e.target.value)}
                    displayEmpty
                    startAdornment={
                      <InputAdornment position="start">
                        <SortIcon color="action" fontSize="small" />
                      </InputAdornment>
                    }
                    sx={{
                      '& .MuiSelect-select': {
                        fontSize: { xs: '0.7rem', md: '0.875rem' },
                        py: { xs: 0.5, md: 1 },
                        px: { xs: 0, md: 1 }
                      }
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          maxHeight: 300,
                          '& .MuiMenuItem-root': {
                            fontSize: { xs: '0.7rem', md: '0.875rem' },
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
                    <MenuItem value="none">
                      <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Ordenar por precio</Box>
                      <Box sx={{ display: { xs: 'block', sm: 'none' } }}>Precio</Box>
                    </MenuItem>
                    <MenuItem value="asc">
                      <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Menor a mayor precio</Box>
                      <Box sx={{ display: { xs: 'block', sm: 'none' } }}>↑ Precio</Box>
                    </MenuItem>
                    <MenuItem value="desc">
                      <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Mayor a menor precio</Box>
                      <Box sx={{ display: { xs: 'block', sm: 'none' } }}>↓ Precio</Box>
                    </MenuItem>
                  </Select>
                </FormControl>

                {/* Dropdown de categorías */}
                <FormControl size="small" sx={{ 
                  minWidth: { xs: 0, md: 200 },
                  width: { xs: '100%', md: 200 },
                  flexShrink: 0 
                }}>
                  <Select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    displayEmpty
                    startAdornment={
                      <InputAdornment position="start">
                        <CategoryIcon color="action" fontSize="small" />
                      </InputAdornment>
                    }
                    sx={{
                      '& .MuiSelect-select': {
                        fontSize: { xs: '0.7rem', md: '0.875rem' },
                        py: { xs: 0.5, md: 1 },
                        px: { xs: 0, md: 1 }
                      }
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          maxHeight: 300,
                          '& .MuiMenuItem-root': {
                            fontSize: { xs: '0.7rem', md: '0.875rem' },
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
                    <MenuItem value="all">
                      <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Todas las categorías</Box>
                      <Box sx={{ display: { xs: 'block', sm: 'none' } }}>Categorías</Box>
                    </MenuItem>
                    {availableCategories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Indicadores de filtros activos */}
              <Box sx={{ 
                display: 'flex', 
                gap: 1, 
                flexWrap: 'wrap', 
                flex: { xs: 'none', md: 1 },
                width: { xs: '100%', md: 'auto' }
              }}>
                {searchTerm && (
                  <Chip
                    label={`Búsqueda: "${searchTerm}"`}
                    onDelete={() => setSearchTerm('')}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{
                      fontSize: { xs: '0.7rem', md: '0.75rem' },
                      height: { xs: 24, md: 32 }
                    }}
                  />
                )}
                {priceOrder !== 'none' && (
                  <Chip
                    label={`Orden: ${priceOrder === 'asc' ? 'Menor a mayor' : 'Mayor a menor'}`}
                    onDelete={() => setPriceOrder('none')}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{
                      fontSize: { xs: '0.7rem', md: '0.75rem' },
                      height: { xs: 24, md: 32 }
                    }}
                  />
                )}
                {categoryFilter !== 'all' && (
                  <Chip
                    label={`Categoría: ${categoryFilter}`}
                    onDelete={() => setCategoryFilter('all')}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{
                      fontSize: { xs: '0.7rem', md: '0.75rem' },
                      height: { xs: 24, md: 32 }
                    }}
                  />
                )}
              </Box>
            </Box>
          </Paper>

          {/* Productos del proveedor */}
          <Box>
            <Typography 
              variant="h5" 
              sx={{ 
                mb: { xs: 2, md: 3 }, 
                fontWeight: 600,
                fontSize: { xs: '1.1rem', md: '1.5rem' }
              }}
            >
              Productos Disponibles
              {(searchTerm || categoryFilter !== 'all' || priceOrder !== 'none') && (
                <Typography 
                  component="span" 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    ml: 1,
                    fontSize: { xs: '0.75rem', md: '0.875rem' }
                  }}
                >
                  ({filteredProducts.length} de {products.length})
                </Typography>
              )}
            </Typography>
            
            {filteredProducts.length === 0 ? (
              <Paper elevation={1} sx={{ p: { xs: 2, md: 4 }, textAlign: 'center', borderRadius: 2 }}>
                <Typography variant="h6" color="text.secondary">
                  {searchTerm || categoryFilter !== 'all' || priceOrder !== 'none'
                    ? 'No se encontraron productos que coincidan con los filtros'
                    : 'Este proveedor no tiene productos disponibles en este momento'
                  }
                </Typography>
                {(searchTerm || categoryFilter !== 'all' || priceOrder !== 'none') && (
                  <Button
                    variant="outlined"
                    onClick={() => { setSearchTerm(''); setCategoryFilter('all'); setPriceOrder('none'); }}
                    sx={{ mt: 2 }}
                  >
                    Limpiar filtros
                  </Button>
                )}
              </Paper>
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: 'repeat(2, 1fr)', // Móvil: 2 columnas
                    sm: 'repeat(2, 1fr)', // Tablet: 2 columnas
                    md: 'repeat(4, 1fr)', // Desktop: 4 columnas flexibles
                    lg: 'repeat(4, 1fr)',
                    xl: 'repeat(4, 1fr)',
                  },
                  // Separar gap en columnGap (lateral) y rowGap (vertical) para controlar solo espacio horizontal
                  columnGap: { xs: 1, sm: 1, md: 2, lg: 0, xl: 4 },
                  rowGap: { xs: 1, sm: 1, md: 2, lg: 4, xl: 4 },
                  width: '100%',
                  justifyItems: 'center',
                  // Ajuste fino: desplazar la grilla ligeramente a la izquierda en pantallas mayores
                  ml: { xs: 0, sm: 0, md: -2, lg: -3, xl: -5 },
                }}
              >
                {filteredProducts.map(product => (
                  <Box key={product.id} sx={{ width: '100%', maxWidth: '240px' }}>
                    <ProductCard product={product} type="buyer" onAddToCart={handleAddToCart} />
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default ProviderCatalog;
