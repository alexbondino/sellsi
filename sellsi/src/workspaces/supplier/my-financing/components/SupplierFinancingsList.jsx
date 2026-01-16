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
import DownloadablesModal from '../../../../shared/components/financing/DownloadablesModal';
import FinancingTabs from '../../../../shared/components/financing/FinancingTabs';
import HowItWorksModal from '../../../../shared/components/modals/HowItWorksModal';
import { SUPPLIER_FINANCING_STEPS } from '../../../../shared/components/modals/howItWorksSteps';
import { useBanner } from '../../../../shared/components/display/banners/BannerContext';
import TableSkeleton from '../../../../shared/components/display/skeletons/TableSkeleton';
import MobileFilterAccordion from '../../../../shared/components/mobile/MobileFilterAccordion';
import InfoPopover from '../../../../shared/components/display/InfoPopover';
import SupplierFinancingTable, { SupplierApprovedTable } from './SupplierFinancingTable';
import SupplierFinancingActionModals from './SupplierFinancingActionModals';
import ViewReasonModal from '../../../../shared/components/financing/ViewReasonModal';
import Modal from '../../../../shared/components/feedback/Modal/Modal';
import { MODAL_TYPES } from '../../../../shared/components/feedback/Modal/modalConfig';
import { LegalRepValidationModal, useLegalRepModal } from '../../../../shared/components/validation';
import { STATUS_MAP } from '../hooks/useSupplierFinancings';
import { 
  FILTER_CATEGORIES, 
  APPROVED_FILTER_CATEGORIES,
  stateMatchesFilter,
  approvedFinancingMatchesFilter,
  getAvailableActions,
  getStateConfig,
  getStateFilterCategory,
  getApprovedFinancingChip,
} from '../../../../shared/utils/financing/financingStates';
import { formatPrice } from '../../../../shared/utils/formatters/priceFormatters';
import FinancingIdCell from '../../../../shared/components/financing/FinancingIdCell';
import FinancingAmountsCell from '../../../../shared/components/financing/FinancingAmountsCell';
import FinancingDatesCell from '../../../../shared/components/financing/FinancingDatesCell';

/**
 * Componente de tarjeta mobile para financiamientos
 */
const MobileFinancingCard = ({ financing, onApprove, onReject, onSign, onCancel, onViewReason, onDownload, isApproved }) => {
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

  // Preparar campos para InfoPopover
  const buyerInfoFields = [
    { label: 'Razón Social', value: financing.buyer_legal_name },
    { label: 'RUT Empresa', value: financing.buyer_legal_rut },
    { label: 'Representante Legal', value: financing.buyer_legal_representative_name },
    { label: 'RUT Representante', value: financing.buyer_legal_representative_rut },
    { label: 'Dirección', value: financing.buyer_legal_address },
    { label: 'Comuna', value: financing.buyer_legal_commune },
    { label: 'Región', value: financing.buyer_legal_region },
  ];

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        {/* Header: ID */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="caption" color="text.secondary">ID Financiamiento</Typography>
          <FinancingIdCell financingId={financing.id} />
        </Box>

        {/* Header: Solicitante y Estado (50/50) */}
        <Box sx={{ display: 'flex', mb: 2 }}>
          <Box sx={{ width: '50%', pr: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <InfoPopover
              label={
                <Typography
                  variant="subtitle1"
                  fontWeight={600}
                  sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {financing.buyer_user_nm || financing.buyer_legal_name || 'Comprador'}
                </Typography>
              }
              linkText="Ver detalle"
              title="Información de la Empresa"
              fields={buyerInfoFields}
              popoverWidth={360}
            />
          </Box>

          <Box sx={{ width: '50%', pl: 1, textAlign: 'right' }}>
            <Typography
              variant="body2"
              fontWeight={600}
              sx={{
                color: colorMap[statusInfo.color] || 'text.secondary',
                whiteSpace: 'pre-line',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textAlign: 'right',
              }}
            >
              {statusInfo.label}
            </Typography>
          </Box>
        </Box>

        {/* Info Grid */}
        <Stack spacing={1} sx={{ mb: 2 }}>
          {isApproved ? (
            /* Para financiamientos aprobados: mostrar fechas + barra de montos + plazo + vigencia */
            <>
              {/* Fecha */}
              <Box sx={{ pb: 1, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Fecha:</Typography>
                <FinancingDatesCell financing={financing} />
              </Box>
              
              {/* Montos */}
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Montos:</Typography>
                <FinancingAmountsCell financing={financing} />
              </Box>
              
              {/* Plazo y Días de Vigencia en una fila */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: 1, borderColor: 'divider' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Plazo Otorgado</Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.875rem' }}>
                    {financing.term_days} días
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Vigencia</Typography>
                  {(() => {
                    const amountUsed = Number(financing.amount_used || 0);
                    const amountPaid = Number(financing.amount_paid || 0);
                    
                    if (amountPaid >= amountUsed && amountUsed > 0) {
                      return (
                        <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                          0 días
                        </Typography>
                      );
                    }
                    
                    if (!financing.expires_at) {
                      return <Typography variant="body2">-</Typography>;
                    }
                    
                    const expiryDate = new Date(financing.expires_at);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    expiryDate.setHours(0, 0, 0, 0);
                    
                    const diffTime = expiryDate - today;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    let color = 'success.main';
                    if (diffDays < 0) {
                      color = 'error.main';
                    } else if (diffDays <= 7) {
                      color = 'error.main';
                    } else if (diffDays <= 15) {
                      color = 'warning.main';
                    }
                    
                    return (
                      <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.875rem', color }}>
                        {diffDays} días
                      </Typography>
                    );
                  })()}
                </Box>
              </Box>
            </>
          ) : (
            /* Para solicitudes: mostrar campos simples */
            <>
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
            </>
          )}
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

  // Estado para modal "Cómo Funciona"
  const [howOpen, setHowOpen] = useState(false);
  const openHowModal = () => setHowOpen(true);
  const closeHowModal = () => setHowOpen(false);

  // Hook de validación de representante legal
  const {
    isOpen: isLegalRepModalOpen,
    loading: isLoadingLegalRep,
    missingFieldLabels: legalRepMissingFields,
    checkAndProceed: checkLegalRepAndProceed,
    handleGoToBilling,
    handleClose: closeLegalRepModal,
  } = useLegalRepModal();

  // Estado de pestañas
  const [activeTab, setActiveTab] = useState(0); // 0: Solicitudes, 1: Aprobados

  // Estado de filtros (independientes por pestaña)
  const [statusFilter, setStatusFilter] = useState('all');
  const [approvedFilter, setApprovedFilter] = useState('all'); // Filtro para vista de aprobados

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

  // Estado de modal de descargables
  const [downloadablesModal, setDownloadablesModal] = useState({
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

  // Filtrar aprobados por estado (Vigente, Vencido, Pagado)
  const filteredApproved = useMemo(() => {
    if (approvedFilter === APPROVED_FILTER_CATEGORIES.ALL) return approvedFinancings;
    return approvedFinancings.filter(f => approvedFinancingMatchesFilter(f, approvedFilter));
  }, [approvedFinancings, approvedFilter]);

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

  // Contadores para filtros de aprobados
  const approvedFilterCounts = useMemo(() => {
    const counts = {
      [APPROVED_FILTER_CATEGORIES.ALL]: approvedFinancings.length,
      [APPROVED_FILTER_CATEGORIES.ACTIVE]: 0,
      [APPROVED_FILTER_CATEGORIES.EXPIRED]: 0,
      [APPROVED_FILTER_CATEGORIES.PAID]: 0,
    };

    approvedFinancings.forEach(f => {
      Object.keys(counts).forEach(category => {
        if (category !== APPROVED_FILTER_CATEGORIES.ALL && approvedFinancingMatchesFilter(f, category)) {
          counts[category]++;
        }
      });
    });

    return counts;
  }, [approvedFinancings]);

  const approvedFilterOptions = [
    { value: APPROVED_FILTER_CATEGORIES.ALL, label: 'Todos', count: approvedFilterCounts[APPROVED_FILTER_CATEGORIES.ALL] },
    { value: APPROVED_FILTER_CATEGORIES.ACTIVE, label: 'Vigentes', count: approvedFilterCounts[APPROVED_FILTER_CATEGORIES.ACTIVE] },
    { value: APPROVED_FILTER_CATEGORIES.EXPIRED, label: 'Vencidos', count: approvedFilterCounts[APPROVED_FILTER_CATEGORIES.EXPIRED] },
    { value: APPROVED_FILTER_CATEGORIES.PAID, label: 'Pagados', count: approvedFilterCounts[APPROVED_FILTER_CATEGORIES.PAID] },
  ];

  // Handlers de modales
  const openModal = (mode, financing) => {
    // Si es modo firma, validar representante legal primero
    if (mode === 'sign') {
      const canProceed = checkLegalRepAndProceed(() => {
        setModalState({ open: true, mode, financing });
      });
      // Si no puede proceder, checkLegalRepAndProceed ya abrió el modal de validación
      return;
    }
    
    // Para otros modos, abrir directamente
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
    console.log('🔽 Abriendo modal de descargables para:', financing);
    setDownloadablesModal({ open: true, financing });
  };

  const handleDownloadFile = useCallback((doc, financing) => {
    console.log('🔽 Descargando archivo:', doc.name, 'de:', financing);
    // TODO: Implementar descarga real desde Supabase Storage
    showBanner({
      message: `Descargando ${doc.name}...`,
      severity: 'info',
      duration: 3000,
    });
  }, [showBanner]);

  const closeDownloadablesModal = useCallback(() => {
    setDownloadablesModal({ open: false, financing: null });
  }, []);

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
          <>
            <MobileFilterAccordion
              currentFilter={approvedFilter}
              onFilterChange={setApprovedFilter}
              filterOptions={approvedFilterOptions}
              label="Estado"
            />

            <Box sx={{ px: { xs: 2, sm: 0 } }}>
              {approvedFinancings.length === 0 ? (
                <EmptyStateFiltered />
              ) : (
                approvedFinancings.map(financing => (
                  <MobileFinancingCard
                    key={financing.id}
                    financing={financing}
                    onViewReason={handleViewReason}
                    onDownload={handleDownload}
                    isApproved={true}
                  />
                ))
              )}
            </Box>
          </>
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
      <FinancingTabs activeTab={activeTab} onTabChange={setActiveTab} isMobile={false} onHowItWorks={openHowModal} />

      {/* Contenido según tab activo */}
      {activeTab === 0 ? (
        <>
          {/* Filtro Desktop - Solicitudes */}
          <Box sx={{ display: 'flex', gap: 2, p: 2, alignItems: 'center' }}>
            <Typography fontWeight={600}>Filtrar por estado:</Typography>
            <FormControl size="small" sx={{ minWidth: 280 }}>
              <InputLabel id="supplier-financing-filter-label">Estado</InputLabel>
              <Select
                labelId="supplier-financing-filter-label"
                value={statusFilter}
                label="Estado"
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
          {/* Filtro Desktop - Aprobados */}
          <Box sx={{ display: 'flex', gap: 2, p: 2, alignItems: 'center' }}>
            <Typography fontWeight={600}>Filtrar por estado:</Typography>
            <FormControl size="small" sx={{ minWidth: 280 }}>
              <InputLabel id="supplier-approved-filter-label">Estado</InputLabel>
              <Select
                labelId="supplier-approved-filter-label"
                value={approvedFilter}
                label="Estado"
                onChange={(e) => setApprovedFilter(e.target.value)}
                MenuProps={{ disableScrollLock: true }}
              >
                {approvedFilterOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label} ({option.count})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Contenido - Aprobados */}
          {filteredApproved.length === 0 ? (
            approvedFinancings.length === 0 ? (
              <EmptyStateApproved />
            ) : (
              <EmptyStateFiltered />
            )
          ) : (
            <SupplierApprovedTable
              financings={filteredApproved}
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

      {/* Modal 'Cómo Funciona' */}
      <HowItWorksModal 
        open={howOpen} 
        onClose={closeHowModal}
        steps={SUPPLIER_FINANCING_STEPS}
      />

      {/* Modal de Validación de Representante Legal */}
      <LegalRepValidationModal
        isOpen={isLegalRepModalOpen}
        onClose={closeLegalRepModal}
        onGoToBilling={handleGoToBilling}
        loading={isLoadingLegalRep}
        missingFieldLabels={legalRepMissingFields}
      />

      {/* Modal de descargables */}
      <DownloadablesModal
        open={downloadablesModal.open}
        onClose={closeDownloadablesModal}
        financing={downloadablesModal.financing}
        onDownloadFile={handleDownloadFile}
      />
    </>
  );
};

export default SupplierFinancingsList;
