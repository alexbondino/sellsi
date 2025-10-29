import { useState, useEffect, useCallback } from 'react'
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
  Divider
} from '@mui/material'
import {
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  AttachMoney as AttachMoneyIcon,
  GetApp as GetAppIcon,
  HourglassEmpty as HourglassEmptyIcon
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

// 🎭 Importar mocks para desarrollo (comentar en producción)
import mockData from '../mocks/paymentReleasesMocks'
const USE_MOCKS = true // ✅ Migración ejecutada - usando Supabase real

const PaymentReleasesTable = () => {
  // Estados principales
  const [releases, setReleases] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  // Estados de filtros
  const [filters, setFilters] = useState({
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

  // Cargar datos iniciales
  useEffect(() => {
    loadData()
  }, [filters])

  const loadData = async () => {
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

      const [releasesData, statsData] = await Promise.all([
        getPaymentReleases(filters),
        getPaymentReleaseStats(filters)
      ])

      setReleases(releasesData || [])
      setStats(statsData || null)
    } catch (err) {
      console.error('Error cargando datos:', err)
      setError(err.message || 'Error al cargar las liberaciones de pago')
    } finally {
      setLoading(false)
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
      await releasePayment(
        selectedRelease.id,
        releaseData.admin_id,
        releaseData.notes,
        releaseData.proof_url
      )
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
      await cancelPaymentRelease(releaseId, reason)
      await loadData() // Recargar datos
    } catch (err) {
      console.error('Error cancelando liberación:', err)
      setError(err.message || 'Error al cancelar la liberación')
    }
  }

  const handleExportReport = async () => {
    try {
      const report = await getPaymentReleasesReport(filters)
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `liberaciones-pago-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error exportando reporte:', err)
      setError('Error al generar el reporte')
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
      valueGetter: (params) => formatDate(params.value)
    },
    {
      field: 'delivered_at',
      headerName: 'Fecha Entrega',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => formatDate(params.value)
    },
    {
      field: 'days_since_delivery',
      headerName: 'Días Entregado',
      flex: 1,
      minWidth: 130,
      renderCell: (params) => {
        const days = params.value
        const color = days > 7 ? 'error' : days > 3 ? 'warning' : 'default'
        return (
          <Chip
            label={`${days} días`}
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
  const rowsWithDays = releases.map(release => {
    if (!release.delivered_at) return { ...release, days_since_delivery: 0 }
    
    const deliveredDate = new Date(release.delivered_at)
    const today = new Date()
    const diffTime = today - deliveredDate
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    return {
      ...release,
      days_since_delivery: diffDays >= 0 ? diffDays : 0
    }
  })

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
            disabled={loading || releases.length === 0}
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
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  {filters.status === 'all' ? 'Todos' : 'Pendientes'}
                </Typography>
                <Typography variant="h4" fontWeight={600} color="warning.main">
                  {stats.pending_count}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatCLP(stats.pending_amount)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  {filters.status === 'all' ? 'Todos' : 'Liberados'}
                </Typography>
                <Typography variant="h4" fontWeight={600} color="success.main">
                  {stats.released_count}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatCLP(stats.released_amount)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  {filters.status === 'all' ? 'Todos' : 'Total Procesado'}
                </Typography>
                <Typography variant="h4" fontWeight={600}>
                  {stats.total_count}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatCLP(stats.total_amount)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  {filters.status === 'all' ? 'Todos' : 'Promedio Días'}
                </Typography>
                <Typography variant="h4" fontWeight={600} color="info.main">
                  {stats.avg_days_to_release?.toFixed(1) || '0'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Días para liberar
                </Typography>
              </CardContent>
            </Card>
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
              <MenuItem value={STATUS.PENDING}>Pendiente</MenuItem>
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
              InputLabelProps={{ shrink: true }}
              value={filters.date_from}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Fecha Hasta"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={filters.date_to}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
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
      <Paper sx={{ width: '100%' }}>
        <DataGrid
          rows={rowsWithDays}
          columns={columns}
          loading={loading}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 25, 50, 100]}
          disableRowSelectionOnClick
          autoHeight
          disableColumnResize={false}
          localeText={esES.components.MuiDataGrid.defaultProps.localeText}
          sx={{
            width: '100%',
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
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  gap: 2,
                  color: 'text.secondary'
                }}
              >
                <HourglassEmptyIcon sx={{ fontSize: 64, opacity: 0.3 }} />
                <Typography variant="h6" color="text.secondary">
                  No hay liberaciones de pago
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {filters.status || filters.date_from || filters.date_to
                    ? 'No se encontraron resultados con los filtros aplicados'
                    : 'Las solicitudes aparecerán automáticamente cuando los proveedores confirmen entregas'}
                </Typography>
                {(filters.status || filters.date_from || filters.date_to) && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleClearFilters}
                  >
                    Limpiar Filtros
                  </Button>
                )}
              </Box>
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
