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
        // Ajuste de padding horizontal para todos los breakpoints, incluyendo 'mac'
        px: { xs: 2, sm: 4, md: 8, mac: 10, lg: 15, xl: 30 },
        // Ajuste de padding vertical para todos los breakpoints
        py: { xs: 6, sm: 7, md: 8, mac: 10, lg: 8, xl: 8 },
        position: 'relative',
        // PADDING EXTRA ARRIBA PARA DAR ESPACIO AL BOTÓN Y ESTADÍSTICAS
        paddingTop: {
          xs: 6,
          sm: 7,
          md: 8,
          mac: 10, // Espacio para pantallas Mac antes del lg
          lg: 20, // Espacio extra para el botón y estadísticas en desktop
          xl: 25,
        },
        // PSEUDO-ELEMENTO PARA EXTENDER EL FONDO GRIS HACIA ARRIBA
        '&::before': {
          content: '""',
          position: 'absolute',
          top: {
            xs: 0,
            sm: 0,
            md: 0,
            mac: '-200px', // Extiende hacia arriba en Macs
            lg: '-200px', // Se extiende hacia arriba
            xl: '-250px', // Se extiende hacia arriba
          },
          left: 0,
          right: 0,
          height: {
            xs: 0,
            sm: 0,
            md: 0,
            // Importante: `height` no puede ser negativo, solo `top`.
            // El `height` es el tamaño del pseudo-elemento, ajusta según necesites
            mac: '200px', // Altura para Mac
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
            md: 'flex', // Visible desde md
            mac: 'flex', // Asegurarse que se vea en mac
            lg: 'flex',
            xl: 'flex',
          },
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-start',
          // Ajuste de gap para el espacio entre el botón y las estadísticas
          gap: { xs: 2, sm: 4, md: 8, mac: 12, lg: 25, xl: 33 },
          // Margen inferior
          mb: { xs: 2, sm: 4, md: 8, mac: 10, lg: 12, xl: 10 },
          // Margen superior (negativo para subir)
          mt: { xs: 2, sm: 4, md: 8, mac: 10, lg: -18, xl: -20 },
          // Margen izquierdo para el contenedor principal de botón/estadísticas
          ml: { xs: 0, sm: 0, md: 0, mac: 0, lg: 0, xl: 0 }, // Deja en 0 para lg/xl, si quieres alinearlo con el contenido principal
          width: '100%',
          // MaxWidth para controlar el ancho del contenedor de botón/estadísticas
          maxWidth: {
            xs: '100%',
            sm: '100%',
            md: '100%', // Para md, que ocupe todo el ancho
            mac: 600, // Un ancho fijo para mac, si es necesario
            lg: 700, // Ajusta si 600 es demasiado estrecho para tu diseño en Mac
            xl: 800,
          },
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
            // Padding horizontal del botón
            px: { xs: 2, sm: 4, md: 8, mac: 8, lg: 11, xl: 12 }, // Ajuste para Mac
            // Padding vertical del botón
            py: { xs: 2, sm: 4, md: 8, mac: 2.2, lg: 2.4, xl: 2.6 }, // Ajuste para Mac
            ml: { xs: 2, sm: 4, md: 0, mac: 0, lg: 0, xl: 0 },
            // Tamaño de fuente del botón
            fontSize: {
              xs: '1rem',
              sm: '1.2rem',
              md: '1.3rem',
              mac: '1.4rem',
              lg: '1.58rem',
              xl: '1.7rem',
            }, // Ajuste para Mac
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
            gap: { xs: 1, sm: 2, md: 3, mac: 4, lg: 4, xl: 5 }, // Ajuste de gap para Mac
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
            mac: 'column',
            lg: 'row',
            xl: 'row',
          },
          alignItems: {
            xs: 'center',
            sm: 'center',
            md: 'flex-start', // De md en adelante, alinear título y grid al inicio
            mac: 'flex-start',
            lg: 'flex-start',
            xl: 'flex-start',
          },
          // Gap entre el título y el grid de proveedores
          gap: { xs: 3, sm: 4, md: 5, mac: 4, lg: 2, xl: 8 }, // Ajuste para Mac
          width: '100%',
        }}
      >
        {/* COLUMNA 1: Título */}
        <Box
          sx={{
            // Flex grow para controlar el ancho de la columna del título
            flex: {
              xs: 'none',
              sm: 'none',
              md: 'none',
              mac: 'none', // En Mac, darle un poco más de espacio si es necesario
              lg: 0.7,
              xl: 1,
            },
            display: 'flex',
            alignItems: {
              xs: 'center',
              sm: 'center',
              md: 'center', // Centrar en md, luego alinear al inicio
              mac: 'center', // En Mac, alinear al centro por defecto, o 'flex-start' si lo quieres a la izquierda
              lg: 'center', // Centrar verticalmente en la fila grande
              xl: 'flex-start',
            },
            justifyContent: {
              xs: 'center',
              sm: 'center',
              md: 'center', // Centrar en md, luego alinear al inicio
              mac: 'center', // En Mac, alinear a la izquierda
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
                mac: '2.8rem', // Ajuste para Mac
                lg: '2.5rem',
                xl: '2.5rem',
              },
              textAlign: {
                xs: 'center',
                sm: 'center',
                md: 'center',
                mac: 'center', // Alinear a la izquierda en Mac
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
              mac: 'none', // Más espacio para el grid de proveedores en Mac
              lg: 2,
              xl: 2,
            },
            width: '100%',
          }}
        >
          <Grid
            container
            // Ajuste de spacing para Mac
            spacing={{ xs: 2, sm: 2.5, md: 3, mac: 3.5, lg: 3.5, xl: 4 }}
            justifyContent={{
              xs: 'center',
              sm: 'center',
              md: 'center',
              // Importante: si hay un número impar de elementos en una fila,
              // 'flex-start' los alineará a la izquierda, evitando que el último se "descuelgue" centrado
              mac: 'center',
              lg: 'flex-start',
              xl: 'flex-start',
            }}
            // ✅ Alinear elementos en la parte superior (por defecto es stretch)
            alignItems="flex-start"
          >
            {PROVIDERS_DATA.map((provider, idx) => (
              <Grid
                key={provider.alt}
                // 🔴 CORRECCIÓN CLAVE: Usar props de breakpoint directamente, NO 'size'
                xs={6}
                sm={4}
                md={3}
                mac={2} // Ocupa 2 de 12 columnas en Mac, significando 6 logos por fila
                lg={2} // Puedes mantener 2 para lg si quieres 6 por fila
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
