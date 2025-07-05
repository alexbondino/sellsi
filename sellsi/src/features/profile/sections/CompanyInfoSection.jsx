import React from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ProfileSwitch from '../ProfileSwitch';
import { validateRut, cleanRut } from '../../../utils/validators';

/**
 * Sección de Información de Empresa del perfil
 * Incluye: email, contraseña, teléfono, RUT, función
 */
const CompanyInfoSection = ({ 
  formData, 
  onFieldChange, 
  onPasswordModalOpen 
}) => {
  return (
    <Box sx={{ p: 3, height: 'fit-content' }}>
      <Typography variant="h6" sx={{ mb: 2, pb: 1, borderBottom: 2, borderColor: 'primary.main' }}>
        Información Empresa
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
        
        <TextField
          label="Teléfono"
          value={formData.phone || ''}
          onChange={(e) => onFieldChange('phone', e.target.value)}
          fullWidth
          variant="outlined"
          size="small"
          placeholder="56963109665"
        />
        
        <TextField
          label="RUT"
          value={formData.rut || ''}
          onChange={(e) => onFieldChange('rut', cleanRut(e.target.value))}
          fullWidth
          variant="outlined"
          size="small"
          placeholder="12345678-5"
          error={!validateRut(formData.rut)}
          helperText={!validateRut(formData.rut) ? 'Formato de RUT inválido (solo números, guion y dígito verificador)' : ''}
        />
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" sx={{ minWidth: 120 }}>
            Función
          </Typography>
          <ProfileSwitch
            type="role"
            value={formData.role || 'supplier'}
            onChange={(e, newValue) => onFieldChange('role', newValue)}
            sx={{ flexGrow: 1 }}
          />
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, ml: 0.5 }}>
          <InfoOutlinedIcon sx={{ fontSize: 16, color: 'primary.main', mr: 0.5 }} />
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Esta será tu función primaria. Cuando inicies sesión, verás el panel según tu función.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default CompanyInfoSection;
