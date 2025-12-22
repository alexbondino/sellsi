import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  TextField,
  CircularProgress,
  Avatar,
  Divider,
  Card,
  CardActionArea,
  useTheme,
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { supabase } from '../../../../services/supabase';
import { useOptimizedUserShippingRegion } from '../../../../hooks/useOptimizedUserShippingRegion';
import { useBanner } from '../../../../shared/components/display/banners/BannerContext';

// Asumimos que estos componentes existen en tu proyecto y están bien estilizados.
import PrimaryButton from '../../../../shared/components/forms/PrimaryButton';
import CountrySelector from '../../../../shared/components/forms/CountrySelector';
import { validatePhone, normalizePhone } from '../../../../utils/validators';
import { invalidateUserProfileCache } from '../../../../services/user/profileService';
import {
  TaxDocumentSelector,
  BillingInfoForm,
} from '../../../../shared/components';
import { Collapse } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../infrastructure/providers/UnifiedAuthProvider';

// Si usas Grid v6 (Grid2), mantén "size={{ xs: 12 }}".
// Si usas Grid v5, cambia a item xs={12}.
import Grid from '@mui/material/Grid';

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
  const navigate = useNavigate();
  const { showBanner } = useBanner();
  const { refreshUserProfile } = useAuth();

  const [formData, setFormData] = useState({
    accountType: '',
    nombreEmpresa: '',
    telefonoContacto: '',
    codigoPais: '', // Default to Chile
    descripcionProveedor: '',

    // Documento Tributario
    documentTypes: [],

    // Facturación
    businessName: '',
    billingRut: '',
    businessLine: '',
    billingAddress: '',
    billingRegion: '',
    billingCommune: '',
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoError, setLogoError] = useState('');

  // Hook para primar caché de región inmediatamente al finalizar onboarding
  const { primeUserRegionCache } = useOptimizedUserShippingRegion();

  useEffect(() => {}, [logoPreview]);

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
    // Validaciones mínimas
    if (!formData.accountType) {
      console.error('Por favor, elige un tipo de cuenta.');
      return;
    }
    if (!formData.nombreEmpresa.trim()) {
      console.error('El nombre es obligatorio.');
      return;
    }

    // Validar facturación si corresponde
    if (
      formData.accountType === 'proveedor' &&
      formData.documentTypes?.includes('factura')
    ) {
      const hasBillingInfo =
        formData.businessName &&
        formData.billingRut &&
        formData.businessLine &&
        formData.billingAddress &&
        formData.billingRegion &&
        formData.billingCommune;

      if (!hasBillingInfo) {
        console.error('Por favor completa todos los campos de Facturación.');
        return;
      }
    }

    if (logoError) {
      console.error('Corrige el error del logo antes de continuar.');
      return;
    }

    setIsLoading(true);
    let logoPublicUrl = null;

    try {
      const {
        data: { user },
        error: getUserError,
      } = await supabase.auth.getUser();

      if (getUserError) {
        throw new Error(getUserError.message || 'Error al obtener usuario.');
      }
      if (!user) {
        throw new Error(
          'Usuario no encontrado. Por favor, inicia sesión de nuevo.'
        );
      }

      if (!user.email) {
        throw new Error(
          'El correo electrónico del usuario no está disponible para guardar el perfil. Intenta iniciar sesión nuevamente o contacta a soporte.'
        );
      }

      // Perfil existente (para posibles limpiezas de logo)
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

      // Manejo de logo
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const staticFilePath = `${user.id}/logo.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('user-logos')
          .upload(staticFilePath, logoFile, { upsert: true });

        if (uploadError) {
          console.error('Supabase Upload Error:', uploadError);
          throw new Error(`Error al subir el logo: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
          .from('user-logos')
          .getPublicUrl(staticFilePath);
        logoPublicUrl = urlData.publicUrl;
      } else if (existingProfile?.logo_url && !logoPreview) {
        // Si antes tenía logo y ahora no, lo eliminamos
        const oldLogoPathToDelete =
          existingProfile.logo_url.split('user-logos/')[1];
        if (oldLogoPathToDelete) {
          await supabase.storage
            .from('user-logos')
            .remove([oldLogoPathToDelete]);
          logoPublicUrl = null;
        }
      }

      // 📝 Payload para tabla users (solo campos que existen)
      const userUpdates = {
        user_id: user.id,
        user_nm: formData.nombreEmpresa,
        main_supplier: formData.accountType === 'proveedor',
        phone_nbr: normalizePhone(
          formData.codigoPais || 'CL',
          formData.telefonoContacto || ''
        ),
        country: formData.codigoPais,
        logo_url: logoPublicUrl,
        email: user.email,
        ...(formData.accountType === 'proveedor' && {
          descripcion_proveedor: formData.descripcionProveedor,
          document_types: formData.documentTypes || [],
        }),
      };

      console.log('🔍 [ONBOARDING] Payload users:', JSON.stringify(userUpdates, null, 2));

      // Upsert en tabla users
      const { error: upsertError } = await supabase
        .from('users')
        .upsert(userUpdates, { onConflict: 'user_id' });

      if (upsertError) {
        console.error('❌ [ONBOARDING] Supabase Upsert Error:', upsertError);
        console.error('📦 Payload que falló:', userUpdates);
        throw new Error(`Error al guardar tu perfil: ${upsertError.message}`);
      }

      console.log('✅ [ONBOARDING] Usuario guardado exitosamente');

      // 💰 Si es proveedor y seleccionó factura, guardar en billing_info
      if (
        formData.accountType === 'proveedor' &&
        formData.documentTypes?.includes('factura')
      ) {
        const billingUpdates = {
          user_id: user.id,
          business_name: formData.businessName,
          billing_rut: formData.billingRut,
          business_line: formData.businessLine,
          billing_address: formData.billingAddress,
          billing_region: formData.billingRegion,
          billing_commune: formData.billingCommune,
        };

        console.log('🔍 [ONBOARDING] Payload billing_info:', JSON.stringify(billingUpdates, null, 2));

        const { error: billingError } = await supabase
          .from('billing_info')
          .upsert(billingUpdates, { onConflict: 'user_id' });

        if (billingError) {
          console.error('❌ [ONBOARDING] Billing Info Error:', billingError);
          console.error('📦 Payload que falló:', billingUpdates);
          throw new Error(`Error al guardar información de facturación: ${billingError.message}`);
        }

        console.log('✅ [ONBOARDING] Billing info guardada exitosamente');
      }

      // 🔒 Evita el bucle del guard:
      // 1) Refresca sesión (opcional pero recomendado)
      await supabase.auth.refreshSession().catch(() => {});
      // 2) Invalida cache de profile para forzar refetch con datos actualizados
      invalidateUserProfileCache(user.id);
      // 3) Refresca el perfil en el Auth Provider para que `needsOnboarding` se actualice
      await refreshUserProfile();

      // Prime de región (si aplica) - ahora de formData ya que billing va a otra tabla
      const regionCandidate = formData.billingRegion || formData.shippingRegion || null;
      if (regionCandidate) {
        try {
          primeUserRegionCache(regionCandidate);
        } catch {
          /* silencioso */
        }
      }

      // ✅ Mostrar banner de éxito
      showBanner({
        message: '¡Bienvenido a Sellsi! Tu perfil fue configurado correctamente 🎉',
        severity: 'success',
        duration: 3000
      });

      // Navega a la home
      navigate('/', { replace: true });
    } catch (error) {
      console.error('❌ Error al actualizar el perfil:', error);
      
      // ✅ Mostrar banner de error
      showBanner({
        message: error.message || 'Hubo un error al guardar tu perfil. Intenta nuevamente.',
        severity: 'error',
        duration: 6000
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = () => {
    const hasBasicInfo = formData.accountType && formData.nombreEmpresa.trim();

    if (
      formData.accountType === 'proveedor' &&
      formData.documentTypes?.includes('factura')
    ) {
      const hasBillingInfo =
        formData.businessName &&
        formData.billingRut &&
        formData.businessLine &&
        formData.billingAddress &&
        formData.billingRegion &&
        formData.billingCommune;
      return hasBasicInfo && hasBillingInfo;
    }
    return hasBasicInfo;
  };

  return (
    <>
      {/* Debug opcional */}
      {/* <div style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999, background: '#fff', color: '#000' }}>
        Onboarding debug
      </div> */}

      <Container
        component="main"
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
          {/* Header */}
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

          {/* Paso 1: Tipo de cuenta */}
          <Box sx={{ mb: 5, textAlign: 'center' }}>
            <Typography
              variant="h5"
              sx={{ fontWeight: 600, mb: 3, color: theme.palette.text.primary }}
            >
              Paso 1: Elige tu rol principal
            </Typography>

            <Grid container spacing={3} justifyContent="center">
              {/* Proveedor */}
              <Grid item xs={12} sm={6}>
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
              </Grid>

              {/* Comprador */}
              <Grid item xs={12} sm={6}>
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
              *Este será tu rol por defecto, pero podrás cambiarlo más adelante
              en tu perfil.
            </Typography>
          </Box>

          <Divider sx={{ mb: 5 }} />

          {/* Paso 2: Datos de perfil */}
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

            <Grid
              container
              spacing={5}
              alignItems="flex-start"
              justifyContent="center"
              sx={{
                maxWidth: { xs: '100%', md: '800px', lg: '950px' },
                mx: 'auto',
              }}
            >
              {/* Columna Izquierda */}
              <Grid item xs={12} md={7}>
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
                    <Box sx={{ minWidth: 180 }}>
                      <CountrySelector
                        value={formData.codigoPais}
                        onChange={e =>
                          handleFieldChange('codigoPais', e.target.value)
                        }
                        countries={['+56', '+54', '+52', '+51', '+57']}
                        size="small"
                        fullWidth
                        sx={{ '.MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Box>

                    <TextField
                      fullWidth
                      size="small"
                      label="Teléfono de contacto"
                      value={formData.telefonoContacto}
                      inputProps={{
                        maxLength: 15,
                        inputMode: 'numeric',
                        pattern: '[0-9]*',
                      }}
                      onChange={e => {
                        const digits = (e.target.value || '').replace(
                          /\D+/g,
                          ''
                        );
                        handleFieldChange('telefonoContacto', digits);
                      }}
                      placeholder="Ej: 912345678"
                      type="tel"
                      error={
                        formData.telefonoContacto.length > 0 &&
                        !validatePhone(
                          formData.codigoPais || 'CL',
                          formData.telefonoContacto || ''
                        ).isValid
                      }
                      helperText={() => {
                        if (!formData.telefonoContacto) return 'Opcional';
                        const res = validatePhone(
                          formData.codigoPais || 'CL',
                          formData.telefonoContacto || ''
                        );
                        return res.isValid
                          ? `${formData.telefonoContacto.length}/15`
                          : res.reason;
                      }}
                      sx={{ '.MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Box>

                  {/* Descripción para proveedores */}
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
                      helperText={`Ayuda a los compradores a identificar tu oferta. (${formData.descripcionProveedor.length}/200)`}
                      sx={{ '.MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  )}
                </Box>
              </Grid>

              {/* Columna Derecha: Uploader */}
              <Grid item xs={12} md={5}>
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

            {/* Configuración Tributaria (solo proveedores) */}
            <Collapse in={formData.accountType === 'proveedor'}>
              {formData.accountType === 'proveedor' && (
                <Box
                  sx={{
                    mt: 4,
                    maxWidth: { xs: '100%', md: '800px', lg: '950px' },
                    mx: 'auto',
                  }}
                >
                  <Divider sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      Configuración Tributaria
                    </Typography>
                  </Divider>

                  <Grid container spacing={3}>
                    {/* Tipo de documento */}
                    <Grid item xs={12} md={6}>
                      <TaxDocumentSelector
                        documentTypes={formData.documentTypes}
                        onDocumentTypesChange={types =>
                          handleFieldChange('documentTypes', types)
                        }
                        showTitle
                        size="medium"
                      />
                    </Grid>

                    {/* Facturación (si selecciona factura) */}
                    <Grid item xs={12} md={6}>
                      <Collapse
                        in={formData.documentTypes?.includes('factura')}
                      >
                        {formData.documentTypes?.includes('factura') && (
                          <Box
                            sx={{
                              border: 1,
                              borderColor: 'divider',
                              borderRadius: 2,
                              p: 3,
                              mb: 5,
                              bgcolor: 'grey.50',
                              height: 'fit-content',
                            }}
                          >
                            <BillingInfoForm
                              formData={formData}
                              onFieldChange={handleFieldChange}
                              showTitle
                              size="small"
                            />
                          </Box>
                        )}
                      </Collapse>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Collapse>
          </Box>

          {/* Botón Final */}
          <Box sx={{ mt: 6, display: 'flex', justifyContent: 'center' }}>
            <PrimaryButton
              type="button"
              onClick={handleFinishOnboarding}
              disabled={isLoading || !isFormValid()}
              sx={{
                py: 1.8,
                px: 8,
                fontSize: '1.2rem',
                fontWeight: 700,
                borderRadius: 3,
                boxShadow: theme.shadows[8],
                background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`,
                color: 'white',
                '&:hover': {
                  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
                  boxShadow: theme.shadows[10],
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease-in-out',
                '&.Mui-disabled': {
                  background: theme.palette.grey[400],
                  color: 'white',
                  boxShadow: 'none',
                  cursor: 'not-allowed',
                  transform: 'none',
                  '&:hover': { background: theme.palette.grey[400] },
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
