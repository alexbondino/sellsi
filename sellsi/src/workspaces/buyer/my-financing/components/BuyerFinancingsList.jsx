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
import { useBanner } from '../../../../shared/components/display/banners/BannerContext';
import TableSkeleton from '../../../../shared/components/display/skeletons/TableSkeleton';
import BuyerFinancingTable from './BuyerFinancingTable';
import ViewReasonModal from '../../../../shared/components/financing/ViewReasonModal';
import BuyerFinancingActionModals from './BuyerFinancingActionModals';
import FinancingTabs from '../../../../shared/components/financing/FinancingTabs';
import FinancingFilters from '../../../../shared/components/financing/FinancingFilters';
import { 
  EmptyStateGlobal, 
  EmptyStateFiltered, 
  EmptyStateApproved 
} from '../../../../shared/components/financing/FinancingEmptyStates';
import { 
  FILTER_CATEGORIES, 
  stateMatchesFilter, 
  getAvailableActions,
  getStateConfig,
} from '../../../../shared/utils/financing/financingStates';
import { formatPrice } from '../../../../shared/utils/formatters/priceFormatters';
import { getBuyerCardFields } from './BuyerFinancingColumns';
import { getFinancingDaysStatus } from '../../../../shared/utils/financingDaysLogic';

/**
 * Componente de tarjeta mobile para financiamientos (Buyer)
 */
const MobileFinancingCard = ({ financing, onViewReason, onCancel, onSign, onDownload }) => {
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
        {/* Header: Proveedor y Estado */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            {financing.supplier_name}
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
          {cardFields.map(field => (
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
          ))}
        </Stack>

        {/* Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1, borderTop: 1, borderColor: 'divider' }}>
          <Tooltip title="Descargar documentos">
            <IconButton size="small" color="primary" onClick={() => onDownload?.(financing)}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>

          <Box sx={{ display: 'flex', gap: 1 }}>
            {availableActions.includes('sign') && (
              <Tooltip title="Firmar">
                <IconButton 
                  size="small" 
                  color="primary" 
                  onClick={() => handleSignClick(financing)}
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
                  onClick={() => handleCancelClick(financing)}
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
                  onClick={() => handleViewReason(financing)}
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
const BuyerFinancingsList = ({
  financings = [],
  loading,
  initializing,
  onCancel,
  onSign,
  onPayOnline,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { showBanner } = useBanner();

  // Estado de pestañas
  const [activeTab, setActiveTab] = useState(0); // 0: Solicitudes, 1: Aprobados

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
    mode: null, // 'sign' | 'cancel'
    financing: null,
  });

  // Filtrar financiamientos por categoría (Solicitudes)
  const filteredPending = useMemo(() => {
    if (statusFilter === FILTER_CATEGORIES.ALL) return financings;
    return financings.filter(f => stateMatchesFilter(f.status, statusFilter));
  }, [financings, statusFilter]);

  // Filtrar financiamientos aprobados (solo para tab 2)
  const approvedFinancings = useMemo(() => {
    const approved = financings.filter(f => f.status === 'approved_by_sellsi');
    
    // Aplicar filtro específico de aprobados
    if (approvedFilter === 'all') return approved;
    
    return approved.filter(f => {
      const { daysRemaining, status } = getFinancingDaysStatus(f.approved_at, f.term_days);
      
      switch (approvedFilter) {
        case 'pending':
          return f.payment_status === 'pending';
        case 'paid':
          return f.payment_status === 'paid';
        case 'expiring_soon':
          return status === 'warning'; // Naranja - prontos a vencer
        case 'expired':
          return status === 'error'; // Rojo - expirados (0 días)
        default:
          return true;
      }
    });
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
    const allApproved = financings.filter(f => f.status === 'approved_by_sellsi');
    
    const counts = {
      all: allApproved.length,
      pending: 0,
      paid: 0,
      expiring_soon: 0,
      expired: 0,
    };

    allApproved.forEach(f => {
      const { daysRemaining, status } = getFinancingDaysStatus(f.approved_at, f.term_days);
      
      if (f.payment_status === 'pending') counts.pending++;
      if (f.payment_status === 'paid') counts.paid++;
      if (status === 'warning') counts.expiring_soon++;
      if (status === 'error') counts.expired++;
    });

    return counts;
  }, [financings]);

  const approvedFilterOptions = [
    { value: 'all', label: 'Todos', count: approvedFilterCounts.all },
    { value: 'pending', label: 'Pendiente de Pago', count: approvedFilterCounts.pending },
    { value: 'paid', label: 'Pagado', count: approvedFilterCounts.paid },
    { value: 'expiring_soon', label: 'Prontos a vencer', count: approvedFilterCounts.expiring_soon },
    { value: 'expired', label: 'Expirados', count: approvedFilterCounts.expired },
  ];

  // Handlers de acciones
  const handleSignClick = (financing) => {
    setActionModal({ open: true, mode: 'sign', financing });
  };

  const handleCancelClick = (financing) => {
    setActionModal({ open: true, mode: 'cancel', financing });
  };

  const handleSignConfirm = async (financing) => {
    try {
      await onSign?.(financing.id);
      setActionModal({ open: false, mode: null, financing: null });
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
      setActionModal({ open: false, mode: null, financing: null });
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

  const handleViewReason = useCallback((financing) => {
    setReasonModal({ open: true, financing });
  }, []);

  const closeReasonModal = useCallback(() => {
    setReasonModal({ open: false, financing: null });
  }, []);

  const closeActionModal = () => {
    setActionModal({ open: false, mode: null, financing: null });
  };

  const handleDownload = useCallback((financing) => {
    console.log('🔽 Descargando documentos de:', financing);
    // TODO: Implementar descarga de documentos
    showBanner({
      message: 'Funcionalidad de descarga próximamente',
      severity: 'info',
      duration: 3000,
    });
  }, [showBanner]);

  const handlePayOnline = (financing) => {
    console.log('💳 Pagar en línea:', financing);
    onPayOnline?.(financing);
  };

  // Loading state
  if ((initializing || loading) && (!financings || financings.length === 0)) {
    return <TableSkeleton rows={5} columns={6} variant="table" />;
  }

  // Mobile View
  if (isMobile) {
    return (
      <>
        <FinancingTabs activeTab={activeTab} onTabChange={setActiveTab} isMobile={true} />

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
          <Box sx={{ px: { xs: 2, sm: 0 } }}>
            {approvedFinancings.length === 0 && approvedFilter === 'all' ? (
              <EmptyStateApproved />
            ) : (
              <>
                <FinancingFilters
                  currentFilter={approvedFilter}
                  onFilterChange={setApprovedFilter}
                  filterOptions={approvedFilterOptions}
                  isMobile={true}
                />
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
                    />
                  ))
                )}
              </>
            )}
          </Box>
        )}

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
      <FinancingTabs activeTab={activeTab} onTabChange={setActiveTab} isMobile={false} />

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
          {approvedFinancings.length === 0 && approvedFilter === 'all' ? (
            <EmptyStateApproved />
          ) : (
            <>
              <FinancingFilters
                currentFilter={approvedFilter}
                onFilterChange={setApprovedFilter}
                filterOptions={approvedFilterOptions}
                isMobile={false}
              />
              {approvedFinancings.length === 0 ? (
                <EmptyStateFiltered />
              ) : (
                <BuyerFinancingTable
                  financings={approvedFinancings}
                  onPayOnline={handlePayOnline}
                  isApproved={true}
                />
              )}
            </>
          )}
        </>
      )}

      {/* Modal de Ver Motivo */}
      <ViewReasonModal
        open={reasonModal.open}
        financing={reasonModal.financing}
        onClose={closeReasonModal}
      />

      {/* Modales de Acción */}
      <BuyerFinancingActionModals
        open={actionModal.open}
        mode={actionModal.mode}
        financing={actionModal.financing}
        onClose={closeActionModal}
        onSign={handleSignConfirm}
        onCancel={handleCancelConfirm}
      />
    </>
  );
};

export default BuyerFinancingsList;
