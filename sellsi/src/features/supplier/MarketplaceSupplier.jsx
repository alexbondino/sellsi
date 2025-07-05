import React from 'react';
import { Box } from '@mui/material';
import useMarketplaceLogic from '../marketplace/useMarketplaceLogic.jsx';
import SearchSection from '../marketplace/sections/SearchSection.jsx';
import FilterSection from '../marketplace/sections/FilterSection.jsx';
import ProductsSection from '../marketplace/sections/ProductsSection.jsx';

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
  return (
    <Box>
      <Box sx={containerStyles}>
        <SearchSection {...searchSectionProps} />
        <FilterSection {...filterSectionProps} filterPosition="right" />
        <ProductsSection {...productsSectionProps} />
      </Box>
    </Box>
  );
});
MarketplaceSupplier.displayName = 'MarketplaceSupplier';
export default MarketplaceSupplier;
