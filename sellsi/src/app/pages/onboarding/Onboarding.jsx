import React, { useState, useEffect, useCallback } from 'react';
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
  Card,
  CardActionArea,
  useTheme,
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { supabase } from '../../../services/supabase';

// Asumimos que estos componentes existen en tu proyecto y están bien estilizados.
import PrimaryButton from '../../../shared/components/forms/PrimaryButton';
import CountrySelector from '../../../shared/components/forms/CountrySelector';

// ==================================================================
// COMPONENTE HELPER: Uploader de logos (estilo mejorado)
// ==================================================================
const LogoUploader = ({
  logoPreview,
  onLogoSelect,
  size = 'large',
  logoError,
}) => {
  const uploaderSize = size === 'large' ? 120 : 80;
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1.5,
      }}
    >
      <label htmlFor="logo-upload" style={{ cursor: 'pointer' }}>
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
            bgcolor: logoError
              ? theme.palette.error.light
              : theme.palette.grey[100],
            border: logoError
              ? `2px solid ${theme.palette.error.main}`
              : `2px dashed ${theme.palette.grey[400]}`,
            transition: 'border-color 0.3s, background-color 0.3s',
            boxShadow: theme.shadows[2],
            '&:hover': {
              borderColor: theme.palette.primary.main,
              bgcolor: theme.palette.grey[200],
            },
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: theme.palette.text.secondary,
            '& svg': {
              fontSize: uploaderSize / 2,
            },
          }}
        >
          {!logoPreview && <PhotoCameraIcon />}
          {logoPreview && !logoError && (
            <Typography
              sx={{ fontSize: 14, color: '#666', textAlign: 'center', p: 1 }}
            >
              Cambiar Logo
            </Typography>
          )}
        </Avatar>
      </label>
      {logoError && (
        <Typography
          color="error"
          variant="caption"
          sx={{ fontSize: 12, mt: 0.5 }}
        >
          {logoError}
        </Typography>
      )}
    </Box>
  );
};

// ==================================================================
// COMPONENTE PRINCIPAL: Onboarding
// ==================================================================
const Onboarding = () => {
  const [isLoading, setIsLoading] = useState(false);
  const theme = useTheme();

  const [formData, setFormData] = useState({
    accountType: '',
    nombreEmpresa: '',
    telefonoContacto: '',
    codigoPais: '', // Default to Chile
    descripcionProveedor: '',
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoError, setLogoError] = useState('');

  useEffect(() => {
  }, [logoPreview]);

  const handleFieldChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleTypeSelect = useCallback(type => {
    setFormData(prev => ({ ...prev, accountType: type }));
  }, []);

  const handleLogoChange = useCallback(event => {
    const file = event.target.files[0];
    if (!file) {
      setLogoPreview(null);
      setLogoFile(null);
      setLogoError('');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setLogoError('Formato no válido. Usa JPG, PNG o WEBP.');
      setLogoPreview(null);
      setLogoFile(null);
      return;
    }

    const maxSizeInBytes = 300 * 1024; // 300 KB
    if (file.size > maxSizeInBytes) {
      setLogoError('Archivo muy grande. Máximo 300 KB.');
      setLogoPreview(null);
      setLogoFile(null);
      return;
    }

    setLogoError('');
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }, []);

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
    if (logoError) {
      toast.error('Corrige el error del logo antes de continuar.');
      return;
    }

    setIsLoading(true);
    let logoPublicUrl = null;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error(
          'Usuario no encontrado. Por favor, inicia sesión de nuevo.'
        );
      }

      // ✅ INICIO DE LA CORRECCIÓN: Validar y añadir el email
      // Esta validación es crucial si la columna 'email' es NOT NULL en tu tabla 'users'
      if (!user.email) {
        // Lanza un error si el email no está disponible, para evitar el error de la base de datos
        throw new Error(
          'El correo electrónico del usuario no está disponible para guardar el perfil. Intenta iniciar sesión nuevamente o contacta a soporte.'
        );
      }
      // ✅ FIN DE LA CORRECCIÓN: Validar y añadir el email

      const { data: existingProfile, error: existingProfileError } =
        await supabase
          .from('users')
          .select('logo_url')
          .eq('user_id', user.id)
          .single();

      if (existingProfileError && existingProfileError.code !== 'PGRST116') {
        console.warn(
          'No existing profile found or other error:',
          existingProfileError
        );
      }

      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const staticFilePath = `${user.id}/logo.${fileExt}`; // Consistent path for overwrite

        const { error: uploadError } = await supabase.storage
          .from('user-logos')
          .upload(staticFilePath, logoFile, {
            upsert: true,
          });

        if (uploadError) {
          console.error('Supabase Upload Error:', uploadError);
          throw new Error(`Error al subir el logo: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
          .from('user-logos')
          .getPublicUrl(staticFilePath);
        logoPublicUrl = urlData.publicUrl;
      } else if (existingProfile?.logo_url && !logoPreview) {
        const oldLogoPathToDelete =
          existingProfile.logo_url.split('user-logos/')[1];
        if (oldLogoPathToDelete) {
          await supabase.storage
            .from('user-logos')
            .remove([oldLogoPathToDelete]);
          logoPublicUrl = null;
        }
      }

      const updates = {
        user_nm: formData.nombreEmpresa,
        main_supplier: formData.accountType === 'proveedor',
        phone_nbr: formData.telefonoContacto,
        country: formData.codigoPais,
        logo_url: logoPublicUrl,
        email: user.email, // ✅ ¡LA CORRECCIÓN CLAVE AQUÍ! Se añade el email.
        // Añadir descripción solo si es proveedor
        ...(formData.accountType === 'proveedor' && {
          descripcion_proveedor: formData.descripcionProveedor,
        }),
      };

      const { error: upsertError } = await supabase
        .from('users')
        .upsert({ user_id: user.id, ...updates }, { onConflict: 'user_id' });

      if (upsertError) {
        console.error('Supabase Upsert Error:', upsertError);
        throw new Error(`Error al guardar tu perfil: ${upsertError.message}`);
      }

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
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 9999,
          background: '#fff',
          color: '#000',
        }}
      >
        Onboarding debug
      </div>
      <Container
        component="main"
        // Se mantiene el maxWidth del Container como lo proporcionaste en tu último mensaje.
        // Esto significa maxWidth: '1100px' si esa era la intención.
        sx={{ maxWidth: '1100px', my: { xs: 4, md: 8 } }}
      >
        <Paper
          elevation={6}
          sx={{
            p: { xs: 3, sm: 4, md: 6 },
            borderRadius: 4,
            overflow: 'hidden',
            bgcolor: theme.palette.background.paper,
            boxShadow: `0px 10px 30px rgba(0, 0, 0, 0.1)`,
          }}
        >
          {/* --- Header Section --- */}
          <Box sx={{ textAlign: 'center', mb: 5 }}>
            <Typography
              component="h1"
              variant="h4"
              sx={{
                fontWeight: 700,
                color: theme.palette.primary.main,
                mb: 1.5,
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              }}
            >
              ¡Bienvenido a Sellsi!
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ fontSize: { xs: '1rem', sm: '1.15rem' } }}
            >
              Finaliza la configuración de tu cuenta para empezar.
            </Typography>
          </Box>

          <Divider sx={{ mb: 5 }} />

          {/* --- SECCIÓN 1: TIPO DE CUENTA --- */}
          <Box sx={{ mb: 5, textAlign: 'center' }}>
            <Typography
              variant="h5"
              sx={{ fontWeight: 600, mb: 3, color: theme.palette.text.primary }}
            >
              Paso 1: Elige tu rol principal
            </Typography>{' '}
            <Grid container spacing={3} justifyContent="center">
              {/* Proveedor Card */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    borderColor:
                      formData.accountType === 'proveedor'
                        ? theme.palette.primary.main
                        : theme.palette.grey[300],
                    borderWidth:
                      formData.accountType === 'proveedor' ? '2px' : '1px',
                    boxShadow:
                      formData.accountType === 'proveedor'
                        ? theme.shadows[4]
                        : 'none',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      boxShadow: theme.shadows[6],
                      transform: 'translateY(-3px)',
                    },
                  }}
                >
                  <CardActionArea
                    onClick={() => handleTypeSelect('proveedor')}
                    sx={{
                      p: 4,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                    }}
                  >
                    <BusinessIcon
                      sx={{
                        fontSize: 60,
                        color:
                          formData.accountType === 'proveedor'
                            ? theme.palette.primary.main
                            : theme.palette.grey[600],
                        mb: 1.5,
                      }}
                    />
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Soy Proveedor
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ textAlign: 'center' }}
                    >
                      Ofrece tus productos y servicios al mercado.
                    </Typography>
                  </CardActionArea>
                </Card>
              </Grid>{' '}
              {/* Comprador Card */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    borderColor:
                      formData.accountType === 'comprador'
                        ? theme.palette.primary.main
                        : theme.palette.grey[300],
                    borderWidth:
                      formData.accountType === 'comprador' ? '2px' : '1px',
                    boxShadow:
                      formData.accountType === 'comprador'
                        ? theme.shadows[4]
                        : 'none',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      boxShadow: theme.shadows[6],
                      transform: 'translateY(-3px)',
                    },
                  }}
                >
                  <CardActionArea
                    onClick={() => handleTypeSelect('comprador')}
                    sx={{
                      p: 4,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                    }}
                  >
                    <ShoppingCartIcon
                      sx={{
                        fontSize: 60,
                        color:
                          formData.accountType === 'comprador'
                            ? theme.palette.primary.main
                            : theme.palette.grey[600],
                        mb: 1.5,
                      }}
                    />
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Soy Comprador
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ textAlign: 'center' }}
                    >
                      Explora y adquiere los mejores productos.
                    </Typography>
                  </CardActionArea>
                </Card>
              </Grid>
            </Grid>
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.secondary,
                mt: 2,
                display: 'block',
              }}
            >
              *Este será tu rol por defecto, pero podrás cambiarlo más adelante en
              tu perfil.
            </Typography>
          </Box>

          <Divider sx={{ mb: 5 }} />

          {/* --- SECCIÓN 2: DATOS DEL PERFIL --- */}
          <Box sx={{ mb: 5 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                mb: 3,
                textAlign: 'center',
                color: theme.palette.text.primary,
              }}
            >
              Paso 2: Completa los datos de tu perfil
            </Typography>

            {/* Se mantiene el maxWidth del Grid container como lo proporcionaste en tu último mensaje. */}
            <Grid
              container
              spacing={5}
              alignItems="flex-start"
              justifyContent="center" // Centra el contenido horizontalmente
              sx={{
                // Este maxWidth es solo para este Grid, no para el Container principal
                maxWidth: {
                  xs: '100%',
                  md: '800px', // Un ancho máximo para pantallas medianas, más pequeño que el Container.
                  lg: '950px', // Un ancho máximo para pantallas grandes, aún contenido.
                },
                mx: 'auto', // Auto margins para centrar el Grid si tiene un maxWidth
              }}
            >
              {' '}
              {/* Columna Izquierda: Campos de Texto */}
              <Grid size={{ xs: 12, md: 7 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <TextField
                    label="Nombre de Empresa o Personal *"
                    variant="outlined"
                    fullWidth
                    value={formData.nombreEmpresa}
                    inputProps={{ maxLength: 35 }}
                    onChange={e =>
                      handleFieldChange('nombreEmpresa', e.target.value)
                    }
                    required
                    helperText={`Este será tu nombre público en la plataforma (ej. Tu Empresa S.A., o Juan Pérez). (${formData.nombreEmpresa.length}/35)`}
                    sx={{ '.MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <CountrySelector
                      value={formData.codigoPais}
                      onChange={e =>
                        handleFieldChange('codigoPais', e.target.value)
                      }
                      countries={['+56', '+54', '+52', '+51', '+57']}
                      sx={{
                        minWidth: 100,
                        '.MuiOutlinedInput-root': { borderRadius: 2 },
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Teléfono de contacto"
                      value={formData.telefonoContacto}
                      inputProps={{ maxLength: 15 }}
                      onChange={e =>
                        handleFieldChange('telefonoContacto', e.target.value)
                      }
                      placeholder="Ej: 912345678"
                      type="tel"
                      helperText={`${formData.telefonoContacto.length}/15`}
                      sx={{ '.MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Box>
                  {/* Campo de descripción solo para proveedores */}
                  {formData.accountType === 'proveedor' && (
                    <TextField
                      label="Descripción breve del proveedor"
                      variant="outlined"
                      fullWidth
                      multiline
                      rows={3}
                      value={formData.descripcionProveedor}
                      onChange={e => {
                        const value = e.target.value;
                        if (value.length <= 200) {
                          handleFieldChange('descripcionProveedor', value);
                        }
                      }}
                      placeholder="Una descripción resumida del tipo de productos que comercializas..."
                      helperText={`Una descripción resumida del tipo de productos que comercializas. Esta información ayudará a los compradores a identificar rápidamente tu oferta. (${formData.descripcionProveedor.length}/200)`}
                      sx={{ '.MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  )}
                </Box>
              </Grid>{' '}
              {/* Columna Derecha: Uploader de Logo */}
              <Grid size={{ xs: 12, md: 5 }}>
                <Paper
                  variant="outlined"
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    bgcolor: theme.palette.grey[50],
                    p: 3,
                    borderRadius: 3,
                    minHeight: '200px',
                    justifyContent: 'center',
                    boxShadow: theme.shadows[1],
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 500,
                      fontSize: 16,
                      mb: 2,
                      color: theme.palette.text.primary,
                    }}
                  >
                    Logo (Opcional)
                  </Typography>
                  <LogoUploader
                    logoPreview={logoPreview}
                    onLogoSelect={handleLogoChange}
                    logoError={logoError}
                  />
                  {!logoError && (
                    <Typography
                      variant="caption"
                      sx={{ color: theme.palette.text.secondary, mt: 2 }}
                    >
                      Máximo 300 KB (JPG, PNG, WEBP)
                    </Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Box>

          {/* --- SECCIÓN 3: BOTÓN DE ACCIÓN FINAL --- */}
          <Box sx={{ mt: 6, display: 'flex', justifyContent: 'center' }}>
            <PrimaryButton
              onClick={handleFinishOnboarding}
              disabled={isLoading || !isFormValid} // 'disabled' prop ya controla el estado
              sx={{
                py: 1.8,
                px: 8,
                fontSize: '1.2rem',
                fontWeight: 700,
                borderRadius: 3,
                boxShadow: theme.shadows[8],
                // Estilos cuando el botón está HABILITADO (por defecto)
                background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`,
                color: 'white',
                '&:hover': {
                  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
                  boxShadow: theme.shadows[10],
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease-in-out',
                // Estilos cuando el botón está DESHABILITADO
                '&.Mui-disabled': {
                  // Selector de Material-UI para el estado deshabilitado
                  background: theme.palette.grey[400], // Fondo gris
                  color: 'white', // Letra blanca
                  boxShadow: 'none', // Sin sombra cuando deshabilitado
                  cursor: 'not-allowed', // Cambia el cursor
                  transform: 'none', // Elimina la transformación
                  '&:hover': {
                    // También limpia el hover en estado deshabilitado
                    background: theme.palette.grey[400],
                  },
                },
              }}
            >
              {isLoading ? (
                <CircularProgress size={26} color="inherit" />
              ) : (
                'Guardar y Finalizar'
              )}
            </PrimaryButton>
          </Box>
        </Paper>
      </Container>
    </>
  );
};

export default Onboarding;
