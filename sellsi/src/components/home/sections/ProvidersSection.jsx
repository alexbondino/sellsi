import React from 'react'
import { Box, Typography, Grid } from '@mui/material'
import ProviderLogo from './ProviderLogo'
import { PROVIDERS_DATA } from '../../../data/home/constants'

const ProvidersSection = () => {
  return (
    <Box
      sx={{
        backgroundColor: '#f8f9fa',
        px: { xs: 2, sm: 4, md: 8, lg: 15, xl: 30 },
        py: { xs: 6, md: 8 },
      }}
    >
      <Typography
        variant="h3"
        fontWeight="bold"
        gutterBottom
        sx={{
          fontSize: { xs: '2rem', md: '2.5rem' },
          textAlign: 'center',
          mb: { xs: 4, md: 6 },
          color: 'common.black',
        }}
      >
        Conoce a nuestros proveedores
      </Typography>{' '}
      <Grid container spacing={4} justifyContent="center">
        {PROVIDERS_DATA.map((provider, index) => (
          <Grid
            item
            xs={12}
            sm={6}
            md={4}
            lg={3}
            key={index}
            sx={{
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <ProviderLogo provider={provider} />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

export default ProvidersSection
