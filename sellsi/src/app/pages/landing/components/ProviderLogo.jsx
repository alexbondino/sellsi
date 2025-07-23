import React from 'react'
import { Card, CardContent } from '@mui/material'
import { LazyImage } from '../../../../shared/components/display';

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
      width: { xs: 144, sm: 144, md: 162, lg: 180, xl: 180 },
      height: { xs: 144, sm: 144, md: 162, lg: 180, xl: 180 },
      borderRadius: { xs: 2, sm: 3, md: 4, lg: 4, xl: 4 },
      overflow: 'hidden',
      background: 'transparent',
      border: '2px solid #f0f4f8',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
        borderColor: '#ffffff',
        background: 'transparent',
      },
    }}
  >
    <CardContent
      sx={{
        width: '100%',
        height: '100%',
        p: 0, // Sin padding para centrado perfecto
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative', // Necesario para overlay
        '&:last-child': {
          paddingBottom: 0, // Eliminar padding bottom por defecto de CardContent
        },
      }}
    >
      <img
        src={provider.src}
        alt={provider.alt}
        style={{
          width: '85%', // Reducir ligeramente para mejor presentación
          height: '85%', // Reducir ligeramente para mejor presentación
          objectFit: 'contain', // Mantener aspecto de la imagen
          display: 'block',
          zIndex: 1,
          position: 'relative',
        }}
      />
      {/* Overlay de color sutil */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(120, 120, 120, 0.18)', // Gris sutil
          pointerEvents: 'none',
          zIndex: 2,
          borderRadius: 'inherit',
        }}
      />
    </CardContent>
  </Card>
));

ProviderLogo.displayName = 'ProviderLogo';

export default ProviderLogo;
