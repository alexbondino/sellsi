/**
 * 🔧 Componente de Gestión de Cuentas Administrativas
 * 
 * Permite ver, crear, editar y desactivar cuentas administrativas.
 * Incluye funcionalidades de auditoría y control de acceso.
 * 
 * @author Panel Administrativo Sellsi
 * @date 16 de Julio de 2025
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Grid,
  Card,
  CardContent,
  Divider,
  Button
} from '@mui/material';
import {
  MoreVert,
  PersonAdd,
  Edit,
  Block,
  CheckCircle,
  Cancel,
  Security,
  AdminPanelSettings,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';

import { PrimaryButton } from '../../ui';
import AdminAccountCreator from './AdminAccountCreator';
import { 
  getAdminAccounts, 
  updateAdminStatus,
  deleteAdminAccount
} from '../../../services/adminPanelService';

// ✅ CONFIGURACIÓN DE ROLES
const ROLE_CONFIG = {
  admin: {
    label: 'Administrador',
    color: 'primary',
    icon: <AdminPanelSettings />,
    description: 'Acceso completo al sistema'
  }
};

const AdminAccountManager = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreator, setShowCreator] = useState(false);
  
  // Estados para el menú contextual
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  
  // Estados para diálogos
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // ========================================
  // 🔄 EFFECTS
  // ========================================

  useEffect(() => {
    loadAdmins();
  }, []);

  // ========================================
  // 🔧 HANDLERS
  // ========================================

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const result = await getAdminAccounts();
      
      if (result.success) {
        setAdmins(result.admins);
      } else {
        setError(result.error || 'Error al cargar administradores');
      }
    } catch (error) {
      console.error('Error loading admins:', error);
      setError('Error interno del servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, admin) => {
    setAnchorEl(event.currentTarget);
    setSelectedAdmin(admin);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAdmin(null);
  };

  const handleToggleStatus = async (admin) => {
    try {
      const result = await updateAdminStatus(admin.id, !admin.is_active);
      
      if (result.success) {
        await loadAdmins();
        setError('');
      } else {
        setError(result.error || 'Error al actualizar estado');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      setError('Error interno del servidor');
    }
    handleMenuClose();
  };

  const handleViewDetails = () => {
    setShowDetailsDialog(true);
    handleMenuClose();
  };

  const handleDeleteAdmin = async () => {
    try {
      const result = await deleteAdminAccount(selectedAdmin.id);
      
      if (result.success) {
        await loadAdmins();
        setError('');
        setShowDeleteDialog(false);
      } else {
        setError(result.error || 'Error al eliminar administrador');
      }
    } catch (error) {
      console.error('Error deleting admin:', error);
      setError('Error interno del servidor');
    }
    handleMenuClose();
  };

  const handleCreateSuccess = () => {
    loadAdmins();
    setShowCreator(false);
  };

  // ========================================
  // 🎨 RENDER HELPERS
  // ========================================

  const renderRoleChip = (role) => {
    const config = ROLE_CONFIG[role] || ROLE_CONFIG.admin;
    return (
      <Chip
        icon={config.icon}
        label={config.label}
        color={config.color}
        size="small"
        variant="outlined"
      />
    );
  };

  const renderStatusChip = (isActive) => (
    <Chip
      icon={isActive ? <CheckCircle /> : <Cancel />}
      label={isActive ? 'Activo' : 'Inactivo'}
      color={isActive ? 'success' : 'error'}
      size="small"
    />
  );

  const renderDetailsDialog = () => (
    <Dialog
      open={showDetailsDialog}
      onClose={() => setShowDetailsDialog(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AdminPanelSettings />
          <Typography variant="h6">
            Detalles del Administrador
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {selectedAdmin && (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Información Personal
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Typography variant="body2" gutterBottom>
                    <strong>Usuario:</strong> {selectedAdmin.usuario}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Email:</strong> {selectedAdmin.email}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Nombre:</strong> {selectedAdmin.full_name}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Rol:</strong> {renderRoleChip(selectedAdmin.role)}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Estado:</strong> {renderStatusChip(selectedAdmin.is_active)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Seguridad y Acceso
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Typography variant="body2" gutterBottom>
                    <strong>2FA:</strong> {selectedAdmin.twofa_enabled ? 'Habilitado' : 'Deshabilitado'}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Creado:</strong> {new Date(selectedAdmin.created_at).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Último login:</strong> {
                      selectedAdmin.last_login 
                        ? new Date(selectedAdmin.last_login).toLocaleString()
                        : 'Nunca'
                    }
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={() => setShowDetailsDialog(false)} variant="outlined">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderDeleteDialog = () => (
    <Dialog
      open={showDeleteDialog}
      onClose={() => setShowDeleteDialog(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Block color="error" />
          <Typography variant="h6">
            Eliminar Administrador
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Esta acción no se puede deshacer.
        </Alert>
        
        <Typography>
          ¿Estás seguro de que deseas eliminar la cuenta del administrador{' '}
          <strong>{selectedAdmin?.usuario}</strong>?
        </Typography>
        
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          Se perderán todos los datos asociados con esta cuenta.
        </Typography>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={() => setShowDeleteDialog(false)} variant="outlined">
          Cancelar
        </Button>
        <PrimaryButton
          onClick={handleDeleteAdmin}
          color="error"
          startIcon={<Block />}
        >
          Eliminar
        </PrimaryButton>
      </DialogActions>
    </Dialog>
  );

  // ========================================
  // 🎨 MAIN RENDER
  // ========================================

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Cargando administradores...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          <AdminPanelSettings sx={{ mr: 1, verticalAlign: 'middle' }} />
          Gestión de Administradores
        </Typography>
        
        <PrimaryButton
          onClick={() => setShowCreator(true)}
          startIcon={<PersonAdd />}
        >
          Crear Administrador
        </PrimaryButton>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Admins Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Usuario</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>2FA</TableCell>
              <TableCell>Último Login</TableCell>
              <TableCell width={80}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {admins.map((admin) => (
              <TableRow key={admin.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {admin.usuario}
                  </Typography>
                </TableCell>
                <TableCell>{admin.email}</TableCell>
                <TableCell>{admin.full_name}</TableCell>
                <TableCell>{renderRoleChip(admin.role)}</TableCell>
                <TableCell>{renderStatusChip(admin.is_active)}</TableCell>
                <TableCell>
                  {admin.twofa_enabled ? (
                    <Security color="success" />
                  ) : (
                    <Security color="disabled" />
                  )}
                </TableCell>
                <TableCell>
                  {admin.last_login 
                    ? new Date(admin.last_login).toLocaleDateString()
                    : 'Nunca'
                  }
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={(e) => handleMenuOpen(e, admin)}
                    size="small"
                  >
                    <MoreVert />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewDetails}>
          <Visibility sx={{ mr: 1 }} />
          Ver Detalles
        </MenuItem>
        <MenuItem onClick={() => handleToggleStatus(selectedAdmin)}>
          {selectedAdmin?.is_active ? (
            <>
              <Block sx={{ mr: 1 }} />
              Desactivar
            </>
          ) : (
            <>
              <CheckCircle sx={{ mr: 1 }} />
              Activar
            </>
          )}
        </MenuItem>
        <MenuItem 
          onClick={() => setShowDeleteDialog(true)}
          sx={{ color: 'error.main' }}
        >
          <Cancel sx={{ mr: 1 }} />
          Eliminar
        </MenuItem>
      </Menu>

      {/* Dialogs */}
      {renderDetailsDialog()}
      {renderDeleteDialog()}
      
      {/* Admin Creator */}
      <AdminAccountCreator
        open={showCreator}
        onClose={() => setShowCreator(false)}
        onSuccess={handleCreateSuccess}
      />
    </Box>
  );
};

export default AdminAccountManager;
