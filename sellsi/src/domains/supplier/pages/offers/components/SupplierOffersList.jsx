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
import { useBanner } from '../../../../../shared/components/display/banners/BannerContext';
import { Check as CheckIcon } from '@mui/icons-material';
import SupplierOfferActionModals from './SupplierOfferActionModals';
import BlockIcon from '@mui/icons-material/Block';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

// Map de estados internos -> label/color
const STATUS_MAP = {
  pending: { label: 'Pendiente', color: 'warning' },
  approved: { label: 'Aceptada', color: 'success' },
  rejected: { label: 'Rechazada', color: 'error' },
};

// Formatear CLP
const formatCLP = (num) => {
  if (num == null || Number.isNaN(Number(num))) return '';
  return '$' + new Intl.NumberFormat('es-CL').format(Math.round(num));
};

const SafeChip = ({ onClick, ...rest }) => <Chip {...rest} onClick={typeof onClick === 'function' ? onClick : undefined} />;

const SupplierOffersList = ({ offers = [], setOffers }) => {
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [modalState, setModalState] = React.useState({ open: false, mode: null, offer: null });
  const { showBanner } = useBanner();
  const cleanupDebounceRef = React.useRef(false);

  const filtered = React.useMemo(() => {
    if (statusFilter === 'all') return offers;
    return offers.filter(o => o.status === statusFilter);
  }, [offers, statusFilter]);

  const updateOfferStatus = (id, nextStatus) => setOffers(prev => prev.map(o => o.id === id ? { ...o, status: nextStatus } : o));
  const removeOffer = (id) => setOffers(prev => prev.filter(o => o.id !== id));

  const openModal = (mode, offer) => setModalState({ open: true, mode, offer });
  const closeModal = () => setModalState({ open: false, mode: null, offer: null });
  const handleAccept = (offer) => {
    updateOfferStatus(offer.id, 'approved');
    closeModal();
    try {
      showBanner({ message: `✅ Oferta aceptada. Se reservó ${offer.quantity} uds de ${offer.product?.name}.`, severity: 'success', duration: 4000 });
    } catch (_) {}
  };

  const handleReject = (offer) => {
    updateOfferStatus(offer.id, 'rejected');
    closeModal();
    try {
      showBanner({ message: `❌ Oferta rechazada. Se notificó al ofertante (${offer.buyer?.name}).`, severity: 'error', duration: 4000 });
    } catch (_) {}
  };

  const handleCleanup = (offer) => {
    removeOffer(offer.id);
    closeModal();
    // Debounce banner so many clicks show only one
    if (cleanupDebounceRef.current) return;
    cleanupDebounceRef.current = true;
    try {
      showBanner({ message: `Oferta eliminada de tus registros.`, severity: 'success', duration: 3000 });
    } catch (_) {}
    setTimeout(() => { cleanupDebounceRef.current = false; }, 1500);
  };

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
              onChange={(e) => setStatusFilter(e.target.value)}
              MenuProps={{ disableScrollLock: true }}
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="pending">Pendiente</MenuItem>
              <MenuItem value="approved">Aceptada</MenuItem>
              <MenuItem value="rejected">Rechazada</MenuItem>
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
              <Typography fontWeight={700}>Estado</Typography>
            </TableCell>
            <TableCell>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography fontWeight={700}>Acciones</Typography>
                <Tooltip
                  placement="right"
                  componentsProps={{ tooltip: { sx: { maxWidth: 300, p: 1.25 } } }}
                  title={
                    <Box>
                      <Typography variant="subtitle2" sx={{ color: 'common.white', fontWeight: 'bold' }} gutterBottom>
                        Acciones disponibles
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'common.white' }} display="block">
                        Acepta o rechaza ofertas pendientes. <br></br>Cuando una oferta queda aceptada o rechazada puedes limpiarla (eliminarla) con el basurero.
                      </Typography>
                    </Box>
                  }
                >
                  <IconButton size="small" aria-label="Información de acciones" sx={{ '&.Mui-focusVisible': { outline: 'none', boxShadow: 'none' }, '&:focus': { outline: 'none', boxShadow: 'none' }, '&:focus-visible': { outline: 'none', boxShadow: 'none' } }}>
                    <InfoOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filtered.map(o => {
            const total = o.quantity * o.price;
            return (
              <TableRow key={o.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell>
                  <Typography variant="subtitle1" fontWeight={600}>{o.product?.name}</Typography>
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
                  <SafeChip label={STATUS_MAP[o.status].label} color={STATUS_MAP[o.status].color} size="small" />
                </TableCell>
                <TableCell>
                  {o.status === 'pending' && (
                    <Tooltip title="Aceptar Oferta">
                      <IconButton
                        size="small"
                        aria-label="Aceptar Oferta"
                        onClick={() => openModal('accept', o)}
                        color="success"
                        sx={{ ml: 1, '&.Mui-focusVisible': { outline: 'none', boxShadow: 'none' }, '&:focus': { outline: 'none', boxShadow: 'none' }, '&:focus-visible': { outline: 'none', boxShadow: 'none' } }}
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
                        sx={{ ml: 1, '&.Mui-focusVisible': { outline: 'none', boxShadow: 'none' }, '&:focus': { outline: 'none', boxShadow: 'none' }, '&:focus-visible': { outline: 'none', boxShadow: 'none' } }}
                      >
                        <BlockIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {(o.status === 'approved' || o.status === 'rejected') && (
                    <Tooltip title="Limpiar Oferta">
                      <IconButton
                        size="small"
                        aria-label="Limpiar Oferta"
                        onClick={() => openModal('cleanup', o)}
                        sx={{ ml: 1, '&.Mui-focusVisible': { outline: 'none', boxShadow: 'none' }, '&:focus': { outline: 'none', boxShadow: 'none' }, '&:focus-visible': { outline: 'none', boxShadow: 'none' } }}
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
