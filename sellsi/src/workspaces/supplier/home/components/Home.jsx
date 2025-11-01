// 📁 pages/ProviderHome.jsx
import React, { Suspense, useEffect } from 'react';
import {
  Box,
  Grid,
  Button,
  Container,
  ThemeProvider,
  CircularProgress,
  Skeleton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import { useSupplierDashboard } from '../../shared-hooks/useSupplierDashboard';
import { useSupplierProducts } from '../../shared-hooks/useSupplierProducts';
import { dashboardThemeCore } from '../styles/dashboardThemeCore';
import { SPACING_BOTTOM_MAIN } from '../styles/layoutSpacing';
import { supabase } from '../../../../services/supabase';
import SupplierErrorBoundary from '../error-boundary/SupplierErrorBoundary';
import {
  TransferInfoValidationModal,
  useTransferInfoModal,
} from '../../../../shared/components/validation'; // Modal de validación bancaria

// Lazy import principal (se elimina gráfico para reducir peso: BarChart removido)
const DashboardSummary = React.lazy(() => import('./DashboardSummary'));

// Loading fallbacks optimizados
const DashboardSummaryFallback = () => (
  <Grid container spacing={2}>
    {[1, 2, 3, 4].map(item => (
      <Grid key={item} size={{ xs: 12, sm: 6, md: 3 }}>
        <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
      </Grid>
    ))}
  </Grid>
);

const ChartFallback = () => (
  <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
);

const ProviderHome = () => {
  const navigate = useNavigate();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Modal de validación bancaria
  const {
    isOpen: showModal,
    checkAndProceed,
    handleRegisterAccount,
    handleClose,
    loading: transferModalLoading,
    missingFieldLabels,
  } = useTransferInfoModal();

  // Dashboard data (metrics, charts, analytics)
  const {
    // charts,  // Eliminado: se deja de consumir data de gráficos
    metrics,
    loading: dashboardLoading,
    error: dashboardError,
    refresh: refreshDashboard,
  } = useSupplierDashboard();

  // Products data (for counts and active/inactive stats)
  const {
    products = [], // Default to empty array to prevent filter errors
    loading: productsLoading,
    error: productsError,
    loadProducts,
  } = useSupplierProducts();

  // Contador real de solicitudes semanales (órdenes pagadas últimos 7 días)
  const weeklyRequestsCount = metrics?.weeklyRequestsCount ?? 0;
  const totalSales = metrics?.totalRevenue || 0;

  // Combine loading and error states
  const loading = dashboardLoading || productsLoading;
  const error = dashboardError || productsError;

  // Función para manejar la creación de nuevo producto con validación bancaria
  const handleNewProduct = () => {
    checkAndProceed(null, () => {
      navigate('/supplier/addproduct', {
        state: { fromHome: true },
      });
    });
  };

  // ============================================================================
  // CÁLCULO CORRECTO DE ESTADÍSTICAS
  // ============================================================================
  // 1. Filtrar productos realmente activos (excluir soft-deleted)
  const activeProducts = products.filter(
    p =>
      p.is_active === true &&
      (!p.deletion_status || p.deletion_status === 'active')
  );

  // 2. Productos activos (sin contar eliminados)
  const productsActive = activeProducts.length;

  // 3. Productos sin stock = activos con stock 0 (NO productos eliminados)
  const productsOutOfStock = activeProducts.filter(
    p => p.productqty === 0 || p.stock === 0
  ).length;

  // ============================================================================
  // EFECTOS - VALIDACIÓN Y RECARGA AUTOMÁTICA
  // ============================================================================

  /**
   * Verificar si los datos se cargaron correctamente después del montaje inicial
   * Si después de 3 segundos no hay datos y no está cargando, intentar recargar
   */
  useEffect(() => {
    // Reintento condicional: si tras 3s seguimos sin datos y no hay error.
    const timer = setTimeout(async () => {
      if (!loading && products.length === 0 && !error) {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session?.user?.id) {
            // Respect global last-fetched TTL to avoid racing loads
            const productsKey = `fp_products_supplier_${session.user.id}`;
            const lastMap =
              typeof window !== 'undefined'
                ? (window.__inFlightSupabaseLastFetched =
                    window.__inFlightSupabaseLastFetched || new Map())
                : new Map();
            const last = lastMap.get(productsKey);
            const shouldLoad = !last || Date.now() - last > 3000;
            await Promise.all([
              refreshDashboard?.(),
              shouldLoad ? loadProducts?.(session.user.id) : Promise.resolve(),
            ]);
          }
        } catch (e) {
          console.error('[ProviderHome] Retry load failed', e);
        }
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [loading, products.length, error, refreshDashboard, loadProducts]);

  const handleRetry = () => {
    // Reload dashboard data
    loadDashboardData();
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
          {/*Eliminar esto eventualmente - Prueba Sentry */}
          <Button variant="contained" onClick={() => funcionQueNoExiste()}>
            Presióname
          </Button>
          <Container
            maxWidth={isMobile ? false : 'xl'}
            disableGutters={isMobile ? true : false}
          >
            <Grid container spacing={3}>
              <Grid size={12}>
                <Box sx={{ mb: 4 }}>
                  <Suspense fallback={<DashboardSummaryFallback />}>
                    <DashboardSummary
                      products={activeProducts}
                      totalSales={totalSales}
                      outOfStock={productsOutOfStock}
                      weeklyRequestsCount={weeklyRequestsCount}
                      productsActive={productsActive}
                    />
                  </Suspense>
                </Box>

                <Box sx={{ mb: 4 }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<AddIcon />}
                    fullWidth
                    sx={{
                      py: 2,
                      borderRadius: 2,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      textTransform: 'none',
                      boxShadow: 'rgba(99, 102, 241, 0.16) 0px 4px 16px',
                      '&:hover': {
                        boxShadow: 'rgba(99, 102, 241, 0.24) 0px 6px 20px',
                        transform: 'translateY(-1px)',
                      },
                      transition: 'all 0.2s ease-in-out',
                    }}
                    onClick={handleNewProduct}
                  >
                    Nuevo Producto
                  </Button>
                </Box>

                {/* Gráfico eliminado para reducir JS (recharts purgado) */}
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* Modal de validación de información bancaria */}
        <TransferInfoValidationModal
          isOpen={showModal}
          onClose={handleClose}
          onRegisterAccount={handleRegisterAccount}
          loading={transferModalLoading}
          missingFieldLabels={missingFieldLabels}
        />
      </ThemeProvider>
    </SupplierErrorBoundary>
  );
};

export default ProviderHome;
