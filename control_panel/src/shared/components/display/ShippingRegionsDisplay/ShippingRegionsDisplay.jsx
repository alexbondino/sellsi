import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';

/**
 * Componente para mostrar las regiones de despacho configuradas
 */
const ShippingRegionsDisplay = ({ regions = [] }) => {
  // Mapeo de regiones a números romanos según el orden tradicional chileno
  const getRegionRomanNumber = (regionValue) => {
    const romanMap = {
      'arica-parinacota': 'XV',
      'tarapaca': 'I',
      'antofagasta': 'II',
      'atacama': 'III',
      'coquimbo': 'IV',
      'valparaiso': 'V',
      'metropolitana': 'RM',
      'ohiggins': 'VI',
      'maule': 'VII',
      'nuble': 'XVI',
      'biobio': 'VIII',
      'araucania': 'IX',
      'los-rios': 'XIV',
      'los-lagos': 'X',
      'aysen': 'XI',
      'magallanes': 'XII',
    };
    return romanMap[regionValue] || '';
  };

  if (!regions || regions.length === 0) {
    return (
      <Box
        sx={{
          p: 3,
          border: '2px dashed',
          borderColor: 'grey.300',
          borderRadius: 2,
          textAlign: 'center',
          bgcolor: 'grey.50',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          No hay regiones de despacho configuradas
        </Typography>
      </Box>
    );
  }

  const formatCurrency = (value) => {
    // Si el valor es 0, mostrar "GRATIS" en lugar de "$0"
    if (value === 0 || value === '0') {
      return 'GRATIS';
    }
    
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <TableContainer 
      component={Paper} 
      elevation={0}
      sx={{ 
        border: '1px solid',
        borderColor: 'grey.300',
        borderRadius: 2,
      }}
    >
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: 'grey.50' }}>
            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>
              Región
            </TableCell>
            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>
              Valor
            </TableCell>
            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>
              Tiempo
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {regions.map((region, index) => (
            <TableRow 
              key={region.region || index}
              sx={{ 
                '&:hover': { bgcolor: 'grey.50' },
                '&:last-child td': { border: 0 }
              }}
            >
              <TableCell sx={{ py: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 700,
                      color: 'primary.main',
                      minWidth: '32px',
                      textAlign: 'center'
                    }}
                  >
                    {getRegionRomanNumber(region.region)}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {region.regionLabel}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell sx={{ py: 1.5 }}>
                <Typography 
                  variant="body2" 
                  color={region.shippingValue === 0 || region.shippingValue === '0' ? 'success.main' : 'primary.main'} 
                  sx={{ fontWeight: 600 }}
                >
                  {formatCurrency(region.shippingValue)}
                </Typography>
              </TableCell>
              <TableCell sx={{ py: 1.5 }}>
                <Chip
                  label={`${region.maxDeliveryDays} días hábiles`}
                  size="small"
                  variant="outlined"
                  color="primary"
                  sx={{ fontSize: '0.75rem' }}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ShippingRegionsDisplay;
