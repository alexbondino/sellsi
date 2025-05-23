import React from 'react';
import { Box, Typography } from '@mui/material';

const BarChart = ({ products }) => {
  return (
    <Box sx={{ height: 300, backgroundColor: '#e0f7fa', p: 2 }}>
      <Typography variant="h6">[Gráfico de barras]</Typography>
      <Typography variant="body2">Productos: {products.length}</Typography>
    </Box>
  );
};

export default BarChart;
