import React from 'react'
import { Box, Typography, Grid, Card, CardContent, Chip } from '@mui/material'
import {
  CheckCircle,
  AttachMoney,
  Description,
  Schedule,
  Inventory,
} from '@mui/icons-material'
import {
  generateSalesCharacteristics,
  formatSalesDataForDisplay,
} from '../../../../utils/marketplace/salesDataGenerator'

const SalesCharacteristics = ({ product }) => {
  if (!product) return null

  // Generate random sales characteristics
  const salesData = generateSalesCharacteristics(product)
  const formattedData = formatSalesDataForDisplay(salesData)

  return (
    <Box>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          color: 'text.primary',
          mb: 3,
          textAlign: 'center',
        }}
      >
        Data Histórica de este producto
      </Typography>{' '}
      <Grid
        container
        spacing={3}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'stretch',
        }}
      >
        {' '}
        {formattedData.map((char, index) => (
          <Grid xs={12} sm={6} md={4} key={index} sx={{ display: 'flex' }}>
            <Card
              elevation={2}
              sx={{
                height: '100%',
                width: '100%',
                maxWidth: '380px',
                minHeight: '280px',
                display: 'flex',
                flexDirection: 'column',
                margin: '0 auto',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                },
              }}
            >
              {' '}
              <CardContent
                sx={{
                  textAlign: 'center',
                  py: 3,
                  px: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                  height: '100%',
                  minHeight: '240px',
                }}
              >
                {' '}
                {/* Icon */}
                <Box
                  sx={{
                    p: 2,
                    borderRadius: '50%',
                    bgcolor: `${char.color}.light`,
                    color: `${char.color}.main`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    width: '80px',
                    height: '80px',
                    flexShrink: 0,
                  }}
                >
                  {char.icono}
                </Box>
                {/* Title */}
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: 'text.primary',
                    textAlign: 'center',
                    lineHeight: 1.2,
                    minHeight: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    flexGrow: 1,
                  }}
                >
                  {char.titulo}
                </Typography>
                {/* Value */}
                <Box sx={{ textAlign: 'center', flexShrink: 0 }}>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      color: `${char.color}.main`,
                      mb: 0.5,
                    }}
                  >
                    {char.valor}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontWeight: 500 }}
                  >
                    {char.sufijo}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      {/* Additional Sales Info */}
      <Box
        sx={{
          mt: 4,
          p: 3,
          bgcolor: 'grey.50',
          borderRadius: 2,
          textAlign: 'center',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            mb: 1,
          }}
        >
          <CheckCircle color="success" fontSize="small" />
          <Typography variant="body1" fontWeight={600} color="success.main">
            Datos Verificados
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Toda la información de ventas es generada dinámicamente para
          demostración
        </Typography>
      </Box>
    </Box>
  )
}

export default SalesCharacteristics
