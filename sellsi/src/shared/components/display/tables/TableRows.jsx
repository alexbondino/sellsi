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
  ChatBubbleOutline as ChatBubbleOutlineIcon,
  LocalShipping as LocalShippingIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { formatDate, formatCurrency } from '../../../utils/formatters';
// Nota: este archivo está en src/shared/components/display/tables -> subir 4 niveles hasta src
import { getRegionDisplay } from '../../../../utils/regionNames';
import { getCommuneDisplay } from '../../../../utils/communeNames';

const Rows = ({ order, onActionClick }) => {
  const [expandedProducts, setExpandedProducts] = useState(false);
  const [idAnchor, setIdAnchor] = useState(null);
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef(null);
  const [addrAnchor, setAddrAnchor] = useState(null);
  const [addrCopied, setAddrCopied] = useState(false);
  const addrCopyTimerRef = useRef(null);

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
      return address.trim() || '—';
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
    
    return result;
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

  // Renderizar productos
  const renderProducts = () => {
    const { products } = order;
    const displayProducts = expandedProducts ? products : products.slice(0, 2);
    const hasMoreProducts = products.length > 2;

    return (
      <Box>
        {displayProducts.map((product, index) => (
          <Typography key={index} variant="body2" component="div">
            {product.name} x {product.quantity}
          </Typography>
        ))}

        {hasMoreProducts && !expandedProducts && (
          <Typography variant="body2" color="text.secondary">
            ...y {products.length - 2} más
          </Typography>
        )}

        {hasMoreProducts && (
          <IconButton
            size="small"
            onClick={() => setExpandedProducts(!expandedProducts)}
          >
            {expandedProducts ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        )}
      </Box>
    );
  };

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
          <Tooltip key="chat" title="Chat">
            <IconButton
              color="primary"
              onClick={() => onActionClick(order, 'chat')}
            >
              <ChatBubbleOutlineIcon />
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
          <Tooltip key="chat" title="Chat">
            <IconButton
              color="primary"
              onClick={() => onActionClick(order, 'chat')}
            >
              <ChatBubbleOutlineIcon />
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
          <Tooltip key="chat" title="Chat">
            <IconButton
              color="primary"
              onClick={() => onActionClick(order, 'chat')}
            >
              <ChatBubbleOutlineIcon />
            </IconButton>
          </Tooltip>
        );
        break;

      case 'Entregado':
      case 'Pagado':
        actions.push(
          <Tooltip key="chat" title="Chat">
            <IconButton
              color="primary"
              onClick={() => onActionClick(order, 'chat')}
            >
              <ChatBubbleOutlineIcon />
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

  const statusChipProps = getStatusChipProps(order.status);

  return (
    <TableRow hover>
      {/* Columna de Advertencia */}
      <TableCell align="center">
        {order.isLate && (
          <Tooltip title="Atrasado">
            <WarningAmberIcon color="warning" />
          </Tooltip>
        )}
      </TableCell>

      {/* Columna Productos */}
      <TableCell>{renderProducts()}</TableCell>

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

      {/* Columna Venta */}
      <TableCell align="right">
        <Typography variant="body2" fontWeight="medium">
          {formatCurrency(order.total_amount)}
        </Typography>
      </TableCell>

      {/* Columna Estado */}
      <TableCell>
        <Chip
          label={statusChipProps.label}
          color={statusChipProps.color}
          size="small"
        />
      </TableCell>

      {/* Columna Acciones */}
      <TableCell>
        <Box sx={{ display: 'flex', gap: 0.5 }}>{renderActions()}</Box>
      </TableCell>
    </TableRow>
  );
};

export default Rows;
