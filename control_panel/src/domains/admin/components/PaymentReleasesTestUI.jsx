/**
 * 🧪 Componente de Testing Visual para Modales de Liberación de Pagos
 * 
 * Este componente permite probar visualmente los modales sin necesidad
 * de tener el backend funcionando. Usa datos mock realistas.
 * 
 * USO:
 * 1. Descomentar import en AdminDashboard.jsx temporalmente
 * 2. Agregar pestaña temporal con este componente
 * 3. Probar todos los escenarios
 * 4. Eliminar cuando se confirme que funciona en producción
 * 
 * @author Panel Administrativo Sellsi
 * @date 10 de Enero de 2025
 */

import { useState } from 'react'
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Paper,
  Divider,
  Chip,
  Grid
} from '@mui/material'
import {
  BugReport as BugReportIcon,
  Visibility as VisibilityIcon,
  AttachMoney as AttachMoneyIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material'
import ReleasePaymentModal from '../modals/ReleasePaymentModal'
import PaymentReleaseDetailsModal from '../modals/PaymentReleaseDetailsModal'
import mockData from '../mocks/paymentReleasesMocks'

const PaymentReleasesTestUI = () => {
  const [releaseModalOpen, setReleaseModalOpen] = useState(false)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedRelease, setSelectedRelease] = useState(null)
  const [result, setResult] = useState(null)

  // Handlers para los diferentes escenarios
  const handleOpenReleaseModal = (release) => {
    setSelectedRelease(release)
    setReleaseModalOpen(true)
    setResult(null)
  }

  const handleOpenDetailsModal = (release) => {
    setSelectedRelease(release)
    setDetailsModalOpen(true)
  }

  const handleConfirmRelease = async (formData) => {
    console.log('✅ Pago liberado (simulado):', formData)
    setResult({
      type: 'success',
      message: `Pago de ${mockData.releases[0].supplier_name} liberado correctamente`,
      data: formData
    })
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <BugReportIcon color="warning" fontSize="large" />
          <Typography variant="h4" fontWeight={600}>
            🧪 Testing Visual - Liberación de Pagos
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Prueba visual de modales con datos mock. Este componente es solo para desarrollo.
        </Typography>
        <Divider sx={{ mt: 2 }} />
      </Box>

      {/* Resultado de última acción */}
      {result && (
        <Paper
          sx={{
            p: 2,
            mb: 3,
            bgcolor: result.type === 'success' ? 'success.light' : 'error.light',
            color: 'white'
          }}
        >
          <Typography variant="subtitle1" fontWeight={600}>
            {result.message}
          </Typography>
          <Typography variant="caption">
            {JSON.stringify(result.data, null, 2)}
          </Typography>
        </Paper>
      )}

      {/* Escenarios de Prueba */}
      <Grid container spacing={3}>
        {/* ESCENARIO 1: Release Pendiente */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              1️⃣ Release Pendiente
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Proveedor: {mockData.releases[0].supplier_name}
              <br />
              Monto: ${mockData.releases[0].amount.toLocaleString('es-CL')}
              <br />
              Estado: <Chip label="Pendiente" color="warning" size="small" />
            </Typography>
            <Stack spacing={1}>
              <Button
                variant="contained"
                color="success"
                startIcon={<AttachMoneyIcon />}
                onClick={() => handleOpenReleaseModal(mockData.releases[0])}
                fullWidth
              >
                Abrir Modal de Liberación
              </Button>
              <Button
                variant="outlined"
                startIcon={<VisibilityIcon />}
                onClick={() => handleOpenDetailsModal(mockData.releases[0])}
                fullWidth
              >
                Ver Detalles
              </Button>
            </Stack>
          </Paper>
        </Grid>

        {/* ESCENARIO 2: Release Urgente (8 días) */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              2️⃣ Release Urgente (8 días)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Proveedor: {mockData.releases[1].supplier_name}
              <br />
              Monto: ${mockData.releases[1].amount.toLocaleString('es-CL')}
              <br />
              Estado: <Chip label="Pendiente - 8 días" color="error" size="small" />
            </Typography>
            <Stack spacing={1}>
              <Button
                variant="contained"
                color="success"
                startIcon={<AttachMoneyIcon />}
                onClick={() => handleOpenReleaseModal(mockData.releases[1])}
                fullWidth
              >
                Abrir Modal de Liberación
              </Button>
              <Button
                variant="outlined"
                startIcon={<VisibilityIcon />}
                onClick={() => handleOpenDetailsModal(mockData.releases[1])}
                fullWidth
              >
                Ver Detalles
              </Button>
            </Stack>
          </Paper>
        </Grid>

        {/* ESCENARIO 3: Release Liberado */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              3️⃣ Release Liberado (con comprobante)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Proveedor: {mockData.releases[3].supplier_name}
              <br />
              Monto: ${mockData.releases[3].amount.toLocaleString('es-CL')}
              <br />
              Estado: <Chip label="Liberado" color="success" size="small" icon={<CheckCircleIcon />} />
            </Typography>
            <Stack spacing={1}>
              <Button
                variant="outlined"
                startIcon={<VisibilityIcon />}
                onClick={() => handleOpenDetailsModal(mockData.releases[3])}
                fullWidth
              >
                Ver Detalles (con comprobante)
              </Button>
            </Stack>
          </Paper>
        </Grid>

        {/* ESCENARIO 4: Release Cancelado */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              4️⃣ Release Cancelado
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Proveedor: {mockData.releases[6].supplier_name}
              <br />
              Monto: ${mockData.releases[6].amount.toLocaleString('es-CL')}
              <br />
              Estado: <Chip label="Cancelado" color="error" size="small" icon={<CancelIcon />} />
            </Typography>
            <Stack spacing={1}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<VisibilityIcon />}
                onClick={() => handleOpenDetailsModal(mockData.releases[6])}
                fullWidth
              >
                Ver Detalles (cancelado)
              </Button>
            </Stack>
          </Paper>
        </Grid>

        {/* ESCENARIO 5: Release Monto Alto */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              5️⃣ Release Monto Alto ($1.8M)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Proveedor: {mockData.releases[2].supplier_name}
              <br />
              Monto: ${mockData.releases[2].amount.toLocaleString('es-CL')}
              <br />
              Estado: <Chip label="Pendiente" color="warning" size="small" />
            </Typography>
            <Stack spacing={1}>
              <Button
                variant="contained"
                color="success"
                startIcon={<AttachMoneyIcon />}
                onClick={() => handleOpenReleaseModal(mockData.releases[2])}
                fullWidth
              >
                Abrir Modal de Liberación
              </Button>
              <Button
                variant="outlined"
                startIcon={<VisibilityIcon />}
                onClick={() => handleOpenDetailsModal(mockData.releases[2])}
                fullWidth
              >
                Ver Detalles
              </Button>
            </Stack>
          </Paper>
        </Grid>

        {/* ESCENARIO 6: Release Liberado sin Comprobante */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              6️⃣ Release Liberado (sin comprobante)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Proveedor: {mockData.releases[4].supplier_name}
              <br />
              Monto: ${mockData.releases[4].amount.toLocaleString('es-CL')}
              <br />
              Estado: <Chip label="Liberado" color="success" size="small" />
            </Typography>
            <Stack spacing={1}>
              <Button
                variant="outlined"
                startIcon={<VisibilityIcon />}
                onClick={() => handleOpenDetailsModal(mockData.releases[4])}
                fullWidth
              >
                Ver Detalles (sin comprobante)
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

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
            onConfirm={handleConfirmRelease}
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

      {/* Footer con info */}
      <Paper sx={{ p: 2, mt: 4, bgcolor: 'info.light' }}>
        <Typography variant="body2" color="info.contrastText">
          ℹ️ <strong>Nota:</strong> Este componente es solo para testing visual. 
          Los datos son mocks y las acciones no afectan la base de datos real.
          Eliminar antes de desplegar a producción.
        </Typography>
      </Paper>
    </Container>
  )
}

export default PaymentReleasesTestUI
