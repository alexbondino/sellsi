import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  Divider,
  Chip,
  Stack,
  CircularProgress
} from '@mui/material'
import {
  Warning as WarningIcon,
  AttachMoney as AttachMoneyIcon
} from '@mui/icons-material'
import { formatCLP, formatDate, getSupplierBankInfo, computePayout } from '../services/adminPaymentReleaseService'
import { useCurrentAdmin } from '../hooks/useCurrentAdmin'

const ReleasePaymentModal = ({ open, onClose, release, onConfirm }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [bankInfo, setBankInfo] = useState(null)
  const [bankInfoLoading, setBankInfoLoading] = useState(false)
  const [bankInfoError, setBankInfoError] = useState(null)
  const [formData, setFormData] = useState({
    admin_id: '',
    notes: '',
    proof_url: ''
  })

  // 🔐 Obtener admin autenticado
  const { adminId, adminName, loading: adminLoading } = useCurrentAdmin()

  // Actualizar admin_id cuando se cargue
  useEffect(() => {
    if (adminId) {
      setFormData(prev => ({
        ...prev,
        admin_id: adminId
      }))
    }
  }, [adminId])

  // Cargar información bancaria del proveedor
  useEffect(() => {
    let cancelled = false

    const run = async () => {
      if (!open || !release?.supplier_id) return

      setBankInfoLoading(true)
      setBankInfoError(null)
      try {
        const response = await getSupplierBankInfo(release.supplier_id)
        if (cancelled) return
        if (response?.success) {
          setBankInfo(response.data || null)
        } else {
          setBankInfo(null)
          setBankInfoError(response?.error || 'No fue posible cargar la información bancaria')
        }
      } catch (err) {
        if (cancelled) return
        setBankInfo(null)
        setBankInfoError(err?.message || 'No fue posible cargar la información bancaria')
      } finally {
        if (!cancelled) setBankInfoLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [open, release?.supplier_id])

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setError(null)

      // Validaciones
      if (!formData.admin_id) {
        setError('Debes estar autenticado como administrador')
        return
      }

      // Llamar al callback de confirmación
      await onConfirm(formData)

      // Resetear formulario y cerrar
      setFormData({
        admin_id: '',
        notes: '',
        proof_url: ''
      })
      onClose()
    } catch (err) {
      console.error('Error en modal:', err)
      setError(err.message || 'Error al liberar el pago')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setFormData({
        admin_id: '',
        notes: '',
        proof_url: ''
      })
      setError(null)
      setBankInfo(null)
      setBankInfoError(null)
      onClose()
    }
  }

  if (!release) return null

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AttachMoneyIcon color="success" />
          <Typography variant="h6" fontWeight={600}>
            Liberar Pago a Proveedor
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
      {/* Alerta de advertencia */}
      <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 3 }}>
        <Typography variant="body2" fontWeight={500}>
          ⚠️ Registro de liberación de pago
        </Typography>
        <Typography variant="caption">
          Al confirmar, marcarás este pago como liberado en el sistema. La transferencia bancaria debe realizarse manualmente de forma externa.
        </Typography>
      </Alert>        {/* Información del pago */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom fontWeight={600}>
            Información del Pago
          </Typography>
          <Divider sx={{ my: 1 }} />

          <Stack spacing={1.5}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Orden:
              </Typography>
              <Chip label={`#${release.order_id}`} size="small" variant="outlined" />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Proveedor:
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {release.supplier_name || `ID: ${release.supplier_id}`}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Monto bruto:
                </Typography>
                <Typography variant="body2">
                  {formatCLP(release.amount)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Comisión Sellsi (3%): {formatCLP((typeof computePayout === 'function' ? computePayout(release.amount).commission : Math.round((parseFloat(release.amount)||0) * 0.03)))}
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" color="text.secondary">
                  Monto a liberar:
                </Typography>
                <Typography variant="h6" color="success.main" fontWeight={600}>
                  {formatCLP((typeof computePayout === 'function' ? computePayout(release.amount).payout : Math.round((parseFloat(release.amount)||0) * 0.97)))}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Fecha de compra:
              </Typography>
              <Typography variant="body2">
                {formatDate(release.purchased_at)}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Fecha de entrega:
              </Typography>
              <Typography variant="body2">
                {formatDate(release.delivery_confirmed_at)}
              </Typography>
            </Box>

            {release.buyer_name && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Comprador:
                </Typography>
                <Typography variant="body2">
                  {release.buyer_name}
                </Typography>
              </Box>
            )}
          </Stack>
        </Box>

        {/* Información de transferencia */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom fontWeight={600}>
            Información de Transferencia
          </Typography>
          <Divider sx={{ my: 1 }} />

          {bankInfoLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={18} />
              <Typography variant="body2" color="text.secondary">
                Cargando información bancaria...
              </Typography>
            </Box>
          ) : bankInfoError ? (
            <Alert severity="error" sx={{ mt: 1 }}>
              {bankInfoError}
            </Alert>
          ) : bankInfo ? (
            <Stack spacing={1.25}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                <Typography variant="body2" color="text.secondary">Titular:</Typography>
                <Typography variant="body2" fontWeight={500}>{bankInfo.account_holder || 'N/A'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                <Typography variant="body2" color="text.secondary">RUT:</Typography>
                <Typography variant="body2" fontWeight={500}>{bankInfo.transfer_rut || 'N/A'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                <Typography variant="body2" color="text.secondary">Banco:</Typography>
                <Typography variant="body2" fontWeight={500}>{bankInfo.bank || 'N/A'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                <Typography variant="body2" color="text.secondary">Tipo de cuenta:</Typography>
                <Typography variant="body2" fontWeight={500}>{bankInfo.account_type || 'N/A'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                <Typography variant="body2" color="text.secondary">N° de cuenta:</Typography>
                <Typography variant="body2" fontWeight={500}>{bankInfo.account_number || 'N/A'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                <Typography variant="body2" color="text.secondary">Email confirmación:</Typography>
                <Typography variant="body2" fontWeight={500}>{bankInfo.confirmation_email || 'N/A'}</Typography>
              </Box>
            </Stack>
          ) : (
            <Alert severity="warning" sx={{ mt: 1 }}>
              El proveedor no tiene información de transferencia registrada.
            </Alert>
          )}
        </Box>

        {/* Mensaje de error */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Formulario */}
        <Stack spacing={2}>
          <Box>
            <TextField
              fullWidth
              label="Administrador"
              value={adminName || adminId || 'Cargando...'}
              disabled
              size="small"
              helperText={adminId ? `ID: ${adminId}` : 'Obteniendo información del usuario...'}
            />
          </Box>

          <TextField
            fullWidth
            label="Notas (opcional)"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            multiline
            rows={3}
            disabled={loading}
            placeholder="Ej: Transferencia realizada el 10/01/2025 a cuenta terminada en 1234. Comprobante en archivo adjunto."
            helperText="Agrega detalles de la transferencia bancaria manual realizada"
            size="small"
          />

          <TextField
            fullWidth
            label="URL del Comprobante de Pago (opcional)"
            value={formData.proof_url}
            onChange={(e) => handleChange('proof_url', e.target.value)}
            disabled={loading}
            placeholder="https://storage.supabase.co/..."
            helperText="Link al comprobante bancario escaneado o captura de pantalla de la transferencia"
            size="small"
            type="url"
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          variant="outlined"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading || !formData.admin_id || adminLoading}
          variant="contained"
          color="success"
          startIcon={loading ? <CircularProgress size={16} /> : <AttachMoneyIcon />}
        >
          {loading ? 'Registrando...' : adminLoading ? 'Cargando...' : 'Marcar como Liberado'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ReleasePaymentModal
