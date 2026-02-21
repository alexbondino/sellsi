import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Paper, Button, Chip, Stack, Divider,
  Accordion, AccordionSummary, AccordionDetails, Tooltip, IconButton,
  FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { formatPrice } from '../../../shared/utils/formatters/priceFormatters';
import FinancingIdCell from '../../../shared/components/financing/FinancingIdCell';
import OrdersPagination from '../../buyer/my-orders/components/OrdersPagination';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DownloadIcon from '@mui/icons-material/Download';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import {
  USE_MOCKS,
  MOCK_FINANCING_GROUPS,
  FINANCING_STATUS_LABELS,
  FINANCING_TYPE_LABELS,
  DOC_TYPE_LABELS,
} from '../mocks/mockDocumentsData';

/* formatPrice imported from shared utils */
const formatFileSize = (bytes) => {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${Math.round(bytes / 1_000)} KB`;
};

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });

function DocumentRow({ doc }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        py: 1.25,
        px: { xs: 1, md: 2 },
        borderRadius: 1,
        '&:hover': { bgcolor: 'action.hover' },
        transition: 'background 0.15s',
      }}
    >
      <PictureAsPdfIcon sx={{ color: 'error.light', fontSize: '1.4rem', flexShrink: 0 }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          fontWeight={500}
          noWrap
          title={doc.document_name}
        >
          {doc.document_name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {DOC_TYPE_LABELS[doc.document_type] ?? doc.document_type}
          {' · '}{formatFileSize(doc.file_size)}
          {' · '}{formatDate(doc.uploaded_at)}
        </Typography>
      </Box>
      <Tooltip title="Descargar" arrow>
        <IconButton size="small" color="primary" aria-label="descargar">
          <DownloadIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

function SummaryField({ label, children }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" sx={{ display: 'block', lineHeight: 1.2, mb: 0.3, color: '#566481' }}>
        {label}
      </Typography>
      {children}
    </Box>
  );
}

function FinancingGroup({ group, role, defaultExpanded }) {
  const status = FINANCING_STATUS_LABELS[group.status] ?? { label: group.status, color: 'default' };
  const typeLabel = FINANCING_TYPE_LABELS[group.type] ?? group.type;
  const counterpartLabel = role === 'supplier' ? 'Comprador' : 'Proveedor';

  const formatShortDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const vigenciaDays = (() => {
    if (!group.expires_at) return null;
    const diff = Math.ceil((new Date(group.expires_at) - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
  })();

  const vigenciaColor =
    vigenciaDays === null ? 'text.secondary'
    : vigenciaDays < 0   ? 'error.main'
    : vigenciaDays <= 7  ? 'error.main'
    : vigenciaDays <= 15 ? 'warning.main'
    : 'success.main';

  return (
    <Accordion
      defaultExpanded={defaultExpanded}
      disableGutters
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '8px !important',
        mb: 1.5,
        '&:before': { display: 'none' },
        '&.Mui-expanded': { boxShadow: 1 },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{ px: { xs: 2, md: 2.5 }, py: 1.5 }}
      >
        {/* Desktop — 7 columnas */}
        <Box
          sx={{
            display: { xs: 'none', md: 'grid' },
            gridTemplateColumns: '110px 1fr 110px 140px 130px 110px 150px',
            gap: 2,
            flex: 1,
            pr: 1,
            alignItems: 'start',
          }}
        >
          <SummaryField label="ID Financiamiento">
            <FinancingIdCell financingId={group.id} />
          </SummaryField>

          <SummaryField label={counterpartLabel}>
            <Typography variant="body2" fontWeight={500} noWrap title={group.counterpart}>
              {group.counterpart}
            </Typography>
          </SummaryField>

          <SummaryField label="Tipo">
            <Typography variant="body2" fontWeight={500}>{typeLabel}</Typography>
          </SummaryField>

          <SummaryField label="Monto">
            <Typography variant="body2" fontWeight={600} color="text.primary">
              {formatPrice(group.amount)}
            </Typography>
          </SummaryField>

          <SummaryField label="Fecha Aprobación">
            <Typography variant="body2" fontWeight={500} color="text.primary">
              {formatShortDate(group.activated_at)}
            </Typography>
          </SummaryField>

          <SummaryField label="Vigencia">
            <Typography variant="body2" fontWeight={600} sx={{ color: vigenciaColor }}>
              {vigenciaDays !== null ? `${vigenciaDays} días` : '—'}
            </Typography>
          </SummaryField>

          <SummaryField label="Estado">
            <Chip
              label={status.label}
              color={status.color}
              size="small"
              sx={{ fontWeight: 600, fontSize: '0.7rem', height: 22 }}
            />
          </SummaryField>
        </Box>

        {/* Mobile — stack vertical */}
        <Stack spacing={0.5} sx={{ display: { xs: 'flex', md: 'none' }, flex: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <FinancingIdCell financingId={group.id} />
            <Chip label={status.label} color={status.color} size="small"
              sx={{ fontWeight: 600, fontSize: '0.68rem', height: 20 }} />
          </Stack>
          <Typography variant="body2" noWrap title={group.counterpart}>{group.counterpart}</Typography>
          <Stack direction="row" spacing={2}>
            <Typography variant="caption" color="text.secondary">
              <span style={{ color: '#566481' }}>Tipo: </span>{typeLabel}
            </Typography>
            <Typography variant="caption" fontWeight={600} color="text.primary">
              <span style={{ color: '#566481', fontWeight: 400 }}>Monto: </span>{formatPrice(group.amount)}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={2}>
            <Typography variant="caption" color="text.secondary">Aprobado: {formatShortDate(group.activated_at)}</Typography>
            {vigenciaDays !== null && (
              <Typography variant="caption" fontWeight={600} sx={{ color: vigenciaColor }}>
                <span style={{ color: '#566481', fontWeight: 400 }}>Vigencia: </span>{vigenciaDays} días
              </Typography>
            )}
          </Stack>
        </Stack>
      </AccordionSummary>

      <AccordionDetails sx={{ px: { xs: 1, md: 2 }, py: 0.5, pb: 1 }}>
        <Divider sx={{ mb: 0.5 }} />
        <Typography variant="caption" color="text.disabled" sx={{ px: 2, pt: 0.75, display: 'block' }}>
          {group.documents.length} documento{group.documents.length !== 1 ? 's' : ''} · máx. 7
        </Typography>
        {group.documents.map((doc, i) => (
          <React.Fragment key={doc.id}>
            <DocumentRow doc={doc} />
            {i < group.documents.length - 1 && <Divider sx={{ opacity: 0.5 }} />}
          </React.Fragment>
        ))}
      </AccordionDetails>
    </Accordion>
  );
}

export default function FinancingDocuments({ role }) {
  const navigate = useNavigate();
  const isBuyer = role === 'buyer';
  const financingPath = isBuyer ? '/buyer/my-financing' : '/supplier/my-financing';
  const [filter, setFilter] = useState('vigentes');
  const [page, setPage] = useState(1);

  const ITEMS_PER_PAGE = 25;


  const STATUS_BY_FILTER = {
    vigentes: ['approved_by_sellsi'],
    vencidos: ['expired'],
    pagados:  ['paid'],
  };

  const FILTER_OPTIONS = [
    { value: 'vigentes', label: 'Vigentes' },
    { value: 'vencidos', label: 'Vencidos' },
    { value: 'pagados',  label: 'Pagados'  },
  ];

  const allGroups = USE_MOCKS ? MOCK_FINANCING_GROUPS : [];

  const counts = useMemo(() => {
    const acc = { vigentes: 0, vencidos: 0, pagados: 0 };
    for (const group of allGroups) {
      if (STATUS_BY_FILTER.vigentes.includes(group.status)) acc.vigentes += 1;
      if (STATUS_BY_FILTER.vencidos.includes(group.status)) acc.vencidos += 1;
      if (STATUS_BY_FILTER.pagados.includes(group.status)) acc.pagados += 1;
    }
    return acc;
  }, [allGroups]);

  const filteredGroups = useMemo(
    () => allGroups.filter(g => STATUS_BY_FILTER[filter].includes(g.status)),
    [allGroups, filter]
  );

  const totalPages = Math.ceil(filteredGroups.length / ITEMS_PER_PAGE);
  const totalItemsForPagination = filteredGroups.length;

  useEffect(() => {
    setPage(1);
  }, [filter]);

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) setPage(totalPages);
    if (totalPages === 0 && page !== 1) setPage(1);
  }, [page, totalPages]);

  const pagedGroups = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredGroups.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredGroups, page]);

  return (
    <Box>
      {/* Descripción de la sección */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 960, fontSize: '14px' }}>
        Aquí encontrarás los documentos asociados a cada solicitud de financiamiento, tales como
        contratos marco, garantías, certificados de deuda y otros archivos generados durante el proceso.
      </Typography>

      {/* Filtro */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
        <Typography fontWeight={600}>Filtrar por Estado:</Typography>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="financing-filter-label">Estado</InputLabel>
          <Select
            labelId="financing-filter-label"
            value={filter}
            label="Estado"
            onChange={(e) => setFilter(e.target.value)}
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

      {filteredGroups.length === 0 ? (
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
            Sin documentos de financiamiento
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 380, mx: 'auto' }}>
            {isBuyer
              ? 'Los documentos de tus solicitudes de financiamiento (contratos, garantías, certificados) aparecerán agrupados por solicitud.'
              : 'Los documentos de las solicitudes de financiamiento de tus compradores aparecerán aquí agrupados por solicitud.'}
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate(financingPath)}
          >
            {isBuyer ? 'Ver Mis Financiamientos' : 'Ver Solicitudes'}
          </Button>
        </Paper>
      ) : (
        <Box>
          <OrdersPagination
            totalItems={totalItemsForPagination}
            itemsPerPage={ITEMS_PER_PAGE}
            currentPage={page}
            onPageChange={setPage}
          />

          {pagedGroups.map((group, i) => (
            <FinancingGroup key={group.id} group={group} role={role} defaultExpanded={i === 0} />
          ))}

          <OrdersPagination
            totalItems={totalItemsForPagination}
            itemsPerPage={ITEMS_PER_PAGE}
            currentPage={page}
            onPageChange={setPage}
          />
        </Box>
      )}
    </Box>
  );
}

