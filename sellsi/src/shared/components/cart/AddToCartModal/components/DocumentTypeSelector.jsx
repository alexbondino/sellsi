import React from 'react';
import { Box, Typography, FormControl, RadioGroup, FormControlLabel, Radio, Select, MenuItem, useTheme, useMediaQuery } from '@mui/material';

const DEFAULT_TITLE = 'Selecciona el documento tributario a solicitar';

export function DocumentTypeSelector({
  loadingDocumentTypes,
  documentTypesError,
  availableOptions,
  documentType,
  onChange,
  title = DEFAULT_TITLE,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  if (loadingDocumentTypes) {
    return (
      <Box onClick={(e) => e.stopPropagation()}>
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
          {title}
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
          {title}
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
          {title}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.primary' }}>
          Proveedor no ofrece documento tributario
        </Typography>
      </Box>
    );
  }

  // Modo móvil: Dropdown compacto
  if (isMobile) {
    return (
      <Box 
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600, minWidth: 'fit-content' }}>
          Documento Tributario
        </Typography>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <Select
            value={documentType}
            onChange={onChange}
            sx={{ fontSize: '0.875rem' }}
            MenuProps={{
              disablePortal: false,
              sx: {
                zIndex: 10000, // Mayor que el Drawer (9999)
              },
              anchorOrigin: {
                vertical: 'bottom',
                horizontal: 'right',
              },
              transformOrigin: {
                vertical: 'top',
                horizontal: 'right',
              },
            }}
          >
            {availableOptions.map((option) => (
              <MenuItem 
                key={option.value} 
                value={option.value}
              >
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    );
  }

  // Modo desktop: Radio buttons como antes
  return (
    <Box onClick={(e) => e.stopPropagation()}>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
        {title}
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
