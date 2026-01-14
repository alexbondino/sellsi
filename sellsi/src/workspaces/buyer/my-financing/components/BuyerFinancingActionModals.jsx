/**
 * ============================================================================
 * BUYER FINANCING ACTION MODALS
 * ============================================================================
 * 
 * Modales de confirmación para acciones de financiamiento del comprador:
 * - Firmar documento
 * - Cancelar operación
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
  TextField,
  Alert,
} from '@mui/material';
import DrawIcon from '@mui/icons-material/Draw';
import CloseIcon from '@mui/icons-material/Close';
import BlockIcon from '@mui/icons-material/Block';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import PaymentIcon from '@mui/icons-material/Payment';
import { useBodyScrollLock } from '../../../../shared/hooks/useBodyScrollLock';
import { formatPrice } from '../../../../shared/utils/formatters/priceFormatters';
import {
  MODAL_DIALOG_ACTIONS_STYLES,
  MODAL_DIALOG_CONTENT_STYLES,
  MODAL_CANCEL_BUTTON_STYLES,
  MODAL_SUBMIT_BUTTON_STYLES,
} from '../../../../shared/components/feedback/Modal/Modal';

/**
 * Modal de confirmación para firmar
 */
const SignModal = ({ open, financing, onConfirm, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  useBodyScrollLock(open);

  const handleDownloadContract = () => {
    // TODO: Implementar descarga real del contrato marco desde Supabase
    console.log('Descargando contrato marco para financiamiento:', financing?.id);
    alert('Función de descarga de contrato marco pendiente de implementación');
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    setFileError('');
    
    if (!file) {
      setUploadedFile(null);
      return;
    }

    // Validar tipo de archivo
    if (file.type !== 'application/pdf') {
      setFileError('El archivo debe ser un PDF');
      setUploadedFile(null);
      return;
    }

    // Validar tamaño (300KB = 300 * 1024 bytes)
    const maxSize = 300 * 1024;
    if (file.size > maxSize) {
      setFileError(`El archivo excede el tamaño máximo de 300KB (actual: ${Math.round(file.size / 1024)}KB)`);
      setUploadedFile(null);
      return;
    }

    setUploadedFile(file);
  };

  const handleConfirm = () => {
    if (!uploadedFile) return;
    onConfirm(financing, uploadedFile);
    // Limpiar estado al cerrar
    setUploadedFile(null);
    setFileError('');
  };

  const handleCloseModal = () => {
    setUploadedFile(null);
    setFileError('');
    onClose();
  };

  const isSubmitEnabled = uploadedFile && !fileError;

  return (
    <Dialog 
      open={open} 
      onClose={handleCloseModal} 
      maxWidth="sm" 
      fullWidth
      fullScreen={isMobile}
      disableScrollLock
      sx={{ zIndex: 1500 }}
      PaperProps={{
        sx: { borderRadius: isMobile ? 0 : 2 },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          justifyContent: 'center',
          textAlign: 'center',
          backgroundColor: '#2E52B2',
          color: '#fff',
          py: { xs: 2, sm: 2 },
          px: { xs: 2, sm: 3 },
          position: 'relative',
          fontSize: { xs: '1.125rem', sm: '1.25rem' },
        }}
      >
        <IconButton
          onClick={handleCloseModal}
          sx={{
            position: 'absolute',
            right: { xs: 8, sm: 16 },
            top: '50%',
            transform: 'translateY(-50%)',
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
        <DrawIcon sx={{ color: '#fff' }} fontSize="small" />
        Firmar Documento de Financiamiento
      </DialogTitle>
      <DialogContent dividers sx={MODAL_DIALOG_CONTENT_STYLES}>
        <DialogContentText>
          Descarga el contrato marco, fírmalo y súbelo en formato PDF para completar el proceso.
        </DialogContentText>
        {financing && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2">
              <strong>Proveedor:</strong> {financing.supplier_name}
            </Typography>
            <Typography variant="body2">
              <strong>Monto:</strong> {formatPrice(financing.amount)}
            </Typography>
            <Typography variant="body2">
              <strong>Plazo:</strong> {financing.term_days} días
            </Typography>
          </Box>
        )}

        {/* Contenedor de dos columnas */}
        <Box 
          sx={{ 
            mt: 3, 
            display: 'flex', 
            gap: 2,
            flexDirection: { xs: 'column', sm: 'row' },
          }}
        >
          {/* Columna 1: Descargar Contrato Marco */}
          <Box sx={{ flex: 1 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadContract}
              sx={{
                py: 1.5,
                borderColor: '#2E52B2',
                color: '#2E52B2',
                '&:hover': {
                  borderColor: '#1e3a8a',
                  backgroundColor: 'rgba(46, 82, 178, 0.04)',
                },
              }}
            >
              Descargar Contrato Marco
            </Button>
          </Box>

          {/* Columna 2: Adjuntar Contrato Firmado */}
          <Box sx={{ flex: 1 }}>
            <Button
              fullWidth
              variant="outlined"
              component="label"
              startIcon={<UploadFileIcon />}
              sx={{
                py: 1.5,
                borderColor: uploadedFile ? '#10b981' : '#6b7280',
                color: uploadedFile ? '#10b981' : '#6b7280',
                '&:hover': {
                  borderColor: uploadedFile ? '#059669' : '#4b5563',
                  backgroundColor: uploadedFile ? 'rgba(16, 185, 129, 0.04)' : 'rgba(107, 114, 128, 0.04)',
                },
              }}
            >
              {uploadedFile ? 'PDF Adjuntado ✓' : 'Adjuntar Contrato Firmado'}
              <input
                type="file"
                hidden
                accept=".pdf,application/pdf"
                onChange={handleFileUpload}
              />
            </Button>
          </Box>
        </Box>

        {/* Información del archivo adjuntado */}
        {uploadedFile && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="success" sx={{ fontSize: '0.875rem' }}>
              <strong>{uploadedFile.name}</strong> ({Math.round(uploadedFile.size / 1024)}KB)
            </Alert>
          </Box>
        )}

        {/* Error de validación */}
        {fileError && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="error" sx={{ fontSize: '0.875rem' }}>
              {fileError}
            </Alert>
          </Box>
        )}

        {/* Requisitos */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary" display="block">
            Requisitos del archivo:
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            • Formato: PDF
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            • Tamaño máximo: 300KB
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={MODAL_DIALOG_ACTIONS_STYLES}>
        <Button
          onClick={handleCloseModal}
          variant="outlined"
          sx={MODAL_CANCEL_BUTTON_STYLES}
        >
          Cerrar
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="primary"
          disabled={!isSubmitEnabled}
          sx={{
            ...MODAL_SUBMIT_BUTTON_STYLES,
            opacity: isSubmitEnabled ? 1 : 0.5,
            cursor: isSubmitEnabled ? 'pointer' : 'not-allowed',
          }}
        >
          Firmar Documento
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * Modal de confirmación para cancelar operación
 */
const CancelModal = ({ open, financing, onConfirm, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [reason, setReason] = useState('');
  useBodyScrollLock(open);

  const handleConfirm = () => {
    onConfirm(financing, reason.trim() || null);
    setReason('');
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      fullScreen={isMobile}
      disableScrollLock
      sx={{ zIndex: 1500 }}
      PaperProps={{
        sx: { borderRadius: isMobile ? 0 : 2 },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          justifyContent: 'center',
          textAlign: 'center',
          backgroundColor: '#2E52B2',
          color: '#fff',
          py: { xs: 2, sm: 2 },
          px: { xs: 2, sm: 3 },
          position: 'relative',
          fontSize: { xs: '1.125rem', sm: '1.25rem' },
        }}
      >
        <IconButton
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: { xs: 8, sm: 16 },
            top: '50%',
            transform: 'translateY(-50%)',
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
        <BlockIcon sx={{ color: '#fff' }} fontSize="small" />
        Cancelar Operación
      </DialogTitle>
      <DialogContent dividers sx={MODAL_DIALOG_CONTENT_STYLES}>
        <DialogContentText>
          ¿Estás seguro de cancelar esta operación de financiamiento?
          Esta acción notificará al proveedor.
        </DialogContentText>
        {financing && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2">
              <strong>Proveedor:</strong> {financing.supplier_name}
            </Typography>
            <Typography variant="body2">
              <strong>Monto:</strong> {formatPrice(financing.amount)}
            </Typography>
            <Typography variant="body2">
              <strong>Plazo:</strong> {financing.term_days} días
            </Typography>
          </Box>
        )}
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Motivo (opcional)"
          placeholder="Especifica el motivo de la cancelación..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          inputProps={{ maxLength: 200 }}
          helperText={`${reason.length}/200 caracteres`}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions sx={MODAL_DIALOG_ACTIONS_STYLES}>
        <Button
          onClick={handleClose}
          variant="outlined"
          sx={MODAL_CANCEL_BUTTON_STYLES}
        >
          Cerrar
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="warning"
          sx={MODAL_SUBMIT_BUTTON_STYLES}
        >
          Sí, Cancelar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * Modal de pago en línea
 */
const PayOnlineModal = ({ open, financing, onConfirm, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  useBodyScrollLock(open);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      disableScrollLock
      sx={{ zIndex: 1500 }}
      PaperProps={{
        sx: { borderRadius: isMobile ? 0 : 2 },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          justifyContent: 'center',
          textAlign: 'center',
          backgroundColor: '#2E52B2',
          color: '#fff',
          py: { xs: 2, sm: 2 },
          px: { xs: 2, sm: 3 },
          position: 'relative',
          fontSize: { xs: '1.125rem', sm: '1.25rem' },
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: { xs: 8, sm: 16 },
            top: '50%',
            transform: 'translateY(-50%)',
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
        <PaymentIcon sx={{ color: '#fff' }} fontSize="small" />
        Pagar en línea
      </DialogTitle>
      <DialogContent dividers sx={MODAL_DIALOG_CONTENT_STYLES}>
        <DialogContentText>
          Serás redirigido al checkout para realizar el pago del crédito al: <strong>{financing?.supplier_name}</strong> por un monto utilizado de <strong>{formatPrice(financing?.amount_used || 0)}</strong>.
        </DialogContentText>
        {financing && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2">
              <strong>Proveedor:</strong> {financing.supplier_name}
            </Typography>
            <Typography variant="body2">
              <strong>Monto Utilizado:</strong> {formatPrice(financing.amount_used || 0)}
            </Typography>
            <Typography variant="body2">
              <strong>Plazo:</strong> {financing.term_days} días
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={MODAL_DIALOG_ACTIONS_STYLES}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={MODAL_CANCEL_BUTTON_STYLES}
        >
          Cerrar
        </Button>
        <Button
          onClick={() => onConfirm(financing)}
          variant="contained"
          color="primary"
          sx={MODAL_SUBMIT_BUTTON_STYLES}
        >
          Ir a pagar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * Componente contenedor de modales
 * Gestiona qué modal mostrar según el modo activo
 */
const BuyerFinancingActionModals = ({
  open,
  mode,
  financing,
  onClose,
  onSign,
  onCancel,
  onPayOnline,
}) => {
  return (
    <>
      <SignModal
        open={open && mode === 'sign'}
        financing={financing}
        onConfirm={onSign}
        onClose={onClose}
      />
      <CancelModal
        open={open && mode === 'cancel'}
        financing={financing}
        onConfirm={onCancel}
        onClose={onClose}
      />
      <PayOnlineModal
        open={open && mode === 'payOnline'}
        financing={financing}
        onConfirm={onPayOnline}
        onClose={onClose}
      />
    </>
  );
};

export default BuyerFinancingActionModals;
