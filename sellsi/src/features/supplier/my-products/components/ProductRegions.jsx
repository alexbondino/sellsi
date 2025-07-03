import React from 'react';
import { Box, Typography } from '@mui/material';
import { SelectChip } from '../../../ui';

// Constantes
const REGIONS = [
  { value: 'todo-chile', label: 'Todo Chile' },
  { value: 'región-metropolitana', label: 'Región Metropolitana' },
  { value: 'i-región', label: 'I Región (Tarapacá)' },
  { value: 'ii-región', label: 'II Región (Antofagasta)' },
  { value: 'iii-región', label: 'III Región (Atacama)' },
  { value: 'iv-región', label: 'IV Región (Coquimbo)' },
  { value: 'v-región', label: 'V Región (Valparaíso)' },
  { value: 'vi-región', label: 'VI Región (O\'Higgins)' },
  { value: 'vii-región', label: 'VII Región (Maule)' },
  { value: 'viii-región', label: 'VIII Región (Biobío)' },
  { value: 'ix-región', label: 'IX Región (Araucanía)' },
  { value: 'x-región', label: 'X Región (Los Lagos)' },
  { value: 'xi-región', label: 'XI Región (Aysén)' },
  { value: 'xii-región', label: 'XII Región (Magallanes)' },
  { value: 'xiv-región', label: 'XIV Región (Los Ríos)' },
  { value: 'xv-región', label: 'XV Región (Arica y Parinacota)' },
  { value: 'xvi-región', label: 'XVI Región (Ñuble)' },
];

/**
 * Componente para la selección de regiones de despacho
 * Maneja la selección múltiple de regiones
 */
const ProductRegions = ({
  formData,
  onRegionChange,
}) => {
  return (
    <Box>
      <Typography
        variant="h6"
        gutterBottom
        sx={{ fontWeight: 600, color: 'black', mb: 2 }}
      >
        Región de Despacho
      </Typography>
      <SelectChip
        label="Selecciona las regiones de despacho"
        options={REGIONS}
        value={Array.isArray(formData.regionDespacho) ? formData.regionDespacho : formData.regionDespacho ? [formData.regionDespacho] : []}
        onChange={onRegionChange}
        selectAllOption={{ value: 'todo-chile', label: 'Todo Chile' }}
        width="100%"
        sx={{ mb: 2 }}
      />
    </Box>
  );
};

export default ProductRegions;
