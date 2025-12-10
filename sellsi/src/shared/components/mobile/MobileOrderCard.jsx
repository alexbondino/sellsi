import React, { useState, useRef } from 'react'
import PropTypes from 'prop-types'
import {
  Card,
  CardContent,
  CardActions,
  Box,
  Typography,
  Chip,
  Button,
  IconButton,
  Divider,
  Collapse,
  List,
  ListItem,
  ListItemText,
  Snackbar,
  Alert,
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HelpOutline as HelpOutlineIcon,
  ContentCopy as CopyIcon,
  WarningAmber as WarningAmberIcon,
} from '@mui/icons-material'
import ContactModal from '@/shared/components/modals/ContactModal'
import { formatCurrency } from '@/shared/utils/formatters'
import { getRegionDisplay } from '@/utils/regionNames'
import { getCommuneDisplay } from '@/utils/communeNames'

/**
 * MobileOrderCard - Componente dedicado para mostrar PEDIDOS (orders) en mobile
 * NO reutiliza MobileOfferCard porque orders tienen mucha más información
 */
const MobileOrderCard = ({ order, onAction }) => {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [productsCopied, setProductsCopied] = useState(false)
  const [addressCopied, setAddressCopied] = useState(false)
  const [contactModalOpen, setContactModalOpen] = useState(false)

  const copyTimer = useRef(null)
  const productsCopyTimer = useRef(null)
  const addressCopyTimer = useRef(null)
  
  // Preparar contexto para ContactModal
  const contactContext = {
    source: 'table_row_support',
    order: {
      order_id: order?.order_id,
      status: order?.status,
      payment_status: order?.payment_status,
      supplier_id: order?.supplier_id
    }
  };

  // Status config para pedidos (colores exactos como desktop)
  const getStatusConfig = (status) => {
    const configs = {
      pending: { color: 'warning', label: 'Pendiente' },
      accepted: { color: 'info', label: 'Aceptado' },
      dispatched: { color: 'secondary', label: 'Despachado' },
      in_transit: { color: 'secondary', label: 'En Tránsito' },
      delivered: { color: 'success', label: 'Entregado' },
      cancelled: { color: 'error', label: 'Cancelado' },
      rejected: { color: 'error', label: 'Rechazado' },
      paid: { color: 'primary', label: 'Pagado' },
    }
    return configs[status] || { color: 'default', label: status }
  }

  // Normalizar status
  const normalizeStatus = (displayStatus) => {
    const statusMap = {
      Pendiente: 'pending',
      Aceptado: 'accepted',
      'En Transito': 'in_transit',
      'En Tránsito': 'in_transit',
      Despachado: 'dispatched',
      Entregado: 'delivered',
      Cancelado: 'cancelled',
      Rechazado: 'rejected',
      Pagado: 'paid',
    }
    return statusMap[displayStatus] || displayStatus?.toLowerCase() || 'pending'
  }

  const status = normalizeStatus(order.status)
  const statusInfo = getStatusConfig(status)

  // Normalizar billing (puede venir como billing_info, billingAddress, billing_address, billing)
  const getBillingInfo = () => {
    const b =
      order?.billing_info ||
      order?.billingAddress ||
      order?.billing_address ||
      order?.billing ||
      null
    if (!b) return null
    if (typeof b === 'string') {
      try {
        const parsed = JSON.parse(b)
        if (!(parsed && typeof parsed === 'object')) return null
        // Normalizar keys comunes a la forma que usa el UI (como desktop)
        return {
          ...parsed,
          address:
            parsed.address ||
            parsed.billing_address ||
            parsed.shipping_address ||
            null,
          number: parsed.number || parsed.shipping_number || null,
          department: parsed.department || parsed.shipping_dept || null,
          region:
            parsed.region ||
            parsed.shipping_region ||
            parsed.billing_region ||
            null,
          commune:
            parsed.commune ||
            parsed.shipping_commune ||
            parsed.billing_commune ||
            null,
          business_name: parsed.business_name || parsed.company || null,
          billing_rut: parsed.billing_rut || parsed.rut || null,
          business_line:
            parsed.business_line || parsed.giro || parsed.businessLine || null,
        }
      } catch (_) {
        return null
      }
    }
    // Si ya viene objeto, normalizar keys similares (como desktop)
    if (typeof b === 'object') {
      return {
        ...b,
        address: b.address || b.billing_address || b.shipping_address || null,
        number: b.number || b.shipping_number || null,
        department: b.department || b.shipping_dept || null,
        region: b.region || b.shipping_region || b.billing_region || null,
        commune: b.commune || b.shipping_commune || b.billing_commune || null,
        business_name: b.business_name || b.company || null,
        billing_rut: b.billing_rut || b.rut || null,
        business_line: b.business_line || b.giro || b.businessLine || null,
      }
    }
    return null
  }
  const billingInfo = getBillingInfo()

  // Compute aggregated document types para este order (como desktop)
  const docTypeSummary = React.useMemo(() => {
    const srcItems = order?.items || order?.products || []
    if (!Array.isArray(srcItems) || srcItems.length === 0) return null
    const norm = (v) => {
      if (!v) return 'ninguno'
      const s = String(v).toLowerCase()
      return s === 'boleta' || s === 'factura' ? s : 'ninguno'
    }
    const types = Array.from(
      new Set(srcItems.map((it) => norm(it.document_type || it.documentType)))
    )
    if (types.length === 1) return types[0]
    if (types.length === 0) return null
    return 'mixed'
  }, [order])

  const hasOfferedItem = React.useMemo(() => {
    const items = order?.items || order?.products || []
    return items.some(
      (it) =>
        it.isOffered ||
        it.metadata?.isOffered ||
        !!it.offer_id ||
        !!it.offered_price
    )
  }, [order])

  // Normalizar document_type (order level con fallback a items)
  const getDocumentType = () => {
    return (
      order?.document_type ||
      order?.documentType ||
      order?.tax_document_type ||
      docTypeSummary ||
      null
    )
  }
  const documentType = getDocumentType()

  // Formatear dirección (igual que desktop)
  const formatAddress = (addr) => {
    if (!addr) return '—'

    // String directo
    if (typeof addr === 'string') {
      const raw = addr.trim() || '—'
      if (raw === '—') return raw
      return raw.length > 60 ? `${raw.slice(0, 60)}...` : raw
    }

    // Filtro para ignorar placeholders tipo "no especificada"
    const clean = (v) => {
      if (!v) return ''
      const s = String(v).trim()
      if (!s) return ''
      return /no especificad/i.test(s) ? '' : s
    }

    // Priorizar shipping_* y fullAddress
    const street = clean(
      addr.shipping_address || addr.fullAddress || addr.street || addr.address
    )
    const communeRaw = clean(addr.shipping_commune || addr.commune || addr.city)
    const commune = communeRaw ? getCommuneDisplay(communeRaw) : ''
    const regionRaw = clean(addr.shipping_region || addr.region)
    const region = regionRaw
      ? getRegionDisplay(regionRaw, { withPrefix: true })
      : ''

    const parts = [street, commune, region].filter(Boolean)
    const result = parts.length ? parts.join(', ') : '—'
    if (!result) return '—'
    return result.length > 60 ? `${result.slice(0, 40)}...` : result
  }

  // Calcular totales (confiar en total_amount del backend como desktop)
  const items = order?.products || order?.items || []
  const totalQuantity = items.reduce((sum, it) => sum + (it.quantity || 0), 0)
  const totalProducts = Number(order.total_amount || 0)

  // Calcular shipping igual que desktop (computeShippingTotal)
  const computeShipping = () => {
    try {
      // Si el backend ya aporta un campo shipping o total_shipping, úsalo
      if (Number(order?.shipping_amount) > 0)
        return Number(order.shipping_amount)
      const maybe =
        order.shipping || order.total_shipping || order.shipping_cost || 0
      const parsedMaybe = Number(maybe || 0)
      if (!Number.isNaN(parsedMaybe) && parsedMaybe > 0) return parsedMaybe

      const region = (
        order?.deliveryAddress?.region ||
        order?.delivery_address?.region ||
        ''
      )
        .toString()
        .toLowerCase()
      let total = 0
      const itemsArray = Array.isArray(order.items)
        ? order.items
        : Array.isArray(order.products)
        ? order.products
        : []
      // Sumar shipping UNA vez por producto (independiente de la cantidad)
      const seenProducts = new Set()
      itemsArray.forEach((it) => {
        // identificar producto de la fila
        const productId =
          it.product_id ||
          it.product?.productid ||
          it.productid ||
          it.id ||
          null
        if (productId && seenProducts.has(String(productId))) return // ya contabilizado
        const dr =
          it.product?.delivery_regions ||
          it.product?.product_delivery_regions ||
          []
        if (Array.isArray(dr) && dr.length > 0) {
          // buscar coincidencia simple por nombre de región (case-insensitive, contains)
          const match =
            dr.find((r) => {
              if (!r || !r.region) return false
              return (
                r.region.toString().toLowerCase().includes(region) ||
                region.includes(r.region.toString().toLowerCase())
              )
            }) || dr[0] // fallback al primero si no hay match
          const price = Number(match?.price || 0)
          if (!Number.isNaN(price) && price > 0) total += price
        }
        // marcar producto como procesado (evita doble cobro si hay múltiples renglones del mismo producto)
        if (productId) seenProducts.add(String(productId))
      })
      return total
    } catch (e) {
      return 0
    }
  }

  const shipping = computeShipping()
  const totalOrder = totalProducts + shipping

  // Formatear fecha a dd-mm-yyyy (igual que desktop)
  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    try {
      const date = dateStr instanceof Date ? dateStr : new Date(dateStr)
      if (Number.isNaN(date.getTime())) return '—'
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      return `${day}-${month}-${year}`
    } catch (_) {
      return '—'
    }
  }

  // Copiar ID al clipboard
  const handleCopyId = async () => {
    try {
      if (order?.order_id) await navigator.clipboard.writeText(order.order_id)
      setCopied(true)
      if (copyTimer.current) clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => setCopied(false), 3000)
    } catch (_) {}
  }

  // Copiar productos al clipboard
  const buildProductsCopy = (items) => {
    if (!items || !Array.isArray(items) || items.length === 0) return ''
    return items
      .map((p) => `${p.name || '—'} · ${p.quantity || 0} uds`)
      .join('\n')
  }

  const handleCopyProducts = async () => {
    try {
      const text = buildProductsCopy(items)
      if (!text) return
      await navigator.clipboard.writeText(text)
      setProductsCopied(true)
      if (productsCopyTimer.current) clearTimeout(productsCopyTimer.current)
      productsCopyTimer.current = setTimeout(
        () => setProductsCopied(false),
        3000
      )
    } catch (_) {}
  }

  // Copiar dirección al clipboard (igual que desktop)
  const buildAddressCopy = (addr) => {
    if (!addr) return 'Sin dirección'

    const clean = (v) => {
      if (!v) return ''
      const s = String(v).trim()
      return /no especificad/i.test(s) ? '' : s
    }

    const regionRaw = clean(addr.region || addr.shipping_region)
    const region = regionRaw
      ? getRegionDisplay(regionRaw, { withPrefix: true })
      : '—'
    const communeRaw = clean(addr.commune || addr.shipping_commune)
    const commune = communeRaw ? getCommuneDisplay(communeRaw) : '—'
    const street = clean(addr.address || addr.shipping_address)
    const number = clean(addr.number || addr.shipping_number)
    const dept = clean(addr.department || addr.shipping_dept)
    const streetLine = [street, number, dept].filter(Boolean).join(' ')

    return `Región: ${region}\nComuna: ${commune}\nDirección: ${
      streetLine || '—'
    }`
  }

  const handleCopyAddress = async () => {
    try {
      const addr = order.deliveryAddress || order.delivery_address
      const text = buildAddressCopy(addr)
      await navigator.clipboard.writeText(text)
      setAddressCopied(true)
      if (addressCopyTimer.current) clearTimeout(addressCopyTimer.current)
      addressCopyTimer.current = setTimeout(() => setAddressCopied(false), 3000)
    } catch (_) {}
  }

  // Renderizar acciones según estado
  const renderActions = () => {
    return (
      <Box
        sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}
      >
        {status === 'pending' && (
          <>
            <Button
              variant="contained"
              color="success"
              fullWidth
              size="large"
              onClick={() => onAction('accept', order)}
            >
              Aceptar Pedido
            </Button>
            <Button
              variant="outlined"
              color="error"
              fullWidth
              size="large"
              onClick={() => onAction('reject', order)}
            >
              Rechazar
            </Button>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
              <IconButton
                color="primary"
                onClick={() => setContactModalOpen(true)}
                aria-label="Ayuda"
              >
                <HelpOutlineIcon />
              </IconButton>
            </Box>
          </>
        )}
        {status === 'accepted' && (
          <>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              startIcon={<ShippingIcon />}
              onClick={() => onAction('dispatch', order)}
            >
              Despachar
            </Button>
            <Button
              variant="outlined"
              color="error"
              fullWidth
              size="large"
              onClick={() => onAction('cancel', order)}
            >
              Cancelar Pedido
            </Button>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
              <IconButton
                color="primary"
                onClick={() => setContactModalOpen(true)}
                aria-label="Ayuda"
              >
                <HelpOutlineIcon />
              </IconButton>
            </Box>
          </>
        )}
        {(status === 'dispatched' || status === 'in_transit') && (
          <>
            <Button
              variant="contained"
              color="success"
              fullWidth
              size="large"
              startIcon={<CheckCircleIcon />}
              onClick={() => onAction('deliver', order)}
            >
              Confirmar Entrega
            </Button>
            <Button
              variant="outlined"
              color="error"
              fullWidth
              size="large"
              onClick={() => onAction('cancel', order)}
            >
              Cancelar Pedido
            </Button>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
              <IconButton
                color="primary"
                onClick={() => setContactModalOpen(true)}
                aria-label="Ayuda"
              >
                <HelpOutlineIcon />
              </IconButton>
            </Box>
          </>
        )}
        {(status === 'delivered' || status === 'paid') && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
            <IconButton
              color="primary"
              onClick={() => setContactModalOpen(true)}
              aria-label="Ayuda"
            >
              <HelpOutlineIcon />
            </IconButton>
          </Box>
        )}
      </Box>
    )
  }

  return (
    <Card
      sx={{
        mb: 2,
        borderRadius: 2,
        boxShadow: 2,
        border: order.isLate ? '2px solid' : 'none',
        borderColor: order.isLate ? 'warning.main' : 'transparent',
      }}
    >
      <CardContent sx={{ pb: 1 }}>
        {/* Header: ID + Estado */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {order.isLate && (
              <WarningAmberIcon color="warning" fontSize="small" />
            )}
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Pedido #{order.order_id?.toUpperCase().slice(-8) || 'N/A'}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                {formatDate(order.created_at)}
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={handleCopyId}
              sx={{ color: copied ? 'success.main' : 'text.secondary' }}
            >
              <CopyIcon fontSize="small" />
            </IconButton>
          </Box>
          <Chip
            label={statusInfo.label}
            color={statusInfo.color}
            size="small"
            sx={{ fontWeight: 600 }}
          />
        </Box>

        {/* Resumen productos */}
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="body2" color="text.secondary">
            Productos ({items.length})
          </Typography>
          <Typography variant="body1" fontWeight={600}>
            {totalQuantity} unidades
          </Typography>
        </Box>

        {/* Totales */}
        <Box sx={{ mb: 2 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}
          >
            <Typography variant="body2" color="text.secondary">
              Productos:
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {formatCurrency(totalProducts)}
            </Typography>
          </Box>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}
          >
            <Typography variant="body2" color="text.secondary">
              Envío:
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {formatCurrency(shipping)}
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              pt: 1,
              borderTop: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="body1" fontWeight={700}>
              Total:
            </Typography>
            <Typography variant="body1" fontWeight={700} color="primary">
              {formatCurrency(totalOrder)}
            </Typography>
          </Box>
        </Box>

        {/* Expandir detalles */}
        <Button
          fullWidth
          variant="text"
          endIcon={
            <ExpandMoreIcon
              sx={{
                transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
                transition: '0.3s',
              }}
            />
          }
          onClick={() => setExpanded(!expanded)}
          sx={{ mb: 1 }}
        >
          {expanded ? 'Ocultar detalles' : 'Ver detalles'}
        </Button>

        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box sx={{ pt: 2 }}>
            {/* Lista de productos */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 1,
              }}
            >
              <Typography variant="subtitle2">Detalle de Productos</Typography>
              <IconButton
                size="small"
                onClick={handleCopyProducts}
                sx={{
                  color: productsCopied ? 'success.main' : 'text.secondary',
                }}
              >
                <CopyIcon fontSize="small" />
              </IconButton>
            </Box>
            {hasOfferedItem && (
              <Chip
                label="Ofertado"
                color="primary"
                size="small"
                sx={{ mb: 1, fontSize: '0.6rem', height: 18 }}
                data-testid="supplier-chip-ofertado"
              />
            )}
            <List dense disablePadding sx={{ mb: 2 }}>
              {items.map((item, idx) => (
                <ListItem key={idx} disableGutters>
                  <ListItemText
                    primary={
                      item.name ||
                      item.product?.name ||
                      item.title ||
                      'Producto'
                    }
                    secondary={`${item.quantity || 0} uds × ${formatCurrency(
                      item.price ||
                        item.price_at_addition ||
                        item.product?.price ||
                        0
                    )}`}
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                  {(item.isOffered ||
                    item.metadata?.isOffered ||
                    !!item.offer_id ||
                    !!item.offered_price) && (
                    <Chip
                      label="Ofertado"
                      color="primary"
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  )}
                </ListItem>
              ))}
            </List>

            {/* Dirección de entrega */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 1,
              }}
            >
              <Typography variant="subtitle2">Dirección de Entrega</Typography>
              <IconButton
                size="small"
                onClick={handleCopyAddress}
                sx={{
                  color: addressCopied ? 'success.main' : 'text.secondary',
                }}
              >
                <CopyIcon fontSize="small" />
              </IconButton>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {formatAddress(order.deliveryAddress || order.delivery_address)}
            </Typography>

            {/* Documento Tributario */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Documento Tributario
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {documentType === 'boleta'
                  ? 'Boleta'
                  : documentType === 'factura'
                  ? 'Factura'
                  : documentType === 'mixed'
                  ? 'Mixto (ver detalle)'
                  : 'No especificado'}
              </Typography>
              {documentType === 'factura' && billingInfo && (
                <Box
                  sx={{
                    mt: 1,
                    pl: 1,
                    borderLeft: '2px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography
                    variant="caption"
                    display="block"
                    color="text.secondary"
                  >
                    <strong>Razón Social:</strong>{' '}
                    {billingInfo.business_name || '—'}
                  </Typography>
                  <Typography
                    variant="caption"
                    display="block"
                    color="text.secondary"
                  >
                    <strong>RUT:</strong> {billingInfo.billing_rut || '—'}
                  </Typography>
                  <Typography
                    variant="caption"
                    display="block"
                    color="text.secondary"
                  >
                    <strong>Giro:</strong> {billingInfo.business_line || '—'}
                  </Typography>
                  <Typography
                    variant="caption"
                    display="block"
                    color="text.secondary"
                  >
                    <strong>Dirección:</strong>{' '}
                    {[
                      billingInfo.address,
                      billingInfo.number,
                      billingInfo.department,
                    ]
                      .filter(Boolean)
                      .join(' ') || '—'}
                  </Typography>
                  <Typography
                    variant="caption"
                    display="block"
                    color="text.secondary"
                  >
                    <strong>Región:</strong>{' '}
                    {billingInfo.region
                      ? getRegionDisplay(billingInfo.region, {
                          withPrefix: true,
                        })
                      : '—'}
                  </Typography>
                  <Typography
                    variant="caption"
                    display="block"
                    color="text.secondary"
                  >
                    <strong>Comuna:</strong>{' '}
                    {billingInfo.commune
                      ? getCommuneDisplay(billingInfo.commune)
                      : '—'}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Fechas (igual que desktop) */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Fechas
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography variant="body2">
                  <strong>Solicitud:</strong> {formatDate(order.created_at)}
                </Typography>
                {order.estimated_delivery_date && (
                  <Typography variant="body2">
                    <strong>Entrega Límite:</strong>{' '}
                    {formatDate(order.estimated_delivery_date)}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        </Collapse>
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>{renderActions()}</CardActions>

      {/* Snackbars para feedback de copy */}
      <Snackbar
        open={copied}
        autoHideDuration={3000}
        onClose={() => setCopied(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" sx={{ width: '100%' }}>
          ID copiado
        </Alert>
      </Snackbar>
      <Snackbar
        open={productsCopied}
        autoHideDuration={3000}
        onClose={() => setProductsCopied(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" sx={{ width: '100%' }}>
          Productos copiados
        </Alert>
      </Snackbar>
      <Snackbar
        open={addressCopied}
        autoHideDuration={3000}
        onClose={() => setAddressCopied(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" sx={{ width: '100%' }}>
          Dirección copiada
        </Alert>
      </Snackbar>

      {/* ContactModal */}
      <ContactModal
        open={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        context={contactContext}
      />
    </Card>
  )
}

MobileOrderCard.propTypes = {
  order: PropTypes.shape({
    order_id: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    buyer_name: PropTypes.string,
    buyer_email: PropTypes.string,
    buyer_phone: PropTypes.string,
    items: PropTypes.array, // Array original de items
    products: PropTypes.array, // Array normalizado por ordersStore
    total_amount: PropTypes.number,
    shipping: PropTypes.number,
    shipping_amount: PropTypes.number,
    shippingTotal: PropTypes.number,
    total_shipping: PropTypes.number,
    shipping_cost: PropTypes.number,
    deliveryAddress: PropTypes.object,
    delivery_address: PropTypes.object,
    created_at: PropTypes.string,
    accepted_at: PropTypes.string,
    estimated_delivery_date: PropTypes.string,
    tax_document_type: PropTypes.string,
    billing_info: PropTypes.shape({
      rut: PropTypes.string,
      business_name: PropTypes.string,
      giro: PropTypes.string,
      address: PropTypes.string,
      commune: PropTypes.string,
    }),
    isLate: PropTypes.bool,
  }).isRequired,
  onAction: PropTypes.func.isRequired,
}

export default MobileOrderCard
