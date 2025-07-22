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
import {
  Close as CloseIcon,
  WarningAmber as WarningAmberIcon,
} from '@mui/icons-material';

import { MODAL_TYPES, getModalConfig, formatAddress, formatCurrency } from './modalConfig';

/**
 * Modal - Un componente de modal versátil y reutilizable.
 *
 * @param {boolean} isOpen - Si el modal está abierto.
 * @param {function} onClose - Función para cerrar el modal.
 * @param {function} onSubmit - Función a ejecutar al confirmar (si es un formulario).
 * @param {string} type - Tipo de modal (definido en MODAL_TYPES) para configuración de icono y botones.
 * @param {string} title - Título del modal.
 * @param {React.Node} children - Contenido principal del modal.
 * @param {object} order - Objeto de orden (opcional, para modales de orden).
 * @param {string} submitButtonText - Texto personalizado para el botón de confirmar.
 * @param {string} submitButtonColor - Color del botón de confirmar (MUI color).
 * @param {string} cancelButtonText - Texto para el botón de cancelar.
 * @param {boolean} showCancelButton - Si mostrar el botón de cancelar.
 * @param {boolean} loading - Si está cargando (deshabilita botones).
 * @param {boolean} showWarningIconHeader - Si mostrar un icono de advertencia adicional en el encabezado.
 * @param {boolean} isFormModal - Si el modal actúa como un formulario (manejará onSubmit y tipo='submit' para el botón).
 */
const Modal = ({
  isOpen,
  onClose,
  onSubmit,
  type = MODAL_TYPES.INFO,
  title,
  children,
  order = null,
  submitButtonText,
  submitButtonColor,
  cancelButtonText = 'Cancelar',
  showCancelButton = true,
  loading = false,
  showWarningIconHeader = false,
  isFormModal = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const config = getModalConfig(type);
  const IconComponent = config.icon;

  const handleSubmitInternal = event => {
    if (isFormModal && onSubmit) {
      event.preventDefault();
      const formData = new FormData(event.target);
      const data = {};
      for (let [key, value] of formData.entries()) {
        data[key] = value;
      }
      onSubmit(data);
    } else if (!isFormModal && onSubmit) {
      onSubmit();
    }
  };

  const currentSubmitButtonText = submitButtonText || config.confirmText;
  const currentSubmitButtonColor = submitButtonColor || config.confirmColor;

  return (
    <Dialog
      open={isOpen}
      onClose={loading ? null : onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      disableScrollLock={true}
      disableRestoreFocus={true}
      PaperProps={{
        component: isFormModal ? 'form' : 'div',
        onSubmit: isFormModal ? handleSubmitInternal : undefined,
        elevation: 0,
        sx: {
          borderRadius: isMobile ? 0 : 3,
          overflow: 'hidden',
          position: 'fixed',
          maxWidth: isMobile ? '100%' : '400px',
          ...(isFormModal && { maxWidth: 'sm' }),
        },
      }}
    >
      <DialogTitle
        sx={{
          position: 'relative',
          textAlign: [
            MODAL_TYPES.INFO,
            MODAL_TYPES.SUCCESS,
            MODAL_TYPES.WARNING,
            MODAL_TYPES.DELETE,
          ].includes(type)
            ? 'center'
            : 'left',
          pb: [
            MODAL_TYPES.INFO,
            MODAL_TYPES.SUCCESS,
            MODAL_TYPES.WARNING,
            MODAL_TYPES.DELETE,
          ].includes(type)
            ? 1
            : 3,
          pt: [
            MODAL_TYPES.INFO,
            MODAL_TYPES.SUCCESS,
            MODAL_TYPES.WARNING,
            MODAL_TYPES.DELETE,
          ].includes(type)
            ? 3
            : 1,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexDirection: [
              MODAL_TYPES.INFO,
              MODAL_TYPES.SUCCESS,
              MODAL_TYPES.WARNING,
              MODAL_TYPES.DELETE,
            ].includes(type)
              ? 'column'
              : 'row',
          }}
        >
          {IconComponent &&
            [
              MODAL_TYPES.INFO,
              MODAL_TYPES.SUCCESS,
              MODAL_TYPES.WARNING,
              MODAL_TYPES.DELETE,
            ].includes(type) && (
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
                <IconComponent sx={{ fontSize: 32, color: config.iconColor }} />
              </Box>
            )}

          {IconComponent &&
            [
              MODAL_TYPES.ORDER_CHECK,
              MODAL_TYPES.ORDER_TRUCK,
              MODAL_TYPES.ORDER_BRIEFCASE,
            ].includes(type) && (
              <IconComponent sx={{ fontSize: 24, color: config.iconColor }} />
            )}

          {showWarningIconHeader && <WarningAmberIcon color="warning" />}

          <Typography
            variant="h6"
            component="span"
            fontWeight={
              [
                MODAL_TYPES.INFO,
                MODAL_TYPES.SUCCESS,
                MODAL_TYPES.WARNING,
                MODAL_TYPES.DELETE,
              ].includes(type)
                ? '600'
                : 'normal'
            }
            sx={{
              flexGrow: 1,
              fontSize: { xs: '1.1rem', sm: '1.25rem' },
              color: 'text.primary',
            }}
          >
            {title}
          </Typography>

          {!loading && (
            <IconButton
              onClick={onClose}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                color: 'grey.500',
              }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      </DialogTitle>

      <DialogContent
        dividers={isFormModal}
        sx={{
          textAlign: isFormModal ? 'left' : 'center',
          pt: isFormModal ? 0 : 0,
          pb: isFormModal ? 2 : 2,
        }}
      >
        {order && isFormModal && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Información del Pedido
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Productos:
              </Typography>
              {order.products.map((product, index) => (
                <Typography key={index} variant="body2">
                  • {product.name} x {product.quantity}
                </Typography>
              ))}
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Monto:
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {formatCurrency(order.total_amount)}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Dirección:
              </Typography>
              <Typography variant="body2">
                {formatAddress(order.deliveryAddress)}
              </Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
          </Box>
        )}

        <Typography
          variant="body1"
          component="div"
          color="text.secondary"
          sx={{
            fontSize: { xs: '0.9rem', sm: '1rem' },
            lineHeight: 1.5,
          }}
        >
          {children}
        </Typography>
      </DialogContent>

      <DialogActions
        sx={{
          flexDirection: isMobile ? 'column' : 'row',
          gap: 1,
          p: 3,
          pt: 1,
          justifyContent: 'center',
        }}
      >
        {showCancelButton && (
          <Button
            onClick={onClose}
            disabled={loading}
            variant="outlined"
            fullWidth={isMobile}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              borderRadius: 2,
            }}
          >
            {cancelButtonText}
          </Button>
        )}

        <Button
          onClick={isFormModal ? undefined : handleSubmitInternal}
          type={isFormModal ? 'submit' : 'button'}
          disabled={loading}
          variant="contained"
          color={currentSubmitButtonColor}
          fullWidth={isMobile}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
            order: isMobile ? -1 : 0,
          }}
        >
          {loading ? 'Procesando...' : currentSubmitButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Modal;
