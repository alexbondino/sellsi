/**
 * 🗑️ Modal de Confirmación de Eliminación de Usuario
 * 
 * Modal para confirmar la eliminación de un usuario individual.
 * Requiere contraseña maestra para confirmar la acción.
 * 
 * @author Panel Administrativo Sellsi
 * @date 16 de Julio de 2025
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  Box,
  Avatar,
  Chip,
  Alert,
  Grid
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Warning as WarningIcon,
  Person as PersonIcon,
  Store as StoreIcon
} from '@mui/icons-material';

// Contraseña maestra
const MASTER_PASSWORD = 'icecrowncitadel';

const UserDeleteModal = ({ open, user, onConfirm, onClose }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setPassword('');
    setError('');
    onClose();
  };

  const handleConfirm = async () => {
    if (!password) {
      setError('La contraseña maestra es requerida');
      return;
    }

    if (password !== MASTER_PASSWORD) {
      setError('Contraseña maestra incorrecta');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onConfirm(user.user_id);
      handleClose();
    } catch (error) {
      setError('Error al eliminar usuario');
    } finally {
      setLoading(false);
    }
  };

  const formatUserId = (userId) => {
    return userId ? `${userId.slice(0, 8)}...` : 'N/A';
  };

  if (!user) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="delete-user-dialog-title"
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { minWidth: 400, maxWidth: 600 }
      }}
    >
      <DialogTitle 
        id="delete-user-dialog-title" 
        sx={{ 
          textAlign: 'center',
          pb: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1
        }}
      >
        <DeleteIcon color="error" />
        Eliminar Usuario
      </DialogTitle>

      <DialogContent>
        {/* Información del usuario */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Avatar 
                src={user.logo_url} 
                sx={{ width: 60, height: 60 }}
              >
                {user.user_nm?.charAt(0)?.toUpperCase()}
              </Avatar>
            </Grid>
            <Grid item xs>
              <Typography variant="h6" gutterBottom>
                {user.user_nm || 'Usuario sin nombre'}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {user.email}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Chip
                  size="small"
                  label={`ID: ${formatUserId(user.user_id)}`}
                  variant="outlined"
                />
                <Chip
                  size="small"
                  label={user.main_supplier ? 'Proveedor' : 'Comprador'}
                  color={user.main_supplier ? 'primary' : 'secondary'}
                  variant="outlined"
                />
                <Chip
                  size="small"
                  label={user.verified ? 'Verificado' : 'No Verificado'}
                  color={user.verified ? 'success' : 'default'}
                  variant="outlined"
                />
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Advertencia */}
        <Alert 
          severity="error" 
          icon={<WarningIcon />}
          sx={{ mb: 3 }}
        >
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            ⚠️ ACCIÓN IRREVERSIBLE
          </Typography>
          <Typography variant="body2">
            Esta acción eliminará permanentemente al usuario <strong>{user.user_nm}</strong> del sistema.
            Todos sus datos, productos y transacciones se perderán.
          </Typography>
        </Alert>

        {/* Campo de contraseña maestra */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
            CONTRASEÑA MAESTRA:
          </Typography>
          <TextField
            fullWidth
            type="text"
            autoComplete="off"
            inputProps={{ style: { WebkitTextSecurity: 'disc', MozTextSecurity: 'disc', textSecurity: 'disc' } }}
            placeholder="Ingresa la contraseña maestra"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            error={!!error}
            helperText={error}
            disabled={loading}
          />
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          Esta acción no se puede deshacer. Confirma que deseas eliminar este usuario.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3 }}>
        <Button 
          onClick={handleClose} 
          color="inherit" 
          disabled={loading}
          variant="outlined"
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleConfirm} 
          color="error" 
          variant="contained"
          disabled={loading || !password}
          startIcon={loading ? null : <DeleteIcon />}
        >
          {loading ? 'Eliminando...' : 'Eliminar Usuario'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserDeleteModal;
