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
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  WarningAmber as WarningAmberIcon
} from '@mui/icons-material';

const OrderActionModal = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  order,
  submitButtonText = "Confirmar",
  submitButtonColor = "primary",
  children,
  showWarningIcon = false
}) => {
  // Formatear dirección
  const formatAddress = (address) => {
    return `${address.street}, ${address.city}, ${address.region}`;
  };

  // Formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = {};
    
    // Recopilar todos los datos del formulario
    for (let [key, value] of formData.entries()) {
      data[key] = value;
    }
    
    onSubmit(data);
  };

  if (!order) return null;

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        component: 'form',
        onSubmit: handleSubmit
      }}
    >
      {/* Encabezado */}
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {showWarningIcon && (
            <WarningAmberIcon color="warning" />
          )}
          <Typography variant="h6" component="span" sx={{ flexGrow: 1 }}>
            {title}
          </Typography>
          <IconButton
            onClick={onClose}
            sx={{ ml: 'auto' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Sección de Información No Editable */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Información del Pedido
          </Typography>
          
          {/* Productos */}
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

          {/* Monto */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Monto:
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {formatCurrency(order.total_amount)}
            </Typography>
          </Box>

          {/* Dirección */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Dirección:
            </Typography>
            <Typography variant="body2">
              {formatAddress(order.deliveryAddress)}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Contenido Adicional (children) */}
        {children && (
          <Box>
            {children}
          </Box>
        )}
      </DialogContent>

      {/* Pie de página */}
      <DialogActions sx={{ p: 3 }}>
        <Button
          onClick={onClose}
          color="inherit"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="contained"
          color={submitButtonColor}
        >
          {submitButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrderActionModal;
