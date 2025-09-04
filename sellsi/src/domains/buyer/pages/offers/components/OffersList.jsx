import React from 'react';
import {
  Paper,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { AddToCart } from '../../../../../shared/components';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';
import { InfoOutlined as InfoOutlinedIcon } from '@mui/icons-material';

const STATUS_MAP = {
  pending: { label: 'Pendiente', color: 'warning' },
  approved: { label: 'Aprobada', color: 'success' },
  rejected: { label: 'Rechazada', color: 'error' },
  expired: { label: 'Caducada', color: 'error' },
  cancelled: { label: 'Cancelada', color: 'error' },
};

// Wrapper that ensures onClick is a function before passing it to MUI Chip
const SafeChip = (props) => {
  const { onClick, ...rest } = props;
  const safeOnClick = typeof onClick === 'function' ? onClick : undefined;
  return <Chip {...rest} onClick={safeOnClick} />;
};

// Formatea números como moneda con separador de miles y prefijo $ (ej: $1.234)
const formatPrice = (value) => {
  if (value == null) return '';
  const num = typeof value === 'number' ? value : Number(String(value).replace(/[^0-9.-]+/g, ''));
  if (Number.isNaN(num)) return String(value);
  return '$' + new Intl.NumberFormat('es-CL').format(Math.round(num));
};

import { useThumbnailsBatch } from '../../../../../hooks/useThumbnailQueries';
import TableSkeleton from '../../../../../shared/components/display/skeletons/TableSkeleton';

const OffersList = ({ offers = [], loading = false, error = null, cancelOffer, deleteOffer, onCancelOffer, onDeleteOffer, onAddToCart }) => {
  const [statusFilter, setStatusFilter] = React.useState('all');

  // Preparar petición batch de thumbnails para los productos mostrados
  const productIds = React.useMemo(() => (offers || []).map(o => (o.product?.id || o.product_id)).filter(Boolean), [offers]);
  const thumbnailsQuery = useThumbnailsBatch(productIds);

  // thumbnailsQuery is used below to resolve product thumbnails in batch

  const filtered = React.useMemo(() => {
    if (!offers) return [];
    if (statusFilter === 'all') return offers;
    return offers.filter(o => o.status === statusFilter);
  }, [offers, statusFilter]);

  // Debugging: limit noisy logs by counting a few rows only
  const debugCounterRef = React.useRef(0);

  const handleCancelOffer = async (offerId) => {
    try {
      if (onCancelOffer) return onCancelOffer(offers.find(o=>o.id===offerId));
      if (cancelOffer) return await cancelOffer(offerId);
    } catch (error) {
      console.error('Error canceling offer:', error);
    }
  };

  const handleDeleteOffer = async (offerId) => {
    try {
      if (onDeleteOffer) return onDeleteOffer(offers.find(o=>o.id===offerId));
      if (deleteOffer) return await deleteOffer(offerId);
    } catch (error) {
      console.error('Error deleting offer:', error);
    }
  };

  const handleAddToCart = (offer) => {
    if (onAddToCart) return onAddToCart(offer);
    console.log('Add to cart:', offer);
  };

  const hasOffers = (offers && offers.length > 0);

  if (!hasOffers) {
    if (loading) return <TableSkeleton rows={6} columns={4} withAvatar />;
    if (!error) {
      return (
        <Paper sx={{ p: { xs: 2, md: 4 }, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">No has enviado ofertas</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Envía ofertas a proveedores desde la ficha de producto. Aquí verás el estado de cada propuesta.
          </Typography>
        </Paper>
      );
    }
  }

  return (
    <TableContainer component={Paper} sx={{ p: 0, position: 'relative', scrollbarGutter: 'stable' }}>
      {loading && hasOffers && (
        <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(255,255,255,0.55)', zIndex: 2 }}>
          <Box sx={{ position: 'absolute', top: 8, right: 12 }}>
            <Typography variant="caption" color="text.secondary">Actualizando…</Typography>
          </Box>
        </Box>
      )}
      <Box sx={{ display: 'flex', gap: 2, p: 2, alignItems: 'center' }}>
        <Typography fontWeight={600}>Filtrar por estado:</Typography>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="offers-filter-label">Estado</InputLabel>
          <Select
            labelId="offers-filter-label"
            value={statusFilter}
            label="Estado"
            onChange={(e) => setStatusFilter(e.target.value)}
            MenuProps={{ disableScrollLock: true }}
          >
            <MenuItem value="all">Todos</MenuItem>
            <MenuItem value="pending">Pendiente</MenuItem>
            <MenuItem value="approved">Aprobada</MenuItem>
            <MenuItem value="cancelled">Cancelada</MenuItem>
            <MenuItem value="rejected">Rechazada</MenuItem>
            <MenuItem value="expired">Caducada</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell colSpan={2}>
              <Typography fontWeight={700}>Producto</Typography>
            </TableCell>
            <TableCell>
              <Typography fontWeight={700}>Tiempo restante</Typography>
            </TableCell>
            <TableCell>
              <Typography fontWeight={700}>Estado</Typography>
            </TableCell>
            <TableCell>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography fontWeight={700}>Acciones</Typography>
                <Tooltip
                  placement="right"
                  componentsProps={{
                    tooltip: { sx: { maxWidth: 320, p: 1.25 } },
                  }}
                  title={
                    <Box>
                      <Typography variant="subtitle2" sx={{ color: 'common.white', fontWeight: 'bold' }} gutterBottom>
                        Cómo usar Acciones
                      </Typography>
                        <Typography variant="caption" sx={{ color: 'common.white' }} display="block">
                          Cuando una oferta es aprobada, la forma de completar la compra es
                          agregando esa oferta al carrito desde esta sección. <br /> <br />
                          Contarás con un máximo de 24 horas para hacer esto antes de que la oferta caduque.
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'common.white', mt: 1 }} display="block">
                          Para cancelar una oferta (Pendiente o Aprobada), utiliza la acción "Cancelar Oferta". Una vez cancelada,
                          la oferta se marcará como "Cancelada" y podrás limpiarla si lo deseas.
                        </Typography>
                    </Box>
                  }
                >
                  <IconButton size="small" aria-label="Información de acciones">
                    <InfoOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="body2" color="text.secondary">No hay ofertas con este estado</Typography>
              </TableCell>
            </TableRow>
          )}
          {filtered.map((o) => {
            const product = o.product || { name: o.product_name || 'Producto', thumbnail: null };
            const pid = product.id || product.product_id;
            const thumbRow = thumbnailsQuery.data && pid ? thumbnailsQuery.data[pid] : null;
            // Prioridad: thumbnails.minithumb -> thumbnail_url transformed -> product.thumbnail -> product.imagen -> null
            let avatarSrc = null;
            if (thumbRow) {
              try {
                if (thumbRow.thumbnails && typeof thumbRow.thumbnails === 'object') avatarSrc = thumbRow.thumbnails.minithumb || null;
                if (!avatarSrc && thumbRow.thumbnail_url) avatarSrc = thumbRow.thumbnail_url.replace('_desktop_320x260.jpg', '_minithumb_40x40.jpg');
              } catch(_) {}
            }
            if (!avatarSrc) avatarSrc = product.thumbnail || product.imagen || product.image || null;

            // no-op: avatarSrc calculated above
            return (
            <TableRow key={o.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
              <TableCell sx={{ width: 100 }}>
                <Avatar
                  variant="rounded"
                  src={avatarSrc || undefined}
                  alt={product.name}
                  sx={{ width: 80, height: 80, bgcolor: avatarSrc ? 'transparent' : 'action.hover' }}
                >
                  {!avatarSrc && <ShoppingCartIcon />}
                </Avatar>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle1" fontWeight={700}>{product.name}</Typography>
                <Typography variant="body2" color="text.secondary">{o.quantity} uds • {formatPrice(o.price)}</Typography>
              </TableCell>
              <TableCell>
                {/* Mostrar tiempo restante para pendientes usando expires_at (si existe) */}
                {(() => {
                  // Fuente primaria para ventana post-aceptación: purchase_deadline
                  const now = Date.now();
                  const pdMs = o.purchase_deadline ? new Date(o.purchase_deadline).getTime() : null;
                  const expMs = o.expires_at ? new Date(o.expires_at).getTime() : null;
                  // Pending: usar expires_at (48h). Mostrar sólo si <48h (coherencia previa) y >0.
                  if (o.status === 'pending' && expMs != null) {
                    const remaining = expMs - now;
                    if (remaining <= 0) return <Typography>Caducada</Typography>;
                    if (remaining < 48 * 60 * 60 * 1000) {
                      const hrs = Math.floor(remaining / 3600000);
                      const mins = Math.floor((remaining % 3600000) / 60000);
                      if (hrs >= 1) return <Typography>{`${hrs} h ${mins} m`}</Typography>;
                      return <Typography>{`${mins} m`}</Typography>;
                    }
                    return <Typography color="text.secondary">-</Typography>;
                  }
                  // Approved: usar purchase_deadline; fallback expires_at si falta.
                  if (o.status === 'approved') {
                    const target = pdMs || expMs;
                    if (target != null) {
                      const remaining = target - now;
                      if (remaining <= 0) return <Typography>Caducada</Typography>;
                      const hrs = Math.floor(remaining / 3600000);
                      const mins = Math.floor((remaining % 3600000) / 60000);
                      if (hrs >= 1) return <Typography>{`${hrs} h ${mins} m`}</Typography>;
                      return <Typography>{`${mins} m`}</Typography>;
                    }
                    return <Typography>Menos de 24 horas</Typography>;
                  }
                  return <Typography color="text.secondary">-</Typography>;
                })()}
              </TableCell>
              <TableCell>
                <SafeChip label={STATUS_MAP[o.status].label} color={STATUS_MAP[o.status].color} />
              </TableCell>
              <TableCell>
                {/* Actions grouped so buttons stay on the same row and aligned */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {/* Add to cart action for approved offers */}
                  {o.status === 'approved' && (
                    <Tooltip title="Agregar al carrito">
                      {onAddToCart ? (
                        <IconButton
                          size="small"
                          aria-label="Agregar al carrito"
                          onClick={() => handleAddToCart(o)}
                          sx={{
                            bgcolor: 'transparent',
                            p: 0.5,
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.06)' },
                            '&:focus': { boxShadow: 'none', outline: 'none' },
                            '&.Mui-focusVisible': { boxShadow: 'none', outline: 'none' },
                          }}
                        >
                          <ShoppingCartIcon sx={{ color: 'primary.main' }} />
                        </IconButton>
                      ) : (
                        <AddToCart
                          product={o.product || { id: o.product_id, name: o.product_name, thumbnail: o.product_image }}
                          variant="icon"
                          size="small"
                          color="primary"
                          sx={{ p: 0.5 }}
                          offer={o}
                        />
                      )}
                    </Tooltip>
                  )}

                  {/* Cancel action for pending or approved offers (next to add-to-cart) */}
                  {(o.status === 'pending' || o.status === 'approved') && (
                    <Tooltip title="Cancelar Oferta">
                      <IconButton
                        size="small"
                        aria-label="Cancelar Oferta"
                        onClick={() => handleCancelOffer(o.id)}
                        sx={{
                          bgcolor: 'transparent',
                          p: 0.5,
                          color: 'error.main',
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.06)' },
                          '&:focus': { boxShadow: 'none', outline: 'none' },
                          '&.Mui-focusVisible': { boxShadow: 'none', outline: 'none' },
                        }}
                      >
                        <BlockIcon />
                      </IconButton>
                    </Tooltip>
                  )}

                  {/* Cleanup (delete) action for rejected or cancelled offers */}
                  {(o.status === 'rejected' || o.status === 'cancelled' || o.status === 'expired') && (
                    <Tooltip title="Limpiar esta oferta">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteOffer(o.id)}
                        sx={{
                          bgcolor: 'transparent',
                          p: 0.5,
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.06)' },
                          '&:focus': { boxShadow: 'none', outline: 'none' },
                          '&.Mui-focusVisible': { boxShadow: 'none', outline: 'none' },
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </TableCell>
            </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default OffersList;
