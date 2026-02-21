import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box, Typography, Paper, Button, FormControl, InputLabel, Select, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Tooltip, IconButton, Popover, TextField, Stack, Divider,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { USE_MOCKS, MOCK_INVOICES } from '../mocks/mockDocumentsData';
import { formatPrice } from '../../../shared/utils/formatters/priceFormatters';
import FinancingIdCell from '../../../shared/components/financing/FinancingIdCell';
import OrdersPagination from '../../buyer/my-orders/components/OrdersPagination';

const FILTER_OPTIONS = [
  { value: 'all', label: 'Todas' },
  { value: 'emitidas', label: 'Emitidas' },
  { value: 'recibidas', label: 'Recibidas' },
];

const EMPTY_STATE = {
  all: {
    title: 'Sin facturas',
    description: 'Las facturas y boletas vinculadas a tus pedidos aparecerán aquí una vez que estén disponibles.',
  },
  emitidas: {
    title: 'Sin facturas emitidas',
    description: 'Las facturas que adjuntes a tus pedidos despachados aparecerán aquí para que tus compradores puedan descargarlas.',
    cta: { label: 'Ir a Mis Ventas', icon: <FileUploadIcon />, path: '/supplier/my-orders' },
  },
  recibidas: {
    title: 'Sin facturas recibidas',
    description: 'Cuando un proveedor adjunte una factura o boleta a tu pedido, podrás descargarla aquí.',
    cta: { label: 'Ver Mis Pedidos', icon: <ArrowForwardIcon />, path: '/buyer/orders' },
  },
};

const formatFileSize = (bytes) => {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${Math.round(bytes / 1_000)} KB`;
};

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });

const headerCellSx = {
  fontWeight: 600,
  backgroundColor: 'grey.100',
  color: 'text.primary',
  fontSize: '0.875rem',
  py: 1.5,
  whiteSpace: 'nowrap',
};

function CopyTextCell({ text, maxWidth = 200 }) {
  const [anchor, setAnchor] = useState(null);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);

  const handleOpen = (e) => setAnchor(e.currentTarget);
  const handleClose = () => {
    setAnchor(null);
    if (timerRef.current) clearTimeout(timerRef.current);
    setCopied(false);
  };
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 3000);
    } catch (_) {}
  };

  return (
    <Box sx={{ display: 'inline-block', maxWidth }}>
      <Tooltip title="Clic para ver y copiar" placement="top">
        <Typography
          variant="body2"
          fontWeight={500}
          noWrap
          onClick={handleOpen}
          sx={{ cursor: 'pointer', userSelect: 'none', maxWidth }}
          title={text}
        >
          {text}
        </Typography>
      </Tooltip>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { p: 2, width: 360, maxWidth: '90vw' } }}
        disableScrollLock
      >
        <Typography variant="subtitle2" gutterBottom>Nombre completo</Typography>
        <TextField
          value={text}
          fullWidth
          size="small"
          InputProps={{ readOnly: true }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
          {copied ? (
            <Button size="small" color="success" variant="contained" disableElevation
              startIcon={<CheckCircleOutlineIcon sx={{ fontSize: 18 }} />}>
              Copiado
            </Button>
          ) : (
            <Button size="small" onClick={handleCopy}>Copiar</Button>
          )}
        </Box>
      </Popover>
    </Box>
  );
}

export default function InvoiceDocuments({ role }) {
  const navigate = useNavigate();
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);

  const ITEMS_PER_PAGE = 50;


  const allInvoices = USE_MOCKS ? MOCK_INVOICES : [];

  const counts = useMemo(() => {
    const acc = { all: 0, emitidas: 0, recibidas: 0 };
    for (const inv of allInvoices) {
      acc.all += 1;
      if (inv.category === 'emitidas') acc.emitidas += 1;
      if (inv.category === 'recibidas') acc.recibidas += 1;
    }
    return acc;
  }, [allInvoices]);

  const filtered = useMemo(() => {
    if (category === 'all') return allInvoices;
    return allInvoices.filter(inv => inv.category === category);
  }, [allInvoices, category]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const totalItemsForPagination = filtered.length;

  useEffect(() => {
    setPage(1);
  }, [category]);

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) setPage(totalPages);
    if (totalPages === 0 && page !== 1) setPage(1);
  }, [page, totalPages]);

  const pagedInvoices = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, page]);

  const empty = EMPTY_STATE[category];

  return (
    <Box>
      {/* Descripción */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 960, fontSize: '14px' }}>
        Aquí encontrarás las facturas y boletas vinculadas a tus pedidos. Las facturas
        <strong> emitidas</strong> corresponden a documentos que adjuntaste a tus ventas;
        las <strong>recibidas</strong> son las que tus proveedores adjuntaron a tus compras.
      </Typography>

      {/* Filtro */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
        <Typography fontWeight={600}>Filtrar por tipo:</Typography>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="invoice-filter-label">Tipo</InputLabel>
          <Select
            labelId="invoice-filter-label"
            value={category}
            label="Tipo"
            onChange={(e) => setCategory(e.target.value)}
            MenuProps={{ disableScrollLock: true }}
          >
            {FILTER_OPTIONS.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label} ({counts[opt.value]})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {filtered.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, md: 6 },
            textAlign: 'center',
            borderRadius: 2,
            border: '1px dashed',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <FolderOpenIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" fontWeight={600} gutterBottom>{empty.title}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
            {empty.description}
          </Typography>
          {empty.cta && (
            <Button variant="outlined" color="primary" endIcon={empty.cta.icon}
              onClick={() => navigate(empty.cta.path)}>
              {empty.cta.label}
            </Button>
          )}
        </Paper>
      ) : (
        <>
        <OrdersPagination
          totalItems={totalItemsForPagination}
          itemsPerPage={ITEMS_PER_PAGE}
          currentPage={page}
          onPageChange={setPage}
        />

        {/* ── MOBILE CARDS ── */}
        <Stack spacing={1.5} sx={{ display: { xs: 'flex', md: 'none' } }}>
          {pagedInvoices.map((inv) => (
            <Paper key={inv.id} elevation={1} sx={{ borderRadius: 2, p: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
                <FinancingIdCell financingId={inv.order_id} />
                <Chip
                  label={inv.category === 'emitidas' ? 'Emitida' : 'Recibida'}
                  size="small"
                  variant="outlined"
                  color={inv.category === 'emitidas' ? 'primary' : 'default'}
                  sx={{ fontWeight: 600, fontSize: '0.7rem', height: 22, minWidth: 72 }}
                />
              </Stack>
              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                <Typography variant="caption" sx={{ color: '#566481', flexShrink: 0 }}>
                  {role === 'supplier' ? 'Comprador' : 'Proveedor'}:&nbsp;
                </Typography>
                <CopyTextCell text={inv.counterpart} maxWidth={220} />
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="caption" sx={{ color: '#566481' }}>Monto:</Typography>
                  <Typography variant="caption" fontWeight={600} color="text.primary">{formatPrice(inv.amount)}</Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  <span style={{ color: '#566481' }}>Fecha: </span>{formatDate(inv.uploaded_at)}
                </Typography>
              </Stack>
              <Divider sx={{ my: 1 }} />
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                  <PictureAsPdfIcon sx={{ color: 'error.light', fontSize: '1.1rem', flexShrink: 0 }} />
                  <Typography variant="caption" noWrap sx={{ maxWidth: 160 }} title={inv.document_name}>
                    {inv.document_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1, flexShrink: 0 }}>
                    {formatFileSize(inv.file_size)}
                  </Typography>
                </Box>
                <Tooltip title="Descargar" arrow>
                  <IconButton size="small" color="primary" aria-label="descargar">
                    <DownloadIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Paper>
          ))}
        </Stack>

        {/* ── DESKTOP TABLE ── */}
        <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 2, display: { xs: 'none', md: 'block' } }}>
          <Table sx={{ minWidth: 700 }} size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={headerCellSx}>Nº Pedido</TableCell>
                <TableCell sx={headerCellSx}>Tipo</TableCell>
                <TableCell sx={headerCellSx}>{role === 'supplier' ? 'Comprador' : 'Proveedor'}</TableCell>
                <TableCell sx={headerCellSx}>Documento</TableCell>
                <TableCell sx={{ ...headerCellSx, textAlign: 'right' }}>Monto</TableCell>
                <TableCell sx={headerCellSx}>Fecha</TableCell>
                <TableCell sx={headerCellSx}>Tamaño</TableCell>
                <TableCell sx={{ ...headerCellSx, textAlign: 'center' }}>Acción</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedInvoices.map((inv) => (
                <TableRow
                  key={inv.id}
                  sx={{
                    '&:hover': { bgcolor: 'action.hover' },
                    '&:last-child td': { border: 0 },
                  }}
                >
                  <TableCell>
                    <FinancingIdCell financingId={inv.order_id} />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={inv.category === 'emitidas' ? 'Emitida' : 'Recibida'}
                      size="small"
                      variant="outlined"
                      color={inv.category === 'emitidas' ? 'primary' : 'default'}
                      sx={{ fontWeight: 600, fontSize: '0.7rem', height: 22, minWidth: 72 }}
                    />
                  </TableCell>
                  <TableCell>
                    <CopyTextCell text={inv.counterpart} maxWidth={200} />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PictureAsPdfIcon sx={{ color: 'error.light', fontSize: '1.1rem', flexShrink: 0 }} />
                      <Typography variant="body2" noWrap sx={{ maxWidth: 180 }} title={inv.document_name}>
                        {inv.document_name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600} color="text.primary">
                      {formatPrice(inv.amount)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap>
                      {formatDate(inv.uploaded_at)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatFileSize(inv.file_size)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Descargar" arrow>
                      <IconButton size="small" color="primary" aria-label="descargar">
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <OrdersPagination
          totalItems={totalItemsForPagination}
          itemsPerPage={ITEMS_PER_PAGE}
          currentPage={page}
          onPageChange={setPage}
        />
        </>
      )}
    </Box>
  );
}