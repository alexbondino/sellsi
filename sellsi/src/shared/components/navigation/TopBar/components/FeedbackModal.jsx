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
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FeedbackIcon from '@mui/icons-material/Feedback';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { supabase } from '../../../../services/supabase';

/**
 * Modal para enviar feedback/sugerencias a Sellsi
 */
const FeedbackModal = ({ open, onClose, userEmail, companyName, userName }) => {
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
      disableScrollLock={true}
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FeedbackIcon color="primary" />
          <Typography variant="h6" fontWeight={600}>
            ¡Ayúdanos a mejorar!
          </Typography>
        </Box>
        <IconButton onClick={handleClose} disabled={loading} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
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

      <DialogActions sx={{ px: 3, pb: 2 }}>
        {success ? (
          <Button onClick={handleClose} variant="contained">
            Cerrar
          </Button>
        ) : (
          <>
            <Button onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={loading || !message.trim()}
              startIcon={
                loading ? <CircularProgress size={16} color="inherit" /> : null
              }
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
