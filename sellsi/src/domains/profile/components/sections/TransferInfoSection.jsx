import React from 'react';
import { Box, Typography, TextField, FormControl, Select, MenuItem } from '@mui/material';
import ProfileSwitch from '../ProfileSwitch';
import { validateRut, validateEmail } from '../../../../utils/validators';
import { BANKS, ACCOUNT_TYPES } from '../../../../shared/constants/profile';

/**
 * Sección de Información de Transferencia del perfil
 * Incluye: titular, tipo cuenta, banco, número cuenta, RUT, email confirmación
 */
const TransferInfoSection = ({ 
  formData, 
  onFieldChange,
  showSensitiveData,
  toggleSensitiveData,
  getSensitiveFieldValue,
  shouldHighlight = false // ✅ NUEVO: Prop para resaltar campos cuando vengan de validación fallida
}) => {
  
  // ✅ NUEVO: Estilo condicional para highlight de campos requeridos
  const getFieldStyle = (fieldValue, isRequiredField = true) => {
    if (!shouldHighlight || !isRequiredField) {
      return {};
    }
    
    // Si el campo está vacío y debe ser resaltado, mostrar borde rojo
    const isEmpty = !fieldValue || (typeof fieldValue === 'string' && fieldValue.trim() === '');
    if (isEmpty) {
      return {
        '& .MuiOutlinedInput-root': {
          '& fieldset': {
            borderColor: '#f44336',
            borderWidth: '2px',
          },
        },
        '& .MuiInputLabel-root': {
          color: '#f44336',
          fontWeight: 'bold',
        },
      };
    }
    
    return {};
  };
  return (
    <Box sx={{ p: 3, height: 'fit-content' }}>
      <Typography variant="h6" sx={{ mb: 2, pb: 1, borderBottom: 2, borderColor: 'primary.main' }}>
        Información de Transferencia
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="Nombre Titular"
          value={formData.accountHolder || ''}
          onChange={(e) => onFieldChange('accountHolder', e.target.value)}
          fullWidth
          variant="outlined"
          size="small"
          sx={getFieldStyle(formData.accountHolder, true)}
        />
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" sx={{ minWidth: 120 }}>
            Tipo de Cuenta
          </Typography>
          <FormControl size="small" sx={{ flexGrow: 1 }}>
            <Select
              value={formData.accountType || 'corriente'}
              onChange={(e) => onFieldChange('accountType', e.target.value)}
              displayEmpty
              MenuProps={{
                disableScrollLock: true,
                disablePortal: true,
                PaperProps: {
                  style: {
                    maxHeight: 48 * 5 + 8, // 5 elementos × 48px altura + padding
                    overflowX: 'hidden',
                    overflowY: 'auto',
                  },
                },
              }}
            >
              {ACCOUNT_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        
        <FormControl fullWidth size="small">
          <Typography variant="body2" sx={{ 
            mb: 1,
            color: shouldHighlight && (!formData.bank || formData.bank.trim() === '') ? '#f44336' : 'inherit',
            fontWeight: shouldHighlight && (!formData.bank || formData.bank.trim() === '') ? 'bold' : 'normal'
          }}>
            Banco
          </Typography>
          <Select
            value={formData.bank || ''}
            onChange={(e) => onFieldChange('bank', e.target.value)}
            displayEmpty
            sx={getFieldStyle(formData.bank, true)}
            MenuProps={{
              disableScrollLock: true,
              disablePortal: true,
              PaperProps: {
                style: {
                  maxHeight: 48 * 5 + 8, // 5 elementos × 48px altura + padding
                  overflowX: 'hidden',
                  overflowY: 'auto',
                },
              },
            }}
          >
            <MenuItem value="">
              <em>Seleccionar banco</em>
            </MenuItem>
            {BANKS.map((bank) => (
              <MenuItem key={bank} value={bank}>
                {bank}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <TextField
          label="N° de Cuenta"
          value={formData.accountNumber || ''}
          onChange={(e) => onFieldChange('accountNumber', e.target.value)}
          fullWidth
          variant="outlined"
          size="small"
          sx={getFieldStyle(formData.accountNumber, true)}
        />
        
        <TextField
          label="RUT"
          value={formData.transferRut || ''}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9kK]/g, '');
            const formatted = raw.replace(/(\d{1,2})(\d{3})(\d{3})([\dkK])?$/, (match, p1, p2, p3, p4) => {
              let rut = p1 + '.' + p2 + '.' + p3;
              if (p4) rut += '-' + p4;
              return rut;
            });
            onFieldChange('transferRut', formatted);
          }}
          fullWidth
          variant="outlined"
          size="small"
          error={!validateRut(formData.transferRut)}
          helperText={!validateRut(formData.transferRut) ? 'Formato de RUT inválido' : ''}
          sx={getFieldStyle(formData.transferRut, true)}
        />
        
        <TextField
          label="Correo Confirmación"
          value={formData.confirmationEmail || ''}
          onChange={(e) => onFieldChange('confirmationEmail', e.target.value)}
          fullWidth
          variant="outlined"
          size="small"
          type="email"
          error={!validateEmail(formData.confirmationEmail)}
          helperText={!validateEmail(formData.confirmationEmail) ? 'Formato de email inválido' : ''}
          sx={getFieldStyle(formData.confirmationEmail, true)}
        />
      </Box>
    </Box>
  );
};

export default TransferInfoSection;
