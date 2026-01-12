/**
 * ============================================================================
 * SUPPLIER FINANCINGS LIST COMPONENT
 * ============================================================================
 * 
 * Componente contenedor que gestiona la lista de financiamientos.
 * Incluye filtros, estados vacíos y manejo de acciones.
 * Soporta vista desktop (tabla) y mobile (cards).
 * 
 * Similar a SupplierOffersList pero adaptado al contexto de financiamiento.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useMediaQuery,
  useTheme,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Stack,
  Tabs,
  Tab,
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DrawIcon from '@mui/icons-material/Draw';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useBanner } from '../../../../shared/components/display/banners/BannerContext';
import TableSkeleton from '../../../../shared/components/display/skeletons/TableSkeleton';
import MobileFilterAccordion from '../../../../shared/components/mobile/MobileFilterAccordion';
import SupplierFinancingTable, { SupplierApprovedTable } from './SupplierFinancingTable';
import SupplierFinancingActionModals from './SupplierFinancingActionModals';
import ViewReasonModal from '../../../../shared/components/financing/ViewReasonModal';
import Modal from '../../../../shared/components/feedback/Modal/Modal';
import { MODAL_TYPES } from '../../../../shared/components/feedback/Modal/modalConfig';
import { STATUS_MAP } from '../hooks/useSupplierFinancings';
import { 
  FILTER_CATEGORIES, 
  stateMatchesFilter, 
  getAvailableActions,
  getStateConfig,
} from '../../../../shared/utils/financing/financingStates';
import { formatPrice } from '../../../../shared/utils/formatters/priceFormatters';

/**
 * Componente de tarjeta mobile para financiamientos
 */
const MobileFinancingCard = ({ financing, onApprove, onReject, onSign, onCancel, onViewReason, onDownload }) => {
  const statusInfo = getStateConfig(financing.status, 'supplier');
  const availableActions = getAvailableActions(financing.status, 'supplier');

  // Mapeo de colores MUI a colores de texto
  const colorMap = {
    warning: 'warning.main',
    success: 'success.main',
    error: 'error.main',
    info: 'info.main',
    default: 'text.secondary',
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        {/* Header: Solicitante y Estado */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            {financing.requested_by}
          </Typography>
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{ color: colorMap[statusInfo.color] || 'text.secondary' }}
          >
            {statusInfo.label}
          </Typography>
        </Box>

        {/* Info Grid */}
        <Stack spacing={1} sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">Monto:</Typography>
            <Typography variant="body2" fontWeight={600} color="text.primary">
              {formatPrice(financing.amount)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">Plazo:</Typography>
            <Typography variant="body2">{financing.term_days} días</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">Empresa:</Typography>
            <Typography variant="body2">{financing.business_data}</Typography>
          </Box>
        </Stack>

        {/* Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1, borderTop: 1, borderColor: 'divider' }}>
          <Tooltip title="Descargar documentos">
            <IconButton size="small" color="primary" onClick={() => onDownload?.(financing)}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>

          <Box sx={{ display: 'flex', gap: 1 }}>
            {availableActions.includes('approve') && (
              <Tooltip title="Aprobar">
                <IconButton 
                  size="small" 
                  color="success" 
                  onClick={() => onApprove?.(financing)}
                  sx={{ '&:hover': { backgroundColor: 'success.light', color: 'white' } }}
                >
                  <CheckIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {availableActions.includes('reject') && (
              <Tooltip title="Rechazar">
                <IconButton 
                  size="small" 
                  color="error" 
                  onClick={() => onReject?.(financing)}
                  sx={{ '&:hover': { backgroundColor: 'error.light', color: 'white' } }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {availableActions.includes('sign') && (
              <Tooltip title="Firmar">
                <IconButton 
                  size="small" 
                  color="primary" 
                  onClick={() => onSign?.(financing)}
                  sx={{ '&:hover': { backgroundColor: 'primary.light', color: 'white' } }}
                >
                  <DrawIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {availableActions.includes('cancel') && (
              <Tooltip title="Cancelar">
                <IconButton 
                  size="small" 
                  color="error" 
                  onClick={() => onCancel?.(financing)}
                  sx={{ '&:hover': { backgroundColor: 'error.light', color: 'white' } }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {availableActions.includes('view_reason') && (
              <Tooltip title="Ver motivo">
                <IconButton 
                  size="small" 
                  color="info" 
                  onClick={() => onViewReason?.(financing)}
                  sx={{ '&:hover': { backgroundColor: 'info.light', color: 'white' } }}
                >
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

/**
 * Componente principal de lista
 */
const SupplierFinancingsList = ({
  financings = [],
  loading,
  initializing,
  onApprove,
  onReject,
  onSign,
  onCancel,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { showBanner } = useBanner();

  // Estado de pestañas
  const [activeTab, setActiveTab] = useState(0); // 0: Solicitudes, 1: Aprobados

  // Estado de filtros (independientes por pestaña)
  const [statusFilter, setStatusFilter] = useState('all');
  const [approvedFilter, setApprovedFilter] = useState('all'); // Para futura vista de aprobados

  // Estado de modales
  const [modalState, setModalState] = useState({
    open: false,
    mode: null, // 'approve' | 'reject' | 'sign' | 'cancel'
    financing: null,
  });

  // Estado de modal de ver motivo
  const [reasonModal, setReasonModal] = useState({
    open: false,
    financing: null,
  });

  // Filtrar financiamientos por categoría (Solicitudes)
  const filteredPending = useMemo(() => {
    if (statusFilter === FILTER_CATEGORIES.ALL) return financings;
    return financings.filter(f => stateMatchesFilter(f.status, statusFilter));
  }, [financings, statusFilter]);

  // Filtrar financiamientos aprobados (solo para tab 2)
  const approvedFinancings = useMemo(() => {
    return financings.filter(f => f.status === 'approved_by_sellsi');
  }, [financings]);

  // Contadores para filtros de solicitudes
  const filterCounts = useMemo(() => {
    const counts = {
      [FILTER_CATEGORIES.ALL]: financings.length,
      [FILTER_CATEGORIES.IN_PROCESS]: 0,
      [FILTER_CATEGORIES.REJECTED]: 0,
      [FILTER_CATEGORIES.CANCELLED]: 0,
      [FILTER_CATEGORIES.FINALIZED]: 0,
    };

    financings.forEach(f => {
      Object.keys(counts).forEach(category => {
        if (category !== FILTER_CATEGORIES.ALL && stateMatchesFilter(f.status, category)) {
          counts[category]++;
        }
      });
    });

    return counts;
  }, [financings]);

  const filterOptions = [
    { value: FILTER_CATEGORIES.ALL, label: 'Todos', count: filterCounts[FILTER_CATEGORIES.ALL] },
    { value: FILTER_CATEGORIES.IN_PROCESS, label: 'En Proceso', count: filterCounts[FILTER_CATEGORIES.IN_PROCESS] },
    { value: FILTER_CATEGORIES.REJECTED, label: 'Rechazados', count: filterCounts[FILTER_CATEGORIES.REJECTED] },
    { value: FILTER_CATEGORIES.CANCELLED, label: 'Cancelados', count: filterCounts[FILTER_CATEGORIES.CANCELLED] },
    { value: FILTER_CATEGORIES.FINALIZED, label: 'Finalizados', count: filterCounts[FILTER_CATEGORIES.FINALIZED] },
  ];

  // Contadores para vista de aprobados
  const approvedFilterCounts = useMemo(() => ({
    all: approvedFinancings.length,
  }), [approvedFinancings]);

  // Handlers de modales
  const openModal = (mode, financing) => {
    setModalState({ open: true, mode, financing });
  };

  const closeModal = () => {
    setModalState({ open: false, mode: null, financing: null });
  };

  // Handlers de acciones
  const handleApprove = async (financing) => {
    try {
      await onApprove?.(financing.id);
      closeModal();
      showBanner({
        message: `✅ Solicitud de ${financing.requested_by} aprobada correctamente.`,
        severity: 'success',
        duration: 4000,
      });
    } catch (error) {
      showBanner({
        message: 'Error al aprobar la solicitud',
        severity: 'error',
        duration: 4000,
      });
    }
  };

  const handleReject = async (financing) => {
    try {
      await onReject?.(financing.id);
      closeModal();
      showBanner({
        message: `❌ Solicitud de ${financing.requested_by} rechazada.`,
        severity: 'error',
        duration: 4000,
      });
    } catch (error) {
      showBanner({
        message: 'Error al rechazar la solicitud',
        severity: 'error',
        duration: 4000,
      });
    }
  };

  const handleSign = async (financing) => {
    try {
      await onSign?.(financing.id);
      closeModal();
      showBanner({
        message: `✍️ Documento de ${financing.requested_by} firmado correctamente.`,
        severity: 'success',
        duration: 4000,
      });
    } catch (error) {
      showBanner({
        message: 'Error al firmar el documento',
        severity: 'error',
        duration: 4000,
      });
    }
  };

  const handleCancel = async (financing) => {
    try {
      await onCancel?.(financing.id);
      closeModal();
      showBanner({
        message: `❌ Operación de ${financing.requested_by} cancelada.`,
        severity: 'warning',
        duration: 4000,
      });
    } catch (error) {
      showBanner({
        message: 'Error al cancelar la operación',
        severity: 'error',
        duration: 4000,
      });
    }
  };

  const handleViewReason = (financing) => {
    setReasonModal({ open: true, financing });
  };

  const closeReasonModal = () => {
    setReasonModal({ open: false, financing: null });
  };

  const handleDownload = (financing) => {
    // TODO: Implementar descarga de documentos
    showBanner({
      message: 'Descargando documentos...',
      severity: 'info',
      duration: 2000,
    });
    console.log('Downloading documents for:', financing.id);
  };

  // Estado vacío global
  const EmptyStateGlobal = () => (
    <Paper sx={{ p: { xs: 3, md: 4 }, textAlign: 'center' }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <AccountBalanceIcon sx={{ fontSize: 48, color: 'primary.main' }} />
      </Box>
      <Typography variant="h6" color="text.secondary" sx={{ fontSize: { md: '1.5rem' } }}>
        Aún no has recibido solicitudes de financiamiento
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2, fontSize: { md: '1.05rem' } }}>
        Aquí verás las solicitudes de financiamiento de tus compradores.
        Podrás revisarlas, aprobarlas o rechazarlas.
      </Typography>
    </Paper>
  );

  // Estado vacío por filtro
  const EmptyStateFiltered = () => (
    <Paper sx={{ p: { xs: 3, md: 4 }, textAlign: 'center' }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <AccountBalanceIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
      </Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
        No hay solicitudes con este estado
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Intenta seleccionar otro filtro o cambia a "Todos" para ver el listado completo.
      </Typography>
    </Paper>
  );

  // Estado vacío para aprobados
  const EmptyStateApproved = () => (
    <Paper sx={{ p: { xs: 3, md: 4 }, textAlign: 'center' }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <AccountBalanceIcon sx={{ fontSize: 48, color: 'success.main' }} />
      </Box>
      <Typography variant="h6" color="text.secondary" sx={{ fontSize: { md: '1.5rem' } }}>
        No tienes financiamientos aprobados aún
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2, fontSize: { md: '1.05rem' } }}>
        Aquí verás los financiamientos que han sido aprobados por Sellsi.
      </Typography>
    </Paper>
  );

  // Estado vacío por filtro (aprobados)
  const EmptyStateApprovedFiltered = () => (
    <Paper sx={{ p: { xs: 3, md: 4 }, textAlign: 'center' }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <AccountBalanceIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
      </Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
        No hay financiamientos con este estado
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Intenta seleccionar otro filtro o cambia a "Todos" para ver el listado completo.
      </Typography>
    </Paper>
  );

  // Loading state
  if ((initializing || loading) && (!financings || financings.length === 0)) {
    return <TableSkeleton rows={5} columns={7} variant="table" />;
  }

  // Mobile View
  if (isMobile) {
    return (
      <>
        {/* Tabs Mobile */}
        <Paper sx={{ mb: 2, width: 'fit-content', mx: 'auto' }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': {
                fontSize: '0.875rem',
                fontWeight: 600,
                textTransform: 'none',
                color: 'text.primary',
                '&.Mui-selected': {
                  backgroundColor: '#2E52B2',
                  color: 'white',
                },
              },
            }}
          >
            <Tab label="Solicitudes de financiamiento" />
            <Tab label="Financiamientos aprobados" />
          </Tabs>
        </Paper>

        {/* Contenido según tab activo */}
        {activeTab === 0 ? (
          <>
            <MobileFilterAccordion
              currentFilter={statusFilter}
              onFilterChange={setStatusFilter}
              filterOptions={filterOptions}
              label="Estado"
            />

            <Box sx={{ px: { xs: 2, sm: 0 } }}>
              {filteredPending.length === 0 ? (
                financings.length === 0 ? (
                  <EmptyStateGlobal />
                ) : (
                  <EmptyStateFiltered />
                )
              ) : (
                filteredPending.map(financing => (
                  <MobileFinancingCard
                    key={financing.id}
                    financing={financing}
                    onApprove={(f) => openModal('approve', f)}
                    onReject={(f) => openModal('reject', f)}
                    onSign={(f) => openModal('sign', f)}
                    onCancel={(f) => openModal('cancel', f)}
                    onViewReason={handleViewReason}
                    onDownload={handleDownload}
                  />
                ))
              )}
            </Box>
          </>
        ) : (
          <Box sx={{ px: { xs: 2, sm: 0 } }}>
            {approvedFinancings.length === 0 ? (
              <EmptyStateApproved />
            ) : (
              approvedFinancings.map(financing => (
                <MobileFinancingCard
                  key={financing.id}
                  financing={financing}
                  onViewReason={handleViewReason}
                  onDownload={handleDownload}
                />
              ))
            )}
          </Box>
        )}

        <SupplierFinancingActionModals
          open={modalState.open}
          mode={modalState.mode}
          financing={modalState.financing}
          onClose={closeModal}
          onApprove={handleApprove}
          onReject={handleReject}
          onSign={handleSign}
          onCancel={handleCancel}
        />

        {/* Modal de Ver Motivo */}
        <ViewReasonModal
          open={reasonModal.open}
          financing={reasonModal.financing}
          onClose={closeReasonModal}
        />
      </>
    );
  }

  // Desktop View
  return (
    <>
      {/* Tabs Desktop */}
      <Paper sx={{ mb: 3, width: 'fit-content' }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              minHeight: 56,
              color: 'text.primary',
              '&.Mui-selected': {
                backgroundColor: '#2E52B2',
                color: 'white',
              },
            },
          }}
        >
          <Tab label="Solicitudes de financiamiento" />
          <Tab label="Financiamientos aprobados" />
        </Tabs>
      </Paper>

      {/* Contenido según tab activo */}
      {activeTab === 0 ? (
        <>
          {/* Filtro Desktop - Solicitudes */}
          <Box sx={{ display: 'flex', gap: 2, p: 2, alignItems: 'center' }}>
            <Typography fontWeight={600}>Filtrar por categoría:</Typography>
            <FormControl size="small" sx={{ minWidth: 280 }}>
              <InputLabel id="supplier-financing-filter-label">Categoría</InputLabel>
              <Select
                labelId="supplier-financing-filter-label"
                value={statusFilter}
                label="Categoría"
                onChange={(e) => setStatusFilter(e.target.value)}
                MenuProps={{ disableScrollLock: true }}
              >
                {filterOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label} ({option.count})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Contenido - Solicitudes */}
          {filteredPending.length === 0 ? (
            financings.length === 0 ? (
              <EmptyStateGlobal />
            ) : (
              <EmptyStateFiltered />
            )
          ) : (
            <SupplierFinancingTable
              financings={filteredPending}
              onApprove={(f) => openModal('approve', f)}
              onReject={(f) => openModal('reject', f)}
              onSign={(f) => openModal('sign', f)}
              onCancel={(f) => openModal('cancel', f)}
              onViewReason={handleViewReason}
              onDownload={handleDownload}
            />
          )}
        </>
      ) : (
        <>
          {/* Contenido - Aprobados */}
          {approvedFinancings.length === 0 ? (
            <EmptyStateApproved />
          ) : (
            <SupplierApprovedTable
              financings={approvedFinancings}
            />
          )}
        </>
      )}

      {/* Modales */}
      <SupplierFinancingActionModals
        open={modalState.open}
        mode={modalState.mode}
        financing={modalState.financing}
        onClose={closeModal}
        onApprove={handleApprove}
        onReject={handleReject}
        onSign={handleSign}
        onCancel={handleCancel}
      />

      {/* Modal de Ver Motivo */}
      <ViewReasonModal
        open={reasonModal.open}
        financing={reasonModal.financing}
        onClose={closeReasonModal}
      />
    </>
  );
};

export default SupplierFinancingsList;
