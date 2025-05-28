import React from 'react'
import { Box, Typography } from '@mui/material'

const AboutUsSection = ({ quienesSomosRef }) => {
  return (
    <Box
      ref={quienesSomosRef}
      sx={{
        px: { xs: 2, sm: 4, md: 8, lg: 15, xl: 30 },
        py: { xs: 6, md: 8 },
        backgroundColor: '#ffffff',
      }}
    >
      <Box>
        {/* Mobile Layout: Logo first, then content flows vertically */}
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          {/* Logo for mobile - appears first */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 3,
            }}
          >
            <Box
              component="img"
              src="/logo.svg"
              alt="Sellsi Logo"
              sx={{
                height: { xs: 50, sm: 60 },
              }}
            />
          </Box>

          {/* All text content for mobile */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h3"
              fontWeight="bold"
              gutterBottom
              sx={{
                fontSize: { xs: '2rem' },
                textAlign: 'left',
                color: 'common.black',
                mb: { xs: 2 },
              }}
            >
              ¿Quiénes somos?
            </Typography>

            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: '1.2rem' },
                lineHeight: 1.7,
                color: 'text.secondary',
                mb: 3,
              }}
            >
              En Sellsi, creemos en un comercio más justo, ágil y accesible para
              todos. Somos la plataforma tecnológica que conecta a proveedores
              con vendedores de forma simple, rápida y transparente.
              <br />
              <br />
              Creamos un ecosistema donde los productos pueden llegar a nuevos
              clientes sin intermediarios innecesarios ni fricciones. Aquí, los
              proveedores definen el precio de venta y la comisión disponible,
              mientras los vendedores eligen qué ofrecer y ganan por cada venta
              concretada.
            </Typography>

            <Typography
              variant="h4"
              fontWeight="bold"
              sx={{
                mb: 1.5,
                fontSize: { xs: '2rem' },
                color: 'common.black',
              }}
            >
              Nuestra Misión
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: '1.2rem' },
                lineHeight: 1.7,
                color: 'text.secondary',
                mb: 3,
              }}
            >
              Impulsar la economía digital conectando proveedores y vendedores a
              través de una plataforma tecnológica simple, inclusiva y
              transparente.
            </Typography>

            <Typography
              variant="h4"
              fontWeight="bold"
              sx={{
                mb: 1.5,
                fontSize: { xs: '2rem' },
                color: 'common.black',
              }}
            >
              Nuestra Visión
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: '1.2rem' },
                lineHeight: 1.7,
                color: 'text.secondary',
                mb: 3,
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
                maxWidth: { xs: '90%', sm: '80%' },
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
                En Sellsi, creemos en un comercio más justo, ágil y accesible
                para todos. Somos la plataforma tecnológica que conecta a
                proveedores con vendedores de forma simple, rápida y
                transparente.
                <br />
                <br />
                Creamos un ecosistema donde los productos pueden llegar a nuevos
                clientes sin intermediarios innecesarios ni fricciones. Aquí,
                los proveedores definen el precio de venta y la comisión
                disponible, mientras los vendedores eligen qué ofrecer y ganan
                por cada venta concretada.
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
  )
}

export default AboutUsSection
