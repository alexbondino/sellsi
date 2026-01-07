import React from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Tooltip,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { DOCUMENT_TYPES } from '../../../shared/constants/profile';

/**
 * Componente modular para selección de tipos de documento tributario
 * Reutilizable entre Profile y Onboarding
 */
const TaxDocumentSelector = ({
  documentTypes = [],
  onDocumentTypesChange,
  showTitle = true,
  size = 'medium', // 'small' | 'medium' | 'large'
}) => {
  // ✅ DEFENSIVE: Asegurar que documentTypes sea siempre un array
  const safeDocumentTypes = Array.isArray(documentTypes) ? documentTypes : [];

  const handleDocumentTypeChange = event => {
    const value = event.target.value;
    const currentSelection = safeDocumentTypes;

    // Si se selecciona "No ofrecer documento tributario", eliminar Boleta y Factura
    if (value.includes('ninguno') && !currentSelection.includes('ninguno')) {
      // "No ofrecer documento tributario" se está agregando, eliminar todo lo demás
      onDocumentTypesChange(['ninguno']);
    } else if (
      value.includes('ninguno') &&
      currentSelection.includes('ninguno') &&
      value.length > 1
    ) {
      // "No ofrecer documento tributario" ya estaba seleccionado y se está agregando algo más, eliminar "ninguno"
      const filteredValue = value.filter(item => item !== 'ninguno');
      onDocumentTypesChange(filteredValue);
    } else if (!value.includes('ninguno')) {
      // "No ofrecer documento tributario" no está en la selección, usar valor tal como está
      onDocumentTypesChange(value);
    } else {
      // Solo "ninguno" está seleccionado
      onDocumentTypesChange(['ninguno']);
    }
  };

  const renderValue = selected => {
    // ✅ DEFENSIVE: Asegurar que selected sea siempre un array
    const selectedArray = Array.isArray(selected) ? selected : [];

    if (selectedArray.length === 0) {
      return 'Seleccionar';
    }
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {selectedArray.map(value => {
          const docType = DOCUMENT_TYPES.find(type => type.value === value);
          return (
            <Chip
              key={value}
              label={docType?.label || value}
              size="small"
              sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}
            />
          );
        })}
      </Box>
    );
  };

  const getSizeProps = () => {
    switch (size) {
      case 'small':
        return { size: 'small', variant: 'body2' };
      case 'large':
        return { size: 'medium', variant: 'h6' };
      default:
        return { size: 'small', variant: 'body1' };
    }
  };

  const { size: selectSize, variant } = getSizeProps();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {showTitle && (
        <Typography variant={variant} sx={{ fontWeight: 600 }}>
          Documento Tributario
          <Tooltip
            title="Elige el tipo de documento que estás dispuesto a entregarle a tus compradores"
            placement="right"
          >
            <InfoOutlinedIcon
              sx={{
                fontSize: 18,
                color: 'text.secondary',
                cursor: 'help',
                ml: 1,
              }}
            />
          </Tooltip>
        </Typography>
      )}

      <FormControl size={selectSize} fullWidth>
        <InputLabel shrink>Documento de Venta</InputLabel>
        <Select
          multiple
          value={safeDocumentTypes}
          onChange={handleDocumentTypeChange}
          renderValue={renderValue}
          displayEmpty
          label="Documento de Venta"
          notched
          MenuProps={{
            disableScrollLock: true,
            disablePortal: false,
            anchorOrigin: {
              vertical: 'bottom',
              horizontal: 'left',
            },
            transformOrigin: {
              vertical: 'top',
              horizontal: 'left',
            },
            PaperProps: {
              style: {
                maxHeight: 48 * 5 + 8,
                overflowX: 'hidden',
                overflowY: 'auto',
              },
            },
          }}
        >
          {DOCUMENT_TYPES.map(docType => {
            const isSelected = safeDocumentTypes.includes(docType.value);
            return (
              <MenuItem
                key={docType.value}
                value={docType.value}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography>{docType.label}</Typography>
                {isSelected && (
                  <CheckCircleIcon
                    sx={{
                      color: 'primary.main',
                      fontSize: 20,
                      ml: 1,
                    }}
                  />
                )}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    </Box>
  );
};

export default TaxDocumentSelector;
