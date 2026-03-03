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
import ActionIconButton from '../../buttons/ActionIconButton';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import {
  WarningAmber as WarningAmberIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  HelpOutline as HelpOutlineIcon,
  LocalShipping as LocalShippingIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  FileDownload as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { formatDate, formatCurrency } from '../../../utils/formatters';
// Nota: este archivo está en src/shared/components/display/tables -> subir 4 niveles hasta src
import { getRegionDisplay } from '../../../../utils/regionNames';
import { getCommuneDisplay } from '../../../../utils/communeNames';
import ContactModal from '../../modals/ContactModal';
import InfoPopover from '../InfoPopover';
import { supabase } from '../../../../services/supabase';
import { downloadSupabaseStoragePathWithRateLimit } from '../../../utils/downloads/download';

const Rows = ({ order, onActionClick }) => {
  const [expandedProducts, setExpandedProducts] = useState(false);
  const [idAnchor, setIdAnchor] = useState(null);
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef(null);
  const [productsAnchor, setProductsAnchor] = useState(null);
  const [productsCopied, setProductsCopied] = useState(false);
  const productsCopyTimerRef = useRef(null);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [downloadingTaxDoc, setDownloadingTaxDoc] = useState(false);

  const openContact = () => setIsContactOpen(true);
  const closeContact = () => setIsContactOpen(false);

  const normalizeBackendStatus = (value) => {
    const statusMap = {
      Pendiente: 'pending',
      Aceptado: 'accepted',
      Rechazado: 'rejected',
      Cancelado: 'cancelled',
      'En Transito': 'in_transit',
      'En Tránsito': 'in_transit',
      Entregado: 'delivered',
      Pagado: 'paid',
    };
    if (!value) return '';
    if (statusMap[value]) return statusMap[value];
    return String(value).toLowerCase();
  };

  const canDownloadTaxDocument = (() => {
    const normalized = normalizeBackendStatus(order?.status);
    return normalized === 'in_transit' || normalized === 'delivered';
  })();

  const handleDownloadTaxDocument = async () => {
    if (!canDownloadTaxDocument || downloadingTaxDoc) return;

    setDownloadingTaxDoc(true);
    try {
      if (!order?.order_id) {
        alert('Pedido inválido.');
        return;
      }

      let supplierId = order?.supplier_id || null;
      if (!supplierId) {
        try {
          const { data } = await supabase.auth.getUser();
          supplierId = data?.user?.id || null;
        } catch (_) {}
      }

      let query = supabase
        .from('invoices_meta')
        .select('path, filename, created_at')
        .eq('order_id', order.order_id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (supplierId) {
        query = query.eq('supplier_id', supplierId);
      }

      const { data, error } = await query.maybeSingle();
      if (error) throw error;

      let path = data?.path || null;
      let filename = data?.filename || null;

      // Fallback: si invoices_meta no tiene row (o insert fue bloqueado por RLS), intentar encontrar el archivo en Storage.
      if (!path && supplierId) {
        const folder = `${supplierId}/${order.order_id}`;
        const { data: list, error: listErr } = await supabase.storage
          .from('invoices')
          .list(folder, {
            limit: 1,
            offset: 0,
            sortBy: { column: 'created_at', order: 'desc' },
          });

        if (!listErr && Array.isArray(list) && list.length > 0) {
          const file = list[0];
          path = `${folder}/${file.name}`;
          filename = filename || file.name;
        }
      }

      if (!path) {
        alert('No hay documento tributario subido para este pedido.');
        return;
      }

      const finalFilename = filename || path.split('/')?.pop() || 'documento.pdf';
      await downloadSupabaseStoragePathWithRateLimit({
        supabase,
        bucket: 'invoices',
        path,
        filename: finalFilename,
        rateKey: `invoice:${path}`,
      });
    } catch (e) {
      const msg = String(e?.message || e || '');
      if (msg.startsWith('RATE_LIMITED:')) {
        const seconds = msg.split(':')[1] || '';
        alert(`Límite de descargas alcanzado. Intenta nuevamente en ${seconds}s.`);
        return;
      }
      console.warn('[supplier][my-orders] download tax document failed', e?.message || e);
      alert('No se pudo descargar el documento.');
    } finally {
      setDownloadingTaxDoc(false);
    }
  };
  
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

  // Obtener fecha de solicitud (solo una fecha)
  const getRequestedDate = () => {
    const d = order?.requestedDate?.start || order?.created_at;
    return d || null;
  };

  // Formatear fecha a dd-mm-aaaa (seguro y tolerante a distintos inputs)
  const formatDateDMY = (input) => {
    if (!input) return '—';
    try {
      const d = input instanceof Date ? input : new Date(input);
      if (Number.isNaN(d.getTime())) return '—';
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (_) {
      return '—';
    }
  };

  // Normalizar billing_address que puede venir como string JSON o como objeto
  const getBillingObject = () => {
    const b = order?.billingAddress || order?.billing_address || order?.billing || null;
    if (!b) return null;
    if (typeof b === 'string') {
      try {
        const parsed = JSON.parse(b);
        if (!(parsed && typeof parsed === 'object')) return null;
        // Normalizar keys comunes a la forma que usa el UI
        const normalized = {
          ...parsed,
          // map billing_address -> address
          address: parsed.address || parsed.billing_address || parsed.shipping_address || null,
          number: parsed.number || parsed.shipping_number || null,
          department: parsed.department || parsed.shipping_dept || null,
          region: parsed.region || parsed.shipping_region || parsed.billing_region || null,
          commune: parsed.commune || parsed.shipping_commune || parsed.billing_commune || null,
          business_name: parsed.business_name || parsed.company || null,
          billing_rut: parsed.billing_rut || parsed.rut || null,
          business_line: parsed.business_line || parsed.giro || parsed.businessLine || null,
        };
        return normalized;
      } catch (_) {
        return null;
      }
    }
    // Si ya viene objeto, normalizar keys similares a lo anterior
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
      };
    }
    return null;
  };

  const buildBillingCopy = (b) => {
    if (!b) return '';
    const clean = v => (v ? String(v).trim() : '');
    const lines = [];
  if (clean(b.business_name)) lines.push(`Razón Social: ${clean(b.business_name)}`);
    if (clean(b.billing_rut)) lines.push(`RUT: ${clean(b.billing_rut)}`);
  if (clean(b.business_line)) lines.push(`Giro: ${clean(b.business_line)}`);
    const street = [clean(b.address), clean(b.number), clean(b.department)].filter(Boolean).join(' ');
    lines.push(`Dirección: ${street || '—'}`);
    const region = clean(b.region) || '—';
    const commune = clean(b.commune) || '—';
    lines.push(`Región: ${region}`);
    lines.push(`Comuna: ${commune}`);
    return lines.join('\n');
  };

  // Obtener color del chip según estado
  const translateStatus = (status) => {
    const statusMap = {
      'pending': 'Pendiente',
      'accepted': 'Aceptado', 
      'in_transit': 'En Transito',
      'delivered': 'Entregado',
      'paid': 'Pagado',
      'rejected': 'Rechazado',
      'cancelled': 'Rechazado'
    };
    return statusMap[status] || status;
  };

  const getStatusChipProps = status => {
    const translatedStatus = translateStatus(status);
    
    const statusConfig = {
      Pendiente: { color: 'warning', label: 'Pendiente' },
      Aceptado: { color: 'info', label: 'Aceptado' },
  'En Transito': { color: 'secondary', label: 'En Transito' },
      Entregado: { color: 'success', label: 'Entregado' },
      Pagado: { color: 'primary', label: 'Pagado' },
      Rechazado: { color: 'error', label: 'Rechazado' },
    };

    const result = statusConfig[translatedStatus] || { color: 'default', label: translatedStatus };
    return result;
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
          <ActionIconButton
            key="accept"
            tooltip="Aceptar"
            variant="success"
            onClick={() => onActionClick(order, 'accept')}
          >
            <CheckIcon fontSize="small" />
          </ActionIconButton>,
          <ActionIconButton
            key="reject"
            tooltip="Rechazar"
            variant="error"
            onClick={() => onActionClick(order, 'reject')}
          >
            <CloseIcon fontSize="small" />
          </ActionIconButton>,
          <ActionIconButton
            key="help"
            tooltip="Ayuda"
            variant="primary"
            onClick={openContact}
          >
            <HelpOutlineIcon fontSize="small" />
          </ActionIconButton>
        );
        break;

      case 'Aceptado':
        actions.push(
          <ActionIconButton
            key="dispatch"
            tooltip="Despachar"
            variant="primary"
            onClick={() => onActionClick(order, 'dispatch')}
          >
            <LocalShippingIcon fontSize="small" />
          </ActionIconButton>,
          <ActionIconButton
            key="cancel"
            tooltip="Cancelar"
            variant="error"
            onClick={() => onActionClick(order, 'cancel')}
          >
            <CloseIcon fontSize="small" />
          </ActionIconButton>,
          <ActionIconButton
            key="help"
            tooltip="Ayuda"
            variant="primary"
            onClick={openContact}
          >
            <HelpOutlineIcon fontSize="small" />
          </ActionIconButton>
        );
        break;

  case 'En Transito':
        actions.push(
          <ActionIconButton
            key="deliver"
            tooltip="Confirmar Entrega"
            variant="success"
            onClick={() => onActionClick(order, 'deliver')}
          >
            <AssignmentTurnedInIcon fontSize="small" />
          </ActionIconButton>,
          <ActionIconButton
            key="cancel"
            tooltip="Cancelar"
            variant="error"
            onClick={() => onActionClick(order, 'cancel')}
          >
            <CloseIcon fontSize="small" />
          </ActionIconButton>,
          <ActionIconButton
            key="help"
            tooltip="Ayuda"
            variant="primary"
            onClick={openContact}
          >
            <HelpOutlineIcon fontSize="small" />
          </ActionIconButton>
        );
        break;

      case 'Entregado':
      case 'Pagado':
        actions.push(
          <ActionIconButton
            key="help"
            tooltip="Ayuda"
            variant="primary"
            onClick={openContact}
          >
            <HelpOutlineIcon fontSize="small" />
          </ActionIconButton>
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

  const getPaymentBreakdown = () => {
    const sale = Number(order.total_amount || 0);
    const shipping = computeShippingTotal();
    const totalWithShipping = Math.max(0, sale + shipping);

    const rawFinancing = Math.max(0, Math.round(Number(order?.financing_amount || 0)));
    const financing = Math.min(rawFinancing, totalWithShipping);
    const traditional = Math.max(0, totalWithShipping - financing);

    const financingPct = totalWithShipping > 0 ? Math.round((financing / totalWithShipping) * 100) : 0;
    const traditionalPct = Math.max(0, 100 - financingPct);

    if (financing > 0 && traditional > 0) {
      return {
        mode: 'Mixto',
        details: `Crédito ${financingPct}% · Contado ${traditionalPct}%`,
      };
    }

    if (financing > 0) {
      return {
        mode: 'Crédito',
        details: formatCurrency(financing),
      };
    }

    return {
      mode: 'Contado',
      details: formatCurrency(traditional),
    };
  };

  const statusChipProps = getStatusChipProps(order.status);
  const paymentBreakdown = getPaymentBreakdown();
  const deliveryAddr = order?.deliveryAddress || {};
  const deliveryStreet = [deliveryAddr?.address, deliveryAddr?.number, deliveryAddr?.department]
    .filter(Boolean)
    .join(' ') || '—';
  const deliveryFields = [
    {
      label: 'Región',
      value: deliveryAddr?.region ? getRegionDisplay(deliveryAddr.region, { withPrefix: true }) : '—',
    },
    {
      label: 'Comuna',
      value: deliveryAddr?.commune ? getCommuneDisplay(deliveryAddr.commune) : '—',
    },
    {
      label: 'Dirección de despacho',
      value: deliveryStreet,
    },
  ];
  // Detectar si hay al menos un item ofertado (para chip agregado en columna Producto)
  const hasOfferedItem = React.useMemo(() => {
    // Preferir `items` si tiene elementos; si viene vacío, fallback a `products`.
    const items = (Array.isArray(order?.items) && order.items.length > 0) ? order.items : (order?.products || []);
    return items.some(it => it.isOffered || it.metadata?.isOffered || !!it.offer_id || !!it.offered_price);
  }, [order]);

  return (
    <TableRow hover>
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

      {/* Columna Solicitado Por */}
      <TableCell>
        <InfoPopover
          label={order?.buyer_user_nm || 'Comprador'}
          linkText="Ver Detalles"
          title="Dirección de despacho"
          fields={deliveryFields}
          popoverWidth={460}
        />
      </TableCell>

      {/* Columna Productos */}
      <TableCell sx={{ verticalAlign: 'middle', pl: 0 }}>
    <Box sx={{ display: 'block', width: '100%' }}>
      <Tooltip title="Clic para ver y copiar" placement="top">
        <Box sx={{ cursor: 'pointer', userSelect: 'none', display: 'flex', flexDirection: 'column', gap: 0.5 }} onClick={handleOpenProducts}>
          {renderProductNames()}
          {hasOfferedItem && (
            <Chip
              label="Ofertado"
              color="primary"
              size="small"
              sx={{ alignSelf: 'flex-start', fontSize: '0.6rem', height: 18 }}
              data-testid="supplier-chip-ofertado"
            />
          )}
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
      <TableCell sx={{ verticalAlign: 'middle', width: '110px', whiteSpace: 'nowrap', display: { md: 'none', lg: 'table-cell' } }}>{renderProductQuantities()}</TableCell>

      {/* Columna Fecha: mostrar Solicitud y Entrega Límite en dd-mm-aaaa */}
      <TableCell>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography variant="body2" color="text.primary">
            <strong>Solicitud:</strong>{' '}
            {formatDateDMY(getRequestedDate())}
          </Typography>
          <Typography variant="body2" color="text.primary">
            <strong>Entrega Límite:</strong>{' '}
            {formatDateDMY(order?.estimated_delivery_date)}
          </Typography>
        </Box>
      </TableCell>

      {/* Columna Documento Tributario */}
      <TableCell>
        {(() => {
          // document type may come at order level or per-item; prefer order.document_type
          const doc = (order?.document_type || order?.documentType || docTypeSummary) || null;
          if (!doc || doc === 'ninguno') return (<Typography variant="body2">—</Typography>);
          if (doc === 'boleta') {
            return (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                <Typography variant="body2">Boleta</Typography>
                <Tooltip
                  title={canDownloadTaxDocument ? 'Descargar' : 'Descargar Factura: Disponible una vez cargues la factura al despachar'}
                  arrow
                >
                  <span>
                    <IconButton
                      size="small"
                      color="primary"
                      aria-label="descargar documento tributario"
                      onClick={handleDownloadTaxDocument}
                      disabled={!canDownloadTaxDocument || downloadingTaxDoc}
                    >
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            );
          }
          if (doc === 'factura') {
            const billingObj = getBillingObject();
            const billingFields = [
              { label: 'Razón Social', value: billingObj?.business_name },
              { label: 'RUT', value: billingObj?.billing_rut },
              { label: 'Giro', value: billingObj?.business_line },
              {
                label: 'Dirección',
                value: [billingObj?.address, billingObj?.number, billingObj?.department]
                  .filter(Boolean)
                  .join(' ') || '—'
              },
              {
                label: 'Región',
                value: billingObj?.region ? getRegionDisplay(billingObj.region, { withPrefix: true }) : '—'
              },
              {
                label: 'Comuna',
                value: billingObj?.commune ? getCommuneDisplay(billingObj.commune) : '—'
              },
            ];

            return (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                <InfoPopover
                  label="Factura"
                  linkText="Ver detalle"
                  title="Información de Facturación"
                  fields={billingFields}
                  popoverWidth={460}
                />
                <Tooltip
                  title={canDownloadTaxDocument ? 'Descargar' : 'Descargar Factura: Disponible una vez cargues la factura al despachar'}
                  arrow
                >
                  <span>
                    <IconButton
                      size="small"
                      color="primary"
                      aria-label="descargar documento tributario"
                      onClick={handleDownloadTaxDocument}
                      disabled={!canDownloadTaxDocument || downloadingTaxDoc}
                    >
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            );
          }
          return (<Typography variant="body2">—</Typography>);
        })()}
      </TableCell>

      {/* Columna Forma de Pago */}
      <TableCell>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography variant="body2" fontWeight="medium">{paymentBreakdown.mode}</Typography>
          {paymentBreakdown.mode === 'Mixto' && (
            <Typography variant="caption" color="text.secondary">{paymentBreakdown.details}</Typography>
          )}
        </Box>
      </TableCell>

  {/* Column "Fecha Entrega Limite" removed - date now shown inside Fecha column */}

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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'center', justifyContent: 'center' }}>
          {order.isLate && (
            <Tooltip title="Atrasado">
              <WarningAmberIcon color="warning" sx={{ fontSize: 18 }} />
            </Tooltip>
          )}
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
  <ContactModal 
    open={isContactOpen} 
    onClose={closeContact}
    context={contactContext}
  />
    </TableRow>
  );
};

export default Rows;
