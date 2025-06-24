import React from 'react';
import { Card, CardContent } from '@mui/material';
import { LazyImage } from '../../components/shared';

/**
 * ====================================================================================
 * PROVIDER LOGO - LOGO DE PROVEEDOR
 * ============================================================================
 *
 * Componente UI puro para mostrar logos de proveedores en grid de proveedores
 *
 * @component
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.provider - Objeto con información del proveedor
 * @param {string} props.provider.src - URL de la imagen del logo
 * @param {string} props.provider.alt - Texto alternativo de la imagen
 *
 * CARACTERÍSTICAS:
 * - Componente memoizado para rendimiento óptimo
 * - Cards con diseño Material UI consistente
 * - Efectos hover con animaciones suaves
 * - Dimensiones responsivas por breakpoint
 * - Gradientes y sombras elegantes
 * - Optimización de imágenes automática
 * - Estados interactivos (hover, active)
 */
const ProviderLogo = React.memo(({ provider }) => (
  <Card
    elevation={2}
    sx={{
      width: { xs: 108, sm: 144, md: 162, lg: 180, xl: 198 }, // -10%
      minHeight: { xs: 72, sm: 90, md: 99, lg: 108, xl: 117 }, // -10%
      maxHeight: 125.2, // Limitar altura máxima de la card
      borderRadius: { xs: 2, sm: 3, md: 4, lg: 4, xl: 4 },
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      border: '2px solid #f0f4f8',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      '&:hover': {
        transform: {
          xs: 'translateY(-4px) scale(1.02)',
          sm: 'translateY(-6px) scale(1.02)',
          md: 'translateY(-8px) scale(1.02)',
          lg: 'translateY(-8px) scale(1.02)',
          xl: 'translateY(-8px) scale(1.02)',
        },
        boxShadow: {
          xs: '0 8px 20px rgba(0,0,0,0.08)',
          sm: '0 12px 25px rgba(0,0,0,0.10)',
          md: '0 16px 30px rgba(0,0,0,0.12)',
          lg: '0 20px 40px rgba(0,0,0,0.12)',
          xl: '0 20px 40px rgba(0,0,0,0.12)',
        },
        borderColor: '#e2e8f0',
        background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
      },
    }}
  >
    <CardContent
      sx={{
        width: '100%',
        height: '100%',
        p: 2, // Padding para que el logo no ocupe el 100%
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <img
        src={provider.src}
        alt={provider.alt}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
        }}
      />
    </CardContent>
  </Card>
));

ProviderLogo.displayName = 'ProviderLogo';

export default ProviderLogo;
