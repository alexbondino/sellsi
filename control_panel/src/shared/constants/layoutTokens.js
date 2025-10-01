// Layout tokens centralizados para ProductsSection y potencial reutilización.
// SOLO refactor (no cambia comportamiento). Valores copiados del componente original.

export const productGridColumns = {
  xs: 2,
  sm: 2,
  md: 4,
  lg: 4,
  xl: 5,
};

export const productGridGaps = {
  xs: 1,
  sm: 1,
  md: 2,
  lg: 6,
  xl: 6,
};

// Configuración responsiva de paginación / progressive reveal.
// Se replica 1:1 la tabla de números actuales para aislar 'magic numbers'.
export const paginationResponsiveConfig = {
  xs: { PRODUCTS_PER_PAGE: 60, INITIAL_PRODUCTS: 8, LOAD_MORE_BATCH: 6, PRELOAD_TRIGGER: 6 },
  sm: { PRODUCTS_PER_PAGE: 80, INITIAL_PRODUCTS: 12, LOAD_MORE_BATCH: 9, PRELOAD_TRIGGER: 9 },
  md: { PRODUCTS_PER_PAGE: 90, INITIAL_PRODUCTS: 15, LOAD_MORE_BATCH: 9, PRELOAD_TRIGGER: 9 },
  lg: { PRODUCTS_PER_PAGE: 100, INITIAL_PRODUCTS: 20, LOAD_MORE_BATCH: 12, PRELOAD_TRIGGER: 12 },
  xl: { PRODUCTS_PER_PAGE: 125, INITIAL_PRODUCTS: 25, LOAD_MORE_BATCH: 15, PRELOAD_TRIGGER: 15 },
  fallback: { PRODUCTS_PER_PAGE: 100, INITIAL_PRODUCTS: 20, LOAD_MORE_BATCH: 8, PRELOAD_TRIGGER: 16 },
};

// Future: mover aquí también heights estimados, breakpoints derivados o virtualización tokens.
