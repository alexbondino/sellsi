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
const CATEGORY_MAP = {
  1: 'Tabaquería',
  2: 'Alcoholes',
  3: 'Alimentos',
  4: 'Bebidas',
  5: 'Accesorios',
  // Agrega más según tu sistema
};

const CategoryDictionary = () => (
  <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4, px: 2 }}>
    <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ fontWeight: 'bold', color: '#2E52B2' }}
      >
        Diccionario de Categorías
      </Typography>
      <Typography
        variant="body1"
        sx={{ mb: 3, fontSize: '1.1rem', color: 'text.secondary' }}
      >
        Utiliza estos valores numéricos en la columna <b>category</b> del
        archivo Excel para detallar la categoría del producto:
      </Typography>
      <List>
        {Object.entries(CATEGORY_MAP).map(([key, value]) => (
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

export default CategoryDictionary;
