import React from 'react';
import { Box, Typography, Grid, Card, CardContent } from '@mui/material';
import DiscountOutlinedIcon from '@mui/icons-material/DiscountOutlined';
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined';
import QueryStatsOutlinedIcon from '@mui/icons-material/QueryStatsOutlined';

import PrimaryButton from '../../../../shared/components/forms/PrimaryButton/PrimaryButton';

/**
 * Sección: ¿Por qué elegir Sellsi?
 * - Header centrado con título y subtítulo
 * - 7 cards con ícono, título (primary.main) y descripción
 * - Grid responsivo: lg/xl 4 por fila, md 3 por fila, sm 2, xs 1
 * - Botón centrado (PrimaryButton) "Agenda tu demo aquí"
 */
const AboutUsSection = ({ quienesSomosRef }) => {
  const features = [
    {
      icon: <DiscountOutlinedIcon color="primary" sx={{ fontSize: 40 }} />,
      title: 'Oferta Mayorista y Minorista',
      description: 'Define precios a nivel unitario o por volúmenes',
    },
    {
      icon: <RequestQuoteOutlinedIcon color="primary" sx={{ fontSize: 40 }} />,
      title: 'Cotización y Negociación en Línea',
      description:
        'Ofrece condiciones específicas y negocia directamente por la plataforma',
    },
    {
      icon: <HandshakeOutlinedIcon color="primary" sx={{ fontSize: 40 }} />,
      title: 'No somos sólo un Marketplace',
      description:
        'Contamos con servicios de intermediación para potenciar aún más tus ventas',
    },
    {
      icon: <VerifiedUserOutlinedIcon color="primary" sx={{ fontSize: 40 }} />,
      title: 'Tu seguridad es esencial para nosotros',
      description:
        'Proveedores verificados y liberación de pagos post entrega',
    },
    {
      icon: <Inventory2OutlinedIcon color="primary" sx={{ fontSize: 40 }} />,
      title: 'Inventarios Actualizados',
      description:
        'Integración mediante API y seguimiento en línea del stock de productos',
    },
    {
      icon: <SupportAgentOutlinedIcon color="primary" sx={{ fontSize: 40 }} />,
      title: 'Acompañamos tu proceso de venta',
      description:
        'Nuestro equipo estará monitoreando tu proceso de ventas para garantizar una experiencia satisfactoria',
    },
    {
      icon: <QueryStatsOutlinedIcon color="primary" sx={{ fontSize: 40 }} />,
      title: 'Sigue tus estadísticas',
      description: 'Seguimiento en línea de tus transacciones',
    },
  ];

  return (
    <Box
      ref={quienesSomosRef}
      component="section"
      sx={{
  py: { xs: 6, sm: 7, md: 8, mac: 8, lg: 9, xl: 9 },
      }}
    >
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: { xs: 4, sm: 5, md: 6 } }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            fontSize: { xs: '1.8rem', sm: '2rem', md: '2.4rem' },
            mb: 1,
          }}
        >
          ¿Por qué elegir{' '}
          <Box component="span" sx={{ color: 'primary.main' }}>
            Sellsi
          </Box>
          ?
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{ color: 'text.secondary', maxWidth: 900, mx: 'auto' }}
        >
          Somos más que un Marketplace. Somos el ecosistema que impulsará y consolidará el crecimiento de tu negocio.
        </Typography>
      </Box>

      {/* Grid de features */}
      <Box sx={{ maxWidth: 1500, mx: 'auto', px: { xs: 2, sm: 3 } }}>
        <Grid
          container
          spacing={{ xs: 2, sm: 3, md: 3 }}
          alignItems="stretch"
          justifyContent="center"
        >
          {features.map((f, idx) => (
            <Grid
              key={idx}
              item
              xs={12}
              sm={6}
              md={4}
              lg={3}
              xl={3}
              sx={(theme) => ({
                display: 'flex',
                [theme.breakpoints.up('md')]: {
                  flexBasis: '25%',
                  maxWidth: '23%',
                },
              })}
            >
              <Card
                elevation={0}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  height: { xs: 200, sm: 220, md: 240, lg: 240 },
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <CardContent
                  sx={{
                    textAlign: 'center',
                    p: { xs: 2.5, sm: 3 },
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    gap: 1,
                    flexGrow: 1,
                  }}
                >
                  <Box sx={{ mb: 0.5, display: 'flex', justifyContent: 'center' }}>{f.icon}</Box>
                  <Typography
                    variant="h6"
                    sx={{ color: 'primary.main', fontWeight: 700, mb: 0.5 }}
                  >
                    {f.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'common.black',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {f.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Botón */}
      <Box sx={{ mt: { xs: 4, sm: 5 }, display: 'flex', justifyContent: 'center' }}>
        <PrimaryButton size="medium">
          Agenda tu demo aquí
        </PrimaryButton>
      </Box>
    </Box>
  );
};

export default AboutUsSection;
