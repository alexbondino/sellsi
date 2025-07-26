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

// ✅ 1. Definimos la URL de tu función de Supabase como una constante
const supabaseFunctionUrl =
  'https://pvtmkfckdaeiqrfjskrq.supabase.co/functions/v1/contact-form';

const ContactModal = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const { showBanner } = useBanner();

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    mensaje: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialPath, setInitialPath] = useState(null);

  useEffect(() => {
    if (open) {
      setInitialPath(location.pathname);
    }
  }, [open, location.pathname]);

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
      // Hacemos la llamada real a la API de Supabase
      const response = await fetch(supabaseFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Mapeamos los nombres del estado del formulario a los que espera la API
        // (nombre -> name, mensaje -> message)
        body: JSON.stringify({
          name: formData.nombre,
          email: formData.email,
          message: formData.mensaje,
        }),
      });

      // Si la respuesta NO es exitosa (ej: error 400, 500)
      if (!response.ok) {
        // Intentamos leer el error que nos envía el servidor para tener más detalles
        const errorData = await response.json();
        console.error('Error del servidor:', errorData);
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
      console.error('Error al enviar el formulario:', error);
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
      PaperProps={{
        elevation: 0,
        sx: {
          borderRadius: isMobile ? 0 : 3,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          position: 'fixed',
          width: {
            xs: '95%',
            sm: '90%',
            md: '80%',
            lg: '30%',
            xl: '20%',
          },
          height: {
            xs: '85%',
            sm: '75%',
            md: '85%',
            lg: 'auto',
            xl: 'auto',
          },
          maxWidth: '90vw',
          maxHeight: '90vh',
          minWidth: '300px',
          minHeight: '400px',
        },
      }}
    >
      {/* El resto del componente permanece igual... */}
      <Box
        sx={{
          position: 'relative',
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          color: 'white',
          py: { xs: 0.5, sm: 1.5, md: 3, lg: 4, xl: 4 },
          px: 3,
          textAlign: 'center',
        }}
      >
        <IconButton
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 16,
            top: 16,
            color: 'white',
            backgroundColor: alpha('#ffffff', 0.1),
            '&:hover': { backgroundColor: alpha('#ffffff', 0.2) },
          }}
        >
          <CloseIcon />
        </IconButton>
        <Typography
          variant="h4"
          fontWeight="600"
          gutterBottom
          sx={{
            fontSize: {
              xs: '1.5rem',
              sm: '1.75rem',
              md: '2rem',
              lg: '2.125rem',
              xl: '2.125rem',
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
              xs: '0.875rem',
              sm: '0.9rem',
              md: '1rem',
              lg: '1rem',
              xl: '1rem',
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
            py: 3,
            px: 4,
          }}
        >
          <Stack
            direction={isMobile ? 'column' : 'row'}
            spacing={3}
            justifyContent="center"
            alignItems="center"
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmailIcon color="primary" />
              <Typography variant="body2" fontWeight="500">
                contacto@sellsi.cl {/* Corregí el dominio a .cl */}
              </Typography>
            </Box>
            <Divider
              orientation={isMobile ? 'horizontal' : 'vertical'}
              flexItem
              sx={{ display: isMobile ? 'none' : 'block' }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PhoneIcon color="primary" />
              <Typography variant="body2" fontWeight="500">
                +(56) 963109665
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ p: { xs: 1, sm: 3, md: 4, lg: 4, xl: 4 } }}
        >
          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Nombre"
              value={formData.nombre}
              onChange={handleChange('nombre')}
              error={!!errors.nombre}
              helperText={errors.nombre}
              variant="outlined"
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
              rows={4}
              value={formData.mensaje}
              onChange={handleChange('mensaje')}
              error={!!errors.mensaje}
              helperText={errors.mensaje}
              placeholder="Cuéntanos cómo podemos ayudarte..."
              variant="outlined"
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
              startIcon={<SendIcon />}
              sx={{
                mt: 2,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: '600',
                background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                boxShadow: '0 4px 14px rgba(25, 118, 210, 0.25)',
                '&:hover': {
                  background:
                    'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
                  boxShadow: '0 6px 20px rgba(25, 118, 210, 0.35)',
                  transform: 'translateY(-1px)',
                },
                '&:disabled': { background: '#e0e0e0', boxShadow: 'none' },
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
