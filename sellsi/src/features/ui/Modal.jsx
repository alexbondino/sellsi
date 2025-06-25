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
  Check as CheckIcon,
  LocalShipping as LocalShippingIcon,
  Work as WorkIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

// --- Helper Functions ---
const formatAddress = address => {
  return `${address.street}, ${address.city}, ${address.region}`;
};

const formatCurrency = amount => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(amount);
};

// --- Configuración de tipos de modal para flexibilidad ---
export const MODAL_TYPES = {
  INFO: 'info',
  WARNING: 'warning',
  SUCCESS: 'success',
  DELETE: 'delete',
  ORDER_CHECK: 'orderCheck',
  ORDER_TRUCK: 'orderTruck',
  ORDER_BRIEFCASE: 'orderBriefcase',
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
        showWarningIcon: false,
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
    case MODAL_TYPES.ORDER_CHECK:
      return {
        icon: CheckIcon,
        iconColor: 'success.main',
        iconBgColor: null,
        confirmColor: 'primary',
        confirmText: 'Confirmar',
      };
    case MODAL_TYPES.ORDER_TRUCK:
      return {
        icon: LocalShippingIcon,
        iconColor: 'primary.main',
        iconBgColor: null,
        confirmColor: 'primary',
        confirmText: 'Confirmar',
      };
    case MODAL_TYPES.ORDER_BRIEFCASE:
      return {
        icon: WorkIcon,
        iconColor: 'secondary.main',
        iconBgColor: null,
        confirmColor: 'primary',
        confirmText: 'Confirmar',
      };
    case MODAL_TYPES.INFO:
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
                ml: 'auto',
                right: [
                  MODAL_TYPES.INFO,
                  MODAL_TYPES.SUCCESS,
                  MODAL_TYPES.WARNING,
                  MODAL_TYPES.DELETE,
                ].includes(type)
                  ? 8
                  : 0,
                top: [
                  MODAL_TYPES.INFO,
                  MODAL_TYPES.SUCCESS,
                  MODAL_TYPES.WARNING,
                  MODAL_TYPES.DELETE,
                ].includes(type)
                  ? 8
                  : 0,
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
