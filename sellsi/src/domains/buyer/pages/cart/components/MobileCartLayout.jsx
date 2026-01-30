import React, { useState } from 'react';
import { Stack, Box, Button, Grid } from '@mui/material';
import { AnimatePresence } from 'framer-motion';
import { RequestQuote as RequestQuoteIcon, AccountBalance as AccountBalanceIcon } from '@mui/icons-material';

// Componentes móviles
import MobileCartHeader from './MobileCartHeader';
import CollapsibleSummary from './CollapsibleSummary';
import MobileCartItem from './MobileCartItem';
import MobileCheckoutBar from './MobileCheckoutBar';
import MinimumPurchaseWarning from './MinimumPurchaseWarning';
import MobileFinancingsModal from './MobileFinancingsModal';

const MobileCartLayout = ({ 
  items = [],
  calculations = {},
  cartStats = {},
  onCheckout,
  onBack,
  onQuantityChange,
  onRemoveItem,
  formatPrice,
  isCheckingOut = false,
  supplierMinimumValidation = null,
  onOpenFinancingModal,
  financingEnabled = false,
  productFinancing = {},
  ageVerificationDenied = false, // Nueva prop para verificación de edad
}) => {
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [financingsModalOpen, setFinancingsModalOpen] = useState(false);
  const [hasFinancings, setHasFinancings] = useState(false);
  const [isCheckingFinancings, setIsCheckingFinancings] = useState(false);

  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      setIsCheckingFinancings(true);
      try {
        const svc = await import('../../../../../workspaces/buyer/my-financing/services/financingService');
        const getAvailable = svc.getAvailableFinancingsForSupplier || (svc.default && svc.default.getAvailableFinancingsForSupplier);

        const supplierIds = Array.from(new Set(items.map(i => i.supplier_id || i.supplierId).filter(Boolean)));
        if (supplierIds.length === 0) {
          if (mounted) setHasFinancings(false);
          return;
        }

        for (const sid of supplierIds) {
          try {
            if (!getAvailable) continue;
            const list = await getAvailable(sid);
            if (Array.isArray(list)) {
              // Check at least one qualifying financing: approved, not paused, available > 0
              const any = list.some(f => f.status === 'approved_by_sellsi' && !f.paused && ((f.amount || 0) - (f.amount_used || 0)) > 0);
              if (any) {
                if (mounted) setHasFinancings(true);
                return;
              }
            }
          } catch (e) {
            console.error('[MobileCartLayout] failed to load financings for supplier', sid, e);
          }
        }

        if (mounted) setHasFinancings(false);
      } catch (err) {
        console.error('[MobileCartLayout] failed to import financingService', err);
        if (mounted) setHasFinancings(false);
      } finally {
        if (mounted) setIsCheckingFinancings(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [items]);

  return (
    <>
  <Stack spacing={1.1} sx={{ pb: 0.5 }}>
        {/* Header con back button */}
        <MobileCartHeader 
          itemCount={items.length}
          onBack={onBack}
        />
        
        {/* Summary colapsable */}
        <CollapsibleSummary
          calculations={calculations}
          expanded={summaryExpanded}
          onToggle={() => setSummaryExpanded(!summaryExpanded)}
          formatPrice={formatPrice}
          itemCount={items.length}
        />
        
        {/* Botones de Financiamiento - 2 botones exactamente 50% width */}
        {financingEnabled && (
          <Box sx={{ px: 0 }}>
            <Box sx={{ display: 'flex', width: '100%' }}>
              {/* Botón 1 wrapper - 50% fixed */}
              <Box data-testid="FinButtonWrapper" sx={{ width: '50%', px: 0.5, boxSizing: 'border-box' }}>
                <Button
                  variant="contained"
                  fullWidth
                  size="medium"
                  onClick={onOpenFinancingModal}
                  startIcon={<RequestQuoteIcon />}
                  aria-label="Pagar con Financiamiento"
                  data-testid="PayWithFinancingBtn"
                  disabled={isCheckingFinancings || !hasFinancings}
                  sx={{
                    py: { xs: 1, sm: 1.2 },
                    borderRadius: 2,
                    fontWeight: 'bold',
                    textTransform: 'none',
                    backgroundColor: '#2E52B2',
                    fontSize: { xs: '0.8rem', sm: '0.85rem' },
                    '&:hover': {
                      backgroundColor: '#1e3a7a',
                    },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%'
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
                    <span>Pagar con</span>
                    <span style={{ fontWeight: 700 }}>Financiamiento</span>
                  </Box>
                </Button>
              </Box>

              {/* Botón 2 wrapper - 50% fixed */}
              <Box data-testid="ViewButtonWrapper" sx={{ width: '50%', px: 0.5, boxSizing: 'border-box' }}>
                <Button
                  variant="outlined"
                  fullWidth
                  size="medium"
                  onClick={() => setFinancingsModalOpen(true)}
                  startIcon={<AccountBalanceIcon />}
                  aria-label="Financiamientos Disponibles"
                  data-testid="ViewFinancingsBtn"
                  sx={{
                    py: { xs: 1, sm: 1.2 },
                    borderRadius: 2,
                    fontWeight: 'bold',
                    textTransform: 'none',
                    borderColor: '#2E52B2',
                    color: '#2E52B2',
                    fontSize: { xs: '0.8rem', sm: '0.85rem' },
                    '&:hover': {
                      borderColor: '#1e3a7a',
                      backgroundColor: 'rgba(46, 82, 178, 0.08)',
                    },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%'
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
                    <span>Financiamientos</span>
                    <span style={{ fontWeight: 700 }}>Disponibles</span>
                  </Box>
                </Button>
              </Box>
            </Box>
          </Box>
        )}
        
        {/* Validación de compra mínima por proveedor */}
        <MinimumPurchaseWarning
          validation={supplierMinimumValidation}
          isSelectionMode={false}
          formatPrice={formatPrice}
        />
        
        {/* Lista de productos */}
  <Stack spacing={0.7} sx={{ px: 0 }}>
          <AnimatePresence>
            {items.map((item, index) => (
              <MobileCartItem
                key={item.id || item.product_id || `item-${index}`}
                item={item}
                onUpdate={onQuantityChange}
                onRemove={onRemoveItem}
                formatPrice={formatPrice}
                showShipping={true}
                onOpenFinancingModal={onOpenFinancingModal}
                financingEnabled={financingEnabled}
                financingAmount={productFinancing[item.id]?.amount || 0}
                ageVerificationDenied={ageVerificationDenied}
              />
            ))}
          </AnimatePresence>
        </Stack>
        
        {/* Espacio adicional para el bottom bar y mobile bar */}
        <Box sx={{ height: 140, minHeight: 140 }} />
      </Stack>
      
      {/* Sticky bottom bar */}
      <MobileCheckoutBar
        total={calculations.total || 0}
        itemCount={items.length}
        onCheckout={onCheckout}
        isLoading={isCheckingOut}
        formatPrice={formatPrice}
        variant="cart"
      />
      
      {/* Modal fullscreen de financiamientos disponibles */}
      <MobileFinancingsModal
        open={financingsModalOpen}
        onClose={() => setFinancingsModalOpen(false)}
        cartItems={items}
      />
    </>
  );
};

export default MobileCartLayout;
