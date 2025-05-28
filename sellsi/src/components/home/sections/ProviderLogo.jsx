import React from 'react'
import { Box } from '@mui/material'

// Componente memoizado para logos de proveedores
const ProviderLogo = React.memo(({ provider }) => (
  <Box
    sx={{
      width: { xs: 240, sm: 200, md: 240 },
      height: { xs: 160, sm: 130, md: 160 },
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'white',
      borderRadius: 3,
      padding: 3,
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      border: '1px solid rgba(0,0,0,0.04)',
      '&:hover': {
        transform: 'translateY(-8px)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
      },
    }}
  >
    <img
      src={provider.src}
      alt={provider.alt}
      style={{
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain',
        filter: 'grayscale(1)',
        transition: 'filter 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.target.style.filter = 'grayscale(0)'
      }}
      onMouseLeave={(e) => {
        e.target.style.filter = 'grayscale(1)'
      }}
    />
  </Box>
))

ProviderLogo.displayName = 'ProviderLogo'

export default ProviderLogo
