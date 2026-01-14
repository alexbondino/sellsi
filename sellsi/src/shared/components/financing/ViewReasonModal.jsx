/**
 * ============================================================================
 * VIEW REASON MODAL (SHARED)
 * ============================================================================
 * 
 * Modal compartido para ver motivo de rechazo o cancelación.
 * Usado tanto en vista Supplier como Buyer.
 */

import React, { useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import {
  MODAL_DIALOG_ACTIONS_STYLES,
  MODAL_DIALOG_CONTENT_STYLES,
  MODAL_SUBMIT_BUTTON_STYLES,
} from '../feedback/Modal/Modal';

/**
 * Modal para ver motivo de rechazo o cancelación
 */
const ViewReasonModal = ({ open, financing, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  useBodyScrollLock(open);

  // Preservar el reason durante la animación de cierre
  const reasonRef = useRef('');
  
  useEffect(() => {
    // Actualizar ref cuando financing tiene valor Y el modal está abierto
    if (open && financing) {
      reasonRef.current = financing.rejection_reason || financing.cancellation_reason || 'No hay motivo registrado';
    }
  }, [open, financing]);

  // Usar el valor actual de financing si existe, sino usar el ref preservado
  const reason = (financing?.rejection_reason || financing?.cancellation_reason) 
    ? (financing.rejection_reason || financing.cancellation_reason)
    : (reasonRef.current || 'No hay motivo registrado');

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
        <VisibilityIcon sx={{ color: '#fff' }} fontSize="small" />
        Motivo
      </DialogTitle>
      <DialogContent dividers sx={MODAL_DIALOG_CONTENT_STYLES}>
        <Typography variant="body1" sx={{ textAlign: 'left', whiteSpace: 'pre-line' }}>
          {reason}
        </Typography>
      </DialogContent>
      <DialogActions sx={MODAL_DIALOG_ACTIONS_STYLES}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={MODAL_SUBMIT_BUTTON_STYLES}
        >
          Entendido
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ViewReasonModal;
