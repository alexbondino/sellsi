/**
 * ============================================================================
 * EXPRESS REQUEST MODAL - Modal de Solicitud Express de Financiamiento
 * ============================================================================
 * 
 * Modal para solicitud express con proceso rápido.
 * Grid responsive con 5 inputs (sin documentación).
 * 
 * Características:
 * - Grid 2x3 responsive (5 inputs)
 * - Validación de RUT con formateador reutilizable
 * - Validación de montos y plazos
 * - Botón volver al modal anterior
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  TextField,
  useTheme,
  useMediaQuery,
  InputAdornment,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import { useBodyScrollLock } from '../../../../shared/hooks/useBodyScrollLock';
import {
  MODAL_DIALOG_ACTIONS_STYLES,
  MODAL_CANCEL_BUTTON_STYLES,
  MODAL_SUBMIT_BUTTON_STYLES,
} from '../../../../shared/components/feedback/Modal/Modal';
import { formatRut, validateRut } from '../../../../utils/validators';
import { formatNumber } from '../../../../shared/utils/formatters';

const SELLSI_BLUE = '#2E52B2';

// Estado inicial del formulario
const INITIAL_FORM_DATA = {
  amount: '',
  legalRepresentative: '',
  term: '',
  businessName: '',
  rut: '',
};

const ExpressRequestModal = ({ open, onClose, onBack, onSubmit }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Bloquear scroll cuando el modal está abierto
  useBodyScrollLock(open);

  // Estados del formulario
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reiniciar formulario cuando el modal se cierra
  useEffect(() => {
    if (!open) {
      // Esperar a que la animación de cierre termine antes de resetear
      const timer = setTimeout(() => {
        setFormData(INITIAL_FORM_DATA);
        setErrors({});
        setIsSubmitting(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Manejador de cambios en inputs de texto
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpiar error del campo al editar
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  // Manejador de cambios en RUT con formateo
  const handleRutChange = (value) => {
    const formatted = formatRut(value);
    setFormData((prev) => ({ ...prev, rut: formatted }));
    if (errors.rut) {
      setErrors((prev) => ({ ...prev, rut: '' }));
    }
  };

  // Manejador de cambios en monto con formato de miles
  const handleAmountChange = (value) => {
    // Solo permitir números
    const numericValue = value.replace(/\D/g, '');
    setFormData((prev) => ({ ...prev, amount: numericValue }));
    if (errors.amount) {
      setErrors((prev) => ({ ...prev, amount: '' }));
    }
  };

  // Validar formulario
  const validate = () => {
    const newErrors = {};

    // Monto a financiar
    if (!formData.amount || parseInt(formData.amount) <= 0) {
      newErrors.amount = 'El monto debe ser mayor a 0';
    }

    // Representante legal
    if (!formData.legalRepresentative?.trim()) {
      newErrors.legalRepresentative = 'Campo requerido';
    }

    // Plazo en días
    const term = parseInt(formData.term);
    if (!formData.term || term <= 0 || term > 60) {
      newErrors.term = 'El plazo debe ser entre 1 y 60 días';
    }

    // Razón social
    if (!formData.businessName?.trim()) {
      newErrors.businessName = 'Campo requerido';
    }

    // RUT
    if (!formData.rut?.trim()) {
      newErrors.rut = 'Campo requerido';
    } else if (!validateRut(formData.rut)) {
      newErrors.rut = 'Formato de RUT inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar envío
  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        type: 'express',
        ...formData,
      });
      // Resetear formulario
      setFormData({
        amount: '',
        legalRepresentative: '',
        term: '',
        businessName: '',
        rut: '',
      });
      setErrors({});
    } catch (error) {
      console.error('Error al enviar solicitud:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      amount: '',
      legalRepresentative: '',
      term: '',
      businessName: '',
      rut: '',
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        // Solo permitir cierre con ESC o botón X, no con clic en backdrop
        if (reason === 'backdropClick') {
          return;
        }
        handleClose();
      }}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      disableScrollLock
      sx={{ zIndex: 1500 }}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
          // 🔧 FIX: Forzar ancho mínimo
          minWidth: isMobile ? 'auto' : '900px',
          width: isMobile ? '100%' : '900px',
        },
      }}
    >
      {/* Header con fondo azul Sellsi */}
      <DialogTitle
        sx={{
          fontWeight: 700,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          backgroundColor: SELLSI_BLUE,
          color: '#fff',
          py: { xs: 2, sm: 2 },
          px: { xs: 2, sm: 3 },
          position: 'relative',
          fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.4rem' },
        }} 
      >
        {/* Botón cerrar */}
        <IconButton
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: { xs: 8, sm: 16 },
            top: { xs: 8, sm: 12 },
            color: '#fff',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            p: { xs: 0.75, sm: 1 },
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
            },
          }}
        >
          <CloseIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
        </IconButton>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
          <RequestQuoteIcon sx={{ color: '#fff' }} fontSize="small" />
          <span>Solicitar Financiamiento</span>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            justifyContent: 'center',
          }}
        >
          <FlashOnIcon sx={{ fontSize: '1rem', color: '#fbbf24' }} />
          <Typography
            variant="subtitle2"
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: 400,
              fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1.05rem'},
            }}
          >
            Solicitud Express
          </Typography>
        </Box>
      </DialogTitle>

      {/* Contenido con CSS Grid 2 columnas */}
      <DialogContent
        dividers
        sx={{
          pt: { xs: 3, sm: 4 },
          px: { xs: 2, sm: 3 },
          pb: { xs: 3, sm: 4 },
        }}
      >
        {/* Sección: Información del Financiamiento */}
        <Box sx={{ mb: 3, width: '100%' }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              mb: 2,
              color: SELLSI_BLUE,
              borderBottom: '2px solid',
              borderColor: SELLSI_BLUE,
              pb: 1,
            }}
          >
            Información del Financiamiento
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'minmax(0, 1fr) minmax(0, 1fr)',
              },
              gap: { xs: 2, sm: 2.5 },
              '& > *': {
                minWidth: 0,
              },
            }}
          >
            <TextField
              fullWidth
              label="Monto a financiar"
              placeholder="Ej: 5000000"
              value={formData.amount ? formatNumber(formData.amount) : ''}
              onChange={(e) => handleAmountChange(e.target.value)}
              error={!!errors.amount}
              helperText={errors.amount || 'Ingresa el monto que necesitas'}
              required
            />
            <TextField
              fullWidth
              label="Plazo de pago"
              type="number"
              value={formData.term}
              onChange={(e) => handleChange('term', e.target.value)}
              error={!!errors.term}
              helperText={errors.term || 'Días para pagar (máximo 60)'}
              inputProps={{ min: 1, max: 60 }}
              required
            />
          </Box>
        </Box>

        {/* Sección: Información de la Empresa */}
        <Box sx={{ width: '100%' }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              mb: 2,
              color: SELLSI_BLUE,
              borderBottom: '2px solid',
              borderColor: SELLSI_BLUE,
              pb: 1,
            }}
          >
            Información de la Empresa
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'minmax(0, 1fr) minmax(0, 1fr)',
              },
              gap: { xs: 2, sm: 2.5 },
              '& > *': {
                minWidth: 0,
              },
            }}
          >
            <TextField
              fullWidth
              label="Razón Social"
              value={formData.businessName}
              onChange={(e) => handleChange('businessName', e.target.value)}
              error={!!errors.businessName}
              helperText={errors.businessName || 'Nombre legal de la empresa'}
              required
            />
            <TextField
              fullWidth
              label="RUT de la Empresa"
              value={formData.rut}
              onChange={(e) => handleRutChange(e.target.value)}
              error={!!errors.rut}
              helperText={errors.rut || 'Ej: 12.345.678-9'}
              placeholder="12.345.678-9"
              required
            />
            <TextField
              fullWidth
              label="Representante Legal"
              value={formData.legalRepresentative}
              onChange={(e) => handleChange('legalRepresentative', e.target.value)}
              error={!!errors.legalRepresentative}
              helperText={errors.legalRepresentative || 'Nombre completo del representante'}
              required
              sx={{ gridColumn: { xs: '1', sm: '1 / 2' } }}
            />
          </Box>
        </Box>
      </DialogContent>

      {/* Botones de acción */}
      <DialogActions sx={MODAL_DIALOG_ACTIONS_STYLES}>
        <Button
          onClick={onBack}
          variant="outlined"
          sx={MODAL_CANCEL_BUTTON_STYLES}
        >
          Volver
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isSubmitting}
          sx={MODAL_SUBMIT_BUTTON_STYLES}
        >
          {isSubmitting ? 'Enviando...' : 'Solicitar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExpressRequestModal;
