import React from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate } from 'react-router-dom';

export default function StatCard({
  title,
  value,
  interval,
  trend,
  data,
  icon,
  linkTo,
  linkLabel,
}) {
  const theme = useTheme();
  const navigate = useNavigate();

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

  // Colores específicos por tipo de card
  if (title?.toLowerCase().includes('ventas este mes'))
    displayColor = '#2E7D32'; // Verde
  if (title?.toLowerCase().includes('monto por liberar'))
    displayColor = '#2E7D32'; // Verde
  if (title?.toLowerCase().includes('sin stock')) displayColor = '#f44336'; // Rojo
  if (title?.toLowerCase().includes('solicitud')) displayColor = '#2E52B2'; // Azul
  if (title?.toLowerCase().includes('oferta')) displayColor = '#7B1FA2'; // Púrpura

  return (
    <Card
      variant="outlined"
      sx={{ height: '100%', flexGrow: 1, position: 'relative' }}
    >
      <CardContent
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          pb: linkTo ? '36px !important' : undefined, // Espacio para el botón absoluto
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
            overflow: 'hidden',
            minHeight: '60px',
          }}
        >
          <Typography
            variant="h3"
            component="p"
            sx={{
              fontWeight: 800,
              fontSize: 'clamp(2rem, 3vw, 3rem)',
              textAlign: 'center',
              lineHeight: 1,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              maxWidth: '100%',
            }}
          >
            {value}
          </Typography>
        </Stack>
      </CardContent>

      {/* Botón de enlace opcional - posición absoluta */}
      {linkTo && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 8,
            left: 16,
          }}
        >
          <Button
            size="small"
            endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
            onClick={() => navigate(linkTo)}
            sx={{
              textTransform: 'none',
              fontSize: '0.75rem',
              color: 'primary.main',
              p: 0,
              minWidth: 'auto',
              '&:hover': {
                bgcolor: 'transparent',
                textDecoration: 'underline',
              },
            }}
          >
            {linkLabel || 'Ver más'}
          </Button>
        </Box>
      )}
    </Card>
  );
}
