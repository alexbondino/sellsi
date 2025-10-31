/**
 * Modal para editar nombre de producto
 * @author Panel Administrativo Sellsi
 */
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';

const EditProductNameModal = ({ 
  open, 
  onClose, 
  product,
  onConfirm,
  loading = false
}) => {
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

  // Inicializar el campo cuando se abre el modal
  useEffect(() => {
    if (open && product) {
      setNewName(product.product_name || '');
      setError('');
    }
  }, [open, product]);

  const handleSubmit = () => {
    const trimmedName = newName.trim();
    
    // Validaciones
    if (!trimmedName) {
      setError('El nombre del producto es requerido');
      return;
    }

    if (trimmedName.length < 3) {
      setError('El nombre debe tener al menos 3 caracteres');
      return;
    }

    if (trimmedName.length > 100) {
      setError('El nombre no puede exceder 100 caracteres');
      return;
    }

    if (trimmedName === product.product_name) {
      setError('El nombre no ha cambiado');
      return;
    }

    setError('');
    onConfirm(trimmedName);
  };

  const handleClose = () => {
    if (!loading) {
      setNewName('');
      setError('');
      onClose();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleSubmit();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="edit-product-name-dialog-title"
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { minWidth: 400, maxWidth: 600 }
      }}
    >
      <DialogTitle id="edit-product-name-dialog-title" sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2, 
        textAlign: 'center',
        justifyContent: 'center'
      }}>
        <EditIcon color="primary" />
        Editar nombre del producto
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Producto actual:
          </Typography>
          <Typography variant="body1" fontWeight="medium">
            {product?.product_name || 'N/A'}
          </Typography>
        </Box>

        <TextField
          fullWidth
          label="Nuevo nombre del producto"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyPress={handleKeyPress}
          error={!!error}
          helperText={error || `${newName.length}/100 caracteres`}
          disabled={loading}
          autoFocus
          sx={{ mb: 2 }}
        />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Typography variant="body2" color="text.secondary">
          El nombre del producto se actualizará inmediatamente después de confirmar.
        </Typography>
      </DialogContent>
      
      <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3 }}>
        <Button 
          onClick={handleClose} 
          color="inherit"
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          color="primary" 
          variant="contained"
          disabled={loading || !newName.trim() || newName.trim() === product?.product_name}
        >
          {loading ? 'Actualizando...' : 'Confirmar cambios'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditProductNameModal;
