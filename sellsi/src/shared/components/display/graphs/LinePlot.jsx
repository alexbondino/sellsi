import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Skeleton,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import { formatCurrency } from '../../../utils/formatters';

/**
 * Componente reutilizable de gráfico de líneas con puntos
 *
 * @param {Object} props
 * @param {string} props.title - Título del gráfico
 * @param {React.ReactNode} props.icon - Icono para el título
 * @param {Array} props.data - Array de objetos con { dateLabel, value }
 * @param {boolean} props.loading - Estado de carga
 * @param {number} props.period - Período seleccionado (7, 14, 30)
 * @param {function} props.onPeriodChange - Callback cuando cambia el período
 * @param {string} props.valueLabel - Etiqueta para los valores (ej: "Ventas", "Solicitudes")
 * @param {string} props.color - Color principal del gráfico
 * @param {boolean} props.isCurrency - Si los valores son moneda
 * @param {Array} props.summaryItems - Array de { label, value, color } para mostrar resumen
 * @param {string} props.emptyMessage - Mensaje cuando no hay datos
 */
const LinePlot = ({
  title,
  icon,
  data = [],
  loading = false,
  period = 7,
  onPeriodChange,
  valueLabel = 'Valor',
  color = '#2E52B2',
  isCurrency = false,
  summaryItems = [],
  emptyMessage = 'No hay datos en este período',
}) => {
  const formatValue = value => {
    if (isCurrency) {
      return formatCurrency(value);
    }
    return value.toLocaleString('es-CL');
  };

  const handlePeriodChange = (event, newPeriod) => {
    if (newPeriod !== null && onPeriodChange) {
      onPeriodChange(newPeriod);
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
        <Skeleton variant="text" width={200} height={32} />
        <Skeleton
          variant="rectangular"
          height={250}
          sx={{ mt: 2, borderRadius: 2 }}
        />
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        p: 3,
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
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {icon}
          <Typography variant="h6" fontWeight={600} color="text.primary">
            {title}
          </Typography>
        </Box>

        {onPeriodChange && (
          <ToggleButtonGroup
            value={period}
            exclusive
            onChange={handlePeriodChange}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                textTransform: 'none',
                px: 1.5,
                py: 0.5,
                fontSize: '0.75rem',
              },
              '& .Mui-selected': {
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
              },
            }}
          >
            <ToggleButton value={7}>7d</ToggleButton>
            <ToggleButton value={14}>14d</ToggleButton>
            <ToggleButton value={30}>30d</ToggleButton>
          </ToggleButtonGroup>
        )}
      </Box>

      {/* Resumen de métricas */}
      {summaryItems.length > 0 && (
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          {summaryItems.map((item, index) => (
            <Box key={index}>
              <Typography variant="caption" color="text.secondary">
                {item.label}
              </Typography>
              <Typography
                variant="body1"
                fontWeight={600}
                color={item.color || 'text.primary'}
                sx={{ fontSize: '0.95rem' }}
              >
                {isCurrency
                  ? formatCurrency(item.value)
                  : item.value.toLocaleString('es-CL')}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* Gráfico */}
      <Box sx={{ flexGrow: 1, minHeight: 200 }}>
        {data.length > 0 ? (
          <LineChart
            dataset={data}
            xAxis={[
              {
                dataKey: 'dateLabel',
                scaleType: 'band',
                tickLabelStyle: {
                  fontSize: 10,
                  angle: period > 14 ? -45 : 0,
                  textAnchor: period > 14 ? 'end' : 'middle',
                },
              },
            ]}
            yAxis={[
              {
                tickLabelStyle: { fontSize: 10 },
                valueFormatter: value => formatValue(value),
              },
            ]}
            series={[
              {
                dataKey: 'value',
                label: valueLabel,
                color: color,
                showMark: true,
                curve: 'linear',
                valueFormatter: value => formatValue(value),
              },
            ]}
            height={220}
            margin={{
              left: isCurrency ? 65 : 45,
              right: 15,
              top: 15,
              bottom: period > 14 ? 50 : 35,
            }}
            sx={{
              '& .MuiLineElement-root': {
                strokeWidth: 2,
              },
              '& .MuiMarkElement-root': {
                stroke: color,
                strokeWidth: 2,
                fill: 'white',
                r: 3,
              },
            }}
            slotProps={{
              legend: { hidden: true },
            }}
          />
        ) : (
          <Box
            sx={{
              height: '100%',
              minHeight: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'grey.50',
              borderRadius: 2,
            }}
          >
            <Typography color="text.secondary" variant="body2">
              {emptyMessage}
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default LinePlot;
