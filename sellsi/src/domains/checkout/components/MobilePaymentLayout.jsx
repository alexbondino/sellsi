import React from 'react';
import { calculatePriceForQuantity } from '../../../utils/priceCalculation';
import { Stack, Box } from '@mui/material';
import { AnimatePresence } from 'framer-motion';

// Componentes móviles
import MobilePaymentHeader from './MobilePaymentHeader';
import CompactCheckoutSummary from './CompactCheckoutSummary';
import MobilePaymentCard from './MobilePaymentCard';
import MobileCheckoutBar from '../../buyer/pages/cart/components/MobileCheckoutBar';

const MobilePaymentLayout = ({ 
  orderData = {},
  availableMethods = [],
  selectedMethodId,
  onMethodSelect,
  onBack,
  onContinue,
  isProcessing = false,
  formatPrice,
  currentStep = 2,
  totalSteps = 3
}) => {
  // Normalizar currentStep aquí también para evitar que llegue un objeto al header
  const normalizedCurrentStep = (function normalize(step) {
    if (typeof step === 'object' && step !== null) {
      return step.order || 0;
    }
    if (typeof step === 'string') {
      const idOrderMap = { cart: 1, payment_method: 2, confirmation: 3, processing: 4, success: 5 };
      return idOrderMap[step] || 0;
    }
    return Number(step) || 0;
  })(currentStep);
  const selectedMethod = availableMethods.find(m => m.id === selectedMethodId);
  const canContinue = !!selectedMethodId && !!selectedMethod && !isProcessing;

  // Ensure bottom bar total reflects selected payment method fee (same logic as CompactCheckoutSummary)
  const computedTotal = (() => {
    const items = orderData?.items || [];
    // Use tier-aware price calculation
    const totalBruto = items.reduce((acc, item) => {
      const basePrice = item.originalPrice || item.precioOriginal || item.price || item.precio || 0;
      const unit = item.price_tiers && item.price_tiers.length > 0
        ? calculatePriceForQuantity(item.quantity, item.price_tiers, basePrice)
        : (item.price || 0);
      return acc + unit * (item.quantity || 0);
    }, 0);

    const base = Math.trunc(totalBruto) + (orderData?.shipping || 0);

    let fee = 0;
    if (selectedMethod) {
      if (selectedMethod.id === 'khipu') fee = 500;
      else if (selectedMethod.id === 'flow') fee = Math.round(base * 0.038);
    }

    return base + fee;
  })();

  return (
    <>
  <Stack spacing={1.2} sx={{ pb: 0.5 }}>
        {/* Header compacto con progreso */}
        <MobilePaymentHeader 
          onBack={onBack}
            // Pasar versión normalizada (número) para evitar children no válidos
          currentStep={normalizedCurrentStep}
          totalSteps={totalSteps}
        />
        
        {/* Summary compacto no-sticky */}
        <CompactCheckoutSummary 
          orderData={orderData}
          formatPrice={formatPrice}
          variant="minimal"
          selectedMethod={selectedMethod}
        />
        
        {/* Payment methods */}
  <Stack spacing={0.7} sx={{ px: 0 }}>
          <AnimatePresence>
            {availableMethods.map((method) => (
              <MobilePaymentCard
                key={method.id}
                method={method}
                isSelected={selectedMethodId === method.id}
                onSelect={onMethodSelect}
                formatPrice={formatPrice}
              />
            ))}
          </AnimatePresence>
        </Stack>
        
        {/* Espacio adicional para el bottom bar */}
        <Box sx={{ height: 80 }} />
      </Stack>
      
      {/* Unified bottom bar */}
      <MobileCheckoutBar
        total={computedTotal || orderData.total || 0}
        itemCount={orderData.items?.length || 0}
        onCheckout={onContinue}
        isLoading={isProcessing}
        formatPrice={formatPrice}
        variant="payment"
        disabled={!canContinue}
      />
    </>
  );
};

export default MobilePaymentLayout;
