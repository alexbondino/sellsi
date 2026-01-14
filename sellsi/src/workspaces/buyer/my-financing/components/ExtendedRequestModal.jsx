/**
 * ============================================================================
 * EXTENDED REQUEST MODAL - Modal de Solicitud Extendida de Financiamiento
 * ============================================================================
 * 
 * Modal para solicitud extendida con documentación completa.
 * Grid 2x4 con inputs y adjuntar archivos.
 * 
 * Mapeo de Campos a BD:
 * - formData.amount → financing_requests.amount
 * - formData.term → financing_requests.term_days
 * - formData.businessName → financing_requests.legal_name
 * - formData.rut → financing_requests.legal_rut
 * - formData.legalRepresentative → financing_requests.legal_representative_name
 * - formData.powersCertificate → financing_documents (type: garantia)
 * - formData.powersValidityCertificate → financing_documents (type: garantia)
 * - formData.simplifiedTaxFolder → financing_documents (type: garantia)
 * - formData.others → financing_documents (type: garantia, opcional)
 * 
 * Características:
 * - Grid 2x5 responsive
 * - Validación de RUT con formateador reutilizable
 * - Upload de archivos
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
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { useBodyScrollLock } from '../../../../shared/hooks/useBodyScrollLock';
import { formatRut, validateRut } from '../../../../utils/validators';
import { formatNumber } from '../../../../shared/utils/formatters';
import {
  MODAL_DIALOG_ACTIONS_STYLES,
  MODAL_CANCEL_BUTTON_STYLES,
  MODAL_SUBMIT_BUTTON_STYLES,
} from '../../../../shared/components/feedback/Modal/Modal';

const SELLSI_BLUE = '#2E52B2';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = '.pdf,.doc,.docx,.jpg,.jpeg,.png';

// Estado inicial del formulario
const INITIAL_FORM_DATA = {
  amount: '',
  legalRepresentative: '',
  term: '',
  others: null,
  businessName: '',
  powersCertificate: null,
  rut: '',
  powersValidityCertificate: null,
  simplifiedTaxFolder: null,
  legalAddress: '',
  legalCommune: '',
  legalRegion: '',
  autoFillModal: true,
};

const ExtendedRequestModal = ({ open, onClose, onBack, onSubmit }) => {
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

  // Manejador de archivos
  const handleFileChange = (field, event) => {
    const file = event.target.files[0];
    if (file) {
      // Validar tamaño
      if (file.size > MAX_FILE_SIZE) {
        setErrors((prev) => ({
          ...prev,
          [field]: 'El archivo no debe superar 10MB',
        }));
        return;
      }
      setFormData((prev) => ({ ...prev, [field]: file }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: '' }));
      }
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

    // Certificado de vigencia de poderes (obligatorio)
    if (!formData.powersCertificate) {
      newErrors.powersCertificate = 'Documento requerido';
    }

    // Certificado de vigencia de poderes (segundo - obligatorio)
    if (!formData.powersValidityCertificate) {
      newErrors.powersValidityCertificate = 'Documento requerido';
    }

    // Carpeta tributaria simplificada (obligatorio)
    if (!formData.simplifiedTaxFolder) {
      newErrors.simplifiedTaxFolder = 'Documento requerido';
    }

    // Dirección legal
    if (!formData.legalAddress?.trim()) {
      newErrors.legalAddress = 'Campo requerido';
    }

    // Comuna
    if (!formData.legalCommune?.trim()) {
      newErrors.legalCommune = 'Campo requerido';
    }

    // Región
    if (!formData.legalRegion?.trim()) {
      newErrors.legalRegion = 'Campo requerido';
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
        type: 'extended',
        ...formData,
      });
      // Resetear formulario
      setFormData({
        amount: '',
        legalRepresentative: '',
        term: '',
        others: null,
        businessName: '',
        powersCertificate: null,
        rut: '',
        powersValidityCertificate: null,
        simplifiedTaxFolder: null,
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
      others: null,
      businessName: '',
      powersCertificate: null,
      rut: '',
      powersValidityCertificate: null,
      simplifiedTaxFolder: null,
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
          // 🔧 FIX: Forzar ancho mínimo para que Grid xs=6 sea realmente 50%
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
        
        <Typography
          variant="subtitle2"
          sx={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontWeight: 400,
            fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1.05rem' },
            textAlign: 'center',
          }}
        >
          Solicitud Extendida
        </Typography>
      </DialogTitle>

      {/* Contenido con Grid 2x5 */}
      <DialogContent
        dividers
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          pt: { xs: 3, md: 2 },
          px: { xs: 2, md: 3 },
          pb: 3,
          // 🔧 FIX DE FONDO:
          // Si existe un override global (o con !important) que deja los controles en width:auto/fit-content,
          // el Grid se ve “encogido” al ancho del título/label. Esto lo neutraliza solo dentro de este modal.
          '& .MuiGrid-container': {
            width: '100% !important',
            maxWidth: '100% !important',
          },
          '& .MuiGrid-item': {
            // Forzar 2 columnas siempre (cada casilla 50%)
            flexBasis: '50% !important',
            maxWidth: '50% !important',
            minWidth: 0,
          },
          '& .MuiBox-root': {
            maxWidth: 'none',
          },
          '& .MuiTextField-root': {
            width: '100% !important',
            maxWidth: 'none !important',
          },
          '& .MuiFormControl-root': {
            width: '100% !important',
            maxWidth: 'none !important',
          },
          '& .MuiInputBase-root': {
            width: '100% !important',
            maxWidth: 'none !important',
          },
          '& .MuiButtonBase-root.MuiButton-fullWidth': {
            width: '100% !important',
            maxWidth: 'none !important',
          },
        }}
      >
        {/* Sección: Información del Financiamiento */}
        <Box sx={{ mb: { xs: 3, md: 2.5 }, width: '100%' }}>
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
                md: 'minmax(0, 1fr) minmax(0, 1fr)',
              },
              gap: 2,
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
              helperText={errors.amount || 'Ingresa el monto que necesitas financiar'}
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
        <Box sx={{ mb: { xs: 3, md: 2.5 }, width: '100%' }}>
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
                md: 'minmax(0, 1fr) minmax(0, 1fr)',
              },
              gap: 2,
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
            />
            <TextField
              fullWidth
              label="Dirección Legal"
              value={formData.legalAddress}
              onChange={(e) => handleChange('legalAddress', e.target.value)}
              error={!!errors.legalAddress}
              helperText={errors.legalAddress || 'Dirección de la empresa'}
              required
            />
            <TextField
              fullWidth
              label="Comuna"
              value={formData.legalCommune}
              onChange={(e) => handleChange('legalCommune', e.target.value)}
              error={!!errors.legalCommune}
              helperText={errors.legalCommune || 'Comuna de la empresa'}
              required
            />
            <TextField
              fullWidth
              label="Región"
              value={formData.legalRegion}
              onChange={(e) => handleChange('legalRegion', e.target.value)}
              error={!!errors.legalRegion}
              helperText={errors.legalRegion || 'Región de la empresa'}
              required
            />
          </Box>
        </Box>

        {/* Sección: Documentación Requerida */}
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
            Documentación Requerida
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'minmax(0, 1fr) minmax(0, 1fr)',
              },
              gap: 2,
              '& > *': {
                minWidth: 0,
              },
            }}
          >
            {/* Certificado de Vigencia de Poderes */}
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                Certificado de Vigencia de Poderes *
              </Typography>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                startIcon={<AttachFileIcon />}
                sx={{
                  height: 56,
                  textTransform: 'none',
                  justifyContent: 'flex-start',
                  borderColor: errors.powersCertificate ? 'error.main' : 'rgba(0, 0, 0, 0.23)',
                  color: formData.powersCertificate ? 'success.main' : 'text.secondary',
                  fontWeight: formData.powersCertificate ? 600 : 400,
                }}
              >
                {formData.powersCertificate
                  ? `✓ ${formData.powersCertificate.name}`
                  : 'Seleccionar archivo...'}
                <input
                  type="file"
                  hidden
                  accept={ACCEPTED_FILE_TYPES}
                  onChange={(e) => handleFileChange('powersCertificate', e)}
                />
              </Button>
              {errors.powersCertificate && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5, display: 'block' }}>
                  {errors.powersCertificate}
                </Typography>
              )}
            </Box>

            {/* Certificado de Vigencia (Poderes 2) */}
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                Certificado de Vigencia (Poderes 2) *
              </Typography>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                startIcon={<AttachFileIcon />}
                sx={{
                  height: 56,
                  textTransform: 'none',
                  justifyContent: 'flex-start',
                  borderColor: errors.powersValidityCertificate ? 'error.main' : 'rgba(0, 0, 0, 0.23)',
                  color: formData.powersValidityCertificate ? 'success.main' : 'text.secondary',
                  fontWeight: formData.powersValidityCertificate ? 600 : 400,
                }}
              >
                {formData.powersValidityCertificate
                  ? `✓ ${formData.powersValidityCertificate.name}`
                  : 'Seleccionar archivo...'}
                <input
                  type="file"
                  hidden
                  accept={ACCEPTED_FILE_TYPES}
                  onChange={(e) => handleFileChange('powersValidityCertificate', e)}
                />
              </Button>
              {errors.powersValidityCertificate && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5, display: 'block' }}>
                  {errors.powersValidityCertificate}
                </Typography>
              )}
            </Box>

            {/* Carpeta Tributaria Simplificada */}
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                Carpeta Tributaria Simplificada *
              </Typography>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                startIcon={<AttachFileIcon />}
                sx={{
                  height: 56,
                  textTransform: 'none',
                  justifyContent: 'flex-start',
                  borderColor: errors.simplifiedTaxFolder ? 'error.main' : 'rgba(0, 0, 0, 0.23)',
                  color: formData.simplifiedTaxFolder ? 'success.main' : 'text.secondary',
                  fontWeight: formData.simplifiedTaxFolder ? 600 : 400,
                }}
              >
                {formData.simplifiedTaxFolder
                  ? `✓ ${formData.simplifiedTaxFolder.name}`
                  : 'Seleccionar archivo...'}
                <input
                  type="file"
                  hidden
                  accept={ACCEPTED_FILE_TYPES}
                  onChange={(e) => handleFileChange('simplifiedTaxFolder', e)}
                />
              </Button>
              {errors.simplifiedTaxFolder && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5, display: 'block' }}>
                  {errors.simplifiedTaxFolder}
                </Typography>
              )}
            </Box>

            {/* Otros Documentos */}
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                Otros Documentos (Opcional)
              </Typography>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                startIcon={<AttachFileIcon />}
                sx={{
                  height: 56,
                  textTransform: 'none',
                  justifyContent: 'flex-start',
                  borderColor: 'rgba(0, 0, 0, 0.23)',
                  color: formData.others ? 'success.main' : 'text.secondary',
                  fontWeight: formData.others ? 600 : 400,
                }}
              >
                {formData.others ? `✓ ${formData.others.name}` : 'Seleccionar archivo...'}
                <input
                  type="file"
                  hidden
                  accept={ACCEPTED_FILE_TYPES}
                  onChange={(e) => handleFileChange('others', e)}
                />
              </Button>
              {errors.others && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5, display: 'block' }}>
                  {errors.others}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        {/* Checkbox para auto-rellenar */}
        <Box sx={{ mt: { xs: 3, md: 2 }, display: 'flex', justifyContent: 'flex-start' }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.autoFillModal}
                onChange={(e) => handleChange('autoFillModal', e.target.checked)}
                sx={{
                  color: SELLSI_BLUE,
                  '&.Mui-checked': {
                    color: SELLSI_BLUE,
                  },
                }}
              />
            }
            label={
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Utilizar mi configuración anterior (pre-llenar automáticamente)
              </Typography>
            }
          />
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

export default ExtendedRequestModal;
