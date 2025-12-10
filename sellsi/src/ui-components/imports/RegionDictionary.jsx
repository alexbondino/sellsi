import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Paper,
} from '@mui/material';

// Debe coincidir con el mapeo de ImportExcel.jsx
const REGION_MAP = {
  1: 'Región de Tarapacá',
  2: 'Región de Antofagasta',
  3: 'Región de Atacama',
  4: 'Región de Coquimbo',
  5: 'Región de Valparaiso',
  6: 'Región del Libertador General Bernardo O’Higgins',
  7: 'Región del Maule',
  8: 'Región del Biobío',
  9: 'Región de la Araucanía',
  10: 'Región de Los Lagos',
  11: 'Región de Aysén',
  12: 'Región de Magallanes',
  13: 'Región Metropolitana de Santiago',
  14: 'Región de Los Ríos',
  15: 'Región de Arica y Parinacota',
  16: 'Región de Ñuble',
  // Agrega más según tu sistema
};

const RegionDictionary = () => (
  <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4, px: 2 }}>
    <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ fontWeight: 'bold', color: '#2E52B2' }}
      >
        Diccionario de Regiones
      </Typography>
      <Typography
        variant="body1"
        sx={{ mb: 3, fontSize: '1.1rem', color: 'text.secondary' }}
      >
        Utiliza estos valores numéricos en la columna <b>delivery_regions</b>{' '}
        del archivo Excel para detallar las regiones disponibles para la entrega
        del producto:
      </Typography>
      <List>
        {Object.entries(REGION_MAP).map(([key, value]) => (
          <ListItem
            key={key}
            sx={{
              backgroundColor: 'background.paper',
              borderRadius: 1,
              mb: 1,
              '&:hover': { backgroundColor: '#f5f5f5', cursor: 'pointer' },
            }}
          >
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography
                    sx={{
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      color: 'primary.main',
                      mr: 1, // Espacio entre número y categoría
                    }}
                  >
                    {key}:
                  </Typography>
                  <Typography sx={{ color: 'text.primary', fontSize: '1rem' }}>
                    {value}
                  </Typography>
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  </Box>
);

export default RegionDictionary;
