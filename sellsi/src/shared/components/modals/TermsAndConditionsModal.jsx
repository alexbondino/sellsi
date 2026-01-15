import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Close as CloseIcon, Gavel as GavelIcon } from '@mui/icons-material';
import { termsContent } from '../../constants/content';
import { TextFormatter } from '../formatters';

const TermsAndConditionsModal = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      scroll="paper"
      sx={{
        zIndex: 1500, // Mayor que el modal de Register (1400)
      }}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          maxHeight: isMobile ? 'none' : '90vh',
          width: isMobile ? '100%' : { xs: '95vw', md: '80vw' },
          maxWidth: isMobile ? 'none' : '900px',
        },
      }}
    >
      <DialogTitle
        sx={{
          position: 'relative',
          backgroundColor: '#2E52B2',
          color: '#fff',
          p: { xs: 2, sm: 3 },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: { xs: 0.75, sm: 1 }, width: '100%' }}>
          <GavelIcon sx={{ color: '#fff', fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
          <Typography
            variant="h6"
            sx={{
              color: '#fff',
              fontWeight: 700,
              fontSize: { xs: '1.1rem', sm: '1.25rem' },
              textAlign: 'center',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            Términos y Condiciones
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            position: 'absolute',
            right: { xs: 8, sm: 16 },
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#fff',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            p: { xs: 0.5, sm: 1 },
            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
          }}
        >
          <CloseIcon sx={{ fontSize: { xs: '1.5rem', sm: '1.5rem' } }} />
        </IconButton>
      </DialogTitle>

      <DialogContent
        dividers={true}
        sx={{
          bgcolor: '#fff',
          // Use standardized modal content padding
          px: { xs: 1.5, sm: 3 },
          py: { xs: 1.5, sm: 2.5 },
        }}
      >
        <TextFormatter text={termsContent} />
      </DialogContent>

      <Divider sx={{ borderColor: '#e0e0e0' }} />

      <DialogActions
        sx={{
          p: 3,
          bgcolor: '#f8f9fa',
          justifyContent: 'center',
        }}
      >
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            bgcolor: 'primary',
            color: 'white',
            px: 4,
            py: 1.5,
            borderRadius: 2,
            fontWeight: 600,
            fontSize: '1rem',
            textTransform: 'none',
            '&:hover': {
              bgcolor: '#2E52B2',
            },
          }}
        >
          Entendido
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TermsAndConditionsModal;
