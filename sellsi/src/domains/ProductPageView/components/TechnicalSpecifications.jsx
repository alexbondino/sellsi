import React from 'react';
import { Box, Typography, Card, CardContent, Chip } from '@mui/material';
import {
  Engineering,
  Settings,
  Memory,
  Speed,
  Build,
  Category,
} from '@mui/icons-material';
import { generateTechnicalSpecifications } from '../../marketplace/pages/marketplace/salesDataGenerator';

const TechnicalSpecifications = ({ product }) => {
  if (!product) return null;

  // Generate technical specifications
  const especificaciones = generateTechnicalSpecifications(product);
  const getCategoryIcon = categoria => {
    const iconMap = {
      'Características Generales': <Category />,
      'Especificaciones Técnicas': <Engineering />,
      Rendimiento: <Speed />,
      Conectividad: <Settings />,
      'Memoria y Almacenamiento': <Memory />,
      Construcción: <Build />,
    };
    return iconMap[categoria] || <Engineering />;
  };

  return (
    <Box
      sx={{
        maxWidth: '50%',
        mx: 'auto',
        px: 2,
      }}
    >
      {' '}
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1.5,
            mb: 2,
          }}
        >
          <Engineering sx={{ fontSize: '1.5rem', color: 'primary.main' }} />
          <Typography
            variant="h5"
            sx={{ fontWeight: 600, color: 'text.primary' }}
          >
            Especificaciones Técnicas
          </Typography>
        </Box>{' '}
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            maxWidth: '600px',
            mx: 'auto',
            lineHeight: 1.5,
          }}
        >
          Información detallada sobre las características técnicas y
          especificaciones del producto
        </Typography>
      </Box>
      {/* All Specifications */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {especificaciones.map((categoria, categoriaIndex) => (
          <Card
            key={categoriaIndex}
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'grey.200',
              borderRadius: 3,
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            }}
          >
            <CardContent sx={{ p: 0 }}>              {/* Category Header */}
              <Box
                sx={{
                  p: 2.5,
                  background: '#a3a3a3',
                  color: 'black',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                {React.cloneElement(getCategoryIcon(categoria.categoria), { sx: { color: 'black' } })}
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'black' }}>
                  {categoria.categoria}
                </Typography>                <Chip
                  label={`${categoria.especificaciones.length} especificaciones`}
                  size="small"
                  sx={{
                    bgcolor: 'white',
                    color: 'black',
                    fontWeight: 'bold',
                    ml: 'auto',
                  }}
                />
              </Box>

              {/* Specifications Grid */}
              <Box sx={{ p: 2.5 }}>
                <Box
                  sx={{
                    display: 'grid',
                    gap: 1.5,
                  }}
                >
                  {categoria.especificaciones.map((spec, specIndex) => (
                    <Box
                      key={specIndex}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        p: 1.5,
                        borderRadius: 1.5,
                        border: '1px solid',
                        borderColor: 'grey.100',
                        bgcolor: specIndex % 2 === 0 ? 'grey.50' : 'white',
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: 'text.primary',
                          }}
                        >
                          {spec.nombre}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          textAlign: 'right',
                          minWidth: '180px',
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'black',
                            fontFamily: 'monospace',
                            fontSize: '0.85rem',
                            bgcolor: 'rgba(25, 118, 210, 0.05)',
                            px: 1.5,
                            py: 0.4,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'rgba(25, 118, 210, 0.1)',
                          }}
                        >
                          {spec.valor}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
      {/* Footer Information */}
      <Box
        sx={{
          mt: 3,
          p: 2.5,
          borderRadius: 2,
          background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
          border: '1px solid',
          borderColor: 'primary.light',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Box
            sx={{
              p: 0.8,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              color: 'white',
            }}
          >
            <Engineering fontSize="small" />
          </Box>
          <Typography
            variant="body1"
            sx={{
              fontWeight: 600,
              color: 'primary.main',
            }}
          >
            Información Técnica Certificada
          </Typography>
        </Box>

        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            lineHeight: 1.5,
            fontSize: '0.85rem',
          }}
        >
          Las especificaciones técnicas mostradas son generadas automáticamente
          para fines de demostración del sistema. En un entorno de producción,
          estos datos serían proporcionados directamente por los fabricantes y
          validados por nuestro equipo técnico.
        </Typography>
      </Box>
    </Box>
  );
};

export default TechnicalSpecifications;
