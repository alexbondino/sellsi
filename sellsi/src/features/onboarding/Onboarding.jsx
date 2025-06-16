import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Button,
  TextField,
  CircularProgress,
} from '@mui/material';
import { supabase } from '../../services/supabase';
import toast from 'react-hot-toast';

// Asumimos que estos componentes existen en tu proyecto.
// Si no, puedes reemplazarlos por componentes estándar de MUI mientras los desarrollas.
import { CustomButton, CountrySelector } from '../ui';

const Onboarding = () => {
  const [step, setStep] = useState(1); // 1: Tipo de cuenta, 2: Perfil
  const [isLoading, setIsLoading] = useState(false);

  // Estado para manejar toda la data del formulario
  const [formData, setFormData] = useState({
    accountType: '', // 'proveedor' o 'comprador'
    nombreEmpresa: '',
    nombrePersonal: '',
    telefonoContacto: '',
    codigoPais: '+56', // Default para Chile, puedes cambiarlo
  });

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTypeSelect = type => {
    setFormData(prev => ({ ...prev, accountType: type }));
  };

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  // La función clave que actualiza al usuario en Supabase
  const handleFinishOnboarding = async () => {
    setIsLoading(true);

    const {
      accountType,
      nombreEmpresa,
      nombrePersonal,
      telefonoContacto,
      codigoPais,
    } = formData;
    const isProvider = accountType === 'proveedor';

    // 1. Determinar los datos a actualizar
    const newUserName = isProvider ? nombreEmpresa : nombrePersonal;
    if (!newUserName.trim()) {
      toast.error(
        isProvider
          ? 'El nombre de la empresa es obligatorio.'
          : 'Tu nombre es obligatorio.'
      );
      setIsLoading(false);
      return;
    }

    const updates = {
      user_nm: newUserName,
      main_supplier: isProvider,
      phone_nbr: `${codigoPais}${telefonoContacto}`,
      country: codigoPais, // Asegúrate que tu columna se llame así en la tabla 'users'
    };

    try {
      // 2. Obtener el usuario autenticado actual
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user)
        throw userError || new Error('Usuario no encontrado.');

      // 3. Actualizar la fila en la tabla 'users'
      const { error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      toast.success('¡Perfil actualizado con éxito!');

      // 4. Forzar una recarga de la página para que App.jsx redirija al dashboard
      window.location.reload();
    } catch (error) {
      console.error('❌ Error al actualizar el perfil:', error);
      toast.error('Hubo un error al guardar tu perfil. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // ==================================================================
  // RENDERIZADO CONDICIONAL DE LOS PASOS
  // ==================================================================

  const renderStep1_AccountType = () => (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
    >
      <Typography
        variant="h5"
        sx={{
          mb: { xs: 1, md: 4 },
          mt: 2,
          fontWeight: 700,
          textAlign: 'center',
          fontSize: { xs: 18, lg: 22 },
        }}
      >
        Elige tu tipo de cuenta predeterminado
      </Typography>

      {/* Aquí he simplificado la UI para mayor claridad, pero puedes pegar tu código de cards/botones aquí */}
      <Box sx={{ display: 'flex', gap: 2, my: 3 }}>
        <Button
          variant={
            formData.accountType === 'proveedor' ? 'contained' : 'outlined'
          }
          onClick={() => handleTypeSelect('proveedor')}
          sx={{ py: 2, px: 4 }}
        >
          Cuenta Proveedor
        </Button>
        <Button
          variant={
            formData.accountType === 'comprador' ? 'contained' : 'outlined'
          }
          onClick={() => handleTypeSelect('comprador')}
          sx={{ py: 2, px: 4 }}
        >
          Cuenta Comprador
        </Button>
      </Box>
      {/* Puedes añadir las descripciones de los beneficios aquí si lo deseas */}

      <Typography
        sx={{ color: '#888', fontSize: 12, mb: 3, textAlign: 'center' }}
      >
        *Podrás cambiar el tipo de cuenta más adelante desde tu perfil.
      </Typography>
      <Box sx={{ width: '100%', maxWidth: 400 }}>
        <CustomButton
          onClick={handleNext}
          disabled={!formData.accountType}
          fullWidth
        >
          Continuar
        </CustomButton>
      </Box>
    </Box>
  );

  const renderStep2_ProfileInfo = () => {
    const isProvider = formData.accountType === 'proveedor';
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
      >
        <Typography
          variant="h5"
          sx={{
            mb: 4,
            mt: 2,
            fontWeight: 700,
            textAlign: 'center',
            fontSize: 22,
          }}
        >
          {isProvider
            ? 'Completa los datos de tu empresa'
            : 'Completa tus datos personales'}
        </Typography>

        <Box
          component="form"
          sx={{
            width: '100%',
            maxWidth: 400,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
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
            required
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <CountrySelector
              value={formData.codigoPais}
              onChange={e => handleFieldChange('codigoPais', e.target.value)}
              countries={['+56', '+54', '+52']} // Ajusta según tu componente
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
          {/* He omitido el LogoUploader para simplificar, pero puedes añadirlo aquí si lo deseas */}
        </Box>

        <Box sx={{ width: '100%', maxWidth: 400, mt: 4 }}>
          <CustomButton
            onClick={handleFinishOnboarding}
            fullWidth
            disabled={isLoading}
          >
            {isLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Finalizar y Guardar'
            )}
          </CustomButton>
          <CustomButton
            variant="text"
            onClick={handleBack}
            fullWidth
            sx={{ mt: 1 }}
          >
            Volver atrás
          </CustomButton>
        </Box>
      </Box>
    );
  };

  return (
    <Container component="main" maxWidth="md" sx={{ mt: 8 }}>
      <Paper
        elevation={3}
        sx={{
          p: { xs: 2, sm: 4 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h4" gutterBottom>
          ¡Bienvenido a Sellsi!
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ mb: 4, textAlign: 'center' }}
        >
          Solo unos pasos más para configurar tu cuenta.
        </Typography>

        <Box sx={{ width: '100%', minHeight: 400 }}>
          {step === 1 && renderStep1_AccountType()}
          {step === 2 && renderStep2_ProfileInfo()}
        </Box>
      </Paper>
    </Container>
  );
};

export default Onboarding;
