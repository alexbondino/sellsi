import React from 'react';
import { Box } from '@mui/material';
import useMarketplaceLogic from '../../marketplace/pages/useMarketplaceLogic.jsx';
import SearchSection from '../../marketplace/pages/sections/SearchSection.jsx';
// import FilterSection from '../../marketplace/pages/sections/FilterSection.jsx'; // Botón de filtros comentado
import ProductsSection from '../../marketplace/pages/sections/ProductsSection.jsx';
import { SupplierErrorBoundary } from '../components/ErrorBoundary';

// Marketplace para el proveedor: igual que el del comprador pero con SideBar de proveedor
const MarketplaceSupplier = React.memo(() => {
  const marketplaceConfig = React.useMemo(
    () => ({
      hasSideBar: true, // Proveedor también tiene sidebar
      searchBarMarginLeft: { xs: 0, sm: 0, md: 0, lg: 0, xl: 0 },
      categoryMarginLeft: { xs: 0, sm: 0, md: 0, lg: 0, xl: 0 },
      titleMarginLeft: { xs: 0, sm: 0, md: 0, lg: 0, xl: 0 },
    }),
    []
  );
  const { searchSectionProps, filterSectionProps, productsSectionProps } = useMarketplaceLogic(marketplaceConfig);
  const containerStyles = React.useMemo(
    () => ({
      bgcolor: '#f8fafc',
      minHeight: '100vh',
      pt: { xs: 7, md: 8 },
      px: { xs: 2, md: 3 },
    }),
    []
  );
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <SupplierErrorBoundary onRetry={handleRetry}>
      <Box>
        <Box sx={containerStyles}>
          <SearchSection {...searchSectionProps} />
          {/* <FilterSection {...filterSectionProps} filterPosition="right" /> */} {/* Botón de filtros comentado */}
          <ProductsSection {...productsSectionProps} />
        </Box>
      </Box>
    </SupplierErrorBoundary>
  );
});
MarketplaceSupplier.displayName = 'MarketplaceSupplier';
export default MarketplaceSupplier;
