import React from 'react';
import { Box, Typography } from '@mui/material';

/**
 * ====================================================================================
 * ABOUT US SECTION - SECCIÓN "QUIÉNES SOMOS"
 * ============================================================================
 *
 * Componente UI puro para la sección "Quiénes Somos" de la landing page
 *
 * @component
 * @param {Object} props - Propiedades del componente
 * @param {React.RefObject} props.quienesSomosRef - Referencia para scroll navigation
 *
 * CARACTERÍSTICAS:
 * - Layout responsivo diferenciado (mobile vs desktop)
 * - Contenido informativo sobre la empresa (misión, visión)
 * - Imágenes optimizadas y logo corporativo
 * - Tipografía consistente con sistema de diseño
 * - Espaciado y padding adaptativos
 * - Estructura semántica accesible
 *
 * LAYOUT:
 * - Mobile: Logo arriba, contenido abajo en columna
 * - Desktop: Contenido en dos columnas lado a lado
 * - Responsive breakpoints para todos los dispositivos
 */
const AboutUsSection = ({ quienesSomosRef }) => {
  return (
    <Box
      ref={quienesSomosRef}
      sx={{
        py: { xs: 6, sm: 7, md: 8, mac: 6, lg: 8, xl: 8 },
        backgroundColor: 'transparent',
        position: 'relative',
        zIndex: 2,
      }}
    >
      {/* Mobile Layout: Logo first, then content flows vertically */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {/* Logo para mobile eliminado para evitar duplicado, ahora solo aparece entre los textos */}
        {/* All text content for mobile */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h3"
            fontWeight="bold"
            gutterBottom
            sx={{
              fontSize: {
                xs: '1.55rem',
                sm: '1.8rem',
                md: '2.2rem',
                lg: '2.2rem',
                xl: '2.2rem',
              },
              textAlign: 'left',
              color: 'common.black',
              mb: { xs: 2, sm: 2.5, md: 2.5, lg: 2.5, xl: 2.5 },
            }}
          >
            Conoce Sellsi
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontSize: {
                xs: '0.95rem',
                sm: '1rem',
                md: '1.2rem',
                lg: '1.2rem',
                xl: '1.2rem',
              },
              lineHeight: { xs: 1.6, sm: 1.65, md: 1.7, lg: 1.7, xl: 1.7 },
              color: '#111',
              mb: { xs: 2.5, sm: 3, md: 3, lg: 3, xl: 3 },
            }}
          >
            <span style={{ color: '#1565c0', fontWeight: 'bold' }}>
              Sellsi
            </span>{' '}
            es la plataforma donde empresas conectan, negocian y gestionan sus procesos de compra / venta, ya sea mediante venta directa o intermediario.
          </Typography>

          {/* Imagen entre los dos bloques de texto en mobile */}
          <Box sx={{ display: 'flex', justifyContent: 'center', my: { xs: 2, sm: 2.5 } }}>
            <Box
              component="img"
              src="/Landing Page/imagenuno.png"
              alt="Sellsi Logo"
              sx={{ height: { xs: 180, sm: 200 }, width: { xs: 180, sm: 200 }, objectFit: 'contain' }}
            />
          </Box>

          <Typography
            variant="h4"
            fontWeight="bold"
            sx={{
              mb: { xs: 1.2, sm: 1.3, md: 1.5, lg: 1.5, xl: 1.5 },
              fontSize: {
                xs: '1.55rem',
                sm: '1.8rem',
                md: '2rem',
                lg: '2rem',
                xl: '2rem',
              },
              color: 'common.black',
            }}
          >
            Te presentamos nuestra innovadora propuesta de valor
          </Typography>
          {/* Eliminado 'hola que talca' */}
          <Typography
            variant="body1"
            sx={{
              fontSize: { md: '1.2rem' },
              lineHeight: 1.7,
              color: '#111',
              mb: 3,
            }}
          >
            Desarrollamos el primer marketplace mayorista de Chile, ofreciendo un canal de ventas adicional a los proveedores que participan con nosotros. Los compradores podrán optar por una gran variedad de productos con descuentos por tramos, cotizaciones en línea y negociación de precios directamente con los proveedores.
          </Typography>
        </Box>
        {/* imagenuno.png debe ir debajo de los cuadros de texto en mobile, imagendos.png NO debe estar en mobile */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mt: 2,
          }}
        >
          {/* imagenuno.png debajo de los textos en mobile (repetido para énfasis visual, si no se desea, se puede eliminar) */}
          {/*
          <Box
            component="img"
            src="/Landing Page/imagenuno.png"
            alt="Sellsi Logo"
            sx={{
              height: { xs: 200, sm: 220 },
              width: { xs: 200, sm: 220 },
              objectFit: 'contain',
              mb: 0,
            }}
          />
          */}
        </Box>
      </Box>

      {/* Desktop Layout: Two columns side by side */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'row',
          gap: 6,
          alignItems: 'flex-start',
          mt: 0,
        }}
      >
        {/* Left Column: All Text Content for Desktop */}
        <Box
          sx={{
            flex: 1,
            width: '50%',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              textAlign: 'left',
            }}
          >
            <Typography
              variant="h3"
              fontWeight="bold"
              gutterBottom
              sx={{
                fontSize: { md: '2.5rem' },
                textAlign: 'left',
                color: 'common.black',
                mb: { md: 3 },
              }}
            >
              ¿Quiénes Somos?
            </Typography>

            <Typography
              variant="body1"
              sx={{
                fontSize: { md: '1.2rem' },
                lineHeight: 1.7,
                color: '#111', // Cambiado a negro para desktop también
                mb: 3,
              }}
            >
              <span style={{ color: '#1565c0', fontWeight: 'bold' }}>
                Sellsi
              </span>
              &nbsp;es la plataforma donde empresas conectan, negocian y gestionan sus procesos de compra / venta, ya sea mediante venta directa o intermediario.
            </Typography>
            {/* Salto de línea visual aumentado */}
            <Box sx={{ height: 70 }} />
            <Typography
              variant="h4"
              fontWeight="bold"
              sx={{
                mb: 3,
                fontSize: { md: '2.5rem' },
                color: 'common.black',
              }}
            >
              Te presentamos nuestra innovadora propuesta de valor
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: { md: '1.2rem' },
                lineHeight: 1.7,
                color: '#111', // Cambiado a negro
                mb: 3,
              }}
            >
              Desarrollamos el primer marketplace mayorista de Chile, ofreciendo un canal de ventas adicional a los proveedores que participan con nosotros. Los compradores podrán optar por una gran variedad de productos con descuentos por tramos, cotizaciones en línea y negociación de precios directamente con los proveedores.
            </Typography>
          </Box>
        </Box>

        {/* Right Column: Logo and Image for Desktop */}
        <Box
          sx={{
            flex: 1,
            width: '50%',
          }}
        >
          {/* Logo for desktop - hijo 1 */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 250,
              mb: 0, // sin margen inferior
              p: 0, // sin padding
            }}
          >
            <Box
              component="img"
              src="/Landing Page/imagenuno.png"
              alt="Sellsi Logo"
              sx={{
                height: 300,
                width: 450,
                objectFit: 'contain',
                mb: 6,
              }}
            />
          </Box>
          {/* QuienesSomos.jpg image for desktop - hijo 2 */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 250,
              mt: 0, // sin margen superior
              p: 0, // sin padding
            }}
          >
            <Box
              component="img"
              src="/Landing Page/imagendos.png"
              alt="Equipo Sellsi trabajando"
              sx={{
                width: 450,
                height: 300,
                objectFit: 'contain',
                mt: 4,
              }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default AboutUsSection;
