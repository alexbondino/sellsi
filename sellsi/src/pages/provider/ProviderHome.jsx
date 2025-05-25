// 📁 pages/ProviderHome.jsx
import React from 'react';
import { Box, Grid, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { supabase } from '../../services/supabase';
import DashboardSummary from '../../components/DashboardSummary';
import RequestList from '../../components/RequestList';
import MonthlySalesChart from '../../components/BarChart';
import { useSupplierDashboard } from '../../hooks/useSupplierDashboard';

const ProviderHome = () => {
  const supplierId = localStorage.getItem('supplierid');
  const {
    products,
    sales,
    productStocks,
    weeklyRequests,
    monthlyData,
    totalSales,
  } = useSupplierDashboard(supplierId);

  const productsOutOfStock = productStocks.filter(
    p => p.productqty === 0
  ).length;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', p: 2 }}>
      {/* Columna izquierda */}
      <Box sx={{ flex: 2, p: 2, backgroundColor: '#f5f5f5' }}>
        <DashboardSummary
          products={products}
          totalSales={totalSales}
          outOfStock={productsOutOfStock}
          weeklyRequests={weeklyRequests}
        />

        <Grid item xs={12} container justifyContent="center" sx={{ mt: 4 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            fullWidth
            sx={{ py: 3, borderRadius: 2, fontSize: 25 }}
          >
            Nuevo Producto
          </Button>
        </Grid>

        <MonthlySalesChart data={monthlyData} />
      </Box>

      {/* Columna derecha */}
      <Box sx={{ flexShrink: 0, width: 350, p: 2, backgroundColor: '#f5f5f5' }}>
        <RequestList weeklyRequests={weeklyRequests} />
      </Box>
    </Box>
  );
};

export default ProviderHome;
