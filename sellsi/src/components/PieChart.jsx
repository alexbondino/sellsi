import React from 'react';
import { Box, Typography } from '@mui/material';

const PieChart = ({ requests }) => {
  return (
    <Box sx={{ height: 300, backgroundColor: '#fff3e0', p: 2 }}>
      <Typography variant="h6">[Gráfico de pastel]</Typography>
      <Typography variant="body2">Solicitudes: {requests.length}</Typography>
    </Box>
  );
};

export default PieChart;
