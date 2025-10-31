// 📁 shared/constants/checkout/checkoutSteps.js
// Migrado de features/checkout/constants/checkoutSteps.js

export const CHECKOUT_STEPS = {
  CART: {
    id: 'cart',
    name: 'Carrito',
    path: '/buyer/cart',
    order: 1,
    icon: 'ShoppingCart',
    completed: false
  },
  PAYMENT_METHOD: {
    id: 'payment_method',
    name: 'Método de Pago',
    path: '/buyer/paymentmethod',
    order: 2,
    icon: 'Payment',
    completed: false
  },
  CONFIRMATION: {
    id: 'confirmation',
    name: 'Confirmación',
    path: '/buyer/checkout/confirmation',
    order: 3,
    icon: 'CheckCircle',
    completed: false
  },
  PROCESSING: {
    id: 'processing',
    name: 'Procesando',
    path: '/buyer/checkout/processing',
    order: 4,
    icon: 'HourglassEmpty',
    completed: false
  },
  SUCCESS: {
    id: 'success',
    name: 'Completado',
    path: '/buyer/checkout/success',
    order: 5,
    icon: 'CheckCircle',
    completed: false
  }
};

export const CHECKOUT_FLOW = [
  CHECKOUT_STEPS.CART,
  CHECKOUT_STEPS.PAYMENT_METHOD,
  CHECKOUT_STEPS.CONFIRMATION,
  CHECKOUT_STEPS.PROCESSING,
  CHECKOUT_STEPS.SUCCESS
];

export const getStepByPath = (path) => {
  return Object.values(CHECKOUT_STEPS).find(step => step.path === path);
};

export const getNextStep = (currentStepId) => {
  const currentStep = Object.values(CHECKOUT_STEPS).find(step => step.id === currentStepId);
  if (!currentStep) return null;
  
  const currentIndex = CHECKOUT_FLOW.findIndex(step => step.id === currentStepId);
  return currentIndex < CHECKOUT_FLOW.length - 1 ? CHECKOUT_FLOW[currentIndex + 1] : null;
};

export const getPreviousStep = (currentStepId) => {
  const currentIndex = CHECKOUT_FLOW.findIndex(step => step.id === currentStepId);
  return currentIndex > 0 ? CHECKOUT_FLOW[currentIndex - 1] : null;
};
