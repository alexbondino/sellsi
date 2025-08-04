import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  useMediaQuery,
} from '@mui/material';


/**
 * Componente para mostrar las regiones de despacho del producto
 * Muestra regiones, precios y días de entrega en formato de tabla
 * Solo se muestra cuando el usuario está logueado
 */
const ProductShipping = ({ product, isMobile = false, isLoggedIn = false }) => {
  const theme = useTheme();
  const isMobileBreakpoint = useMediaQuery(theme.breakpoints.down('md'));
  const isActuallyMobile = isMobile || isMobileBreakpoint;

  // Extraer las regiones de despacho del producto
  const shippingRegions = product?.shippingRegions || 
                         product?.delivery_regions || 
                         product?.shipping_regions || 
                         product?.product_delivery_regions ||
                         [];

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

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(value || 0);
  };

  // Si no hay regiones de despacho o el usuario no está logueado, no mostrar el componente
  if (!isLoggedIn || !shippingRegions || shippingRegions.length === 0) {
    return null;
  }

  return (
    <Box sx={{ 
      px: { xs: 2, md: 0 }, 
      mt: { xs: 4, md: 6 }, 
      mb: 6,
      width: '100%' 
    }}>
      <Paper
        elevation={2}
        sx={{
          p: { xs: 3, sm: 4, md: 5 },
          borderRadius: 3,
          width: { xs: '100%', md: '70%' },
          maxWidth: '900px',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
          border: '1px solid #e2e8f0',
          position: 'relative',
          overflow: 'hidden',
          margin: '0 auto',
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: 'black',
            mb: 3,
            fontSize: { xs: '1.5rem', sm: '1.5rem', md: '1.5rem' },
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -8,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '45%',
              height: '3px',
              background: '#464646ff',
              borderRadius: '2px',
            },
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '1.3em', marginRight: 8 }}>🚚</span>
            Regiones de Despacho
          </span>
        </Typography>

        <Box sx={{ mt: 3 }}>
          <TableContainer 
            component={Paper} 
            elevation={0}
            sx={{ 
              border: '1px solid',
              borderColor: 'grey.300',
              borderRadius: 2,
              backgroundColor: 'white',
            }}
          >
            <Table size={isActuallyMobile ? "small" : "medium"}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell 
                    sx={{ 
                      fontWeight: 600, 
                      py: { xs: 1, md: 1.5 },
                      fontSize: '1rem'
                    }}
                  >
                    Región
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontWeight: 600, 
                      py: { xs: 1, md: 1.5 },
                      fontSize: '1rem'
                    }}
                  >
                    Precio
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontWeight: 600, 
                      py: { xs: 1, md: 1.5 },
                      fontSize: '1rem'
                    }}
                  >
                    Tiempo despacho
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {shippingRegions.map((region, index) => (
                  <TableRow 
                    key={region.region || region.id || index}
                    sx={{ 
                      '&:hover': { bgcolor: 'grey.50' },
                      '&:last-child td': { border: 0 }
                    }}
                  >
                    <TableCell sx={{ py: { xs: 1, md: 1.5 } }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: { xs: 0.5, md: 1 },
                        flexDirection: { xs: 'column', sm: 'row' }
                      }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 700,
                            color: 'primary.main',
                            minWidth: '32px',
                            textAlign: 'center',
                            fontSize: '1rem'
                          }}
                        >
                          {getRegionRomanNumber(region.region)}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 500,
                            fontSize: '1rem',
                            textAlign: { xs: 'center', sm: 'left' }
                          }}
                        >
                          {region.regionLabel || region.region}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: { xs: 1, md: 1.5 } }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 600,
                          fontSize: '1rem',
                          color: 'black'
                        }}
                      >
                        {formatCurrency(region.shippingValue || region.price)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: { xs: 1, md: 1.5 } }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 500,
                          fontSize: '1rem',
                          color: 'text.primary'
                        }}
                      >
                        {region.maxDeliveryDays || region.delivery_days || 'N/A'} días
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
        
        {/* Nota explicativa */}
        <Typography 
          variant="body2" 
          sx={{ 
            mt: 3,
            color: 'text.secondary',
            fontSize: '1rem',
            textAlign: 'center'
          }}
        >
          <i>El tiempo de despacho indicado es un estimado y se considera en días hábiles.</i>
        </Typography>
      </Paper>
    </Box>
  );
};

export default ProductShipping;
