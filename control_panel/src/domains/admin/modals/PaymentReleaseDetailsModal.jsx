import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  Chip,
  Stack,
  Link,
  Paper,
  Alert,
  CircularProgress
} from '@mui/material'
import {
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material'
import {
  formatCLP,
  formatDate,
  daysBetween,
  STATUS,
  STATUS_COLORS,
  STATUS_LABELS,
  getSupplierBankInfo,
  computePayout
} from '../services/adminPaymentReleaseService'

const PaymentReleaseDetailsModal = ({ open, onClose, release }) => {
  if (!release) return null

  const [bankInfo, setBankInfo] = useState(null)
  const [bankInfoLoading, setBankInfoLoading] = useState(false)
  const [bankInfoError, setBankInfoError] = useState(null)

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

  const daysSinceDelivery = release.delivery_confirmed_at
    ? daysBetween(release.delivery_confirmed_at, new Date())
    : 0

  const daysSinceRelease = release.released_at
    ? daysBetween(release.released_at, new Date())
    : 0

  const statusColor = STATUS_COLORS[release.status] || 'default'
  const statusLabel = STATUS_LABELS[release.status] || release.status

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InfoIcon color="primary" />
          <Typography variant="h6" fontWeight={600}>
            Detalles de Liberación de Pago
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Estado actual */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Estado:
          </Typography>
          <Chip
            label={statusLabel}
            color={statusColor}
            icon={
              release.status === STATUS.RELEASED ? <CheckCircleIcon /> :
              release.status === STATUS.CANCELLED ? <CancelIcon /> :
              null
            }
          />
        </Box>

        {/* Información principal */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
          <Typography variant="subtitle2" gutterBottom fontWeight={600}>
            Información del Pago
          </Typography>
          <Divider sx={{ my: 1.5 }} />

          <Stack spacing={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                ID de Liberación:
              </Typography>
              <Typography variant="body2" fontFamily="monospace">
                {release.id}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Orden:
              </Typography>
              <Chip label={`#${release.order_id}`} size="small" variant="outlined" />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">Monto bruto:</Typography>
                <Typography variant="body2">{formatCLP(release.amount)}</Typography>
                <Typography variant="caption" color="text.secondary">Comisión Sellsi (3%): {formatCLP((typeof computePayout === 'function' ? computePayout(release.amount).commission : Math.round((parseFloat(release.amount)||0) * 0.03)))}</Typography>
              </Box>

              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" color="text.secondary">Monto a liberar:</Typography>
                <Typography variant="h6" color="success.main" fontWeight={600}>{formatCLP((typeof computePayout === 'function' ? computePayout(release.amount).payout : Math.round((parseFloat(release.amount)||0) * 0.97)))}</Typography>
              </Box>
            </Box>
          </Stack>
        </Paper>

        {/* Información de actores */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom fontWeight={600}>
            Participantes
          </Typography>
          <Divider sx={{ my: 1.5 }} />

          <Stack spacing={2}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Proveedor
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {release.supplier_name || 'Sin nombre'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ID: {release.supplier_id}
              </Typography>
            </Box>

            {release.buyer_name && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Comprador
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {release.buyer_name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ID: {release.buyer_id}
                </Typography>
              </Box>
            )}

            {release.admin_name && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Administrador que liberó
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {release.admin_name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ID: {release.released_by_admin_id}
                </Typography>
              </Box>
            )}
          </Stack>
        </Paper>

        {/* Información de transferencia */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
          <Typography variant="subtitle2" gutterBottom fontWeight={600}>
            Información de Transferencia
          </Typography>
          <Divider sx={{ my: 1.5 }} />

          {bankInfoLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={18} />
              <Typography variant="body2" color="text.secondary">
                Cargando información bancaria...
              </Typography>
            </Box>
          ) : bankInfoError ? (
            <Alert severity="error">
              {bankInfoError}
            </Alert>
          ) : bankInfo ? (
            <Stack spacing={1.5}>
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
            <Alert severity="warning">
              El proveedor no tiene información de transferencia registrada.
            </Alert>
          )}
        </Paper>

        {/* Fechas importantes */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom fontWeight={600}>
            Cronología
          </Typography>
          <Divider sx={{ my: 1.5 }} />

          <Stack spacing={2}>
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

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Días desde entrega:
              </Typography>
              <Chip
                label={typeof daysSinceDelivery === 'number' ? `${daysSinceDelivery} días` : 'N/A'}
                size="small"
                color={typeof daysSinceDelivery === 'number' ? (daysSinceDelivery > 7 ? 'error' : daysSinceDelivery > 3 ? 'warning' : 'default') : 'default'}
              />
            </Box>

            {release.released_at && (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Fecha de liberación:
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(release.released_at)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Días desde liberación:
                  </Typography>
                  <Typography variant="body2">
                    {daysSinceRelease} días
                  </Typography>
                </Box>
              </>
            )}

            {release.cancelled_at && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Fecha de cancelación:
                </Typography>
                <Typography variant="body2" color="error">
                  {formatDate(release.cancelled_at)}
                </Typography>
              </Box>
            )}
          </Stack>
        </Paper>

        {/* Notas y comprobantes */}
        {(release.admin_notes || release.cancellation_reason || release.payment_proof_url) && (
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom fontWeight={600}>
              Notas y Documentación
            </Typography>
            <Divider sx={{ my: 1.5 }} />

            <Stack spacing={2}>
              {release.admin_notes && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Notas del administrador:
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                    "{release.admin_notes}"
                  </Typography>
                </Box>
              )}

              {release.cancellation_reason && (
                <Box>
                  <Typography variant="caption" color="error">
                    Razón de cancelación:
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic' }} color="error">
                    "{release.cancellation_reason}"
                  </Typography>
                </Box>
              )}

              {release.payment_proof_url && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Comprobante de pago:
                  </Typography>
                  <Link
                    href={release.payment_proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}
                  >
                    <Typography variant="body2">
                      Ver documento
                    </Typography>
                    <OpenInNewIcon fontSize="small" />
                  </Link>
                </Box>
              )}
            </Stack>
          </Paper>
        )}

        {/* Metadata */}
        <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
          <Typography variant="subtitle2" gutterBottom fontWeight={600}>
            Información del Sistema
          </Typography>
          <Divider sx={{ my: 1.5 }} />

          <Stack spacing={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">
                Creado:
              </Typography>
              <Typography variant="caption">
                {formatDate(release.created_at)}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">
                Última actualización:
              </Typography>
              <Typography variant="caption">
                {formatDate(release.updated_at)}
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="contained">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default PaymentReleaseDetailsModal
