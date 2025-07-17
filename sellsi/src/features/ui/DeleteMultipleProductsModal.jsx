/**
 * Modal de confirmación para eliminar múltiples productos
 * @author Panel Administrativo Sellsi
 */
import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  Chip,
  Avatar
} from '@mui/material';
import { 
  Delete as DeleteIcon, 
  Warning as WarningIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';

const DeleteMultipleProductsModal = ({ 
  open, 
  onClose, 
  products = [],
  onConfirm,
  loading = false
}) => {
  const productCount = products.length;
  
  // Estado para navegación de productos
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 4; // Mostrar 4 productos por página
  
  // Paginación de productos
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return products.slice(startIndex, endIndex);
  }, [products, currentPage]);
  
  const totalPages = Math.ceil(productCount / ITEMS_PER_PAGE);
  const hasMultiplePages = totalPages > 1;
  
  // Resetear página al abrir el modal
  React.useEffect(() => {
    if (open) {
      setCurrentPage(1);
    }
  }, [open]);

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="delete-multiple-products-dialog-title"
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { 
          minWidth: 500, 
          maxWidth: 800,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <DialogTitle id="delete-multiple-products-dialog-title" sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2, 
        textAlign: 'center',
        justifyContent: 'center',
        color: 'error.main',
        flexShrink: 0
      }}>
        <WarningIcon color="error" />
        Eliminar múltiples productos
      </DialogTitle>
      
      <DialogContent sx={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <DialogContentText sx={{ textAlign: 'center', mb: 3 }}>
          ¿Estás seguro de que deseas eliminar{' '}
          <Typography component="span" fontWeight="bold" color="error.main">
            {productCount} producto{productCount !== 1 ? 's' : ''}
          </Typography>
          {' '}del marketplace?
        </DialogContentText>

        <Box sx={{ 
          backgroundColor: '#fff3e0', 
          border: '1px solid #ffb74d', 
          borderRadius: 1, 
          p: 2, 
          mb: 3 
        }}>
          <Typography variant="body2" color="warning.dark" fontWeight="medium">
            ⚠️ Esta acción no se puede deshacer
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Los productos seleccionados serán eliminados permanentemente del marketplace,
            incluyendo sus imágenes y datos asociados.
          </Typography>
        </Box>

        {/* Lista de productos con navegación */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Productos a eliminar:
            </Typography>
            {hasMultiplePages && (
              <Chip 
                label={`${currentPage} de ${totalPages}`} 
                size="small" 
                variant="outlined"
                color="error"
              />
            )}
          </Box>
          
          <Box sx={{ position: 'relative' }}>
            {/* Flecha izquierda */}
            {hasMultiplePages && (
              <IconButton 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                size="small"
                sx={{ 
                  position: 'absolute',
                  left: -20,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 3,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  width: 36,
                  height: 36,
                  boxShadow: 1,
                  '&:hover': {
                    bgcolor: 'action.hover',
                    boxShadow: 2
                  },
                  '&:disabled': {
                    opacity: 0.3
                  }
                }}
              >
                <ArrowBackIcon fontSize="small" />
              </IconButton>
            )}

            {/* Lista de productos */}
            <List dense sx={{ 
              border: '1px solid #e0e0e0',
              borderRadius: 1,
              mb: 2,
              maxHeight: 320,
              minHeight: 240,
              overflow: 'hidden',
              mx: hasMultiplePages ? 2 : 0,
              bgcolor: 'background.paper'
            }}>
              {paginatedProducts.map((product, index) => (
                <React.Fragment key={product.product_id}>
                  <ListItem sx={{ py: 1.5, px: 2 }}>
                    <Avatar 
                      src={product.imagen} 
                      sx={{ 
                        width: 48, 
                        height: 48, 
                        mr: 2,
                        borderRadius: 1
                      }}
                      variant="rounded"
                    >
                      <InventoryIcon />
                    </Avatar>
                    <ListItemText
                      primary={product.product_name || 'N/A'}
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">
                            ID: {product.product_id?.slice(0, 8)}...
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Stock: {product.stock || 0} | Mín: {product.min_purchase || 1}
                          </Typography>
                        </Box>
                      }
                      primaryTypographyProps={{ 
                        variant: 'body2', 
                        fontWeight: 'medium',
                        noWrap: true
                      }}
                      sx={{ flex: 1 }}
                    />
                    <Box sx={{ textAlign: 'right', minWidth: 80 }}>
                      <Typography variant="body2" fontWeight="medium" color="primary">
                        ${product.price || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {product.supplier_name || 'N/A'}
                      </Typography>
                    </Box>
                  </ListItem>
                  {index < paginatedProducts.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>

            {/* Flecha derecha */}
            {hasMultiplePages && (
              <IconButton 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                size="small"
                sx={{ 
                  position: 'absolute',
                  right: -20,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 3,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  width: 36,
                  height: 36,
                  boxShadow: 1,
                  '&:hover': {
                    bgcolor: 'action.hover',
                    boxShadow: 2
                  },
                  '&:disabled': {
                    opacity: 0.3
                  }
                }}
              >
                <ArrowForwardIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
          
          {/* Información adicional si hay muchos productos */}
          {productCount > ITEMS_PER_PAGE && (
            <Box sx={{ 
              textAlign: 'center',
              p: 2,
              bgcolor: '#f5f5f5',
              borderRadius: 1
            }}>
              <Typography variant="body2" color="text.secondary">
                {productCount > ITEMS_PER_PAGE ? 
                  `Mostrando ${Math.min(ITEMS_PER_PAGE, paginatedProducts.length)} de ${productCount} productos` :
                  `${productCount} productos seleccionados`
                }
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ justifyContent: 'center', gap: 3, pb: 3, flexShrink: 0 }}>
        <Button 
          onClick={handleClose} 
          color="inherit"
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button 
          onClick={onConfirm} 
          color="error" 
          variant="contained"
          disabled={loading}
          startIcon={loading ? null : <DeleteIcon />}
        >
          {loading ? 'Eliminando...' : `Eliminar ${productCount} producto${productCount !== 1 ? 's' : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteMultipleProductsModal;
