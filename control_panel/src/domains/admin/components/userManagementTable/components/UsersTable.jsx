import React, { memo } from 'react';
import { TableContainer, Paper, Table, TableHead, TableRow, TableCell, Checkbox, TableBody, Box, Avatar, Typography, Chip, IconButton, Tooltip, Popover, TextField, Button } from '@mui/material';
import { Info as InfoIcon, VerifiedUser as VerifiedIcon, Cancel as UnverifiedIcon, Visibility as ViewIcon, Block as BlockIcon, CheckCircle as UnblockIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { USER_STATUS } from '../constants/userConstants';
import { getUserStatus, getUserActiveProducts } from '../utils/userUtils';

const UsersTable = memo(function UsersTable({
  filteredUsers,
  selectedUsers,
  handleSelectAll,
  handleUserSelect,
  openDetailsModal,
  openVerificationModal,
  openBanModal,
  openDeleteModal,
  idAnchor,
  idOpenUserId,
  handleOpenId,
  handleCloseId,
  handleCopyId,
  copiedId,
  loading,
  commonStyles
}) {
  return (
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
              <Tooltip title="Estado del usuario en el sistema. Activo: puede usar normalmente la plataforma. Baneado: no puede acceder ni realizar acciones en la plataforma." arrow placement="top">
                <IconButton size="small" sx={{ color: 'white', p: 0 }}>
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              Estado
            </TableCell>
            <TableCell sx={{ color: 'white' }}>Tipo</TableCell>
            <TableCell sx={{ color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip title="Si el proveedor ha sido verificado por el equipo Sellsi como proveedor de confianza" arrow placement="top">
                <IconButton size="small" sx={{ color: 'white', p: 0 }}>
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              ¿Verificado?
            </TableCell>
            <TableCell align="center" sx={{ color: 'white' }}>
              <Tooltip title="Acciones disponibles" arrow placement="top">
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
              <TableRow key={user.user_id} sx={commonStyles.tableRow} selected={isSelected}>
                <TableCell padding="checkbox">
                  <Checkbox checked={isSelected} onChange={(e) => handleUserSelect(user.user_id, e.target.checked)} />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar src={user.logo_url} sx={commonStyles.userAvatar}>
                      {user.user_nm?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <Typography variant="body2" fontWeight="medium">{user.user_nm || 'N/A'}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', cursor: 'pointer' }} onClick={(e) => handleOpenId(e, user.user_id)}>
                    {user.user_id?.slice(0, 8)}...
                  </Typography>
                  <Popover open={Boolean(idAnchor) && idOpenUserId === user.user_id} anchorEl={idAnchor} onClose={handleCloseId} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} disableScrollLock>
                    <Box sx={{ p: 2, minWidth: 300 }}>
                      <TextField fullWidth size="small" value={user.user_id || ''} InputProps={{ readOnly: true, sx: { fontFamily: 'monospace' } }} />
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                        <Button size="small" variant="contained" onClick={() => handleCopyId(user.user_id)}>
                          {copiedId ? 'Copiado' : 'Copiar'}
                        </Button>
                      </Box>
                    </Box>
                  </Popover>
                </TableCell>
                <TableCell><Typography variant="body2">{user.email}</Typography></TableCell>
                <TableCell><Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{user.last_ip || 'No registrada'}</Typography></TableCell>
                <TableCell>
                  <Chip label={activeProducts} size="small" color={activeProducts > 0 ? 'success' : 'default'} variant="outlined" />
                </TableCell>
                <TableCell>
                  <Chip label={USER_STATUS[userStatus].label} size="small" color={USER_STATUS[userStatus].color} sx={commonStyles.statusChip} />
                </TableCell>
                <TableCell>
                  <Chip label={user.main_supplier ? 'Proveedor' : 'Comprador'} size="small" color={user.main_supplier ? 'primary' : 'secondary'} variant="outlined" />
                </TableCell>
                <TableCell>
                  <Chip label={user.verified ? 'Verificado' : 'No Verificado'} size="small" color={user.verified ? 'primary' : 'default'} icon={user.verified ? <VerifiedIcon /> : <UnverifiedIcon />} sx={{ minWidth: 120 }} />
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                    <Tooltip title="Ver detalles"><IconButton size="small" sx={commonStyles.actionButton} onClick={() => openDetailsModal(user)}><ViewIcon fontSize="small" /></IconButton></Tooltip>
                    {user.verified ? (
                      <Tooltip title="Desverificar usuario"><IconButton size="small" sx={{ ...commonStyles.actionButton, color: '#FF8C00', '&:hover': { backgroundColor: 'rgba(255, 140, 0, 0.1)', color: '#FF6347' } }} onClick={() => openVerificationModal(user, 'unverify')}><UnverifiedIcon fontSize="small" /></IconButton></Tooltip>
                    ) : (
                      <Tooltip title="Verificar a este usuario"><IconButton size="small" sx={{ ...commonStyles.actionButton, color: '#00bcd4', '&:hover': { backgroundColor: 'rgba(0, 188, 212, 0.1)', color: 'primary.main' } }} onClick={() => openVerificationModal(user, 'verify')}><VerifiedIcon fontSize="small" /></IconButton></Tooltip>
                    )}
                    {userStatus === 'active' ? (
                      <Tooltip title="Banear usuario"><IconButton size="small" sx={commonStyles.actionButton} color="error" onClick={() => openBanModal(user, 'ban')}><BlockIcon fontSize="small" /></IconButton></Tooltip>
                    ) : userStatus === 'banned' ? (
                      <Tooltip title="Desbanear usuario"><IconButton size="small" sx={commonStyles.actionButton} color="success" onClick={() => openBanModal(user, 'unban')}><UnblockIcon fontSize="small" /></IconButton></Tooltip>
                    ) : null}
                    <Tooltip title="Eliminar usuario"><IconButton size="small" sx={commonStyles.actionButton} color="error" onClick={() => openDeleteModal(user)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {filteredUsers.length === 0 && !loading && (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">No se encontraron usuarios</Typography>
        </Box>
      )}
    </TableContainer>
  );
});

export default UsersTable;
