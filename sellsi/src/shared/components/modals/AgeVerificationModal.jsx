import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import { MODAL_DIALOG_HEADER_STYLES, MODAL_DIALOG_CONTENT_STYLES } from '../feedback/Modal/Modal';

/**
 * Modal de verificación de edad para productos restringidos (+18)
 * @param {boolean} open - Estado de apertura del modal
 * @param {function} onConfirm - Callback cuando el usuario confirma ser mayor de edad (Sí)
 * @param {function} onDeny - Callback cuando el usuario niega ser mayor de edad (No)
 */
const AgeVerificationModal = ({ open, onConfirm, onDeny }) => {
  return (
    <Dialog
      open={open}
      onClose={onDeny}
      maxWidth="xs"
      fullWidth
      disableScrollLock={true}
      disableRestoreFocus={true}
      BackdropProps={{
        style: { backgroundColor: 'rgba(0,0,0,0.5)' },
      }}
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle 
        sx={{ 
          ...MODAL_DIALOG_HEADER_STYLES, 
          textAlign: 'center',
          backgroundColor: '#2E52B2', // Azul Sellsi
          color: '#FFFFFF', // Letras blancas
          fontWeight: 600,
        }}
      >
        Verificación de Edad
      </DialogTitle>
      <DialogContent dividers sx={{ ...MODAL_DIALOG_CONTENT_STYLES, pt: { xs: 2.5, sm: 3 } }}>
        <Typography variant="body1" color="text.primary" textAlign="center" sx={{ mb: 2 }}>
          Uno de estos productos está sujeto a restricciones legales y solo puede ser adquirido por personas mayores de 18 años.
        </Typography>
        <Typography variant="body1" color="text.primary" textAlign="center">
          ¿Confirmas que cumples con este requisito?
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', gap: { xs: 1.5, sm: 2.5 }, p: { xs: 2, sm: 3 }, flexWrap: 'wrap' }}>
        <Button
          onClick={onDeny}
          variant="outlined"
          color="error"
          sx={{ 
            textTransform: 'none', 
            fontWeight: 500, 
            borderRadius: 2, 
            minWidth: { xs: 90, sm: 100 },
            flex: { xs: '1 1 auto', sm: '0 0 auto' }
          }}
        >
          No
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="success"
          sx={{ 
            textTransform: 'none', 
            fontWeight: 600, 
            borderRadius: 2, 
            minWidth: { xs: 90, sm: 100 },
            flex: { xs: '1 1 auto', sm: '0 0 auto' }
          }}
        >
          Sí
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AgeVerificationModal;
