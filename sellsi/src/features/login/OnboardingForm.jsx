import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  Typography,
  TextField,
  Button,
} from '@mui/material';
import { useOnboardingForm } from '../../../hooks/useOnboardingForm';
import { PrimaryButton, CountrySelector } from '../../landing_page/hooks'; // Ajusta la ruta si es necesario

// Componente para los botones de selección de tipo de cuenta
const AccountTypeSelector = ({ selectedType, onTypeSelect }) => (
  <Box
    sx={{
      display: 'flex',
      gap: 1,
      mb: 4,
      p: 0.5,
      backgroundColor: '#f5f5f5',
      borderRadius: 2,
    }}
  >
    <Button
      onClick={() => onTypeSelect('proveedor')}
      sx={{
        flex: 1,
        py: 1.5,
        borderRadius: 1.5,
        fontWeight: 600,
        backgroundColor:
          selectedType === 'proveedor' ? '#41B6E6' : 'transparent',
        color: selectedType === 'proveedor' ? '#fff' : '#666',
        '&:hover': {
          backgroundColor: selectedType !== 'proveedor' && '#e0e0e0',
        },
      }}
    >
      Soy Proveedor
    </Button>
    <Button
      onClick={() => onTypeSelect('comprador')}
      sx={{
        flex: 1,
        py: 1.5,
        borderRadius: 1.5,
        fontWeight: 600,
        backgroundColor:
          selectedType === 'comprador' ? '#41B6E6' : 'transparent',
        color: selectedType === 'comprador' ? '#fff' : '#666',
        '&:hover': {
          backgroundColor: selectedType !== 'comprador' && '#e0e0e0',
        },
      }}
    >
      Soy Comprador
    </Button>
  </Box>
);

const OnboardingForm = ({ open, user, onClose }) => {
  const {
    formData,
    loading,
    handleFieldChange,
    handleTypeSelect,
    isFormValid,
    handleSubmit,
  } = useOnboardingForm(onClose);

  if (!user) return null;

  const isProvider = formData.tipoCuenta === 'proveedor';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', fontWeight: 700, pt: 3 }}>
        ¡Bienvenido(a)! Completa tu perfil
      </DialogTitle>
      <DialogContent>
        <Box
          component="form"
          onSubmit={handleSubmit}
          display="flex"
          flexDirection="column"
          alignItems="center"
          p={{ xs: 1, sm: 2 }}
        >
          <Typography
            variant="body1"
            sx={{ mb: 2, color: 'text.secondary', textAlign: 'center' }}
          >
            Solo necesitamos unos datos más para configurar tu cuenta.
          </Typography>

          <AccountTypeSelector
            selectedType={formData.tipoCuenta}
            onTypeSelect={handleTypeSelect}
          />

          {/* Campo de Nombre condicional */}
          <TextField
            label={isProvider ? 'Nombre de Empresa *' : 'Nombre y Apellido *'}
            variant="outlined"
            fullWidth
            value={
              isProvider ? formData.nombreEmpresa : formData.nombrePersonal
            }
            onChange={e =>
              handleFieldChange(
                isProvider ? 'nombreEmpresa' : 'nombrePersonal',
                e.target.value
              )
            }
            sx={{ mb: 2, maxWidth: 450 }}
            required
          />

          {/* País y Teléfono */}
          <Box
            sx={{
              display: 'flex',
              gap: 1.5,
              mb: 4,
              width: '100%',
              maxWidth: 450,
            }}
          >
            <CountrySelector
              value={formData.codigoPais}
              onChange={e => handleFieldChange('codigoPais', e.target.value)}
            />
            <TextField
              fullWidth
              label="Teléfono de contacto"
              value={formData.telefonoContacto}
              onChange={e =>
                handleFieldChange('telefonoContacto', e.target.value)
              }
              placeholder="Ej: 912345678"
              type="tel"
            />
          </Box>

          <PrimaryButton
            type="submit"
            fullWidth
            disabled={!isFormValid() || loading}
            sx={{ maxWidth: 450, height: 48 }}
          >
            {loading ? 'Guardando...' : 'Finalizar y Guardar'}
          </PrimaryButton>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingForm;
