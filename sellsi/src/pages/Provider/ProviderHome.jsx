import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Grid, Paper } from '@mui/material';
import { supabase } from '../../services/supabase';
import BarChart from '../../components/BarChart';
import PieChart from '../../components/PieChart';

const supplierId = '00000000-0000-0000-0000-000000000001';

const ProviderHome = () => {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [productQty, setProductQty] = useState([]);

  useEffect(() => {
    const fetchClientes = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('supplierid', supplierId);

      if (error) {
        console.error('❌ Error al obtener clientes:', error);
      } else {
        setProducts(data);
      }
    };

    fetchClientes();
  }, []);

  useEffect(() => {
    const fetchSales = async () => {
      const { data, error } = await supabase
        .from('sales')
        .select('amount')
        .eq('supplierid', supplierId);

      if (error) {
        console.error('❌ Error al obtener clientes:', error);
      } else {
        setSales(data);
      }
    };

    fetchSales();
  }, []);

  useEffect(() => {
    const fetchProductQuanity = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('productqty')
        .eq('supplierid', supplierId);

      if (error) {
        console.error('❌ Error al obtener clientes:', error);
      } else {
        setProductQty(data);
      }
    };

    fetchProductQuanity();
  }, []);

  const totalSales = sales.reduce((acc, item) => acc + Number(item.amount), 0);
  const totalBreaks = productQty.filter(p => p.productqty === 0).length;

  return (
    <Box sx={{ p: 4, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Grid container spacing={3}>
        {/* Métricas */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography>Productos activos</Typography>
            <Typography variant="h5">{products.length}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography>Ventas este més</Typography>
            <Typography variant="h5">${totalSales.toLocaleString()}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography>Productos sin stock</Typography>
            <Typography variant="h5">{totalBreaks}</Typography>
          </Paper>
        </Grid>

        {/* Botón nuevo producto */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Button variant="contained">+ Nuevo Producto</Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProviderHome;
