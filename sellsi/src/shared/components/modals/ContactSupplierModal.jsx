import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Stack,
  useTheme,
  useMediaQuery,
  Fade,
  alpha,
} from '@mui/material';
import {
  Close as CloseIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { useBanner } from '../display/banners/BannerContext';

const supabaseFunctionUrl =
  'https://pvtmkfckdaeiqrfjskrq.supabase.co/functions/v1/contact-form';

const ContactSupplierModal = ({ open, onClose, supplierName }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { showBanner } = useBanner();

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    mensaje: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const response = await fetch(supabaseFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.nombre,
          email: formData.email,
          message: formData.mensaje,
          supplier: supplierName,
        }),
      });
      if (!response.ok) {
        throw new Error('La respuesta del servidor no fue exitosa.');
      }
      showBanner({
        message:
          '¡Gracias! Tu mensaje ha sido enviado al proveedor. Nos pondremos en contacto contigo pronto.',
        severity: 'success',
      });
      handleClose();
    } catch (error) {
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
      maxWidth={false}
      fullWidth
      fullScreen={isMobile}
      TransitionComponent={Fade}
      disableScrollLock={true}
      disableRestoreFocus={true}
      sx={{ zIndex: 1401 }}
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
              md: '1.9rem',
            },
          }}
        >
          Contactarse con:<br />{supplierName}
        </Typography>
      </Box>
      <DialogContent sx={{ p: 0 }}>
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
              placeholder="Escribe tu mensaje para el proveedor..."
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

export default ContactSupplierModal;
