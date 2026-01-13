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
  useMediaQuery,
  useTheme,
  Button,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AddToCart } from '../../../../shared/components';
import ActionIconButton from '../../../../shared/components/buttons/ActionIconButton';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import {
  InfoOutlined as InfoOutlinedIcon,
  LocalOffer as LocalOfferIcon,
} from '@mui/icons-material';
import MobileOfferCard from '../../../../shared/components/mobile/MobileOfferCard';
import MobileOffersSkeleton from '../../../../shared/components/display/skeletons/MobileOffersSkeleton';
import MobileFilterAccordion from '../../../../shared/components/mobile/MobileFilterAccordion';
import ConfirmDialog from '../../../../shared/components/modals/ConfirmDialog';
import { toTitleCase } from '../../../../utils/textFormatters';

// Mapa canónico de estados visuales
const STATUS_MAP = {
  pending: { label: 'Pendiente', color: 'warning' },
  approved: { label: 'Aprobada', color: 'success' },
  rejected: { label: 'Rechazada', color: 'error' },
  expired: { label: 'Caducada', color: 'error' },
  cancelled: { label: 'Cancelada', color: 'error' },
  reserved: { label: 'En Carrito', color: 'info' },
  paid: { label: 'Pagada', color: 'success' },
};

/**
 * Helper para detectar si una oferta ha caducado temporalmente.
 * Una oferta "approved" caduca si purchase_deadline (o expires_at como fallback) ya pasó.
 * Una oferta "pending" caduca si expires_at ya pasó.
 */
const isOfferExpiredByDeadline = offer => {
  if (!offer) return false;
  const now = Date.now();
  const status = String(offer.status || '').toLowerCase();

  // Para ofertas approved/accepted: verificar purchase_deadline (fallback expires_at)
  if (status === 'approved' || status === 'accepted') {
    const deadline = offer.purchase_deadline || offer.expires_at;
    if (deadline) {
      const deadlineMs = new Date(deadline).getTime();
      if (!Number.isNaN(deadlineMs) && deadlineMs < now) {
        return true;
      }
    }
  }

  // Para ofertas pending: verificar expires_at
  if (status === 'pending') {
    const expiresAt = offer.expires_at;
    if (expiresAt) {
      const expiresMs = new Date(expiresAt).getTime();
      if (!Number.isNaN(expiresMs) && expiresMs < now) {
        return true;
      }
    }
  }

  return false;
};

// Normalización (backend puede enviar "accepted" u otros legacy)
// AHORA también considera si la oferta caducó temporalmente
const normalizeStatus = (raw, offer = null) => {
  if (!raw) return 'pending';
  const s = String(raw).toLowerCase();

  // Si la oferta está temporalmente caducada, retornar 'expired'
  if (offer && isOfferExpiredByDeadline({ ...offer, status: s })) {
    return 'expired';
  }

  if (s === 'accepted') return 'approved';
  if (s === 'success') return 'paid';
  // fallback
  return STATUS_MAP[s] ? s : 'pending';
};

// Wrapper that ensures onClick is a function before passing it to MUI Chip
const SafeChip = props => {
  const { onClick, ...rest } = props;
  const safeOnClick = typeof onClick === 'function' ? onClick : undefined;
  return <Chip {...rest} onClick={safeOnClick} />;
};

// Formatea números como moneda con separador de miles y prefijo $ (ej: $1.234)
const formatPrice = value => {
  if (value == null) return '';
  const num =
    typeof value === 'number'
      ? value
      : Number(String(value).replace(/[^0-9.-]+/g, ''));
  if (Number.isNaN(num)) return String(value);
  return '$' + new Intl.NumberFormat('es-CL').format(Math.round(num));
};

import { useThumbnailsBatch } from '../../../../hooks/useThumbnailQueries';
import TableSkeleton from '../../../../shared/components/display/skeletons/TableSkeleton';

const OffersList = ({
  offers = [],
  loading = false,
  error = null,
  cancelOffer,
  deleteOffer,
  onCancelOffer,
  onDeleteOffer,
  onAddToCart,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [statusOverrides, setStatusOverrides] = React.useState({}); // { offer_id: 'reserved' | 'paid' | ... }
  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false);
  const [offerToCancel, setOfferToCancel] = React.useState(null);
  const [cancelLoading, setCancelLoading] = React.useState(false);

  // Preparar petición batch de thumbnails para los productos mostrados
  const productIds = React.useMemo(
    () =>
      (offers || []).map(o => o.product?.id || o.product_id).filter(Boolean),
    [offers]
  );
  const thumbnailsQuery = useThumbnailsBatch(productIds);

  // thumbnailsQuery is used below to resolve product thumbnails in batch

  const filtered = React.useMemo(() => {
    if (!offers) return [];
    const normalized = offers.map(o => {
      const override = statusOverrides[o.id];
      const rawStatus = override || o.status;
      // Pasar el objeto completo para que normalizeStatus pueda validar expiración
      return { ...o, status: normalizeStatus(rawStatus, o) };
    });
    if (statusFilter === 'all') return normalized;
    return normalized.filter(o => o.status === statusFilter);
  }, [offers, statusFilter, statusOverrides]);

  // Listener para mutaciones optimistas emitidas desde AddToCart
  React.useEffect(() => {
    const handler = ev => {
      try {
        const detail = ev.detail || {};
        if (!detail.offer_id || !detail.status) return;
        // Sólo aplicar si la oferta está presente actualmente
        const exists = (offers || []).some(
          o => String(o.id) === String(detail.offer_id)
        );
        if (!exists) return;
        setStatusOverrides(prev => {
          // Evitar override si ya está en un estado final (paid) y el nuevo no lo supera
          const current = prev[detail.offer_id];
          if (current === 'paid') return prev;
          return { ...prev, [detail.offer_id]: detail.status };
        });
      } catch (_) {}
    };
    window.addEventListener('offer-status-optimistic', handler);
    return () => window.removeEventListener('offer-status-optimistic', handler);
  }, [offers]);

  // Debugging: limit noisy logs by counting a few rows only
  const debugCounterRef = React.useRef(0);

  const handleCancelOffer = offerId => {
    const offer = offers.find(o => o.id === offerId);
    setOfferToCancel(offer);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!offerToCancel) return;

    setCancelLoading(true);
    try {
      if (onCancelOffer) {
        await onCancelOffer(offerToCancel);
      } else if (cancelOffer) {
        await cancelOffer(offerToCancel.id);
      }
    } catch (error) {
      console.error('Error canceling offer:', error);
    } finally {
      setCancelLoading(false);
      setCancelDialogOpen(false);
      setOfferToCancel(null);
    }
  };

  const handleCloseCancelDialog = () => {
    if (!cancelLoading) {
      setCancelDialogOpen(false);
      setOfferToCancel(null);
    }
  };

  const handleDeleteOffer = async offerId => {
    try {
      if (onDeleteOffer)
        return onDeleteOffer(offers.find(o => o.id === offerId));
      if (deleteOffer) return await deleteOffer(offerId, 'buyer');
    } catch (error) {
      console.error('Error deleting offer:', error);
    }
  };

  const handleAddToCart = offer => {
    if (onAddToCart) return onAddToCart(offer);
    console.log('Add to cart:', offer);
  };

  // Handler para acciones desde MobileOfferCard
  const handleMobileAction = (action, fullOffer) => {
    switch (action) {
      case 'addToCart':
        handleAddToCart(fullOffer);
        break;
      case 'cancel':
        handleCancelOffer(fullOffer.id);
        break;
      case 'delete':
        handleDeleteOffer(fullOffer.id);
        break;
      default:
        console.warn(`Acción desconocida: ${action}`);
    }
  };

  // Calcular contadores para filtros mobile
  const filterCounts = React.useMemo(() => {
    if (!offers) return {};
    const normalized = offers.map(o => {
      const override = statusOverrides[o.id];
      const rawStatus = override || o.status;
      return { ...o, status: normalizeStatus(rawStatus, o) };
    });

    const counts = {
      all: normalized.length,
      pending: 0,
      approved: 0,
      cancelled: 0,
      rejected: 0,
      expired: 0,
      reserved: 0,
      paid: 0,
    };

    normalized.forEach(o => {
      if (counts[o.status] !== undefined) {
        counts[o.status]++;
      }
    });

    return counts;
  }, [offers, statusOverrides]);

  const filterOptions = [
    { value: 'all', label: 'Todas', count: filterCounts.all },
    { value: 'pending', label: 'Pendiente', count: filterCounts.pending },
    { value: 'approved', label: 'Aprobada', count: filterCounts.approved },
    { value: 'cancelled', label: 'Cancelada', count: filterCounts.cancelled },
    { value: 'rejected', label: 'Rechazada', count: filterCounts.rejected },
    { value: 'expired', label: 'Caducada', count: filterCounts.expired },
    { value: 'reserved', label: 'En Carrito', count: filterCounts.reserved },
    { value: 'paid', label: 'Pagada', count: filterCounts.paid },
  ];

  // Estado vacío global (componente reutilizable)
  const EmptyStateGlobal = () => (
    <Paper sx={{ p: { xs: 2, md: 4 }, textAlign: 'center' }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <LocalOfferIcon sx={{ fontSize: 48, color: 'primary.main' }} />
      </Box>
      <Typography
        variant="h6"
        color="text.secondary"
        sx={{ fontSize: { md: '1.5rem' } }}
      >
        Aun no has enviado ofertas
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mt: 1, mb: 3, fontSize: { md: '1.05rem' } }}
      >
        En Sellsi puedes negociar precios, volumenes y condiciones
        directamente con proveedores. Envía tu primera oferta y comienza a
        cerrar negocios.
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={() => navigate('/buyer/marketplace')}
      >
        Ir al Marketplace
      </Button>
    </Paper>
  );

  // Estado vacío por filtro (componente reutilizable)
  const EmptyStateFiltered = () => (
    <Paper sx={{ p: { xs: 3, md: 4 }, textAlign: 'center' }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <LocalOfferIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
      </Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
        No hay ofertas con este estado
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Intenta seleccionar otro filtro para ver tus ofertas en diferentes estados,
        o cambia a "Todas" para ver el listado completo.
      </Typography>
    </Paper>
  );

  // Loading inicial (sin datos previos)
  if (loading && (!offers || offers.length === 0)) {
    return isMobile ? (
      <MobileOffersSkeleton rows={3} />
    ) : (
      <TableSkeleton rows={6} columns={4} withAvatar variant="table" />
    );
  }

  // Mobile View: Cards
  if (isMobile) {
    return (
      <>
        <Box sx={{ position: 'relative' }}>
          {loading && offers && offers.length > 0 && (
            <Box sx={{ position: 'absolute', top: 8, right: 12, zIndex: 10 }}>
              <Typography variant="caption" color="text.secondary">
                Actualizando…
              </Typography>
            </Box>
          )}

          {/* Filtros SIEMPRE visibles */}
          <MobileFilterAccordion
            currentFilter={statusFilter}
            onFilterChange={setStatusFilter}
            filterOptions={filterOptions}
            label="Estado de ofertas"
          />

          <Box sx={{ px: { xs: 2, sm: 0 } }}>
            {filtered.length === 0 ? (
              // Diferenciar entre sin datos globales vs sin datos por filtro
              (!offers || offers.length === 0) ? (
                <EmptyStateGlobal />
              ) : (
                <EmptyStateFiltered />
              )
            ) : (
              filtered.map(o => {
                // Construir objeto product fusionando datos de la vista SQL
                const product = {
                  id: o.product_id,
                  name: o.product_name || 'Producto',
                  thumbnails: o.product_thumbnails || null,
                  thumbnail_url: o.product_thumbnail_url || null,
                  imagen: o.product_image || null,
                  ...(o.product || {}), // Fusionar datos adicionales si existen
                };

                // Calcular avatarSrc usando thumbnails de la vista SQL
                let avatarSrc = null;
                
                // Prioridad 1: thumbnails.mobile
                if (product.thumbnails && typeof product.thumbnails === 'object') {
                  avatarSrc = product.thumbnails.mobile || null;
                }
                
                // Prioridad 2: thumbnail_url transformado a mobile
                if (!avatarSrc && product.thumbnail_url) {
                  avatarSrc = product.thumbnail_url.replace(
                    '_desktop_320x260.jpg',
                    '_mobile_190x153.jpg'
                  );
                }
                
                // Prioridad 3: imagen principal (para WebP sin thumbnails)
                if (!avatarSrc && product.imagen) {
                  avatarSrc = product.imagen;
                }

                return (
                  <MobileOfferCard
                    key={o.id}
                    variant="buyer"
                    fullOffer={o}
                    data={{
                      id: o.id,
                      product_name: product.name,
                      thumbnail_url: avatarSrc,
                      status: o.status,
                      created_at: o.created_at,
                      quantity: o.quantity,
                      offered_price: o.price,
                      purchase_deadline: o.purchase_deadline,
                      expires_at: o.expires_at,
                      product: {
                        id: o.product_id,
                        productid: o.product_id,
                        name: o.product_name,
                        nombre: o.product_name,
                        thumbnail: avatarSrc,
                        imagen: avatarSrc,
                        supplier_id: o.supplier_id,
                        supplierId: o.supplier_id,
                        price: o.current_product_price,
                        precio: o.current_product_price,
                        stock: o.current_stock,
                        ...(o.product || {}),
                      },
                      product_id: o.product_id || product.id,
                      product_image: o.product_image || product.thumbnail,
                    }}
                    onAction={handleMobileAction}
                  />
                );
              })
            )}
          </Box>
        </Box>

        {/* Modal de confirmación para cancelar oferta */}
        <ConfirmDialog
          open={cancelDialogOpen}
          title="¿Cancelar esta oferta?"
          description={`La oferta ${
            offerToCancel
              ? `de ${formatPrice(offerToCancel.offered_price)} por ${
                  offerToCancel.offered_quantity
                } unidad${offerToCancel.offered_quantity > 1 ? 'es' : ''}`
              : ''
          } será cancelada. Esta acción no se puede deshacer.`}
          confirmText={cancelLoading ? 'Cancelando...' : 'Cancelar oferta'}
          cancelText="Volver"
          onConfirm={handleConfirmCancel}
          onCancel={handleCloseCancelDialog}
          disabled={cancelLoading}
        />
      </>
    );
  }

  // Desktop View: Table
  return (
    <>
      {/* Filtros SIEMPRE visibles */}
      <Box sx={{ display: 'flex', gap: 2, p: 2, alignItems: 'center' }}>
        <Typography fontWeight={600}>Filtrar por estado:</Typography>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="offers-filter-label">Estado</InputLabel>
          <Select
            labelId="offers-filter-label"
            value={statusFilter}
            label="Estado"
            onChange={e => setStatusFilter(e.target.value)}
            MenuProps={{ disableScrollLock: true }}
          >
            <MenuItem value="all">Todos</MenuItem>
            <MenuItem value="pending">Pendiente</MenuItem>
            <MenuItem value="approved">Aprobada</MenuItem>
            <MenuItem value="cancelled">Cancelada</MenuItem>
            <MenuItem value="rejected">Rechazada</MenuItem>
            <MenuItem value="expired">Caducada</MenuItem>
            <MenuItem value="reserved">En Carrito</MenuItem>
            <MenuItem value="paid">Pagada</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      {/* Tabla o Estado Vacío */}
      {filtered.length === 0 ? (
        // Diferenciar entre sin datos globales vs sin datos por filtro
        (!offers || offers.length === 0) ? (
          <EmptyStateGlobal />
        ) : (
          <EmptyStateFiltered />
        )
      ) : (
        <TableContainer
          component={Paper}
          sx={{ p: 0, position: 'relative', scrollbarGutter: 'stable' }}
        >
          {loading && offers && offers.length > 0 && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                bgcolor: 'rgba(255,255,255,0.55)',
                zIndex: 2,
              }}
            >
              <Box sx={{ position: 'absolute', top: 8, right: 12 }}>
                <Typography variant="caption" color="text.secondary">
                  Actualizando…
                </Typography>
              </Box>
            </Box>
          )}
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
                          <Typography
                            variant="subtitle2"
                            sx={{ color: 'common.white', fontWeight: 'bold' }}
                            gutterBottom
                          >
                            Cómo usar Acciones
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: 'common.white' }}
                            display="block"
                          >
                            Cuando una oferta es aprobada, la forma de completar
                            la compra es agregando esa oferta al carrito desde
                            esta sección. <br /> <br />
                            Contarás con un máximo de 24 horas para hacer esto
                            antes de que la oferta caduque.
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: 'common.white', mt: 1 }}
                            display="block"
                          >
                            Para cancelar una oferta (Pendiente o Aprobada),
                            utiliza la acción "Cancelar Oferta". Una vez
                            cancelada, la oferta se marcará como "Cancelada" y
                            podrás limpiarla si lo deseas.
                          </Typography>
                        </Box>
                      }
                    >
                      <IconButton
                        size="small"
                        aria-label="Información de acciones"
                      >
                        <InfoOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map(o => {
              // Construir objeto product fusionando datos de la vista SQL
              const product = {
                id: o.product_id,
                name: o.product_name || 'Producto',
                thumbnails: o.product_thumbnails || null,
                thumbnail_url: o.product_thumbnail_url || null,
                imagen: o.product_image || null,
                ...(o.product || {}), // Fusionar datos adicionales si existen
              };

              // Calcular avatarSrc usando batch query (thumbnailsQuery) o fallback a vista SQL
              const pid = product.id || o.product_id;
              const thumbRow = thumbnailsQuery?.data?.[pid] ?? null;
              let avatarSrc = null;
              
              // Prioridad 1: thumbnailsQuery batch (más fresco)
              if (thumbRow) {
                if (thumbRow.thumbnails?.mobile) {
                  avatarSrc = thumbRow.thumbnails.mobile;
                } else if (thumbRow.thumbnail_url) {
                  avatarSrc = thumbRow.thumbnail_url.replace('_desktop_320x260.jpg', '_mobile_190x153.jpg');
                }
              }
              
              // Prioridad 2: thumbnails de la vista SQL
              if (!avatarSrc && product.thumbnails?.mobile) {
                avatarSrc = product.thumbnails.mobile;
              }
              
              // Prioridad 3: thumbnail_url transformado a mobile
              if (!avatarSrc && product.thumbnail_url) {
                avatarSrc = product.thumbnail_url.replace('_desktop_320x260.jpg', '_mobile_190x153.jpg');
              }
              
              // Prioridad 4: imagen principal (para WebP sin thumbnails)
              if (!avatarSrc && product.imagen) {
                avatarSrc = product.imagen;
              }

              // no-op: avatarSrc calculated above
              return (
                <TableRow
                  key={o.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell sx={{ width: 100 }}>
                    <Avatar
                      variant="rounded"
                      src={avatarSrc || undefined}
                      alt={product.name}
                      sx={{
                        width: 80,
                        height: 80,
                        bgcolor: avatarSrc ? 'transparent' : 'action.hover',
                      }}
                    >
                      {!avatarSrc && <ShoppingCartIcon />}
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {toTitleCase(product.name)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {o.quantity} uds • {formatPrice(o.price)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {/* Mostrar tiempo restante para pendientes usando expires_at (si existe) */}
                    {(() => {
                      // Fuente primaria para ventana post-aceptación: purchase_deadline
                      const now = Date.now();
                      const pdMs = o.purchase_deadline
                        ? new Date(o.purchase_deadline).getTime()
                        : null;
                      const expMs = o.expires_at
                        ? new Date(o.expires_at).getTime()
                        : null;
                      // Pending: usar expires_at (48h). Mostrar sólo si <48h (coherencia previa) y >0.
                      if (o.status === 'pending' && expMs != null) {
                        const remaining = expMs - now;
                        if (remaining <= 0)
                          return <Typography>Caducada</Typography>;
                        if (remaining < 48 * 60 * 60 * 1000) {
                          const hrs = Math.floor(remaining / 3600000);
                          const mins = Math.floor(
                            (remaining % 3600000) / 60000
                          );
                          if (hrs >= 1)
                            return (
                              <Typography>{`${hrs} h ${mins} m`}</Typography>
                            );
                          return <Typography>{`${mins} m`}</Typography>;
                        }
                        return (
                          <Typography color="text.secondary">-</Typography>
                        );
                      }
                      // Approved: usar purchase_deadline; fallback expires_at si falta.
                      if (o.status === 'approved') {
                        const target = pdMs || expMs;
                        if (target != null) {
                          const remaining = target - now;
                          if (remaining <= 0)
                            return <Typography>Caducada</Typography>;
                          const hrs = Math.floor(remaining / 3600000);
                          const mins = Math.floor(
                            (remaining % 3600000) / 60000
                          );
                          if (hrs >= 1)
                            return (
                              <Typography>{`${hrs} h ${mins} m`}</Typography>
                            );
                          return <Typography>{`${mins} m`}</Typography>;
                        }
                        return <Typography>Menos de 24 horas</Typography>;
                      }
                      return <Typography color="text.secondary">-</Typography>;
                    })()}
                  </TableCell>
                  <TableCell>
                    <SafeChip
                      label={(STATUS_MAP[o.status] || STATUS_MAP.pending).label}
                      color={(STATUS_MAP[o.status] || STATUS_MAP.pending).color}
                    />
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
                                '&:focus': {
                                  boxShadow: 'none',
                                  outline: 'none',
                                },
                                '&.Mui-focusVisible': {
                                  boxShadow: 'none',
                                  outline: 'none',
                                },
                              }}
                            >
                              <ShoppingCartIcon
                                sx={{ color: 'primary.main' }}
                              />
                            </IconButton>
                          ) : (
                            <AddToCart
                              product={{
                                id: o.product_id,
                                productid: o.product_id,
                                name: o.product_name,
                                nombre: o.product_name,
                                thumbnail: avatarSrc,
                                imagen: avatarSrc,
                                supplier_id: o.supplier_id,
                                supplierId: o.supplier_id,
                                price: o.current_product_price,
                                precio: o.current_product_price,
                                stock: o.current_stock,
                                ...(o.product || {}),
                              }}
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
                        <ActionIconButton
                          tooltip="Cancelar Oferta"
                          variant="error"
                          onClick={() => handleCancelOffer(o.id)}
                          ariaLabel="Cancelar Oferta"
                        >
                          <CloseIcon fontSize="small" />
                        </ActionIconButton>
                      )}

                      {/* Cleanup (delete) action for rejected, cancelled, expired, or paid offers */}
                      {(o.status === 'rejected' ||
                        o.status === 'cancelled' ||
                        o.status === 'expired' ||
                        o.status === 'paid') && (
                        <ActionIconButton
                          tooltip="Limpiar esta oferta"
                          variant="default"
                          onClick={() => handleDeleteOffer(o.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </ActionIconButton>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      )}
      
      {/* Modal de confirmación para cancelar oferta */}
      <ConfirmDialog
        open={cancelDialogOpen}
        title="¿Cancelar esta oferta?"
        description={`La oferta ${
          offerToCancel
            ? `de ${formatPrice(offerToCancel.offered_price)} por ${
                offerToCancel.offered_quantity
              } unidad${offerToCancel.offered_quantity > 1 ? 'es' : ''}`
            : ''
        } será cancelada. Esta acción no se puede deshacer.`}
        confirmText={cancelLoading ? 'Cancelando...' : 'Cancelar oferta'}
        cancelText="Volver"
        onConfirm={handleConfirmCancel}
        onCancel={handleCloseCancelDialog}
        disabled={cancelLoading}
      />
    </>
  );
};

export default OffersList;
