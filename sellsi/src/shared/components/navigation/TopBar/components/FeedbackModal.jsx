import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FeedbackIcon from '@mui/icons-material/Feedback';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { supabase } from '../../../../services/supabase';
import {
  MODAL_DIALOG_ACTIONS_STYLES,
  MODAL_DIALOG_CONTENT_STYLES,
  MODAL_CANCEL_BUTTON_STYLES,
  MODAL_SUBMIT_BUTTON_STYLES,
} from '../../../feedback/Modal/Modal';

/**
 * Modal para enviar feedback/sugerencias a Sellsi
 */
const FeedbackModal = ({ open, onClose, userEmail, companyName, userName }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!message.trim()) {
      setError('Por favor escribe tu mensaje');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'send-feedback',
        {
          body: {
            message: message.trim(),
            companyName: companyName || 'No especificada',
            contactEmail: userEmail || 'No disponible',
            userName: userName || undefined,
          },
        }
      );

      if (fnError) {
        throw fnError;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setSuccess(true);
      setMessage('');
    } catch (err) {
      console.error('Error sending feedback:', err);
      setError('No pudimos enviar tu mensaje. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setMessage('');
      setError('');
      setSuccess(false);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      disableScrollLock={true}
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
          disabled={loading}
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
        <FeedbackIcon sx={{ color: '#fff' }} fontSize="small" />
        ¡Ayúdanos a mejorar!
      </DialogTitle>

      <DialogContent dividers sx={MODAL_DIALOG_CONTENT_STYLES}>
        {success ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              py: 4,
              gap: 2,
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main' }} />
            <Typography variant="h6" textAlign="center">
              ¡Gracias por tu feedback!
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
            >
              Hemos recibido tu mensaje. Tu opinión nos ayuda a mejorar Sellsi.
            </Typography>
          </Box>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Tu opinión es muy importante para nosotros. Cuéntanos qué podemos
              mejorar, qué funcionalidades te gustaría ver, o cualquier
              sugerencia que tengas.
            </Typography>

            <TextField
              autoFocus
              multiline
              rows={6}
              fullWidth
              placeholder="Escribe tu mensaje aquí..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              disabled={loading}
              error={!!error}
              helperText={error}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 1, display: 'block' }}
            >
              Tu mensaje será enviado junto con tu email de contacto para que
              podamos responderte si es necesario.
            </Typography>
          </>
        )}
      </DialogContent>

      <DialogActions sx={MODAL_DIALOG_ACTIONS_STYLES}>
        {success ? (
          <Button
            onClick={handleClose}
            variant="contained"
            sx={MODAL_SUBMIT_BUTTON_STYLES}
          >
            Cerrar
          </Button>
        ) : (
          <>
            <Button
              onClick={handleClose}
              disabled={loading}
              variant="outlined"
              sx={MODAL_CANCEL_BUTTON_STYLES}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={loading || !message.trim()}
              startIcon={
                loading ? <CircularProgress size={16} color="inherit" /> : null
              }
              sx={MODAL_SUBMIT_BUTTON_STYLES}
            >
              {loading ? 'Enviando...' : 'Enviar'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default FeedbackModal;
