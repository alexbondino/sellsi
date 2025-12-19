import React from 'react'
import PropTypes from 'prop-types'
import {
  Card,
  CardContent,
  CardActions,
  Box,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Button,
  Divider,
} from '@mui/material'
import {
  Delete as DeleteIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  LocalShipping as ShippingIcon,
  Chat as ChatIcon,
} from '@mui/icons-material'
import AddToCart from '../cart/AddToCart'

/**
 * MobileOfferCard - Componente reutilizable para mostrar ofertas/pedidos en mobile
 *
 * Variantes:
 * - 'buyer': Ofertas del comprador (BuyerOffers)
 * - 'supplier': Ofertas recibidas del proveedor (SupplierOffers)
 * - 'order': Pedidos del proveedor (MyOrdersPage)
 *
 * @param {Object} data - Datos parciales para renderizar la card (UI)
 * @param {Object} fullOffer - Objeto completo de oferta (para handlers y modales)
 */
const MobileOfferCard = ({ variant, data, fullOffer, onAction, isMobile }) => {
  // Validación de variant
  const validVariants = ['buyer', 'supplier', 'order']
  if (!validVariants.includes(variant)) {
    console.warn(
      `MobileOfferCard: variant "${variant}" no válida. Usando "buyer" por defecto.`
    )
  }

  // Extraer datos comunes
  const {
    id,
    product_name,
    thumbnail_url,
    status,
    created_at,
    quantity,
    offered_price,
    total_price,
    buyer_name,
    supplier_name,
    purchase_deadline,
    expires_at,
    product, // Objeto product completo para AddToCart
    product_id,
    product_image,
  } = data

  // Mapeo de estados a colores y etiquetas según variante
  const getStatusConfig = () => {
    // Configuración base
    const base = {
      pending: { color: 'warning', label: 'Pendiente' },
      rejected: { color: 'error', label: 'Rechazada' },
      expired: { color: 'error', label: 'Caducada' },
      cancelled: { color: 'error', label: 'Cancelada' },
    }

    // Configuración específica por variante
    if (variant === 'buyer') {
      return {
        ...base,
        approved: { color: 'success', label: 'Aprobada' },
        reserved: { color: 'info', label: 'En Carrito' },
        paid: { color: 'success', label: 'Pagada' },
      }
    }

    if (variant === 'supplier') {
      return {
        ...base,
        accepted: { color: 'success', label: 'Aceptada' }, // Backend devuelve 'accepted'
        approved: { color: 'success', label: 'Aceptada' }, // Normalizado a 'approved'
        paid: { color: 'success', label: 'Aceptada' },
      }
    }

    if (variant === 'order') {
      return {
        ...base,
        accepted: { color: 'success', label: 'Aceptado' },
        dispatched: { color: 'info', label: 'En Tránsito' },
        delivered: { color: 'success', label: 'Entregado' },
      }
    }

    return base
  }

  const STATUS_CONFIG = getStatusConfig()

  const statusInfo = STATUS_CONFIG[status] || {
    color: 'default',
    label: status,
  }

  // Formatear precio (DEBE COINCIDIR CON OffersList.jsx)
  const formatPrice = (price) => {
    if (price == null) return ''
    const num =
      typeof price === 'number'
        ? price
        : Number(String(price).replace(/[^0-9.-]+/g, ''))
    if (Number.isNaN(num)) return String(price)
    return '$' + new Intl.NumberFormat('es-CL').format(Math.round(num))
  }

  // Calcular tiempo RESTANTE hasta deadline (NO tiempo transcurrido)
  const getTimeRemaining = () => {
    const now = Date.now()
    const pdMs = data.purchase_deadline
      ? new Date(data.purchase_deadline).getTime()
      : null
    const expMs = data.expires_at ? new Date(data.expires_at).getTime() : null

    // Pending: usar expires_at (48h)
    if (status === 'pending' && expMs != null) {
      const remaining = expMs - now
      if (remaining <= 0) return 'Caducada'
      if (remaining < 48 * 60 * 60 * 1000) {
        const hrs = Math.floor(remaining / 3600000)
        const mins = Math.floor((remaining % 3600000) / 60000)
        if (hrs >= 1) return `${hrs}h ${mins}m`
        return `${mins}m`
      }
      return '-'
    }

    // Approved: usar purchase_deadline; fallback expires_at
    if (status === 'approved') {
      const target = pdMs || expMs
      if (target != null) {
        const remaining = target - now
        if (remaining <= 0) return 'Caducada'
        const hrs = Math.floor(remaining / 3600000)
        const mins = Math.floor((remaining % 3600000) / 60000)
        if (hrs >= 1) return `${hrs}h ${mins}m`
        return `${mins}m`
      }
      return '<24h'
    }

    return '-'
  }

  // Renderizar acciones según variante y estado
  const renderActions = () => {
    if (variant === 'buyer') {
      return (
        <>
          {status === 'approved' && (
            <>
              <AddToCart
                product={
                  product || {
                    id: product_id,
                    name: product_name,
                    thumbnail: product_image || thumbnail_url,
                  }
                }
                variant="button"
                size="large"
                fullWidth
                offer={fullOffer || data}
                sx={{ minHeight: 44 }}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ textAlign: 'center', display: 'block', mt: 0.5 }}
              >
                Añade al carrito para completar el pago
              </Typography>
            </>
          )}
          {(status === 'pending' || status === 'approved') && (
            <>
              <Button
                variant="outlined"
                color="error"
                fullWidth
                size="large"
                sx={{ minHeight: 44 }}
                startIcon={<CancelIcon />}
                onClick={() => onAction('cancel', fullOffer || data)}
              >
                Cancelar Oferta
              </Button>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ textAlign: 'center', display: 'block', mt: 0.5 }}
              >
                Cancela tu oferta antes de que sea aceptada
              </Typography>
            </>
          )}
          {(status === 'rejected' ||
            status === 'cancelled' ||
            status === 'expired' ||
            status === 'paid') && (
            <Box sx={{ textAlign: 'center' }}>
              <IconButton
                color="error"
                sx={{ minWidth: 44, minHeight: 44 }}
                onClick={() => onAction('delete', fullOffer || data)}
                aria-label="Eliminar oferta"
              >
                <DeleteIcon />
              </IconButton>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                Eliminar de tu historial
              </Typography>
            </Box>
          )}
        </>
      )
    }

    if (variant === 'supplier') {
      return (
        <>
          {status === 'pending' && (
            <>
              <Button
                variant="contained"
                color="success"
                fullWidth
                size="large"
                sx={{ minHeight: 44 }}
                startIcon={<CheckCircleIcon />}
                onClick={() => onAction('accept', fullOffer || data)}
              >
                Aceptar
              </Button>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ textAlign: 'center', display: 'block', mt: 0.5 }}
              >
                Reserva inventario y notifica al comprador
              </Typography>
              <Button
                variant="outlined"
                color="error"
                fullWidth
                size="large"
                sx={{ minHeight: 44, mt: 1 }}
                onClick={() => onAction('reject', fullOffer || data)}
              >
                Rechazar
              </Button>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ textAlign: 'center', display: 'block', mt: 0.5 }}
              >
                Rechaza y notifica al ofertante
              </Typography>
            </>
          )}
          {(status === 'approved' ||
            status === 'rejected' ||
            status === 'paid') && (
            <Box sx={{ textAlign: 'center' }}>
              <IconButton
                color="error"
                sx={{ minWidth: 44, minHeight: 44 }}
                onClick={() => onAction('delete', fullOffer || data)}
                aria-label="Eliminar oferta"
              >
                <DeleteIcon />
              </IconButton>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                Eliminar de tu historial
              </Typography>
            </Box>
          )}
        </>
      )
    }

    if (variant === 'order') {
      return (
        <>
          {status === 'pending' && (
            <>
              <Button
                variant="contained"
                color="success"
                fullWidth
                size="large"
                sx={{ minHeight: 44 }}
                onClick={() => onAction('accept', data)}
              >
                Aceptar Pedido
              </Button>
              <Button
                variant="outlined"
                color="error"
                fullWidth
                size="large"
                sx={{ minHeight: 44 }}
                onClick={() => onAction('reject', data)}
              >
                Rechazar
              </Button>
            </>
          )}
          {status === 'accepted' && (
            <Button
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              sx={{ minHeight: 44 }}
              startIcon={<ShippingIcon />}
              onClick={() => onAction('dispatch', data)}
            >
              Despachar
            </Button>
          )}
          {status === 'dispatched' && (
            <Button
              variant="contained"
              color="success"
              fullWidth
              size="large"
              sx={{ minHeight: 44 }}
              onClick={() => onAction('deliver', data)}
            >
              Confirmar Entrega
            </Button>
          )}
          {(status === 'accepted' || status === 'dispatched') && (
            <Button
              variant="outlined"
              color="error"
              fullWidth
              size="large"
              sx={{ minHeight: 44 }}
              onClick={() => onAction('cancel', data)}
            >
              Cancelar Pedido
            </Button>
          )}
          <IconButton
            color="primary"
            sx={{ minWidth: 44, minHeight: 44 }}
            onClick={() => onAction('chat', data)}
            aria-label="Abrir chat"
          >
            <ChatIcon />
          </IconButton>
        </>
      )
    }

    return null
  }

  // Renderizar información adicional según variante
  const renderVariantInfo = () => {
    if (variant === 'buyer') {
      return (
        <Typography variant="body2" color="text.secondary">
          {quantity} uds • {formatPrice(offered_price)}
        </Typography>
      )
    }

    if (variant === 'supplier') {
      return (
        <>
          <Typography variant="body2" color="text.secondary">
            Precio ofertado: {formatPrice(offered_price)}
          </Typography>
          {buyer_name && (
            <Typography variant="body2" color="text.secondary">
              Ofertante: {buyer_name}
            </Typography>
          )}
        </>
      )
    }

    if (variant === 'order') {
      return (
        <>
          <Typography variant="body2" color="text.secondary">
            {quantity} unidades
          </Typography>
          <Typography variant="body2" color="primary" fontWeight={600}>
            Total: {formatPrice(total_price)}
          </Typography>
          {buyer_name && (
            <Typography variant="body2" color="text.secondary">
              Cliente: {buyer_name}
            </Typography>
          )}
        </>
      )
    }

    return null
  }

  return (
    <Card
      sx={{
        mb: 2,
        borderRadius: 2,
        boxShadow: 1,
        '&:hover': {
          boxShadow: 3,
        },
      }}
    >
      <CardContent sx={{ pb: 1 }}>
        {/* Header: Avatar + Producto */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Avatar
            src={thumbnail_url}
            alt={product_name}
            variant="rounded"
            sx={{
              width: 60,
              height: 60,
              flexShrink: 0,
            }}
          >
            {product_name?.[0]}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              fontWeight={600}
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {product_name}
            </Typography>
            {renderVariantInfo()}
          </Box>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Footer: Tiempo + Estado */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            ⏱️ {getTimeRemaining()}
          </Typography>
          <Chip
            label={statusInfo.label}
            color={statusInfo.color}
            size="small"
            sx={{ fontWeight: 600 }}
          />
        </Box>
      </CardContent>

      <CardActions
        sx={{
          px: 2,
          pb: 2,
          pt: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {renderActions()}
      </CardActions>
    </Card>
  )
}

MobileOfferCard.propTypes = {
  variant: PropTypes.oneOf(['buyer', 'supplier', 'order']).isRequired,
  fullOffer: PropTypes.object, // Objeto completo de oferta (para handlers y modales)
  data: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    product_name: PropTypes.string.isRequired,
    thumbnail_url: PropTypes.string,
    status: PropTypes.string.isRequired,
    created_at: PropTypes.string,
    quantity: PropTypes.number,
    offered_price: PropTypes.number,
    total_price: PropTypes.number,
    buyer_name: PropTypes.string,
    supplier_name: PropTypes.string,
    purchase_deadline: PropTypes.string,
    expires_at: PropTypes.string,
    product: PropTypes.object,
    product_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    product_image: PropTypes.string,
  }).isRequired,
  onAction: PropTypes.func.isRequired,
  isMobile: PropTypes.bool,
}

MobileOfferCard.defaultProps = {
  isMobile: true,
}

export default MobileOfferCard
