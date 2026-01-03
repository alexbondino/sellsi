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

const MIN_Y_MAX_CURRENCY = 100000;
const MIN_Y_MAX_NON_CURRENCY = 10;

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

  // ✅ Dominio Y robusto (0 → max, con piso mínimo distinto según moneda / no-moneda)
  const yMax = useMemo(() => {
    const values = safeData.map(d => d.value).filter(v => Number.isFinite(v));

    if (!values.length)
      return isCurrency ? MIN_Y_MAX_CURRENCY : MIN_Y_MAX_NON_CURRENCY;

    const maxValue = Math.max(...values);

    if (isCurrency) {
      return Math.max(maxValue, MIN_Y_MAX_CURRENCY);
    }

    // ✅ cuando NO es moneda: rango mínimo 0–10 (por ejemplo "solicitudes")
    return Math.max(maxValue, MIN_Y_MAX_NON_CURRENCY);
  }, [safeData, isCurrency]);

  const formatValue = value => {
    const n = Number(value);
    if (!Number.isFinite(n)) return '-';

    if (isCurrency) return formatCurrency(n);

    return n.toLocaleString('es-CL');
  };

  // ✅ Centrado visual real
  const sideMargin = isCurrency ? 55 : 40;

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
            mb: 2,
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
      <Box sx={{ flexGrow: 1, minHeight: 200 }}>
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
                valueFormatter: v => formatValue(v),
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
            height={220}
            margin={{
              left: sideMargin,
              right: sideMargin,
              top: 15,
              bottom: period > 14 || period === 'ytd' ? 50 : 35,
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
              minHeight: 200,
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
