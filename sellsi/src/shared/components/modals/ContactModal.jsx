import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
/* Home page, contactanos */
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Stack,
  Divider,
  useTheme,
  useMediaQuery,
  Fade,
  alpha,
} from '@mui/material';
import {
  Close as CloseIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { useBanner } from '../display/banners/BannerContext';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useAuth } from '../../../infrastructure/providers/UnifiedAuthProvider';
import { buildEnrichedContactMessage } from './helpers/buildEnrichedContactMessage';

// ✅ 1. Definimos la URL de tu función de Supabase desde variable de entorno (compatible con Jest)
const supabaseFunctionUrl = `${process.env.VITE_SUPABASE_URL}/functions/v1/contact-form`;

const ContactModal = ({ open, onClose, context = null }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const location = useLocation();
  const { showBanner } = useBanner();
  const { session, userProfile } = useAuth();

  // ✅ Bloquear scroll del body cuando el modal está abierto
  useBodyScrollLock(open);

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    mensaje: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialPath, setInitialPath] = useState(null);
  const [invokedFrom, setInvokedFrom] = useState(null);

  useEffect(() => {
    if (open) {
      setInitialPath(location.pathname);
      // Capturar desde dónde se invocó el modal
      setInvokedFrom(location.pathname + (location.search || ''));
    }
  }, [open, location.pathname, location.search]);

  useEffect(() => {
    if (open && initialPath && location.pathname !== initialPath) {
      onClose();
    }
  }, [location.pathname, open, initialPath, onClose]);

  const handleClose = () => {
    setFormData({ nombre: '', email: '', mensaje: '' });
    setErrors({});
    onClose();
  };

  const handleChange = field => event => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.nombre.trim()) newErrors.nombre = 'Nombre requerido';
    if (!formData.email.trim()) newErrors.email = 'Email requerido';
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = 'Email inválido';
    if (!formData.mensaje.trim()) newErrors.mensaje = 'Mensaje requerido';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ 2. HEMOS ACTUALIZADO COMPLETAMENTE LA FUNCIÓN `handleSubmit`
  const handleSubmit = async e => {
    e.preventDefault();
    if (!validate()) {
      showBanner({
        message: 'Por favor, completa todos los campos correctamente.',
        severity: 'warning',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // ✅ Construir información de contexto usando el helper
      const userId = session?.user?.id || 'NO_AUTH';
      const userEmail = session?.user?.email || formData.email;
      const userName = userProfile?.user_nm || formData.nombre;
      
      // Construir mensaje enriquecido con contexto usando helper
      const enrichedMessage = buildEnrichedContactMessage({
        originalMessage: formData.mensaje,
        invokedFrom: invokedFrom || 'Desconocido',
        userId: userId,
        userEmail: userEmail,
        userProfile: userProfile,
        context: context // Contexto específico (orden, producto, etc.)
      });

      // Hacemos la llamada real a la API de Supabase
      const response = await fetch(supabaseFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
        },
        // Mapeamos los nombres del estado del formulario a los que espera la API
        // (nombre -> name, mensaje -> message)
        body: JSON.stringify({
          name: userName,
          email: userEmail,
          message: enrichedMessage,
        }),
      });

      // Si la respuesta NO es exitosa (ej: error 400, 500)
      if (!response.ok) {
        // Intentamos leer el error que nos envía el servidor para tener más detalles
        const errorData = await response.json();
        // Lanzamos un error para que sea capturado por el bloque catch
        throw new Error('La respuesta del servidor no fue exitosa.');
      }

      // Si todo fue bien, mostramos el banner de éxito
      showBanner({
        message:
          '¡Gracias! Tu mensaje ha sido enviado. Nos pondremos en contacto contigo pronto.',
        severity: 'success',
      });

      handleClose(); // Cerramos el modal
    } catch (error) {
      showBanner({
        message:
          'Hubo un error al enviar tu mensaje. Por favor, inténtalo nuevamente.',
        severity: 'error',
      });
    } finally {
      // Esto se ejecuta siempre, tanto si hubo éxito como si hubo error
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={false}
      fullWidth
      fullScreen={isMobile}
      TransitionComponent={Fade}
      disableScrollLock={true}
      disableRestoreFocus={true}
      sx={{ zIndex: 1500 }}
      PaperProps={{
        elevation: 0,
        sx: {
          borderRadius: isMobile ? 0 : 3,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          ...(!isMobile && {
            width: {
              sm: '90%',
              md: '600px',
            },
            maxWidth: '90vw',
            maxHeight: '90vh',
          }),
        },
      }}
    >
      {/* El resto del componente permanece igual... */}
      <Box
        sx={{
          position: 'relative',
          backgroundColor: '#2E52B2',
          color: 'white',
          py: { xs: 2, sm: 2.5, md: 3 },
          px: { xs: 2, sm: 3 },
          textAlign: 'center',
        }}
      >
        <IconButton
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: { xs: 8, sm: 16 },
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'white',
            backgroundColor: alpha('#ffffff', 0.1),
            p: { xs: 0.75, sm: 1 },
            '&:hover': { backgroundColor: alpha('#ffffff', 0.2) },
          }}
        >
          <CloseIcon sx={{ fontSize: { xs: '1.5rem', sm: '1.5rem' } }} />
        </IconButton>
        <Typography
          variant="h4"
          fontWeight="600"
          gutterBottom
          sx={{
            fontSize: {
              xs: '1.35rem',
              sm: '1.75rem',
              md: '2rem',
            },
          }}
        >
          Contáctanos
        </Typography>
        <Typography
          variant="body1"
          sx={{
            opacity: 0.9,
            fontSize: {
              xs: '0.8125rem',
              sm: '0.9rem',
              md: '1rem',
            },
          }}
        >
          Estamos aquí para ayudarte
        </Typography>
      </Box>

      <DialogContent sx={{ p: 0 }}>
        <Box
          sx={{
            bgcolor: alpha(theme.palette.primary.main, 0.03),
            py: { xs: 2, sm: 2.5, md: 3 },
            px: { xs: 2, sm: 3, md: 4 },
          }}
        >
          <Stack
            direction={isMobile ? 'column' : 'row'}
            spacing={{ xs: 2, sm: 3 }}
            justifyContent="center"
            alignItems="center"
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 1 } }}>
              <EmailIcon color="primary" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
              <Typography 
                variant="body2" 
                fontWeight="500"
                sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
              >
                contacto@sellsi.cl {/* Corregí el dominio a .cl */}
              </Typography>
            </Box>
            <Divider
              orientation={isMobile ? 'horizontal' : 'vertical'}
              flexItem
              sx={{ display: isMobile ? 'none' : 'block' }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 1 } }}>
              <PhoneIcon color="primary" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
              <Typography 
                variant="body2" 
                fontWeight="500"
                sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
              >
                +(56) 963109664
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ p: { xs: 2, sm: 3, md: 4 } }}
        >
          <Stack spacing={{ xs: 2.5, sm: 3 }}>
            <TextField
              fullWidth
              label="Nombre"
              value={formData.nombre}
              onChange={handleChange('nombre')}
              error={!!errors.nombre}
              helperText={errors.nombre}
              variant="outlined"
              InputLabelProps={{
                sx: { fontSize: { xs: '0.875rem', sm: '1rem' } }
              }}
              InputProps={{
                sx: { fontSize: { xs: '0.875rem', sm: '1rem' } }
              }}
              FormHelperTextProps={{
                sx: { fontSize: { xs: '0.75rem', sm: '0.75rem' } }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: '#ffffff',
                  '&:hover fieldset': {
                    borderColor: theme.palette.primary.main,
                  },
                },
              }}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              error={!!errors.email}
              helperText={errors.email}
              variant="outlined"
              InputLabelProps={{
                sx: { fontSize: { xs: '0.875rem', sm: '1rem' } }
              }}
              InputProps={{
                sx: { fontSize: { xs: '0.875rem', sm: '1rem' } }
              }}
              FormHelperTextProps={{
                sx: { fontSize: { xs: '0.75rem', sm: '0.75rem' } }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: '#ffffff',
                  '&:hover fieldset': {
                    borderColor: theme.palette.primary.main,
                  },
                },
              }}
            />
            <TextField
              fullWidth
              label="Mensaje"
              multiline
              rows={10}
              value={formData.mensaje}
              onChange={handleChange('mensaje')}
              error={!!errors.mensaje}
              helperText={errors.mensaje}
              placeholder="Cuéntanos cómo podemos ayudarte..."
              variant="outlined"
              InputLabelProps={{
                sx: { fontSize: { xs: '0.875rem', sm: '1rem' } }
              }}
              InputProps={{
                sx: { fontSize: { xs: '0.875rem', sm: '1rem' } }
              }}
              FormHelperTextProps={{
                sx: { fontSize: { xs: '0.75rem', sm: '0.75rem' } }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: '#ffffff',
                  '&:hover fieldset': {
                    borderColor: theme.palette.primary.main,
                  },
                },
              }}
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={isSubmitting}
              startIcon={<SendIcon sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }} />}
              sx={{
                mt: { xs: 1, sm: 2 },
                py: { xs: 1.25, sm: 1.5 },
                borderRadius: 2,
                textTransform: 'none',
                fontSize: { xs: '0.9rem', sm: '1rem' },
                fontWeight: '600',
                backgroundColor: '#2E52B2',
                boxShadow: '0 4px 14px rgba(46, 82, 178, 0.25)',
                '&:hover': {
                  backgroundColor: '#243f8f',
                  boxShadow: '0 6px 20px rgba(46, 82, 178, 0.35)',
                  transform: 'translateY(-1px)',
                },
                '&:disabled': { backgroundColor: '#e0e0e0', boxShadow: 'none' },
              }}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar mensaje'}
            </Button>
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ContactModal;
