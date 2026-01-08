import AssignmentIcon from '@mui/icons-material/Assignment'
import React, { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Alert,
  Container,
  TextField,
  Paper,
  ThemeProvider, // Necesario para aplicar el tema
  useTheme,
  useMediaQuery,
} from '@mui/material'
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { es } from 'date-fns/locale'
import { useOrdersStore } from '../../../../shared/stores/orders/ordersStore' // Actualizado a nueva ubicación
import { useSupplierPartActions } from '../hooks/useSupplierPartActions'
import TableFilter from '../../../../shared/components/display/tables/TableFilter' // Asegúrate que esta ruta sea correcta
import Table from '../../../../shared/components/display/tables/Table' // Asegúrate que esta ruta sea correcta
import MobileOrderCard from '../../../../shared/components/mobile/MobileOrderCard' // Mobile view para pedidos
import MobileSupplierOrdersSkeleton from '../../../../shared/components/display/skeletons/MobileSupplierOrdersSkeleton'
import MobileFilterAccordion from '../../../../shared/components/mobile/MobileFilterAccordion' // Mobile filters
import MobileFileUpload from '../../../../shared/components/mobile/MobileFileUpload' // Mobile file upload
import { Modal, MODAL_TYPES } from '../../../../shared/components/feedback' // Componente Modal genérico y sus tipos
import { useBanner } from '../../../../shared/components/display/banners/BannerContext' // Contexto para mostrar banners
import { dashboardThemeCore } from '../../../../styles/dashboardThemeCore' // Tema de Material-UI para el dashboard
import { SPACING_BOTTOM_MAIN } from '../../../../styles/layoutSpacing'
import { SupplierErrorBoundary } from '../../error-boundary'
import { supabase } from '../../../../services/supabase'
import { uploadInvoicePDF } from '../../../../services/storage/invoiceStorageService'
import TableSkeleton from '../../../../shared/components/display/skeletons/TableSkeleton'
import { validateTaxPdf } from '../utils/pdfValidation'

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
  } = useOrdersStore()

  // Hook para mostrar notificaciones tipo banner
  const { showBanner } = useBanner()
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null, // 'accept', 'reject', 'dispatch', 'deliver', 'cancel'
    selectedOrder: null,
  })

  // Responsividad mobile
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  // ID del proveedor desde Supabase Auth (no chequea rol, solo sesión)
  const [supplierId, setSupplierId] = useState(null)
  const [authResolved, setAuthResolved] = useState(false)
  const [supplierDocTypes, setSupplierDocTypes] = useState([]) // ['boleta','factura']
  const [taxDocFileState, setTaxDocFileState] = useState({
    file: null,
    error: null,
  })
  const [taxDocTouched, setTaxDocTouched] = useState(false)

  // Estado para MobileDatePicker (usado en modal Dispatch cuando isMobile)
  const [deliveryDate, setDeliveryDate] = useState(null)

  // Notifications: mark supplier context notifications as read on mount once auth resolved and supplierId exists
  useEffect(() => {
    let mounted = true
    if (!authResolved || !supplierId) return undefined
    ;(async () => {
      try {
        const mod = await import(
          '../../../../domains/notifications/components/NotificationProvider'
        )
        const notifCtx = mod.useNotificationsContext?.()
        if (mounted) {
          try {
            notifCtx?.markContext?.('supplier_orders')
          } catch (_) {}
        }
      } catch (_) {}
    })()
    return () => {
      mounted = false
    }
  }, [authResolved, supplierId])

  // Helpers para manejo de fechas en formato local YYYY-MM-DD (evita shifts UTC)
  const pad = (n) => String(n).padStart(2, '0')
  const toLocalYYYYMMDD = (value) => {
    if (!value) return null
    try {
      const d = new Date(value)
      if (!Number.isNaN(d.getTime())) {
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
      }
      // Fallback: try to extract YYYY-MM-DD substring
      const m = String(value).match(/\d{4}-\d{2}-\d{2}/)
      return m ? m[0] : null
    } catch (_) {
      return null
    }
  }

  const parseYMD = (s) => {
    if (!s) return null
    const parts = String(s)
      .split('-')
      .map((n) => Number(n))
    if (parts.length !== 3 || parts.some((p) => Number.isNaN(p))) return null
    return new Date(parts[0], parts[1] - 1, parts[2])
  }

  // MobileOrderCard usa el order directamente, no necesita transformación

  const todayLocalISO = () => {
    const d = new Date()
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  }

  // Notifications: mark supplier context notifications as read on mount once auth resolved and supplierId exists
  // (replaced dynamic require) notifications handled in useEffect above

  // Resolver supplierId desde sesión autenticada; fallback a localStorage si no hay sesión
  useEffect(() => {
    let isMounted = true

    const resolveSupplierId = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        const authUid = user?.id || null
        const chosen = authUid || null // solo sesión auth, sin validar rol
        if (!isMounted) return
        setSupplierId(chosen)
        setAuthResolved(true)
      } catch (e) {
        console.error('[MyOrders] Error obteniendo usuario Supabase:', e)
        setSupplierId(null)
        setAuthResolved(true)
      }
    }

    resolveSupplierId()

    // Suscribirse a cambios de sesión para mantener supplierId sincronizado
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextId = session?.user?.id || null
      setSupplierId(nextId || null)
      setAuthResolved(true)
    })

    return () => {
      isMounted = false
      try {
        sub?.subscription?.unsubscribe?.()
      } catch (_) {}
    }
  }, [])

  // Cargar document_types del proveedor cuando se obtiene supplierId
  useEffect(() => {
    let active = true
    const fetchDocTypes = async () => {
      if (!supplierId) return
      try {
        const { data, error } = await supabase
          .from('users')
          .select('document_types')
          .eq('user_id', supplierId)
          .maybeSingle()
        if (!error && active) {
          const arr = Array.isArray(data?.document_types)
            ? data.document_types.filter((t) => t !== 'ninguno')
            : []
          setSupplierDocTypes(arr)
        }
      } catch (_) {}
    }
    fetchDocTypes()
    return () => {
      active = false
    }
  }, [supplierId])

  // Obtener los pedidos filtrados utilizando un selector del store
  const filteredOrders = getFilteredOrders()

  // Estado vacío global (componente reutilizable)
  const EmptyStateGlobal = () => (
    <Paper sx={{ p: { xs: 2, md: 4 }, textAlign: 'center' }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <AssignmentIcon sx={{ fontSize: 48, color: 'primary.main' }} />
      </Box>
      <Typography variant="h6" color="text.secondary" sx={{ fontSize: { md: '1.5rem' }, mb: 1 }}>
        Aún no tienes pedidos
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ fontSize: { md: '1.05rem' } }}>
        Tus pedidos se generan cuando concretas una venta, ya sea desde el marketplace o a partir de una oferta recibida.
      </Typography>
    </Paper>
  );

  // Estado vacío por filtro (componente reutilizable)
  const EmptyStateFiltered = () => (
    <Paper sx={{ p: { xs: 3, md: 4 }, textAlign: 'center' }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <AssignmentIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
      </Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
        No hay pedidos con este estado
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Intenta seleccionar otro filtro para ver tus pedidos en diferentes estados,
        o cambia a "Todos" para ver el listado completo.
      </Typography>
    </Paper>
  );

  // Calcular counts para filterOptions
  const filterCounts = React.useMemo(() => {
    const counts = {
      all: orders.length,
      pending: 0,
      accepted: 0,
      rejected: 0,
      in_transit: 0,
      delivered: 0,
    }

    // Normalizar status display a key
    const normalizeStatus = (displayStatus) => {
      const statusMap = {
        Pendiente: 'pending',
        Aceptado: 'accepted',
        Rechazado: 'rejected',
        'En Transito': 'in_transit',
        'En Tránsito': 'in_transit',
        Entregado: 'delivered',
      }
      return (
        statusMap[displayStatus] || displayStatus?.toLowerCase() || 'pending'
      )
    }

    orders.forEach((o) => {
      const status = normalizeStatus(o.status)
      if (counts[status] !== undefined) {
        counts[status]++
      }
    })
    return counts
  }, [orders])

  const filterOptions = [
    { value: 'Todos', label: 'Todos', count: filterCounts.all },
    { value: 'Pendiente', label: 'Pendiente', count: filterCounts.pending },
    { value: 'Aceptado', label: 'Aceptado', count: filterCounts.accepted },
    { value: 'Rechazado', label: 'Rechazado', count: filterCounts.rejected },
    {
      value: 'En Transito',
      label: 'En Tránsito',
      count: filterCounts.in_transit,
    },
    { value: 'Entregado', label: 'Entregado', count: filterCounts.delivered },
  ]

  // Efecto para inicializar el store con el ID del proveedor al cargar el componente
  useEffect(() => {
    if (!authResolved) return // esperar resolución de sesión para evitar falsos negativos
    if (supplierId) {
      initializeWithSupplier(supplierId)
      return
    }
    // Sin sesión autenticada
    showBanner({
      message: 'Inicia sesión para ver tus pedidos.',
      severity: 'warning',
      duration: 5000,
    })
  }, [authResolved, supplierId, initializeWithSupplier, showBanner])

  // Maneja la apertura del modal para una acción específica de un pedido
  const handleActionClick = (order, actionType) => {
    setModalState({
      isOpen: true,
      type: actionType,
      selectedOrder: order,
    })
  }

  // Cierra el modal, reseteando su estado
  const handleCloseModal = () => {
    setModalState({
      isOpen: false,
      type: null,
      selectedOrder: null,
    })
    setTaxDocFileState({ file: null, error: null })
    setTaxDocTouched(false)
    setDeliveryDate(null) // Reset deliveryDate mobile
  }

  // Maneja el envío de datos desde los formularios del modal
  const partActions = useSupplierPartActions(supplierId)

  const handleModalSubmit = async (formData) => {
    const { selectedOrder, type } = modalState

    // Aquí podrías añadir un estado de carga local al modal si lo necesitas:
    // setModalState(prev => ({ ...prev, loading: true }));

    try {
      let messageToUser = '' // Mensaje para el banner de éxito/información

      switch (type) {
        case 'accept': {
          // Actualización parcial por supplier (Opción A 2.0)
          await partActions.accept(selectedOrder)
          messageToUser = '✅ El pedido fue aceptado con éxito.'
          break
        }
        case 'reject': {
          await partActions.reject(
            selectedOrder,
            formData.rejectionReason || ''
          )
          messageToUser = '❌ El pedido fue rechazado.'
          break
        }
        case 'dispatch': {
          // Construir finalData con conversiones mobile
          let finalData = { ...formData }

          // Mobile: convertir deliveryDate (Date) a string YYYY-MM-DD
          if (isMobile && deliveryDate) {
            finalData.deliveryDate = deliveryDate.toISOString().slice(0, 10)
          }

          // Mobile: reemplazar taxDocument con taxDocFileState.file
          if (isMobile && taxDocFileState.file) {
            finalData.taxDocument = taxDocFileState.file
          }

          // Permitir fecha ingresada o autocalcular (+3 días) si no se ingresó
          let deliveryDateStr = finalData.deliveryDate
          const maxDeadlineRaw =
            modalState.selectedOrder?.estimated_delivery_date || null
          const maxDeadline = maxDeadlineRaw
            ? toLocalYYYYMMDD(maxDeadlineRaw)
            : null
          const todayISO = todayLocalISO()
          if (!deliveryDateStr) {
            const auto = new Date()
            auto.setDate(auto.getDate() + 3)
            deliveryDateStr = auto.toISOString().slice(0, 10) // YYYY-MM-DD para input date
            showBanner({
              message:
                'No ingresaste fecha, se asignó automáticamente (+3 días).',
              severity: 'info',
              duration: 4000,
            })
          }

          // Validar rango permitido: >= hoy y <= fecha límite (si existe)
          // Compare as Date objects parsed from local YYYY-MM-DD to avoid TZ rounding
          const parsedDelivery = parseYMD(deliveryDateStr)
          const parsedToday = parseYMD(todayISO)
          if (!parsedDelivery) throw new Error('Fecha inválida')
          if (parsedDelivery < parsedToday) {
            throw new Error('La fecha estimada no puede ser anterior a hoy.')
          }
          if (maxDeadline) {
            const parsedMax = parseYMD(maxDeadline)
            if (parsedMax && parsedDelivery > parsedMax) {
              throw new Error(
                'La fecha estimada no puede superar la Fecha Entrega Límite.'
              )
            }
          }

          // Subida opcional / requerida de documento tributario (migrada desde 'accept')
          let taxDocPath = null
          if (supplierDocTypes.length > 0) {
            try {
              // Mobile usa taxDocFileState.file, Desktop usa formData.taxDocument
              const maybe = isMobile
                ? taxDocFileState.file
                : finalData.taxDocument
              let file = null
              if (maybe instanceof File) file = maybe
              else if (maybe?.target?.files) file = maybe.target.files[0]
              else if (Array.isArray(maybe)) file = maybe[0]
              else if (maybe && maybe.files) file = maybe.files[0]
              if (file) {
                const up = await uploadInvoicePDF({
                  file,
                  supplierId,
                  orderId: selectedOrder.order_id,
                  userId: supplierId,
                })
                taxDocPath = up.path
              }
            } catch (errUp) {
              console.error(
                '[MyOrders] Error subiendo documento tributario:',
                errUp
              )
              showBanner({
                message: `⚠️ Documento tributario no subido: ${errUp.message}`,
                severity: 'warning',
                duration: 6000,
              })
            }
          }

          await partActions.dispatch(selectedOrder, deliveryDateStr)
          messageToUser =
            '🚚 El pedido fue despachado y está en tránsito.' +
            (taxDocPath ? ' (Documento subido)' : '')
          break
        }
        case 'deliver': {
          await partActions.deliver(selectedOrder)
          messageToUser = '📦 La entrega fue confirmada con éxito.'
          break
        }
        case 'cancel': {
          await partActions.cancel(selectedOrder, formData.cancelReason || '')
          messageToUser = '⚠️ El pedido fue cancelado.'
          break
        }
        // 'chat' action removed: contact modal now opened from the table row
        default:
          break
      }

      // Mostrar banner de éxito si la acción no fue 'chat'
      showBanner({
        message: messageToUser,
        severity: 'success',
        duration: 4000,
      })
      handleCloseModal() // Cierra el modal si la acción fue exitosa y no fue 'chat'
    } catch (error) {
      // Mostrar banner de error si hubo un problema
      showBanner({
        message: `❌ Error al procesar la acción: ${
          error.message || 'Intenta nuevamente.'
        }`,
        severity: 'error',
        duration: 5000,
      })
      console.error('Error al procesar acción del modal:', error)
    } finally {
      // setModalState(prev => ({ ...prev, loading: false })); // Quitar bandera de carga
    }
  }

  // Devuelve la configuración específica para cada tipo de modal
  const getModalConfig = () => {
    const { type } = modalState

    // Prefer the buyer's requested document types (from the selected order items) if present;
    // otherwise fall back to the supplier's offered document types.
    const buyerRequestedTypes = (() => {
      const items = modalState.selectedOrder?.items || []
      if (!Array.isArray(items)) return []
      return items
        .map((i) =>
          (i.document_type || i.documentType || '').toString().toLowerCase()
        )
        .filter(Boolean)
        .filter((t) => ['boleta', 'factura'].includes(t))
    })()

    const buyerSet = Array.from(new Set(buyerRequestedTypes))
    let docLabelSuffix = ''
    if (buyerSet.length > 0) {
      docLabelSuffix =
        buyerSet.length === 2
          ? '(Boleta/Factura)'
          : buyerSet[0] === 'boleta'
          ? '(Boleta)'
          : '(Factura)'
    } else {
      docLabelSuffix =
        supplierDocTypes.length === 0
          ? ''
          : supplierDocTypes.length === 2
          ? '(Boleta/Factura)'
          : supplierDocTypes[0] === 'boleta'
          ? '(Boleta)'
          : '(Factura)'
    }

    const showTaxUpload = supplierDocTypes.length > 0 || buyerSet.length > 0

    const configs = {
      accept: {
        title: (
          <Typography variant="h6" align="center" fontWeight={700}>
            Aceptar Pedido
          </Typography>
        ),
        submitButtonText: 'Confirmar',
        submitButtonColor: 'primary',
        showWarningIconHeader: false,
        type: MODAL_TYPES.ORDER_CHECK,
        isFormModal: true,
        children: (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* No inputs required for accept action */}
          </Box>
        ),
      },
      reject: {
        title: (
          <Typography variant="h6" align="center" fontWeight={700}>
            Rechazar Pedido
          </Typography>
        ),
        submitButtonText: 'Rechazar',
        submitButtonColor: 'error',
        showWarningIconHeader: false,
        type: MODAL_TYPES.ORDER_CHECK,
        isFormModal: true,
        children: (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              name="rejectionReason"
              label="Motivo de rechazo"
              multiline
              rows={3}
              fullWidth
              variant="outlined"
            />
          </Box>
        ),
      },
      dispatch: {
        title: (
          <Typography variant="h6" align="center" fontWeight={700}>
            Despachar Pedido
          </Typography>
        ),
        submitButtonText: 'Despachar',
        submitButtonColor: 'primary',
        showWarningIconHeader: false,
        type: MODAL_TYPES.ORDER_TRUCK || MODAL_TYPES.ORDER_BRIEFCASE,
        isFormModal: true,
        children: (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {(() => {
              const pickerMin = todayLocalISO()
              const pickerMax = modalState.selectedOrder
                ?.estimated_delivery_date
                ? toLocalYYYYMMDD(
                    modalState.selectedOrder.estimated_delivery_date
                  )
                : undefined
              return isMobile ? (
                <LocalizationProvider
                  dateAdapter={AdapterDateFns}
                  adapterLocale={es}
                >
                  <MobileDatePicker
                    label="Fecha estimada de entrega"
                    value={deliveryDate}
                    onChange={(newValue) => {
                      // Validar max
                      if (newValue && pickerMax) {
                        const pd = newValue
                        const pm = parseYMD(pickerMax)
                        if (pm && pd > pm) {
                          setDeliveryDate(pm)
                          try {
                            showBanner({
                              message:
                                'La fecha no puede superar la Fecha Entrega Límite. Se ajustó al máximo permitido.',
                              severity: 'warning',
                              duration: 3000,
                            })
                          } catch (_) {}
                          return
                        }
                      }
                      setDeliveryDate(newValue)
                    }}
                    minDate={parseYMD(pickerMin) || new Date()}
                    maxDate={pickerMax ? parseYMD(pickerMax) : undefined}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                      },
                    }}
                  />
                </LocalizationProvider>
              ) : (
                <TextField
                  name="deliveryDate"
                  label="Fecha estimada de entrega"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    min: pickerMin,
                    max: pickerMax,
                    onChange: (e) => {
                      try {
                        const val = e.target.value
                        if (!val || !pickerMax) return
                        const pd = parseYMD(val)
                        const pm = parseYMD(pickerMax)
                        if (pd && pm && pd > pm) {
                          e.target.value = pickerMax
                          try {
                            showBanner({
                              message:
                                'La fecha no puede superar la Fecha Entrega Límite. Se ajustó al máximo permitido.',
                              severity: 'warning',
                              duration: 3000,
                            })
                          } catch (_) {}
                        }
                      } catch (_) {}
                    },
                  }}
                  helperText={
                    pickerMax
                      ? `Hasta ${pickerMax}`
                      : 'Selecciona una fecha futura'
                  }
                />
              )
            })()}
            {showTaxUpload &&
              (isMobile ? (
                <MobileFileUpload
                  file={taxDocFileState.file}
                  error={
                    taxDocFileState.error ||
                    (taxDocTouched && !taxDocFileState.file
                      ? 'Archivo requerido'
                      : null)
                  }
                  onChange={(e) => {
                    setTaxDocTouched(true)
                    const file = e.target.files?.[0]
                    const validation = validateTaxPdf(file)
                    if (!validation.ok) {
                      setTaxDocFileState({
                        file: null,
                        error: validation.error,
                      })
                      return
                    }
                    setTaxDocFileState({ file, error: null })
                  }}
                  label={`Documento Tributario ${docLabelSuffix}`}
                  accept="application/pdf"
                />
              ) : (
                <TextField
                  name="taxDocument"
                  label={`Documento Tributario ${docLabelSuffix}`}
                  type="file"
                  fullWidth
                  sx={{ mt: 1 }}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ accept: 'application/pdf' }}
                  helperText={
                    taxDocFileState.error
                      ? taxDocFileState.error
                      : taxDocFileState.file
                      ? taxDocFileState.file.name
                      : 'Formato: PDF. Máx 500KB.'
                  }
                  error={
                    Boolean(taxDocFileState.error) ||
                    (taxDocTouched && !taxDocFileState.file)
                  }
                  onChange={(e) => {
                    setTaxDocTouched(true)
                    const file = e.target.files?.[0]
                    const validation = validateTaxPdf(file)
                    if (!validation.ok) {
                      setTaxDocFileState({
                        file: null,
                        error: validation.error,
                      })
                      return
                    }
                    setTaxDocFileState({ file, error: null })
                  }}
                />
              ))}
            {/* No optional message for dispatch action */}
          </Box>
        ),
      },
      cancel: {
        title: (
          <Typography variant="h6" align="center" fontWeight={700}>
            Cancelar Pedido
          </Typography>
        ),
        submitButtonText: 'Cancelar pedido',
        submitButtonColor: 'error',
        showWarningIconHeader: false,
        type: MODAL_TYPES.ORDER_CANCEL,
        isFormModal: true,
        children: (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              name="cancelReason"
              label="Motivo (opcional)"
              multiline
              rows={3}
              fullWidth
              variant="outlined"
            />
          </Box>
        ),
      },
      deliver: {
        title: (
          <Typography variant="h6" align="center" fontWeight={700}>
            Confirmar Entrega
          </Typography>
        ),
        submitButtonText: 'Confirmar',
        submitButtonColor: 'primary',
        showWarningIconHeader: false,
        type: MODAL_TYPES.ORDER_BRIEFCASE,
        isFormModal: true,
        children: (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
      // chat modal removed - use ContactModal from table rows for help/contact
    }

    return configs[type] || {}
  }

  // --- Renderizado Condicional ---

  // Muestra un indicador de carga si los pedidos están cargando y aún no hay datos
  if (loading && !orders.length) {
    return (
      <ThemeProvider theme={dashboardThemeCore}>
        <Box
          sx={{
            backgroundColor: 'background.default',
            minHeight: '100vh',
            pt: { xs: 4.5, md: 5 },
            px: { xs: 0, md: 3 },
            pb: 3,
            ml: { xs: 0, md: 10, lg: 14, xl: 24 },
          }}
        >
          <Container maxWidth={false} disableGutters={isMobile ? true : false} sx={{ width: '100%' }}>
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
              <AssignmentIcon
                sx={{ color: 'primary.main', fontSize: 36, mr: 1 }}
              />
              <Typography
                variant="h4"
                fontWeight={600}
                color="primary.main"
                gutterBottom
              >
                Mis Pedidos
              </Typography>
            </Box>
            {isMobile ? (
              <MobileSupplierOrdersSkeleton rows={3} />
            ) : (
              <TableSkeleton rows={7} columns={6} />
            )}
          </Container>
        </Box>
      </ThemeProvider>
    )
  }

  // Muestra un mensaje de error si ocurre un problema al cargar los pedidos
  if (error) {
    return (
      <ThemeProvider theme={dashboardThemeCore}>
        <Box
          sx={{
            // marginLeft: '210px', // Eliminado para ocupar todo el ancho
            backgroundColor: 'background.default',
            minHeight: '100vh',
            pt: { xs: 4.5, md: 5 },
            px: { xs: 0, md: 3 },
            pb: 3,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Container maxWidth={false} disableGutters={isMobile ? true : false} sx={{ width: '100%' }}>
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          </Container>
        </Box>
      </ThemeProvider>
    )
  }

  // Obtiene la configuración del modal basada en el estado actual
  const modalConfig = getModalConfig()
  const submitDisabled =
    (modalState.type === 'accept' && false) || // accept no longer requires tax upload
    (modalState.type === 'dispatch' &&
      ((supplierDocTypes.length > 0 &&
        (!taxDocFileState.file || !!taxDocFileState.error)) ||
        (isMobile && !deliveryDate))) ||
    // Disable submit while the action is being processed
    partActions.updating // prevent double submits / indicate processing to user


  // --- Renderizado Principal de la Página ---
  return (
    <ThemeProvider theme={dashboardThemeCore}>
      <Box
        sx={{
          // marginLeft: '210px', // Eliminado para ocupar todo el ancho
          backgroundColor: 'background.default',
          minHeight: '100vh',
          pt: { xs: 4.5, md: 5 }, // Padding top para espacio con el header
          px: { xs: 0, md: 3 }, // Padding horizontal
          pb: SPACING_BOTTOM_MAIN, // Padding bottom
          ml: { xs: 0, md: 6, lg: 14, xl: 24 }, // Reducir ml en md para dar más espacio a la tabla
        }}
      >
        <Container maxWidth={false} disableGutters={isMobile ? true : false} sx={{ width: { xs: '100%', md: '108%', lg: '100%', xl: '100%' } }}>
          {/* Título de la página */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <AssignmentIcon
              sx={{ color: 'primary.main', fontSize: 36, mr: 1 }}
            />
            <Typography
              variant="h4"
              fontWeight={600}
              color="primary.main"
              gutterBottom
            >
              Mis Pedidos
            </Typography>
          </Box>

          {/* Renderizado condicional mobile vs desktop */}
          {isMobile ? (
            <>
              {/* Mobile: FilterAccordion + MobileOfferCard */}
              <MobileFilterAccordion
                currentFilter={statusFilter}
                onFilterChange={setStatusFilter}
                filterOptions={filterOptions}
                label="Estado de pedidos"
              />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {filteredOrders.length === 0 ? (
                  // Diferenciar entre sin datos globales vs sin datos por filtro
                  (!orders || orders.length === 0) ? (
                    <EmptyStateGlobal />
                  ) : (
                    <EmptyStateFiltered />
                  )
                ) : (
                  filteredOrders.map((order) => (
                    <MobileOrderCard
                      key={order.order_id}
                      order={order}
                      onAction={(actionType, orderData) =>
                        handleActionClick(orderData, actionType)
                      }
                    />
                  ))
                )}
              </Box>
            </>
          ) : (
            <>
              {/* Desktop: TableFilter + Table o Estado Vacío */}
              <TableFilter
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
              />
              {filteredOrders.length === 0 ? (
                // Diferenciar entre sin datos globales vs sin datos por filtro
                (!orders || orders.length === 0) ? (
                  <EmptyStateGlobal />
                ) : (
                  <EmptyStateFiltered />
                )
              ) : (
                <Table
                  orders={filteredOrders}
                  onActionClick={handleActionClick}
                />
              )}
            </>
          )}

          {/* Modal de acciones (aceptar, rechazar, despachar, entregar, chatear) */}
          {modalState.isOpen && modalState.selectedOrder && (
            <Modal
              isOpen={modalState.isOpen}
              onClose={handleCloseModal}
              // El onSubmit del modal será `handleModalSubmit` para formularios,
              // o una función específica si `modalConfig.onSubmit` existe (como en el caso de 'chat').
              onSubmit={modalConfig.onSubmit || handleModalSubmit}
              order={modalState.selectedOrder} // Pasa el objeto de la orden al modal
              submitDisabled={submitDisabled}
              {...modalConfig} // Extiende la configuración específica del tipo de modal
            />
          )}
        </Container>
      </Box>
    </ThemeProvider>
  )
}

const WrappedMyOrdersPage = () => {
  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <SupplierErrorBoundary onRetry={handleRetry}>
      <MyOrdersPage />
    </SupplierErrorBoundary>
  )
}

export default WrappedMyOrdersPage
