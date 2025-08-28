import React from 'react'
import { Box, Paper, Typography } from '@mui/material'

const ProductInfo = ({ product, isMobile = false }) => {
  const { descripcion = 'Producto de alta calidad con excelentes características y garantía de satisfacción.' } = product

  return (
    <Box sx={{ 
      px: { xs: 0, md: 0 }, 
      mt: { xs: 4, md: 6 }, 
      mb: 6,
      width: '100%' 
    }}>
      <Paper
        elevation={2}
        sx={{
          // Reduce internal padding on mobile to make the paper more full-bleed
          p: { xs: 1, md: 5 },
          borderRadius: 3,
          width: { xs: '100%', md: '70%' },
          maxWidth: '900px',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
          border: '1px solid #e2e8f0',
          position: 'relative',
          overflow: 'hidden',
          margin: '0 auto',
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: 'black',
            mb: 3,
            fontSize: { xs: '1.4rem', sm: '1.4rem', md: '1.4rem' },
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -8,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '23%',
              height: '3px',
              background: '#464646ff',
              borderRadius: '2px',
            },
          }}
        >
          📋 Descripción
        </Typography>
        <Typography
          variant="body1"
          sx={{
            fontSize: { xs: '1rem', sm: '1rem', md: '1rem' },
            lineHeight: 1.8,
            color: '#000000ff',
            textAlign: 'justify',
            hyphens: 'auto',
            wordBreak: 'break-word',
            letterSpacing: '0.5px',
            fontWeight: 400,
            whiteSpace: 'pre-wrap',
          }}
        >
          {descripcion}
        </Typography>
      </Paper>
    </Box>
  )
}

ProductInfo.displayName = 'ProductInfo'

export default ProductInfo
