import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box, Typography, Paper, Button, FormControl, InputLabel, Select, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Tooltip, IconButton, Popover, TextField, Stack, Divider,
  Skeleton,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { supabase } from '../../../services/supabase';
import { formatPrice } from '../../../shared/utils/formatters/priceFormatters';
import FinancingIdCell from '../../../shared/components/financing/FinancingIdCell';
import OrdersPagination from '../../buyer/my-orders/components/OrdersPagination';
import {
  downloadSupabaseStoragePathWithRateLimit,
  downloadUrlAsBlobWithRateLimit,
} from '../../../shared/utils/downloads/download';

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
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const ITEMS_PER_PAGE = 50;
  const isSupplier = role === 'supplier';


  useEffect(() => {
    let alive = true;

    const fetchData = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const sessionRes = await supabase.auth.getSession();
        const userId = sessionRes?.data?.session?.user?.id;
        if (!userId) {
          if (alive) setInvoices([]);
          return;
        }

        let invoiceRows = [];
        let orderIds = [];
        let supplierUserIds = [];

        if (role === 'supplier') {
          const { data: rows, error: invErr } = await supabase
            .from('invoices_meta')
            .select('id, order_id, supplier_id, path, filename, size, created_at')
            .eq('supplier_id', userId)
            .order('created_at', { ascending: false });
          if (invErr) throw invErr;
          invoiceRows = Array.isArray(rows) ? rows : [];
          orderIds = [...new Set(invoiceRows.map((r) => r.order_id).filter(Boolean))];
          supplierUserIds = [...new Set(invoiceRows.map((r) => r.supplier_id).filter(Boolean))];
        } else {
          const { data: oRows, error: oErr } = await supabase
            .from('orders')
            .select('id, user_id, total')
            .eq('user_id', userId);
          if (oErr) throw oErr;

          const myOrders = Array.isArray(oRows) ? oRows : [];
          orderIds = [...new Set(myOrders.map((o) => o.id).filter(Boolean))];

          if (orderIds.length === 0) {
            if (alive) setInvoices([]);
            return;
          }

          const { data: rows, error: invErr } = await supabase
            .from('invoices_meta')
            .select('id, order_id, supplier_id, path, filename, size, created_at')
            .in('order_id', orderIds)
            .order('created_at', { ascending: false });
          if (invErr) throw invErr;

          invoiceRows = Array.isArray(rows) ? rows : [];
          supplierUserIds = [...new Set(invoiceRows.map((r) => r.supplier_id).filter(Boolean))];
        }

        const ordersById = Object.create(null);
        if (orderIds.length) {
          try {
            const { data: oRows, error: oErr } = await supabase
              .from('orders')
              .select('id, user_id, total')
              .in('id', orderIds);
            if (!oErr && Array.isArray(oRows)) {
              for (const o of oRows) ordersById[o.id] = o;
            }
          } catch (_) {
            // supplier puede no tener acceso a orders; tolerar
          }
        }

        const namesByUserId = Object.create(null);
        const buyerUserIds = [...new Set(Object.values(ordersById).map((o) => o?.user_id).filter(Boolean))];
        const idsToFetch = role === 'supplier' ? buyerUserIds : supplierUserIds;

        if (idsToFetch.length) {
          try {
            const { data: uRows, error: uErr } = await supabase
              .from('users')
              .select('user_id, user_nm')
              .in('user_id', idsToFetch);
            if (!uErr && Array.isArray(uRows)) {
              for (const u of uRows) namesByUserId[u.user_id] = u.user_nm;
            }
          } catch (_) {}
        }

        const mapped = invoiceRows.map((r) => {
          const order = ordersById[r.order_id] || null;
          const amount = order?.total != null ? Number(order.total) : null;
          const counterpart = role === 'supplier'
            ? (namesByUserId[order?.user_id] || '—')
            : (namesByUserId[r.supplier_id] || '—');

          return {
            id: r.id,
            category: role === 'supplier' ? 'emitidas' : 'recibidas',
            order_id: r.order_id,
            supplier_id: r.supplier_id,
            path: r.path,
            document_name: r.filename || (r.path ? r.path.split('/').pop() : 'factura.pdf'),
            file_size: r.size || 0,
            amount,
            uploaded_at: r.created_at,
            counterpart,
          };
        });

        if (alive) setInvoices(mapped);
      } catch (e) {
        if (!alive) return;
        setLoadError(e?.message || 'Error cargando facturas');
        setInvoices([]);
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchData();
    return () => {
      alive = false;
    };
  }, [role]);

  const allInvoices = invoices;

  const counts = useMemo(() => {
    const acc = { all: 0, emitidas: 0, recibidas: 0 };
    for (const inv of allInvoices) {
      acc.all += 1;
      if (inv.category === 'emitidas') acc.emitidas += 1;
      if (inv.category === 'recibidas') acc.recibidas += 1;
    }
    return acc;
  }, [allInvoices]);

  const activeCategory = isSupplier ? category : 'recibidas';

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return allInvoices;
    return allInvoices.filter(inv => inv.category === activeCategory);
  }, [allInvoices, activeCategory]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const totalItemsForPagination = filtered.length;

  useEffect(() => {
    setPage(1);
  }, [activeCategory]);

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) setPage(totalPages);
    if (totalPages === 0 && page !== 1) setPage(1);
  }, [page, totalPages]);

  const pagedInvoices = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, page]);

  const empty = EMPTY_STATE[activeCategory];

  const LoadingSkeleton = () => (
    <>
      <Stack spacing={1.5} sx={{ display: { xs: 'flex', md: 'none' } }}>
        {Array.from({ length: 5 }).map((_, idx) => (
          <Paper key={idx} elevation={1} sx={{ borderRadius: 2, p: 2 }}>
            <Skeleton variant="rounded" height={22} width={120} />
            <Skeleton variant="text" height={20} sx={{ mt: 1, maxWidth: 260 }} />
            <Skeleton variant="text" height={18} sx={{ maxWidth: 220 }} />
            <Divider sx={{ my: 1 }} />
            <Skeleton variant="text" height={18} sx={{ maxWidth: 300 }} />
          </Paper>
        ))}
      </Stack>

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
            {Array.from({ length: 6 }).map((_, idx) => (
              <TableRow key={idx}>
                <TableCell><Skeleton variant="rounded" height={18} width={90} /></TableCell>
                <TableCell><Skeleton variant="rounded" height={22} width={72} /></TableCell>
                <TableCell><Skeleton variant="text" height={20} width={180} /></TableCell>
                <TableCell><Skeleton variant="text" height={20} width={220} /></TableCell>
                <TableCell align="right"><Skeleton variant="text" height={20} width={90} sx={{ ml: 'auto' }} /></TableCell>
                <TableCell><Skeleton variant="text" height={20} width={110} /></TableCell>
                <TableCell><Skeleton variant="text" height={20} width={70} /></TableCell>
                <TableCell align="center"><Skeleton variant="circular" width={28} height={28} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );

  const downloadInvoice = async (inv) => {
    if (!inv?.path) return;
    try {
      if (role === 'supplier') {
        await downloadSupabaseStoragePathWithRateLimit({
          supabase,
          bucket: 'invoices',
          path: inv.path,
          filename: inv.document_name,
          rateKey: `invoice:${inv.path}`,
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('get-invoice-url', {
        body: { path: inv.path },
      });
      if (error) throw error;
      if (!data?.url) throw new Error('URL inválida');

      await downloadUrlAsBlobWithRateLimit({
        url: data.url,
        filename: inv.document_name,
        rateKey: `invoice:${inv.path}`,
      });
    } catch (e) {
      const msg = String(e?.message || e || '');
      const status = e?.status || e?.statusCode || null;
      if (msg.startsWith('RATE_LIMITED:') || status === 429) {
        const seconds = msg.startsWith('RATE_LIMITED:') ? (msg.split(':')[1] || '') : '';
        alert(`Límite de descargas alcanzado. Intenta de nuevo en unos segundos.${seconds ? ` (${seconds}s)` : ''}`);
      }
      console.warn('[my-documents][invoices] download failed', e?.message || e);
    }
  };

  return (
    <Box>
      {/* Descripción */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 960, fontSize: '14px' }}>
        {isSupplier ? (
          <>
            Aquí encontrarás las facturas y boletas vinculadas a tus pedidos. Las facturas
            <strong> emitidas</strong> corresponden a documentos que adjuntaste a tus ventas;
            las <strong>recibidas</strong> son las que tus proveedores adjuntaron a tus compras.
          </>
        ) : (
          <>
            Aquí encontrarás las facturas y boletas que tus proveedores adjuntaron a tus compras.
          </>
        )}
      </Typography>

      {/* Filtro */}
      {isSupplier && (
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
      )}

      {loadError ? (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 2,
            border: '1px dashed',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Typography variant="body2" fontWeight={600} color="error.main">Error cargando facturas</Typography>
          <Typography variant="caption" color="text.secondary">{loadError}</Typography>
        </Paper>
      ) : loading ? (
        <LoadingSkeleton />
      ) : filtered.length === 0 ? (
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
                  <Typography variant="caption" fontWeight={600} color="text.primary">
                    {inv.amount != null ? formatPrice(inv.amount) : '—'}
                  </Typography>
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
                  <IconButton size="small" color="primary" aria-label="descargar" onClick={() => downloadInvoice(inv)}>
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
                      {inv.amount != null ? formatPrice(inv.amount) : '—'}
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
                      <IconButton size="small" color="primary" aria-label="descargar" onClick={() => downloadInvoice(inv)}>
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