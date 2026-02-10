import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, IconButton, TextField, useTheme, useMediaQuery, Alert } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import DrawIcon from '@mui/icons-material/Draw';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CircularProgress from '@mui/material/CircularProgress';
import { generateFinancingContract, downloadDocument, getFinancingDocuments } from '../../../domains/admin/services/adminFinancingService';
import { toast } from 'react-hot-toast';
// Local modal styles (copied minimal from the app design system)
const MODAL_DIALOG_ACTIONS_STYLES = {
  flexDirection: { xs: 'column', sm: 'row' },
  gap: { xs: 1.5, sm: 2 },
  p: { xs: 2, sm: 3 },
  pt: { xs: 1.5, sm: 1 },
  justifyContent: 'center',
};

const MODAL_DIALOG_CONTENT_STYLES = {
  px: { xs: 1.5, sm: 3 },
  py: { xs: 1.5, sm: 2.5 },
};

const MODAL_BUTTON_BASE_STYLES = {
  textTransform: 'none',
  borderRadius: 2,
  fontSize: { xs: '0.875rem', sm: '0.875rem' },
  px: 2,
  py: { xs: 1, sm: 0.75 },
  width: { xs: '100%', sm: '160px' },
  boxSizing: 'border-box',
};

const MODAL_CANCEL_BUTTON_STYLES = {
  ...MODAL_BUTTON_BASE_STYLES,
  fontWeight: 500,
};

const MODAL_SUBMIT_BUTTON_STYLES = {
  ...MODAL_BUTTON_BASE_STYLES,
  fontWeight: 600,
  order: { xs: -1, sm: 0 },
};

import { formatPrice } from '../../utils/formatters';

// Minimal local hook for locking body scroll when a modal is open
function useBodyScrollLock(open) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    if (open) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);
}

const ApproveModal = ({ open, financing, onConfirm, onClose }) => {
  // Now behaves like a Sign modal: download contract marco, upload signed PDF, then approve
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  useBodyScrollLock(open);

  const handleDownloadContract = async () => {
    if (!financing?.id) return;
    
    try {
      setDownloading(true);
      console.log('[ApproveModal] Attempting to download contract for financing:', financing.id);
      
      // Obtener documentos existentes
      const docs = await getFinancingDocuments(financing.id);
      const contractDoc = docs.find(d => d.document_type === 'contrato_marco' || d.document_type === 'contract');
      
      if (!contractDoc) {
        // NO GENERAR - solo informar que no existe
        console.warn('[ApproveModal] No contract found for financing:', financing.id);
        toast.error('No hay contrato disponible para descargar. El buyer o supplier aún no lo han generado.');
        return;
      }
      
      // Descargar documento existente
      console.log('[ApproveModal] Found existing contract, downloading from storage');
      const blob = await downloadDocument(contractDoc.storage_path);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = contractDoc.document_name || `contrato_marco_${financing.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Contrato descargado');
    } catch (error) {
      console.error('[ApproveModal] Error handling contract download:', error);
      toast.error(`Error al obtener el contrato: ${error.message || 'Error desconocido'}`);
    } finally {
      setDownloading(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    setFileError('');

    if (!file) { setUploadedFile(null); return; }
    if (file.type !== 'application/pdf') { setFileError('El archivo debe ser un PDF'); setUploadedFile(null); return; }
    const maxSize = 300 * 1024;
    if (file.size > maxSize) { setFileError(`El archivo excede el tamaño máximo de 300KB (actual: ${Math.round(file.size / 1024)}KB)`); setUploadedFile(null); return; }
    setUploadedFile(file);
  };

  const handleConfirm = () => {
    if (!uploadedFile) return;
    setConfirmDialogOpen(true);
  };
  
  const handleFinalConfirm = () => {
    setConfirmDialogOpen(false);
    onConfirm(financing, uploadedFile);
    setUploadedFile(null);
    setFileError('');
  };

  const handleClose = () => { 
    setUploadedFile(null); 
    setFileError(''); 
    setConfirmDialogOpen(false);
    onClose(); 
  };

  const isSubmitEnabled = uploadedFile && !fileError;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth fullScreen={isMobile} disableScrollLock sx={{ zIndex: 1500 }} PaperProps={{ sx: { borderRadius: isMobile ? 0 : 2 } }}>
      <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center', textAlign: 'center', backgroundColor: '#2E52B2', color: '#fff', py: { xs: 2, sm: 2 }, px: { xs: 2, sm: 3 }, position: 'relative', fontSize: { xs: '1.125rem', sm: '1.25rem' } }}>
        <IconButton onClick={handleClose} sx={{ position: 'absolute', right: { xs: 8, sm: 16 }, top: '50%', transform: 'translateY(-50%)', color: '#fff', backgroundColor: 'rgba(255, 255, 255, 0.1)', p: { xs: 0.75, sm: 1 }, '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' } }}>
          <CloseIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
        </IconButton>
        <DrawIcon sx={{ color: '#fff' }} fontSize="small" />
        Firmar / Adjuntar Contrato Marco
      </DialogTitle>

      <DialogContent dividers sx={MODAL_DIALOG_CONTENT_STYLES}>
        <Typography>Descarga el contrato marco, fírmalo (supplier/buyer) y súbelo en formato PDF para aprobar.</Typography>
        {financing && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2"><strong>Solicitante:</strong> {financing.buyer_user_nm || financing.buyer?.name}</Typography>
            <Typography variant="body2"><strong>Monto:</strong> {formatPrice(financing.amount)}</Typography>
            <Typography variant="body2"><strong>Plazo:</strong> {financing.term_days} días</Typography>
          </Box>
        )}

        <Box sx={{ mt: 3, display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
          <Box sx={{ flex: 1 }}>
            <Button 
              fullWidth 
              variant="outlined" 
              startIcon={downloading ? <CircularProgress size={20} /> : <DownloadIcon />} 
              onClick={handleDownloadContract}
              disabled={downloading}
              sx={{ py: 1.5, borderColor: '#2E52B2', color: '#2E52B2', '&:hover': { borderColor: '#1e3a8a', backgroundColor: 'rgba(46, 82, 178, 0.04)' } }}
            >
              {downloading ? 'Generando...' : 'Descargar Contrato Marco'}
            </Button>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Button fullWidth variant="outlined" component="label" startIcon={<UploadFileIcon />} sx={{ py: 1.5, borderColor: uploadedFile ? '#10b981' : '#6b7280', color: uploadedFile ? '#10b981' : '#6b7280', '&:hover': { borderColor: uploadedFile ? '#059669' : '#4b5563', backgroundColor: uploadedFile ? 'rgba(16, 185, 129, 0.04)' : 'rgba(107, 114, 128, 0.04)' } }}>{uploadedFile ? 'PDF Adjuntado ✓' : 'Adjuntar Contrato Firmado'}<input type="file" hidden accept=".pdf,application/pdf" onChange={handleFileUpload} /></Button>
          </Box>
        </Box>

        {uploadedFile && (<Box sx={{ mt: 2 }}><Alert severity="success" sx={{ fontSize: '0.875rem' }}><strong>{uploadedFile.name}</strong> ({Math.round(uploadedFile.size / 1024)}KB)</Alert></Box>)}
        {fileError && (<Box sx={{ mt: 2 }}><Alert severity="error" sx={{ fontSize: '0.875rem' }}>{fileError}</Alert></Box>)}

        <Box sx={{ mt: 2 }}><Typography variant="caption" color="text.secondary" display="block">Requisitos del archivo:</Typography><Typography variant="caption" color="text.secondary" display="block">• Formato: PDF</Typography><Typography variant="caption" color="text.secondary" display="block">• Tamaño máximo: 300KB</Typography></Box>
      </DialogContent>

      <DialogActions sx={MODAL_DIALOG_ACTIONS_STYLES}>
        <Button onClick={handleClose} variant="outlined" sx={MODAL_CANCEL_BUTTON_STYLES}>Cerrar</Button>
        <Button onClick={handleConfirm} variant="contained" color="success" disabled={!isSubmitEnabled} sx={{ ...MODAL_SUBMIT_BUTTON_STYLES, opacity: isSubmitEnabled ? 1 : 0.5, cursor: isSubmitEnabled ? 'pointer' : 'not-allowed' }}>Aprobar y Adjuntar</Button>
      </DialogActions>
      
      {/* Confirmación doble */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} maxWidth="xs" sx={{ zIndex: 1600 }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#d97706' }}>⚠️ Confirmar Aprobación</DialogTitle>
        <DialogContent>
          <Typography>¿Estás seguro de aprobar este financiamiento?</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Esta acción es irreversible y notificará al comprador y proveedor.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} variant="outlined">Cancelar</Button>
          <Button onClick={handleFinalConfirm} variant="contained" color="success">Confirmar Aprobación</Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

const RejectModal = ({ open, financing, onConfirm, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [reason, setReason] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  useBodyScrollLock(open);

  const handleDownloadContract = async () => {
    if (!financing?.id) return;
    
    try {
      setDownloading(true);
      console.log('[RejectModal] Attempting to download contract for financing:', financing.id);
      
      const docs = await getFinancingDocuments(financing.id);
      const contractDoc = docs.find(d => d.document_type === 'contrato_marco' || d.document_type === 'contract');
      
      if (contractDoc) {
        console.log('[RejectModal] Found existing contract, downloading from storage');
        const blob = await downloadDocument(contractDoc.storage_path);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = contractDoc.document_name || `contrato_marco_${financing.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Contrato descargado');
      } else {
        // Generar nuevo contrato (la función ya descarga automáticamente)
        console.log('[RejectModal] No existing contract found, generating new one');
        await generateFinancingContract(financing.id);
        toast.success('Contrato generado y descargado');
      }
    } catch (error) {
      console.error('[RejectModal] Error handling contract download:', error);
      toast.error(`Error al obtener el contrato: ${error.message || 'Error desconocido'}`);
    } finally {
      setDownloading(false);
    }
  };
  
  const handleConfirm = () => {
    console.log('[RejectModal] handleConfirm called');
    console.log('[RejectModal] reason:', reason);
    console.log('[RejectModal] reason.trim():', reason.trim());
    setConfirmDialogOpen(true);
  };
  
  const handleFinalConfirm = () => {
    console.log('[RejectModal] handleFinalConfirm called');
    console.log('[RejectModal] calling onConfirm with:', financing, reason.trim() || null);
    setConfirmDialogOpen(false);
    onConfirm(financing, reason.trim() || null);
    setReason('');
  };

  const handleClose = () => {
    setReason('');
    setConfirmDialogOpen(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth fullScreen={isMobile} disableScrollLock sx={{ zIndex: 1500 }} PaperProps={{ sx: { borderRadius: isMobile ? 0 : 2 } }}>
      <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center', textAlign: 'center', backgroundColor: '#2E52B2', color: '#fff', py: { xs: 2, sm: 2 }, px: { xs: 2, sm: 3 }, position: 'relative', fontSize: { xs: '1.125rem', sm: '1.25rem' } }}>
        <IconButton onClick={handleClose} sx={{ position: 'absolute', right: { xs: 8, sm: 16 }, top: '50%', transform: 'translateY(-50%)', color: '#fff', backgroundColor: 'rgba(255, 255, 255, 0.1)', p: { xs: 0.75, sm: 1 }, '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' } }}>
          <CloseIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
        </IconButton>
        <CancelIcon sx={{ color: '#fff' }} fontSize="small" />
        Rechazar Solicitud de Financiamiento
      </DialogTitle>

      <DialogContent dividers sx={MODAL_DIALOG_CONTENT_STYLES}>
        <Typography>¿Estás seguro de rechazar esta solicitud? Esta acción notificará al solicitante.</Typography>
        {financing && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2"><strong>Solicitante:</strong> {financing.buyer_user_nm || financing.buyer?.name}</Typography>
            <Typography variant="body2"><strong>Monto:</strong> {formatPrice(financing.amount)}</Typography>
            <Typography variant="body2"><strong>Plazo:</strong> {financing.term_days} días</Typography>
          </Box>
        )}

        {/* Permitir descargar el contrato marco antes de rechazar */}
        <Box sx={{ mt: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={downloading ? <CircularProgress size={20} /> : <DownloadIcon />}
            onClick={handleDownloadContract}
            disabled={downloading}
            sx={{ py: 1.5, borderColor: '#2E52B2', color: '#2E52B2', '&:hover': { borderColor: '#1e3a8a', backgroundColor: 'rgba(46, 82, 178, 0.04)' } }}
          >
            {downloading ? 'Descargando...' : 'Descargar Contrato Marco'}
          </Button>
        </Box>

        <TextField 
          fullWidth 
          multiline 
          rows={3} 
          label="Motivo (obligatorio para rechazo)" 
          placeholder="Especifica el motivo del rechazo..." 
          value={reason} 
          onChange={(e) => setReason(e.target.value)} 
          inputProps={{ maxLength: 200 }} 
          helperText={`${reason.length}/200 caracteres`} 
          sx={{ mt: 2 }} 
          required
        />
      </DialogContent>

      <DialogActions sx={MODAL_DIALOG_ACTIONS_STYLES}>
        <Button onClick={handleClose} variant="outlined" sx={MODAL_CANCEL_BUTTON_STYLES}>Volver</Button>
        <Button onClick={handleConfirm} variant="contained" color="error" disabled={!reason.trim()} sx={MODAL_SUBMIT_BUTTON_STYLES}>Rechazar</Button>
      </DialogActions>
      
      {/* Confirmación doble */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} maxWidth="xs" sx={{ zIndex: 1600 }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#dc2626' }}>⚠️ Confirmar Rechazo</DialogTitle>
        <DialogContent>
          <Typography>¿Estás seguro de rechazar este financiamiento?</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Esta acción es irreversible y notificará al comprador.</Typography>
          {reason && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2"><strong>Motivo:</strong> {reason}</Typography>
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} variant="outlined">Cancelar</Button>
          <Button onClick={handleFinalConfirm} variant="contained" color="error">Confirmar Rechazo</Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

const SignModal = ({ open, financing, onConfirm, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  useBodyScrollLock(open);
  
  console.log('[SignModal] Render - open:', open, 'confirmDialogOpen:', confirmDialogOpen);
  
  const handleDownloadContract = async () => {
    if (!financing?.id) return;
    
    try {
      setDownloading(true);
      console.log('[SignModal] Attempting to download contract for financing:', financing.id);
      
      const docs = await getFinancingDocuments(financing.id);
      const contractDoc = docs.find(d => d.document_type === 'contrato_marco' || d.document_type === 'contract');
      
      if (contractDoc) {
        console.log('[SignModal] Found existing contract, downloading from storage');
        const blob = await downloadDocument(contractDoc.storage_path);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = contractDoc.document_name || `contrato_marco_${financing.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Contrato descargado');
      } else {
        // Generar nuevo contrato (la función ya descarga automáticamente)
        console.log('[SignModal] No existing contract found, generating new one');
        await generateFinancingContract(financing.id);
        toast.success('Contrato generado y descargado');
      }
    } catch (error) {
      console.error('[SignModal] Error handling contract download:', error);
      toast.error(`Error al obtener el contrato: ${error.message || 'Error desconocido'}`);
    } finally {
      setDownloading(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    setFileError('');

    if (!file) { setUploadedFile(null); return; }
    if (file.type !== 'application/pdf') { setFileError('El archivo debe ser un PDF'); setUploadedFile(null); return; }
    const maxSize = 300 * 1024;
    if (file.size > maxSize) { setFileError(`El archivo excede el tamaño máximo de 300KB (actual: ${Math.round(file.size / 1024)}KB)`); setUploadedFile(null); return; }
    setUploadedFile(file);
  };

  const handleConfirm = () => {
    if (!uploadedFile) return;
    console.log('[SignModal] handleConfirm called');
    console.log('[SignModal] uploadedFile:', uploadedFile);
    console.log('[SignModal] Setting confirmDialogOpen to true');
    setConfirmDialogOpen(true);
  };

  const handleFinalConfirm = () => {
    console.log('[SignModal] handleFinalConfirm called');
    console.log('[SignModal] calling onConfirm with:', financing, uploadedFile);
    setConfirmDialogOpen(false);
    onConfirm(financing, uploadedFile);
    setUploadedFile(null);
    setFileError('');
  };

  const handleClose = () => { 
    setUploadedFile(null); 
    setFileError(''); 
    setConfirmDialogOpen(false);
    onClose(); 
  };

  const isSubmitEnabled = uploadedFile && !fileError;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth fullScreen={isMobile} disableScrollLock sx={{ zIndex: 1500 }} PaperProps={{ sx: { borderRadius: isMobile ? 0 : 2 } }}>
      <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center', textAlign: 'center', backgroundColor: '#2E52B2', color: '#fff', py: { xs: 2, sm: 2 }, px: { xs: 2, sm: 3 }, position: 'relative', fontSize: { xs: '1.125rem', sm: '1.25rem' } }}>
        <IconButton onClick={handleClose} sx={{ position: 'absolute', right: { xs: 8, sm: 16 }, top: '50%', transform: 'translateY(-50%)', color: '#fff', backgroundColor: 'rgba(255, 255, 255, 0.1)', p: { xs: 0.75, sm: 1 }, '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' } }}>
          <CloseIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
        </IconButton>
        <DrawIcon sx={{ color: '#fff' }} fontSize="small" />
        Firmar Documento de Financiamiento
      </DialogTitle>

      <DialogContent dividers sx={MODAL_DIALOG_CONTENT_STYLES}>
        <Typography>Descarga el contrato marco, fírmalo y súbelo en formato PDF para completar el proceso.</Typography>
        {financing && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2"><strong>Solicitante:</strong> {financing.buyer_user_nm || financing.buyer?.name}</Typography>
            <Typography variant="body2"><strong>Monto:</strong> {formatPrice(financing.amount)}</Typography>
            <Typography variant="body2"><strong>Plazo:</strong> {financing.term_days} días</Typography>
          </Box>
        )}

        <Box sx={{ mt: 3, display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
          <Box sx={{ flex: 1 }}>
            <Button 
              fullWidth 
              variant="outlined" 
              startIcon={downloading ? <CircularProgress size={20} /> : <DownloadIcon />}
              onClick={handleDownloadContract}
              disabled={downloading}
              sx={{ py: 1.5, borderColor: '#2E52B2', color: '#2E52B2', '&:hover': { borderColor: '#1e3a8a', backgroundColor: 'rgba(46, 82, 178, 0.04)' } }}
            >
              {downloading ? 'Descargando...' : 'Descargar Contrato Marco'}
            </Button>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Button fullWidth variant="outlined" component="label" startIcon={<UploadFileIcon />} sx={{ py: 1.5, borderColor: '#6b7280', color: '#6b7280', '&:hover': { borderColor: '#4b5563', backgroundColor: 'rgba(107, 114, 128, 0.04)' } }}>{'Adjuntar Contrato Firmado'}<input type="file" hidden accept=".pdf,application/pdf" onChange={handleFileUpload} /></Button>
          </Box>
        </Box>

        {uploadedFile && (<Box sx={{ mt: 2 }}><Alert severity="success" sx={{ fontSize: '0.875rem' }}><strong>{uploadedFile.name}</strong> ({Math.round(uploadedFile.size / 1024)}KB)</Alert></Box>)}
        {fileError && (<Box sx={{ mt: 2 }}><Alert severity="error" sx={{ fontSize: '0.875rem' }}>{fileError}</Alert></Box>)}

        <Box sx={{ mt: 2 }}><Typography variant="caption" color="text.secondary" display="block">Requisitos del archivo:</Typography><Typography variant="caption" color="text.secondary" display="block">• Formato: PDF</Typography><Typography variant="caption" color="text.secondary" display="block">• Tamaño máximo: 300KB</Typography></Box>
      </DialogContent>

      <DialogActions sx={MODAL_DIALOG_ACTIONS_STYLES}>
        <Button onClick={handleClose} variant="outlined" sx={MODAL_CANCEL_BUTTON_STYLES}>Cerrar</Button>
        <Button onClick={handleConfirm} variant="contained" color="primary" disabled={!isSubmitEnabled} sx={{ ...MODAL_SUBMIT_BUTTON_STYLES, opacity: isSubmitEnabled ? 1 : 0.5, cursor: isSubmitEnabled ? 'pointer' : 'not-allowed' }}>Firmar Documento</Button>
      </DialogActions>
      
      {/* Confirmación doble */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} maxWidth="xs" sx={{ zIndex: 1600 }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#2E52B2' }}>✍️ Confirmar Firma</DialogTitle>
        <DialogContent>
          <Typography>¿Estás seguro de firmar y adjuntar este contrato marco?</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Esta acción completará el proceso de firma y el contrato será visible para todas las partes.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} variant="outlined">Cancelar</Button>
          <Button onClick={handleFinalConfirm} variant="contained" color="primary">Confirmar Firma</Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

const FinancingActionModals = ({ open, mode, financing, onClose, onApprove, onReject, onSign }) => {
  return (
    <>
      <ApproveModal open={open && mode === 'approve'} financing={financing} onConfirm={onApprove} onClose={onClose} />
      <RejectModal open={open && mode === 'reject'} financing={financing} onConfirm={onReject} onClose={onClose} />
      <SignModal open={open && mode === 'sign'} financing={financing} onConfirm={onSign} onClose={onClose} />
    </>
  );
};

export default FinancingActionModals;
