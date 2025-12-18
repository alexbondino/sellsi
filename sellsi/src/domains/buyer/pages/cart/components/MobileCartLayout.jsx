import React, { useState } from 'react';
import { Stack, Box } from '@mui/material';
import { AnimatePresence } from 'framer-motion';

// Componentes móviles
import MobileCartHeader from './MobileCartHeader';
import CollapsibleSummary from './CollapsibleSummary';
import MobileCartItem from './MobileCartItem';
import MobileCheckoutBar from './MobileCheckoutBar';
import MinimumPurchaseWarning from './MinimumPurchaseWarning';

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
  supplierMinimumValidation = null
}) => {
  const [summaryExpanded, setSummaryExpanded] = useState(false);

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
    </>
  );
};

export default MobileCartLayout;
