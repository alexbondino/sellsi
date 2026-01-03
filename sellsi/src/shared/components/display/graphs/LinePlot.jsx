import React, { useMemo } from 'react';
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

// Valores mínimos para el eje Y
const MIN_Y_MAX_CURRENCY = 10000; // $10K mínimo
const MIN_Y_MAX_NON_CURRENCY = 5;

// ✅ Este valor controla cuán a la izquierda queda el eje Y.
// Menor = más a la izquierda (pero si es muy bajo, puede cortar labels).
const Y_MARGIN_LEFT_CURRENCY = 0;
const Y_MARGIN_LEFT_NON_CURRENCY = 0;

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
  const handlePeriodChange = (event, newPeriod) => {
    if (newPeriod !== null && onPeriodChange) {
      onPeriodChange(newPeriod);
    }
  };

  // ✅ Normaliza valores a number
  const safeData = useMemo(
    () =>
      (data || []).map(d => ({
        ...d,
        value: Number(d.value),
      })),
    [data]
  );

  // ✅ Dominio Y robusto con +20% de margen
  const yMax = useMemo(() => {
    const values = safeData.map(d => d.value).filter(v => Number.isFinite(v));

    if (!values.length) {
      return isCurrency ? MIN_Y_MAX_CURRENCY : MIN_Y_MAX_NON_CURRENCY;
    }

    const maxValue = Math.max(...values);
    const minFloor = isCurrency ? MIN_Y_MAX_CURRENCY : MIN_Y_MAX_NON_CURRENCY;

    if (maxValue > 0) {
      return Math.max(maxValue * 1.2, minFloor);
    }

    return minFloor;
  }, [safeData, isCurrency]);

  // ✅ Formato corto para eje Y (reduce ancho de labels => evita que el eje se corra)
  const formatAxisValue = value => {
    const n = Number(value);
    if (!Number.isFinite(n)) return '-';

    if (isCurrency) {
      if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}MM`;
      if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
      return `$${n}`;
    }

    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}MM`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return n.toLocaleString('es-CL');
  };

  // ✅ Formato completo para métricas / tooltip
  const formatValue = value => {
    const n = Number(value);
    if (!Number.isFinite(n)) return '-';
    return isCurrency ? formatCurrency(n) : n.toLocaleString('es-CL');
  };

  // ✅ Margen izquierdo final del chart (mueve el eje Y)
  const chartLeft = isCurrency
    ? Y_MARGIN_LEFT_CURRENCY
    : Y_MARGIN_LEFT_NON_CURRENCY;

  if (loading) {
    return (
      <Paper sx={{ p: 2, borderRadius: 3, height: '100%' }}>
        <Skeleton variant="text" width={200} height={28} />
        <Skeleton
          variant="rectangular"
          height={200}
          sx={{ mt: 1.5, borderRadius: 2 }}
        />
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
      {/* Header (SIN padding extra a la izquierda) */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1.5,
          flexWrap: 'wrap',
          gap: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {icon}
          <Typography variant="h6" fontWeight={600}>
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
              },
            }}
          >
            <ToggleButton value={7}>7d</ToggleButton>
            <ToggleButton value={30}>30d</ToggleButton>
            <ToggleButton value="ytd">YTD</ToggleButton>
          </ToggleButtonGroup>
        )}
      </Box>

      {/* Resumen */}
      {summaryItems.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            gap: 3,
            mb: 1.5,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {summaryItems.map((item, i) => (
            <Box key={i} sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                {item.label}
              </Typography>
              <Typography
                fontWeight={600}
                sx={{ fontSize: '0.95rem' }}
                color={item.color || 'text.primary'}
              >
                {formatValue(item.value)}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* Chart */}
      <Box sx={{ flexGrow: 1, minHeight: 180 }}>
        {safeData.length > 0 ? (
          <LineChart
            dataset={safeData}
            xAxis={[
              {
                dataKey: 'dateLabel',
                scaleType: 'band',
                tickLabelStyle: {
                  fontSize: 10,
                  angle: period > 14 || period === 'ytd' ? -45 : 0,
                  textAnchor:
                    period > 14 || period === 'ytd' ? 'end' : 'middle',
                },
              },
            ]}
            yAxis={[
              {
                min: 0,
                max: yMax,
                tickLabelStyle: { fontSize: 10 },
                valueFormatter: v => formatAxisValue(v),
              },
            ]}
            series={[
              {
                dataKey: 'value',
                color,
                showMark: true,
                curve: 'linear',
                valueFormatter: v => formatValue(v),
              },
            ]}
            height={200}
            margin={{
              left: chartLeft, // ✅ aquí se corrige “muy a la derecha”
              right: 16,
              top: 10,
              bottom: period > 14 || period === 'ytd' ? 45 : 30,
            }}
            sx={{
              width: '100%',
              '& .MuiLineElement-root': { strokeWidth: 2 },
              '& .MuiMarkElement-root': {
                stroke: color,
                strokeWidth: 2,
                fill: 'white',
                r: 3,
              },
            }}
            slotProps={{ legend: { hidden: true } }}
          />
        ) : (
          <Box
            sx={{
              minHeight: 180,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'grey.50',
              borderRadius: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {emptyMessage}
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default LinePlot;
