/**
 * 👥 Tabla de Gestión de Usuarios
 * 
 * Componente que permite a los administradores gestionar usuarios:
 * - Ver información de usuarios (nombre, ID, productos activos)
 * - Banear/desbanear cuentas con confirmación
 * - Filtrar y buscar usuarios
 * - Ver estadísticas de usuarios
 * 
 * @author Panel Administrativo Sellsi
 * @date 10 de Julio de 2025
 */

import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Alert,
  Fab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Avatar,
  Switch
} from '@mui/material';
import {
  Block as BlockIcon,
  CheckCircle as UnblockIcon,
  Visibility as ViewIcon,
  Person as PersonIcon,
  Store as StoreIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';

// Importar componentes UI existentes
import { Modal } from '../../ui';
import AdminStatCard from './AdminStatCard';
import { getUsers, getUserStats, banUser, unbanUser } from '../../../services/adminPanelService';

// Importar modal de confirmación
import UserBanModal from '../modals/UserBanModal';

// ✅ CONSTANTS
const USER_STATUS = {
  active: { color: 'success', icon: '✅', label: 'Activa' },
  banned: { color: 'error', icon: '🚫', label: 'Baneada' },
  inactive: { color: 'warning', icon: '⏸️', label: 'Inactiva' }
};

const USER_FILTERS = [
  { value: 'all', label: 'Todos los usuarios' },
  { value: 'active', label: 'Usuarios activos' },
  { value: 'banned', label: 'Usuarios baneados' },
  { value: 'inactive', label: 'Usuarios inactivos' },
  { value: 'suppliers', label: 'Solo proveedores' },
  { value: 'buyers', label: 'Solo compradores' }
];

// ✅ COMMON STYLES
const commonStyles = {
  container: {
    p: 3,
    overflowX: 'hidden' // Previene scroll horizontal
  },
  headerSection: {
    mb: 4
  },
  filtersSection: {
    mb: 3,
    p: 2,
    borderRadius: 2,
    backgroundColor: '#f8f9fa',
    overflowX: 'hidden' // Previene scroll horizontal en filtros
  },
  tableContainer: {
    mb: 3
  },
  tableHeader: {
    backgroundColor: '#1976d2',
    color: 'white',
    fontWeight: 'bold'
  },
  tableRow: {
    '&:hover': {
      backgroundColor: '#f5f5f5'
    }
  },
  actionButton: {
    m: 0.5,
    minWidth: 'auto'
  },
  statusChip: {
    fontWeight: 'bold',
    minWidth: 100
  },
  refreshFab: {
    position: 'fixed',
    bottom: 16,
    right: 16
  },
  userAvatar: {
    width: 40,
    height: 40
  }
};

// ✅ USER MANAGEMENT TABLE COMPONENT
const UserManagementTable = memo(() => {
  // ========================================
  // 🔧 ESTADO
  // ========================================
  
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // Filtros
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    userType: 'all'
  });

  // Estado para búsqueda con debounce
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce para el campo de búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 150); // Reducido a 150ms para mejor responsividad

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Actualizar el filtro cuando cambie el término de búsqueda con debounce
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      search: debouncedSearchTerm
    }));
  }, [debouncedSearchTerm]);

  // Estado de selección múltiple
  const [selectedUsers, setSelectedUsers] = useState(new Set());

  // Modal
  const [banModal, setBanModal] = useState({
    open: false,
    user: null,
    action: 'ban' // 'ban' | 'unban'
  });

  // ========================================
  // 🔧 EFECTOS
  // ========================================

  // Cargar datos solo una vez al iniciar
  useEffect(() => {
    loadData();
  }, []);

  // ========================================
  // 🔧 MEMOIZED VALUES - FILTRADO LOCAL
  // ========================================

  // Filtrado en memoria - no hace consultas a la API
  const filteredUsers = useMemo(() => {
    if (!users.length) return [];

    return users.filter(user => {
      // Filtro por estado
      if (filters.status !== 'all') {
        const userStatus = getUserStatus(user);
        if (userStatus !== filters.status) return false;
      }

      // Filtro por tipo de usuario
      if (filters.userType === 'suppliers' && !user.main_supplier) return false;
      if (filters.userType === 'buyers' && user.main_supplier) return false;

      // Filtro por búsqueda - busca en nombre, email e ID
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        return (
          user.user_nm?.toLowerCase().includes(searchTerm) ||
          user.email?.toLowerCase().includes(searchTerm) ||
          user.user_id?.toLowerCase().includes(searchTerm)
        );
      }

      return true;
    });
  }, [users, filters]);

  // ========================================
  // 🔧 HELPER FUNCTIONS
  // ========================================

  const getUserStatus = (user) => {
    // TODO: Implementar lógica de ban cuando se agregue el campo a la BD
    // Por ahora simulamos con el campo is_active o createddt
    if (user.banned) return 'banned';
    if (user.is_active === false) return 'inactive';
    return 'active';
  };

  const getUserActiveProducts = (user) => {
    // Retorna el conteo de productos activos del usuario
    return user.active_products_count || 0;
  };

  // ========================================
  // 🔧 HANDLERS
  // ========================================

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      // Cargar todos los usuarios sin filtros (filtrado local)
      const [usersResult, statsResult] = await Promise.all([
        getUsers({}), // Sin filtros - cargar todos
        getUserStats()
      ]);

      if (usersResult.success) {
        setUsers(usersResult.data || []);
        setInitialLoadComplete(true);
      } else {
        setError(usersResult.error || 'Error cargando usuarios');
      }

      if (statsResult.success) {
        setStats(statsResult.stats || {});
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      setError('Error interno del servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = useCallback((field, value) => {
    if (field === 'search') {
      setSearchTerm(value);
    } else {
      setFilters(prev => ({
        ...prev,
        [field]: value
      }));
    }
  }, []);

  const handleUserSelect = useCallback((userId, isSelected) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(userId);
      } else {
        newSet.delete(userId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback((isSelected) => {
    if (isSelected) {
      setSelectedUsers(new Set(filteredUsers.map(user => user.user_id)));
    } else {
      setSelectedUsers(new Set());
    }
  }, [filteredUsers]);

  const openBanModal = useCallback((user, action) => {
    setBanModal({
      open: true,
      user,
      action
    });
  }, []);

  const closeBanModal = useCallback(() => {
    setBanModal({
      open: false,
      user: null,
      action: 'ban'
    });
  }, []);

  const handleBanConfirm = useCallback(async (reason) => {
    const { user, action } = banModal;
    try {
      const result = action === 'ban' 
        ? await banUser(user.user_id, reason)
        : await unbanUser(user.user_id, reason);

      if (result.success) {
        await loadData();
        closeBanModal();
        // TODO: Mostrar notificación de éxito
      } else {
        setError(result.error || `Error al ${action === 'ban' ? 'banear' : 'desbanear'} usuario`);
      }
    } catch (error) {
      console.error(`Error en ${action}:`, error);
      setError('Error interno del servidor');
    }
  }, [banModal, closeBanModal]);

  // ========================================
  // 🎨 RENDER COMPONENTS
  // ========================================

  const MemoAdminStatCard = useMemo(() => memo(AdminStatCard), []);
  const renderStatsCards = useCallback(() => (
    <Grid container spacing={3} sx={commonStyles.headerSection}>
      <Grid item xs={12} sm={6} md={3}>
        <MemoAdminStatCard
          title="Total Usuarios"
          value={stats.totalUsers || 0}
          icon={PersonIcon}
          color="primary"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MemoAdminStatCard
          title="Usuarios Activos"
          value={stats.activeUsers || 0}
          icon={PersonIcon}
          color="success"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MemoAdminStatCard
          title="Usuarios Baneados"
          value={stats.bannedUsers || 0}
          icon={BlockIcon}
          color="error"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MemoAdminStatCard
          title="Proveedores"
          value={stats.suppliers || 0}
          icon={StoreIcon}
          color="info"
        />
      </Grid>
    </Grid>
  ), [stats]);

  const menuPropsEstado = useMemo(() => ({
    disableScrollLock: true,
    PaperProps: {
      style: {
        maxHeight: 300,
        minWidth: 200
      }
    },
    anchorOrigin: {
      vertical: 'bottom',
      horizontal: 'left'
    },
    transformOrigin: {
      vertical: 'top',
      horizontal: 'left'
    }
  }), []);
  const menuPropsTipo = menuPropsEstado;
  const sxEstado = useMemo(() => ({ '& .MuiSelect-select': { minHeight: 'auto' }, maxWidth: '100%' }), []);
  const sxTipo = useMemo(() => ({ minWidth: 200, maxWidth: 260, width: '260px', '& .MuiSelect-select': { minHeight: 'auto' } }), []);

  const renderFilters = useCallback(() => (
    <Paper sx={commonStyles.filtersSection}>
      <Grid container spacing={3} alignItems="center">
        <Grid item xs={12} sm={6} md={3}>
          <FormControl 
            fullWidth 
            size="medium" 
            sx={sxEstado}
          >
            <InputLabel>Estado</InputLabel>
            <Select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              label="Estado"
              MenuProps={menuPropsEstado}
            >
              {USER_FILTERS.map(filter => (
                <MenuItem key={filter.value} value={filter.value}>
                  {filter.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl 
            fullWidth 
            size="medium" 
            sx={sxTipo}
          >
            <InputLabel>Tipo de Usuario</InputLabel>
            <Select
              value={filters.userType}
              onChange={(e) => handleFilterChange('userType', e.target.value)}
              label="Tipo de Usuario"
              MenuProps={menuPropsTipo}
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="suppliers">Solo Proveedores</MenuItem>
              <MenuItem value="buyers">Solo Compradores</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              fullWidth
              size="medium"
              placeholder="Buscar por nombre, email o ID..."
              value={searchTerm}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              sx={{ minWidth: 320, maxWidth: 600, width: '100%' }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap', minWidth: 120 }}>
              {
                !initialLoadComplete 
                  ? "Cargando..." 
                  : searchTerm && debouncedSearchTerm !== searchTerm 
                    ? "Filtrando..." 
                    : `Mostrando ${filteredUsers.length} de ${users.length}`
              }
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  ), [filters, handleFilterChange, searchTerm, debouncedSearchTerm, initialLoadComplete, filteredUsers.length, users.length, menuPropsEstado, menuPropsTipo, sxEstado, sxTipo]);

  const renderUsersTable = () => (
    <TableContainer component={Paper} sx={commonStyles.tableContainer}>
      <Table>
        <TableHead>
          <TableRow sx={commonStyles.tableHeader}>
            <TableCell padding="checkbox">
              <Checkbox
                indeterminate={selectedUsers.size > 0 && selectedUsers.size < filteredUsers.length}
                checked={filteredUsers.length > 0 && selectedUsers.size === filteredUsers.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
                sx={{ color: 'white' }}
              />
            </TableCell>
            <TableCell sx={{ color: 'white' }}>Usuario</TableCell>
            <TableCell sx={{ color: 'white' }}>ID</TableCell>
            <TableCell sx={{ color: 'white' }}>Email</TableCell>
            <TableCell sx={{ color: 'white' }}>Productos Activos</TableCell>
            <TableCell sx={{ color: 'white' }}>Estado</TableCell>
            <TableCell sx={{ color: 'white' }}>Tipo</TableCell>
            <TableCell align="center" sx={{ color: 'white' }}>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredUsers.map((user) => {
            const userStatus = getUserStatus(user);
            const isSelected = selectedUsers.has(user.user_id);
            const activeProducts = getUserActiveProducts(user);

            return (
              <TableRow 
                key={user.user_id} 
                sx={commonStyles.tableRow}
                selected={isSelected}
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={isSelected}
                    onChange={(e) => handleUserSelect(user.user_id, e.target.checked)}
                  />
                </TableCell>

                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar 
                      src={user.logo_url} 
                      sx={commonStyles.userAvatar}
                    >
                      {user.user_nm?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <Typography variant="body2" fontWeight="medium">
                      {user.user_nm || 'N/A'}
                    </Typography>
                  </Box>
                </TableCell>

                <TableCell>
                  <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                    {user.user_id?.slice(0, 8)}...
                  </Typography>
                </TableCell>

                <TableCell>
                  <Typography variant="body2">
                    {user.email}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Chip
                    label={activeProducts}
                    size="small"
                    color={activeProducts > 0 ? 'success' : 'default'}
                    variant="outlined"
                  />
                </TableCell>

                <TableCell>
                  <Chip
                    label={USER_STATUS[userStatus].label}
                    size="small"
                    color={USER_STATUS[userStatus].color}
                    sx={commonStyles.statusChip}
                  />
                </TableCell>

                <TableCell>
                  <Chip
                    label={user.main_supplier ? 'Proveedor' : 'Comprador'}
                    size="small"
                    color={user.main_supplier ? 'primary' : 'secondary'}
                    variant="outlined"
                  />
                </TableCell>

                <TableCell align="center">
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                    <Tooltip title="Ver detalles">
                      <IconButton size="small" sx={commonStyles.actionButton}>
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    {userStatus === 'active' ? (
                      <Tooltip title="Banear usuario">
                        <IconButton 
                          size="small" 
                          sx={commonStyles.actionButton}
                          color="error"
                          onClick={() => openBanModal(user, 'ban')}
                        >
                          <BlockIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : userStatus === 'banned' ? (
                      <Tooltip title="Desbanear usuario">
                        <IconButton 
                          size="small" 
                          sx={commonStyles.actionButton}
                          color="success"
                          onClick={() => openBanModal(user, 'unban')}
                        >
                          <UnblockIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : null}
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {filteredUsers.length === 0 && !loading && (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No se encontraron usuarios
          </Typography>
        </Box>
      )}
    </TableContainer>
  );

  // ========================================
  // 🎨 RENDER PRINCIPAL
  // ========================================

  if (loading) {
    return (
      <Box sx={commonStyles.container}>
        <Typography>Cargando usuarios...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={commonStyles.container}>
      {/* Header con estadísticas */}
      {renderStatsCards()}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Filtros */}
      {renderFilters()}

      {/* Tabla de usuarios */}
      {renderUsersTable()}

      {/* Botón de refrescar con hover y tooltip */}
      <Tooltip title="Refrescar página" arrow>
        <Fab
          color="primary"
          sx={{
            ...commonStyles.refreshFab,
            transition: 'box-shadow 0.2s, background 0.2s',
            boxShadow: 3,
            '&:hover': {
              background: '#1976d2',
              boxShadow: 8,
            },
          }}
          onClick={loadData}
          disabled={loading}
        >
          <RefreshIcon />
        </Fab>
      </Tooltip>

      {/* Modal de confirmación de ban */}
      <UserBanModal
        open={banModal.open}
        user={banModal.user}
        action={banModal.action}
        onConfirm={handleBanConfirm}
        onClose={closeBanModal}
      />
    </Box>
  );
});

UserManagementTable.displayName = 'UserManagementTable';

export default UserManagementTable;
