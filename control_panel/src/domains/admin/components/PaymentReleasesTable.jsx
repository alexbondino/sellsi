import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  TextField,
  MenuItem,
  Stack,
  Divider,
  InputAdornment
} from '@mui/material'
import {
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  AttachMoney as AttachMoneyIcon,
  GetApp as GetAppIcon,
  SearchOff as SearchOffIcon,
  CalendarToday as CalendarTodayIcon
} from '@mui/icons-material'
import { DataGrid } from '@mui/x-data-grid'
import { esES } from '@mui/x-data-grid/locales'
import {
  getPaymentReleases,
  getPaymentReleaseStats,
  releasePayment,
  cancelPaymentRelease,
  getPaymentReleasesReport,
  formatCLP,
  formatDate,
  daysBetween,
  STATUS,
  STATUS_COLORS,
  STATUS_LABELS
} from '../services/adminPaymentReleaseService'
import ReleasePaymentModal from '../modals/ReleasePaymentModal'
import PaymentReleaseDetailsModal from '../modals/PaymentReleaseDetailsModal'
import { exportPaymentReleasesToExcel } from '../utils/exportPaymentReleasesToExcel'

// 🎭 Importar mocks para desarrollo (comentar en producción)
import mockData from '../mocks/paymentReleasesMocks'
const USE_MOCKS = false // ✅ Migración ejecutada - usando Supabase real

const PaymentReleasesTable = () => {
  // Estados principales
  const [releases, setReleases] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  // Estados de filtros
  const [filters, setFilters] = useState({
    // Default to 'pending' (short form used by UI). Service maps 'pending' -> 'pending_release' for DB queries.
    status: 'pending', // Por defecto mostrar pendientes. Usar 'all' para todos
    supplier_id: '',
    date_from: '',
    date_to: ''
  })

  // Estados de modales
  const [releaseModalOpen, setReleaseModalOpen] = useState(false)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedRelease, setSelectedRelease] = useState(null)

  // Estados de paginación
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10
  })

  // Refs para inputs de fecha
  const dateFromRef = useRef(null)
  const dateToRef = useRef(null)

  // Cargar datos iniciales
  const fetchInProgressRef = useRef(false)

  useEffect(() => {
    loadData()
  }, [filters])

  const loadData = async () => {
    // Evitar llamadas concurrentes (defensa frente a múltiples mounts/refresh rápidos)
    if (fetchInProgressRef.current) {
      console.info('loadData: request already in progress, skipping')
      return
    }

    fetchInProgressRef.current = true
    const startedAt = Date.now()

    try {
      setLoading(true)
      setError(null)

      // 🎭 Modo desarrollo con mocks (descomentar para testing sin backend)
      if (USE_MOCKS) {
        await mockData.mockDelay(800)
        const filteredReleases = (filters.status && filters.status !== 'all')
          ? mockData.releases.filter(r => r.status === filters.status)
          : mockData.releases
        setReleases(filteredReleases)
        setStats(mockData.stats)
        setLoading(false)
        return
      }

      const [releasesResponse, statsResponse] = await Promise.all([
        getPaymentReleases(filters),
        getPaymentReleaseStats(filters)
      ])

      if (releasesResponse.success) {
        console.info('Releases loaded (start => end):', releasesResponse.data && releasesResponse.data.length)
        console.log('🔍 PRIMER REGISTRO COMPLETO:', releasesResponse.data?.[0])
        console.log('🔍 purchased_at del primer registro:', releasesResponse.data?.[0]?.purchased_at)
        console.log('🔍 delivery_confirmed_at del primer registro:', releasesResponse.data?.[0]?.delivery_confirmed_at)
        const data = Array.isArray(releasesResponse.data) ? releasesResponse.data : []
        // Deduplicar por id (protección defensiva frente a respuestas duplicadas)
        const unique = []
        const seen = new Set()
        const duplicates = []
        data.forEach(r => {
          if (seen.has(r.id)) {
            duplicates.push(r.id)
          } else {
            seen.add(r.id)
            unique.push(r)
          }
        })
        if (duplicates.length) {
          console.warn('Se detectaron liberaciones duplicadas en la respuesta:', Array.from(new Set(duplicates)))
        }
        setReleases(unique)
      } else {
        console.error('Error loading releases:', releasesResponse.error)
        setError(releasesResponse.error || 'Error al cargar datos')
      }

      if (statsResponse.success) {
        setStats(statsResponse.data || null)
      }
    } catch (err) {
      console.error('Error cargando datos:', err)
      setError(err.message || 'Error al cargar las liberaciones de pago')
    } finally {
      setLoading(false)
      fetchInProgressRef.current = false
      const duration = Date.now() - startedAt
      console.info(`loadData completed in ${duration}ms`)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleClearFilters = () => {
    setFilters({
      status: 'all',
      supplier_id: '',
      date_from: '',
      date_to: ''
    })
  }

  const handleOpenReleaseModal = (release) => {
    setSelectedRelease(release)
    setReleaseModalOpen(true)
  }

  const handleOpenDetailsModal = (release) => {
    setSelectedRelease(release)
    setDetailsModalOpen(true)
  }

  const handleReleasePayment = async (releaseData) => {
    try {
      const response = await releasePayment(
        selectedRelease.id,
        releaseData.admin_id,
        releaseData.notes,
        releaseData.proof_url
      )

      if (!response.success) {
        throw new Error(response.error || 'Error al liberar pago')
      }

      setReleaseModalOpen(false)
      setSelectedRelease(null)
      await loadData() // Recargar datos
    } catch (err) {
      console.error('Error liberando pago:', err)
      throw err // Dejar que el modal maneje el error
    }
  }

  const handleCancelRelease = async (releaseId, reason) => {
    try {
      const response = await cancelPaymentRelease(releaseId, reason)

      if (!response.success) {
        throw new Error(response.error || 'Error al cancelar la liberación')
      }

      await loadData() // Recargar datos
    } catch (err) {
      console.error('Error cancelando liberación:', err)
      setError(err.message || 'Error al cancelar la liberación')
    }
  }

  const handleExportReport = async () => {
    try {
      // Si se especificaron fechas, obtener reporte desde servicio
      if (filters.date_from && filters.date_to) {
        const report = await getPaymentReleasesReport(filters.date_from, filters.date_to)
        const reportReleases = report?.releases || []
        if (reportReleases.length === 0) {
          setError('No hay datos para exportar en el período seleccionado')
          return
        }
        exportPaymentReleasesToExcel(reportReleases)
        return
      }

      if (releases.length === 0) {
        setError('No hay datos para exportar')
        return
      }

      exportPaymentReleasesToExcel(releases)
    } catch (err) {
      console.error('Error exportando reporte:', err)
      setError(err.message || 'Error al generar el reporte Excel')
    }
  }

  // Definir columnas del DataGrid
  const columns = [
    {
      field: 'order_id',
      headerName: 'Orden',
      flex: 0.8,
      minWidth: 100,
      renderCell: (params) => (
        <Chip
          label={`#${params.value}`}
          size="small"
          variant="outlined"
          color="primary"
        />
      )
    },
    {
      field: 'supplier_name',
      headerName: 'Proveedor',
      flex: 1.5,
      minWidth: 200,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight={500}>
            {params.value || 'N/A'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ID: {params.row.supplier_id}
          </Typography>
        </Box>
      )
    },
    {
      field: 'amount',
      headerName: 'Monto',
      flex: 1,
      minWidth: 130,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={600} color="success.main">
          {formatCLP(params.value)}
        </Typography>
      )
    },
    {
      field: 'purchased_at',
      headerName: 'Fecha Compra',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => {
        // MUI puede pasar el valor directamente o como params.value
        const value = typeof params === 'string' ? params : params?.value
        return formatDate(value)
      }
    },
    {
      field: 'delivery_confirmed_at',
      headerName: 'Fecha Entrega',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => {
        // MUI puede pasar el valor directamente o como params.value
        const value = typeof params === 'string' ? params : params?.value
        return formatDate(value)
      }
    },
    {
      field: 'days_since_delivery',
      headerName: 'Días Entregado',
      flex: 1,
      minWidth: 130,
      renderCell: (params) => {
        const raw = params.value
        // Si la vista no trae el valor, calcular por fallback usando delivery_confirmed_at
        let days = Number.isFinite(raw) ? raw : (params.row?.delivery_confirmed_at ? daysBetween(params.row.delivery_confirmed_at, params.row.released_at || new Date().toISOString()) : null)
        const color = (typeof days === 'number') ? (days > 7 ? 'error' : days > 3 ? 'warning' : 'default') : 'default'
        const label = (typeof days === 'number') ? `${days} días` : 'N/A'
        return (
          <Chip
            label={label}
            size="small"
            color={color}
          />
        )
      }
    },
    {
      field: 'status',
      headerName: 'Estado',
      flex: 1,
      minWidth: 130,
      renderCell: (params) => {
        const status = params.value
        const color = STATUS_COLORS[status] || 'default'
        const label = STATUS_LABELS[status] || status
        return (
          <Chip
            label={label}
            size="small"
            color={color}
            icon={
              status === STATUS.RELEASED ? <CheckCircleIcon /> :
              status === STATUS.CANCELLED ? <CancelIcon /> :
              <AccessTimeIcon />
            }
          />
        )
      }
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      flex: 1,
      minWidth: 150,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Ver detalles">
            <IconButton
              size="small"
              onClick={() => handleOpenDetailsModal(params.row)}
            >
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {params.row.status === STATUS.PENDING && (
            <Tooltip title="Marcar como liberado">
              <IconButton
                size="small"
                color="success"
                onClick={() => handleOpenReleaseModal(params.row)}
              >
                <AttachMoneyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )
    }
  ]

  // Calcular días desde la entrega para cada registro
  // NOTA: La vista ya trae days_since_delivery calculado, usamos ese valor directamente
  const rows = Array.isArray(releases) ? releases : []

  return (
    <Box sx={{ p: 3, width: '100%', overflowX: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" fontWeight={600}>
          💰 Liberación de Pagos a Proveedores
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<GetAppIcon />}
            onClick={handleExportReport}
            disabled={loading || (releases.length === 0 && !(filters.date_from && filters.date_to))}
          >
            Exportar
          </Button>
          <Tooltip title="Actualizar">
            <IconButton onClick={handleRefresh} disabled={refreshing}>
              <RefreshIcon className={refreshing ? 'rotating' : ''} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Tarjetas de estadísticas */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* Card: Pendientes */}
          <Grid item xs={12} sm={6} md={3}>
            <Tooltip 
              title="Liberaciones de pago pendientes de procesar. Estos pagos están esperando ser liberados a los proveedores tras confirmar la entrega."
              placement="top"
              arrow
            >
              <Card sx={{ cursor: 'help' }}>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <AccessTimeIcon color="warning" fontSize="small" />
                    <Typography color="text.secondary" variant="body2" fontWeight={500}>
                      Pendientes
                    </Typography>
                  </Stack>
                  <Typography variant="h4" fontWeight={700} color="warning.main">
                    {stats.pending_release || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {formatCLP(stats.pending_amount || 0)}
                  </Typography>
                </CardContent>
              </Card>
            </Tooltip>
          </Grid>

          {/* Card: Liberados */}
          <Grid item xs={12} sm={6} md={3}>
            <Tooltip 
              title="Pagos que ya han sido liberados y transferidos a los proveedores. Estas transacciones han sido completadas exitosamente."
              placement="top"
              arrow
            >
              <Card sx={{ cursor: 'help' }}>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <CheckCircleIcon color="success" fontSize="small" />
                    <Typography color="text.secondary" variant="body2" fontWeight={500}>
                      Liberados
                    </Typography>
                  </Stack>
                  <Typography variant="h4" fontWeight={700} color="success.main">
                    {stats.released || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {formatCLP(stats.released_amount || 0)}
                  </Typography>
                </CardContent>
              </Card>
            </Tooltip>
          </Grid>

          {/* Card: Total */}
          <Grid item xs={12} sm={6} md={3}>
            <Tooltip 
              title="Total de liberaciones de pago en el sistema (pendientes + liberados + cancelados). Incluye el monto acumulado de todas las transacciones."
              placement="top"
              arrow
            >
              <Card sx={{ cursor: 'help' }}>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <AttachMoneyIcon color="primary" fontSize="small" />
                    <Typography color="text.secondary" variant="body2" fontWeight={500}>
                      Total Procesado
                    </Typography>
                  </Stack>
                  <Typography variant="h4" fontWeight={700} color="primary.main">
                    {stats.total || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {formatCLP(stats.total_amount || 0)}
                  </Typography>
                </CardContent>
              </Card>
            </Tooltip>
          </Grid>

          {/* Card: Promedio Días */}
          <Grid item xs={12} sm={6} md={3}>
            <Tooltip 
              title="Promedio de días transcurridos entre la confirmación de entrega por el proveedor y la liberación del pago por el administrador"
              placement="top"
              arrow
            >
              <Card sx={{ cursor: 'help' }}>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <InfoIcon color="info" fontSize="small" />
                    <Typography color="text.secondary" variant="body2" fontWeight={500}>
                      Promedio Días
                    </Typography>
                  </Stack>
                  <Typography variant="h4" fontWeight={700} color="info.main">
                    {stats.avg_days_to_release?.toFixed(1) || '0.0'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Días para liberar
                  </Typography>
                </CardContent>
              </Card>
            </Tooltip>
          </Grid>
        </Grid>
      )}

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Filtros
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Estado"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="pending">Pendiente</MenuItem>
              <MenuItem value={STATUS.RELEASED}>Liberado</MenuItem>
              <MenuItem value={STATUS.CANCELLED}>Cancelado</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Fecha Desde"
              type="date"
              inputRef={dateFromRef}
              InputLabelProps={{ shrink: true }}
              value={filters.date_from}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      edge="end"
                      onClick={() => dateFromRef.current?.showPicker?.()}
                      sx={{ p: 0.5 }}
                    >
                      <CalendarTodayIcon fontSize="small" color="action" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Fecha Hasta"
              type="date"
              inputRef={dateToRef}
              InputLabelProps={{ shrink: true }}
              value={filters.date_to}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      edge="end"
                      onClick={() => dateToRef.current?.showPicker?.()}
                      sx={{ p: 0.5 }}
                    >
                      <CalendarTodayIcon fontSize="small" color="action" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleClearFilters}
              disabled={filters.status === 'all' && !filters.date_from && !filters.date_to}
            >
              Limpiar Filtros
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Mensaje de error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* DataGrid */}
      <Paper sx={{ width: '100%', height: 600 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 25, 50, 100]}
          disableRowSelectionOnClick
          disableColumnResize={false}
          localeText={esES.components.MuiDataGrid.defaultProps.localeText}
          sx={{
            width: '100%',
            height: '100%',
            border: 'none',
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid rgba(224, 224, 224, 0.5)'
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
              fontWeight: 600
            }
          }}
          // Estado vacío personalizado
          slots={{
            noRowsOverlay: () => (
              <Stack
                height="100%"
                alignItems="center"
                justifyContent="center"
                spacing={2}
                sx={{ p: 3, color: 'text.secondary' }}
              >
                <SearchOffIcon sx={{ fontSize: 60, opacity: 0.2 }} />
                <Box textAlign="center">
                  <Typography variant="h6" gutterBottom>
                    No hay liberaciones de pago
                  </Typography>
                  <Typography variant="body2" sx={{ maxWidth: 400, mx: 'auto', opacity: 0.8 }}>
                    {(filters.status !== 'all' || filters.date_from || filters.date_to)
                      ? 'No se encontraron resultados con los filtros actuales. Intenta ampliando la búsqueda.'
                      : 'No hay solicitudes pendientes en este momento. Aparecerán aquí cuando los proveedores confirmen sus entregas.'}
                  </Typography>
                </Box>
                {(filters.status !== 'all' || filters.date_from || filters.date_to) && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleClearFilters}
                    startIcon={<RefreshIcon />}
                  >
                    Limpiar Filtros
                  </Button>
                )}
              </Stack>
            )
          }}
        />
      </Paper>

      {/* Modales */}
      {selectedRelease && (
        <>
          <ReleasePaymentModal
            open={releaseModalOpen}
            onClose={() => {
              setReleaseModalOpen(false)
              setSelectedRelease(null)
            }}
            release={selectedRelease}
            onConfirm={handleReleasePayment}
          />

          <PaymentReleaseDetailsModal
            open={detailsModalOpen}
            onClose={() => {
              setDetailsModalOpen(false)
              setSelectedRelease(null)
            }}
            release={selectedRelease}
          />
        </>
      )}

      {/* CSS para animación de refresh */}
      <style>
        {`
          @keyframes rotate {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
          .rotating {
            animation: rotate 1s linear infinite;
          }
        `}
      </style>
    </Box>
  )
}

export default PaymentReleasesTable
