import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Container,
  TextField,
} from '@mui/material';
import { useOrdersStore } from './store/ordersStore';
import Filter from './components/Filter';
import Table from './components/Table';
import OrderActionModal from './modals/OrderActionModal';

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
    getFilteredOrders,
  } = useOrdersStore();

  // Estado local para modales
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null,
    selectedOrder: null,
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
      selectedOrder: order,
    });
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setModalState({
      isOpen: false,
      type: null,
      selectedOrder: null,
    });
  };

  // Manejar envío de formulario del modal
  const handleModalSubmit = formData => {
    const { selectedOrder, type } = modalState;

    switch (type) {
      case 'accept':
        updateOrderStatus(selectedOrder.order_id, 'Aceptado', {
          message: formData.message || '',
        });
        break;

      case 'reject':
        updateOrderStatus(selectedOrder.order_id, 'Rechazado', {
          rejectionReason: formData.rejectionReason || '',
        });
        break;

      case 'dispatch':
        if (!formData.deliveryDate) {
          alert('La fecha de entrega es obligatoria');
          return;
        }
        updateOrderStatus(selectedOrder.order_id, 'En Ruta', {
          estimated_delivery_date: formData.deliveryDate,
          message: formData.message || '',
        });
        break;

      case 'deliver':
        updateOrderStatus(selectedOrder.order_id, 'Entregado', {
          deliveryDocuments: formData.deliveryDocuments || null,
          message: formData.message || '',
        });
        break;

      case 'chat':
        // Aquí se podría abrir un chat o redirigir a otra página
        console.log('Abrir chat para pedido:', selectedOrder.order_id);
        break;
    }

    handleCloseModal();
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
        children: (
          <TextField
            name="message"
            label="Mensaje (opcional)"
            multiline
            rows={3}
            fullWidth
            variant="outlined"
          />
        ),
      },
      reject: {
        title: 'Rechazar Pedido',
        submitButtonText: 'Rechazar',
        submitButtonColor: 'error',
        showWarningIcon: true,
        children: (
          <TextField
            name="rejectionReason"
            label="Motivo del rechazo (opcional)"
            multiline
            rows={3}
            fullWidth
            variant="outlined"
          />
        ),
      },
      dispatch: {
        title: 'Confirmar Despacho',
        submitButtonText: 'Confirmar',
        submitButtonColor: 'primary',
        showWarningIcon: false,
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
        ),
      },
      deliver: {
        title: 'Confirmar Entrega',
        submitButtonText: 'Confirmar',
        submitButtonColor: 'primary',
        showWarningIcon: false,
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
                multiple: true,
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
        ),
      },
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
      <Filter statusFilter={statusFilter} setStatusFilter={setStatusFilter} />

      {/* Tabla de pedidos */}
      <Table orders={filteredOrders} onActionClick={handleActionClick} />

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
