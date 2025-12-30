import React, { useEffect, useState, useRef, lazy, Suspense } from 'react';
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
  CircularProgress,
  Modal as MuiModal,
  Tooltip,
} from '@mui/material';
import { useBodyScrollLock } from '../../../../shared/hooks/useBodyScrollLock';

// Styles from Marketplace CategoryNavigation to keep category buttons consistent on desktop
import { categoryNavigationStyles as catStyles } from '../../../marketplace/components/CategoryNavigation/CategoryNavigation.styles';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Inventory as InventoryIcon,
  AttachMoney as AttachMoneyIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Storefront as StorefrontIcon,
  CloudUpload as CloudUploadIcon,
  Share as ShareIcon,
  Category as CategoryIcon,
  Sort as SortIcon,
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
import { Modal, MODAL_TYPES } from '../../../../shared/components/feedback';
import BigModal from '../../../../shared/components/modals/BigModal/BigModal';
import {
  TransferInfoValidationModal,
  useTransferInfoModal,
  VerifiedValidationModal,
  useVerifiedModal,
} from '../../../../shared/components/validation';
import MobileFilterAccordion from '../../../../shared/components/mobile/MobileFilterAccordion';

// ✅ OPTIMIZACIÓN: Lazy load de MassiveProductImport (437 KB)
const MassiveProductImport = lazy(() =>
  import('../../create-product/components/MassiveProductImport')
);

// Error Boundaries
import { SupplierErrorBoundary } from '../../error-boundary';

// Hooks y stores
import { useAuth } from '../../../../infrastructure/providers';
import { useSupplierProducts } from '../../shared-hooks/useSupplierProducts';
import {
  useLazyProducts,
  useProductAnimations,
} from '../hooks/useLazyProducts';
import { dashboardThemeCore } from '../../../../styles/dashboardThemeCore';
import { SPACING_BOTTOM_MAIN } from '../../../../styles/layoutSpacing';
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
  { value: 'updateddt', label: 'Más recientes' },
  { value: 'createddt', label: 'Más antiguos' },
  { value: 'productnm', label: 'Nombre A-Z' },
  { value: 'precio_asc', label: 'Precios menor a mayor' },
  { value: 'precio_desc', label: 'Precios mayor a menor' },
  { value: 'productqty', label: 'Stock disponible' },
  { value: 'pausedStatus', label: 'Pausados/Inactivos' },
];

const MyProducts = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { userProfile } = useAuth();

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

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    product: null,
    loading: false,
  });

  const [pauseModal, setPauseModal] = useState({
    isOpen: false,
    product: null,
    loading: false,
  });

  // 🆕 Estado para modal de Massive Import
  const [massiveImportOpen, setMassiveImportOpen] = useState(false);

  // 🆕 Estado para modal de compartir catálogo
  const [shareModalOpen, setShareModalOpen] = useState(false);
  useBodyScrollLock(shareModalOpen);
  const [catalogUrl, setCatalogUrl] = useState('');

  const {
    checkAndProceed,
    handleRegisterAccount,
    handleClose: handleCloseTransferModal,
    isOpen: transferModalOpen,
    loading: transferModalLoading,
    missingFieldLabels,
  } = useTransferInfoModal();

  // Modal de validación de verificación
  const {
    isOpen: showVerifiedModal,
    checkAndProceed: verifiedCheckAndProceed,
    handleClose: handleCloseVerified,
  } = useVerifiedModal();

  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.pageYOffset > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!supplierId) return;
    if (
      !didInitLoadRef.current &&
      !loading &&
      (!uiProducts || uiProducts.length === 0)
    ) {
      didInitLoadRef.current = true;
      loadProducts(supplierId);
    }
  }, [supplierId, loadProducts, uiProducts?.length, loading]);

  useEffect(() => {
    didInitLoadRef.current = false;
  }, [supplierId]);

  useEffect(() => {
    if (displayedProducts.length > 0 && !loading) {
      triggerAnimation(0);
    }
  }, [displayedProducts.length, loading, triggerAnimation]);

  useEffect(() => {
    const handleImagesReady = event => {
      const { productId, imageCount } = event.detail;
      // silencio UX
    };

    window.addEventListener('productImagesReady', handleImagesReady);

    return () => {
      window.removeEventListener('productImagesReady', handleImagesReady);
    };
  }, []);

  // --- Handlers ---
  const handleAddProduct = () => {
    // Primero verificar que esté verificado
    verifiedCheckAndProceed(() => {
      // Luego verificar info bancaria
      checkAndProceed('/supplier/addproduct');
    });
  };

  // Botón Importar Excel -> validar verificación y luego info bancaria antes de abrir modal
  const handleOpenMassiveImport = () => {
    // Primero verificar que esté verificado
    verifiedCheckAndProceed(() => {
      // Luego verificar info bancaria
      checkAndProceed(null, () => {
        setMassiveImportOpen(true);
      });
    });
  };

  const handleCloseMassiveImport = () => {
    setMassiveImportOpen(false);
  };

  // Manejar apertura del modal de compartir catálogo
  const handleOpenShareModal = () => {
    if (userProfile && supplierId) {
      // Simple normalization: lowercase + alphanumeric only (matches SQL)
      const userNmSlug = (userProfile.user_nm || `proveedor${supplierId}`)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');

      // Construir URL completa del catálogo (usar id corto)
      const baseUrl = window.location.origin;
      const shortSupplierId = (supplierId || '').toString().slice(0, 4);
      const url = `${baseUrl}/catalog/${userNmSlug}/${shortSupplierId}`;
      setCatalogUrl(url);
      setShareModalOpen(true);
    }
  };

  const handleCloseShareModal = () => {
    setShareModalOpen(false);
  };

  const handleCopyUrl = () => {
    navigator.clipboard
      .writeText(catalogUrl)
      .then(() => {
        showSuccessToast('Enlace copiado al portapapeles');
      })
      .catch(() => {
        showErrorToast('Error al copiar el enlace');
      });
  };

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
    checkAndProceed(`/supplier/addproduct?edit=${product.id}`);
  };

  const handleDeleteProduct = product => {
    setDeleteModal({
      isOpen: true,
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
      setDeleteModal({ isOpen: false, product: null, loading: false });
    } catch (error) {
      showProductError(error.message || 'Error al eliminar el producto');
      setDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handlePauseProduct = product => {
    setPauseModal({ isOpen: true, product, loading: false });
  };

  const confirmPause = async () => {
    if (!pauseModal.product) return;
    setPauseModal(prev => ({ ...prev, loading: true }));
    try {
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
    scrollToTop();
  };

  const handleClearFilters = () => {
    clearFilters();
    scrollToTop();
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
            backgroundColor: 'background.default',
            minHeight: '100vh',
            pt: { xs: 4.5, md: 5 },
            px: { xs: 0, md: 3 },
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
                  flexDirection: { xs: 'column', md: 'row' },
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

                {/* Acciones: Agregar + Importar Excel + Compartir Catálogo */}
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 1,
                    width: { xs: '100%', md: 'auto' },
                  }}
                >
                  <Tooltip
                    title="Crea y publica un producto de manera individual con todos sus detalles"
                    placement="bottom"
                    arrow
                    disableHoverListener={isMobile}
                  >
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<AddIcon />}
                      onClick={handleAddProduct}
                      data-prefetch="add-product-btn"
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        px: { xs: 2, md: 3 },
                        flex: { xs: 1, md: '0 1 auto' },
                        minWidth: 0,
                      }}
                    >
                      {isMobile ? 'Agregar' : 'Agregar Producto'}
                    </Button>
                  </Tooltip>
                  <Tooltip
                    title="Importa múltiples productos a la vez usando una plantilla de Excel"
                    placement="bottom"
                    arrow
                    disableHoverListener={isMobile}
                  >
                    <Button
                      variant="outlined"
                      size="large"
                      startIcon={<CloudUploadIcon />}
                      onClick={handleOpenMassiveImport}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 'bold',
                        px: { xs: 2, md: 3 },
                        flex: { xs: 1, md: '0 1 auto' },
                        minWidth: 0,
                      }}
                    >
                      Carga Masiva
                    </Button>
                  </Tooltip>
                  <Tooltip
                    title={
                      userProfile?.verified
                        ? 'Compartir catálogo'
                        : 'Para compartir tu catálogo debes estar verificado'
                    }
                    arrow
                  >
                    <span>
                      <Button
                        variant="outlined"
                        size="large"
                        onClick={handleOpenShareModal}
                        disabled={!userProfile?.verified}
                        sx={{
                          borderRadius: 2,
                          minWidth: 0,
                          px: 2,
                        }}
                      >
                        <ShareIcon />
                      </Button>
                    </span>
                  </Tooltip>
                </Box>
              </Box>

              {/* Estadísticas del inventario */}
              <Box sx={{ mb: 3 }}>
                <Paper
                  sx={{
                    overflow: 'hidden',
                    width: '100%',
                  }}
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

                  <Box
                    sx={{
                      p: 0,
                      mx: 'auto',
                    }}
                  >
                    <Grid container columns={12} justifyContent="center">
                      {/* Primera fila mobile: Total productos (50%) + Productos activos (50%) */}
                      <Grid item xs={6} md={4} width={{ xs: '50%', md: '31%' }}>
                        <Box
                          sx={{
                            p: 2,
                            borderRight: '1px solid',
                            borderColor: 'divider',
                            borderBottom: { xs: '1px solid', md: 'none' },
                            borderBottomColor: { xs: 'divider' },
                            minHeight: { xs: '110px', md: 'auto' },
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: { xs: 'column', md: 'row' },
                              alignItems: { xs: 'flex-start', md: 'center' },
                              gap: { xs: 0.5, md: 1.5 },
                            }}
                          >
                            <InventoryIcon
                              color="primary"
                              sx={{ fontSize: { xs: 32, md: 40 } }}
                            />
                            <Box>
                              <Typography
                                variant="h6"
                                sx={{
                                  fontWeight: 600,
                                  fontSize: { xs: '1.1rem', md: '1.25rem' },
                                }}
                              >
                                {stats.total}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  fontSize: { xs: '0.75rem', md: '0.875rem' },
                                }}
                              >
                                Total de productos
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Grid>

                      <Grid item xs={6} md={4} width={{ xs: '50%', md: '31%' }}>
                        <Box
                          sx={{
                            p: 2,
                            borderRight: { md: '1px solid' },
                            borderColor: { md: 'divider' },
                            borderBottom: { xs: '1px solid', md: 'none' },
                            borderBottomColor: { xs: 'divider' },
                            minHeight: { xs: '110px', md: 'auto' },
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: { xs: 'column', md: 'row' },
                              alignItems: { xs: 'flex-start', md: 'center' },
                              gap: { xs: 0.5, md: 1.5 },
                            }}
                          >
                            <Box
                              sx={{
                                color: 'success.main',
                                fontSize: { xs: '32px', md: '40px' },
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: { xs: '32px', md: '40px' },
                                height: { xs: '32px', md: '40px' },
                                lineHeight: 1,
                              }}
                            >
                              ✓
                            </Box>
                            <Box>
                              <Typography
                                variant="h6"
                                sx={{
                                  fontWeight: 600,
                                  fontSize: { xs: '1.1rem', md: '1.25rem' },
                                }}
                              >
                                {stats.active}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  fontSize: { xs: '0.75rem', md: '0.875rem' },
                                }}
                              >
                                Productos activos
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Grid>

                      {/* Segunda fila mobile: Valor inventario (100%) */}
                      <Grid
                        item
                        xs={12}
                        md={4}
                        width={{ xs: '100%', md: '31%' }}
                      >
                        <Box
                          sx={{
                            p: 2,
                            width: '100%',
                            minHeight: { xs: '90px', md: 'auto' },
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1.5,
                            }}
                          >
                            <AttachMoneyIcon
                              color="success"
                              sx={{ fontSize: { xs: 32, md: 40 } }}
                            />
                            <Box>
                              <Typography
                                variant="h6"
                                sx={{
                                  fontWeight: 600,
                                  fontSize: { xs: '1.1rem', md: '1.25rem' },
                                }}
                              >
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
                                sx={{
                                  fontSize: { xs: '0.75rem', md: '0.875rem' },
                                }}
                              >
                                Valor del inventario
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Grid>

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
            {isMobile ? (
              /* 📱 MOBILE: Diseño optimizado con Accordions */
              <Box sx={{ mb: 3 }}>
                {/* Búsqueda siempre visible en mobile */}
                <Paper sx={{ p: 2, mb: 2 }}>
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
                    size="small"
                  />
                </Paper>

                {/* Categoría como Accordion */}
                <MobileFilterAccordion
                  currentFilter={categoryFilter}
                  onFilterChange={setCategoryFilter}
                  filterOptions={CATEGORIES.map(cat => ({
                    value: cat.value,
                    label: cat.label,
                    count: cat.value === 'all' ? stats.total : undefined,
                  }))}
                  label="Categoría de productos"
                />

                {/* Ordenar por como Accordion */}
                <MobileFilterAccordion
                  currentFilter={sortBy}
                  onFilterChange={handleSortChange}
                  filterOptions={SORT_OPTIONS.map(opt => ({
                    value: opt.value,
                    label: opt.label,
                  }))}
                  label="Ordenar productos"
                />

                {/* Botón limpiar filtros - solo si hay filtros activos */}
                {(searchTerm ||
                  categoryFilter !== 'all' ||
                  sortBy !== 'updateddt') && (
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleClearFilters}
                    startIcon={<ClearIcon />}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      py: 1.5,
                    }}
                  >
                    Limpiar todos los filtros
                  </Button>
                )}
              </Box>
            ) : (
              /* 🖥️ DESKTOP: Diseño horizontal tradicional */
              <Paper sx={{ p: 3, mb: 3 }}>
                <Grid container columns={12} spacing={2} alignItems="center">
                  {/* Búsqueda */}
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="Buscar productos..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
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
                        '& .MuiOutlinedInput-root': { borderRadius: 2 },
                        minWidth: { md: '15rem' },
                        width: { xs: '100%', md: '15rem' },
                        flexShrink: 0,
                      }}
                      autoComplete="off"
                      autoCorrect="off"
                    />
                  </Grid>

                  {/* Categoría */}
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl size="small" fullWidth>
                      <InputLabel>Categoría</InputLabel>
                      <Select
                        value={categoryFilter}
                        onChange={e => setCategoryFilter(e.target.value)}
                        label="Categoría"
                        displayEmpty
                        startAdornment={
                          <InputAdornment position="start">
                            <CategoryIcon color="action" fontSize="small" />
                          </InputAdornment>
                        }
                        sx={{
                          borderRadius: 2,
                          minWidth: { md: '15rem' },
                          width: { xs: '100%', md: '15rem' },
                          flexShrink: 0,
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

                  {/* Ordenar por */}
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl size="small" fullWidth>
                      <InputLabel>Ordenar por</InputLabel>
                      <Select
                        value={sortBy}
                        onChange={handleSortChange}
                        label="Ordenar por"
                        displayEmpty
                        startAdornment={
                          <InputAdornment position="start">
                            <SortIcon color="action" fontSize="small" />
                          </InputAdornment>
                        }
                        sx={{
                          borderRadius: 2,
                          minWidth: { md: '15rem' },
                          width: { xs: '100%', md: '15rem' },
                          flexShrink: 0,
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

                  {/* Botón limpiar */}
                  <Grid item xs={12} sm={6} md={2}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={handleClearFilters}
                      sx={{ borderRadius: 2, px: 2 }}
                    >
                      <ClearIcon sx={{ mr: 1 }} /> Limpiar
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            )}

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
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr 1fr',
                        sm: '1fr 1fr',
                        md: '1fr 1fr 1fr',
                        lg: '1fr 1fr 1fr 1fr',
                        xl: '1fr 1fr 1fr 1fr 1fr',
                      },
                      gap: { xs: 1.5, sm: 3, md: 4, lg: 2 },
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
                            onViewStats={handlePauseProduct}
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

                  {hasMore && (
                    <Box ref={loadingTriggerRef} sx={{ mt: 2 }}>
                      <LoadMoreState show={isLoadingMore} />
                    </Box>
                  )}

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

        {/* Modal eliminar */}
        <Modal
          isOpen={deleteModal.isOpen}
          onClose={() =>
            setDeleteModal({ isOpen: false, product: null, loading: false })
          }
          onSubmit={confirmDelete}
          type={MODAL_TYPES.DELETE}
          title="Eliminar producto"
          loading={deleteModal.loading}
        >
          {deleteModal.product
            ? `¿Estás seguro de que deseas eliminar "${deleteModal.product.nombre}"? Esta acción no se puede deshacer.`
            : ''}
        </Modal>

        {/* Modal pausar / reactivar */}
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

        {/* 🆕 Modal de Massive Import (ahora usando BigModal) */}
        <BigModal
          isOpen={massiveImportOpen}
          onClose={handleCloseMassiveImport}
          title="Importar productos desde Excel"
        >
          <Suspense
            fallback={
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight="400px"
              >
                <CircularProgress />
              </Box>
            }
          >
            <MassiveProductImport
              open={massiveImportOpen}
              onClose={handleCloseMassiveImport}
              onSuccess={() => {
                showSuccessToast('Productos importados correctamente', {
                  icon: '📥',
                });
                handleCloseMassiveImport();
                if (supplierId) {
                  loadProducts(supplierId);
                }
              }}
            />
          </Suspense>
        </BigModal>

        {/* Modal para compartir catálogo */}
        <MuiModal
          open={shareModalOpen}
          onClose={handleCloseShareModal}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box
            sx={{
              bgcolor: 'background.paper',
              borderRadius: 2,
              boxShadow: 24,
              p: 4,
              maxWidth: 600,
              width: '90%',
              outline: 'none',
            }}
          >
            <Typography
              variant="h6"
              component="h2"
              sx={{ mb: 2, fontWeight: 600 }}
            >
              Compartir Catálogo
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
              Comparte este enlace para que puedan ver tu catálogo de productos:
            </Typography>
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                alignItems: 'center',
                bgcolor: 'grey.100',
                p: 2,
                borderRadius: 1,
                mb: 3,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  flex: 1,
                  wordBreak: 'break-all',
                  fontFamily: 'monospace',
                }}
              >
                {catalogUrl}
              </Typography>
              <Button
                variant="contained"
                size="small"
                onClick={handleCopyUrl}
                sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
              >
                Copiar
              </Button>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                onClick={handleCloseShareModal}
                sx={{ textTransform: 'none' }}
              >
                Cerrar
              </Button>
            </Box>
          </Box>
        </MuiModal>

        {/* Modal validación bancaria */}
        <TransferInfoValidationModal
          isOpen={transferModalOpen}
          onClose={handleCloseTransferModal}
          onRegisterAccount={handleRegisterAccount}
          loading={transferModalLoading}
          missingFieldLabels={missingFieldLabels}
        />

        {/* Modal de validación de verificación */}
        <VerifiedValidationModal
          isOpen={showVerifiedModal}
          onClose={handleCloseVerified}
        />
      </ThemeProvider>
    </SupplierErrorBoundary>
  );
};

export default MyProducts;
