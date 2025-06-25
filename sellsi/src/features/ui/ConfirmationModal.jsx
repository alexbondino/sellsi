import React from 'react';
/* Modal de confirmación de eliminación de productos o distintas acciones 
Cambiar el nombre a algo más destructivo*/
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Close as CloseIcon,
  Warning as WarningIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

const MODAL_TYPES = {
  DELETE: 'delete',
  WARNING: 'warning',
  INFO: 'info',
  SUCCESS: 'success',
};

const getModalConfig = type => {
  switch (type) {
    case MODAL_TYPES.DELETE:
      return {
        icon: DeleteIcon,
        iconColor: '#f44336',
        iconBgColor: 'rgba(244, 67, 54, 0.1)',
        confirmColor: 'error',
        confirmText: 'Eliminar',
      };
    case MODAL_TYPES.WARNING:
      return {
        icon: WarningIcon,
        iconColor: '#ff9800',
        iconBgColor: 'rgba(255, 152, 0, 0.1)',
        confirmColor: 'warning',
        confirmText: 'Continuar',
      };
    case MODAL_TYPES.SUCCESS:
      return {
        icon: CheckCircleIcon,
        iconColor: '#4caf50',
        iconBgColor: 'rgba(76, 175, 80, 0.1)',
        confirmColor: 'success',
        confirmText: 'Aceptar',
      };
    default:
      return {
        icon: InfoIcon,
        iconColor: '#2196f3',
        iconBgColor: 'rgba(33, 150, 243, 0.1)',
        confirmColor: 'primary',
        confirmText: 'Aceptar',
      };
  }
};

/**
 * ConfirmationModal - Modal de confirmación reutilizable
 *
 * @param {boolean} open - Si el modal está abierto
 * @param {function} onClose - Función para cerrar el modal
 * @param {function} onConfirm - Función a ejecutar al confirmar
 * @param {string} type - Tipo de modal (delete, warning, info, success)
 * @param {string} title - Título del modal
 * @param {string} message - Mensaje principal
 * @param {string} confirmText - Texto personalizado del botón confirmar
 * @param {string} cancelText - Texto personalizado del botón cancelar
 * @param {boolean} loading - Si está cargando (deshabilita botones)
 * @param {boolean} showCancel - Si mostrar botón cancelar
 */
const ConfirmationModal = ({
  open,
  onClose,
  onConfirm,
  type = MODAL_TYPES.INFO,
  title,
  message,
  confirmText,
  cancelText = 'Cancelar',
  loading = false,
  showCancel = true,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const config = getModalConfig(type);
  const IconComponent = config.icon;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
  };

  const handleClose = () => {
    if (!loading && onClose) {
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
      disableRestoreFocus={true}
      PaperProps={{
        elevation: 0,
        sx: {
          borderRadius: isMobile ? 0 : 3,
          overflow: 'hidden',
          position: 'fixed',
          maxWidth: isMobile ? '100%' : '400px',
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          position: 'relative',
          textAlign: 'center',
          pb: 1,
          pt: 3,
        }}
      >
        {/* Close button */}
        {!loading && (
          <IconButton
            onClick={handleClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'grey.500',
            }}
          >
            <CloseIcon />
          </IconButton>
        )}
        {/* Icon */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 64,
            height: 64,
            borderRadius: '50%',
            bgcolor: config.iconBgColor,
            mx: 'auto',
            mb: 2,
          }}
        >
          <IconComponent
            sx={{
              fontSize: 32,
              color: config.iconColor,
            }}
          />
        </Box>{' '}
        {/* Title */}
        <Typography
          variant="h6"
          component="span"
          fontWeight="600"
          sx={{
            fontSize: { xs: '1.1rem', sm: '1.25rem' },
            color: 'text.primary',
          }}
        >
          {title}
        </Typography>
      </DialogTitle>

      {/* Content */}
      <DialogContent sx={{ textAlign: 'center', pt: 0, pb: 2 }}>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            fontSize: { xs: '0.9rem', sm: '1rem' },
            lineHeight: 1.5,
          }}
        >
          {message}
        </Typography>
      </DialogContent>

      {/* Actions */}
      <DialogActions
        sx={{
          flexDirection: isMobile ? 'column' : 'row',
          gap: 1,
          p: 3,
          pt: 1,
        }}
      >
        {showCancel && (
          <Button
            onClick={handleClose}
            disabled={loading}
            variant="outlined"
            fullWidth={isMobile}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              borderRadius: 2,
            }}
          >
            {cancelText}
          </Button>
        )}

        <Button
          onClick={handleConfirm}
          disabled={loading}
          variant="contained"
          color={config.confirmColor}
          fullWidth={isMobile}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
            order: isMobile ? -1 : 0,
          }}
        >
          {loading ? 'Procesando...' : confirmText || config.confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationModal;
export { MODAL_TYPES };
