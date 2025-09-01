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
import { Check as CheckIcon } from '@mui/icons-material';
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

  const filtered = React.useMemo(() => {
    if (statusFilter === 'all') return offers;
    return offers.filter(o => o.status === statusFilter);
  }, [offers, statusFilter]);

  const updateOfferStatus = (id, nextStatus) => {
    setOffers(prev => prev.map(o => o.id === id ? { ...o, status: nextStatus } : o));
  };

  const removeOffer = (id) => {
    setOffers(prev => prev.filter(o => o.id !== id));
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
                        Acepta o rechaza ofertas pendientes. Cuando una oferta queda aceptada o rechazada puedes limpiarla (eliminarla) con el basurero.
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
                        onClick={() => updateOfferStatus(o.id, 'approved')}
                        color="success"
                        sx={{ ml: 1 }}
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
                        onClick={() => updateOfferStatus(o.id, 'rejected')}
                        color="error"
                        sx={{ ml: 1 }}
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
                        onClick={() => removeOffer(o.id)}
                        sx={{ ml: 1 }}
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
    </TableContainer>
  );
};

export default SupplierOffersList;
