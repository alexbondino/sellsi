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
        px: { xs: 2, sm: 4, md: 8, mac: 18, lg: 18, xl: 30 },
        py: { xs: 6, sm: 7, md: 8, mac: 6, lg: 8, xl: 8 },
        backgroundColor: '#ffffff',
      }}
    >
      <Box>
        {/* Mobile Layout: Logo first, then content flows vertically */}
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          {/* Logo for mobile - appears first */}{' '}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: { xs: 2.5, sm: 3, md: 3, lg: 3, xl: 3 },
            }}
          >
            <Box
              component="img"
              src="/logo.svg"
              alt="Sellsi Logo"
              sx={{
                height: { xs: 50, sm: 55, md: 60, lg: 60, xl: 60 },
              }}
            />
          </Box>
          {/* All text content for mobile */}
          <Box sx={{ mb: 4 }}>
            {' '}
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
              ¿Quiénes somos?
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
                color: 'text.secondary',
                mb: { xs: 2.5, sm: 3, md: 3, lg: 3, xl: 3 },
              }}
            >
              <span style={{ color: '#1565c0', fontWeight: 'bold' }}>
                Sellsi
              </span>{' '}
              es la plataforma B2B / B2C donde empresas compradoras y
              proveedoras se conectan, negocian y gestionan sus procesos de
              compra y venta, ya sea mediante venta directa o intermediario.
            </Typography>
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
              Nuestra Misión
            </Typography>{' '}
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
                color: 'text.secondary',
                mb: { xs: 2.5, sm: 3, md: 3, lg: 3, xl: 3 },
              }}
            >
              Impulsar la economía digital conectando proveedores y vendedores a
              través de una plataforma tecnológica simple, inclusiva y
              transparente.
            </Typography>{' '}
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
              Nuestra Visión
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
                color: 'text.secondary',
                mb: { xs: 2.5, sm: 3, md: 3, lg: 3, xl: 3 },
              }}
            >
              Ser el marketplace más ágil y confiable de LATAM para escalar
              ventas sin límites ni barreras.
            </Typography>
          </Box>
          {/* QuienesSomos.jpg image for mobile - appears after all text */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mt: 2,
            }}
          >
            <Box
              component="img"
              src="/Landing Page/QuienesSomos.jpg"
              alt="Equipo Sellsi trabajando"
              sx={{
                width: '100%',
                maxWidth: { xs: '80%', sm: '80%', md: '80%' },
                height: 'auto',
                objectFit: 'cover',
                borderRadius: '16px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              }}
            />
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
                ¿Quiénes somos?
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  fontSize: { md: '1.2rem' },
                  lineHeight: 1.7,
                  color: 'text.secondary',
                  mb: 3,
                }}
              >
                <span style={{ color: '#1565c0', fontWeight: 'bold' }}>
                  Sellsi
                </span>{' '}
                es la plataforma B2B / B2C donde empresas compradoras y
                proveedoras se conectan, negocian y gestionan sus procesos de
                compra y venta, ya sea mediante venta directa o intermediario.
              </Typography>

              <Typography
                variant="h4"
                fontWeight="bold"
                sx={{
                  mb: 1.5,
                  fontSize: { md: '2.5rem' },
                  color: 'common.black',
                }}
              >
                Nuestra Misión
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontSize: { md: '1.2rem' },
                  lineHeight: 1.7,
                  color: 'text.secondary',
                  mb: 3,
                }}
              >
                Impulsar la economía digital conectando proveedores y vendedores
                a través de una plataforma tecnológica simple, inclusiva y
                transparente.
              </Typography>

              <Typography
                variant="h4"
                fontWeight="bold"
                sx={{
                  mb: 1.5,
                  fontSize: { md: '2.5rem' },
                  color: 'common.black',
                }}
              >
                Nuestra Visión
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontSize: { md: '1.2rem' },
                  lineHeight: 1.7,
                  color: 'text.secondary',
                }}
              >
                Ser el marketplace más ágil y confiable de LATAM para escalar
                ventas sin límites ni barreras.
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
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                width: '100%',
                height: '100%',
              }}
            >
              <Box
                component="img"
                src="/logo.svg"
                alt="Sellsi Logo"
                sx={{
                  height: { md: 70 },
                }}
              />
              <Box
                component="img"
                src="/Landing Page/QuienesSomos.jpg"
                alt="Equipo Sellsi trabajando"
                sx={{
                  width: '100%',
                  maxWidth: { md: 480 },
                  height: 'auto',
                  objectFit: 'cover',
                  borderRadius: '16px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                }}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default AboutUsSection;
