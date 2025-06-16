import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Button,
  TextField,
  CircularProgress,
  Avatar,
} from '@mui/material';
import { supabase } from '../../services/supabase';
import toast from 'react-hot-toast';
import { CustomButton, CountrySelector } from '../ui'; // Asumiendo que existen

// ==================================================================
// COMPONENTE HELPER: Un uploader de logos simple y funcional
// Puedes reemplazar esto por tu componente 'LogoUploader' si ya lo tienes.
// ==================================================================
const LogoUploader = ({ logoPreview, onLogoSelect, size = 'large' }) => {
  const uploaderSize = size === 'large' ? 120 : 80;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1.5,
      }}
    >
      <label htmlFor="logo-upload">
        <input
          id="logo-upload"
          type="file"
          accept="image/png, image/jpeg, image/webp"
          style={{ display: 'none' }}
          onChange={onLogoSelect}
        />
        <Avatar
          src={logoPreview}
          sx={{
            width: uploaderSize,
            height: uploaderSize,
            cursor: 'pointer',
            bgcolor: '#f0f0f0',
            border: '2px dashed #ccc',
            '&:hover': {
              borderColor: 'primary.main',
            },
          }}
        >
          <Typography
            sx={{ fontSize: 12, color: '#666', textAlign: 'center', p: 1 }}
          >
            {!logoPreview && 'Subir Logo'}
          </Typography>
        </Avatar>
      </label>
    </Box>
  );
};

// ==================================================================
// COMPONENTE PRINCIPAL: Onboarding
// ==================================================================
const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    accountType: '',
    nombreEmpresa: '',
    nombrePersonal: '',
    telefonoContacto: '',
    codigoPais: '+56',
  });

  // ✅ 1. Nuevos estados para manejar el logo
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoError, setLogoError] = useState('');

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTypeSelect = type => {
    setFormData(prev => ({ ...prev, accountType: type }));
  };

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  // ✅ 2. Manejador para la selección del logo con validación
  const handleLogoChange = event => {
    const file = event.target.files[0];
    if (!file) return;

    // Validación de tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setLogoError('Formato de archivo no válido. Usa JPG, PNG o WEBP.');
      return;
    }

    // Validación de tamaño (300 KB)
    const maxSizeInBytes = 300 * 1024;
    if (file.size > maxSizeInBytes) {
      setLogoError('El archivo es muy grande. Máximo 300 KB.');
      return;
    }

    setLogoError('');
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  // ✅ 3. Limpieza de memoria para el preview del logo
  useEffect(() => {
    return () => {
      if (logoPreview) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  // ✅ 4. Lógica de subida y actualización
  const handleFinishOnboarding = async () => {
    setIsLoading(true);
    let logoPublicUrl = null;

    const {
      accountType,
      nombreEmpresa,
      nombrePersonal,
      telefonoContacto,
      codigoPais,
    } = formData;
    const isProvider = accountType === 'proveedor';

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

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no encontrado.');

      // PASO A: Subir el logo si existe (solo para proveedores)
      if (isProvider && logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const filePath = `public/${user.id}/logo.${fileExt}`;

        // Eliminar si ya existe para evitar errores de duplicados
        await supabase.storage.from('avatars').remove([filePath]);

        const { error: uploadError } = await supabase.storage
          .from('user-logos') // Asegúrate que el bucket se llame 'avatars'
          .upload(filePath, logoFile);

        if (uploadError) throw uploadError;

        // Obtener la URL pública del archivo subido
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        logoPublicUrl = urlData.publicUrl;
      }

      // PASO B: Actualizar la tabla 'users'
      const updates = {
        user_nm: newUserName,
        main_supplier: isProvider,
        phone_nbr: telefonoContacto,
        country: codigoPais,
        ...(logoPublicUrl && { logo_url: logoPublicUrl }), // Añadir logo_url solo si se subió
      };

      const { error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('user_id', user.id);
      if (updateError) throw updateError;

      toast.success('¡Perfil actualizado con éxito!');
      window.location.reload();
    } catch (error) {
      console.error('❌ Error al actualizar el perfil:', error);
      toast.error(
        error.message ||
          'Hubo un error al guardar tu perfil. Inténtalo de nuevo.'
      );
    } finally {
      setIsLoading(false);
    }
  };

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
              countries={['+56', '+54', '+52']}
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

          {/* ✅ 5. Se muestra el uploader solo para proveedores */}
          {isProvider && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
                mt: 2,
                p: 2,
                border: '1px solid #eee',
                borderRadius: 2,
              }}
            >
              <Typography sx={{ fontWeight: 500, fontSize: 14 }}>
                Logo de la Empresa
              </Typography>
              <LogoUploader
                logoPreview={logoPreview}
                onLogoSelect={handleLogoChange}
              />
              {logoError && (
                <Typography color="error" sx={{ fontSize: 12 }}>
                  {logoError}
                </Typography>
              )}
              <Typography sx={{ fontSize: 11, color: '#888' }}>
                Máximo 300 KB (JPG, PNG, WEBP)
              </Typography>
            </Box>
          )}
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
