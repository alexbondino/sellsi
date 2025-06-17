import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Container,
  TextField
} from '@mui/material';
import { useOrdersStore } from '../myorders/store/ordersStore';
import OrdersFilter from '../myorders/components/OrdersFilter';
import OrdersTable from '../myorders/components/OrdersTable';
import OrderActionModal from '../myorders/modals/OrderActionModal';
import { useBanner } from '../../ui/BannerContext';

const MyOrdersPage = () => {
  // Estado del store
  const {
    orders,
    loading,
    statusFilter,
    error,
    fetchOrders,
    setStatusFilter,
    updateOrderStatus,
    getFilteredOrders
  } = useOrdersStore();

  // Banner para mostrar mensajes de éxito/error
  const { showBanner } = useBanner();

  // Estado local para modales
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null,
    selectedOrder: null
  });

  // Obtener pedidos filtrados
  const filteredOrders = getFilteredOrders();

  // Cargar pedidos al montar el componente
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Manejar apertura de modales
  const handleActionClick = (order, actionType) => {
    setModalState({
      isOpen: true,
      type: actionType,
      selectedOrder: order
    });
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setModalState({
      isOpen: false,
      type: null,
      selectedOrder: null
    });
  };
  // Manejar envío de formulario del modal
  const handleModalSubmit = (formData) => {
    const { selectedOrder, type } = modalState;
    
    try {
      switch (type) {
        case 'accept':
          updateOrderStatus(selectedOrder.order_id, 'Aceptado', {
            message: formData.message || ''
          });
          showBanner({
            message: '✅ El pedido fue aceptado con éxito',
            severity: 'success',
            duration: 4000
          });
          break;
        
        case 'reject':
          updateOrderStatus(selectedOrder.order_id, 'Rechazado', {
            rejectionReason: formData.rejectionReason || ''
          });
          showBanner({
            message: '❌ El pedido fue rechazado',
            severity: 'warning',
            duration: 4000
          });
          break;
        
        case 'dispatch':
          if (!formData.deliveryDate) {
            showBanner({
              message: '⚠️ La fecha de entrega es obligatoria',
              severity: 'error',
              duration: 5000
            });
            return;
          }
          updateOrderStatus(selectedOrder.order_id, 'En Ruta', {
            estimated_delivery_date: formData.deliveryDate,
            message: formData.message || ''
          });
          showBanner({
            message: '🚚 El pedido fue despachado con éxito',
            severity: 'success',
            duration: 4000
          });
          break;
        
        case 'deliver':
          updateOrderStatus(selectedOrder.order_id, 'Entregado', {
            deliveryDocuments: formData.deliveryDocuments || null,
            message: formData.message || ''
          });
          showBanner({
            message: '📦 La entrega fue confirmada con éxito',
            severity: 'success',
            duration: 4000
          });
          break;
          
        case 'chat':
          // Aquí se podría abrir un chat o redirigir a otra página
          console.log('Abrir chat para pedido:', selectedOrder.order_id);
          showBanner({
            message: '💬 Abriendo chat...',
            severity: 'info',
            duration: 3000
          });
          break;
      }
      
      handleCloseModal();
    } catch (error) {
      showBanner({
        message: '❌ Error al procesar la acción. Intenta nuevamente.',
        severity: 'error',
        duration: 5000
      });
      console.error('Error al procesar acción del modal:', error);
    }
  };

  // Configuración del modal según el tipo de acción
  const getModalConfig = () => {
    const { type } = modalState;
    
    const configs = {
      accept: {
        title: 'Aceptar Pedido',
        submitButtonText: 'Confirmar',
        submitButtonColor: 'primary',
        showWarningIcon: false,
        iconType: 'check',
        children: (
          <TextField
            name="message"
            label="Mensaje (opcional)"
            multiline
            rows={3}
            fullWidth
            variant="outlined"
          />
        )
      },
      reject: {
        title: 'Rechazar Pedido',
        submitButtonText: 'Rechazar',
        submitButtonColor: 'error',
        showWarningIcon: true,
        iconType: null,
        children: (
          <TextField
            name="rejectionReason"
            label="Motivo del rechazo (opcional)"
            multiline
            rows={3}
            fullWidth
            variant="outlined"
          />
        )
      },
      dispatch: {
        title: 'Confirmar Despacho',
        submitButtonText: 'Confirmar',
        submitButtonColor: 'primary',
        showWarningIcon: false,
        iconType: 'truck',
        children: (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              name="deliveryDate"
              label="Fecha de entrega estimada"
              type="date"
              fullWidth
              required
              InputLabelProps={{
                shrink: true,
              }}
            />
            <TextField
              name="message"
              label="Mensaje (opcional)"
              multiline
              rows={3}
              fullWidth
              variant="outlined"
            />
          </Box>
        )
      },
      deliver: {
        title: 'Confirmar Entrega',
        submitButtonText: 'Confirmar',
        submitButtonColor: 'primary',
        showWarningIcon: false,
        iconType: 'briefcase',
        children: (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              name="deliveryDocuments"
              label="Adjuntar documentos de entrega (opcional)"
              type="file"
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
              inputProps={{
                multiple: true
              }}
            />
            <TextField
              name="message"
              label="Mensaje (opcional)"
              multiline
              rows={3}
              fullWidth
              variant="outlined"
            />
          </Box>
        )
      }
    };
    
    return configs[type] || {};
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  const modalConfig = getModalConfig();

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Título */}
      <Typography variant="h4" component="h1" gutterBottom>
        Mis Pedidos
      </Typography>

      {/* Filtro */}
      <OrdersFilter
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {/* Tabla de pedidos */}
      <OrdersTable
        orders={filteredOrders}
        onActionClick={handleActionClick}
      />

      {/* Modal de acciones */}
      <OrderActionModal
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        onSubmit={handleModalSubmit}
        order={modalState.selectedOrder}
        {...modalConfig}
      />
    </Container>
  );
};

export default MyOrdersPage;
