import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

/* Requisitos de contraseña segura, mergear con el componente principal de password */

const PasswordRequirements = ({ password, size = 'normal' }) => {
  const theme = useTheme();
  const isSmall = size === 'small';

  const requisitos = [
    { label: 'Al menos 8 caracteres', valid: password.length >= 8 },
    { label: 'Letras minúsculas (a-z)', valid: /[a-z]/.test(password) },
    { label: 'Letras mayúsculas (A-Z)', valid: /[A-Z]/.test(password) },
    { label: 'Números (0-9)', valid: /\d/.test(password) },
  ];

  return (
    <Box sx={{ mb: isSmall ? 1 : 2 }}>
      <Typography
        variant={isSmall ? 'caption' : 'body2'}
        sx={{
          mb: 0.5,
          color: '#666',
          fontSize: isSmall ? 11 : 13,
        }}
      >
        La contraseña debe cumplir:
      </Typography>{' '}
      {/* Layout responsivo: 2x2 grid para xs y sm, vertical para md+ */}
      <Box
        sx={{
          // xs, sm y md: Grid de 2 columnas y 2 filas
          [theme.breakpoints.down('lg')]: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: '1fr 1fr',
            gap: 0.3,
            alignItems: 'start',
          },
          // lg y xl: Layout vertical original
          [theme.breakpoints.up('lg')]: {
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {' '}
        {requisitos.map((req, index) => (
          <Box
            key={index}
            display="flex"
            alignItems="center"
            sx={{
              mb: { xs: 0.1, sm: 0.1, md: 0.1, lg: 0.2, xl: 0.2 },
              // Para xs, sm y md: reducir spacing entre elementos
              [theme.breakpoints.down('lg')]: {
                minHeight: 20,
              },
            }}
          >
            {req.valid ? (
              <CheckCircleIcon
                sx={{
                  fontSize: isSmall ? 14 : 16,
                  color: '#4caf50',
                  mr: 0.5,
                  // Para xs, sm y md: iconos más pequeños
                  [theme.breakpoints.down('lg')]: {
                    fontSize: 14,
                    mr: 0.3,
                  },
                }}
              />
            ) : (
              <CancelIcon
                sx={{
                  fontSize: isSmall ? 14 : 16,
                  color: '#f44336',
                  mr: 0.5,
                  // Para xs, sm y md: iconos más pequeños
                  [theme.breakpoints.down('lg')]: {
                    fontSize: 14,
                    mr: 0.3,
                  },
                }}
              />
            )}{' '}
            <Typography
              variant={isSmall ? 'caption' : 'body2'}
              sx={{
                color: req.valid ? '#4caf50' : '#f44336',
                fontSize: isSmall ? 10 : 12,
                // Solo para xs y sm: texto más pequeño
                [theme.breakpoints.down('md')]: {
                  fontSize: 10,
                  lineHeight: 1.2,
                },
              }}
            >
              {req.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default PasswordRequirements;
