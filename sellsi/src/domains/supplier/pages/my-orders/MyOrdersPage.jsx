import AssignmentIcon from '@mui/icons-material/Assignment';
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
import { useOrdersStore } from '../../../../shared/stores/orders/ordersStore'; // Actualizado a nueva ubicación
import TableFilter from '../../../../shared/components/display/tables/TableFilter'; // Asegúrate que esta ruta sea correcta
import Table from '../../../../shared/components/display/tables/Table'; // Asegúrate que esta ruta sea correcta
import { Modal, MODAL_TYPES } from '../../../../shared/components/feedback'; // Componente Modal genérico y sus tipos
import { useBanner } from '../../../../shared/components/display/banners/BannerContext'; // Contexto para mostrar banners
import { SideBarProvider } from '../../../../shared/components/navigation/SideBar'; // Proveedor para la barra lateral
import { dashboardThemeCore } from '../../../../styles/dashboardThemeCore'; // Tema de Material-UI para el dashboard
import { SPACING_BOTTOM_MAIN } from '../../../../styles/layoutSpacing';

// TODO: Implementar hook de autenticación
// import { useAuth } from '../../auth/hooks/useAuth';
// 
// Cuando se implemente el hook de autenticación, reemplazar la línea:
// const supplierId = localStorage.getItem('user_id');
// 
// Por:
// const { user } = useAuth();
// const supplierId = user?.user_id;
//
// Y agregar validación adicional para usuarios no autenticados

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

  // TEMPORAL: Obtener el supplier ID del localStorage
  // Cuando se implemente el hook de autenticación, esto será reemplazado por:
  // const { user } = useAuth();
  // const supplierId = user?.user_id;
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
      <ThemeProvider theme={dashboardThemeCore}>
        <SideBarProvider />
        <Box
          sx={{
            // marginLeft: '210px', // Eliminado para ocupar todo el ancho
            backgroundColor: 'background.default',
            minHeight: '100vh',
            pt: { xs: 4.5, md: 5 },
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
      <ThemeProvider theme={dashboardThemeCore}>
        <SideBarProvider />
        <Box
          sx={{
            // marginLeft: '210px', // Eliminado para ocupar todo el ancho
            backgroundColor: 'background.default',
            minHeight: '100vh',
            pt: { xs: 4.5, md: 5 },
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
    <ThemeProvider theme={dashboardThemeCore}>
      <SideBarProvider />
      <Box
        sx={{
          // marginLeft: '210px', // Eliminado para ocupar todo el ancho
          backgroundColor: 'background.default',
          minHeight: '100vh',
          pt: { xs: 4.5, md: 5 }, // Padding top para espacio con el header
          px: 3, // Padding horizontal
          pb: SPACING_BOTTOM_MAIN, // Padding bottom
          ml: { xs: 0, md: 10, lg: 14, xl: 24 },
        }}
      >
        <Container maxWidth="xl" disableGutters>
          {/* Título de la página */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <AssignmentIcon sx={{ color: 'primary.main', fontSize: 36, mr: 1 }} />
            <Typography
              variant="h4"
              fontWeight={600}
              color="primary.main"
              gutterBottom
            >
              Mis Pedidos
            </Typography>
          </Box>

          {/* Componente para filtrar pedidos por estado */}
          <TableFilter
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