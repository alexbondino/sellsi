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
import { useBanner } from './banner/BannerContext';

const ContactModal = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const { showBanner } = useBanner();

  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    mensaje: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Guardar pathname inicial al abrir el modal
  const [initialPath, setInitialPath] = useState(null);
  useEffect(() => {
    if (open) {
      setInitialPath(location.pathname);
    }
  }, [open, location.pathname]);

  // Cerrar modal solo si el pathname cambia respecto al inicial
  useEffect(() => {
    if (open && initialPath && location.pathname !== initialPath) {
      onClose();
    }
  }, [location.pathname, open, initialPath, onClose]);

  // Reset formulario al cerrar
  const handleClose = () => {
    setFormData({ nombre: '', email: '', mensaje: '' });
    setErrors({});
    onClose();
  };

  // Manejar cambios
  const handleChange = field => event => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  // Validación simple
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
  // Envío
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
      // Simular envío (aquí iría la llamada real a la API)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mostrar banner de éxito
      showBanner({
        message:
          '¡Gracias! Tu mensaje ha sido enviado correctamente. Nos pondremos en contacto contigo lo antes posible.',
        severity: 'success',
      });

      // Cerrar modal después del éxito
      handleClose();
    } catch (error) {
      console.error('Error:', error);
      showBanner({
        message:
          'Hubo un error al enviar tu mensaje. Por favor, inténtalo nuevamente.',
        severity: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={false} // ✅ CORREGIDO: Desactiva maxWidth predefinido
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
          // ✅ SOLO PORCENTAJES - COMPLETAMENTE RESPONSIVE
          width: {
            xs: '95%', // 95% del viewport en móvil
            sm: '90%', // 90% del viewport en tablet pequeña
            md: '80%', // 80% del viewport en tablet/laptop
            lg: '30%', // 30% del viewport en desktop
            xl: '20%', // 20% del viewport en pantallas grandes
          },
          // ✅ CONTROL DE ALTURA RESPONSIVE
          height: {
            xs: '85%', // 70% de la altura del viewport en móvil
            sm: '75%', // 75% de la altura del viewport en tablet pequeña
            md: '85%', // 85% de la altura del viewport en tablet/laptop
            lg: 'auto', // Altura automática en desktop
            xl: 'auto', // Altura automática en pantallas grandes
          },
          // ✅ LÍMITES PARA EVITAR EXTREMOS
          maxWidth: '90vw', // Nunca más del 90% del viewport de ancho
          maxHeight: '90vh', // Nunca más del 90% del viewport de altura
          minWidth: '300px', // Mínimo para que sea usable
          minHeight: '400px', // Mínimo para que el contenido se vea bien
        },
      }}
    >
      {/* Header minimalista */}
      <Box
        sx={{
          position: 'relative',
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          color: 'white',
          py: {
            xs: 0.5, // ✅ Reducido: 2 en lugar de 4 para móvil
            sm: 1.5, // ✅ Reducido: 2.5 en lugar de 4 para small
            md: 3, // ✅ Moderado: 3 para medium
            lg: 4, // ✅ Normal: 4 para large+
            xl: 4, // ✅ Normal: 4 para extra large
          },
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
              xs: '1.5rem', // ✅ Más pequeño en móvil
              sm: '1.75rem', // ✅ Ligeramente más grande en small
              md: '2rem', // ✅ Tamaño medio en medium
              lg: '2.125rem', // ✅ Tamaño normal en large+
              xl: '2.125rem', // ✅ Tamaño normal en extra large
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
              xs: '0.875rem', // ✅ Más pequeño en móvil
              sm: '0.9rem', // ✅ Ligeramente más grande en small
              md: '1rem', // ✅ Tamaño normal en medium+
              lg: '1rem',
              xl: '1rem',
            },
          }}
        >
          Estamos aquí para ayudarte
        </Typography>
      </Box>

      <DialogContent sx={{ p: 0 }}>
        {/* Información de contacto compacta */}
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
                contacto@sellsi.com
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

        {/* Formulario limpio */}
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            p: {
              xs: 1, // ✅ Reducido: 2 en lugar de 4 para móvil
              sm: 3, // ✅ Moderado: 3 para small
              md: 4, // ✅ Normal: 4 para medium+
              lg: 4,
              xl: 4,
            },
          }}
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
                '&:disabled': {
                  background: '#e0e0e0',
                  boxShadow: 'none',
                },
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
