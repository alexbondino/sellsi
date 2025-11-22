import React from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export default function StatCard({
  title,
  value,
  interval,
  trend,
  data,
  icon,
}) {
  const theme = useTheme();

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

  let displayIcon = icon;
  let displayColor = trendColors[trend];

  if (title?.toLowerCase().includes('sin stock')) displayColor = '#f44336';
  if (title?.toLowerCase().includes('solicitud')) displayColor = '#1976d2';

  return (
    <Card variant="outlined" sx={{ height: '100%', flexGrow: 1 }}>
      <CardContent
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          {displayIcon && (
            <Box
              component={displayIcon}
              sx={{ fontSize: 28, color: displayColor, opacity: 0.85 }}
            />
          )}

          <Typography
            component="h2"
            variant="subtitle2"
            sx={{ fontWeight: 700, fontSize: 'clamp(0.8rem, 1.3vw, 1.3rem)' }}
          >
            {title}
          </Typography>
        </Box>

        {/* Valor centrado */}
        <Stack
          direction="row"
          sx={{
            flexGrow: 1,
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            overflow: 'hidden', // 🔥 evita que desaparezca
            minHeight: '60px', // 🔥 asegura espacio mínimo
          }}
        >
          <Typography
            variant="h3"
            component="p"
            sx={{
              fontWeight: 800,
              // 🔥 escala más agresivamente para pantallas estrechas
              fontSize: 'clamp(2rem, 3vw, 6rem)',
              textAlign: 'center',
              lineHeight: 1,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              maxWidth: '100%', // 🔥 evita salto o desaparición
            }}
          >
            {value}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
