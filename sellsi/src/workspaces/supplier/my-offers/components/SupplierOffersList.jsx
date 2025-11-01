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
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { useBanner } from '../../../../shared/components/display/banners/BannerContext';
import { Check as CheckIcon } from '@mui/icons-material';
import SupplierOfferActionModals from './SupplierOfferActionModals';
import { supabase } from '../../../../services/supabase';
import TableSkeleton from '../../../../shared/components/display/skeletons/TableSkeleton';
import BlockIcon from '@mui/icons-material/Block';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

// Map de estados internos -> label/color
const STATUS_MAP = {
  pending: { label: 'Pendiente', color: 'warning' },
  approved: { label: 'Aceptada', color: 'success' },
  paid: { label: 'Aceptada', color: 'success' },
  rejected: { label: 'Rechazada', color: 'error' },
  expired: { label: 'Caducada', color: 'error' },
};

// Formatear CLP
const formatCLP = num => {
  if (num == null || Number.isNaN(Number(num))) return '';
  return '$' + new Intl.NumberFormat('es-CL').format(Math.round(num));
};

const SafeChip = ({ onClick, ...rest }) => (
  <Chip
    {...rest}
    onClick={typeof onClick === 'function' ? onClick : undefined}
  />
);

const SupplierOffersList = ({
  offers = [],
  setOffers,
  acceptOffer,
  rejectOffer,
  deleteOffer,
  loading,
  initializing = false,
}) => {
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [modalState, setModalState] = React.useState({
    open: false,
    mode: null,
    offer: null,
  });
  const { showBanner } = useBanner();
  const cleanupDebounceRef = React.useRef(false);

  const filtered = React.useMemo(() => {
    if (statusFilter === 'all') return offers;
    return offers.filter(o => o.status === statusFilter);
  }, [offers, statusFilter]);

  const updateOfferStatus = (id, nextStatus) =>
    setOffers(prev =>
      prev.map(o => (o.id === id ? { ...o, status: nextStatus } : o))
    );
  const removeOffer = id => setOffers(prev => prev.filter(o => o.id !== id));

  const openModal = (mode, offer) => {
    // 1. Enriquecimiento rápido sin llamadas externas (sin capturar offered price como original)
    let enriched = offer;
    try {
      const p = offer?.product || {};
      if (p && p.previousPrice == null) {
        const tiers = Array.isArray(p.price_tiers) ? p.price_tiers : [];
        // Preferir snapshots proporcionados por la fila de la oferta / vista offers_with_details
        const baseFromOffer =
          offer.base_price_at_offer ??
          offer.tier_price_at_offer ??
          offer.current_product_price ??
          null;
        const baseLocal =
          baseFromOffer ??
          p.base_price ??
          p.price ??
          p.precio ??
          (tiers[0]?.price || tiers[0]?.precio) ??
          null;
        const stockFromOffer = offer.current_stock ?? null;
        const stockLocal =
          stockFromOffer ??
          (p.stock != null
            ? p.stock
            : p.productqty != null
            ? p.productqty
            : null);
        enriched = {
          ...offer,
          product: { ...p, previousPrice: baseLocal, stock: stockLocal },
        };
      }
    } catch (_) {}
    setModalState({ open: true, mode, offer: enriched });

    // 2. No hacemos fetch adicional: la vista RPC `offers_with_details` ya provee
    //    snapshot (base_price_at_offer, tier_price_at_offer, current_product_price, current_stock).
    //    Mantener la modal enriquecida desde el objeto de la oferta.
  };
  const closeModal = () =>
    setModalState({ open: false, mode: null, offer: null });

  const handleAccept = async offer => {
    try {
      if (acceptOffer) {
        await acceptOffer(offer.id);
      }
      // También actualizar el estado local para UI inmediata
      setOffers(prev =>
        prev.map(o =>
          o.id === offer.id
            ? {
                ...o,
                status: 'approved',
                expires_at: new Date(
                  Date.now() + 24 * 60 * 60 * 1000
                ).toISOString(),
              }
            : o
        )
      );
      closeModal();
      showBanner({
        message: `✅ Oferta aceptada. Se reservó ${offer.quantity} uds de ${offer.product?.name}.`,
        severity: 'success',
        duration: 4000,
      });
    } catch (error) {
      console.error('Error accepting offer:', error);
      showBanner({
        message: `Error al aceptar la oferta`,
        severity: 'error',
        duration: 4000,
      });
    }
  };

  const handleReject = async offer => {
    try {
      if (rejectOffer) {
        await rejectOffer(offer.id);
      }
      updateOfferStatus(offer.id, 'rejected');
      closeModal();
      showBanner({
        message: `❌ Oferta rechazada. Se notificó al ofertante (${offer.buyer?.name}).`,
        severity: 'error',
        duration: 4000,
      });
    } catch (error) {
      console.error('Error rejecting offer:', error);
      showBanner({
        message: `Error al rechazar la oferta`,
        severity: 'error',
        duration: 4000,
      });
    }
  };

  const handleCleanup = async offer => {
    try {
      if (deleteOffer) {
        await deleteOffer(offer.id, 'supplier');
      }
      removeOffer(offer.id);
      closeModal();
      // Debounce banner so many clicks show only one
      if (cleanupDebounceRef.current) return;
      cleanupDebounceRef.current = true;
      showBanner({
        message: `Oferta eliminada de tus registros.`,
        severity: 'success',
        duration: 3000,
      });
      setTimeout(() => {
        cleanupDebounceRef.current = false;
      }, 1500);
    } catch (error) {
      console.error('Error deleting offer:', error);
      showBanner({
        message: `Error al eliminar la oferta`,
        severity: 'error',
        duration: 4000,
      });
    }
  };

  const hasOffers = offers && offers.length > 0;
  if (!hasOffers) {
    if (initializing || loading) return <TableSkeleton rows={6} columns={5} />;
    return (
      <Paper sx={{ p: { xs: 2, md: 4 }, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Aún no tienes ofertas
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Cuando compradores te envíen propuestas, las verás aquí. Podrás
          aceptar o rechazar cada oferta.
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ p: 0 }}>
      <Box sx={{ display: 'flex', gap: 2, p: 2, alignItems: 'center' }}>
        <Typography fontWeight={600}>Filtrar por estado:</Typography>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="supplier-offers-filter-label">Estado</InputLabel>
          <Select
            labelId="supplier-offers-filter-label"
            value={statusFilter}
            label="Estado"
            onChange={e => setStatusFilter(e.target.value)}
            MenuProps={{ disableScrollLock: true }}
          >
            <MenuItem value="all">Todos</MenuItem>
            <MenuItem value="pending">Pendiente</MenuItem>
            <MenuItem value="approved">Aceptada</MenuItem>
            <MenuItem value="rejected">Rechazada</MenuItem>
            <MenuItem value="expired">Caducada</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>
              <Typography fontWeight={700}>Producto</Typography>
            </TableCell>
            <TableCell>
              <Typography fontWeight={700}>Precio Ofertado</Typography>
            </TableCell>
            <TableCell>
              <Typography fontWeight={700}>Ofertante</Typography>
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
                    tooltip: { sx: { maxWidth: 300, p: 1.25 } },
                  }}
                  title={
                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{ color: 'common.white', fontWeight: 'bold' }}
                        gutterBottom
                      >
                        Acciones disponibles
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: 'common.white' }}
                        display="block"
                      >
                        Acepta o rechaza ofertas pendientes. <br></br>Cuando una
                        oferta queda aceptada o rechazada puedes limpiarla
                        (eliminarla) con el basurero.
                      </Typography>
                    </Box>
                  }
                >
                  <IconButton
                    size="small"
                    aria-label="Información de acciones"
                    sx={{
                      '&.Mui-focusVisible': {
                        outline: 'none',
                        boxShadow: 'none',
                      },
                      '&:focus': { outline: 'none', boxShadow: 'none' },
                      '&:focus-visible': { outline: 'none', boxShadow: 'none' },
                    }}
                  >
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
              <TableCell colSpan={6} sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  No hay ofertas con este estado
                </Typography>
              </TableCell>
            </TableRow>
          )}
          {filtered.map(o => {
            const total = o.quantity * o.price;
            // calcular tiempo restante si existe expires_at
            const remainingMs = o.expires_at
              ? new Date(o.expires_at).getTime() - Date.now()
              : null;
            const remainingHours = remainingMs
              ? remainingMs / (1000 * 60 * 60)
              : null;
            const formatRemaining = () => {
              if (!remainingMs) return null;
              if (remainingMs <= 0) return 'Caducada';
              const hrs = Math.floor(remainingMs / (1000 * 60 * 60));
              const mins = Math.floor(
                (remainingMs % (1000 * 60 * 60)) / (1000 * 60)
              );
              if (hrs >= 1) return `${hrs} h ${mins} m`;
              return `${mins} m`;
            };
            return (
              <TableRow
                key={o.id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {o.product?.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={500}>
                    {o.quantity} uds * {formatCLP(o.price)} = {formatCLP(total)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{o.buyer?.name}</Typography>
                </TableCell>
                <TableCell>
                  {o.status === 'pending' &&
                  remainingHours != null &&
                  remainingHours < 48 ? (
                    <Typography>{formatRemaining()}</Typography>
                  ) : (
                    <Typography color="text.secondary">-</Typography>
                  )}
                </TableCell>
                <TableCell>
                  {(() => {
                    const statusInfo =
                      o && o.status && STATUS_MAP[o.status]
                        ? STATUS_MAP[o.status]
                        : { label: 'Desconocido', color: 'default' };
                    return (
                      <SafeChip
                        label={statusInfo.label}
                        color={statusInfo.color}
                        size="small"
                      />
                    );
                  })()}
                </TableCell>
                <TableCell>
                  {o.status === 'pending' && (
                    <Tooltip title="Aceptar Oferta">
                      <IconButton
                        size="small"
                        aria-label="Aceptar Oferta"
                        onClick={() => openModal('accept', o)}
                        color="success"
                        sx={{
                          ml: 1,
                          '&.Mui-focusVisible': {
                            outline: 'none',
                            boxShadow: 'none',
                          },
                          '&:focus': { outline: 'none', boxShadow: 'none' },
                          '&:focus-visible': {
                            outline: 'none',
                            boxShadow: 'none',
                          },
                        }}
                      >
                        <CheckIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  {o.status === 'pending' && (
                    <Tooltip title="Rechazar Oferta">
                      <IconButton
                        size="small"
                        aria-label="Rechazar Oferta"
                        onClick={() => openModal('reject', o)}
                        color="error"
                        sx={{
                          ml: 1,
                          '&.Mui-focusVisible': {
                            outline: 'none',
                            boxShadow: 'none',
                          },
                          '&:focus': { outline: 'none', boxShadow: 'none' },
                          '&:focus-visible': {
                            outline: 'none',
                            boxShadow: 'none',
                          },
                        }}
                      >
                        <BlockIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {(o.status === 'approved' ||
                    o.status === 'paid' ||
                    o.status === 'rejected' ||
                    o.status === 'expired') && (
                    <Tooltip title="Limpiar Oferta">
                      <IconButton
                        size="small"
                        aria-label="Limpiar Oferta"
                        onClick={() => openModal('cleanup', o)}
                        sx={{
                          ml: 1,
                          '&.Mui-focusVisible': {
                            outline: 'none',
                            boxShadow: 'none',
                          },
                          '&:focus': { outline: 'none', boxShadow: 'none' },
                          '&:focus-visible': {
                            outline: 'none',
                            boxShadow: 'none',
                          },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <SupplierOfferActionModals
        open={modalState.open}
        mode={modalState.mode}
        offer={modalState.offer}
        onClose={closeModal}
        onAccept={handleAccept}
        onReject={handleReject}
        onCleanup={handleCleanup}
      />
    </TableContainer>
  );
};

export default SupplierOffersList;
