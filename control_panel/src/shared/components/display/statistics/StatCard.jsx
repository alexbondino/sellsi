import React from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
// Iconos para cards específicas
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';

/* Cards de estadística del comprador. Mergear con cards de etadística del proveedor. */

function getDaysInMonth(month, year) {
  const date = new Date(year, month, 0);
  const monthName = date.toLocaleDateString('en-US', {
    month: 'short',
  });
  const daysInMonth = date.getDate();
  const days = [];
  let i = 1;
  while (days.length < daysInMonth) {
    days.push(`${monthName} ${i}`);
    i += 1;
  }
  return days;
}

function AreaGradient({ color, id }) {
  return (
    <defs>
      <linearGradient id={id} x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor={color} stopOpacity={0.3} />
        <stop offset="100%" stopColor={color} stopOpacity={0} />
      </linearGradient>
    </defs>
  );
}

export default function StatCard({
  title,
  value,
  interval,
  trend,
  data,
  icon,
}) {
  const theme = useTheme();
  // const daysInWeek = getDaysInMonth(4, 2024);
  const trendColors = {
    up:
      theme.palette.mode === 'light'
        ? theme.palette.success.main
        : theme.palette.success.dark,
    down:
      theme.palette.mode === 'light'
        ? theme.palette.error.main
        : theme.palette.error.dark,
    neutral:
      theme.palette.mode === 'light'
        ? theme.palette.grey[400]
        : theme.palette.grey[700],
  };

  const labelColors = {
    up: 'success',
    down: 'error',
    neutral: 'default',
  };

  const color = labelColors[trend];
  const chartColor = trendColors[trend];
  const trendValues = { up: '+25%', down: '-25%', neutral: '+5%' };
  
  // Colores específicos para ciertas tarjetas
  let displayIcon = icon;
  let displayColor = chartColor;
  
  // Aplicar colores específicos basados en el título
  if (title) {
    if (title.toLowerCase().includes('sin stock')) {
      displayColor = '#f44336'; // rojo para productos sin stock
    } else if (title.toLowerCase().includes('solicitud') || title.toLowerCase().includes('semanal')) {
      displayColor = '#1976d2'; // azul para solicitudes semanales
    }
  }
  return (
    <Card variant="outlined" sx={{ height: '100%', flexGrow: 1 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          {displayIcon && (
            <Box
              component={displayIcon}
              sx={{
                fontSize: 28,
                color: displayColor,
                opacity: 0.85,
              }}
            />
          )}
          <Typography
            component="h2"
            variant="subtitle2"
            sx={{ fontWeight: 700, fontSize: '1.2rem' }}
          >
            {title}
          </Typography>
        </Box>
        <Stack
          direction="column"
          sx={{ justifyContent: 'space-between', flexGrow: '1', gap: 1 }}
        >
          <Stack sx={{ justifyContent: 'space-between' }}>
            <Stack
              direction="row"
              sx={{ justifyContent: 'space-between', alignItems: 'center' }}
            >
              <Typography variant="h3" component="p" sx={{ fontWeight: 800, fontSize: '2.2rem' }}>
                {value}
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
