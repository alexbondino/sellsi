// ============================================================================
// CHECKOUT MODULE - BARREL EXPORT
// ============================================================================

// Componentes principales del checkout
export { default as PaymentMethodSelector } from './PaymentMethodSelector'
export { default as CheckoutSummary } from './CheckoutSummary'
export { default as PaymentMethod } from './PaymentMethod'

// Hooks especializados
export { default as useCheckout } from './hooks/useCheckout'
export { default as usePaymentMethods } from './hooks/usePaymentMethods'
export { default as useCheckoutFormatting } from './hooks/useCheckoutFormatting'

// Servicios
export { default as checkoutService } from './services/checkoutService'

// Constantes
export * from './constants/paymentMethods'
export * from './constants/checkoutSteps'
