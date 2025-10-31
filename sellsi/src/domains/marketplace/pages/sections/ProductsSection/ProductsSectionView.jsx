import React from 'react';
import { Box, Typography, IconButton, Paper, Button, CircularProgress, Fab, Grow } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BusinessIcon from '@mui/icons-material/Business';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
// Import consistente con otros módulos (MyProducts, ProviderCatalog): 4 niveles y archivo concreto
import { ProductCard } from '../../../../../shared/components/display/product-card';

// Presentational only (no business logic). All derivations via props.
export function ProductsSectionView({
  ui,
  data,
  handlers,
  components,
}) {
  const {
    mainContainerStyles,
    innerContainerStyles,
    gridStyles,
    cardContainerStyles,
    sectionTitle,
  } = ui;
  const {
    loading,
    error,
    isProviderView,
    totalProductos,
    providersCount,
    productosOrdenados,
    renderItems,
    PaginationComponent,
    isInfiniteScrollActive,
    isLoadingMore,
    currentPageProducts,
    PRODUCTS_PER_PAGE_META,
    startIndex,
    endIndex,
    currentPage,
    totalPages,
    titleMarginLeft,
    getPriority, // ✅ Función para determinar prioridad de imagen
  getPriceTiers,
  registerProductNode,
  } = data;
  const { handleBackClick, resetFiltros, scrollToTop, showScrollTop, seccionActiva } = handlers;

  return (
    <Box sx={mainContainerStyles}>
      <Box sx={innerContainerStyles}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 2, md: 8 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: titleMarginLeft, width: { xs: '100%', sm: '100%' }, flex: 1, minWidth: 0 }}>
            {seccionActiva !== 'todos' && (
              <IconButton onClick={handleBackClick} sx={{ bgcolor: '#f1f5f9', color: 'primary.main', '&:hover': { bgcolor: 'primary.main', color: 'white' }, transition: 'all 0.2s ease' }} aria-label="Volver a todos los productos">
                <ArrowBackIcon />
              </IconButton>
            )}
            <Typography variant="h5" fontWeight={600} noWrap sx={{ color: seccionActiva === 'todos' ? 'primary.main' : '#1e293b', fontSize: { xs: '1.25rem', sm: '1.3rem', md: '2rem' }, lineHeight: 1.2, whiteSpace: { xs: 'normal', sm: 'nowrap', md: 'nowrap' }, overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', maxWidth: '100%' }}>
              {sectionTitle}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: { xs: 'auto', sm: 'auto', md: 180 }, maxWidth: { xs: '120px', sm: '140px', md: 'none' }, alignItems: { xs: 'flex-end', sm: 'flex-end', md: 'flex-end' }, flexShrink: 0 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' }, textAlign: { xs: 'right', sm: 'right', md: 'left' } }}>
              {isProviderView ? `${providersCount} proveedores disponibles` : `${totalProductos} productos encontrados`}
            </Typography>
            {totalPages > 1 && (
              <Typography variant="body2" color="primary.main" sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem' }, textAlign: { xs: 'right', sm: 'right', md: 'left' } }}>
                Mostrando {startIndex + 1}-{Math.min(endIndex, totalProductos)} | Página {currentPage} de {totalPages}
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ width: '100%' }}>
          {loading ? (
            components.Loading
          ) : error ? (
            components.Error(error)
          ) : productosOrdenados.length === 0 ? (
            components.Empty
          ) : (
            <>
              {PaginationComponent}
              <Box sx={gridStyles} role="list" aria-label={sectionTitle || 'Lista de productos'}>
                {renderItems.map((producto, index) => (
                  <Box key={`product-${producto.id || producto.productid}`} sx={cardContainerStyles} role="listitem">
                    <ProductCard 
                      product={producto} 
                      type={isProviderView ? 'provider' : 'buyer'} 
                      imagePriority={getPriority ? getPriority(index) : false} // ✅ Prioridad dinámica por posición
                      // Optional prefetch wiring from useProducts hook
                      registerProductNode={registerProductNode}
                    />
                  </Box>
                ))}
              </Box>
              {/* Región aria-live para anunciar cambios de paginación / cantidad */}
              <Box sx={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
                <Typography component="div" aria-live="polite" aria-atomic="true">
                  Página {currentPage} de {totalPages}. Mostrando {renderItems.length} elementos.
                </Typography>
              </Box>
              {isInfiniteScrollActive && isLoadingMore && components.InfiniteSpinner}
              {!isInfiniteScrollActive && !isLoadingMore && currentPageProducts.length >= PRODUCTS_PER_PAGE_META ? components.PageEndMessage : null}
              {PaginationComponent}
            </>
          )}
        </Box>
      </Box>
      <Grow in={showScrollTop}>
        <Fab
          color="secondary"
          onClick={scrollToTop}
          aria-label="Volver al inicio de la lista"
          title="Volver al inicio de la lista"
          sx={{ position: 'fixed', bottom: { xs: 100, md: 40 }, right: { xs: 10, md: 120 }, zIndex: 1401, backgroundColor: 'background.paper', color: 'primary.main', border: '2px solid', borderColor: 'primary.main', boxShadow: '0 6px 24px rgba(25, 118, 210, 0.18)', '&:hover': { backgroundColor: 'primary.main', color: 'primary.contrastText' } }} size="medium"
        >
          <KeyboardArrowUpIcon />
        </Fab>
      </Grow>
    </Box>
  );
}

export default ProductsSectionView;
