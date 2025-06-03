import React from 'react';
import { Box, TextField, Typography } from '@mui/material';
import {
  CustomButton,
  LogoUploader,
  CountrySelector,
} from '../../hooks/shared';
import { supabase } from '../../services/supabase';

// 🔁 Función para enviar el correo
const sendAuthEmail = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const email = user?.email;
  const token = session?.access_token;

  if (email && token) {
    console.log('📧 Enviando correo a:', email); // 👈 Agregá esta línea

    await fetch(
      'https://pvtmkfckdaeiqrfjskrq.supabase.co/functions/v1/send-auth-email',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      }
    );
  }
};

const Step3Profile = ({
  accountType,
  formData,
  onFieldChange,
  onLogoChange,
  logoError,
  onNext,
  onBack,
}) => {
  const {
    nombreEmpresa,
    nombrePersonal,
    telefonoContacto,
    codigoPais,
    logoEmpresa,
  } = formData;

  const isProvider = accountType === 'proveedor';

  const isFormValid = () => {
    return isProvider
      ? nombreEmpresa?.trim().length > 0
      : nombrePersonal?.trim().length > 0;
  };

  const handleContinue = async () => {
    const correo = formData.correo;
    const contrasena = formData.contrasena;

    // Crear cuenta en Supabase Auth
    const { error: signUpError } = await supabase.auth.signUp({
      email: correo,
      password: contrasena,
    });

    if (signUpError) {
      console.error('Error al crear cuenta:', signUpError);
      return;
    }

    const data = {
      nombre: isProvider ? nombreEmpresa : nombrePersonal,
      telefono: telefonoContacto,
      pais: codigoPais,
    };

    localStorage.setItem('perfilUsuario', JSON.stringify(data));

    await sendAuthEmail(); // 📨 Enviar correo

    onNext();
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight={300}
    >
      <Typography
        variant="h5"
        sx={{
          mb: 8,
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
          maxWidth: isProvider ? 850 : 380,
          display: 'flex',
          flexDirection: isProvider ? { xs: 'column', md: 'row' } : 'column',
          gap: { xs: 2, md: 4 },
          justifyContent: 'center',
          alignItems: 'flex-start',
          mb: 2,
        }}
        noValidate
        autoComplete="off"
      >
        {isProvider ? (
          <>
            <Box sx={{ flex: 1, minWidth: 320 }}>
              <TextField
                label="Nombre de Empresa *"
                variant="outlined"
                fullWidth
                value={nombreEmpresa}
                onChange={e => onFieldChange('nombreEmpresa', e.target.value)}
                sx={{ mb: 1.5 }}
                size="small"
                required
              />
              <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                <CountrySelector
                  value={codigoPais}
                  onChange={e => onFieldChange('codigoPais', e.target.value)}
                  countries={['Chile', 'Argentina', 'México']}
                />
                <TextField
                  fullWidth
                  label="Teléfono de contacto"
                  value={telefonoContacto}
                  onChange={e =>
                    onFieldChange('telefonoContacto', e.target.value)
                  }
                  placeholder="Ej: 912345678"
                  type="tel"
                />
              </Box>
            </Box>

            <Box
              sx={{
                flex: 1,
                minWidth: 240,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 1.5,
              }}
            >
              <Typography
                sx={{
                  mb: 0.5,
                  fontWeight: 500,
                  textAlign: 'center',
                  fontSize: 14,
                }}
              >
                Sube la imagen con el logo de tu empresa
              </Typography>

              <LogoUploader
                logoPreview={logoEmpresa}
                onLogoSelect={onLogoChange}
                size="large"
              />

              {logoError && (
                <Typography
                  sx={{
                    color: 'red',
                    fontSize: 12,
                    textAlign: 'center',
                  }}
                >
                  {logoError}
                </Typography>
              )}

              <Typography
                sx={{ fontSize: 11, color: '#888', textAlign: 'center' }}
              >
                Tamaño máximo del archivo: 300 KB.
              </Typography>
            </Box>
          </>
        ) : (
          <>
            <TextField
              label="Nombre y Apellido *"
              variant="outlined"
              fullWidth
              value={nombrePersonal}
              onChange={e => onFieldChange('nombrePersonal', e.target.value)}
              sx={{ mb: 1.5 }}
              size="small"
              required
            />
            <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
              <CountrySelector
                value={codigoPais}
                onChange={e => onFieldChange('codigoPais', e.target.value)}
                countries={['Chile', 'Argentina', 'México']}
              />
              <TextField
                fullWidth
                label="Teléfono de contacto"
                value={telefonoContacto}
                onChange={e =>
                  onFieldChange('telefonoContacto', e.target.value)
                }
                placeholder="Ej: 912345678"
                type="tel"
              />
            </Box>
          </>
        )}
      </Box>

      <Box sx={{ width: '100%', maxWidth: 520 }}>
        <CustomButton
          onClick={handleContinue}
          fullWidth
          sx={{ mb: 0.5, mt: isProvider ? 15.5 : 24.5 }}
          disabled={!isFormValid()}
        >
          Continuar
        </CustomButton>

        <CustomButton
          variant="text"
          onClick={onBack}
          fullWidth
          sx={{ mt: 0.5 }}
        >
          Volver atrás
        </CustomButton>
      </Box>
    </Box>
  );
};

export default Step3Profile;
