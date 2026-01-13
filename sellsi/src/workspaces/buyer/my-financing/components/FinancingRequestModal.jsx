/**
 * ============================================================================
 * FINANCING REQUEST MODAL - Modal Principal de Solicitud de Financiamiento
 * ============================================================================
 * 
 * Modal inicial que permite al usuario seleccionar el tipo de solicitud:
 * - Solicitud Extendida (con documentación completa)
 * - Solicitud Express (solicitud rápida)
 * 
 * Características:
 * - Selector de tipo de solicitud
 * - Navegación a modales específicos
 * - Bloqueo de scroll del body
 * - Responsive mobile/desktop
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  FormControl,
  Select,
  MenuItem,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import { useBodyScrollLock } from '../../../../shared/hooks/useBodyScrollLock';
import {
  MODAL_DIALOG_ACTIONS_STYLES,
  MODAL_CANCEL_BUTTON_STYLES,
  MODAL_SUBMIT_BUTTON_STYLES,
} from '../../../../shared/components/feedback/Modal/Modal';

const SELLSI_BLUE = '#2E52B2';

const FinancingRequestModal = ({ open, onClose, onSelectType }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [selectedType, setSelectedType] = useState('');

  // Bloquear scroll cuando el modal está abierto
  useBodyScrollLock(open);

  const handleConfirm = () => {
    if (selectedType) {
      onSelectType(selectedType);
    }
  };

  const handleClose = () => {
    setSelectedType('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      disableScrollLock
      sx={{ zIndex: 1500 }}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
          minHeight: { xs: 'auto', sm: '450px' },
        },
      }}
    >
      {/* Header con fondo azul Sellsi */}
      <DialogTitle
        sx={{
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          justifyContent: 'center',
          textAlign: 'center',
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
        
        <RequestQuoteIcon sx={{ color: '#fff' }} fontSize="small" />
        <span>Solicitar Financiamiento</span>
      </DialogTitle>

      {/* Contenido */}
      <DialogContent
        dividers
        sx={{
          pt: { xs: 3, sm: 4 },
          px: { xs: 2, sm: 4 },
          pb: { xs: 3, sm: 4 },
          minHeight: { xs: 'auto', sm: '320px' },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Typography
            variant="h6"
            sx={{
              fontSize: { xs: '1rem', sm: '1.125rem' },
              fontWeight: 600,
              mb: 1,
            }}
          >
            Selecciona el tipo de solicitud:
          </Typography>

          <FormControl fullWidth>
            <Select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              displayEmpty
              MenuProps={{
                disableScrollLock: true,
                disablePortal: false,
                sx: {
                  zIndex: 2000, // Mayor que el Dialog (1500)
                },
                anchorOrigin: {
                  vertical: 'bottom',
                  horizontal: 'left',
                },
                transformOrigin: {
                  vertical: 'top',
                  horizontal: 'left',
                },
                PaperProps: {
                  sx: {
                    maxHeight: 400,
                  },
                },
              }}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(0, 0, 0, 0.23)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: SELLSI_BLUE,
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: SELLSI_BLUE,
                },
              }}
            >
              <MenuItem value="" disabled>
                <em>Selecciona una opción</em>
              </MenuItem>
              <MenuItem value="extended">
                <Box>
                  <Typography variant="body1" fontWeight={600}>
                    Solicitud Extendida
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Con documentación completa para financiamiento mayor
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem value="express">
                <Box>
                  <Typography variant="body1" fontWeight={600}>
                    Solicitud Express
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Proceso rápido para financiamiento inmediato
                  </Typography>
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>

      {/* Botones de acción */}
      <DialogActions sx={MODAL_DIALOG_ACTIONS_STYLES}>
        <Button
          onClick={handleClose}
          variant="outlined"
          sx={MODAL_CANCEL_BUTTON_STYLES}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!selectedType}
          sx={MODAL_SUBMIT_BUTTON_STYLES}
        >
          Confirmar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FinancingRequestModal;
