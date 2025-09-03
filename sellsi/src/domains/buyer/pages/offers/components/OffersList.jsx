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

const OffersList = ({ offers = [], loading = false, error = null, cancelOffer, deleteOffer, onCancelOffer, onDeleteOffer, onAddToCart }) => {
  const [statusFilter, setStatusFilter] = React.useState('all');

  const filtered = React.useMemo(() => {
    if (!offers) return [];
    if (statusFilter === 'all') return offers;
    return offers.filter(o => o.status === statusFilter);
  }, [offers, statusFilter]);

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

  // If there are no offers (and not loading/error), show friendly empty state like MyOrders
  if (!loading && !error && (!filtered || filtered.length === 0)) {
    return (
      <Paper sx={{ p: { xs: 2, md: 4 }, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No has enviado ofertas
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 1 }}
        >
          Envía ofertas a proveedores desde la ficha de producto. Aquí verás el estado de cada propuesta.
        </Typography>
      </Paper>
    );
  }

  // Simple table similar to BuyerOrders but lightweight
  return (
    <TableContainer component={Paper} sx={{ p: 0, scrollbarGutter: 'stable' }}>
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
          {filtered.map((o) => {
            const product = o.product || { name: o.product_name || 'Producto', thumbnail: null };
            return (
            <TableRow key={o.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
              <TableCell sx={{ width: 100 }}>
                <Avatar
                  variant="rounded"
                  src={product.thumbnail || '/public/minilogo.png'}
                  alt={product.name}
                  sx={{ width: 80, height: 80 }}
                />
              </TableCell>
              <TableCell>
                <Typography variant="subtitle1" fontWeight={700}>{product.name}</Typography>
                <Typography variant="body2" color="text.secondary">{o.quantity} uds • {formatPrice(o.price)}</Typography>
              </TableCell>
              <TableCell>
                {/* Mostrar tiempo restante para pendientes usando expires_at (si existe) */}
                {(() => {
                  const remainingMs = o.expires_at ? new Date(o.expires_at).getTime() - Date.now() : null;
                  // Pendiente: mostrar sólo si expires_at existe y queda < 48h
                  if (o.status === 'pending' && remainingMs != null && remainingMs < 48 * 60 * 60 * 1000) {
                    if (remainingMs <= 0) return <Typography>Caducada</Typography>;
                    const hrs = Math.floor(remainingMs / (1000 * 60 * 60));
                    const mins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
                    if (hrs >= 1) return <Typography>{`${hrs} h ${mins} m`}</Typography>;
                    return <Typography>{`${mins} m`}</Typography>;
                  }
                  // Aceptada: límite = 24h. Si expires_at existe y queda <24h mostrar tiempo; si no, mostrar texto por defecto.
                  if (o.status === 'approved') {
                    if (remainingMs != null && remainingMs > 0 && remainingMs < 24 * 60 * 60 * 1000) {
                      const hrs = Math.floor(remainingMs / (1000 * 60 * 60));
                      const mins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
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
                {/* Add to cart action for approved offers (left) */}
                {o.status === 'approved' && (
                  <Tooltip title="Agregar al carrito">
                    <IconButton
                      size="small"
                      aria-label="Agregar al carrito"
                      onClick={() => handleAddToCart(o)}
                      sx={{
                        bgcolor: 'transparent',
                        p: 0.5,
                        ml: 3,
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.06)' },
                        '&:focus': { boxShadow: 'none', outline: 'none' },
                        '&.Mui-focusVisible': { boxShadow: 'none', outline: 'none' },
                      }}
                    >
                      <ShoppingCartIcon sx={{ color: 'primary.main' }} />
                    </IconButton>
                  </Tooltip>
                )}

                {/* Cancel action for pending or approved offers (right of add-to-cart) */}
                {(o.status === 'pending' || o.status === 'approved') && (
                  <Tooltip title="Cancelar Oferta">
                    <IconButton
                      size="small"
                      aria-label="Cancelar Oferta"
                      onClick={() => handleCancelOffer(o.id)}
                      sx={{
                        bgcolor: 'transparent',
                        p: 0.5,
                        ml: 3,
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
                        ml: 3,
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.06)' },
                        '&:focus': { boxShadow: 'none', outline: 'none' },
                        '&.Mui-focusVisible': { boxShadow: 'none', outline: 'none' },
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                )}
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
