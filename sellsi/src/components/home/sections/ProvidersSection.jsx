import React from 'react'
import { Box, Typography, Grid, Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import ProviderLogo from './ProviderLogo'
import StatisticCard from './StatisticCard'
import { PROVIDERS_DATA } from '../../../data/home/constants.jsx'

const ProvidersSection = ({ statistics }) => {
  const navigate = useNavigate()

  return (
    <Box
      sx={{
        backgroundColor: '#f8f9fa',
        px: { xs: 2, sm: 4, md: 8, lg: 15, xl: 30 },
        py: { xs: 6, sm: 7, md: 8, lg: 8, xl: 8 },
        position: 'relative',
        // ✅ PADDING EXTRA ARRIBA PARA DAR ESPACIO AL BOTÓN Y ESTADÍSTICAS
        paddingTop: {
          xs: 6,
          sm: 7,
          md: 8,
          lg: 20, // Espacio extra para el botón y estadísticas
          xl: 25,
        },
        // ✅ PSEUDO-ELEMENTO PARA EXTENDER EL FONDO GRIS HACIA ARRIBA
        '&::before': {
          content: '""',
          position: 'absolute',
          top: {
            xs: 0,
            sm: 0,
            md: 0,
            lg: '-200px', // Se extiende hacia arriba
            xl: '-250px', // Se extiende hacia arriba
          },
          left: 0,
          right: 0,
          height: {
            xs: 0,
            sm: 0,
            md: 0,
            lg: '200px', // Altura de la extensión del fondo gris
            xl: '250px', // Altura de la extensión del fondo gris
          },
          backgroundColor: '#f8f9fa', // Mismo color gris
          zIndex: -1, // Z-index negativo para que esté DETRÁS del contenido
        },
      }}
    >
      {/* Botón y Estadísticas - Solo visible en desktop */}
      <Box
        sx={{
          display: {
            xs: 'none',
            sm: 'none',
            md: 'none',
            lg: 'flex',
            xl: 'flex',
          },
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: { xs: 2, sm: 4, md: 8, lg: 0, xl: 5 },
          mb: { xs: 2, sm: 4, md: 8, lg: 12, xl: 10 },
          mt: { xs: 2, sm: 4, md: 8, lg: -18, xl: -20 },
          ml: { xs: 0, sm: 0, md: 0, lg: 15.8, xl: 0 },
          width: '100%',
          maxWidth: { xs: '100%', sm: '100%', md: '100%', lg: 600, xl: 700 },
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Button
          variant="contained"
          sx={{
            backgroundColor: 'primary.main',
            fontWeight: 'bold',
            borderRadius: '8px',
            px: { xs: 2, sm: 4, md: 8, lg: 11, xl: 12 },
            py: { xs: 2, sm: 4, md: 8, lg: 2.4, xl: 2.6 },
            mr: { xs: 2, sm: 4, md: 8, lg: 16, xl: 10 },
            fontSize: { lg: '1.58rem', xl: '1.7rem' },
            textTransform: 'none',
            boxShadow: '0 4px 15px rgba(25, 118, 210, 0.3)',
            flexShrink: 0,
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)',
            },
          }}
          onClick={() => navigate('/marketplace')}
        >
          Ir a marketplace
        </Button>

        <Box
          sx={{
            display: 'flex',
            flexDirection: {
              xs: 'column',
              sm: 'column',
              md: 'row',
              lg: 'row',
              xl: 'row',
            },
            gap: { xs: 2, sm: 3, md: 4, lg: 4, xl: 5 },
            alignItems: {
              xs: 'center',
              sm: 'center',
              md: 'center',
              lg: 'center',
              xl: 'center',
            },
            justifyContent: {
              xs: 'center',
              sm: 'center',
              md: 'flex-start',
              lg: 'flex-start',
              xl: 'flex-start',
            },
            flex: 1,
          }}
        >
          {statistics?.map((stat, index) => (
            <StatisticCard key={index} stat={stat} />
          ))}
        </Box>
      </Box>

      {/* Grid Flex: Título + Proveedores */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: {
            xs: 'column',
            sm: 'column',
            md: 'column',
            lg: 'row',
            xl: 'row',
          },
          alignItems: {
            xs: 'center',
            sm: 'center',
            md: 'flex-start',
            lg: 'flex-start',
            xl: 'flex-start',
          },
          gap: { xs: 3, sm: 4, md: 5, lg: 2, xl: 8 },
          width: '100%',
        }}
      >
        {/* COLUMNA 1: Título */}
        <Box
          sx={{
            flex: {
              xs: 'none',
              sm: 'none',
              md: 'none',
              lg: 0.7,
              xl: 1,
            },
            display: 'flex',
            alignItems: {
              xs: 'center',
              sm: 'center',
              md: 'center',
              lg: 'center',
              xl: 'flex-start',
            },
            justifyContent: {
              xs: 'center',
              sm: 'center',
              md: 'center',
              lg: 'flex-start',
              xl: 'flex-start',
            },
          }}
        >
          <Typography
            variant="h3"
            fontWeight="bold"
            sx={{
              fontSize: {
                xs: '1.5rem',
                sm: '1.8rem',
                md: '2.2rem',
                lg: '2.5rem',
                xl: '2.5rem',
              },
              textAlign: {
                xs: 'center',
                sm: 'center',
                md: 'center',
                lg: 'left',
                xl: 'left',
              },
              color: 'common.black',
              mb: { xs: 3, sm: 4, md: 4, lg: 0, xl: 0 }, // Sin margen bottom en desktop
            }}
          >
            Conoce a nuestros proveedores
          </Typography>
        </Box>

        {/* COLUMNA 2: Grid de Proveedores */}
        <Box
          sx={{
            flex: {
              xs: 'none',
              sm: 'none',
              md: 'none',
              lg: 2,
              xl: 2,
            },
            width: '100%',
          }}
        >
          <Grid
            container
            spacing={{ xs: 3, sm: 4, md: 5, lg: 4, xl: 6 }}
            justifyContent={{
              xs: 'center',
              sm: 'center',
              md: 'center',
              lg: 'flex-start',
              xl: 'flex-start',
            }}
          >
            {PROVIDERS_DATA.map((provider, index) => (
              <Grid
                item
                xs={6}
                sm={4}
                md={3}
                lg={4}
                xl={3}
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
      </Box>
    </Box>
  )
}

export default ProvidersSection
