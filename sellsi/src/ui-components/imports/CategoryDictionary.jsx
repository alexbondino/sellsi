import React from 'react';
import { Box, Typography, List, ListItem, ListItemText } from '@mui/material';

// Debe coincidir con el mapeo de ImportExcel.jsx
const CATEGORY_MAP = {
  1: 'Tabaquería',
  2: 'Alcoholes',
  3: 'Alimentos',
  4: 'Bebidas',
  5: 'Accesorios',
  // Agrega más según tu sistema
};

const CategoryDictionary = () => (
  <Box sx={{ maxWidth: 500, mx: 'auto', mt: 4 }}>
    <Typography variant="h5" gutterBottom>
      Diccionario de Categorías
    </Typography>
    <Typography variant="body1" sx={{ mb: 2 }}>
      Utiliza estos valores numéricos o de texto en la columna <b>category</b>{' '}
      del Excel:
    </Typography>
    <List>
      {Object.entries(CATEGORY_MAP).map(([key, value]) => (
        <ListItem key={key}>
          <ListItemText
            primary={
              <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                {key}
              </span>
            }
            secondary={value}
          />
        </ListItem>
      ))}
    </List>
  </Box>
);

export default CategoryDictionary;
