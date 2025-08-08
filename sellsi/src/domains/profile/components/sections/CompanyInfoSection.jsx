import React from 'react';
import { Box, Typography, TextField, Button, ToggleButtonGroup, ToggleButton } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { CountrySelector, TaxDocumentSelector } from '../../../../shared/components';
import { validatePhone } from '../../../../utils/validators';

/**
 * Sección de Información de Empresa del perfil
 * Incluye: selector documento tributario, email, contraseña, país + teléfono, función
 */
const CompanyInfoSection = ({ 
  formData, 
  onFieldChange, 
  onPasswordModalOpen 
}) => {
  return (
    <Box sx={{ p: 3, height: 'fit-content' }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6">Información General</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Configura tu Perfil
        </Typography>
        <Box sx={{ mt: 1, borderBottom: 2, borderColor: 'primary.main' }} />
      </Box>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Función primaria con ToggleButtonGroup (estilo replicado de ProductInventory) */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" sx={{ minWidth: 120 }}>
            Función
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ToggleButtonGroup
              value={formData.role || 'supplier'}
              exclusive
              onChange={(e, value) => value && onFieldChange('role', value)}
              sx={{
                '& .MuiToggleButton-root': {
                  textTransform: 'none',
                  minWidth: 103,
                  borderColor: 'rgba(0,0,0,0.23)',
                  transition: 'background-color 120ms ease, border-color 120ms ease, box-shadow 120ms ease, color 120ms ease',
                },
                '& .MuiToggleButton-root:hover': {
                  borderColor: '#000',
                },
                '& .MuiToggleButton-root.Mui-selected': {
                  borderColor: '#000',
                  backgroundColor: 'rgba(0,0,0,0.04)',
                  fontWeight: 700,
                  color: 'inherit',
                  boxShadow: 'inset 0 0 0 1px #000, 0 1px 2px rgba(0,0,0,0.08)',
                },
                '& .MuiToggleButton-root.Mui-selected:hover': {
                  borderColor: '#000',
                  backgroundColor: 'rgba(0,0,0,0.06)',
                },
              }}
            >
              <ToggleButton value="buyer">Comprador</ToggleButton>
              <ToggleButton value="supplier">Proveedor</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, ml: 0.5 }}>
          <InfoOutlinedIcon sx={{ fontSize: 16, color: 'primary.main', mr: 0.5 }} />
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Esta será tu función primaria. Cuando inicies sesión, verás el panel según tu función.
          </Typography>
        </Box>


        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" sx={{ minWidth: 120 }}>
            Correo Electrónico
          </Typography>
          <Typography variant="body2" sx={{ flexGrow: 1, color: 'black' }}>
            {formData.email || 'No especificado'}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" sx={{ minWidth: 120 }}>
            Contraseña
          </Typography>
          <Button 
            variant="outlined" 
            size="small"
            onClick={onPasswordModalOpen}
          >
            Cambiar contraseña
          </Button>
        </Box>

  {/* País + Teléfono en una misma fila, CountrySelector a la izquierda */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Box sx={{ minWidth: 180 }}>
            <CountrySelector
              value={formData.country || ''}
              onChange={(e) => onFieldChange('country', e.target.value)}
              label="País"
              size="small"
              fullWidth
            />
          </Box>
          <TextField
            label="Teléfono"
            value={formData.phone || ''}
            onChange={(e) => {
              // Adaptación: solo dígitos para mantener compatibilidad con validaciones previas
              const digitsOnly = (e.target.value || '').replace(/\D+/g, '');
              onFieldChange('phone', digitsOnly);
            }}
            fullWidth
            variant="outlined"
            size="small"
            placeholder={formData.country === 'CL' || !formData.country ? '912345678' : 'Teléfono'}
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
            error={!validatePhone(formData.country || 'CL', formData.phone || '').isValid}
            helperText={
              (() => {
                const res = validatePhone(formData.country || 'CL', formData.phone || '');
                return res.isValid ? 'Ingresa solo dígitos (se normaliza al guardar)' : res.reason;
              })()
            }
          />
        </Box>

        {/* Tipo de Documento (debajo de Teléfono) */}
        <Box>
          <TaxDocumentSelector
            documentTypes={formData.documentTypes || []}
            onDocumentTypesChange={(value) => onFieldChange('documentTypes', value)}
            showTitle={false}
            size="small"
          />
        </Box>

  {/* Documento Tributario eliminado: Facturación ya no depende de este selector */}
        {/* Descripción proveedor solo si el rol es supplier */}
        {formData.role === 'supplier' && (
          <TextField
            label="Descripción breve del proveedor"
            variant="outlined"
            fullWidth
            multiline
            rows={3}
            value={formData.descripcionProveedor || ''}
            onChange={e => {
              const value = e.target.value;
              if (value.length <= 200) {
                onFieldChange('descripcionProveedor', value);
              }
            }}
            placeholder="Una descripción resumida del tipo de productos que comercializas..."
            helperText={`Una descripción resumida del tipo de productos que comercializas. Esta información ayudará a los compradores a identificar rápidamente tu oferta. (${(formData.descripcionProveedor || '').length}/200)`}
            sx={{ mt: 2, '.MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        )}
      </Box>
    </Box>
  );
};

export default CompanyInfoSection;
