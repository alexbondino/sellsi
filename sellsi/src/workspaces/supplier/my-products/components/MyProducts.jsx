import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
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
  Fab,
  useTheme,
  useMediaQuery,
  Grow,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Inventory as InventoryIcon,
  AttachMoney as AttachMoneyIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Storefront as StorefrontIcon,
} from '@mui/icons-material';
import { ThemeProvider } from '@mui/material/styles';
import {
  showProductSuccess,
  showProductError,
  showSuccessToast,
  showErrorToast,
} from '../../../../utils/toastHelpers';

// Components
import ProductCard from '../../../../shared/components/display/product-card/ProductCard';
import { Modal, MODAL_TYPES } from '../../../../shared/components/feedback'; // <--- Importación del nuevo componente Modal
import {
  TransferInfoValidationModal,
  useTransferInfoModal,
} from '../../../../shared/components/validation'; // Modal de validación bancaria

// Error Boundaries
import { SupplierErrorBoundary } from '../../error-boundary';

// Hooks y stores
import { useSupplierProducts } from '../../shared-hooks/useSupplierProducts';
import {
  useLazyProducts,
  useProductAnimations,
} from '../../../../domains/supplier/hooks/useLazyProducts';
import { dashboardThemeCore } from '../../home/styles/dashboardThemeCore';
import { SPACING_BOTTOM_MAIN } from '../../shared-styles/layoutSpacing';
import { formatPrice } from '../../../../shared/utils/formatters';
import { generateProductUrl } from '../../../../shared/utils/product/productUrl';

// Advanced Loading Components
import {
  InitialLoadingState,
  LoadMoreState,
  ScrollProgress,
  EmptyProductsState,
} from '../../../../shared/components/feedback/AdvancedLoading';

// Constantes
const CATEGORIES = [
  { value: 'all', label: 'Todas las categorías' },
  { value: 'Tabaquería', label: 'Tabaquería' },
  { value: 'Alcoholes', label: 'Alcoholes' },
  { value: 'Ferretería y Construcción', label: 'Ferretería y Construcción' },
  { value: 'Gastronomía', label: 'Gastronomía' },
  { value: 'Otros', label: 'Otros' },
];

const SORT_OPTIONS = [
  { value: 'updatedAt', label: 'Más recientes' },
  { value: 'createdAt', label: 'Más antiguos' },
  { value: 'nombre', label: 'Nombre A-Z' },
  { value: 'precio', label: 'Precio: menor a mayor' },
  { value: 'stock', label: 'Stock disponible' },
  { value: 'ventas', label: 'Más vendidos' },
  { value: 'pausedStatus', label: 'Pausados/Inactivos' }, // 🆕 Inactivos (pausados) primero A-Z, luego activos A-Z
];

const MyProducts = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  // Obtener el user_id real del usuario autenticado (asumiendo que está en localStorage)
  const supplierId = localStorage.getItem('user_id');

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
    loadProducts,
    setSearchTerm,
    setCategoryFilter,
    setSorting,
    clearFilters,
    deleteProduct,
    clearError,
    updateProduct,
  } = useSupplierProducts();

  const didInitLoadRef = useRef(false);

  // Advanced lazy loading hooks
  const {
    displayedProducts,
    isLoadingMore,
    hasMore,
    loadingTriggerRef,
    totalCount,
    displayedCount,
    scrollToTop,
    progress,
  } = useLazyProducts(uiProducts, 12);

  const { triggerAnimation } = useProductAnimations(displayedProducts.length);

  // Estado local para el modal de eliminación
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false, // <--- Cambiado de 'open' a 'isOpen'
    product: null,
    loading: false,
  });

  // Modal para pausar producto
  const [pauseModal, setPauseModal] = useState({
    isOpen: false,
    product: null,
    loading: false,
  });

  // Hook para validación de información bancaria (reemplaza estado manual)
  const {
    checkAndProceed,
    handleRegisterAccount,
    handleClose: handleCloseTransferModal,
    isOpen: transferModalOpen,
    loading: transferModalLoading,
    missingFieldLabels,
  } = useTransferInfoModal();

  // Estado para el botón de scroll to top
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Manejar el scroll para el botón de ir arriba
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.pageYOffset > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cargar productos al montar el componente o cuando cambia el supplierId
  useEffect(() => {
    if (!supplierId) return;
    // Reset guard if supplierId changed (different supplier should re-trigger)
    if (
      !didInitLoadRef.current &&
      !loading &&
      (!uiProducts || uiProducts.length === 0)
    ) {
      didInitLoadRef.current = true;
      loadProducts(supplierId);
    }
  }, [supplierId, loadProducts, uiProducts?.length, loading]);

  // Reset the init guard when supplierId changes so a new supplier can attempt load again
  useEffect(() => {
    didInitLoadRef.current = false;
  }, [supplierId]);

  // Disparar animaciones cuando se muestran nuevos productos
  useEffect(() => {
    if (displayedProducts.length > 0 && !loading) {
      triggerAnimation(0);
    }
  }, [displayedProducts.length, loading, triggerAnimation]);

  // NUEVO: Monitorear eventos de imágenes procesadas en background
  useEffect(() => {
    const handleImagesReady = event => {
      const { productId, imageCount } = event.detail;
      // Evento de imágenes procesadas: mantener silencio por UX (sin logs innecesarios)
    };

    window.addEventListener('productImagesReady', handleImagesReady);

    return () => {
      window.removeEventListener('productImagesReady', handleImagesReady);
    };
  }, []);

  // --- Handlers ---
  const handleAddProduct = () => {
    // Usar el hook de validación que maneja automáticamente el modal
    checkAndProceed('/supplier/addproduct');
  };

  // Prefetch AddProduct chunk when the Add button is near viewport (400px)
  useEffect(() => {
    const selector = '[data-prefetch="add-product-btn"]';
    const el = document.querySelector(selector);
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          import('../../create-product/components/AddProduct').catch(() => {});
          obs.disconnect();
        }
      },
      { rootMargin: '400px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const handleEditProduct = product => {
    // Para editar también verificar la información bancaria
    checkAndProceed(`/supplier/addproduct?edit=${product.id}`);
  };

  const handleDeleteProduct = product => {
    setDeleteModal({
      isOpen: true, // <--- Cambiado de 'open' a 'isOpen'
      product,
      loading: false,
    });
  };

  const confirmDelete = async () => {
    if (!deleteModal.product) return;

    setDeleteModal(prev => ({ ...prev, loading: true }));

    try {
      await deleteProduct(deleteModal.product.id);
      showProductSuccess(
        `${deleteModal.product.nombre} eliminado correctamente`,
        '🗑️'
      );
      setDeleteModal({ isOpen: false, product: null, loading: false }); // <--- Cambiado de 'open' a 'isOpen'
    } catch (error) {
      showProductError(error.message || 'Error al eliminar el producto');
      setDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Abrir modal de pausa
  const handlePauseProduct = product => {
    setPauseModal({ isOpen: true, product, loading: false });
  };

  // Confirmar pausa del producto (toggle is_active=false)
  const confirmPause = async () => {
    if (!pauseModal.product) return;
    setPauseModal(prev => ({ ...prev, loading: true }));
    try {
      // toggle: si está activo lo pausamos, si está pausado lo reactivamos
      const newActive = !(pauseModal.product.activo === true);
      await updateProduct(pauseModal.product.id, { is_active: newActive });
      showProductSuccess(
        newActive
          ? `Producto "${pauseModal.product.nombre}" reactivado`
          : `Producto "${pauseModal.product.nombre}" pausado`,
        newActive ? '▶️' : '⏸️'
      );
      setPauseModal({ isOpen: false, product: null, loading: false });
    } catch (e) {
      showErrorToast(e.message || 'Error al pausar el producto');
      setPauseModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleSortChange = event => {
    const newSortBy = event.target.value;
    setSorting(newSortBy, sortOrder);
    scrollToTop(); // Desplazamiento suave hacia arriba cuando cambia la ordenación
  };

  const handleClearFilters = () => {
    clearFilters();
    scrollToTop(); // Desplazamiento suave hacia arriba al limpiar filtros
    showSuccessToast('Filtros limpiados', { icon: '🧹' });
  };
  const handleProductCardClick = product => {
    const url = generateProductUrl(product);
    navigate(url, { state: { from: '/supplier/myproducts' } });
  };

  const handleRetry = () => {
    clearError();
    loadProducts(supplierId);
  };

  return (
    <SupplierErrorBoundary onRetry={handleRetry}>
      <ThemeProvider theme={dashboardThemeCore}>
        <Box
          sx={{
            // marginLeft: '210px', // Eliminado para ocupar todo el ancho
            backgroundColor: 'background.default',
            minHeight: '100vh',
            pt: { xs: 4.5, md: 5 },
            px: 3,
            pb: SPACING_BOTTOM_MAIN,
            ml: { xs: 0, md: 10, lg: 14, xl: 24 },
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
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <StorefrontIcon
                      sx={{ color: 'primary.main', fontSize: 36, mr: 1 }}
                    />
                    <Typography
                      variant="h4"
                      fontWeight="600"
                      color="primary.main"
                      gutterBottom
                    >
                      Mis Productos
                    </Typography>
                  </Box>
                  <Typography variant="body1" color="text.secondary">
                    Gestiona tu catálogo eficientemente
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  size="large"
                  startIcon={<AddIcon />}
                  onClick={handleAddProduct}
                  data-prefetch="add-product-btn"
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
              </Box>

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
                    <Grid container columns={12}>
                      <Grid item xs={12} sm={4}>
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
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Total de productos
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
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
                                {stats.active}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Productos activos
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
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
                                {/* 🆕 MOSTRAR RANGO: Valor mínimo - máximo */}
                                {stats.inventoryRange &&
                                stats.inventoryRange.min !==
                                  stats.inventoryRange.max
                                  ? `${formatPrice(
                                      stats.inventoryRange.min
                                    )} - ${formatPrice(
                                      stats.inventoryRange.max
                                    )}`
                                  : stats.hasTieredProducts
                                  ? formatPrice(
                                      stats.inventoryRange?.min ||
                                        stats.totalValue
                                    )
                                  : formatPrice(stats.totalValue)}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Valor del inventario
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Grid>
                      {/* DEBUG: Mostrar datos de rango cuando hay tramos (eliminar luego) */}
                      {process.env.NODE_ENV === 'development' &&
                        stats.hasTieredProducts && (
                          <Grid item xs={12}>
                            <Box
                              sx={{
                                p: 2,
                                borderTop: '1px dashed',
                                borderColor: 'divider',
                              }}
                            ></Box>
                          </Grid>
                        )}
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
              <Grid container columns={12} spacing={2} alignItems="center">
                {/* Búsqueda */}
                <Grid item xs={12} sm={6} md={4}>
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
                    autoComplete="off"
                    autoCorrect="off"
                  />
                </Grid>

                {/* Filtro por categoría */}
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Categoría</InputLabel>
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
                </Grid>

                {/* Ordenamiento */}
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Ordenar por</InputLabel>
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
                  </FormControl>
                </Grid>

                {/* Acciones */}
                <Grid item xs={12} sm={6} md={2}>
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
            </Paper>

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
              </Box>

              {/* Advanced Loading States */}
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
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        sm: '1fr 1fr',
                        md: '1fr 1fr 1fr',
                        lg: '1fr 1fr 1fr 1fr',
                        xl: '1fr 1fr 1fr 1fr 1fr',
                      },
                      gap: { xs: 2, sm: 3, md: 4, lg: 2 },
                      width: '100%',
                    }}
                  >
                    {displayedProducts.map((product, index) => (
                      <Grow
                        key={product.id}
                        in={true}
                        timeout={600}
                        style={{ transitionDelay: `${(index % 8) * 50}ms` }}
                      >
                        <Box>
                          <ProductCard
                            product={product}
                            type="supplier"
                            onEdit={handleEditProduct}
                            onDelete={handleDeleteProduct}
                            onViewStats={handlePauseProduct} // reutilizamos prop existente para acción de pausa
                            isDeleting={operationStates.deleting?.[product.id]}
                            isUpdating={operationStates.updating?.[product.id]}
                            isProcessing={
                              operationStates.processing?.[product.id]
                            }
                            onProductClick={handleProductCardClick}
                          />
                        </Box>
                      </Grow>
                    ))}
                  </Box>

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
            </Box>

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

        {/* Modal de confirmación de eliminación - Ahora usando el componente Modal unificado */}
        <Modal
          isOpen={deleteModal.isOpen} // Usamos 'isOpen' para el estado del modal
          onClose={
            () =>
              setDeleteModal({ isOpen: false, product: null, loading: false }) // Actualizamos 'isOpen'
          }
          onSubmit={confirmDelete} // Usamos 'onSubmit' para la acción de confirmar
          type={MODAL_TYPES.DELETE}
          title="Eliminar producto"
          loading={deleteModal.loading}
        >
          {/* El mensaje ahora es children del componente Modal */}
          {deleteModal.product
            ? `¿Estás seguro de que deseas eliminar "${deleteModal.product.nombre}"? Esta acción no se puede deshacer.`
            : ''}
        </Modal>

        {/* Modal de pausar / reactivar producto */}
        <Modal
          isOpen={pauseModal.isOpen}
          onClose={() =>
            setPauseModal({ isOpen: false, product: null, loading: false })
          }
          onSubmit={confirmPause}
          type={
            pauseModal.product?.activo ? MODAL_TYPES.WARNING : MODAL_TYPES.INFO
          }
          title={
            pauseModal.product?.activo
              ? 'Pausar producto'
              : 'Reactivar producto'
          }
          loading={pauseModal.loading}
        >
          {pauseModal.product &&
            (pauseModal.product.activo
              ? `¿Seguro que deseas pausar "${pauseModal.product.nombre}"? Dejará de mostrarse en el Marketplace hasta que lo reactives.`
              : `¿Deseas reactivar "${pauseModal.product.nombre}"? Volverá a mostrarse en el Marketplace.`)}
        </Modal>

        {/* Modal de validación de información bancaria */}
        <TransferInfoValidationModal
          isOpen={transferModalOpen}
          onClose={handleCloseTransferModal}
          onRegisterAccount={handleRegisterAccount}
          loading={transferModalLoading}
          missingFieldLabels={missingFieldLabels}
        />
      </ThemeProvider>
    </SupplierErrorBoundary>
  );
};

export default MyProducts;
