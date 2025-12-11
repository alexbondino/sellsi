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
import { Close as CloseIcon, Security as SecurityIcon } from '@mui/icons-material';
import { privacyContent } from '../../constants/content';
import { TextFormatter } from '../formatters';

const PrivacyPolicyModal = ({ open, onClose }) => {
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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: '#f8f9fa',
          borderBottom: '2px solid #41B6E6',
          p: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <SecurityIcon sx={{ color: '#41B6E6', fontSize: '2rem' }} />
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: '#2E52B2',
              fontSize: { xs: '1.3rem', md: '1.5rem' },
            }}
          >
            Política de Privacidad
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            color: '#666',
            '&:hover': {
              bgcolor: 'rgba(0, 0, 0, 0.04)',
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          p: { xs: 2, md: 4 },
          bgcolor: '#fff',
        }}
      >
        <TextFormatter text={privacyContent} />
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
          color="primary"
          sx={{
            px: 4,
            py: 1.5,
            borderRadius: 2,
            fontWeight: 600,
            fontSize: '1rem',
            textTransform: 'none',
          }}
        >
          Entendido
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PrivacyPolicyModal;