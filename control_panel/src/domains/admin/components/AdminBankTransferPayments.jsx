/**
 * 💳 Admin Bank Transfer Payments Component
 * 
 * Componente para que administradores revisen y aprueben/rechacen
 * pagos pendientes realizados por transferencia bancaria manual.
 * 
 * Funcionalidades:
 * - Listado de órdenes pendientes con payment_method='bank_transfer' y payment_status='pending'
 * - Aprobar pago (cambiar a 'paid')
 * - Rechazar pago (cambiar a 'rejected' con razón)
 * - Actualización automática
 * - Filtros y búsqueda
 * 
 * @author Panel Administrativo Sellsi
 * @date 2026-01-05
 */

import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Grid,
  Divider
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Refresh,
  Search,
  AttachMoney,
  Person,
  Schedule,
  Info,
  Schedule as ScheduleIcon,
  AttachMoney as AttachMoneyIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { supabase } from '../../../services/supabase';
import AdminStatCard from './AdminStatCard';

// ✅ CONSTANTS
const REFRESH_INTERVAL = 30000; // 30 segundos

const tableStyles = {
  container: {
    p: 3
  },
  header: {
    mb: 3,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 2
  },
  searchBox: {
    mb: 3,
    display: 'flex',
    gap: 2,
    alignItems: 'center'
  },
  statCard: {
    p: 2,
    borderRadius: 2,
    textAlign: 'center',
    backgroundColor: 'primary.light',
    color: 'white'
  },
  tableHeader: {
    backgroundColor: '#2E52B2',
    '& th': {
      color: 'white',
      fontWeight: 'bold',
      fontSize: '0.875rem'
    }
  },
  tableRow: {
    '&:hover': {
      backgroundColor: '#f5f5f5'
    }
  },
  actionButton: {
    minWidth: 100
  }
};

// ✅ REJECTION MODAL COMPONENT
const RejectionModal = memo(({ open, onClose, onConfirm, orderData }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!reason.trim()) {
      alert('Debes proporcionar una razón para el rechazo');
      return;
    }
    
    setLoading(true);
    await onConfirm(reason);
    setLoading(false);
    setReason('');
  };

  const handleClose = () => {
    if (!loading) {
      setReason('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        ❌ Rechazar Transferencia Bancaria
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Alert severity="warning">
            Estás a punto de rechazar el pago de la orden <strong>{orderData?.id?.substring(0, 8)}...</strong>
          </Alert>
          
          <Typography variant="body2" color="text.secondary">
            <strong>Total:</strong> ${orderData?.grand_total?.toLocaleString('es-CL')}
          </Typography>
          
          <TextField
            label="Razón del Rechazo *"
            multiline
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ejemplo: Transferencia no encontrada en los registros bancarios del día..."
            fullWidth
            required
            disabled={loading}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="error"
          disabled={loading || !reason.trim()}
          startIcon={loading ? <CircularProgress size={20} /> : <Cancel />}
        >
          Rechazar Pago
        </Button>
      </DialogActions>
    </Dialog>
  );
});

RejectionModal.displayName = 'RejectionModal';

// ✅ MAIN COMPONENT
const AdminBankTransferPayments = memo(() => {
  // ========================================
  // 🔧 STATE
  // ========================================
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [processingAction, setProcessingAction] = useState(null);
  const fetchInProgressRef = useRef(false);
  const intervalRef = useRef(null);

  // ========================================
  // 🔧 FETCH DATA
  // ========================================

  const fetchPendingOrders = useCallback(async () => {
    // Protección contra llamadas concurrentes
    if (fetchInProgressRef.current) {
      console.info('AdminBankTransfer: fetch already in progress, skipping');
      return;
    }

    fetchInProgressRef.current = true;
    
    try {
      setLoading(true);
      setError(null);

      // Obtener admin ID de localStorage (sistema custom de control_panel_users)
      const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
      const adminId = adminUser?.id;

      if (!adminId) {
        throw new Error('No se pudo obtener el ID del administrador. Por favor inicia sesión nuevamente.');
      }

      // 🔧 FIX: Usar RPC function que bypassa RLS (SECURITY DEFINER)
      // Ya que los admins NO tienen sesión de Supabase Auth (auth.uid() = NULL)
      const { data, error: fetchError } = await supabase
        .rpc('get_pending_bank_transfers_for_admin', {
          p_admin_id: adminId
        });

      if (fetchError) throw fetchError;

      // Adaptar formato de datos (RPC retorna flat objects, necesitamos nested users)
      const adaptedData = (data || []).map(order => ({
        id: order.id,
        created_at: order.created_at,
        user_id: order.user_id,
        grand_total: order.grand_total,
        currency: order.currency,
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        status: order.status,
        users: {
          user_nm: order.user_nm,
          email: order.email,
          rut: order.rut
        }
      }));

      setOrders(adaptedData || []);
    } catch (err) {
      console.error('Error fetching pending bank transfers:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  }, []);

  // ========================================
  // 🔧 EFFECTS
  // ========================================

  useEffect(() => {
    fetchPendingOrders();
    
    // Auto-refresh solo si la pestaña está visible
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Pausar interval cuando la pestaña no está visible
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          console.info('AdminBankTransfer: auto-refresh paused (tab hidden)');
        }
      } else {
        // Reanudar interval cuando vuelve a estar visible
        if (!intervalRef.current) {
          console.info('AdminBankTransfer: auto-refresh resumed (tab visible)');
          fetchPendingOrders(); // Fetch inmediato al volver
          intervalRef.current = setInterval(() => {
            fetchPendingOrders();
          }, REFRESH_INTERVAL);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Iniciar interval
    intervalRef.current = setInterval(() => {
      fetchPendingOrders();
    }, REFRESH_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // ========================================
  // 🔧 HANDLERS
  // ========================================

  const handleApprove = async (order) => {
    if (!confirm(`¿Confirmar que la transferencia de $${order.grand_total?.toLocaleString('es-CL')} fue recibida?`)) {
      return;
    }

    try {
      setProcessingAction(order.id);

      // Obtener admin ID de localStorage (sistema custom de control_panel_users)
      const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
      const adminId = adminUser?.id;
      
      if (!adminId) {
        throw new Error('No se pudo identificar al administrador. Por favor inicia sesión nuevamente.');
      }

      // Llamar RPC function
      const { data, error: rpcError } = await supabase.rpc('approve_bank_transfer_payment', {
        p_order_id: order.id,
        p_admin_id: adminId
      });

      if (rpcError) throw rpcError;

      // Actualizar lista
      await fetchPendingOrders();
      
      alert('✅ Pago aprobado exitosamente. El comprador recibirá una notificación.');
    } catch (err) {
      console.error('Error approving payment:', err);
      alert(`Error al aprobar pago: ${err.message}`);
    } finally {
      setProcessingAction(null);
    }
  };

  const handleReject = async (reason) => {
    try {
      setProcessingAction(selectedOrder.id);

      // Obtener admin ID de localStorage (sistema custom de control_panel_users)
      const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
      const adminId = adminUser?.id;
      
      if (!adminId) {
        throw new Error('No se pudo identificar al administrador. Por favor inicia sesión nuevamente.');
      }

      // Llamar RPC function
      const { data, error: rpcError } = await supabase.rpc('reject_bank_transfer_payment', {
        p_order_id: selectedOrder.id,
        p_admin_id: adminId,
        p_rejection_reason: reason
      });

      if (rpcError) throw rpcError;

      // Cerrar modal y actualizar lista
      setRejectionModalOpen(false);
      setSelectedOrder(null);
      await fetchPendingOrders();
      
      alert('❌ Pago rechazado. El comprador recibirá una notificación con la razón.');
    } catch (err) {
      console.error('Error rejecting payment:', err);
      alert(`Error al rechazar pago: ${err.message}`);
    } finally {
      setProcessingAction(null);
    }
  };

  const openRejectionModal = (order) => {
    setSelectedOrder(order);
    setRejectionModalOpen(true);
  };

  // ========================================
  // 🔧 COMPUTED VALUES
  // ========================================

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    
    const query = searchQuery.toLowerCase();
    return orders.filter(order => 
      order.id.toLowerCase().includes(query) ||
      order.users?.user_nm?.toLowerCase().includes(query) ||
      order.users?.email?.toLowerCase().includes(query) ||
      order.users?.rut?.toLowerCase().includes(query)
    );
  }, [orders, searchQuery]);

  const totalPendingAmount = useMemo(() => {
    return orders.reduce((sum, order) => sum + (order.grand_total || 0), 0);
  }, [orders]);

  // ========================================
  // 🎨 RENDER FUNCTIONS
  // ========================================

  const renderStats = () => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={4}>
        <Tooltip 
          title="Órdenes con transferencia bancaria que esperan confirmación del administrador"
          placement="top"
          arrow
        >
          <Box>
            <AdminStatCard
              title="Pendientes"
              value={orders.length}
              icon={ScheduleIcon}
              color="warning"
            />
          </Box>
        </Tooltip>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <Tooltip 
          title="Monto total acumulado de todas las transferencias pendientes de revisión"
          placement="top"
          arrow
        >
          <Box>
            <AdminStatCard
              title="Total en Revisión"
              value={`$${totalPendingAmount.toLocaleString('es-CL')}`}
              icon={AttachMoneyIcon}
              color="success"
            />
          </Box>
        </Tooltip>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <Tooltip 
          title="Cantidad de órdenes visibles después de aplicar filtros de búsqueda"
          placement="top"
          arrow
        >
          <Box>
            <AdminStatCard
              title="Resultados Filtrados"
              value={filteredOrders.length}
              icon={FilterListIcon}
              color="info"
            />
          </Box>
        </Tooltip>
      </Grid>
    </Grid>
  );

  const renderHeader = () => (
    <Box sx={tableStyles.header}>
      <Box>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          💳 Transferencias Bancarias Pendientes
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Revisa y aprueba las transferencias manuales recibidas
        </Typography>
      </Box>
      <Button
        variant="outlined"
        startIcon={<Refresh />}
        onClick={fetchPendingOrders}
        disabled={loading}
      >
        Actualizar
      </Button>
    </Box>
  );

  const renderSearchBar = () => (
    <Box sx={tableStyles.searchBox}>
      <TextField
        placeholder="Buscar por ID, nombre, email o RUT..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        size="small"
        fullWidth
        InputProps={{
          startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
        }}
      />
    </Box>
  );

  const renderTable = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error al cargar datos: {error}
        </Alert>
      );
    }

    if (filteredOrders.length === 0) {
      return (
        <Alert severity="info" sx={{ mb: 2 }}>
          {orders.length === 0 
            ? '✅ No hay transferencias bancarias pendientes de revisión'
            : '🔍 No se encontraron resultados para la búsqueda'}
        </Alert>
      );
    }

    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={tableStyles.tableHeader}>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>ID Orden</TableCell>
              <TableCell>Comprador</TableCell>
              <TableCell>Email</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell align="center">Estado</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.id} sx={tableStyles.tableRow}>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Schedule fontSize="small" color="action" />
                    <Typography variant="body2">
                      {new Date(order.created_at).toLocaleDateString('es-CL', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontFamily="monospace">
                    {order.id.substring(0, 13)}...
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Person fontSize="small" color="action" />
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {order.users?.user_nm || 'N/A'}
                      </Typography>
                      {order.users?.rut && (
                        <Typography variant="caption" color="text.secondary">
                          RUT: {order.users.rut}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {order.users?.email || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end">
                    <AttachMoney fontSize="small" color="success" />
                    <Typography variant="body2" fontWeight="bold">
                      ${order.grand_total?.toLocaleString('es-CL')}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label="En Revisión"
                    color="warning"
                    size="small"
                    icon={<Schedule />}
                  />
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={1} justifyContent="center">
                    <Tooltip title="Aprobar transferencia">
                      <span>
                        <IconButton
                          color="success"
                          onClick={() => handleApprove(order)}
                          disabled={processingAction === order.id}
                          size="small"
                        >
                          {processingAction === order.id ? (
                            <CircularProgress size={20} />
                          ) : (
                            <CheckCircle />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Rechazar transferencia">
                      <span>
                        <IconButton
                          color="error"
                          onClick={() => openRejectionModal(order)}
                          disabled={processingAction === order.id}
                          size="small"
                        >
                          <Cancel />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // ========================================
  // 🎨 RENDER PRINCIPAL
  // ========================================

  return (
    <Box sx={tableStyles.container}>
      {renderHeader()}
      <Divider sx={{ mb: 3 }} />
      {renderStats()}
      {renderSearchBar()}
      {renderTable()}

      {/* Rejection Modal */}
      <RejectionModal
        open={rejectionModalOpen}
        onClose={() => {
          setRejectionModalOpen(false);
          setSelectedOrder(null);
        }}
        onConfirm={handleReject}
        orderData={selectedOrder}
      />
    </Box>
  );
});

AdminBankTransferPayments.displayName = 'AdminBankTransferPayments';

export default AdminBankTransferPayments;
