import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid, // Asegúrate de que Grid está importado de @mui/material
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  InputAdornment,
  Alert,
  Skeleton,
  Fab,
  useTheme,
  useMediaQuery,
  Grow,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  Inventory as InventoryIcon,
  AttachMoney as AttachMoneyIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
} from '@mui/icons-material';
import { ThemeProvider } from '@mui/material/styles';
import { toast } from 'react-hot-toast';

// Components
import SideBarProvider from '../../layout/SideBar';
import ProductCard from '../../ui/product-card/ProductCard'; // Asegúrate que esta es la ruta correcta al componente principal
import ConfirmationModal, { MODAL_TYPES } from '../../ui/ConfirmationModal';

// Hooks y stores
import { useSupplierProducts } from '../hooks/useSupplierProducts';
import {
  useLazyProducts,
  useProductAnimations,
} from '../hooks/useLazyProducts';
import { dashboardTheme } from '../../../styles/dashboardTheme';
import { formatPrice } from '../../marketplace/utils/formatters';

// Advanced Loading Components
import {
  InitialLoadingState,
  LoadMoreState,
  ScrollProgress,
  EmptyProductsState,
} from '../../ui/AdvancedLoading';

// Constantes
const CATEGORIES = [
  { value: 'all', label: 'Todas las categorías' },
  { value: 'Supermercado', label: 'Supermercado' },
  { value: 'Electrodomésticos', label: 'Electrodomésticos' },
  { value: 'Tecnología', label: 'Tecnología' },
  { value: 'Hogar', label: 'Hogar' },
  { value: 'Moda', label: 'Moda' },
];

const SORT_OPTIONS = [
  { value: 'updatedAt', label: 'Más recientes' },
  { value: 'createdAt', label: 'Más antiguos' },
  { value: 'nombre', label: 'Nombre A-Z' },
  { value: 'precio', label: 'Precio: menor a mayor' },
  { value: 'stock', label: 'Stock disponible' },
  { value: 'ventas', label: 'Más vendidos' },
];

const MyProducts = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  // Obtener el user_id real del usuario autenticado
  const supplierId = localStorage.getItem('user_id'); // Store state usando el nuevo hook modularizado
  const {
    uiProducts,
    stats,
    searchTerm,
    categoryFilter,
    sortBy,
    sortOrder,
    loading,
    error,
    operationStates,
    activeFiltersCount,
    loadProducts,
    setSearchTerm,
    setCategoryFilter,
    setSorting,
    clearFilters,
    deleteProduct,
    clearError,
  } = useSupplierProducts();

  // Advanced lazy loading hooks
  const {
    displayedProducts,
    isLoadingMore,
    hasMore,
    loadingTriggerRef,
    totalCount,
    displayedCount,
    loadMore,
    scrollToTop,
    progress,
  } = useLazyProducts(uiProducts, 12);

  const { triggerAnimation, shouldAnimate } = useProductAnimations(
    displayedProducts.length
  );
  // Local state
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    product: null,
    loading: false,
  });
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Handle scroll for scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.pageYOffset > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []); // Cargar productos al montar el componente
  useEffect(() => {
    if (supplierId) {
      loadProducts(supplierId);
    }
  }, [supplierId, loadProducts]);

  // Trigger animations when new products are displayed
  useEffect(() => {
    if (displayedProducts.length > 0 && !loading) {
      triggerAnimation(0);
    }
  }, [displayedProducts.length, loading, triggerAnimation]);

  // Handlers
  const handleAddProduct = () => {
    navigate('/supplier/addproduct');
  };
  const handleEditProduct = product => {
    // Navegar a la página de edición con el ID del producto
    navigate(`/supplier/addproduct?edit=${product.id}`);
  };

  const handleDeleteProduct = product => {
    setDeleteModal({
      open: true,
      product,
      loading: false,
    });
  };
  const confirmDelete = async () => {
    if (!deleteModal.product) return;

    setDeleteModal(prev => ({ ...prev, loading: true }));

    try {
      await deleteProduct(deleteModal.product.id);
      toast.success(`${deleteModal.product.nombre} eliminado correctamente`);
      setDeleteModal({ open: false, product: null, loading: false });
    } catch (error) {
      toast.error(error.message || 'Error al eliminar el producto');
      setDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleViewStats = product => {
    // TODO: Implementar vista de estadísticas detalladas
    toast.success(`Próximamente: Estadísticas de ${product.nombre}`);
  };

  const handleSortChange = event => {
    const newSortBy = event.target.value;
    setSorting(newSortBy, sortOrder);
    scrollToTop(); // Smooth scroll to top when sorting changes
  };
  const handleClearFilters = () => {
    clearFilters();
    scrollToTop(); // Smooth scroll to top when clearing filters
    toast.success('Filtros limpiados');
  };

  return (
    <ThemeProvider theme={dashboardTheme}>
      <SideBarProvider />

      <Box
        sx={{
          marginLeft: '210px',
          backgroundColor: 'background.default',
          minHeight: '100vh',
          pt: { xs: 9, md: 10 },
          px: 3,
          pb: 3,
        }}
      >
        <Container maxWidth="xl" disableGutters>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
                mb: 3,
              }}
            >
              <Box>
                <Typography
                  variant="h4"
                  fontWeight="600"
                  color="primary.main"
                  gutterBottom
                >
                  Mis Productos
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Gestiona tu catálogo de productos de manera eficiente
                </Typography>
              </Box>

              <Button
                variant="contained"
                size="large"
                startIcon={<AddIcon />}
                onClick={handleAddProduct}
                sx={{
                  minWidth: { xs: '100%', sm: 'auto' },
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                }}
              >
                Agregar Producto
              </Button>
            </Box>{' '}
            {/* Estadísticas del inventario */}
            <Box sx={{ mb: 3 }}>
              <Paper
                sx={{ overflow: 'hidden', width: '40%', minWidth: '400px' }}
              >
                <Box
                  sx={{
                    p: 2,
                    bgcolor: 'grey.50',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, color: 'text.primary' }}
                  >
                    Resumen del Inventario
                  </Typography>
                </Box>

                <Box sx={{ p: 0 }}>
                  {' '}
                  <Grid container columns={12}>
                    <Grid item xs={12} sm={4}>
                      {' '}
                      {/* CORREGIDO AQUÍ */}
                      <Box
                        sx={{
                          p: 2,
                          borderRight: { sm: '1px solid' },
                          borderColor: { sm: 'divider' },
                          borderBottom: { xs: '1px solid', sm: 'none' },
                          borderBottomColor: { xs: 'divider' },
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                          }}
                        >
                          <InventoryIcon
                            color="primary"
                            sx={{ fontSize: 20 }}
                          />
                          <Box>
                            <Typography
                              variant="h6"
                              sx={{ fontWeight: 600, lineHeight: 1.2 }}
                            >
                              {stats.total}
                            </Typography>{' '}
                            <Typography variant="body2" color="text.secondary">
                              Total de productos
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Grid>{' '}
                    <Grid item xs={12} sm={4}>
                      {' '}
                      {/* CORREGIDO AQUÍ */}
                      <Box
                        sx={{
                          p: 2,
                          borderRight: { sm: '1px solid' },
                          borderColor: { sm: 'divider' },
                          borderBottom: { xs: '1px solid', sm: 'none' },
                          borderBottomColor: { xs: 'divider' },
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                          }}
                        >
                          <Box
                            sx={{
                              color: 'success.main',
                              fontSize: 20,
                              fontWeight: 'bold',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            ✓
                          </Box>
                          <Box>
                            <Typography
                              variant="h6"
                              sx={{ fontWeight: 600, lineHeight: 1.2 }}
                            >
                              {stats.inStock}
                            </Typography>{' '}
                            <Typography variant="body2" color="text.secondary">
                              Productos en stock
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Grid>{' '}
                    <Grid item xs={12} sm={4}>
                      {' '}
                      {/* CORREGIDO AQUÍ */}
                      <Box sx={{ p: 2 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                          }}
                        >
                          <AttachMoneyIcon
                            color="success"
                            sx={{ fontSize: 20 }}
                          />
                          <Box>
                            <Typography
                              variant="h6"
                              sx={{ fontWeight: 600, lineHeight: 1.2 }}
                            >
                              {formatPrice(stats.totalValue)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Valor del inventario
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>
            </Box>
          </Box>
          {/* Error Alert */}
          {error && (
            <Alert severity="error" onClose={clearError} sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          {/* Filtros y búsqueda */}
          <Paper sx={{ p: 3, mb: 3 }}>
            {' '}
            <Grid container columns={12} spacing={2} alignItems="center">
              {' '}
              {/* Búsqueda */}
              <Grid item xs={12} sm={6} md={4}>
                {' '}
                {/* CORREGIDO AQUÍ */}
                <TextField
                  fullWidth
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />{' '}
              </Grid>{' '}
              {/* Filtro por categoría */}{' '}
              <Grid item xs={12} sm={6} md={3}>
                {' '}
                {/* CORREGIDO AQUÍ */}
                <FormControl fullWidth>
                  <InputLabel>Categoría</InputLabel>{' '}
                  <Select
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    label="Categoría"
                    sx={{
                      borderRadius: 2,
                      minWidth: '200px',
                      '& .MuiSelect-select': {
                        minWidth: '150px',
                      },
                    }}
                    MenuProps={{
                      disableScrollLock: true,
                    }}
                  >
                    {CATEGORIES.map(category => (
                      <MenuItem key={category.value} value={category.value}>
                        {category.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>{' '}
              {/* Ordenamiento */}
              <Grid item xs={12} sm={6} md={3}>
                {' '}
                {/* CORREGIDO AQUÍ */}
                <FormControl fullWidth>
                  <InputLabel>Ordenar por</InputLabel>{' '}
                  <Select
                    value={sortBy}
                    onChange={handleSortChange}
                    label="Ordenar por"
                    sx={{
                      borderRadius: 2,
                      minWidth: '200px',
                      '& .MuiSelect-select': {
                        minWidth: '150px',
                      },
                    }}
                    MenuProps={{
                      disableScrollLock: true,
                    }}
                  >
                    {SORT_OPTIONS.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>{' '}
              </Grid>{' '}
              {/* Acciones */}
              <Grid item xs={12} sm={6} md={2}>
                {' '}
                {/* CORREGIDO AQUÍ */}
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    onClick={handleClearFilters}
                    sx={{ borderRadius: 2, minWidth: 'auto', px: 2 }}
                  >
                    <ClearIcon />
                  </Button>
                </Stack>
              </Grid>
            </Grid>
            {/* Filtros activos */}
            {(searchTerm || categoryFilter !== 'all') && (
              <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {searchTerm && (
                  <Chip
                    label={`Búsqueda: "${searchTerm}"`}
                    onDelete={() => setSearchTerm('')}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
                {categoryFilter !== 'all' && (
                  <Chip
                    label={`Categoría: ${
                      CATEGORIES.find(c => c.value === categoryFilter)?.label
                    }`}
                    onDelete={() => setCategoryFilter('all')}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
              </Box>
            )}
          </Paper>{' '}
          {/* Grid de productos */}
          <Box sx={{ mb: 40 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography variant="h6" color="text.secondary">
                {loading
                  ? 'Cargando productos...'
                  : uiProducts.length === 0
                  ? 'Sin productos'
                  : `${displayedCount} de ${totalCount} productos mostrados`}
              </Typography>

              <Chip
                label={`Orden: ${sortOrder === 'asc' ? '↑' : '↓'} ${
                  SORT_OPTIONS.find(opt => opt.value === sortBy)?.label ||
                  'Fecha'
                }`}
                size="small"
                variant="outlined"
              />
            </Box>{' '}
            {/* Advanced Loading States */}{' '}
            {loading ? (
              <InitialLoadingState />
            ) : uiProducts.length === 0 ? (
              <Grid
                container
                spacing={3}
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  width: '100%',
                }}
              >
                <EmptyProductsState
                  searchTerm={searchTerm}
                  categoryFilter={categoryFilter}
                />
              </Grid>
            ) : (
              <>
                {/* Product Grid Traditional (sin virtualización por ahora) */}
                <Grid container spacing={3}>
                  {displayedProducts.map((product, index) => (
                    <Grow
                      key={product.id}
                      in={true}
                      timeout={600}
                      style={{ transitionDelay: `${(index % 8) * 50}ms` }}
                    >
                      <Grid item xs={12} sm={6} md={4.5} lg={3.5} xl={2.8}>
                        {' '}
                        {/* CORREGIDO AQUÍ */}
                        <ProductCard
                          product={product}
                          type="supplier"
                          onEdit={handleEditProduct}
                          onDelete={handleDeleteProduct}
                          onViewStats={handleViewStats}
                          isDeleting={operationStates.deleting?.[product.id]}
                        />
                      </Grid>
                    </Grow>
                  ))}
                </Grid>

                {/* Infinite Scroll Loading Trigger */}
                {hasMore && (
                  <Box ref={loadingTriggerRef} sx={{ mt: 2 }}>
                    <LoadMoreState show={isLoadingMore} />
                  </Box>
                )}

                {/* Scroll Progress Indicator */}
                {totalCount > 12 && (
                  <ScrollProgress
                    progress={progress}
                    totalCount={totalCount}
                    displayedCount={displayedCount}
                  />
                )}
              </>
            )}
          </Box>{' '}
          {/* FAB para móvil */}
          {isMobile && (
            <Fab
              color="primary"
              onClick={handleAddProduct}
              sx={{
                position: 'fixed',
                bottom: 16,
                right: 16,
                zIndex: 1000,
              }}
            >
              <AddIcon />
            </Fab>
          )}
          {/* Scroll to Top FAB */}
          <Grow in={showScrollTop}>
            <Fab
              color="secondary"
              onClick={scrollToTop}
              sx={{
                position: 'fixed',
                bottom: isMobile ? 80 : 16,
                right: isMobile ? 16 : 80,
                zIndex: 999,
                backgroundColor: 'background.paper',
                color: 'primary.main',
                border: '2px solid',
                borderColor: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                },
              }}
              size="medium"
            >
              <KeyboardArrowUpIcon />
            </Fab>
          </Grow>
        </Container>
      </Box>

      {/* Modal de confirmación de eliminación */}
      <ConfirmationModal
        open={deleteModal.open}
        onClose={() =>
          setDeleteModal({ open: false, product: null, loading: false })
        }
        onConfirm={confirmDelete}
        type={MODAL_TYPES.DELETE}
        title="Eliminar producto"
        message={
          deleteModal.product
            ? `¿Estás seguro de que deseas eliminar "${deleteModal.product.nombre}"? Esta acción no se puede rehacer.` // 'no se puede deshacer' suena más natural
            : ''
        }
        loading={deleteModal.loading}
      />
    </ThemeProvider>
  );
};

export default MyProducts;
