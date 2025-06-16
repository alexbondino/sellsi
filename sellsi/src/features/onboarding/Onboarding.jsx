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
  Grid,
  Divider,
} from '@mui/material';
import { supabase } from '../../services/supabase';
import toast from 'react-hot-toast';

// Asumimos que estos componentes existen en tu proyecto y están bien estilizados.
import { CustomButton, CountrySelector } from '../ui';

// ==================================================================
// COMPONENTE HELPER: Uploader de logos (sin cambios)
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
            bgcolor: '#f5f5f5',
            border: '2px dashed #ccc',
            transition: 'border-color 0.3s',
            '&:hover': { borderColor: 'primary.main' },
          }}
        >
          <Typography
            sx={{ fontSize: 14, color: '#666', textAlign: 'center', p: 1 }}
          >
            {!logoPreview && 'Subir Logo'}
          </Typography>
        </Avatar>
      </label>
    </Box>
  );
};

// ==================================================================
// COMPONENTE PRINCIPAL: Onboarding (Apuntando al bucket 'user-logos')
// ==================================================================
const Onboarding = () => {
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    accountType: '',
    nombreEmpresa: '',
    telefonoContacto: '',
    codigoPais: '+56',
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoError, setLogoError] = useState('');

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTypeSelect = type => {
    setFormData(prev => ({ ...prev, accountType: type }));
  };

  const handleLogoChange = event => {
    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setLogoError('Formato no válido. Usa JPG, PNG o WEBP.');
      return;
    }

    const maxSizeInBytes = 300 * 1024;
    if (file.size > maxSizeInBytes) {
      setLogoError('Archivo muy grande. Máximo 300 KB.');
      return;
    }

    setLogoError('');
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  const handleFinishOnboarding = async () => {
    if (!formData.accountType) {
      toast.error('Por favor, elige un tipo de cuenta.');
      return;
    }
    if (!formData.nombreEmpresa.trim()) {
      toast.error('El nombre es obligatorio.');
      return;
    }

    setIsLoading(true);
    let logoPublicUrl = null;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no encontrado.');

      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const filePath = `public/${user.id}/logo.${fileExt}`;

        // ✅ Cambio 1: Apunta al nuevo bucket para remover
        await supabase.storage.from('user-logos').remove([filePath]);

        // ✅ Cambio 2: Apunta al nuevo bucket para subir
        const { error: uploadError } = await supabase.storage
          .from('user-logos')
          .upload(filePath, logoFile);
        if (uploadError) throw uploadError;

        // ✅ Cambio 3: Apunta al nuevo bucket para obtener la URL
        const { data: urlData } = supabase.storage
          .from('user-logos')
          .getPublicUrl(filePath);
        logoPublicUrl = urlData.publicUrl;
      }

      const updates = {
        user_nm: formData.nombreEmpresa,
        main_supplier: formData.accountType === 'proveedor',
        phone_nbr: formData.telefonoContacto,
        country: formData.codigoPais,
        ...(logoPublicUrl && { logo_url: logoPublicUrl }),
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
      toast.error(error.message || 'Hubo un error al guardar tu perfil.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = formData.accountType && formData.nombreEmpresa.trim();

  return (
    <Container component="main" maxWidth="md" sx={{ my: { xs: 4, md: 8 } }}>
      <Paper elevation={5} sx={{ p: { xs: 3, sm: 4, md: 6 }, borderRadius: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography
            component="h1"
            variant="h4"
            gutterBottom
            sx={{ fontWeight: 700 }}
          >
            Finaliza la configuración de tu cuenta
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Completa tu perfil para empezar a vender y comprar en Sellsi.
          </Typography>
        </Box>
        <Divider sx={{ mb: 4 }} />

        {/* --- SECCIÓN 1: TIPO DE CUENTA --- */}
        <Box sx={{ mb: 5 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, mb: 2, textAlign: 'center' }}
          >
            Paso 1: Elige tu rol principal
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              justifyContent: 'center',
            }}
          >
            <Button
              fullWidth
              variant={
                formData.accountType === 'proveedor' ? 'contained' : 'outlined'
              }
              onClick={() => handleTypeSelect('proveedor')}
              sx={{ py: 1.5, fontSize: '1rem' }}
            >
              Soy Proveedor
            </Button>
            <Button
              fullWidth
              variant={
                formData.accountType === 'comprador' ? 'contained' : 'outlined'
              }
              onClick={() => handleTypeSelect('comprador')}
              sx={{ py: 1.5, fontSize: '1rem' }}
            >
              Soy Comprador
            </Button>
          </Box>
          <Typography
            sx={{ color: '#888', fontSize: 12, textAlign: 'center', mt: 2 }}
          >
            *Este será tu rol por defecto, pero podrás cambiarlo más adelante.
          </Typography>
        </Box>

        <Divider sx={{ mb: 5 }} />

        {/* --- SECCIÓN 2: DATOS DEL PERFIL --- */}
        <Box>
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, mb: 3, textAlign: 'center' }}
          >
            Paso 2: Completa los datos de tu perfil
          </Typography>

          <Grid container spacing={5} alignItems="center">
            {/* Columna Izquierda: Campos de Texto */}
            <Grid item xs={12} md={7}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  label="Nombre de Empresa o Personal *"
                  variant="outlined"
                  fullWidth
                  value={formData.nombreEmpresa}
                  onChange={e =>
                    handleFieldChange('nombreEmpresa', e.target.value)
                  }
                  required
                  helperText="Este será tu nombre público en la plataforma."
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <CountrySelector
                    value={formData.codigoPais}
                    onChange={e =>
                      handleFieldChange('codigoPais', e.target.value)
                    }
                    countries={['+56', '+54', '+52', '+51', '+57']}
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
              </Box>
            </Grid>

            {/* Columna Derecha: Solo el Uploader de Logo */}
            <Grid item xs={12} md={5}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  bgcolor: '#fafafa',
                  p: 3,
                  borderRadius: 2,
                  height: '100%',
                }}
              >
                <Typography sx={{ fontWeight: 500, fontSize: 16, mb: 2 }}>
                  Logo (Opcional)
                </Typography>
                <LogoUploader
                  logoPreview={logoPreview}
                  onLogoSelect={handleLogoChange}
                />
                {logoError ? (
                  <Typography color="error" sx={{ fontSize: 12, mt: 2 }}>
                    {logoError}
                  </Typography>
                ) : (
                  <Typography sx={{ fontSize: 12, color: '#666', mt: 2 }}>
                    Máximo 300 KB (JPG, PNG, WEBP)
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* --- SECCIÓN 3: BOTÓN DE ACCIÓN FINAL --- */}
        <Box sx={{ mt: 6, display: 'flex', justifyContent: 'center' }}>
          <CustomButton
            onClick={handleFinishOnboarding}
            disabled={isLoading || !isFormValid}
            sx={{ py: 1.5, px: 8, fontSize: '1.1rem' }}
          >
            {isLoading ? (
              <CircularProgress size={26} color="inherit" />
            ) : (
              'Guardar y Finalizar'
            )}
          </CustomButton>
        </Box>
      </Paper>
    </Container>
  );
};

export default Onboarding;
