import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  TextField,
  CircularProgress,
  Avatar,
  Card,
  CardActionArea,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  useTheme,
  useMediaQuery,
  Button,
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { supabase } from '../../../../services/supabase';
import { useOptimizedUserShippingRegion } from '../../../../hooks/useOptimizedUserShippingRegion';
import { useBanner } from '../../../../shared/components/display/banners/BannerContext';
import PrimaryButton from '../../../../shared/components/forms/PrimaryButton';
import CountrySelector from '../../../../shared/components/forms/CountrySelector';
import { validatePhone, normalizePhone } from '../../../../utils/validators';
import { invalidateUserProfileCache } from '../../../../services/user/profileService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../infrastructure/providers/UnifiedAuthProvider';

// ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
// Helper: LogoUploader
// ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
const LogoUploader = ({ logoPreview, onLogoSelect, logoError }) => {
  const theme = useTheme();
  const size = 100;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
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
            width: size,
            height: size,
            bgcolor: logoError ? theme.palette.error.light : theme.palette.grey[100],
            border: logoError
              ? `2px solid ${theme.palette.error.main}`
              : `2px dashed ${theme.palette.grey[400]}`,
            transition: 'all 0.25s',
            boxShadow: theme.shadows[2],
            '&:hover': {
              borderColor: theme.palette.primary.main,
              bgcolor: theme.palette.grey[200],
              transform: 'scale(1.03)',
            },
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: theme.palette.text.secondary,
            '& svg': { fontSize: size / 2.5 },
          }}
        >
          {!logoPreview && <PhotoCameraIcon />}
          {logoPreview && !logoError && (
            <Typography sx={{ fontSize: 12, color: '#666', textAlign: 'center', p: 1 }}>
              Cambiar
            </Typography>
          )}
        </Avatar>
      </label>

      {logoError ? (
        <Typography color="error" variant="caption">{logoError}</Typography>
      ) : (
        <Typography variant="caption" color="text.secondary">
          {logoPreview ? '?? Logo cargado' : 'Haz clic para subir tu logo'}
        </Typography>
      )}

      <Typography variant="caption" color="text.disabled">
        JPG, PNG o WEBP · Máximo 300 KB
      </Typography>
    </Box>
  );
};

// ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
// Helper: TypeCard ?? tarjeta de selección de tipo de cuenta
// ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
const TypeCard = ({ selected, onClick, icon: Icon, title, subtitle, accentColor }) => {
  const theme = useTheme();
  return (
    <Card
      variant="outlined"
      sx={{
        width: '100%',
        borderRadius: 3,
        borderColor: selected ? accentColor : theme.palette.grey[300],
        borderWidth: selected ? 2 : 1,
        boxShadow: selected ? `0 4px 20px ${accentColor}33` : theme.shadows[1],
        transition: 'all 0.25s ease',
        cursor: 'pointer',
        '&:hover': {
          boxShadow: `0 6px 24px ${accentColor}44`,
          transform: 'translateY(-4px)',
          borderColor: accentColor,
          borderWidth: 2,
        },
      }}
    >
      <CardActionArea
        onClick={onClick}
        sx={{ px: 1, py: { xs: 2, sm: 3 }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            bgcolor: selected ? accentColor : theme.palette.grey[100],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.25s',
          }}
        >
          <Icon sx={{ fontSize: 28, color: selected ? '#fff' : theme.palette.grey[500] }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, color: selected ? accentColor : 'text.primary' }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          {subtitle}
        </Typography>
        {selected && (
          <Box
            sx={{
              mt: 0.5,
              px: 2,
              py: 0.4,
              borderRadius: 99,
              bgcolor: accentColor,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            <CheckRoundedIcon sx={{ fontSize: 14, color: '#fff' }} />
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Seleccionado</Typography>
          </Box>
        )}
      </CardActionArea>
    </Card>
  );
};

// ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
// Helper: StepContent ?? animación de entrada al cambiar de paso
// ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
const StepContent = ({ stepKey, children }) => (
  <Box
    key={stepKey}
    sx={{
      animation: 'onboardingSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      '@keyframes onboardingSlideIn': {
        from: { opacity: 0, transform: 'translateY(18px)' },
        to:   { opacity: 1, transform: 'translateY(0)' },
      },
    }}
  >
    {children}
  </Box>
);

// ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
// COMPONENTE PRINCIPAL: Onboarding
// ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
const Onboarding = ({ devMode = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { showBanner } = useBanner();
  const { refreshUserProfile } = useAuth();
  const { primeUserRegionCache } = useOptimizedUserShippingRegion();

  const [formData, setFormData] = useState({
    accountType: '',
    nombreEmpresa: '',
    telefonoContacto: '',
    codigoPais: 'CL',
    descripcionProveedor: '',
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoError, setLogoError] = useState('');

  // ???? Definición dinámica de pasos ??????????????????????????????????????????????????????????????????????????????????
  const steps = useMemo(() => {
    const base = [
      { label: 'Tu rol',    subtitle: '¿Cómo usarás Sellsi?' },
      { label: 'Tus datos', subtitle: 'Nombre y contacto' },
      { label: 'Tu logo',   subtitle: 'Imagen de marca' },
    ];
    if (formData.accountType === 'proveedor') {
      base.push({ label: 'Tu negocio', subtitle: 'Cuéntanos más' });
    }
    return base;
  }, [formData.accountType]);

  // Clamp activeStep si cambia la cantidad de pasos
  useEffect(() => {
    if (activeStep >= steps.length) setActiveStep(steps.length - 1);
  }, [steps.length, activeStep]);

  // Limpia URL de objeto al desmontar
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
    try {
      setLogoPreview(URL.createObjectURL(file));
    } catch {
      setLogoError('No se pudo procesar la imagen');
      setLogoFile(null);
      setLogoPreview(null);
    }
  }, []);

  useEffect(() => {
    return () => { if (logoPreview) URL.revokeObjectURL(logoPreview); };
  }, [logoPreview]);

  // ???? Validación por paso ??????????????????????????????????????????????????????????????????????????????????????????????????????
  const canProceed = useMemo(() => {
    switch (activeStep) {
      case 0: return !!formData.accountType;
      case 1: return !!formData.nombreEmpresa.trim();
      case 2: return !logoError;
      case 3: return true;
      default: return false;
    }
  }, [activeStep, formData, logoError]);

  const isLastStep = activeStep === steps.length - 1;
  const handleNext = () => { if (!isLastStep) setActiveStep(s => s + 1); else handleFinishOnboarding(); };
  const handleBack = () => setActiveStep(s => s - 1);

  const handleFinishOnboarding = async () => {
    // ?????? MODO DEV: no guarda nada en Supabase ??????????????????????????????????????????????????????????????????
    if (devMode) {
      console.log('??️ [DEV ONBOARDING] Submit interceptado. Payload:', formData);
      showBanner({
        message: '??️ DEV MODE ?? Los datos NO se guardaron en Supabase.',
        severity: 'info',
        duration: 4000,
      });
      return;
    }
    // ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????

    // Validaciones mínimas
    if (!formData.accountType) {
      console.error('Por favor, elige un tipo de cuenta.');
      return;
    }
    if (!formData.nombreEmpresa.trim()) {
      console.error('El nombre es obligatorio.');
      return;
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
          const { error: removeError } = await supabase.storage
            .from('user-logos')
            .remove([oldLogoPathToDelete]);
          if (removeError) {
            console.error('? [ONBOARDING] Supabase Remove Error:', removeError);
            throw new Error(`Error al eliminar el logo: ${removeError.message}`);
          }
          logoPublicUrl = null;
        }
      }

      // ?? Payload para tabla users (solo campos que existen)
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
        }),
      };

      console.log(
        '?? [ONBOARDING] Payload users:',
        JSON.stringify(userUpdates, null, 2)
      );

      // Upsert en tabla users
      const { error: upsertError } = await supabase
        .from('users')
        .upsert(userUpdates, { onConflict: 'user_id' });

      if (upsertError) {
        console.error('? [ONBOARDING] Supabase Upsert Error:', upsertError);
        console.error('?? Payload que falló:', userUpdates);
        throw new Error(`Error al guardar tu perfil: ${upsertError.message}`);
      }

      console.log('?? [ONBOARDING] Usuario guardado exitosamente');

      //  Evita el bucle del guard:
      // 1) Refresca sesión (opcional pero recomendado)
      await supabase.auth.refreshSession().catch(() => {});
      // 2) Invalida cache de profile para forzar refetch con datos actualizados
      invalidateUserProfileCache(user.id);
      // 3) Refresca el perfil en el Auth Provider para que `needsOnboarding` se actualice
      await refreshUserProfile();

      // Prime de región (silencioso)
      try { primeUserRegionCache(null); } catch { /* silencioso */ }

      // ?? Mostrar banner de éxito
      showBanner({
        message:
          '¡Bienvenido a Sellsi! Tu perfil fue configurado correctamente ???',
        severity: 'success',
        duration: 3000,
      });

      // Navega a la home
      navigate('/', { replace: true });
    } catch (error) {
      console.error('? Error al actualizar el perfil:', error);

      // ?? Mostrar banner de error
      showBanner({
        message:
          error.message ||
          'Hubo un error al guardar tu perfil. Intenta nuevamente.',
        severity: 'error',
        duration: 6000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const phoneHelperText = useMemo(() => {
    if (!formData.telefonoContacto) return 'Opcional';
    const res = validatePhone(formData.codigoPais || 'CL', formData.telefonoContacto || '');
    return res.isValid ? `${formData.telefonoContacto.length}/15` : res.reason;
  }, [formData.telefonoContacto, formData.codigoPais]);

  const progressPct = (activeStep / (steps.length - 1)) * 100;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, #000000 0%, #000000 65%, #2E52B2 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: { xs: 'stretch', md: 'center' },
        justifyContent: 'flex-start',
        pt: { xs: 0, md: 3 },
        pb: { xs: 0, md: 2 },
        px: { xs: 0, md: 2 },
      }}
    >
      <Container maxWidth="md" disableGutters sx={{ display: 'flex', flexDirection: 'column', flexGrow: { xs: 1, md: 0 }, minHeight: { xs: '100vh', md: 'auto' } }}>
        {/* Branding header - solo desktop */}
        <Box sx={{ textAlign: 'center', mb: 3, px: 1, display: { xs: 'none', sm: 'none', md: 'block' } }}>
          <Typography
            component="h1"
            sx={{
              fontSize: { xs: '1.9rem', sm: '2.4rem' },
              fontWeight: 800,
              color: '#fff',
              letterSpacing: '-0.5px',
              lineHeight: 1.2,
            }}
          >
            ¡Bienvenido a Sellsi!
          </Typography>
          <Typography sx={{ mt: 1, color: 'rgba(255,255,255,0.8)', fontSize: '1rem' }}>
            Configura tu cuenta en unos simples pasos
          </Typography>
        </Box>

        {/* Card principal */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: { xs: 0, sm: 0, md: 4 },
            overflow: 'hidden',
            boxShadow: { xs: 'none', md: '0 24px 64px rgba(0,0,0,0.18)' },
            display: 'flex',
            flexDirection: 'column',
            flexGrow: { xs: 1, md: 0 },
          }}
        >
          {/* Branding header mobile - solo xs/sm */}
          <Box
            sx={{
              display: { xs: 'flex', sm: 'flex', md: 'none' },
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: { xs: 1.5, sm: 3 },
              px: 2,
              background: 'linear-gradient(to bottom, #000000, #1a1a2e)',
            }}
          >
            <Typography
              component="h1"
              sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1.2 }}
            >
              ¡Bienvenido a Sellsi!
            </Typography>
            <Typography sx={{ mt: 0.5, color: 'rgba(255,255,255,0.75)', fontSize: '0.87rem' }}>
              Configura tu cuenta en unos simples pasos
            </Typography>
          </Box>
          {/* Barra de progreso */}
          <LinearProgress
            variant="determinate"
            value={progressPct}
            sx={{
              height: 8,
              bgcolor: theme.palette.grey[200],
              '& .MuiLinearProgress-bar': {
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                transition: 'transform 0.5s ease',
              },
            }}
          />

          {/* Stepper */}
          <Box sx={{ px: { xs: 2, sm: 4 }, pt: 3, pb: 1 }}>
            <Stepper
              activeStep={activeStep}
              alternativeLabel
              sx={{
                '& .MuiStepLabel-label': { fontSize: { xs: '0.7rem', sm: '0.8rem' }, mt: 0.5 },
                '& .MuiStepConnector-line': { borderColor: theme.palette.grey[300] },
                '& .MuiStepConnector-root.Mui-active .MuiStepConnector-line': { borderColor: theme.palette.primary.main },
                '& .MuiStepConnector-root.Mui-completed .MuiStepConnector-line': { borderColor: theme.palette.primary.main },
                '& .MuiStepIcon-root.Mui-active': { color: theme.palette.primary.main },
                '& .MuiStepIcon-root.Mui-completed': { color: theme.palette.primary.main },
              }}
            >
              {steps.map((step, index) => (
                <Step key={step.label} completed={index < activeStep}>
                  <StepLabel>{isMobile ? '' : step.label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          {/* Contenido del paso */}
          <Box sx={{ px: { xs: 3, sm: 5 }, pt: { xs: 1, md: 3 }, pb: 4, height: { xs: 'auto', md: 400, lg: 520 }, flex: { xs: 1, md: 'none' }, display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden' }}>

            {/* Paso 0: Tipo de cuenta */}
            {activeStep === 0 && (
              <StepContent stepKey="step-0">
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, textAlign: 'center' }}>
                  ¿Cómo usarás Sellsi?
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                  Puedes cambiar esto más adelante en tu perfil.
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'column', md: 'row' }, gap: 2 }}>
                  <Box sx={{ flex: '1 1 0', minWidth: 0 }}>
                    <TypeCard
                      selected={formData.accountType === 'comprador'}
                      onClick={() => handleTypeSelect('comprador')}
                      icon={ShoppingCartIcon}
                      title="Soy Comprador"
                      subtitle="Explora y adquiere los mejores productos"
                      accentColor={theme.palette.primary.main}
                    />
                  </Box>
                  <Box sx={{ flex: '1 1 0', minWidth: 0 }}>
                    <TypeCard
                      selected={formData.accountType === 'proveedor'}
                      onClick={() => handleTypeSelect('proveedor')}
                      icon={BusinessIcon}
                      title="Soy Proveedor"
                      subtitle="Ofrece tus productos y servicios al mercado B2B"
                      accentColor="#F59E0B"
                    />
                  </Box>
                </Box>
              </StepContent>
            )}

            {/* Paso 1: Datos de perfil */}
            {activeStep === 1 && (
              <StepContent stepKey="step-1">
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Datos de tu perfil
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Esta información será visible para otros usuarios de la plataforma.
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <TextField
                    label="Nombre de empresa o personal *"
                    variant="outlined"
                    fullWidth
                    value={formData.nombreEmpresa}
                    inputProps={{ maxLength: 35 }}
                    onChange={e => handleFieldChange('nombreEmpresa', e.target.value)}
                    helperText={`Tu nombre público en la plataforma (${formData.nombreEmpresa.length}/35)`}
                    sx={{ '.MuiOutlinedInput-root': { borderRadius: 2 } }}
                    autoFocus
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Box sx={{ minWidth: 160 }}>
                      <CountrySelector
                        value={formData.codigoPais}
                        onChange={e => handleFieldChange('codigoPais', e.target.value)}
                        countries={['+56', '+54', '+52', '+51', '+57']}
                        size="medium"
                        fullWidth
                        sx={{ '.MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Box>
                    <TextField
                      fullWidth
                      label="Teléfono de contacto"
                      value={formData.telefonoContacto}
                      inputProps={{ maxLength: 15, inputMode: 'numeric', pattern: '[0-9]*' }}
                      onChange={e => {
                        const digits = (e.target.value || '').replace(/\D+/g, '');
                        handleFieldChange('telefonoContacto', digits);
                      }}
                      placeholder="Ej: 912345678"
                      type="tel"
                      error={
                        formData.telefonoContacto.length > 0 &&
                        !validatePhone(formData.codigoPais || 'CL', formData.telefonoContacto || '').isValid
                      }
                      helperText={phoneHelperText}
                      sx={{ '.MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Box>
                </Box>
              </StepContent>
            )}

            {/* Paso 2: Logo */}
            {activeStep === 2 && (
              <StepContent stepKey="step-2">
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, textAlign: 'center' }}>
                  Logo de tu marca
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
                  Opcional. Puedes agregarlo o cambiarlo desde tu perfil en cualquier momento.
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <LogoUploader
                    logoPreview={logoPreview}
                    onLogoSelect={handleLogoChange}
                    logoError={logoError}
                  />
                </Box>
                {!logoPreview && (
                  <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', mt: 3, fontSize: '0.8rem' }}>
                    Puedes continuar sin subir un logo
                  </Typography>
                )}
              </StepContent>
            )}

            {/* Paso 3: Descripción del proveedor */}
            {activeStep === 3 && formData.accountType === 'proveedor' && (
              <StepContent stepKey="step-3">
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Cuéntanos sobre tu negocio
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Opcional. Ayuda a los compradores a identificar tu oferta.
                </Typography>
                <TextField
                  label="Descripción breve"
                  variant="outlined"
                  fullWidth
                  multiline
                  rows={5}
                  value={formData.descripcionProveedor}
                  onChange={e => {
                    if (e.target.value.length <= 200)
                      handleFieldChange('descripcionProveedor', e.target.value);
                  }}
                  placeholder="Ej: Distribuidor mayorista de tecnología y electrónica. Especializados en monitores, computadores y accesorios para empresas..."
                  helperText={`${formData.descripcionProveedor.length}/200 caracteres`}
                  sx={{ '.MuiOutlinedInput-root': { borderRadius: 2 } }}
                  autoFocus
                />
              </StepContent>
            )}
          </Box>

          {/* Navegación */}
          <Box
            sx={{
              px: { xs: 3, sm: 5 },
              pb: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <Button
              onClick={handleBack}
              startIcon={<ArrowBackRoundedIcon />}
              sx={{
                borderRadius: 99,
                px: 3,
                py: 1.2,
                fontWeight: 600,
                color: 'text.secondary',
                visibility: activeStep === 0 ? 'hidden' : 'visible',
                '&:hover': { bgcolor: theme.palette.grey[100] },
              }}
            >
              Atrás
            </Button>

            <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
              {activeStep + 1} / {steps.length}
            </Typography>

            <PrimaryButton
              onClick={handleNext}
              disabled={!canProceed || isLoading}
              endIcon={
                isLoading
                  ? <CircularProgress size={18} color="inherit" />
                  : isLastStep
                  ? <CheckRoundedIcon />
                  : <ArrowForwardRoundedIcon />
              }
              sx={{
                borderRadius: 99,
                px: { xs: 3, sm: 4 },
                py: 1.2,
                minWidth: 140,
                fontSize: '0.95rem',
                fontWeight: 700,
                background: canProceed
                  ? `linear-gradient(45deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`
                  : undefined,
                color: 'white',
                boxShadow: canProceed ? theme.shadows[4] : 'none',
                transition: 'all 0.2s',
                '&:hover': {
                  boxShadow: theme.shadows[8],
                  transform: 'translateY(-1px)',
                },
                '&.Mui-disabled': {
                  background: theme.palette.grey[300],
                  color: theme.palette.grey[500],
                  boxShadow: 'none',
                },
              }}
            >
              {isLoading ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <Box sx={{ position: 'relative', display: 'inline-flex', justifyContent: 'center' }}>
                  {/* Spacer invisible que reserva el ancho de "Siguiente" siempre */}
                  <span style={{ visibility: 'hidden', pointerEvents: 'none' }}>Siguiente</span>
                  <span style={{ position: 'absolute' }}>{isLastStep ? 'Finalizar' : 'Siguiente'}</span>
                </Box>
              )}
            </PrimaryButton>
          </Box>
        </Paper>

        {/* Dots indicador - solo desktop (en mobile el Paper es fullscreen) */}
        {!isMobile && (
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.8, mt: 2 }}>
            {steps.map((_, i) => (
              <Box
                key={i}
                sx={{
                  width: i === activeStep ? 20 : 8,
                  height: 8,
                  borderRadius: 99,
                  bgcolor: i === activeStep ? '#fff' : 'rgba(255,255,255,0.35)',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default Onboarding;
