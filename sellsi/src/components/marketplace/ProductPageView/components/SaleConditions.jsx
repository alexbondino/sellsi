import React from 'react'
import { Box, Typography, Grid, Card, CardContent } from '@mui/material'
import { Receipt, ShoppingCart } from '@mui/icons-material'

const SaleConditions = ({ product }) => {
  if (!product) return null
  // Generate random sale conditions
  const generateSaleConditions = () => {
    const documents = ['Boleta', 'Factura', 'Cualquiera']
    const document = documents[Math.floor(Math.random() * documents.length)]
    const minPurchase = Math.floor(Math.random() * 343) + 1

    return [
      {
        icon: <Receipt />,
        title: 'Documento de Venta',
        value: document,
        color: 'primary',
      },
      {
        icon: <ShoppingCart />,
        title: 'Compra Mínima',
        value: `${minPurchase} unidades`,
        color: 'info',
      },
    ]
  }

  const conditions = generateSaleConditions()

  return (
    <Box sx={{ mt: 6, mb: 6 }}>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          color: 'text.primary',
          mb: 4,
          textAlign: 'center',
        }}
      >
        Condiciones de Venta
      </Typography>

      <Grid
        container
        spacing={3}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'stretch',
        }}
      >
        {conditions.map((condition, index) => (
          <Grid item xs={12} sm={6} md={3} key={index} sx={{ display: 'flex' }}>
            {' '}
            <Card
              elevation={1}
              sx={{
                height: '100%',
                width: '100%',
                maxWidth: '280px',
                minHeight: '140px',
                display: 'flex',
                flexDirection: 'column',
                margin: '0 auto',
                border: `1px solid`,
                borderColor: 'grey.200',
              }}
            >
              <CardContent
                sx={{
                  textAlign: 'left',
                  p: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  height: '100%',
                }}
              >
                {/* Icon */}
                <Box
                  sx={{
                    color: `${condition.color}.main`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    flexShrink: 0,
                  }}
                >
                  {condition.icon}
                </Box>

                {/* Content */}
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      color: 'text.secondary',
                      mb: 0.5,
                      fontSize: '0.875rem',
                    }}
                  >
                    {condition.title}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: 'text.primary',
                      lineHeight: 1.2,
                    }}
                  >
                    {condition.value}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

export default SaleConditions
