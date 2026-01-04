import React from 'react';
import { Box, Typography, Paper, Skeleton } from '@mui/material';
import { formatCurrency } from '../../../utils/formatters';

/**
 * HorizontalBarChart - Gráfico de barras horizontales
 * Muestra datos ordenados de mayor a menor con nombre, barra y valor
 */
const HorizontalBarChart = ({
  title,
  icon,
  data = [],
  loading = false,
  isCurrency = true,
  maxItems = 5,
  showOthers = true,
  barColor = '#5B8DEF',
  emptyMessage = 'No hay datos disponibles',
}) => {
  // Procesar datos: ordenar y agrupar "Otros" si es necesario
  const processedData = React.useMemo(() => {
    if (!data || data.length === 0) return [];

    // Ordenar de mayor a menor
    const sorted = [...data].sort((a, b) => b.value - a.value);

    if (!showOthers || sorted.length <= maxItems) {
      return sorted.slice(0, maxItems);
    }

    // Tomar los primeros maxItems-1 y agrupar el resto en "Otros"
    const top = sorted.slice(0, maxItems - 1);
    const others = sorted.slice(maxItems - 1);
    const othersTotal = others.reduce((sum, item) => sum + item.value, 0);

    if (othersTotal > 0) {
      return [...top, { label: 'Otros', value: othersTotal }];
    }

    return top;
  }, [data, maxItems, showOthers]);

  // Calcular el valor máximo para las barras
  const maxValue = React.useMemo(() => {
    if (processedData.length === 0) return 0;
    return Math.max(...processedData.map(d => d.value));
  }, [processedData]);

  // Calcular el total
  const total = React.useMemo(() => {
    return processedData.reduce((sum, item) => sum + item.value, 0);
  }, [processedData]);

  // Formatear valor
  const formatValue = value => {
    if (isCurrency) {
      return formatCurrency(value);
    }
    return value.toLocaleString('es-CL');
  };

  if (loading) {
    return (
      <Paper sx={{ p: 2, borderRadius: 3, height: '100%' }}>
        <Skeleton variant="text" width={180} height={28} />
        <Box sx={{ mt: 2 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <Box key={i} sx={{ mb: 1.5 }}>
              <Skeleton variant="text" width={100} height={20} />
              <Skeleton
                variant="rectangular"
                height={16}
                sx={{ borderRadius: 1 }}
              />
            </Box>
          ))}
        </Box>
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        p: 2,
        borderRadius: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {icon}
          <Typography variant="h6" fontWeight={600}>
            {title}
          </Typography>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {processedData.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexGrow: 1,
              minHeight: 150,
            }}
          >
            <Typography color="text.secondary" variant="body2">
              {emptyMessage}
            </Typography>
          </Box>
        ) : (
          <>
            {/* Bars */}
            <Box sx={{ flexGrow: 1 }}>
              {processedData.map((item, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 1.5,
                    gap: 1.5,
                  }}
                >
                  {/* Label */}
                  <Typography
                    variant="body2"
                    sx={{
                      minWidth: 80,
                      maxWidth: 100,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: 'text.primary',
                      fontWeight: 500,
                      fontSize: '0.85rem',
                    }}
                    title={item.label}
                  >
                    {item.label}
                  </Typography>

                  {/* Bar container */}
                  <Box
                    sx={{
                      flexGrow: 1,
                      height: 20,
                      bgcolor: 'grey.100',
                      borderRadius: 1,
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    {/* Bar fill */}
                    <Box
                      sx={{
                        height: '100%',
                        width:
                          maxValue > 0
                            ? `${(item.value / maxValue) * 100}%`
                            : '0%',
                        bgcolor: barColor,
                        borderRadius: 1,
                        transition: 'width 0.3s ease-in-out',
                        minWidth: item.value > 0 ? 4 : 0,
                      }}
                    />
                  </Box>

                  {/* Value */}
                  <Typography
                    variant="body2"
                    sx={{
                      minWidth: 70,
                      textAlign: 'right',
                      fontWeight: 600,
                      color: 'text.primary',
                      fontSize: '0.85rem',
                    }}
                  >
                    {formatValue(item.value)}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Total */}
            <Box
              sx={{
                mt: 'auto',
                pt: 1.5,
                borderTop: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <Typography variant="body1" fontWeight={600} color="primary.main">
                {formatValue(total)}
              </Typography>
            </Box>
          </>
        )}
      </Box>
    </Paper>
  );
};

export default HorizontalBarChart;
