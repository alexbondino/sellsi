/**
 * ============================================================================
 * SUPPLIER FINANCING ACTION MODALS
 * ============================================================================
 * 
 * Modales de confirmación para acciones de financiamiento:
 * - Aprobar solicitud
 * - Rechazar solicitud
 * - Firmar documento
 */

import React, { useState, useRef, useEffect } from 'react';
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
  Skeleton,
  Alert,
  CircularProgress,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import DrawIcon from '@mui/icons-material/Draw';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CloseIcon from '@mui/icons-material/Close';
import BlockIcon from '@mui/icons-material/Block';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useBodyScrollLock } from '../../../../shared/hooks/useBodyScrollLock';
import { formatPrice } from '../../../../shared/utils/formatters/priceFormatters';
import {
  MODAL_DIALOG_ACTIONS_STYLES,
  MODAL_DIALOG_CONTENT_STYLES,
  MODAL_DIALOG_HEADER_STYLES,
  MODAL_CANCEL_BUTTON_STYLES,
  MODAL_SUBMIT_BUTTON_STYLES,
} from '../../../../shared/components/feedback/Modal/Modal';

/**
 * Modal de confirmación para aprobar
 */
const ApproveModal = ({ open, financing, onConfirm, onClose }) => {
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
        <CheckCircleIcon sx={{ color: '#fff' }} fontSize="small" />
        Aprobar Solicitud de Financiamiento
      </DialogTitle>
      <DialogContent dividers sx={MODAL_DIALOG_CONTENT_STYLES}>
        <DialogContentText>
          ¿Estás seguro de aprobar esta solicitud de financiamiento?
        </DialogContentText>
        {financing && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2">
              <strong>Solicitante:</strong> {financing.requested_by}
            </Typography>
            <Typography variant="body2">
              <strong>Monto:</strong> {formatPrice(financing.amount)}
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
          color="success"
          sx={MODAL_SUBMIT_BUTTON_STYLES}
        >
          Aprobar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * Modal de confirmación para rechazar
 */
const RejectModal = ({ open, financing, onConfirm, onClose }) => {
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
        <CancelIcon sx={{ color: '#fff' }} fontSize="small" />
        Rechazar Solicitud de Financiamiento
      </DialogTitle>
      <DialogContent dividers sx={MODAL_DIALOG_CONTENT_STYLES}>
        <DialogContentText>
          ¿Estás seguro de rechazar esta solicitud de financiamiento?
          Esta acción notificará al solicitante.
        </DialogContentText>
        {financing && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2">
              <strong>Solicitante:</strong> {financing.requested_by}
            </Typography>
            <Typography variant="body2">
              <strong>Monto:</strong> {formatPrice(financing.amount)}
            </Typography>
          </Box>
        )}
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Motivo (opcional)"
          placeholder="Especifica el motivo del rechazo..."
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
          Volver
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="error"
          sx={MODAL_SUBMIT_BUTTON_STYLES}
        >
          Rechazar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * Modal de confirmación para firmar
 */
const SignModal = ({ open, financing, onConfirm, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  useBodyScrollLock(open);

  const handleDownloadContract = async () => {
    try {
      if (!financing?.id) {
        console.error('[SignModal] No financing ID');
        return;
      }

      setIsGeneratingPdf(true);
      console.log('[SignModal Supplier] Descargando contrato para financing:', financing.id);
      
      // Importar supabase dinámicamente
      const { supabase } = await import('../../../../services/supabase');
      
      // PRIMERO: Intentar descargar el archivo existente (firmado por buyer si ya existe)
      const fileName = `contrato_marco_${financing.id}.pdf`;
      const filePath = `${financing.id}/${fileName}`;
      
      console.log('[SignModal Supplier] Intentando descargar archivo existente:', filePath);
      const { data: existingBlob, error: existingError } = await supabase.storage
        .from('financing-documents')
        .download(filePath);

      if (!existingError && existingBlob) {
        // El archivo ya existe (firmado por buyer), descargarlo
        console.log('[SignModal Supplier] ✅ Archivo existente encontrado (firmado por buyer)');
        
        const url = URL.createObjectURL(existingBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `contrato_marco_${financing.id.slice(0, 8)}.pdf`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 100);
        
        console.log('[SignModal Supplier] Contrato existente descargado');
        setIsGeneratingPdf(false);
        return;
      }
      
      // Si no existe archivo, generar uno nuevo con edge function
      console.log('[SignModal Supplier] No hay archivo existente, generando nuevo PDF');
      const { data, error } = await supabase.functions.invoke('generate-financing-contract', {
        body: { financing_id: financing.id }
      });

      if (error) {
        console.error('[SignModal] Error invocando edge function:', error);
        alert(`Error al generar contrato: ${error.message || 'Error desconocido'}`);
        setIsGeneratingPdf(false);
        return;
      }

      if (!data || !data.path) {
        console.error('[SignModal] Edge function no retornó path');
        alert('Error: No se recibió la ruta del contrato generado');
        setIsGeneratingPdf(false);
        return;
      }

      // Descargar archivo generado desde storage
      const { data: blob, error: downloadError } = await supabase.storage
        .from('financing-documents')
        .download(data.path);

      if (downloadError || !blob) {
        console.error('[SignModal] Error descargando archivo:', downloadError);
        alert('Error: No se pudo descargar el contrato');
        setIsGeneratingPdf(false);
        return;
      }

      // Crear URL local del blob y forzar descarga sin cambiar de página
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `contrato_marco_${financing.id.slice(0, 8)}.pdf`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
      
      console.log('[SignModal] Contrato nuevo descargado');
      setIsGeneratingPdf(false);
    } catch (err) {
      console.error('[SignModal] Error descargando contrato:', err);
      alert(`Error al descargar contrato: ${err.message || 'Error desconocido'}`);
      setIsGeneratingPdf(false);
    }
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
              <strong>Solicitante:</strong> {financing.requested_by}
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
              startIcon={isGeneratingPdf ? <CircularProgress size={20} /> : <DownloadIcon />}
              onClick={handleDownloadContract}
              disabled={isGeneratingPdf}
              sx={{
                py: 1.5,
                borderColor: '#2E52B2',
                color: '#2E52B2',
                '&:hover': {
                  borderColor: '#1e3a8a',
                  backgroundColor: 'rgba(46, 82, 178, 0.04)',
                },
                '&.Mui-disabled': {
                  borderColor: '#9ca3af',
                  color: '#9ca3af',
                },
              }}
            >
              {isGeneratingPdf ? 'Generando PDF...' : 'Descargar Contrato Marco'}
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
          Esta acción notificará al solicitante.
        </DialogContentText>
        {financing && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2">
              <strong>Solicitante:</strong> {financing.requested_by}
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
          Si, Cancelar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * Componente contenedor de modales
 * Gestiona qué modal mostrar según el modo activo
 */
const SupplierFinancingActionModals = ({
  open,
  mode,
  financing,
  onClose,
  onApprove,
  onReject,
  onSign,
  onCancel,
}) => {
  return (
    <>
      <ApproveModal
        open={open && mode === 'approve'}
        financing={financing}
        onConfirm={onApprove}
        onClose={onClose}
      />
      <RejectModal
        open={open && mode === 'reject'}
        financing={financing}
        onConfirm={onReject}
        onClose={onClose}
      />
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
    </>
  );
};

export default SupplierFinancingActionModals;
