import React, { useState, useRef } from 'react';
import {
  TableRow,
  TableCell,
  Chip,
  IconButton,
  Tooltip,
  Popover,
  Collapse,
  Box,
  Typography,
  TextField,
  Button,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import {
  WarningAmber as WarningAmberIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  HelpOutline as HelpOutlineIcon,
  LocalShipping as LocalShippingIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { formatDate, formatCurrency } from '../../../utils/formatters';
// Nota: este archivo está en src/shared/components/display/tables -> subir 4 niveles hasta src
import { getRegionDisplay } from '../../../../utils/regionNames';
import { getCommuneDisplay } from '../../../../utils/communeNames';
import ContactModal from '../../modals/ContactModal';

const Rows = ({ order, onActionClick }) => {
  const [expandedProducts, setExpandedProducts] = useState(false);
  const [idAnchor, setIdAnchor] = useState(null);
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef(null);
  const [productsAnchor, setProductsAnchor] = useState(null);
  const [productsCopied, setProductsCopied] = useState(false);
  const productsCopyTimerRef = useRef(null);
  const [addrAnchor, setAddrAnchor] = useState(null);
  const [addrCopied, setAddrCopied] = useState(false);
  const addrCopyTimerRef = useRef(null);
  const [isContactOpen, setIsContactOpen] = useState(false);

  const openContact = () => setIsContactOpen(true);
  const closeContact = () => setIsContactOpen(false);

  const handleOpenId = event => setIdAnchor(event.currentTarget);
  const handleCloseId = () => {
    setIdAnchor(null);
    if (copyTimerRef.current) {
      clearTimeout(copyTimerRef.current);
      copyTimerRef.current = null;
    }
    setCopied(false);
  };
  const openId = Boolean(idAnchor);

  const handleOpenProducts = event => setProductsAnchor(event.currentTarget);
  const handleCloseProducts = () => {
    setProductsAnchor(null);
    if (productsCopyTimerRef.current) {
      clearTimeout(productsCopyTimerRef.current);
      productsCopyTimerRef.current = null;
    }
    setProductsCopied(false);
  };
  const openProducts = Boolean(productsAnchor);

  const handleOpenAddr = event => setAddrAnchor(event.currentTarget);
  const handleCloseAddr = () => {
    setAddrAnchor(null);
    if (addrCopyTimerRef.current) {
      clearTimeout(addrCopyTimerRef.current);
      addrCopyTimerRef.current = null;
    }
    setAddrCopied(false);
  };
  const openAddr = Boolean(addrAnchor);

  const handleCopyId = async () => {
    try {
      if (order?.order_id) await navigator.clipboard.writeText(order.order_id);
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 3000);
    } catch (_) {}
  };

  const buildProductsCopy = (items) => {
    if (!items || !Array.isArray(items) || items.length === 0) return '';
    return items.map(p => `${p.name || '—'} · ${p.quantity || 0} uds`).join('\n');
  };

  const handleCopyProducts = async () => {
    try {
      const items = order?.products || order?.items || [];
      const text = buildProductsCopy(items);
      if (!text) return;
      await navigator.clipboard.writeText(text);
      setProductsCopied(true);
      if (productsCopyTimerRef.current) clearTimeout(productsCopyTimerRef.current);
      productsCopyTimerRef.current = setTimeout(() => setProductsCopied(false), 3000);
    } catch (_) {}
  };

  // Formato amigable: #XXXXXXX (últimos 8 caracteres en mayúsculas)
  const shortId = id => {
    if (!id) return '—';
    const s = String(id).toUpperCase();
    return `#${s.slice(-8)}`;
  };

  // Formatear dirección
  const formatAddress = address => {
  // Dirección puede venir como string simple o como objeto normalizado

    if (!address) return '—';

    // String directo
    if (typeof address === 'string') {
  const raw = address.trim() || '—';
  if (raw === '—') return raw;
  return raw.length > 60 ? `${raw.slice(0, 60)}...` : raw;
    }

    // Filtro para ignorar placeholders tipo "no especificada"
    const clean = v => {
      if (!v) return '';
      const s = String(v).trim();
      if (!s) return '';
      return /no especificad/i.test(s) ? '' : s;
    };

    // Priorizar shipping_* y fullAddress
    const street = clean(
      address.shipping_address || address.fullAddress || address.street || address.address
    );
  const communeRaw = clean(address.shipping_commune || address.commune || address.city);
  const commune = communeRaw ? getCommuneDisplay(communeRaw) : '';
  const regionRaw = clean(address.shipping_region || address.region);
  const region = regionRaw ? getRegionDisplay(regionRaw, { withPrefix: true }) : '';

    const parts = [street, commune, region].filter(Boolean);
  const result = parts.length ? parts.join(', ') : '—';
  if (!result) return '—';
  return result.length > 60 ? `${result.slice(0, 40)}...` : result;
  };

  // Obtener fecha de solicitud (solo una fecha)
  const getRequestedDate = () => {
    const d = order?.requestedDate?.start || order?.created_at;
    return d ? formatDate(d) : '—';
  };

  // Construir texto profesional para copiar dirección
  const buildAddressCopy = (addr) => {
    const clean = v => {
      if (!v) return '';
      const s = String(v).trim();
      return /no especificad/i.test(s) ? '' : s;
    };
  const regionRaw = clean(addr?.region || addr?.shipping_region);
  const region = regionRaw ? getRegionDisplay(regionRaw, { withPrefix: true }) : '';
  const communeRaw = clean(addr?.commune || addr?.shipping_commune);
  const commune = communeRaw ? getCommuneDisplay(communeRaw) : '';
    const street = clean(addr?.address || addr?.shipping_address);
    const number = clean(addr?.number || addr?.shipping_number);
    const dept = clean(addr?.department || addr?.shipping_dept);
    const streetLine = [street, number, dept].filter(Boolean).join(' ');
  return `Región: ${region || '—'}\nComuna: ${commune || '—'}\nDirección: ${streetLine || '—'}`;
  };

  const handleCopyAddress = async () => {
    try {
      const text = buildAddressCopy(order?.deliveryAddress);
      await navigator.clipboard.writeText(text);
      setAddrCopied(true);
      if (addrCopyTimerRef.current) clearTimeout(addrCopyTimerRef.current);
      addrCopyTimerRef.current = setTimeout(() => setAddrCopied(false), 3000);
    } catch (_) {}
  };

  // Obtener color del chip según estado
  const getStatusChipProps = status => {
    const statusConfig = {
      Pendiente: { color: 'warning', label: 'Pendiente' },
      Aceptado: { color: 'info', label: 'Aceptado' },
  'En Transito': { color: 'secondary', label: 'En Transito' },
      Entregado: { color: 'success', label: 'Entregado' },
      Pagado: { color: 'primary', label: 'Pagado' },
      Rechazado: { color: 'error', label: 'Rechazado' },
    };

    return statusConfig[status] || { color: 'default', label: status };
  };

  // Compute aggregated document types for this order's items
  const docTypeSummary = React.useMemo(() => {
    const srcItems = order?.items || order?.products || [];
    if (!Array.isArray(srcItems) || srcItems.length === 0) return null;
    const norm = v => {
      if (!v) return 'ninguno';
      const s = String(v).toLowerCase();
      return (s === 'boleta' || s === 'factura') ? s : 'ninguno';
    };
    const types = Array.from(new Set(srcItems.map(it => norm(it.document_type || it.documentType))));
    if (types.length === 1) return types[0];
    if (types.length === 0) return null;
    return 'mixed';
  }, [order]);

  // Renderizar nombres de productos (columna Producto) y cantidades (columna Unidades)
  const getTruncated = (name) => {
    if (!name) return '—';
    const n = String(name).trim();
    return n.length > 15 ? `${n.slice(0, 15)}...` : n;
  };

  const getDisplayProducts = () => {
    const { products } = order;
    if (!products) return [];
    const display = expandedProducts ? products : products.slice(0, 5); // mostrar hasta 5 antes de expandir
    return display.map(p => ({ name: getTruncated(p.name), quantity: p.quantity }));
  };

  const hasMoreProducts = Array.isArray(order?.products) && order.products.length > 5 && !expandedProducts;

  const renderProductNames = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      {getDisplayProducts().map((p, i) => (
        <Box key={i} sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" component="div" noWrap sx={{ lineHeight: 1.2 }}>{p.name}</Typography>
        </Box>
      ))}
      {hasMoreProducts && (
        <Typography variant="body2" color="text.secondary">...y {order.products.length - 5} más</Typography>
      )}
      {Array.isArray(order?.products) && order.products.length > 5 && (
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); setExpandedProducts(!expandedProducts); }} sx={{ alignSelf: 'flex-start' }}>
          {expandedProducts ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      )}
    </Box>
  );

  const renderProductQuantities = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      {getDisplayProducts().map((p, i) => (
        <Box key={i} sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" component="div" noWrap sx={{ lineHeight: 1.2 }}>{p.quantity} uds</Typography>
        </Box>
      ))}
      {hasMoreProducts && (
        <Typography variant="body2" color="text.secondary">...</Typography>
      )}
      {Array.isArray(order?.products) && order.products.length > 5 && (
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); setExpandedProducts(!expandedProducts); }} sx={{ alignSelf: 'flex-start' }}>
          {expandedProducts ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      )}
    </Box>
  );

  // Renderizar acciones según estado
  const renderActions = () => {
    const { status } = order;

    const actions = [];

    switch (status) {
      case 'Pendiente':
        actions.push(
          <Tooltip key="accept" title="Aceptar">
            <IconButton
              color="success"
              onClick={() => onActionClick(order, 'accept')}
            >
              <CheckIcon />
            </IconButton>
          </Tooltip>,
          <Tooltip key="reject" title="Rechazar">
            <IconButton
              color="error"
              onClick={() => onActionClick(order, 'reject')}
            >
              <CloseIcon />
            </IconButton>
          </Tooltip>,
          <Tooltip key="help" title="Ayuda">
            <IconButton
              color="primary"
              onClick={openContact}
            >
              <HelpOutlineIcon />
            </IconButton>
          </Tooltip>
        );
        break;

      case 'Aceptado':
        actions.push(
          <Tooltip key="dispatch" title="Despachar">
            <IconButton
              color="primary"
              onClick={() => onActionClick(order, 'dispatch')}
            >
              <LocalShippingIcon />
            </IconButton>
          </Tooltip>,
          <Tooltip key="reject" title="Rechazar">
            <IconButton
              color="error"
              onClick={() => onActionClick(order, 'reject')}
            >
              <CloseIcon />
            </IconButton>
          </Tooltip>,
          <Tooltip key="help" title="Ayuda">
            <IconButton color="primary" onClick={openContact}>
              <HelpOutlineIcon />
            </IconButton>
          </Tooltip>
        );
        break;

  case 'En Transito':
        actions.push(
          <Tooltip key="deliver" title="Confirmar Entrega">
            <IconButton
              color="success"
              onClick={() => onActionClick(order, 'deliver')}
            >
              <AssignmentTurnedInIcon />
            </IconButton>
          </Tooltip>,
          <Tooltip key="reject" title="Rechazar">
            <IconButton
              color="error"
              onClick={() => onActionClick(order, 'reject')}
            >
              <CloseIcon />
            </IconButton>
          </Tooltip>,
          <Tooltip key="help" title="Ayuda">
            <IconButton color="primary" onClick={openContact}>
              <HelpOutlineIcon />
            </IconButton>
          </Tooltip>
        );
        break;

      case 'Entregado':
      case 'Pagado':
        actions.push(
          <Tooltip key="help" title="Ayuda">
            <IconButton color="primary" onClick={openContact}>
              <HelpOutlineIcon />
            </IconButton>
          </Tooltip>
        );
        break;

      case 'Rechazado':
        // No hay acciones disponibles
        break;
    }

    return actions;
  };

  // Determinar si debe mostrar fecha de entrega
  const shouldShowDeliveryDate = () => {
  return ['En Transito', 'Entregado', 'Pagado'].includes(order.status);
  };

  // Calcular costo total de envío: preferir order.shipping si viene desde backend,
  // si no, intentar sumar por cada item buscando product.delivery_regions y
  // coincidiendo con la región de deliveryAddress.
  const computeShippingTotal = () => {
    try {
      // Si el backend ya aporta un campo shipping o total_shipping, úsalo
      if (Number(order?.shipping_amount) > 0) return Number(order.shipping_amount);
      const maybe = order.shipping || order.total_shipping || order.shipping_cost || 0;
      const parsedMaybe = Number(maybe || 0);
      if (!Number.isNaN(parsedMaybe) && parsedMaybe > 0) return parsedMaybe;

      const region = (order?.deliveryAddress?.region || order?.delivery_address?.region || '').toString().toLowerCase();
      let total = 0;
      const items = Array.isArray(order.items) ? order.items : (Array.isArray(order.products) ? order.products : []);
      // Sumar shipping UNA vez por producto (independiente de la cantidad)
      const seenProducts = new Set();
      items.forEach(it => {
        // identificar producto de la fila
        const productId = it.product_id || it.product?.productid || it.productid || it.id || null;
        if (productId && seenProducts.has(String(productId))) return; // ya contabilizado
        const dr = it.product?.delivery_regions || it.product?.product_delivery_regions || [];
        if (Array.isArray(dr) && dr.length > 0) {
          // buscar coincidencia simple por nombre de región (case-insensitive, contains)
          const match = dr.find(r => {
            if (!r || !r.region) return false;
            return r.region.toString().toLowerCase().includes(region) || region.includes(r.region.toString().toLowerCase());
          }) || dr[0]; // fallback al primero si no hay match
          const price = Number(match?.price || 0);
          if (!Number.isNaN(price) && price > 0) total += price;
        }
        // marcar producto como procesado (evita doble cobro si hay múltiples renglones del mismo producto)
        if (productId) seenProducts.add(String(productId));
      });
  return total;
    } catch (e) {
      return 0;
    }
  };

  const statusChipProps = getStatusChipProps(order.status);

  return (
    <TableRow hover>
  {/* Columna de Advertencia */}
  <TableCell align="center" sx={{ verticalAlign: 'middle' }}>
        {order.isLate && (
          <Tooltip title="Atrasado">
            <WarningAmberIcon color="warning" />
          </Tooltip>
        )}
      </TableCell>

  {/* Columna Productos */}
  <TableCell sx={{ verticalAlign: 'middle', pl: 0 }}>
    <Box sx={{ display: 'block', width: '100%' }}>
      <Tooltip title="Clic para ver y copiar" placement="top">
        <Box sx={{ cursor: 'pointer', userSelect: 'none' }} onClick={handleOpenProducts}>
          {renderProductNames()}
        </Box>
      </Tooltip>
      <Popover
        open={openProducts}
        anchorEl={productsAnchor}
        onClose={handleCloseProducts}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { p: 2, width: 420, maxWidth: '90vw' } }}
        disableScrollLock
      >
        <Typography variant="subtitle2" gutterBottom>
          Productos
        </Typography>
        <Box sx={{ display: 'grid', rowGap: 0.5 }}>
          {(order?.products || order?.items || []).map((p, i) => (
            <Box key={i} sx={{ display: 'grid', gridTemplateColumns: '1fr auto', columnGap: 8, alignItems: 'center' }}>
              <Typography variant="body2">{p.name || p.title || '—'}</Typography>
              <Typography variant="body2" color="text.secondary">{p.quantity || 0} uds</Typography>
            </Box>
          ))}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          <Typography variant="caption" color="text.secondary">Selecciona o usa el botón para copiar</Typography>
          {productsCopied ? (
            <Button size="small" color="success" variant="contained" startIcon={<CheckCircleOutlineIcon sx={{ fontSize: 18 }} />} disableElevation>
              Copiado
            </Button>
          ) : (
            <Button onClick={handleCopyProducts} size="small">Copiar</Button>
          )}
        </Box>
      </Popover>
    </Box>
  </TableCell>

  {/* Columna Unidades */}
  <TableCell sx={{ verticalAlign: 'middle', width: '110px', whiteSpace: 'nowrap' }}>{renderProductQuantities()}</TableCell>

      {/* Columna ID Venta */}
      <TableCell>
        <Box sx={{ display: 'inline-block' }}>
          <Tooltip title="Clic para ver y copiar" placement="top">
            <Typography
              variant="body2"
              fontWeight="medium"
              onClick={handleOpenId}
              sx={{ cursor: 'pointer', userSelect: 'none' }}
            >
              {shortId(order.order_id)}
            </Typography>
          </Tooltip>
          <Popover
            open={openId}
            anchorEl={idAnchor}
            onClose={handleCloseId}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            PaperProps={{ sx: { p: 2, width: 420, maxWidth: '90vw' } }}
            // Evita que el Modal subyacente bloquee el scroll del body y produzca shift en el layout
            disableScrollLock
          >
            <Typography variant="subtitle2" gutterBottom>
              ID de venta (completo)
            </Typography>
            <TextField
              value={order.order_id || ''}
              fullWidth
              size="small"
              InputProps={{ readOnly: true }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Selecciona o usa el botón para copiar
              </Typography>
              {copied ? (
                <Button
                  size="small"
                  color="success"
                  variant="contained"
                  startIcon={<CheckCircleOutlineIcon sx={{ fontSize: 18 }} />}
                  disableElevation
                >
                  Copiado
                </Button>
              ) : (
                <Button onClick={handleCopyId} size="small">Copiar</Button>
              )}
            </Box>
          </Popover>
        </Box>
      </TableCell>

      {/* Columna Dirección Entrega */}
      <TableCell>
        <Box sx={{ display: 'inline-block' }}>
          <Tooltip title="Clic para ver y copiar" placement="top">
            <Typography
              variant="body2"
              onClick={handleOpenAddr}
              sx={{ cursor: 'pointer', userSelect: 'none' }}
            >
              {formatAddress(order.deliveryAddress)}
            </Typography>
          </Tooltip>
          <Popover
            open={openAddr}
            anchorEl={addrAnchor}
            onClose={handleCloseAddr}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            PaperProps={{ sx: { p: 2, width: 460, maxWidth: '95vw' } }}
            // Evita que el Modal subyacente bloquee el scroll del body y produzca shift en el layout
            disableScrollLock
          >
            <Typography variant="subtitle2" gutterBottom>
              Dirección de entrega
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: 1, columnGap: 1 }}>
              <Typography variant="body2" color="text.secondary">Región:</Typography>
              <Typography variant="body2">{order?.deliveryAddress?.region ? getRegionDisplay(order.deliveryAddress.region, { withPrefix: true }) : '—'}</Typography>
              <Typography variant="body2" color="text.secondary">Comuna:</Typography>
              <Typography variant="body2">{order?.deliveryAddress?.commune ? getCommuneDisplay(order.deliveryAddress.commune) : '—'}</Typography>
              <Typography variant="body2" color="text.secondary">Dirección:</Typography>
              <Typography variant="body2">
                {[order?.deliveryAddress?.address, order?.deliveryAddress?.number, order?.deliveryAddress?.department]
                  .filter(Boolean)
                  .join(' ') || '—'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Selecciona o usa el botón para copiar
              </Typography>
              {addrCopied ? (
                <Button
                  size="small"
                  color="success"
                  variant="contained"
                  startIcon={<CheckCircleOutlineIcon sx={{ fontSize: 18 }} />}
                  disableElevation
                >
                  Copiado
                </Button>
              ) : (
                <Button onClick={handleCopyAddress} size="small">Copiar</Button>
              )}
            </Box>
          </Popover>
        </Box>
      </TableCell>

      {/* Columna Fecha Solicitada (solo una fecha) */}
      <TableCell>
        <Typography variant="body2">{getRequestedDate()}</Typography>
      </TableCell>

      {/* Columna Fecha Entrega Límite (siempre una fecha si existe) */}
      <TableCell>
        <Typography variant="body2">
          {order.estimated_delivery_date
            ? formatDate(order.estimated_delivery_date)
            : '—'}
        </Typography>
      </TableCell>

      {/* Columna Venta y Envío */}
      <TableCell align="right">
        {(() => {
          const sale = Number(order.total_amount || 0);
          const shipping = computeShippingTotal();
          const combined = sale + shipping;
          return (
            <Box>
              <Typography variant="body2" fontWeight="medium">{formatCurrency(combined)}</Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Venta: {formatCurrency(sale)} · Envío: {formatCurrency(shipping)}
              </Typography>
            </Box>
          );
        })()}
      </TableCell>

      {/* Columna Estado */}
      <TableCell>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Chip
            label={statusChipProps.label}
            color={statusChipProps.color}
            size="small"
          />
        </Box>
      </TableCell>

      {/* Columna Acciones */}
      <TableCell>
        <Box sx={{ display: 'flex', gap: 0.5 }}>{renderActions()}</Box>
      </TableCell>
  {/* Contact Modal abierto desde el icono de ayuda */}
  <ContactModal open={isContactOpen} onClose={closeContact} />
    </TableRow>
  );
};

export default Rows;
