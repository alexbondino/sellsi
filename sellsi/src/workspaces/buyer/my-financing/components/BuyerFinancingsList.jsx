/**
 * ============================================================================
 * BUYER FINANCINGS LIST COMPONENT
 * ============================================================================
 * 
 * Componente contenedor que gestiona la lista de financiamientos para compradores.
 * Incluye filtros, estados vacíos y manejo de acciones.
 * Soporta vista desktop (tabla) y mobile (cards).
 * 
 * Reutiliza componentes compartidos de shared/components/financing/
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Stack,
  Typography,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import DrawIcon from '@mui/icons-material/Draw';
import PaymentIcon from '@mui/icons-material/Payment';
import HistoryIcon from '@mui/icons-material/History';
import DownloadablesModal from '../../../../shared/components/financing/DownloadablesModal';
import { useBanner } from '../../../../shared/components/display/banners/BannerContext';
import TableSkeleton from '../../../../shared/components/display/skeletons/TableSkeleton';
import BuyerFinancingTable from './BuyerFinancingTable';
import ViewReasonModal from '../../../../shared/components/financing/ViewReasonModal';
import PaymentHistoryModal from '../../../../shared/components/financing/PaymentHistoryModal';
import BuyerFinancingActionModals from './BuyerFinancingActionModals';
import FinancingTabs from '../../../../shared/components/financing/FinancingTabs';
import HowItWorksModal from '../../../../shared/components/modals/HowItWorksModal';
import { BUYER_FINANCING_STEPS } from '../../../../shared/components/modals/howItWorksSteps';
import FinancingFilters from '../../../../shared/components/financing/FinancingFilters';
import { 
  EmptyStateGlobal, 
  EmptyStateFiltered, 
  EmptyStateApproved 
} from '../../../../shared/components/financing/FinancingEmptyStates';
import { 
  FILTER_CATEGORIES, 
  APPROVED_FILTER_CATEGORIES,
  stateMatchesFilter, 
  approvedFinancingMatchesFilter,
  getAvailableActions,
  getStateConfig,
  getApprovedFinancingChip,
  FINANCING_STATES,
} from '../../../../shared/utils/financing/financingStates';
import { formatPrice } from '../../../../shared/utils/formatters/priceFormatters';
import { getBuyerCardFields } from './BuyerFinancingColumns';
import { getFinancingDaysStatus } from '../../../../shared/utils/financingDaysLogic';
import FinancingIdCell from '../../../../shared/components/financing/FinancingIdCell';
import FinancingAmountsCell from '../../../../shared/components/financing/FinancingAmountsCell';
import FinancingDatesCell from '../../../../shared/components/financing/FinancingDatesCell';
import { canPayOnlineFinancing } from '../../../../shared/utils/financing/paymentAmounts';

/**
 * Componente de tarjeta mobile para financiamientos (Buyer)
 */
const MobileFinancingCard = ({ financing, onViewReason, onCancel, onSign, onDownload, onPayOnline, onViewPaymentHistory, isApproved }) => {
  const statusInfo = getStateConfig(financing.status, 'buyer');
  const availableActions = getAvailableActions(financing.status, 'buyer');
  const cardFields = getBuyerCardFields();

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
        {/* Header: ID */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="caption" color="text.secondary">ID Financiamiento</Typography>
          <FinancingIdCell financingId={financing.id} />
        </Box>

        {/* Header: Proveedor y Estado (50/50) */}
        <Box sx={{ display: 'flex', mb: 2 }}>
          <Box sx={{ width: '50%', pr: 1, overflow: 'hidden' }}>
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
              {financing.supplier_name}
            </Typography>
          </Box>

          <Box sx={{ width: '50%', pl: 1, textAlign: 'right' }}>
            {isApproved ? (
              <>
                <Chip
                  label={getApprovedFinancingChip(financing).label}
                  color={getApprovedFinancingChip(financing).color}
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
                {financing.paused && (
                  <Box sx={{ mt: 0.5 }}>
                    <Typography
                      variant="body2"
                      color="primary"
                      sx={{ fontSize: '0.8rem', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                      onClick={() => onViewReason?.(financing)}
                    >
                      Ver motivo
                    </Typography>
                  </Box>
                )}
              </>
            ) : (
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
                }}
              >
                {financing.status === FINANCING_STATES.PENDING_SELLSI_APPROVAL ? 'Firmado, esperando aprobacion de Sellsi' : statusInfo.label}
              </Typography>
            )}
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
            cardFields.map(field => (
              <Box key={field.key} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">{field.label}:</Typography>
                <Typography 
                  variant="body2" 
                  fontWeight={field.fontWeight || 400}
                  color={field.fontWeight ? 'text.primary' : 'inherit'}
                >
                  {field.render(financing)}
                </Typography>
              </Box>
            ))
          )}
        </Stack>

        {/* Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1, borderTop: 1, borderColor: 'divider' }}>
          <Tooltip title={(() => {
            const isExpressPreSignature = financing.request_type === 'express' && 
              !['supplier_signature_pending', 'pending_sellsi_approval', 'approved_by_sellsi', 'rejected_by_sellsi', 'expired', 'paid'].includes(financing.status);
            return isExpressPreSignature ? "Disponible cuando el proveedor firme" : "Descargar documentos";
          })()}>
            <span>
              <IconButton 
                size="small" 
                color="primary" 
                onClick={() => onDownload?.(financing)}
                disabled={financing.request_type === 'express' && !['supplier_signature_pending', 'pending_sellsi_approval', 'approved_by_sellsi', 'rejected_by_sellsi', 'expired', 'paid'].includes(financing.status)}
              >
                <DownloadIcon />
              </IconButton>
            </span>
          </Tooltip>

          <Box sx={{ display: 'flex', gap: 1 }}>
            {isApproved ? (
              <>
                <Tooltip title={financing.paused ? 'Financiamiento pausado' : 'Pagar en línea'}>
                  <span>
                    <IconButton 
                      size="small" 
                      color="primary" 
                      onClick={() => onPayOnline?.(financing)}
                      disabled={financing.payment_status === 'paid' || !canPayOnlineFinancing(financing)}
                      sx={{ '&:hover': { backgroundColor: 'primary.light', color: 'white' } }}
                    >
                      <PaymentIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Ver historial de pagos">
                  <IconButton 
                    size="small" 
                    color="info" 
                    onClick={() => onViewPaymentHistory?.(financing)}
                    sx={{ '&:hover': { backgroundColor: 'info.light', color: 'white' } }}
                  >
                    <HistoryIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            ) : (
              <>
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
              </>
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
const BuyerFinancingsList = ({
  financings = [],
  loading,
  initializing,
  onCancel,
  onSign,
  onPayOnline,
  initialTab = 0, // Prop para controlar la pestaña inicial
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { showBanner } = useBanner();
  const navigate = useNavigate();

  // Estado para modal "Cómo Funciona"
  const [howOpen, setHowOpen] = useState(false);
  
  console.log('🎨 BuyerFinancingsList RENDER - howOpen:', howOpen);
  
  const openHowModal = () => {
    console.log('🔥 openHowModal called - Setting howOpen to true');
    setHowOpen(true);
  };
  const closeHowModal = () => {
    console.log('🔥 closeHowModal called - Setting howOpen to false');
    setHowOpen(false);
  };

  // Estado de pestañas - usar initialTab como valor inicial
  const [activeTab, setActiveTab] = useState(initialTab);

  // Estado de filtros (independientes por pestaña)
  const [statusFilter, setStatusFilter] = useState('all');
  const [approvedFilter, setApprovedFilter] = useState('all'); // Filtro para financiamientos aprobados

  // Estado de modal de ver motivo
  const [reasonModal, setReasonModal] = useState({
    open: false,
    financing: null,
  });

  // Estado de modales de acción
  const [actionModal, setActionModal] = useState({
    open: false,
    mode: null, // 'sign' | 'cancel' | 'payOnline'
    financing: null,
  });

  // Estado de modal de descargables
  const [downloadablesModal, setDownloadablesModal] = useState({
    open: false,
    financing: null,
  });

  // Estado de modal de historial de pagos
  const [paymentHistoryModal, setPaymentHistoryModal] = useState({
    open: false,
    financing: null,
  });

  // Filtrar financiamientos por categoría (Solicitudes)
  const filteredPending = useMemo(() => {
    const pending = financings.filter(f => 
      f.status !== 'approved_by_sellsi' && 
      f.status !== 'expired' && 
      f.status !== 'paid'
    );
    
    if (statusFilter === FILTER_CATEGORIES.ALL) return pending;
    return pending.filter(f => stateMatchesFilter(f.status, statusFilter));
  }, [financings, statusFilter]);

  // Filtrar financiamientos aprobados (solo para tab 2)
  const approvedFinancings = useMemo(() => {
    const approved = financings.filter(f => 
      f.status === 'approved_by_sellsi' || 
      f.status === 'expired' || 
      f.status === 'paid'
    );
    
    // Aplicar filtro específico de aprobados
    if (approvedFilter === APPROVED_FILTER_CATEGORIES.ALL) return approved;
    
    return approved.filter(f => approvedFinancingMatchesFilter(f, approvedFilter));
  }, [financings, approvedFilter]);

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
    const allApproved = financings.filter(f => 
      f.status === 'approved_by_sellsi' || 
      f.status === 'expired' || 
      f.status === 'paid'
    );
    
    const counts = {
      [APPROVED_FILTER_CATEGORIES.ALL]: allApproved.length,
      [APPROVED_FILTER_CATEGORIES.ACTIVE]: 0,
      [APPROVED_FILTER_CATEGORIES.EXPIRED]: 0,
      [APPROVED_FILTER_CATEGORIES.PAID]: 0,
    };

    allApproved.forEach(f => {
      if (approvedFinancingMatchesFilter(f, APPROVED_FILTER_CATEGORIES.ACTIVE)) {
        counts[APPROVED_FILTER_CATEGORIES.ACTIVE]++;
      }
      if (approvedFinancingMatchesFilter(f, APPROVED_FILTER_CATEGORIES.EXPIRED)) {
        counts[APPROVED_FILTER_CATEGORIES.EXPIRED]++;
      }
      if (approvedFinancingMatchesFilter(f, APPROVED_FILTER_CATEGORIES.PAID)) {
        counts[APPROVED_FILTER_CATEGORIES.PAID]++;
      }
    });

    return counts;
  }, [financings]);

  const approvedFilterOptions = [
    { value: APPROVED_FILTER_CATEGORIES.ALL, label: 'Todos', count: approvedFilterCounts[APPROVED_FILTER_CATEGORIES.ALL] },
    { value: APPROVED_FILTER_CATEGORIES.ACTIVE, label: 'Vigentes', count: approvedFilterCounts[APPROVED_FILTER_CATEGORIES.ACTIVE] },
    { value: APPROVED_FILTER_CATEGORIES.EXPIRED, label: 'Vencidos', count: approvedFilterCounts[APPROVED_FILTER_CATEGORIES.EXPIRED] },
    { value: APPROVED_FILTER_CATEGORIES.PAID, label: 'Pagados', count: approvedFilterCounts[APPROVED_FILTER_CATEGORIES.PAID] },
  ];

  // Handlers de acciones
  const handleSignClick = (financing) => {
    setActionModal({ open: true, mode: 'sign', financing });
  };

  const handleCancelClick = (financing) => {
    setActionModal({ open: true, mode: 'cancel', financing });
  };

  const handleSignConfirm = async (financing, signedFile) => {
    try {
      await onSign?.(financing.id, signedFile);
      setActionModal(prev => ({ ...prev, open: false }));
      showBanner({
        message: `✍️ Documento firmado correctamente.`,
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

  const handleCancelConfirm = async (financing, reason) => {
    try {
      await onCancel?.(financing.id, reason);
      setActionModal(prev => ({ ...prev, open: false }));
      showBanner({
        message: `❌ Solicitud cancelada correctamente.`,
        severity: 'warning',
        duration: 4000,
      });
    } catch (error) {
      showBanner({
        message: 'Error al cancelar la solicitud',
        severity: 'error',
        duration: 4000,
      });
    }
  };

  const handlePayOnlineConfirm = async (financing, amountToPay) => {
    try {
      setActionModal(prev => ({ ...prev, open: false }));
      // Navegar a paymentmethod con financing ID como query parameter
      navigate(`/buyer/paymentmethod?financing=${financing.id}&amount=${amountToPay}`);
      showBanner({
        message: '💳 Redirigiendo al checkout...',
        severity: 'info',
        duration: 3000,
      });
    } catch (error) {
      showBanner({
        message: 'Error al procesar el pago',
        severity: 'error',
        duration: 4000,
      });
    }
  };

  const handleViewReason = useCallback((financing) => {
    setReasonModal({ open: true, financing });
  }, []);

  const closeReasonModal = useCallback(() => {
    setReasonModal(prev => ({ ...prev, open: false }));
  }, []);

  const handleReasonModalExited = useCallback(() => {
    setReasonModal({ open: false, financing: null });
  }, []);

  const closeActionModal = () => {
    setActionModal(prev => ({ ...prev, open: false }));
  };

  const handleActionModalExited = useCallback(() => {
    setActionModal({ open: false, mode: null, financing: null });
  }, []);

  const handleDownload = useCallback((financing) => {
    console.log('🔽 Abriendo modal de descargables para:', financing);
    setDownloadablesModal({ open: true, financing });
  }, []);

  const closeDownloadablesModal = useCallback(() => {
    setDownloadablesModal(prev => ({ ...prev, open: false }));
  }, []);

  const handleDownloadablesModalExited = useCallback(() => {
    setDownloadablesModal({ open: false, financing: null });
  }, []);

  const handlePayOnline = (financing) => {
    console.log('💳 Abrir modal de pago en línea:', financing);
    setActionModal({ open: true, mode: 'payOnline', financing });
  };

  const handleViewPaymentHistory = useCallback((financing) => {
    console.log('📜 Abrir historial de pagos:', financing);
    setPaymentHistoryModal({ open: true, financing });
  }, []);

  const closePaymentHistoryModal = useCallback(() => {
    setPaymentHistoryModal(prev => ({ ...prev, open: false }));
  }, []);

  const handlePaymentHistoryModalExited = useCallback(() => {
    setPaymentHistoryModal({ open: false, financing: null });
  }, []);

  // Loading state
  if ((initializing || loading) && (!financings || financings.length === 0)) {
    return <TableSkeleton rows={5} columns={6} variant="table" />;
  }

  // Mobile View
  if (isMobile) {
    return (
      <>
        <FinancingTabs activeTab={activeTab} onTabChange={setActiveTab} isMobile={true} onHowItWorks={openHowModal} />

        {/* Contenido según tab activo */}
        {activeTab === 0 ? (
          <>
            <FinancingFilters
              currentFilter={statusFilter}
              onFilterChange={setStatusFilter}
              filterOptions={filterOptions}
              isMobile={true}
            />

            <Box sx={{ px: { xs: 2, sm: 0 } }}>
              {filteredPending.length === 0 ? (
                financings.length === 0 ? (
                  <EmptyStateGlobal role="buyer" />
                ) : (
                  <EmptyStateFiltered />
                )
              ) : (
                filteredPending.map(financing => (
                  <MobileFinancingCard
                    key={financing.id}
                    financing={financing}
                    onCancel={handleCancelClick}
                    onSign={handleSignClick}
                    onViewReason={handleViewReason}
                    onDownload={handleDownload}
                  />
                ))
              )}
            </Box>
          </>
        ) : (
          <>
            <FinancingFilters
              currentFilter={approvedFilter}
              onFilterChange={setApprovedFilter}
              filterOptions={approvedFilterOptions}
              isMobile={true}
            />

            <Box sx={{ px: { xs: 2, sm: 0 } }}>
              {approvedFinancings.length === 0 ? (
                <EmptyStateFiltered />
              ) : (
                approvedFinancings.map(financing => (
                  <MobileFinancingCard
                    key={financing.id}
                    financing={financing}
                    onSign={handleSignClick}
                    onViewReason={handleViewReason}
                    onDownload={handleDownload}
                    onPayOnline={handlePayOnline}
                    onViewPaymentHistory={handleViewPaymentHistory}
                    isApproved={true}
                  />
                ))
              )}
            </Box>
          </>
        )}

        {/* Modal de Ver Motivo */}
        <ViewReasonModal
          open={reasonModal.open}
          financing={reasonModal.financing}
          onClose={closeReasonModal}
          onExited={handleReasonModalExited}
        />

        {/* Modal 'Cómo Funciona' */}
        {console.log('🔍 About to render HowItWorksModal (MOBILE):', { howOpen, steps: BUYER_FINANCING_STEPS })}
        <HowItWorksModal 
          open={howOpen} 
          onClose={closeHowModal} 
          steps={BUYER_FINANCING_STEPS}
        />

        {/* Modales de Acción */}
        <BuyerFinancingActionModals
          open={actionModal.open}
          mode={actionModal.mode}
          financing={actionModal.financing}
          onClose={closeActionModal}
          onExited={handleActionModalExited}
          onSign={handleSignConfirm}
          onCancel={handleCancelConfirm}
          onPayOnline={handlePayOnlineConfirm}
        />

        {/* Modal de descargables */}
        <DownloadablesModal
          open={downloadablesModal.open}
          onClose={closeDownloadablesModal}
          financing={downloadablesModal.financing}
          onExited={handleDownloadablesModalExited}
        />
      </>
    );
  }

  // Desktop View
  return (
    <>
      <FinancingTabs activeTab={activeTab} onTabChange={setActiveTab} isMobile={false} onHowItWorks={openHowModal} />

      {/* Contenido según tab activo */}
      {activeTab === 0 ? (
        <>
          <FinancingFilters
            currentFilter={statusFilter}
            onFilterChange={setStatusFilter}
            filterOptions={filterOptions}
            isMobile={false}
          />

          {/* Contenido - Solicitudes */}
          {filteredPending.length === 0 ? (
            financings.length === 0 ? (
              <EmptyStateGlobal role="buyer" />
            ) : (
              <EmptyStateFiltered />
            )
          ) : (
            <BuyerFinancingTable
              financings={filteredPending}
              onCancel={handleCancelClick}
              onSign={handleSignClick}
              onViewReason={handleViewReason}
              onDownload={handleDownload}
            />
          )}
        </>
      ) : (
        <>
          {/* Contenido - Aprobados */}
          <FinancingFilters
            currentFilter={approvedFilter}
            onFilterChange={setApprovedFilter}
            filterOptions={approvedFilterOptions}
            isMobile={false}
          />
          {approvedFinancings.length === 0 ? (
            approvedFilter === 'all' ? (
              <EmptyStateApproved />
            ) : (
              <EmptyStateFiltered />
            )
          ) : (
            <BuyerFinancingTable
              financings={approvedFinancings}
              onPayOnline={handlePayOnline}
              isApproved={true}
              onViewReason={handleViewReason}
              onViewPaymentHistory={handleViewPaymentHistory}
            />
          )}
        </>
      )}

      {/* Modal de Ver Motivo */}
      <ViewReasonModal
        open={reasonModal.open}
        financing={reasonModal.financing}
        onClose={closeReasonModal}
        onExited={handleReasonModalExited}
      />

      {/* Modal de Historial de Pagos */}
      <PaymentHistoryModal
        open={paymentHistoryModal.open}
        financing={paymentHistoryModal.financing}
        onClose={closePaymentHistoryModal}
        onExited={handlePaymentHistoryModalExited}
      />

      {/* Modal 'Cómo Funciona' */}
      {console.log('🔍 About to render HowItWorksModal:', { howOpen, steps: BUYER_FINANCING_STEPS })}
      <HowItWorksModal 
        open={howOpen} 
        onClose={closeHowModal} 
        steps={BUYER_FINANCING_STEPS}
      />
      
      {howOpen && console.log('🎯 HowItWorksModal should be visible - howOpen:', howOpen)}

      {/* Modales de Acción */}
      <BuyerFinancingActionModals
        open={actionModal.open}
        mode={actionModal.mode}
        financing={actionModal.financing}
        onClose={closeActionModal}
        onExited={handleActionModalExited}
        onSign={handleSignConfirm}
        onCancel={handleCancelConfirm}
        onPayOnline={handlePayOnlineConfirm}
      />

      {/* Modal de descargables */}
      <DownloadablesModal
        open={downloadablesModal.open}
        onClose={closeDownloadablesModal}
        financing={downloadablesModal.financing}
        onExited={handleDownloadablesModalExited}
      />
    </>
  );
};

export default BuyerFinancingsList;
