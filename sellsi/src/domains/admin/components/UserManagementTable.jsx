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
  Switch,
  Button
} from '@mui/material';
import {
  Block as BlockIcon,
  CheckCircle as UnblockIcon,
  Visibility as ViewIcon,
  Person as PersonIcon,
  Store as StoreIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Info as InfoIcon,
  VerifiedUser as VerifiedIcon,
  Cancel as UnverifiedIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

// Importar componentes UI existentes
import { Modal } from '../../../shared/components/feedback';
import AdminStatCard from './AdminStatCard';
// 🔍 Reemplazo de import desde barrel '../../../domains/admin' para reducir ciclos
import { getUsers, getUserStats, banUser, unbanUser, verifyUser, unverifyUser, deleteUser, deleteMultipleUsers } from '../services/adminUserService';

// Importar modales
import UserBanModal from '../modals/UserBanModal';
import UserDetailsModal from '../modals/UserDetailsModal';
import UserVerificationModal from '../modals/UserVerificationModal';
import UserDeleteModal from '../modals/UserDeleteModal';
import UserDeleteMultipleModal from '../modals/UserDeleteMultipleModal';

// ✅ CONSTANTS
const USER_STATUS = {
  active: { color: 'success', icon: '✅', label: 'Activo' },
  banned: { color: 'error', icon: '🚫', label: 'Baneado' },
  inactive: { color: 'warning', icon: '⏸️', label: 'Inactivo' }
};

const USER_FILTERS = [
  { value: 'all', label: 'Todos los usuarios' },
  { value: 'active', label: 'Usuarios activos' },
  { value: 'banned', label: 'Usuarios baneados' },
  { value: 'inactive', label: 'Usuarios inactivos' },
  { value: 'suppliers', label: 'Solo proveedores' },
  { value: 'buyers', label: 'Solo compradores' },
  { value: 'verified', label: 'Solo verificados' }
];

// ✅ UTILITY FUNCTIONS
const getCurrentAdminId = () => {
  try {
    const adminUser = localStorage.getItem('adminUser');
    if (adminUser) {
      const user = JSON.parse(adminUser);
      return user.id;
    }
    return null;
  } catch (error) {
    console.error('Error getting admin ID:', error);
    return null;
  }
};

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

  // Modales
  const [banModal, setBanModal] = useState({
    open: false,
    user: null,
    action: 'ban' // 'ban' | 'unban'
  });

  const [detailsModal, setDetailsModal] = useState({
    open: false,
    user: null
  });

  const [verificationModal, setVerificationModal] = useState({
    open: false,
    user: null,
    action: 'verify' // 'verify' | 'unverify'
  });

  const [deleteModal, setDeleteModal] = useState({
    open: false,
    user: null
  });

  const [deleteMultipleModal, setDeleteMultipleModal] = useState({
    open: false,
    users: []
  });

  // Estado para evitar foco no deseado en el campo de búsqueda
  const [preventSearchFocus, setPreventSearchFocus] = useState(false);

  // ========================================
  // 🔧 EFECTOS
  // ========================================

  // Cargar datos solo una vez al iniciar
  useEffect(() => {
    loadData();
  }, []);

  // ========================================
  // 🔧 HELPER FUNCTIONS
  // ========================================

  const getUserStatus = (user) => {
    // Verificar si el usuario está baneado
    if (user.banned === true) return 'banned';
    // Verificar si el usuario está inactivo
    if (user.is_active === false) return 'inactive';
    // Por defecto, usuario activo
    return 'active';
  };

  const getUserActiveProducts = (user) => {
    // Retorna el conteo de productos activos del usuario
    return user.active_products_count || 0;
  };

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
        if (filters.status === 'suppliers' && !user.main_supplier) return false;
        if (filters.status === 'buyers' && user.main_supplier) return false;
        if (filters.status === 'verified' && !user.verified) return false;
        if (filters.status !== 'suppliers' && filters.status !== 'buyers' && filters.status !== 'verified' && userStatus !== filters.status) return false;
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

  const openDetailsModal = useCallback((user) => {
    setDetailsModal({
      open: true,
      user
    });
  }, []);

  const closeDetailsModal = useCallback(() => {
    setDetailsModal({
      open: false,
      user: null
    });
  }, []);

  const openVerificationModal = useCallback((user, action) => {
    setVerificationModal({
      open: true,
      user,
      action
    });
  }, []);

  const closeVerificationModal = useCallback(() => {
    setVerificationModal({
      open: false,
      user: null,
      action: 'verify'
    });
  }, []);

  const openDeleteModal = useCallback((user) => {
    setPreventSearchFocus(true);
    setDeleteModal({
      open: true,
      user
    });
  }, []);

  const closeDeleteModal = useCallback(() => {
    setDeleteModal({
      open: false,
      user: null
    });
    setTimeout(() => setPreventSearchFocus(false), 100);
  }, []);

  const openDeleteMultipleModal = useCallback(() => {
    setPreventSearchFocus(true);
    const selectedUsersArray = filteredUsers.filter(user => 
      selectedUsers.has(user.user_id)
    );
    setDeleteMultipleModal({
      open: true,
      users: selectedUsersArray
    });
  }, [filteredUsers, selectedUsers]);

  const closeDeleteMultipleModal = useCallback(() => {
    setDeleteMultipleModal({
      open: false,
      users: []
    });
    setTimeout(() => setPreventSearchFocus(false), 100);
  }, []);

  const handleBanConfirm = useCallback(async (reason) => {
    const { user, action } = banModal;
    try {
      const adminId = getCurrentAdminId();
      if (!adminId) {
        setError('No hay sesión administrativa activa');
        return;
      }

      const result = action === 'ban' 
        ? await banUser(user.user_id, reason, adminId)
        : await unbanUser(user.user_id, reason, adminId);

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

  const handleVerificationConfirm = useCallback(async (reason) => {
    const { user, action } = verificationModal;
    try {
      const adminId = getCurrentAdminId();
      if (!adminId) {
        setError('No hay sesión administrativa activa');
        return;
      }

      const result = action === 'verify' 
        ? await verifyUser(user.user_id, reason, adminId)
        : await unverifyUser(user.user_id, reason, adminId);

      if (result.success) {
        await loadData();
        closeVerificationModal();
        // TODO: Mostrar notificación de éxito
      } else {
        setError(result.error || `Error al ${action === 'verify' ? 'verificar' : 'desverificar'} usuario`);
      }
    } catch (error) {
      console.error(`Error en ${action}:`, error);
      setError('Error interno del servidor');
    }
  }, [verificationModal, closeVerificationModal]);

  const handleDeleteConfirm = useCallback(async (userId) => {
    try {
      const adminId = getCurrentAdminId();
      if (!adminId) {
        setError('No hay sesión administrativa activa');
        return;
      }

      const result = await deleteUser(userId, adminId);
      if (result.success) {
        await loadData();
        closeDeleteModal();
        // TODO: Mostrar notificación de éxito
      } else {
        setError(result.error || 'Error al eliminar usuario');
      }
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      setError('Error interno del servidor');
    }
  }, []);

  const handleDeleteMultipleConfirm = useCallback(async (userIds) => {
    try {
      const adminId = getCurrentAdminId();
      if (!adminId) {
        setError('No hay sesión administrativa activa');
        return;
      }

      const result = await deleteMultipleUsers(userIds, adminId);
      if (result.success) {
        await loadData();
        setSelectedUsers(new Set()); // Limpiar selección
        closeDeleteMultipleModal();
        
        if (result.errors.length > 0) {
          setError(`Se eliminaron ${result.deleted} de ${userIds.length} usuarios. Algunos usuarios tuvieron errores.`);
        } else {
          // TODO: Mostrar notificación de éxito
        }
      } else {
        setError(result.error || 'Error al eliminar usuarios');
      }
    } catch (error) {
      console.error('Error eliminando usuarios:', error);
      setError('Error interno del servidor');
    }
  }, []);

  // ========================================
  // 🎨 RENDER COMPONENTS
  // ========================================

  const MemoAdminStatCard = useMemo(() => memo(AdminStatCard), []);
  const renderStatsCards = useCallback(() => (
    <Grid container spacing={3} sx={commonStyles.headerSection}>
      <Grid item xs={12} sm={6} md={2.4}>
        <MemoAdminStatCard
          title="Total Usuarios"
          value={stats.totalUsers || 0}
          icon={PersonIcon}
          color="primary"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={2.4}>
        <MemoAdminStatCard
          title="Usuarios Activos"
          value={stats.activeUsers || 0}
          icon={PersonIcon}
          color="success"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={2.4}>
        <MemoAdminStatCard
          title="Usuarios Verificados"
          value={stats.verifiedUsers || 0}
          icon={VerifiedIcon}
          color="info"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={2.4}>
        <MemoAdminStatCard
          title="Usuarios Baneados"
          value={stats.bannedUsers || 0}
          icon={BlockIcon}
          color="error"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={2.4}>
        <MemoAdminStatCard
          title="Proveedores"
          value={stats.suppliers || 0}
          icon={StoreIcon}
          color="warning"
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
              autoComplete="off"
              onFocus={(e) => {
                // Prevenir foco no deseado cuando se abren modales
                if (preventSearchFocus) {
                  e.target.blur();
                }
              }}
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
        
        {/* Botón para eliminar usuarios seleccionados */}
        {selectedUsers.size > 0 && (
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
              <Button
                variant="contained"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={openDeleteMultipleModal}
              >
                Eliminar {selectedUsers.size} usuario{selectedUsers.size !== 1 ? 's' : ''} seleccionado{selectedUsers.size !== 1 ? 's' : ''}
              </Button>
            </Box>
          </Grid>
        )}
      </Grid>
    </Paper>
  ), [filters, handleFilterChange, searchTerm, debouncedSearchTerm, initialLoadComplete, filteredUsers.length, users.length, selectedUsers.size, openDeleteMultipleModal, preventSearchFocus, menuPropsEstado, menuPropsTipo, sxEstado, sxTipo]);

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
            <TableCell sx={{ color: 'white' }}>Última IP</TableCell>
            <TableCell sx={{ color: 'white' }}>Productos Activos</TableCell>
            <TableCell sx={{ color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip 
                title="Estado del usuario en el sistema. Activo: puede usar normalmente la plataforma. Baneado: no puede acceder ni realizar acciones en la plataforma."
                arrow
                placement="top"
              >
                <IconButton size="small" sx={{ color: 'white', p: 0 }}>
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              Estado
            </TableCell>
            <TableCell sx={{ color: 'white' }}>Tipo</TableCell>
            <TableCell sx={{ color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip 
                title="Si el proveedor ha sido verificado por el equipo Sellsi como proveedor de confianza"
                arrow
                placement="top"
              >
                <IconButton size="small" sx={{ color: 'white', p: 0 }}>
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              ¿Verificado?
            </TableCell>
            <TableCell align="center" sx={{ color: 'white' }}>
              <Tooltip 
                title={<Box sx={{ p: 1, maxWidth: 260 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Acciones disponibles:</Typography>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.95em' }}>
                    <li><strong>Ver detalles:</strong> Muestra información completa del usuario.</li>
                    <li><strong>Verificar/Desverificar:</strong> Cambia el estado de verificación del usuario.</li>
                    <li><strong>Banear/Desbanear:</strong> Restringe o habilita el acceso del usuario.</li>
                    <li><strong>Eliminar usuario:</strong> Quita el usuario del sistema. Irreversible.</li>
                  </ul>
                </Box>}
                arrow
                placement="top"
              >
                <IconButton size="small" sx={{ color: 'white', p: 0, mr: 1  }}>
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              Acciones
            </TableCell>
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
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                    {user.last_ip || 'No registrada'}
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

                <TableCell>
                  <Chip
                    label={user.verified ? 'Verificado' : 'No Verificado'}
                    size="small"
                    color={user.verified ? 'primary' : 'default'}
                    icon={user.verified ? <VerifiedIcon /> : <UnverifiedIcon />}
                    sx={{ minWidth: 120 }}
                  />
                </TableCell>

                <TableCell align="center">
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                    <Tooltip title="Ver detalles">
                      <IconButton 
                        size="small" 
                        sx={commonStyles.actionButton}
                        onClick={() => openDetailsModal(user)}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    {user.verified ? (
                      <Tooltip title="Desverificar usuario">
                        <IconButton 
                          size="small" 
                          sx={{
                            ...commonStyles.actionButton,
                            color: '#FF8C00', // Naranja oscuro
                            '&:hover': {
                              backgroundColor: 'rgba(255, 140, 0, 0.1)',
                              color: '#FF6347' // Rojo tomate en hover
                            }
                          }}
                          onClick={() => openVerificationModal(user, 'unverify')}
                        >
                          <UnverifiedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Verificar a este usuario">
                        <IconButton 
                          size="small" 
                          sx={{
                            ...commonStyles.actionButton,
                            color: '#00bcd4', // Celeste
                            '&:hover': {
                              backgroundColor: 'rgba(0, 188, 212, 0.1)',
                              color: 'primary.main'
                            }
                          }}
                          onClick={() => openVerificationModal(user, 'verify')}
                        >
                          <VerifiedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}

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

                    <Tooltip title="Eliminar usuario">
                      <IconButton 
                        size="small" 
                        sx={commonStyles.actionButton}
                        color="error"
                        onClick={() => openDeleteModal(user)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
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

      {/* Modal de detalles de usuario */}
      <UserDetailsModal
        open={detailsModal.open}
        user={detailsModal.user}
        onClose={closeDetailsModal}
        onUserUpdated={loadData}
      />

      {/* Modal de verificación de usuario */}
      <UserVerificationModal
        open={verificationModal.open}
        user={verificationModal.user}
        action={verificationModal.action}
        onConfirm={handleVerificationConfirm}
        onClose={closeVerificationModal}
      />

      {/* Modal de eliminación de usuario */}
      <UserDeleteModal
        open={deleteModal.open}
        user={deleteModal.user}
        onConfirm={handleDeleteConfirm}
        onClose={closeDeleteModal}
      />

      {/* Modal de eliminación múltiple de usuarios */}
      <UserDeleteMultipleModal
        open={deleteMultipleModal.open}
        users={deleteMultipleModal.users}
        onConfirm={handleDeleteMultipleConfirm}
        onClose={closeDeleteMultipleModal}
      />
    </Box>
  );
});

UserManagementTable.displayName = 'UserManagementTable';

export default UserManagementTable;
