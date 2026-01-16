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

import React, { useState, useEffect, useMemo } from 'react';
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
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Description as DocumentIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { toast } from 'react-hot-toast';
import {
  getAllFinancingRequests,
  approveFinancingRequest,
  rejectFinancingRequest,
  getFinancingDocuments,
  downloadDocument,
  getDocumentUrl,
} from '../services/adminFinancingService';
import { getCurrentAdminId } from './userManagementTable/utils/userUtils';

// ✅ FORMATTERS
const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(value);
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

// ✅ MAIN COMPONENT
const FinanciamientosTable = () => {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [documentsDialogOpen, setDocumentsDialogOpen] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await getAllFinancingRequests();
      setRequests(data);
    } catch (error) {
      console.error('Error loading financing requests:', error);
      toast.error('Error al cargar solicitudes');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request) => {
    if (!window.confirm(`¿Aprobar financiamiento de ${formatCurrency(request.amount)} para ${request.buyer?.user_nm}?`)) {
      return;
    }

    try {
      setProcessingAction(true);
      
      const adminId = getCurrentAdminId();
      if (!adminId) {
        toast.error('No se pudo obtener el ID del administrador');
        return;
      }
      
      await approveFinancingRequest(request.id, adminId);
      toast.success('Financiamiento aprobado exitosamente');
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
    setRejectDialogOpen(true);
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
      setRejectDialogOpen(false);
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
    setDocumentsDialogOpen(true);
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

  const columns = useMemo(
    () => [
      {
        field: 'created_at',
        headerName: 'Fecha Solicitud',
        width: 130,
        valueFormatter: ({ value }) => formatDate(value),
      },
      {
        field: 'buyer_name',
        headerName: 'Comprador',
        width: 200,
        valueGetter: (params) => params.row.buyer?.user_nm || '-',
      },
      {
        field: 'supplier_name',
        headerName: 'Proveedor',
        width: 200,
        valueGetter: (params) => params.row.supplier?.user_nm || '-',
      },
      {
        field: 'amount',
        headerName: 'Monto',
        width: 130,
        valueFormatter: ({ value }) => formatCurrency(value),
        align: 'right',
        headerAlign: 'right',
      },
      {
        field: 'term_days',
        headerName: 'Plazo (días)',
        width: 100,
        align: 'center',
        headerAlign: 'center',
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
        field: 'status',
        headerName: 'Estado',
        width: 180,
        renderCell: ({ value }) => <StatusChip status={value} />,
      },
      {
        field: 'expires_at',
        headerName: 'Vencimiento',
        width: 120,
        valueFormatter: ({ value }) => formatDate(value),
      },
      {
        field: 'balance',
        headerName: 'Saldo',
        width: 120,
        valueGetter: (params) => params.row.amount_used - params.row.amount_paid,
        valueFormatter: ({ value }) => formatCurrency(value),
        align: 'right',
        headerAlign: 'right',
      },
      {
        field: 'actions',
        headerName: 'Acciones',
        width: 180,
        sortable: false,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Ver Documentos">
              <IconButton
                size="small"
                color="info"
                onClick={() => handleViewDocuments(row)}
              >
                <DocumentIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {row.status === 'pending_sellsi_approval' && (
              <>
                <Tooltip title="Aprobar">
                  <IconButton
                    size="small"
                    color="success"
                    onClick={() => handleApprove(row)}
                    disabled={processingAction}
                  >
                    <ApproveIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Rechazar">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleReject(row)}
                    disabled={processingAction}
                  >
                    <RejectIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Stack>
        ),
      },
    ],
    [processingAction]
  );

  return (
    <Box sx={{ height: 600, width: '100%' }}>
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
          autoHeight
          sx={{
            '& .MuiDataGrid-row:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        />
      </Paper>

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialogOpen}
        onClose={() => !processingAction && setRejectDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Rechazar Solicitud de Financiamiento</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Esta acción notificará al comprador y al proveedor sobre el rechazo
          </Alert>
          <TextField
            autoFocus
            multiline
            rows={4}
            fullWidth
            label="Motivo del rechazo"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Ingrese el motivo por el cual se rechaza esta solicitud..."
            disabled={processingAction}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)} disabled={processingAction}>
            Cancelar
          </Button>
          <Button
            onClick={confirmReject}
            color="error"
            variant="contained"
            disabled={processingAction || !rejectReason.trim()}
          >
            {processingAction ? <CircularProgress size={20} /> : 'Rechazar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Documents Dialog */}
      <Dialog
        open={documentsDialogOpen}
        onClose={() => setDocumentsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Documentos del Financiamiento
          {selectedRequest && (
            <Typography variant="body2" color="text.secondary">
              {selectedRequest.buyer?.user_nm} - {formatCurrency(selectedRequest.amount)}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {loadingDocuments ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : documents.length === 0 ? (
            <Alert severity="info">No hay documentos disponibles para este financiamiento</Alert>
          ) : (
            <Stack spacing={2}>
              {documents.map((doc) => (
                <Paper key={doc.id} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <DocumentIcon color="primary" />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2">{doc.document_name || 'Sin nombre'}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Tipo: {doc.document_type} | Subido: {formatDate(doc.uploaded_at)}
                    </Typography>
                  </Box>
                  <Button
                    startIcon={<DownloadIcon />}
                    variant="outlined"
                    size="small"
                    onClick={() => handleDownloadDocument(doc)}
                  >
                    Descargar
                  </Button>
                </Paper>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDocumentsDialogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FinanciamientosTable;
