import React from 'react';
import { Box, Typography, Grid, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ProviderLogo from './ProviderLogo';
import StatisticCard from './StatisticCard';
import { PROVIDERS_DATA } from './constants.jsx';

const ProvidersSection = ({ statistics }) => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        backgroundColor: '#ffffff',
        px: { xs: 2, sm: 4, md: 8, mac: 18, lg: 15, xl: 30 },
        py: { xs: 6, sm: 7, md: 8, mac: 10, lg: 8, xl: 8 },
        position: 'relative',
        paddingTop: {
          xs: 6,
          sm: 7,
          md: 8,
          mac: 0,
          lg: 20,
          xl: 25,
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: {
            xs: 0,
            sm: 0,
            md: 0,
            mac: '-200px',
            lg: '-200px',
            xl: '-250px',
          },
          left: 0,
          right: 0,
          height: {
            xs: 0,
            sm: 0,
            md: 0,
            mac: '200px',
            lg: '200px',
            xl: '250px',
          },
          backgroundColor: '#f8f9fa',
          zIndex: -1,
        },
      }}
    >
      {/* Botón y Estadísticas - Solo visible en desktop */}
      <Box
        sx={{
          display: {
            xs: 'none',
            sm: 'none',
            md: 'flex',
            mac: 'flex',
            lg: 'flex',
            xl: 'flex',
          },
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: {
            xs: 'center',
            sm: 'center',
            md: 'flex-start',
            mac: 'flex-start', // Mantener alineación a la izquierda para Mac
            lg: 'flex-start',
            xl: 'flex-start',
          },
          gap: { xs: 2, sm: 4, md: 8, mac: 12, lg: 25, xl: 33 },
          mb: { xs: 2, sm: 4, md: 8, mac: 10, lg: 12, xl: 10 },
          mt: { xs: 2, sm: 4, md: 8, mac: 10, lg: -18, xl: -20 },
          ml: { xs: 0, sm: 0, md: 0, mac: 0, lg: 0, xl: 0 },
          width: '100%',
          maxWidth: {
            xs: '100%',
            sm: '100%',
            md: '100%',
            mac: '100%', // Permitir que se estire a todo el ancho si es necesario
            lg: 700,
            xl: 800,
          },
          position: 'relative',
          zIndex: 1,
          mx: {
            xs: 'auto',
            sm: 'auto',
            md: 'auto',
            mac: '0', // Eliminar auto margin para Mac si se alinea a la izquierda
            lg: '0',
            xl: '0',
          },
        }}
      >
        <Button
          variant="contained"
          sx={{
            backgroundColor: 'primary.main',
            fontWeight: 'bold',
            borderRadius: '8px',
            px: { xs: 2, sm: 4, md: 8, mac: 8, lg: 11, xl: 12 },
            py: { xs: 2, sm: 4, md: 8, mac: 2.4, lg: 2.4, xl: 2.6 },
            ml: { xs: 2, sm: 4, md: 0, mac: 0, lg: 0, xl: 0 },
            fontSize: {
              xs: '1rem',
              sm: '1.2rem',
              md: '1.3rem',
              mac: '1.4rem',
              lg: '1.58rem',
              xl: '1.7rem',
            },
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
            gap: { xs: 1, sm: 2, md: 3, mac: 4, lg: 4, xl: 5 },
            alignItems: 'center',
            justifyContent: {
              xs: 'center',
              sm: 'center',
              md: 'flex-start',
              mac: 'flex-start', // Mantener alineación a la izquierda para Mac
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
            mac: 'row', // <-- CAMBIO CLAVE: Row para mac para que título y grid estén en la misma fila
            lg: 'row',
            xl: 'row',
          },
          alignItems: {
            xs: 'center',
            sm: 'center',
            md: 'flex-start',
            mac: 'center', // <-- Centra verticalmente el título y el grid entre sí en mac
            lg: 'flex-start',
            xl: 'flex-start',
          },
          gap: { xs: 3, sm: 4, md: 5, mac: 4, lg: 2, xl: 8 },
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
              mac: 0.7, // <-- CAMBIO: Ocupa 70% del espacio en mac
              lg: 0.7,
              xl: 1,
            },
            display: 'flex',
            alignItems: {
              xs: 'center',
              sm: 'center',
              md: 'center',
              mac: 'center', // <-- Centrar verticalmente el texto del título en mac
              lg: 'center',
              xl: 'flex-start',
            },
            justifyContent: {
              xs: 'center',
              sm: 'center',
              md: 'center',
              mac: 'flex-start', // <-- CAMBIO: Alinear texto a la izquierda en mac
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
                mac: '2.5rem',
                lg: '2.5rem',
                xl: '2.5rem',
              },
              textAlign: {
                xs: 'center',
                sm: 'center',
                md: 'center',
                mac: 'left', // <-- CAMBIO: Alinear texto a la izquierda en mac
                lg: 'left',
                xl: 'left',
              },
              color: 'common.black',
              mb: { xs: 3, sm: 4, md: 4, lg: 0, xl: 0 },
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
              mac: 2, // <-- CAMBIO: Ocupa el doble de espacio que el título en mac
              lg: 2,
              xl: 2,
            },
            width: '100%',
            display: 'flex',
            justifyContent: {
              xs: 'center',
              sm: 'center',
              md: 'center',
              mac: 'flex-start', // <-- CAMBIO: Alinear el grid a la izquierda de su columna en mac
              lg: 'flex-start',
              xl: 'flex-start',
            },
          }}
        >
          <Grid
            container
            spacing={{ xs: 2, sm: 2.5, md: 3, mac: 3.5, lg: 3.5, xl: 4 }}
            justifyContent={{
              xs: 'center',
              sm: 'center',
              md: 'center',
              mac: 'flex-start', // <-- CAMBIO: Alinear los items del grid a la izquierda en mac
              lg: 'flex-start',
              xl: 'flex-start',
            }}
            alignItems="flex-start"
          >
            {PROVIDERS_DATA.map((provider, idx) => (
              <Grid
                key={provider.alt}
                xs={6}
                sm={4}
                md={3}
                mac={3} // Mantener 4 logos por fila en mac (12 / 3 = 4)
                lg={2}
                xl={2}
              >
                <ProviderLogo provider={provider} />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    </Box>
  );
};

export default ProvidersSection;
