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

import React, { useState, useMemo, memo, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  TextField,
  Popover,
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
  Button,
  Chip
} from '@mui/material';
import {
  Block as BlockIcon,
  CheckCircle as UnblockIcon,
  Visibility as ViewIcon,
  Person as PersonIcon,
  Store as StoreIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Info as InfoIcon,
  VerifiedUser as VerifiedIcon,
  Cancel as UnverifiedIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

// Importar componentes UI existentes
import { Modal } from '../../../shared/components/feedback';
import AdminStatCard from './AdminStatCard';
// 🔍 Reemplazo de import desde barrel '../../../domains/admin' para reducir ciclos
import { banUser, unbanUser, verifyUser, unverifyUser, deleteUser, deleteMultipleUsers } from '../services/adminUserService';
// Extracted logic
import { USER_STATUS, USER_FILTERS } from '../components/userManagementTable/constants/userConstants';
import { getUserStatus, getUserActiveProducts, getCurrentAdminId } from '../components/userManagementTable/utils/userUtils';
import { useAdminUsersData } from '../components/userManagementTable/hooks/useAdminUsersData';
import { useUserFilters } from '../components/userManagementTable/hooks/useUserFilters';
import { useUserSelection } from '../components/userManagementTable/hooks/useUserSelection';
import { useUserModals } from '../components/userManagementTable/hooks/useUserModals';
import { useUserActions } from '../components/userManagementTable/hooks/useUserActions';

// Importar modales
// (UserStatsHeader, UserFiltersBar, UsersTable) removidos por ahora; se usa implementación inline tras refactor.
import UserBanModal from '../modals/UserBanModal';
import UserDetailsModal from '../modals/UserDetailsModal';
import UserVerificationModal from '../modals/UserVerificationModal';
import UserDeleteModal from '../modals/UserDeleteModal';
import UserDeleteMultipleModal from '../modals/UserDeleteMultipleModal';

// constants & utils moved out (see imports)

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
  tableHeader: {
    backgroundColor: '#2E52B2',
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
  
  const { users, stats, loading, error, setError, initialLoadComplete, loadData } = useAdminUsersData();
  const { filters, handleFilterChange, searchTerm, debouncedSearchTerm, filteredUsers } = useUserFilters(users);
  const { selectedUsers, handleUserSelect, handleSelectAll, clearSelection } = useUserSelection(filteredUsers);

  // Copiar ID: estado para popover y feedback de copiado
  const [idAnchor, setIdAnchor] = useState(null);
  const [copiedId, setCopiedId] = useState(false);
  const idCopyTimerRef = useRef(null);
  const [idOpenUserId, setIdOpenUserId] = useState(null);

  // Modales
  const {
    banModal, openBanModal, closeBanModal,
    detailsModal, openDetailsModal, closeDetailsModal,
    verificationModal, openVerificationModal, closeVerificationModal,
    deleteModal, openDeleteModal, closeDeleteModal,
    deleteMultipleModal, openDeleteMultipleModal, closeDeleteMultipleModal
  } = useUserModals();

  // Estado para evitar foco no deseado en el campo de búsqueda
  const [preventSearchFocus, setPreventSearchFocus] = useState(false);

  // ========================================
  // 🔧 EFECTOS
  // ========================================

  // filtering/selection logic moved to hooks

  const handleOpenId = (event, userId) => {
    setIdAnchor(event.currentTarget);
    setIdOpenUserId(userId);
  };
  const handleCloseId = () => {
    setIdAnchor(null);
    setIdOpenUserId(null);
    if (idCopyTimerRef.current) {
      clearTimeout(idCopyTimerRef.current);
      idCopyTimerRef.current = null;
    }
    setCopiedId(false);
  };

  const handleCopyId = async (text) => {
    try {
      if (!text) return;
      await navigator.clipboard.writeText(text);
      setCopiedId(true);
      if (idCopyTimerRef.current) clearTimeout(idCopyTimerRef.current);
      idCopyTimerRef.current = setTimeout(() => setCopiedId(false), 3000);
    } catch (_) {}
  };

  // select all handled in hook (handleSelectAll)

  const openDeleteModalWrapped = useCallback((user) => { setPreventSearchFocus(true); openDeleteModal(user); }, [openDeleteModal]);
  const closeDeleteModalWrapped = useCallback(() => { closeDeleteModal(); setTimeout(() => setPreventSearchFocus(false), 100); }, [closeDeleteModal]);
  const openDeleteMultipleModalWrapped = useCallback(() => {
    setPreventSearchFocus(true);
    const selectedUsersArray = filteredUsers.filter(u => selectedUsers.has(u.user_id));
    openDeleteMultipleModal(selectedUsersArray);
  }, [filteredUsers, selectedUsers, openDeleteMultipleModal]);
  const closeDeleteMultipleModalWrapped = useCallback(() => { closeDeleteMultipleModal(); setTimeout(() => setPreventSearchFocus(false), 100); }, [closeDeleteMultipleModal]);

  const { handleBanConfirm, handleVerificationConfirm, handleDeleteConfirm, handleDeleteMultipleConfirm } = useUserActions({
    loadData,
    setError,
    closeBanModal,
    closeVerificationModal,
    closeDeleteModal: closeDeleteModalWrapped,
    closeDeleteMultipleModal: closeDeleteMultipleModalWrapped,
    clearSelection
  });

  // ========================================
  // 🎨 RENDER COMPONENTS
  // ========================================

  const MemoAdminStatCard = useMemo(() => memo(AdminStatCard), []);
  const renderStatsCards = useCallback(() => (
    <Grid container spacing={3} sx={commonStyles.headerSection}>
      <Grid item xs={12} sm={6} md={2.4}>
        <Tooltip 
          title="Cantidad total de usuarios registrados en la plataforma (activos y baneados)"
          placement="top"
          arrow
        >
          <Box>
            <MemoAdminStatCard
              title="Total Usuarios"
              value={stats.totalUsers || 0}
              icon={PersonIcon}
              color="primary"
            />
          </Box>
        </Tooltip>
      </Grid>
      <Grid item xs={12} sm={6} md={2.4}>
        <Tooltip 
          title="Usuarios que pueden acceder y usar la plataforma normalmente"
          placement="top"
          arrow
        >
          <Box>
            <MemoAdminStatCard
              title="Usuarios Activos"
              value={stats.activeUsers || 0}
              icon={PersonIcon}
              color="success"
            />
          </Box>
        </Tooltip>
      </Grid>
      <Grid item xs={12} sm={6} md={2.4}>
        <Tooltip 
          title="Usuarios que han completado el proceso de verificación de identidad"
          placement="top"
          arrow
        >
          <Box>
            <MemoAdminStatCard
              title="Usuarios Verificados"
              value={stats.verifiedUsers || 0}
              icon={VerifiedIcon}
              color="info"
            />
          </Box>
        </Tooltip>
      </Grid>
      <Grid item xs={12} sm={6} md={2.4}>
        <Tooltip 
          title="Usuarios suspendidos que no pueden acceder a la plataforma"
          placement="top"
          arrow
        >
          <Box>
            <MemoAdminStatCard
              title="Usuarios Baneados"
              value={stats.bannedUsers || 0}
              icon={BlockIcon}
              color="error"
            />
          </Box>
        </Tooltip>
      </Grid>
      <Grid item xs={12} sm={6} md={2.4}>
        <Tooltip 
          title="Usuarios que han publicado al menos un producto en el marketplace"
          placement="top"
          arrow
        >
          <Box>
            <MemoAdminStatCard
              title="Proveedores"
              value={stats.suppliers || 0}
              icon={StoreIcon}
              color="warning"
            />
          </Box>
        </Tooltip>
      </Grid>
    </Grid>
  ), [stats]);

  const renderFilters = useCallback(() => (
    <Paper sx={commonStyles.filtersSection}>
      <Grid container spacing={3} alignItems="center">
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="medium">
            <InputLabel>Estado</InputLabel>
            <Select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              label="Estado"
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
          <FormControl fullWidth size="medium">
            <InputLabel>Tipo de Usuario</InputLabel>
            <Select
              value={filters.userType}
              onChange={(e) => handleFilterChange('userType', e.target.value)}
              label="Tipo de Usuario"
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
                onClick={openDeleteMultipleModalWrapped}
              >
                Eliminar {selectedUsers.size} usuario{selectedUsers.size !== 1 ? 's' : ''} seleccionado{selectedUsers.size !== 1 ? 's' : ''}
              </Button>
            </Box>
          </Grid>
        )}
      </Grid>
    </Paper>
  ), [filters, handleFilterChange, searchTerm, debouncedSearchTerm, initialLoadComplete, filteredUsers.length, users.length, selectedUsers.size, openDeleteMultipleModalWrapped, preventSearchFocus]);

  const renderUsersTable = () => (
  <TableContainer component={Paper} sx={{ mb: 3 }}>
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
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontFamily: 'monospace', cursor: 'pointer' }}
                    onClick={(e) => handleOpenId(e, user.user_id)}
                  >
                    {user.user_id?.slice(0, 8)}...
                  </Typography>

                  <Popover
                    open={Boolean(idAnchor) && idOpenUserId === user.user_id}
                    anchorEl={idAnchor}
                    onClose={handleCloseId}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                    disableScrollLock
                  >
                    <Box sx={{ p: 2, minWidth: 300 }}>
                      <TextField
                        fullWidth
                        size="small"
                        value={user.user_id || ''}
                        InputProps={{ readOnly: true, sx: { fontFamily: 'monospace' } }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                        <Button size="small" variant="contained" onClick={() => handleCopyId(user.user_id)}>
                          {copiedId ? 'Copiado' : 'Copiar'}
                        </Button>
                      </Box>
                    </Box>
                  </Popover>
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
                    clickable={false}
                    onClick={() => {}}
                  />
                </TableCell>

                <TableCell>
                  <Chip
                    label={USER_STATUS[userStatus].label}
                    size="small"
                    color={USER_STATUS[userStatus].color}
                    sx={commonStyles.statusChip}
                    clickable={false}
                    onClick={() => {}}
                  />
                </TableCell>

                <TableCell>
                  <Chip
                    label={user.main_supplier ? 'Proveedor' : 'Comprador'}
                    size="small"
                    color={user.main_supplier ? 'primary' : 'secondary'}
                    variant="outlined"
                    clickable={false}
                    onClick={() => {}}
                  />
                </TableCell>

                <TableCell>
                  <Chip
                    label={user.verified ? 'Verificado' : 'No Verificado'}
                    size="small"
                    color={user.verified ? 'primary' : 'default'}
                    icon={user.verified ? <VerifiedIcon /> : <UnverifiedIcon />}
                    sx={{ minWidth: 120 }}
                    clickable={false}
                    onClick={() => {}}
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
                        onClick={() => openDeleteModalWrapped(user)}
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
              background: '#2E52B2',
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
        onClose={closeDeleteModalWrapped}
      />

      {/* Modal de eliminación múltiple de usuarios */}
      <UserDeleteMultipleModal
        open={deleteMultipleModal.open}
        users={deleteMultipleModal.users}
        onConfirm={handleDeleteMultipleConfirm}
        onClose={closeDeleteMultipleModalWrapped}
      />
    </Box>
  );
});

UserManagementTable.displayName = 'UserManagementTable';

export default UserManagementTable;
