import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Container,
  TextField,
  ThemeProvider, // Necesario para aplicar el tema
} from '@mui/material';
import { useOrdersStore } from '../my-orders/ordersStore'; // Asegúrate que esta ruta sea correcta
import Filter from '../../ui/table/Filter'; // Asegúrate que esta ruta sea correcta
import Table from '../../ui/table/Table'; // Asegúrate que esta ruta sea correcta
import Modal, { MODAL_TYPES } from '../../ui/Modal'; // Componente Modal genérico y sus tipos
import { useBanner } from '../../ui/banner/BannerContext'; // Contexto para mostrar banners
import SideBarProvider from '../../layout/SideBar'; // Proveedor para la barra lateral
import { dashboardTheme } from '../../../styles/dashboardTheme'; // Tema de Material-UI para el dashboard

// TODO: Importar hook para obtener usuario autenticado
// import { useAuth } from '../../auth/hooks/useAuth';

const MyOrdersPage = () => {
  // Estado y acciones del store de Zustand
  const {
    orders,
    loading,
    statusFilter,
    error,
    initializeWithSupplier, // Acción para inicializar con el ID del proveedor
    // fetchOrders, // Comentado porque initializeWithSupplier lo llama internamente
    setStatusFilter,
    updateOrderStatus,
    getFilteredOrders,
  } = useOrdersStore();

  // Hook para mostrar notificaciones tipo banner
  const { showBanner } = useBanner();

  // Estado local para controlar la visibilidad y el tipo de modal
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null, // 'accept', 'reject', 'dispatch', 'deliver', 'chat'
    selectedOrder: null,
  });

  // TODO: En producción, obtener el supplierId del hook de autenticación
  // const { user } = useAuth();
  // const supplierId = user?.user_id;

  // TEMPORAL: Obtener el supplier ID del localStorage
  // Esto debe ser reemplazado por la lógica de autenticación real
  const supplierId = localStorage.getItem('user_id');

  // Obtener los pedidos filtrados utilizando un selector del store
  const filteredOrders = getFilteredOrders();

  // Efecto para inicializar el store con el ID del proveedor al cargar el componente
  useEffect(() => {
    if (supplierId) {
      initializeWithSupplier(supplierId);
    } else {
      // Si no hay supplier ID, mostrar un error al usuario
      console.error('No se encontró el ID del proveedor en localStorage');
      showBanner({
        message:
          'Error: No se pudo cargar el ID del proveedor. Intenta recargar la página.',
        severity: 'error',
        duration: 5000,
      });
    }
  }, [supplierId, initializeWithSupplier, showBanner]);

  // Maneja la apertura del modal para una acción específica de un pedido
  const handleActionClick = (order, actionType) => {
    setModalState({
      isOpen: true,
      type: actionType,
      selectedOrder: order,
    });
  };

  // Cierra el modal, reseteando su estado
  const handleCloseModal = () => {
    setModalState({
      isOpen: false,
      type: null,
      selectedOrder: null,
    });
  };

  // Maneja el envío de datos desde los formularios del modal
  const handleModalSubmit = async formData => {
    const { selectedOrder, type } = modalState;

    // Aquí podrías añadir un estado de carga local al modal si lo necesitas:
    // setModalState(prev => ({ ...prev, loading: true }));

    try {
      let messageToUser = ''; // Mensaje para el banner de éxito/información

      switch (type) {
        case 'accept':
          await updateOrderStatus(selectedOrder.order_id, 'Aceptado', {
            message: formData.message || '',
          });
          messageToUser = '✅ El pedido fue aceptado con éxito.';
          break;

        case 'reject':
          await updateOrderStatus(selectedOrder.order_id, 'Rechazado', {
            rejectionReason: formData.rejectionReason || '',
          });
          messageToUser = '❌ El pedido fue rechazado.';
          break;

        case 'dispatch':
          if (!formData.deliveryDate) {
            // Si la fecha de entrega es obligatoria y falta, muestra una alerta y detiene la ejecución
            showBanner({
              message:
                '⚠️ La fecha de entrega estimada es obligatoria para despachar.',
              severity: 'error',
              duration: 5000,
            });
            return;
          }
          await updateOrderStatus(selectedOrder.order_id, 'En Ruta', {
            estimated_delivery_date: formData.deliveryDate,
            message: formData.message || '',
          });
          messageToUser = '🚚 El pedido fue despachado y está en ruta.';
          break;

        case 'deliver':
          await updateOrderStatus(selectedOrder.order_id, 'Entregado', {
            // Asegúrate de cómo tu backend maneja los archivos (deliveryDocuments)
            deliveryDocuments: formData.deliveryDocuments || null,
            message: formData.message || '',
          });
          messageToUser = '📦 La entrega fue confirmada con éxito.';
          break;

        case 'chat':
          console.log('Abriendo chat para pedido:', selectedOrder.order_id);
          messageToUser =
            '💬 Abriendo chat... (funcionalidad pendiente de implementación).';
          // Para el chat, cerramos el modal y solo mostramos el banner de información
          handleCloseModal();
          showBanner({
            message: messageToUser,
            severity: 'info',
            duration: 3000,
          });
          return; // Salir temprano ya que el modal ya se cerró
        default:
          break;
      }

      // Mostrar banner de éxito si la acción no fue 'chat'
      showBanner({
        message: messageToUser,
        severity: 'success',
        duration: 4000,
      });
      handleCloseModal(); // Cierra el modal si la acción fue exitosa y no fue 'chat'
    } catch (error) {
      // Mostrar banner de error si hubo un problema
      showBanner({
        message: `❌ Error al procesar la acción: ${
          error.message || 'Intenta nuevamente.'
        }`,
        severity: 'error',
        duration: 5000,
      });
      console.error('Error al procesar acción del modal:', error);
    } finally {
      // setModalState(prev => ({ ...prev, loading: false })); // Quitar bandera de carga
    }
  };

  // Devuelve la configuración específica para cada tipo de modal
  const getModalConfig = () => {
    const { type } = modalState;

    const configs = {
      accept: {
        title: 'Aceptar Pedido',
        submitButtonText: 'Confirmar',
        submitButtonColor: 'primary',
        showWarningIconHeader: false,
        type: MODAL_TYPES.ORDER_CHECK, // Icono de verificación de orden
        isFormModal: true, // Indica que este modal tiene un formulario
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
        showWarningIconHeader: true, // Muestra un icono de advertencia en el encabezado
        type: MODAL_TYPES.WARNING, // Icono de advertencia general
        isFormModal: true,
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
        showWarningIconHeader: false,
        type: MODAL_TYPES.ORDER_TRUCK, // Icono de camión de entrega
        isFormModal: true,
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
        showWarningIconHeader: false,
        type: MODAL_TYPES.ORDER_BRIEFCASE, // Icono de maletín o documentos
        isFormModal: true,
        children: (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Nota: El manejo de `type="file"` con FormData puede requerir lógica adicional
               para subir el archivo al backend si no lo haces ya */}
            <TextField
              name="deliveryDocuments"
              label="Adjuntar documentos de entrega (opcional)"
              type="file"
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
              // inputProps={{ multiple: true }} // Puedes habilitar múltiples archivos
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
      chat: {
        title: 'Abrir Chat con Cliente',
        submitButtonText: 'Abrir Chat',
        submitButtonColor: 'info',
        showWarningIconHeader: false,
        type: MODAL_TYPES.CHAT, // Icono de chat
        isFormModal: false, // Este no es un formulario, solo una confirmación/acción directa
        children: (
          <Typography variant="body1">
            ¿Deseas abrir la conversación de chat para el pedido **#
            {modalState.selectedOrder?.order_id}**?
          </Typography>
        ),
        // Para el caso 'chat', la acción se ejecuta directamente en el `handleModalSubmit`
        // y este `onSubmit` específico se asegura de cerrar el modal y mostrar el banner.
      },
    };

    return configs[type] || {};
  };

  // --- Renderizado Condicional ---

  // Muestra un indicador de carga si los pedidos están cargando y aún no hay datos
  if (loading && !orders.length) {
    return (
      <ThemeProvider theme={dashboardTheme}>
        <SideBarProvider />
        <Box
          sx={{
            marginLeft: '210px', // Ajusta el margen para la barra lateral
            backgroundColor: 'background.default',
            minHeight: '100vh',
            pt: { xs: 9, md: 10 },
            px: 3,
            pb: 3,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  // Muestra un mensaje de error si ocurre un problema al cargar los pedidos
  if (error) {
    return (
      <ThemeProvider theme={dashboardTheme}>
        <SideBarProvider />
        <Box
          sx={{
            marginLeft: '210px',
            backgroundColor: 'background.default',
            minHeight: '100vh',
            pt: { xs: 9, md: 10 },
            px: 3,
            pb: 3,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Container>
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          </Container>
        </Box>
      </ThemeProvider>
    );
  }

  // Obtiene la configuración del modal basada en el estado actual
  const modalConfig = getModalConfig();

  // --- Renderizado Principal de la Página ---
  return (
    <ThemeProvider theme={dashboardTheme}>
      <SideBarProvider />
      <Box
        sx={{
          marginLeft: '210px', // Ajusta el margen para la barra lateral
          backgroundColor: 'background.default',
          minHeight: '100vh',
          pt: { xs: 9, md: 10 }, // Padding top para espacio con el header
          px: 3, // Padding horizontal
          pb: 3, // Padding bottom
        }}
      >
        <Container maxWidth="xl" disableGutters>
          {/* Título de la página */}
          <Typography variant="h4" component="h1" gutterBottom>
            Mis Pedidos
          </Typography>

          {/* Componente para filtrar pedidos por estado */}
          <Filter
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />

          {/* Componente de tabla que muestra los pedidos */}
          <Table orders={filteredOrders} onActionClick={handleActionClick} />

          {/* Modal de acciones (aceptar, rechazar, despachar, entregar, chatear) */}
          {modalState.isOpen && modalState.selectedOrder && (
            <Modal
              isOpen={modalState.isOpen}
              onClose={handleCloseModal}
              // El onSubmit del modal será `handleModalSubmit` para formularios,
              // o una función específica si `modalConfig.onSubmit` existe (como en el caso de 'chat').
              onSubmit={modalConfig.onSubmit || handleModalSubmit}
              order={modalState.selectedOrder} // Pasa el objeto de la orden al modal
              {...modalConfig} // Extiende la configuración específica del tipo de modal
            />
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default MyOrdersPage;
