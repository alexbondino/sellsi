/**
 * 🗑️ Modal de Confirmación de Eliminación Múltiple de Usuarios
 * 
 * Modal para confirmar la eliminación de múltiples usuarios seleccionados.
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
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Warning as WarningIcon,
  Person as PersonIcon,
  Store as StoreIcon
} from '@mui/icons-material';

// Contraseña maestra
const MASTER_PASSWORD = 'icecrowncitadel';

const UserDeleteMultipleModal = ({ open, users, onConfirm, onClose }) => {
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
      const userIds = users.map(user => user.user_id);
      await onConfirm(userIds);
      handleClose();
    } catch (error) {
      setError('Error al eliminar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const formatUserId = (userId) => {
    return userId ? `${userId.slice(0, 8)}...` : 'N/A';
  };

  if (!users || users.length === 0) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="delete-multiple-users-dialog-title"
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minWidth: 500, maxWidth: 800 }
      }}
    >
      <DialogTitle 
        id="delete-multiple-users-dialog-title" 
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
        Eliminar {users.length} Usuario{users.length !== 1 ? 's' : ''}
      </DialogTitle>

      <DialogContent>
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
            Esta acción eliminará permanentemente {users.length} usuario{users.length !== 1 ? 's' : ''} del sistema.
            Todos sus datos, productos y transacciones se perderán.
          </Typography>
        </Alert>

        {/* Lista de usuarios a eliminar */}
        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 2 }}>
          Usuarios que serán eliminados:
        </Typography>
        
        <Box sx={{ 
          maxHeight: 200, 
          overflow: 'auto', 
          border: '1px solid #e0e0e0', 
          borderRadius: 1,
          mb: 3
        }}>
          <List dense>
            {users.map((user, index) => (
              <React.Fragment key={user.user_id}>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar 
                      src={user.logo_url} 
                      sx={{ width: 40, height: 40 }}
                    >
                      {user.user_nm?.charAt(0)?.toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={user.user_nm || 'Usuario sin nombre'}
                    secondary={
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
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
                    }
                  />
                </ListItem>
                {index < users.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        </Box>

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
          Esta acción no se puede deshacer. Confirma que deseas eliminar estos usuarios.
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
          {loading ? 'Eliminando...' : `Eliminar ${users.length} Usuario${users.length !== 1 ? 's' : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserDeleteMultipleModal;
