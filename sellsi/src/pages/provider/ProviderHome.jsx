import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Grid, Paper } from '@mui/material';
import { supabase } from '../../services/supabase';
import PaidIcon from '@mui/icons-material/Paid';
import InventoryIcon from '@mui/icons-material/Inventory';
import WarningIcon from '@mui/icons-material/Warning';
import AddIcon from '@mui/icons-material/Add';
import ListAltIcon from '@mui/icons-material/ListAlt';
import DashboardCard from '../../components/Widget';
import MonthlySalesChart from '../../components/BarChart';

const getTimeAgo = timestamp => {
  const now = new Date();
  const created = new Date(timestamp);
  const diffMs = now - created;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / (3600000 * 24));

  if (diffMins < 1) return 'Menos de 1 minuto';
  if (diffMins < 60)
    return `Hace ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
  if (diffHours < 24)
    return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
  return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
};

const ProviderHome = () => {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [productStocks, setProductStocks] = useState([]);
  const [weeklyRequests, setWeeklyRequests] = useState([]);

  const supplierId = localStorage.getItem('supplierid');

  const getStartOfWeek = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff)).toISOString().split('T')[0];
  };

  const getEndOfWeek = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + 7;
    return new Date(now.setDate(diff)).toISOString().split('T')[0];
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('supplierid', supplierId);

    if (error) {
      console.error('❌ Error al obtener productos:', error);
    } else {
      setProducts(data);
      setProductStocks(data.map(p => ({ productqty: p.productqty })));
    }
  };

  const fetchSales = async () => {
    const { data, error } = await supabase
      .from('sales')
      .select('amount, trx_date')
      .eq('supplierid', supplierId);

    if (error) {
      console.error('❌ Error al obtener ventas:', error);
    } else {
      setSales(data);
    }
  };

  const fetchRequests = async () => {
    const start = getStartOfWeek();
    const end = getEndOfWeek();

    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('productid,productnm')
      .eq('supplierid', supplierId);

    if (productError) {
      console.error('❌ Error al obtener productos:', productError);
      return;
    }

    const productIds = productData.map(p => p.productid);

    if (productIds.length === 0) {
      setWeeklyRequests([]);
      return;
    }

    const { data: requests, error: requestError } = await supabase
      .from('requests')
      .select('*, products(productnm), sellers(sellernm)')
      .in('productid', productIds)
      .gte('createddt', start)
      .lte('createddt', end);

    if (requestError) {
      console.error('❌ Error al obtener solicitudes:', requestError);
    } else {
      setWeeklyRequests(requests);
    }
  };

  useEffect(() => {
    if (!supplierId) {
      console.warn('Proveedor no autenticado. Redirigiendo...');
      return;
    }

    fetchProducts();
    fetchSales();
    fetchRequests();
  }, []);

  const totalSales = sales.reduce((acc, s) => acc + Number(s.amount), 0);
  const productsOutOfStock = productStocks.filter(
    p => p.productqty === 0
  ).length;

  const groupedSales = sales.reduce((acc, sale) => {
    const date = new Date(sale.trx_date);
    const key =
      date.toLocaleString('default', { month: 'short' }) +
      ' ' +
      date.getFullYear();
    acc[key] = (acc[key] || 0) + Number(sale.amount);
    return acc;
  }, {});

  const monthlyData = Object.entries(groupedSales).map(([mes, total]) => ({
    mes,
    total,
  }));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', p: 2 }}>
      {/* Columna izquierda */}
      <Box sx={{ flex: 2, p: 2, backgroundColor: '#f5f5f5' }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <DashboardCard
              icon={<InventoryIcon />}
              title="Productos activos"
              value={products.length}
              color="blue"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <DashboardCard
              icon={<PaidIcon />}
              title="Ventas este mes"
              value={`$${totalSales.toLocaleString()}`}
              color="green"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <DashboardCard
              icon={<WarningIcon />}
              title="Productos sin stock"
              value={productsOutOfStock}
              color="red"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <DashboardCard
              icon={<ListAltIcon />}
              title="Solicitudes esta semana"
              value={weeklyRequests.length}
              color="blue"
            />
          </Grid>
        </Grid>

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
        <Paper sx={{ p: 2, height: '100%' }}>
          <Typography
            variant="h6"
            sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center' }}
          >
            Solicitudes Recientes
          </Typography>
          <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
            {weeklyRequests.length === 0 ? (
              <Typography variant="body2" align="center" color="text.secondary">
                No hay solicitudes esta semana.
              </Typography>
            ) : (
              weeklyRequests.map((req, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: index === 0 ? '1px solid #ddd' : 'none',
                    borderBottom: '1px solid #ddd',
                    py: 1,
                    px: 1.5,
                  }}
                >
                  <Typography fontWeight="bold">
                    {req.productqty ?? 'N/A'} ·{' '}
                    {req.products?.productnm || 'Producto'}
                  </Typography>
                  <Box textAlign="right">
                    <Typography fontWeight="bold">
                      {req.sellers?.sellernm || 'Cliente'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {getTimeAgo(req.createddt)}
                    </Typography>
                  </Box>
                </Box>
              ))
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default ProviderHome;
