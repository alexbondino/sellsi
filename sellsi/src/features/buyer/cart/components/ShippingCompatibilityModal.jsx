/**
 * ============================================================================
 * SHIPPING COMPATIBILITY MODAL - MODAL DE COMPATIBILIDAD DE DESPACHO
 * ============================================================================
 * 
 * Modal bloqueante que se muestra cuando hay productos incompatibles
 * con la región del usuario antes de permitir el checkout.
 */

import React from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  Box, 
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton
} from '@mui/material';
import { 
  Close as CloseIcon,
  Warning as WarningIcon,
  LocalShipping as ShippingIcon
} from '@mui/icons-material';

/**
 * Modal de compatibilidad de despacho
 * @param {Object} props - Props del componente
 * @param {boolean} props.open - Estado del modal
 * @param {Function} props.onClose - Función para cerrar el modal
 * @param {string} props.userRegion - Región del usuario
 * @param {Array} props.incompatibleProducts - Productos incompatibles
 * @param {Function} props.getUserRegionName - Función para obtener nombre de región
 * @returns {JSX.Element} Modal de compatibilidad
 */
const ShippingCompatibilityModal = ({ 
  open, 
  onClose, 
  userRegion, 
  incompatibleProducts = [], 
  getUserRegionName 
}) => {
  const userRegionName = getUserRegionName ? getUserRegionName(userRegion) : userRegion;

  return (
    <Dialog
      open={open}
      onClose={null} // No permitir cerrar con ESC o clic fuera
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
        }
      }}
    >
      <DialogTitle sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: '50%',
              bgcolor: 'error.main',
              color: 'white',
            }}
          >
            <WarningIcon sx={{ fontSize: 24 }} />
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'error.main', mb: 0.5 }}>
              ❌ Error: Algunos productos no se pueden despachar a tu región
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tu región actual: <strong>{userRegionName}</strong>
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ py: 3 }}>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Los siguientes productos no tienen despacho disponible para tu región:
        </Typography>

        <List sx={{ bgcolor: 'grey.50', borderRadius: 2, py: 1 }}>
          {incompatibleProducts.map((product, index) => (
            <React.Fragment key={product.id}>
              <ListItem sx={{ py: 1.5 }}>
                <Box sx={{ mr: 2 }}>
                  <ShippingIcon sx={{ color: 'error.main', fontSize: 20 }} />
                </Box>
                <ListItemText
                  primary={
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      {product.name}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="body2" color="text.secondary">
                      Solo disponible en: {product.availableRegions?.join(', ') || 'Regiones no especificadas'}
                    </Typography>
                  }
                />
              </ListItem>
              {index < incompatibleProducts.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>

        <Box sx={{ mt: 3, p: 2, bgcolor: 'info.50', borderRadius: 2, border: '1px solid', borderColor: 'info.200' }}>
          <Typography variant="body2" color="info.main" sx={{ fontWeight: 'medium' }}>
            💡 Para continuar con tu compra, tienes las siguientes opciones:
          </Typography>
          <Box component="ul" sx={{ mt: 1, pl: 2, m: 0 }}>
            <li>
              <Typography variant="body2" color="info.main">
                Elimina estos productos del carrito
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="info.main">
                Cambia tu dirección de envío a una región compatible
              </Typography>
            </li>
          </Box>
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 3, justifyContent: 'center' }}>
        <Button
          variant="contained"
          onClick={onClose}
          sx={{
            px: 4,
            py: 1.5,
            fontWeight: 'bold',
            textTransform: 'none',
            borderRadius: 2,
            bgcolor: 'primary.main',
            '&:hover': {
              bgcolor: 'primary.dark',
            }
          }}
        >
          Entendido
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShippingCompatibilityModal;
