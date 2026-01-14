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

import {
  MODAL_TYPES,
  getModalConfig,
  formatAddress,
  formatCurrency,
} from './modalConfig';
import { useBodyScrollLock } from '../../../shared/hooks/useBodyScrollLock';

/**
 * ============================================================================
 * ESTILOS ESTANDARIZADOS PARA BOTONES DE MODALES
 * ============================================================================
 * 
 * Estos estilos garantizan consistencia en todos los modales del sistema.
 * Úsalos cuando construyas Dialog/DialogActions personalizados.
 */

export const MODAL_DIALOG_ACTIONS_STYLES = {
  flexDirection: { xs: 'column', sm: 'row' },
  gap: { xs: 1.5, sm: 2 },
  p: { xs: 2, sm: 3 },
  pt: { xs: 1.5, sm: 1 },
  justifyContent: 'center',
};

export const MODAL_BUTTON_BASE_STYLES = {
  textTransform: 'none',
  borderRadius: 2,
  fontSize: { xs: '0.875rem', sm: '0.875rem' },
  px: 2,
  py: { xs: 1, sm: 0.75 },
  width: { xs: '100%', sm: '160px' },
  boxSizing: 'border-box',
};

export const MODAL_CANCEL_BUTTON_STYLES = {
  ...MODAL_BUTTON_BASE_STYLES,
  fontWeight: 500,
};

export const MODAL_SUBMIT_BUTTON_STYLES = {
  ...MODAL_BUTTON_BASE_STYLES,
  fontWeight: 600,
  order: { xs: -1, sm: 0 },
};

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
  submitDisabled = false, // nuevo: permite deshabilitar el botón de submit por validaciones externas
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // ✅ Bloquear scroll del body cuando el modal está abierto
  useBodyScrollLock(isOpen);

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
      sx={{ zIndex: 1500 }}
      PaperProps={{
        component: isFormModal ? 'form' : 'div',
        onSubmit: isFormModal ? handleSubmitInternal : undefined,
        elevation: 0,
        sx: {
          borderRadius: isMobile ? 0 : 3,
          overflow: 'hidden',
          ...(!isMobile && {
            maxWidth: isFormModal ? '600px' : '400px',
          }),
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
            : 'center',
          pb: [
            MODAL_TYPES.INFO,
            MODAL_TYPES.SUCCESS,
            MODAL_TYPES.WARNING,
            MODAL_TYPES.DELETE,
          ].includes(type)
            ? { xs: 1, sm: 1 }
            : { xs: 1.5, sm: 2 },
          pt: [
            MODAL_TYPES.INFO,
            MODAL_TYPES.SUCCESS,
            MODAL_TYPES.WARNING,
            MODAL_TYPES.DELETE,
          ].includes(type)
            ? { xs: 2, sm: 3 }
            : { xs: 1.5, sm: 2 },
          // Estilos Sellsi para modales ORDER_* y QUOTATION
          ...([
            MODAL_TYPES.ORDER_CHECK,
            MODAL_TYPES.ORDER_TRUCK,
            MODAL_TYPES.ORDER_BRIEFCASE,
            MODAL_TYPES.ORDER_CANCEL,
            MODAL_TYPES.QUOTATION,
          ].includes(type) && {
            backgroundColor: '#2E52B2',
            color: '#fff',
          }),
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
                  width: { xs: 56, sm: 64 },
                  height: { xs: 56, sm: 64 },
                  borderRadius: '50%',
                  bgcolor: config.iconBgColor,
                  mx: 'auto',
                  mb: { xs: 1.5, sm: 2 },
                }}
              >
                <IconComponent sx={{ fontSize: { xs: 28, sm: 32 }, color: config.iconColor }} />
              </Box>
            )}

          {IconComponent &&
            [
              MODAL_TYPES.ORDER_CHECK,
              MODAL_TYPES.ORDER_TRUCK,
              MODAL_TYPES.ORDER_BRIEFCASE,
              MODAL_TYPES.ORDER_CANCEL,
              MODAL_TYPES.QUOTATION,
            ].includes(type) && (
              <IconComponent sx={{ fontSize: { xs: 20, sm: 24 }, color: '#fff' }} />
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
                MODAL_TYPES.ORDER_CHECK,
                MODAL_TYPES.ORDER_TRUCK,
                MODAL_TYPES.ORDER_BRIEFCASE,
                MODAL_TYPES.ORDER_CANCEL,
                MODAL_TYPES.QUOTATION,
              ].includes(type)
                ? '700'
                : 'normal'
            }
            sx={{
              flexGrow: 1,
              fontSize: { xs: '1.1rem', sm: '1.25rem' },
              color: [
                MODAL_TYPES.ORDER_CHECK,
                MODAL_TYPES.ORDER_TRUCK,
                MODAL_TYPES.ORDER_BRIEFCASE,
                MODAL_TYPES.ORDER_CANCEL,
                MODAL_TYPES.QUOTATION,
              ].includes(type) ? '#fff' : 'text.primary',
            }}
          >
            {title}
          </Typography>

          {!loading && (
            <IconButton
              onClick={onClose}
              sx={{
                position: 'absolute',
                top: [
                  MODAL_TYPES.ORDER_CHECK,
                  MODAL_TYPES.ORDER_TRUCK,
                  MODAL_TYPES.ORDER_BRIEFCASE,
                  MODAL_TYPES.ORDER_CANCEL,
                  MODAL_TYPES.QUOTATION,
                ].includes(type) ? '50%' : { xs: 8, sm: 16 },
                transform: [
                  MODAL_TYPES.ORDER_CHECK,
                  MODAL_TYPES.ORDER_TRUCK,
                  MODAL_TYPES.ORDER_BRIEFCASE,
                  MODAL_TYPES.ORDER_CANCEL,
                  MODAL_TYPES.QUOTATION,
                ].includes(type) ? 'translateY(-50%)' : 'none',
                right: { xs: 8, sm: 16 },
                p: { xs: 0.75, sm: 1 },
                color: [
                  MODAL_TYPES.ORDER_CHECK,
                  MODAL_TYPES.ORDER_TRUCK,
                  MODAL_TYPES.ORDER_BRIEFCASE,
                  MODAL_TYPES.ORDER_CANCEL,
                  MODAL_TYPES.QUOTATION,
                ].includes(type) ? '#fff' : 'grey.500',
                ...([MODAL_TYPES.ORDER_CHECK,
                  MODAL_TYPES.ORDER_TRUCK,
                  MODAL_TYPES.ORDER_BRIEFCASE,
                  MODAL_TYPES.ORDER_CANCEL,
                  MODAL_TYPES.QUOTATION,
                ].includes(type) && {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
                }),
              }}
            >
              <CloseIcon sx={{ fontSize: { xs: '1.5rem', sm: '1.5rem' } }} />
            </IconButton>
          )}
        </Box>
      </DialogTitle>

      <DialogContent
        dividers={isFormModal}
        sx={{
          textAlign: isFormModal ? 'left' : 'center',
          pt: type === MODAL_TYPES.QUOTATION ? { xs: 1.5, sm: 2 } : (isFormModal ? { xs: 1.5, sm: 2 } : { xs: 1.5, sm: 2 }),
          pb: isFormModal ? { xs: 1.5, sm: 2 } : { xs: 1.5, sm: 2 },
          px: { xs: 2, sm: 3 },
        }}
      >
        {order && isFormModal && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
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
            fontSize: { xs: '0.875rem', sm: '1rem' },
            lineHeight: 1.5,
          }}
        >
          {children}
        </Typography>
      </DialogContent>

      <DialogActions sx={MODAL_DIALOG_ACTIONS_STYLES}>
        {showCancelButton && (
          <Button
            onClick={onClose}
            disabled={loading}
            variant="outlined"
            sx={MODAL_CANCEL_BUTTON_STYLES}
          >
            {cancelButtonText}
          </Button>
        )}

        <Button
          onClick={isFormModal ? undefined : handleSubmitInternal}
          type={isFormModal ? 'submit' : 'button'}
          disabled={loading || submitDisabled}
          variant="contained"
          color={currentSubmitButtonColor}
          sx={MODAL_SUBMIT_BUTTON_STYLES}
        >
          {loading ? 'Procesando...' : currentSubmitButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Modal;
