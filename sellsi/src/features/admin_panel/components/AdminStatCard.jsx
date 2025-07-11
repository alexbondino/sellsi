/**
 * 📊 Tarjeta de Estadísticas Simple para Admin Panel
 * 
 * Componente simplificado para mostrar estadísticas en el panel administrativo
 * sin las dependencias complejas del StatCard original.
 * 
 * @author Panel Administrativo Sellsi
 * @date 10 de Julio de 2025
 */

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  useTheme
} from '@mui/material';

const AdminStatCard = ({ title, value, icon: IconComponent, color = 'primary' }) => {
  const theme = useTheme();

  const getColorValue = (colorName) => {
    switch (colorName) {
      case 'primary':
        return theme.palette.primary.main;
      case 'success':
        return theme.palette.success.main;
      case 'error':
        return theme.palette.error.main;
      case 'warning':
        return theme.palette.warning.main;
      case 'info':
        return theme.palette.info.main;
      default:
        return theme.palette.primary.main;
    }
  };

  const colorValue = getColorValue(color);

  return (
    <Card 
      variant="outlined" 
      sx={{ 
        height: '100%',
        borderLeft: `4px solid ${colorValue}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: theme.shadows[4],
          transform: 'translateY(-2px)'
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography 
              variant="h4" 
              component="div"
              sx={{ 
                fontWeight: 'bold',
                color: colorValue,
                mb: 1
              }}
            >
              {value}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontWeight: 'medium' }}
            >
              {title}
            </Typography>
          </Box>
          
          {IconComponent && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: '50%',
                backgroundColor: `${colorValue}15`,
                color: colorValue
              }}
            >
              <IconComponent sx={{ fontSize: 24 }} />
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default AdminStatCard;
