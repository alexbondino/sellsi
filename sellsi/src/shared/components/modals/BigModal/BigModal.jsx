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
} from '../../feedback/Modal/modalConfig';
import { useBodyScrollLock } from '../../../hooks/useBodyScrollLock';

/**
 * BigModal - Igual que Modal pero con mayor tamaño (maxWidth="md" y sin maxWidth fijo en PaperProps)
 */
const BigModal = ({
  isOpen,
  onClose,
  onSubmit,
  type = MODAL_TYPES.INFO,
  title,
  children,
  order = null,
  submitButtonText,
  submitButtonColor,
  cancelButtonText = 'Volver',
  showCancelButton = true,
  loading = false,
  showWarningIconHeader = false,
  isFormModal = false,
  submitDisabled = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
      maxWidth={false}
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
          width: isMobile ? '100vw' : '60%',
          height: isMobile ? 'calc(100vh - 80px)' : '80%',
          maxHeight: isMobile ? 'calc(100vh - 80px)' : '80vh',
          bottom: isMobile ? '80px' : 'auto',
          top: isMobile ? 0 : 'auto',
          display: 'flex',
          flexDirection: 'column',
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
          flexShrink: 0,
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
              MODAL_TYPES.ORDER_CANCEL,
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
              fontSize: { xs: '0.95rem', sm: '1.25rem' },
              color: 'text.primary',
              lineHeight: { xs: 1.3, sm: 1.5 },
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
          pt: { xs: 1, sm: isFormModal ? 0 : 0 },
          pb: { xs: 1.5, sm: isFormModal ? 2 : 2 },
          px: { xs: 2, sm: 3 },
          overflow: 'auto',
          flex: 1,
          minHeight: 0,
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
            fontSize: { xs: '0.85rem', sm: '1rem' },
            lineHeight: { xs: 1.4, sm: 1.5 },
          }}
        >
          {children}
        </Typography>
      </DialogContent>

      <DialogActions
        sx={{
          flexDirection: isMobile ? 'column' : 'row',
          gap: { xs: 1.5, sm: 1 },
          p: { xs: 2, sm: 3 },
          pt: { xs: 1, sm: 1 },
          justifyContent: isMobile ? 'center' : 'flex-end',
          flexShrink: 0,
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
              fontWeight: 'bold',
              borderRadius: 2,
              width: isMobile ? '100%' : 'auto',
              minWidth: { sm: '120px' },
              alignSelf: isMobile ? 'stretch' : 'flex-end',
            }}
          >
            {cancelButtonText}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BigModal;
