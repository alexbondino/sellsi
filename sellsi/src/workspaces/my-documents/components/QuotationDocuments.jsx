import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box, Typography, Paper, Button, Tooltip, IconButton, LinearProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Stack, Divider, Popover, TextField,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { USE_MOCKS, MOCK_QUOTATIONS } from '../mocks/mockDocumentsData';
import { formatPrice } from '../../../shared/utils/formatters/priceFormatters';
import OrdersPagination from '../../buyer/my-orders/components/OrdersPagination';

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });

const formatFileSize = (bytes) => {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${Math.round(bytes / 1_000)} KB`;
};

function getExpiryInfo(expiresAt) {
  const now = Date.now();
  const exp = new Date(expiresAt).getTime();
  const totalMs = 15 * 24 * 60 * 60 * 1000;
  const remainingMs = exp - now;
  const daysLeft = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
  const progress = Math.max(0, Math.min(100, (remainingMs / totalMs) * 100));
  return { daysLeft, progress };
}

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
        <TextField value={text} fullWidth size="small" InputProps={{ readOnly: true }} />
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

export default function QuotationDocuments({ role }) {
  const navigate = useNavigate();
  const isBuyer = role === 'buyer';
  const [page, setPage] = useState(1);

  const ITEMS_PER_PAGE = 50;


  const quotations = useMemo(() => {
    const source = USE_MOCKS ? MOCK_QUOTATIONS : [];
    const now = Date.now();
    return source.filter((q) => new Date(q.expires_at).getTime() > now);
  }, []);

  const totalPages = Math.ceil(quotations.length / ITEMS_PER_PAGE);
  const totalItemsForPagination = quotations.length;

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) setPage(totalPages);
    if (totalPages === 0 && page !== 1) setPage(1);
  }, [page, totalPages]);

  const pagedQuotations = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return quotations.slice(start, start + ITEMS_PER_PAGE);
  }, [quotations, page]);

  return (
    <Box>
      {/* Descripción */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 960, fontSize: '14px' }}>
        Aquí encontrarás las cotizaciones que generes desde la ficha de cada producto. Cada
        cotización tiene una <strong>vigencia de 15 días</strong>, tras los cuales se elimina
        automáticamente.
      </Typography>

      {quotations.length === 0 ? (
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
          <Typography variant="h6" fontWeight={600} color="text.primary" gutterBottom>
            Sin cotizaciones
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
            {isBuyer
              ? 'Las cotizaciones que generes desde la ficha de cada producto aparecerán aquí. Recuerda que tienen una vigencia de 15 días.'
              : 'Las cotizaciones que los compradores generen para tus productos aparecerán aquí.'}
          </Typography>
          {isBuyer && (
            <Button
              variant="outlined"
              color="primary"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate('/marketplace')}
            >
              Ir al Marketplace
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
          {pagedQuotations.map((quot) => {
            const { daysLeft, progress } = getExpiryInfo(quot.expires_at);
            const progressColor = daysLeft <= 3 ? 'warning' : 'primary';
            return (
              <Paper key={quot.id} elevation={1} sx={{ borderRadius: 2, p: 2 }}>
                <Typography variant="body2" fontWeight={600} noWrap title={quot.product_name} sx={{ mb: 0.25 }}>
                  {quot.product_name}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap title={quot.supplier_name}>
                  <span style={{ color: '#566481' }}>Proveedor: </span>{quot.supplier_name}
                </Typography>
                <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.75 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ color: '#566481' }}>Monto:</Typography>
                    <Typography variant="caption" fontWeight={600} color="text.primary">{formatPrice(quot.amount)}</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    <span style={{ color: '#566481' }}>Emitida: </span>{formatDate(quot.created_at)}
                  </Typography>
                </Stack>
                <Divider sx={{ my: 1 }} />
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                    <PictureAsPdfIcon sx={{ color: 'error.light', fontSize: '1.1rem', flexShrink: 0 }} />
                    <Typography variant="caption" noWrap sx={{ maxWidth: 140 }} title={quot.document_name}>
                      {quot.document_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1, flexShrink: 0 }}>
                      {formatFileSize(quot.file_size)}
                    </Typography>
                  </Box>
                  <Tooltip title="Descargar" arrow>
                    <IconButton size="small" color="primary" aria-label="descargar">
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color={daysLeft <= 3 ? 'warning.main' : 'text.secondary'}>
                    <span style={{ color: '#566481' }}>Vence en: </span>
                    {daysLeft} día{daysLeft !== 1 ? 's' : ''}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    color={progressColor}
                    sx={{ borderRadius: 4, height: 3, bgcolor: 'action.hover', mt: 0.4, width: '100%' }}
                  />
                </Box>
              </Paper>
            );
          })}
        </Stack>

        {/* ── DESKTOP TABLE ── */}
        <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 2, display: { xs: 'none', md: 'block' } }}>
          <Table sx={{ minWidth: 700 }} size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={headerCellSx}>Producto</TableCell>
                <TableCell sx={headerCellSx}>Proveedor</TableCell>
                <TableCell sx={headerCellSx}>Documento</TableCell>
                <TableCell sx={{ ...headerCellSx, textAlign: 'right' }}>Monto</TableCell>
                <TableCell sx={headerCellSx}>Fecha emisión</TableCell>
                <TableCell sx={{ ...headerCellSx, minWidth: 140 }}>Vence en</TableCell>
                <TableCell sx={headerCellSx}>Tamaño</TableCell>
                <TableCell sx={{ ...headerCellSx, textAlign: 'center' }}>Acción</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedQuotations.map((quot) => {
                const { daysLeft, progress } = getExpiryInfo(quot.expires_at);
                const progressColor = daysLeft <= 3 ? 'warning' : 'primary';

                return (
                  <TableRow
                    key={quot.id}
                    sx={{
                      '&:hover': { bgcolor: 'action.hover' },
                      '&:last-child td': { border: 0 },
                    }}
                  >
                    <TableCell>
                      <CopyTextCell text={quot.product_name} maxWidth={220} />
                    </TableCell>

                    <TableCell>
                      <CopyTextCell text={quot.supplier_name} maxWidth={180} />
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PictureAsPdfIcon sx={{ color: 'error.light', fontSize: '1.1rem', flexShrink: 0 }} />
                        <Typography variant="body2" noWrap sx={{ maxWidth: 160 }} title={quot.document_name}>
                          {quot.document_name}
                        </Typography>
                      </Box>
                    </TableCell>

                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600} color="text.primary">
                        {formatPrice(quot.amount)}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" noWrap>
                        {formatDate(quot.created_at)}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="caption" color={daysLeft <= 3 ? 'warning.main' : 'text.secondary'} noWrap>
                        {daysLeft} día{daysLeft !== 1 ? 's' : ''}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={progress}
                        color={progressColor}
                        sx={{ borderRadius: 4, height: 3, bgcolor: 'action.hover', mt: 0.4, maxWidth: 100 }}
                      />
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatFileSize(quot.file_size)}
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
                );
              })}
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
