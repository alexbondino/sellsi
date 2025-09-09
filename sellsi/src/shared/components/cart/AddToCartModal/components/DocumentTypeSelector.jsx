import React from 'react';
import { Box, Typography, FormControl, RadioGroup, FormControlLabel, Radio } from '@mui/material';

export function DocumentTypeSelector({
  loadingDocumentTypes,
  documentTypesError,
  availableOptions,
  documentType,
  onChange,
}) {
  if (loadingDocumentTypes) {
    return (
      <Box onClick={(e) => e.stopPropagation()}>
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
          Tipo de Documento
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Cargando opciones...
        </Typography>
      </Box>
    );
  }

  if (documentTypesError || !availableOptions || availableOptions.length === 0) {
    return (
      <Box onClick={(e) => e.stopPropagation()}>
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
          Tipo de Documento
        </Typography>
        <FormControl component="fieldset">
          <RadioGroup
            value={documentType}
            onChange={onChange}
            row
            onClick={(e) => e.stopPropagation()}
          >
            <FormControlLabel value="factura" control={<Radio size="small" />} label="Factura" />
            <FormControlLabel value="boleta" control={<Radio size="small" />} label="Boleta" />
            <FormControlLabel value="ninguno" control={<Radio size="small" />} label="No ofrecer documento tributario" />
          </RadioGroup>
        </FormControl>
      </Box>
    );
  }

  if (availableOptions.length === 1 && availableOptions[0].value === 'ninguno') {
    return (
      <Box onClick={(e) => e.stopPropagation()}>
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
          Tipo de Documento
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.primary' }}>
          Proveedor no ofrece documento tributario
        </Typography>
      </Box>
    );
  }

  return (
    <Box onClick={(e) => e.stopPropagation()}>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
        Tipo de Documento
      </Typography>
      <FormControl component="fieldset">
        <RadioGroup
          value={documentType}
            onChange={onChange}
          row
          onClick={(e) => e.stopPropagation()}
        >
          {availableOptions.map((option) => (
            <FormControlLabel
              key={option.value}
              value={option.value}
              control={<Radio size="small" />}
              label={option.label}
            />
          ))}
        </RadioGroup>
      </FormControl>
    </Box>
  );
}
