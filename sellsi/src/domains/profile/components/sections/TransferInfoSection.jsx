import React from 'react';
import { Box, Typography, TextField } from '@mui/material';
import ProfileSwitch from '../ProfileSwitch';
import { validateRut, validateEmail } from '../../../../utils/validators';

/**
 * Sección de Información de Transferencia del perfil
 * Incluye: titular, tipo cuenta, banco, número cuenta, RUT, email confirmación
 */
const TransferInfoSection = ({ 
  formData, 
  onFieldChange,
  showSensitiveData,
  toggleSensitiveData,
  getSensitiveFieldValue
}) => {
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
        />
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" sx={{ minWidth: 120 }}>
            Tipo de Cuenta
          </Typography>
          <ProfileSwitch
            type="accountType"
            value={formData.accountType || 'corriente'}
            onChange={(e, newValue) => onFieldChange('accountType', newValue)}
            sx={{ flexGrow: 1 }}
          />
        </Box>
        
        <TextField
          label="Banco"
          value={formData.bank || ''}
          onChange={(e) => onFieldChange('bank', e.target.value)}
          fullWidth
          variant="outlined"
          size="small"
        />
        
        <TextField
          label="N° de Cuenta"
          value={formData.accountNumber || ''}
          onChange={(e) => onFieldChange('accountNumber', e.target.value)}
          fullWidth
          variant="outlined"
          size="small"

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
        />
      </Box>
    </Box>
  );
};

export default TransferInfoSection;
