/**
 * 💰 Tabla de Gestión de Financiamientos - Admin Panel
 *
 * Componente para gestionar solicitudes de financiamiento:
 * - Ver solicitudes pendientes de aprobación
 * - Aprobar/rechazar financiamientos
 * - Descargar documentos firmados (garantías, contratos, pagarés)
 * - Visualizar estado y detalles de cada solicitud
 *
 * @author Panel Administrativo Sellsi
 * @date 14 de Enero de 2026
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Alert,
  CircularProgress,
  Popover,
  Checkbox,
  FormControlLabel,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Description as DocumentIcon,
  AttachMoney as MoneyIcon,
  History as HistoryIcon,
  Autorenew as AutorenewIcon,
  InfoOutlined as InfoOutlinedIcon,
} from '@mui/icons-material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import ActionIconButton from '../../../shared/components/buttons/ActionIconButton';
import FinancingActionModals from '../../../shared/components/financing/FinancingActionModals';
import DownloadablesModal from '../../../shared/components/financing/DownloadablesModal';
import { DataGrid } from '@mui/x-data-grid';
import { toast } from 'react-hot-toast';
import {
  getAllFinancingRequests,
  approveFinancingRequest,
  rejectFinancingRequest,
  getFinancingDocuments,
  downloadDocument,
  getDocumentUrl,
  uploadFinancingDocument,
  getFinancingTransactions,
  restoreFinancingAmount,
  processRefund,
} from '../services/adminFinancingService';
import { getCurrentAdminId } from './userManagementTable/utils/userUtils';
import FinancingActionDialog from './FinancingActionDialog';

// ✅ FORMATTERS
const formatCurrency = (value) => {
  const n = Number(value);
  const safe = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(safe);
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// ✅ STATUS CHIP COMPONENT
const StatusChip = ({ status }) => {
  const statusConfig = {
    pending_supplier_review: { label: 'Pendiente Proveedor', color: 'warning' },
    rejected_by_supplier: { label: 'Rechazado Proveedor', color: 'error' },
    buyer_signature_pending: { label: 'Firma Comprador Pendiente', color: 'info' },
    cancelled_by_buyer: { label: 'Cancelado Comprador', color: 'default' },
    supplier_signature_pending: { label: 'Firma Proveedor Pendiente', color: 'info' },
    cancelled_by_supplier: { label: 'Cancelado Proveedor', color: 'default' },
    pending_sellsi_approval: { label: 'Pendiente Aprobación', color: 'warning' },
    approved_by_sellsi: { label: 'Aprobado', color: 'success' },
    rejected_by_sellsi: { label: 'Rechazado Sellsi', color: 'error' },
    expired: { label: 'Expirado', color: 'error' },
    paid: { label: 'Pagado', color: 'success' },
  };

  const config = statusConfig[status] || { label: status, color: 'default' };

  return <Chip label={config.label} color={config.color} size="small" />;
};

// TableTooltip: tooltip estándar para esta tabla (30% más grande)
const TableTooltip = ({ title, children, ...props }) => (
  <Tooltip
    title={title}
    arrow
    componentsProps={{
      tooltip: {
        sx: {
          fontSize: '1.14rem', // ≈ +30% respecto a 0.875rem base
          maxWidth: 340,
          p: 1,
        }
      }
    }}
    {...props}
  >
    {children}
  </Tooltip>
);

// Modal styles (copiado de FinancingActionModals for consistency)
const MODAL_DIALOG_ACTIONS_STYLES = {
  flexDirection: { xs: 'column', sm: 'row' },
  gap: { xs: 1.5, sm: 2 },
  p: { xs: 2, sm: 3 },
  pt: { xs: 1.5, sm: 1 },
  justifyContent: 'center',
};

const MODAL_DIALOG_CONTENT_STYLES = {
  px: { xs: 1.5, sm: 3 },
  py: { xs: 1.5, sm: 2.5 },
};

const MODAL_BUTTON_BASE_STYLES = {
  textTransform: 'none',
  borderRadius: 2,
  fontSize: { xs: '0.875rem', sm: '0.875rem' },
  px: 2,
  py: { xs: 1, sm: 0.75 },
  width: { xs: '100%', sm: '160px' },
  boxSizing: 'border-box',
};

const MODAL_CANCEL_BUTTON_STYLES = {
  ...MODAL_BUTTON_BASE_STYLES,
  fontWeight: 500,
};

const MODAL_SUBMIT_BUTTON_STYLES = {
  ...MODAL_BUTTON_BASE_STYLES,
  fontWeight: 600,
  order: { xs: -1, sm: 0 },
};
// Small inline popover used for showing legal info + copy button
const ProfileInfoPopover = ({ displayText, title = 'Información', fields = [] }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef(null);

  const open = Boolean(anchorEl);
  const handleOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => {
    setAnchorEl(null);
    if (copyTimerRef.current) { clearTimeout(copyTimerRef.current); copyTimerRef.current = null; }
    setCopied(false);
  };

  const buildCopyText = () => {
    return fields
      .filter(f => f.value && f.value !== '—')
      .map(f => `${f.label}: ${f.value}`)
      .join('\n');
  };

  const handleCopy = async () => {
    try {
      const text = buildCopyText();
      if (!text) return;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copying:', err);
    }
  };

  return (
    <>
      <Box sx={{ cursor: 'pointer' }} onClick={handleOpen}>
        <Typography variant="body2" sx={{ color: 'primary.main', textDecoration: 'underline', userSelect: 'none' }}>{displayText}</Typography>
      </Box>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { p: 2, width: 420, maxWidth: '95vw' } }}
        disableScrollLock
      >
        <Typography variant="subtitle2" gutterBottom>{title}</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '140px 1fr', rowGap: 1, columnGap: 1 }}>
          {fields.map((f, i) => (
            <React.Fragment key={i}>
              <Typography variant="body2" color="text.secondary">{f.label}:</Typography>
              <Typography variant="body2">{f.value || '—'}</Typography>
            </React.Fragment>
          ))}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          <Typography variant="caption" color="text.secondary">Selecciona o usa el botón para copiar</Typography>
          {copied ? (
            <Button size="small" color="success" variant="contained" startIcon={<CheckCircleOutlineIcon sx={{ fontSize: 18 }} />} disableElevation>Copiado</Button>
          ) : (
            <Button onClick={handleCopy} size="small">Copiar</Button>
          )}
        </Box>
      </Popover>
    </>
  );
};

// ✅ MAIN COMPONENT
const FinanciamientosTable = () => {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  // Generic action modal
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState(null); // 'approve' | 'reject' | 'documents'
  const [rejectReason, setRejectReason] = useState('');
  const [documents, setDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);

  // Transactions / restore / refund UI
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionsOpen, setTransactionsOpen] = useState(false);

  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [restoreAmount, setRestoreAmount] = useState('');
  const [restoreReason, setRestoreReason] = useState('');
  const [restoreConfirm, setRestoreConfirm] = useState(false);
  const [processingRestore, setProcessingRestore] = useState(false);

  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [processingRefund, setProcessingRefund] = useState(false);
  const [refundConfirmed, setRefundConfirmed] = useState(false);



  useEffect(() => {
    fetchRequests();
  }, []);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await getAllFinancingRequests();

      // Normalize incoming data to avoid missing keys across mocks / API
      const normalized = (data || []).map(r => {
        const buyerName = r.buyer_user_nm ?? r.buyer?.user_nm ?? r.buyer_name ?? r.requested_by ?? null;
        const supplierName = r.supplier_user_nm ?? r.supplier?.user_nm ?? r.supplier_name ?? null;
        const amount = Number(r.amount ?? 0);
        const amount_paid = Number(r.amount_paid ?? 0);
        const amount_used = Number(r.amount_used ?? 0);
        const amount_refunded = Number(r.amount_refunded ?? 0);
        const createdAt = r.created_at ?? r.approved_at ?? null;

        // Calculate expires_at if not present: prefer explicit expires_at, then approved_at+term_days, then created_at+term_days (estimate)
        let computedExpires = r.expires_at ?? null;
        const termDays = Number(r.term_days || 0);

        if (!computedExpires && r.approved_at && termDays > 0) {
          try {
            const approved = new Date(r.approved_at);
            const expires = new Date(approved);
            expires.setDate(expires.getDate() + termDays);
            computedExpires = expires.toISOString().split('T')[0];
          } catch (e) {
            computedExpires = null;
          }
        }

        // If still missing, estimate from created_at + term_days (useful for non-approved mocks)
        if (!computedExpires && r.created_at && termDays > 0) {
          try {
            const created = new Date(r.created_at);
            const expires = new Date(created);
            expires.setDate(expires.getDate() + termDays);
            computedExpires = expires.toISOString().split('T')[0];
          } catch (e) {
            computedExpires = null;
          }
        }

        // Balance MUST be amount_used - amount_paid (per DISEÑO_BACKEND.md)
        const balance = amount_used - amount_paid;
        const available = Math.max(0, amount - amount_used);
        const refund_pending = Math.max(0, amount_paid - amount_used - amount_refunded);

        const out = {
          ...r,
          buyer_user_nm: buyerName,
          supplier_user_nm: supplierName,
          amount,
          amount_used,
          amount_paid,
          amount_refunded,
          refund_pending,
          available,
          created_at: createdAt,
          display_created_at: createdAt,
          display_buyer_name: buyerName,
          display_supplier_name: supplierName,
          display_expires_at: computedExpires,
          display_balance: balance,
          display_amount: amount,
          // also mirror to commonly-named fields used by grid
          buyer_name: buyerName,
          supplier_name: supplierName,
          expires_at: computedExpires,
          balance: balance,
        };

        // Formatted display fields to avoid runtime formatter mismatches in DataGrid
        out.display_created_at_formatted = out.display_created_at ? formatDate(out.display_created_at) : '-';
        out.display_approved_at_formatted = r.approved_at ? formatDate(r.approved_at) : '-';
        out.display_amount_formatted = formatCurrency(out.display_amount);
        out.display_expires_at_formatted = out.display_expires_at ? formatDate(out.display_expires_at) : '-';
        out.display_balance_formatted = formatCurrency(out.display_balance);
        out.display_amount_used_formatted = formatCurrency(out.amount_used);
        out.display_amount_paid_formatted = formatCurrency(out.amount_paid);
        out.display_available_formatted = formatCurrency(out.available);
        out.display_refund_pending_formatted = formatCurrency(out.refund_pending);

        return out;
      });

      // Debug: expose a single sample in console to inspect data shape
      if (normalized.length > 0) console.debug('[FinanciamientosTable] sample request:', normalized[0]);

      setRequests(normalized);
    } catch (error) {
      console.error('Error loading financing requests:', error);
      toast.error('Error al cargar solicitudes');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (request) => {
    // open confirm modal
    setSelectedRequest(request);
    setActionType('approve');
    setActionDialogOpen(true);
  };

  const confirmApprove = async () => {
    try {
      setProcessingAction(true);
      const adminId = getCurrentAdminId();
      if (!adminId) {
        toast.error('No se pudo obtener el ID del administrador');
        return;
      }
      await approveFinancingRequest(selectedRequest.id, adminId);
      toast.success('Financiamiento aprobado exitosamente');
      setActionDialogOpen(false);
      setSelectedRequest(null);
      await fetchRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error(error.message || 'Error al aprobar financiamiento');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleReject = (request) => {
    setSelectedRequest(request);
    setActionType('reject');
    setActionDialogOpen(true);
  };

  const confirmReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Debe ingresar un motivo de rechazo');
      return;
    }

    try {
      setProcessingAction(true);
      await rejectFinancingRequest(selectedRequest.id, rejectReason);
      toast.success('Financiamiento rechazado');
      setActionDialogOpen(false);
      setRejectReason('');
      setSelectedRequest(null);
      await fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Error al rechazar financiamiento');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleViewDocuments = async (request) => {
    setSelectedRequest(request);
    setActionType('documents');
    setActionDialogOpen(true);
    setLoadingDocuments(true);

    try {
      const docs = await getFinancingDocuments(request.id);
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('Error al cargar documentos');
      setDocuments([]);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const handleDownloadDocument = async (doc) => {
    try {
      const blob = await downloadDocument(doc.storage_path);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.document_name || `documento-${doc.id}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Documento descargado');
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Error al descargar documento');
    }
  };

  // --------- Transactions / Restore / Refund Handlers ---------
  const handleViewMovements = async (request) => {
    setSelectedRequest(request);
    setTransactionsLoading(true);
    setTransactionsOpen(true);
    try {
      const txs = await getFinancingTransactions(request.id);
      setTransactions(txs);
    } catch (err) {
      console.error('Error loading transactions:', err);
      toast.error('Error al cargar movimientos');
      setTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const handleOpenRestore = (request) => {
    setSelectedRequest(request);
    setRestoreAmount('');
    setRestoreDialogOpen(true);
  };

  const confirmRestore = async () => {
    if (!restoreAmount || Number(restoreAmount) <= 0) {
      toast.error('Ingrese un monto válido');
      return;
    }

    const maxRestore = Number(selectedRequest?.amount_used || 0);
    if (Number(restoreAmount) > maxRestore) {
      toast.error(`El monto excede el uso actual (${formatCurrency(maxRestore)})`);
      return;
    }

    if (!restoreReason.trim()) {
      toast.error('Ingrese un motivo de reposición');
      return;
    }

    if (!restoreConfirm) {
      toast.error('Debe confirmar que esta acción corrige crédito y no devuelve dinero');
      return;
    }

    try {
      setProcessingRestore(true);
      const adminId = getCurrentAdminId();
      await restoreFinancingAmount(selectedRequest.id, Number(restoreAmount), adminId, restoreReason.trim());
      toast.success('Reposición realizada');
      setRestoreDialogOpen(false);
      setRestoreReason('');
      setRestoreConfirm(false);
      setRestoreAmount('');
      setSelectedRequest(null);
      await fetchRequests();
    } catch (err) {
      console.error('Error restoring amount:', err);
      toast.error(err.message || 'Error al reponer monto');
    } finally {
      setProcessingRestore(false);
    }
  };

  const handleOpenRefund = (request) => {
    setSelectedRequest(request);
    setRefundAmount('');
    setRefundConfirmed(false);
    setRefundDialogOpen(true);
  };  

  const confirmRefund = async () => {
    if (!refundAmount || Number(refundAmount) <= 0) {
      toast.error('Ingrese un monto válido');
      return;
    }

    const maxRefund = Number(selectedRequest?.refund_pending || 0);
    if (Number(refundAmount) > maxRefund) {
      toast.error(`El monto excede el reembolso pendiente (${formatCurrency(maxRefund)})`);
      return;
    }

    if (!refundConfirmed) {
      toast.error('Confirme que la devolución ya fue realizada externamente antes de marcarla aquí');
      return;
    }

    try {
      setProcessingRefund(true);
      const adminId = getCurrentAdminId();
      await processRefund(selectedRequest.id, Number(refundAmount), adminId);
      toast.success('Reembolso procesado');
      setRefundDialogOpen(false);
      setRefundAmount('');
      setRefundConfirmed(false);
      setSelectedRequest(null);
      await fetchRequests();
    } catch (err) {
      console.error('Error processing refund:', err);
      toast.error(err.message || 'Error al procesar reembolso');
    } finally {
      setProcessingRefund(false);
    }
  };



  const formatReadableId = (id) => {
    if (!id) return '-';
    const s = String(id).trim();
    // UUID regex (v4-like): 8-4-4-4-12 hex groups
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(s);
    const raw = s.replace(/-/g, '');
    let last8 = raw.slice(-8);
    // Ensure uppercase hex and pad with zeros if somehow shorter
    last8 = last8.toUpperCase().padStart(8, '0');
    return `#${last8}`;
  };

  const columns = useMemo(
    () => [
      {
        field: 'id',
        headerName: 'ID',
        width: 130,
        cellClassName: 'idCell',
        renderCell: ({ row }) => {
          const idFull = row?.id ?? '-';
          const readable = formatReadableId(idFull);
          return (
            <ProfileInfoPopover
              displayText={readable}
              title="ID Financiamiento"
              fields={[
                { label: 'UUID', value: idFull },
                { label: 'ID', value: readable }
              ]}
            />
          );
        },
      },

      {
        field: 'supplier_name',
        headerName: 'Proveedor',
        width: 160,
        renderCell: ({ row }) => {
          const display = row?.display_supplier_name ?? row?.supplier?.user_nm ?? '-';
          const fields = [
            { label: 'Razón Social', value: row?.supplier_legal_name ?? row?.supplier?.legal_name },
            { label: 'RUT Empresa', value: row?.supplier_legal_rut ?? row?.supplier?.legal_rut },
            { label: 'Representante', value: row?.supplier_legal_representative_name ?? row?.supplier?.legal_representative_name },
            { label: 'RUT Representante', value: row?.supplier_legal_representative_rut ?? row?.supplier?.legal_representative_rut },
            { label: 'Dirección', value: row?.supplier_legal_address ?? row?.supplier?.legal_address },
            { label: 'Comuna', value: row?.supplier_legal_commune ?? row?.supplier?.legal_commune },
            { label: 'Región', value: row?.supplier_legal_region ?? row?.supplier?.legal_region },
          ];

          return (
            <ProfileInfoPopover displayText={display} title="Información Proveedor" fields={fields} />
          );
        },
      },
      {
        field: 'buyer_name',
        headerName: 'Comprador',
        width: 160,
        renderCell: ({ row }) => {
          const display = row?.display_buyer_name ?? row?.buyer?.user_nm ?? '-';
          const fields = [
            { label: 'Razón Social', value: row?.buyer_legal_name ?? row?.buyer?.legal_name },
            { label: 'RUT Empresa', value: row?.buyer_legal_rut ?? row?.buyer?.legal_rut },
            { label: 'Representante', value: row?.buyer_legal_representative_name ?? row?.buyer?.legal_representative_name },
            { label: 'RUT Representante', value: row?.buyer_legal_representative_rut ?? row?.buyer?.legal_representative_rut },
            { label: 'Dirección', value: row?.buyer_legal_address ?? row?.buyer?.legal_address },
            { label: 'Comuna', value: row?.buyer_legal_commune ?? row?.buyer?.legal_commune },
            { label: 'Región', value: row?.buyer_legal_region ?? row?.buyer?.legal_region },
          ];

          return (
            <ProfileInfoPopover displayText={display} title="Información Comprador" fields={fields} />
          );
        },
      },

      {
        field: 'request_type',
        headerName: 'Tipo',
        width: 100,
        renderCell: ({ value }) => (
          <Chip
            label={value === 'express' ? 'Express' : 'Extended'}
            size="small"
            color={value === 'express' ? 'info' : 'primary'}
            variant="outlined"
          />
        ),
      },
      {
        field: 'fechas',
        headerName: 'Fecha',
        width: 220,
        cellClassName: 'fechasCell',
        renderCell: ({ row }) => (
          <TableTooltip title={
            <span>
              <div><strong>Solicitud:</strong> Fecha en que el comprador generó la solicitud.</div>
              <div><strong>Aprobación:</strong> Fecha en que Sellsi aprobó la solicitud.</div>
              <div><strong>Vencimiento:</strong> Fecha de vencimiento del financiamiento.</div>
            </span>
          }>
            <Stack spacing={0.5} sx={{ width: '100%' }}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary">Solicitud</Typography>
                <Typography variant="body2">{row?.display_created_at_formatted ?? '-'}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary">Aprobación</Typography>
                <Typography variant="body2">{row?.display_approved_at_formatted ?? '-'}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary">Vencimiento</Typography>
                <Typography variant="body2">{row?.display_expires_at_formatted ?? '-'}</Typography>
              </Stack>
            </Stack>
          </TableTooltip>
        ),
      },
      {
        field: 'term_days',
        headerName: 'Plazo',
        width: 90,
        align: 'center',
        headerAlign: 'center',
      },
      {
        field: 'montos',
        headerName: 'Montos',
        width: 260,
        cellClassName: 'montosCell',
        renderCell: ({ row }) => (
          <TableTooltip title={
            <span>
              <div><strong>Asignado:</strong> Monto total aprobado para este financiamiento.</div>
              <div><strong>Utilizado:</strong> Monto ya consumido en órdenes asociadas.</div>
              <div><strong>Disponible:</strong> Crédito restante disponible para usar en checkout.</div>
            </span>
          }>
            <Stack spacing={0.5} sx={{ width: '100%' }}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary">Asignado</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{row?.display_amount_formatted ?? '-'}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary">Utilizado</Typography>
                <Typography variant="body2">{row?.display_amount_used_formatted ?? '-'}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary">Disponible</Typography>
                <Typography variant="body2">{row?.display_available_formatted ?? '-'}</Typography>
              </Stack>
            </Stack>
          </TableTooltip>
        ),
      },
      {
        field: 'amount_paid',
        headerName: 'Pagado',
        width: 120,
        renderCell: ({ row }) => (
          <TableTooltip title={
            <span>
              <div><strong>Pagado:</strong> Total de dinero real que el comprador ha abonado a este financiamiento y que Sellsi mantiene en custodia.</div>
              <div>Incluye pagos parciales y totales; si el monto pagado supera lo usado por reposición, puede haber un saldo a favor (ver Reembolso).</div>
            </span>
          }>
            <Typography variant="body2" sx={{ width: '100%', textAlign: 'right' }}>{row?.display_amount_paid_formatted ?? '-'}</Typography>
          </TableTooltip>
        ),
        align: 'right',
        headerAlign: 'right',
      },
      {
        field: 'balance',
        headerName: 'Saldo',
        width: 120,
        renderCell: ({ row }) => (
          <TableTooltip title={
            <span>
              <div><strong>Saldo:</strong> Diferencia entre lo consumido y lo pagado: <em>Utilizado − Pagado</em>.</div>
              <div>Si es mayor a 0, representa deuda pendiente que el comprador debe pagar. Si es 0 o negativo, no hay deuda (puede existir saldo a favor).</div>
            </span>
          }>
            <Typography variant="body2" sx={{ width: '100%', textAlign: 'right' }}>{row?.display_balance_formatted ?? '-'}</Typography>
          </TableTooltip>
        ),
        align: 'right',
        headerAlign: 'right',
      },
      {
        field: 'refund_pending',
        headerName: 'Reembolso',
        width: 140,
        renderCell: ({ row }) => (
          <TableTooltip title={
            <span>
              <div><strong>Reembolso pendiente:</strong> Monto a favor que debe devolverse al comprador. Se calcula como <em>Pagado − Utilizado − Reembolsado</em>.</div>

              <div style={{ marginTop: 8 }}><strong>Flujo resumido (qué ocurre):</strong></div>
              <div>1) <strong>Proveedor cancela</strong> una orden → el sistema hace una <em>Reposición automática</em> (el valor "Utilizado" baja).</div>
              <div>2) Si ahora <strong>Pagado</strong> {'>'} <strong>Utilizado</strong>, se genera un <em>Reembolso pendiente</em> (dinero que corresponde devolver).</div>
              <div>3) El administrador revisa y pulsa <strong>Procesar Reembolso</strong> para transferir el dinero real al comprador; esto aumenta "Reembolsado" y reduce el "Reembolso pendiente".</div>

              <div style={{ marginTop: 8 }}><strong>Ejemplo:</strong> Pagado = $50.000, Utilizado = $0 → Reembolso pendiente = $50.000. Admin procesa reembolso → Reembolso pendiente → $0.</div>

              <div style={{ marginTop: 8 }}><strong>Atención:</strong> La <em>Reposición</em> (liberar crédito) es automática; la <em>Devolución de dinero</em> es manual y requiere acción del admin. El sistema evita procesar devoluciones mayores al reembolso disponible.</div>
            </span>
          } componentsProps={{ tooltip: { sx: { fontSize: '1.14rem', maxWidth: 680, p: 1 } } }}>
            <Typography variant="body2" sx={{ width: '100%', textAlign: 'right' }}>{row?.display_refund_pending_formatted ?? '-'}</Typography>
          </TableTooltip>
        ),
        align: 'right',
        headerAlign: 'right',
      },
      {
        field: 'status',
        headerName: 'Estado',
        width: 160,
        renderCell: ({ value }) => <StatusChip status={value} />,
      },
      {
        field: 'actions',
        width: 300,
        sortable: false,
        renderHeader: (params) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TableTooltip
              title={<div>
                <strong>Acciones disponibles por fila</strong>
                <ul style={{ paddingLeft: 16, marginTop: 8 }}>
                  <li><strong>Ver Documentos:</strong> Descargar o visualizar contratos, pagarés y otros archivos adjuntos.</li>
                  <li><strong>Ver Movimientos:</strong> Historial de transacciones (consumos, pagos, reposiciones, devoluciones).</li>
                  <li><strong>Procesar Reembolso:</strong> Visible solo cuando existe <em>Reembolso pendiente</em>. Primero debe realizarse la devolución de dinero externamente; luego el admin registra aquí el monto devuelto. (El sistema valida que no se procese más que el pendiente).</li>
                  <li><strong>Reponer Monto:</strong> Disponible si existe monto utilizado. Es una corrección de crédito (no devuelve dinero); se considera un caso excepcional y por eso aparece al final.</li>
                  <li><strong>Aprobar / Rechazar:</strong> Solo para solicitudes en estado pendiente de aprobación por Sellsi.</li>
                </ul>
                <div style={{ marginTop: 8 }}><em>Tip:</em> Pasa el cursor sobre cada acción para ver una breve descripción específica.</div>
              </div>}
              componentsProps={{ tooltip: { sx: { fontSize: '1.14rem', maxWidth: 680, p: 1 } } }}
            >
              <IconButton size="small" aria-label="Información de acciones" sx={{ p: 0.4 }}>
                <InfoOutlinedIcon fontSize="small" />
              </IconButton>
            </TableTooltip>

            <Typography variant="subtitle2">Acciones</Typography>
          </Box>
        ),
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ width: '100%' }}>
            <ActionIconButton tooltip="Ver Documentos" variant="info" onClick={() => handleViewDocuments(row)}>
              <DocumentIcon />
            </ActionIconButton>

            <ActionIconButton tooltip="Ver Movimientos" variant="info" onClick={() => handleViewMovements(row)}>
              <ViewIcon />
            </ActionIconButton>

            {/* Procesar Reembolso: ahora con icono de dinero y color verde cuando haya reembolso pendiente */}
            {row.refund_pending > 0 && (
              <ActionIconButton tooltip="Procesar Reembolso" variant="success" onClick={() => handleOpenRefund(row)}>
                <MoneyIcon />
              </ActionIconButton>
            )}

            {row.status === 'pending_sellsi_approval' && (
              <>
                <ActionIconButton tooltip="Aprobar" variant="success" onClick={() => handleApprove(row)} sx={{ mr: 0.5 }}>
                  <ApproveIcon />
                </ActionIconButton>

                <ActionIconButton tooltip="Rechazar" variant="error" onClick={() => handleReject(row)}>
                  <RejectIcon />
                </ActionIconButton>
              </>
            )}

            {/* Reponer Monto: edge case, siempre al extremo derecho */}
            {row.amount_used > 0 && (
              <ActionIconButton tooltip="Reponer Monto" variant="warning" onClick={() => handleOpenRestore(row)} sx={{ marginLeft: 'auto' }}>
                <AutorenewIcon />
              </ActionIconButton>
            )}
          </Stack>
        ),
      },
    ],
    [processingAction]
  );

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MoneyIcon color="primary" />
          Gestión de Financiamientos
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Revisa, aprueba o rechaza solicitudes de financiamiento y descarga documentos firmados
        </Typography>
      </Box>

      {/* Stats */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Pendientes Aprobación
          </Typography>
          <Typography variant="h4" color="warning.main">
            {requests.filter(r => r.status === 'pending_sellsi_approval').length}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Aprobados
          </Typography>
          <Typography variant="h4" color="success.main">
            {requests.filter(r => r.status === 'approved_by_sellsi').length}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Expirados
          </Typography>
          <Typography variant="h4" color="error.main">
            {requests.filter(r => r.status === 'expired').length}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Reembolsos Pendientes
          </Typography>
          <Typography variant="h4" color="warning.main">
            {requests.filter(r => (r.refund_pending || 0) > 0).length}
          </Typography>
        </Paper>
      </Stack>

      {/* DataGrid */}
      <Paper elevation={3}>
        <DataGrid
          rows={requests}
          columns={columns}
          getRowId={(row) => row.id}
          loading={loading}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10 },
            },
            sorting: {
              sortModel: [{ field: 'created_at', sort: 'desc' }],
            },
          }}
          pageSizeOptions={[10, 25, 50, 100]}
          disableRowSelectionOnClick
          getRowHeight={() => 'auto'}
          sx={{
            '& .MuiDataGrid-row:hover': {
              backgroundColor: 'action.hover',
            },
            '& .montosCell': {
              whiteSpace: 'normal',
              lineHeight: 1.2,
              py: 0.5,
              alignItems: 'flex-start',
              display: 'flex',
            },
            '& .fechasCell': {
              whiteSpace: 'normal',
              lineHeight: 1.2,
              py: 0.5,
              alignItems: 'flex-start',
              display: 'flex',
            },
            '& .idCell': {
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 140,
            },
          }}
        />
      </Paper>

      {/* Reject Dialog */}
      <FinancingActionModals
        open={actionDialogOpen}
        mode={actionType}
        financing={selectedRequest}
        onClose={() => !processingAction && (setActionDialogOpen(false), setSelectedRequest(null), setRejectReason(''))}
        onApprove={async (fin, file) => {
          // upload the file (mock in DEV) then approve
          try {
            setProcessingAction(true);
            const adminId = getCurrentAdminId();
            if (!adminId) {
              toast.error('No se pudo obtener el ID del administrador');
              return;
            }
            if (file) {
              await uploadFinancingDocument(fin.id, file);
            }
            await approveFinancingRequest(fin.id, adminId);
            toast.success('Financiamiento aprobado y documento adjuntado');
            setActionDialogOpen(false);
            setSelectedRequest(null);
            await fetchRequests();
          } catch (err) {
            console.error('Error en approve+upload:', err);
            toast.error(err.message || 'Error al aprobar financiamiento');
          } finally {
            setProcessingAction(false);
          }
        }}
        onReject={async (fin, reason) => { setRejectReason(reason || ''); await confirmReject(); }}
        onSign={async (fin, file) => { /* admin signing flow not implemented yet */ }}
      />

      {/* Documents: use shared DownloadablesModal to match 'mis financiamientos' UI */}
      <DownloadablesModal
        open={actionDialogOpen && actionType === 'documents'}
        onClose={() => !processingAction && (setActionDialogOpen(false), setSelectedRequest(null))}
        financing={selectedRequest}
        documents={documents}
        loading={loadingDocuments}
        onDownloadFile={handleDownloadDocument}
        showMetadata={false}
      />

      {/* Transactions dialog (estandarizado) */}
      <Dialog open={transactionsOpen} onClose={() => setTransactionsOpen(false)} maxWidth="md" fullWidth fullScreen={isMobile} disableScrollLock sx={{ zIndex: 1500 }} PaperProps={{ sx: { borderRadius: isMobile ? 0 : 2 } }}>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center', textAlign: 'center', backgroundColor: '#2E52B2', color: '#fff', py: { xs: 2, sm: 2 }, px: { xs: 2, sm: 3 }, position: 'relative', fontSize: { xs: '1.125rem', sm: '1.25rem' } }}>
          <IconButton onClick={() => setTransactionsOpen(false)} sx={{ position: 'absolute', right: { xs: 8, sm: 16 }, top: '50%', transform: 'translateY(-50%)', color: '#fff', backgroundColor: 'rgba(255,255,255,0.1)', p: { xs: 0.75, sm: 1 }, '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' } }}>
            <CloseIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
          </IconButton>
          <HistoryIcon sx={{ color: '#fff' }} fontSize="small" />
          Movimientos
        </DialogTitle>
        <DialogContent dividers sx={MODAL_DIALOG_CONTENT_STYLES}>
          {transactionsLoading ? (
            <Stack alignItems="center" sx={{ py: 4 }}>
              <CircularProgress />
            </Stack>
          ) : transactions.length === 0 ? (
            <Typography variant="body2">No hay movimientos registrados</Typography>
          ) : (
            <Stack spacing={1}>
              {transactions.map(tx => (
                <Paper key={tx.id} sx={{ p: 2 }}>
                  <Stack direction="row" justifyContent="space-between">
                    <div>
                      <Typography variant="subtitle2">{tx.type}</Typography>
                      <Typography variant="body2" color="text.secondary">{tx.restoration_reason ?? tx.payment_reference ?? ''}</Typography>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Typography variant="subtitle2">{formatCurrency(tx.amount)}</Typography>
                      <Typography variant="body2" color="text.secondary">{formatDate(tx.created_at)}</Typography>
                    </div>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={MODAL_DIALOG_ACTIONS_STYLES}>
          <Button onClick={() => setTransactionsOpen(false)} variant="outlined" sx={MODAL_CANCEL_BUTTON_STYLES}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Restore dialog (estandarizado) */}
      <Dialog open={restoreDialogOpen} onClose={() => !processingRestore && (setRestoreDialogOpen(false), setRestoreReason(''), setRestoreConfirm(false))} maxWidth="sm" fullWidth fullScreen={isMobile} disableScrollLock sx={{ zIndex: 1500 }} PaperProps={{ sx: { borderRadius: isMobile ? 0 : 2 } }}>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center', textAlign: 'center', backgroundColor: '#2E52B2', color: '#fff', py: { xs: 2, sm: 2 }, px: { xs: 2, sm: 3 }, position: 'relative', fontSize: { xs: '1.125rem', sm: '1.25rem' } }}>
          <IconButton onClick={() => (setRestoreDialogOpen(false), setRestoreReason(''), setRestoreConfirm(false))} sx={{ position: 'absolute', right: { xs: 8, sm: 16 }, top: '50%', transform: 'translateY(-50%)', color: '#fff', backgroundColor: 'rgba(255,255,255,0.1)', p: { xs: 0.75, sm: 1 }, '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' } }}>
            <CloseIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
          </IconButton>
          <CheckCircleOutlineIcon sx={{ color: '#fff' }} fontSize="small" />
          Reponer Monto
        </DialogTitle>
        <DialogContent dividers sx={MODAL_DIALOG_CONTENT_STYLES}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Saldo usado: {selectedRequest ? formatCurrency(selectedRequest.amount_used) : '-'}
          </Typography>

          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
            Reponer reduce el <em>Utilizado</em> (crédito liberado). <strong>NO</strong> realiza una devolución de dinero automático; si existe dinero pagado que ahora queda sin uso, se generará un <em>Reembolso pendiente</em> que deberá procesar un administrador.
          </Typography>

          <TextField
            label="Monto a reponer"
            type="number"
            fullWidth
            value={restoreAmount}
            onChange={(e) => setRestoreAmount(e.target.value)}
            helperText={selectedRequest ? `Máximo: ${formatCurrency(selectedRequest.amount_used)}` : ''}
            sx={{ mb: 1 }}
          />

          <TextField
            label="Motivo (obligatorio)"
            placeholder="Ej: Orden cancelada - reposición automática fallida"
            fullWidth
            value={restoreReason}
            onChange={(e) => setRestoreReason(e.target.value)}
            sx={{ mb: 1 }}
          />

          <FormControlLabel
            control={<Checkbox checked={restoreConfirm} onChange={(e) => setRestoreConfirm(e.target.checked)} size="small" />}
            label="Confirmo que esto corrige crédito (no devuelve dinero)"
          />
        </DialogContent>
        <DialogActions sx={MODAL_DIALOG_ACTIONS_STYLES}>
          <Button onClick={() => (setRestoreDialogOpen(false), setRestoreReason(''), setRestoreConfirm(false))} disabled={processingRestore} variant="outlined" sx={MODAL_CANCEL_BUTTON_STYLES}>Cancelar</Button>
          <Button onClick={confirmRestore} variant="contained" color="success" disabled={processingRestore || !restoreAmount || Number(restoreAmount) <= 0 || Number(restoreAmount) > (selectedRequest?.amount_used || 0) || !restoreReason.trim() || !restoreConfirm} sx={MODAL_SUBMIT_BUTTON_STYLES}>{processingRestore ? 'Procesando...' : 'Reponer'}</Button>
        </DialogActions>
      </Dialog>

      {/* Refund dialog (estandarizado) */}
      <Dialog open={refundDialogOpen} onClose={() => !processingRefund && setRefundDialogOpen(false)} maxWidth="sm" fullWidth fullScreen={isMobile} disableScrollLock sx={{ zIndex: 1500 }} PaperProps={{ sx: { borderRadius: isMobile ? 0 : 2 } }}>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center', textAlign: 'center', backgroundColor: '#2E52B2', color: '#fff', py: { xs: 2, sm: 2 }, px: { xs: 2, sm: 3 }, position: 'relative', fontSize: { xs: '1.125rem', sm: '1.25rem' } }}>
          <IconButton onClick={() => !processingRefund && setRefundDialogOpen(false)} sx={{ position: 'absolute', right: { xs: 8, sm: 16 }, top: '50%', transform: 'translateY(-50%)', color: '#fff', backgroundColor: 'rgba(255, 255, 255, 0.1)', p: { xs: 0.75, sm: 1 }, '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' } }}>
            <CloseIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
          </IconButton>
          <MoneyIcon sx={{ color: '#fff' }} fontSize="small" />
          Procesar Reembolso - {selectedRequest ? formatReadableId(selectedRequest.id) : ''}
        </DialogTitle>

        <DialogContent dividers sx={MODAL_DIALOG_CONTENT_STYLES}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Reembolso pendiente: {selectedRequest ? formatCurrency(selectedRequest.refund_pending) : '-'}
          </Typography>

          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
            Procesar Reembolso enviará dinero real al comprador. Solo es válido si existe un <strong>reembolso pendiente</strong> (resultado de pagos que exceden el uso). Verifica el monto antes de confirmar. El sistema previene devoluciones mayores al reembolso pendiente.
          </Typography>

          <TextField
            label="Monto a devolver"
            type="number"
            fullWidth
            value={refundAmount}
            onChange={(e) => setRefundAmount(e.target.value)}
            helperText={selectedRequest ? `Máximo permitido: ${formatCurrency(selectedRequest.refund_pending)}` : ''}
            sx={{ mb: 1 }}
          />

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Nota: Primero debe realizarse la devolución de dinero al comprador (transferencia bancaria u otro método). Use este formulario únicamente para registrar el monto ya devuelto.
          </Typography>

          <FormControlLabel
            control={<Checkbox checked={refundConfirmed} onChange={(e) => setRefundConfirmed(e.target.checked)} size="small" />}
            label="Confirmo que la devolución ya fue realizada externamente y que el monto indicado corresponde a lo devuelto"
            sx={{ mb: 1 }}
          />
        </DialogContent>

        <DialogActions sx={MODAL_DIALOG_ACTIONS_STYLES}>
          <Button onClick={() => (setRefundDialogOpen(false), setRefundConfirmed(false))} disabled={processingRefund} variant="outlined" sx={MODAL_CANCEL_BUTTON_STYLES}>Cancelar</Button>
          <Button onClick={confirmRefund} variant="contained" color="success" disabled={processingRefund || !refundAmount || Number(refundAmount) <= 0 || Number(refundAmount) > (selectedRequest?.refund_pending || 0) || !refundConfirmed} sx={MODAL_SUBMIT_BUTTON_STYLES}>{processingRefund ? 'Procesando...' : 'Procesar'}</Button>
        </DialogActions>
      </Dialog>

      {/* Documents dialog is now handled by FinancingActionDialog (actionType === 'documents') */}
    </Box>
  );
};

export default FinanciamientosTable;
