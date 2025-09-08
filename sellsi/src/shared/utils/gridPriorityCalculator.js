/**
 * Calculadora de Prioridad de Grid para ProductCards
 * Determina qué productos deben tener fetchpriority="high" basado en:
 * - Breakpoint actual (número de columnas)
 * - Posición en el grid (primeras 2 filas)
 * - Sistema de batching progresivo existente
 */

import { productGridColumns } from '../constants/layoutTokens';

/**
 * Calcula el número de productos que ocupan las primeras 2 filas
 * @param {string} breakpoint - 'xs' | 'sm' | 'md' | 'lg' | 'xl'
 * @returns {number} Número de productos en las primeras 2 filas
 */
export function calculateFirstTwoRowsCount(breakpoint) {
  const columns = productGridColumns[breakpoint] || productGridColumns.md;
  return columns * 2; // 2 filas
}

/**
 * Determina si un producto debe tener alta prioridad basado en su índice
 * ✅ VERSIÓN CONSERVADORA: Solo las primeras 2 filas tienen fetchpriority="high", 
 * el resto mantiene eager loading pero con fetchpriority="auto" por seguridad
 * @param {number} productIndex - Índice del producto en la lista renderizada (0-based)
 * @param {Object} responsive - Objeto con flags de breakpoints { isXs, isSm, isMd, isLg, isXl }
 * @returns {boolean} true si el producto debe tener fetchpriority="high"
 */
export function shouldHaveHighPriority(productIndex, responsive) {
  // Determinar breakpoint actual
  let currentBreakpoint = 'md'; // fallback
  if (responsive.isXs) currentBreakpoint = 'xs';
  else if (responsive.isSm) currentBreakpoint = 'sm';
  else if (responsive.isMd) currentBreakpoint = 'md';
  else if (responsive.isLg) currentBreakpoint = 'lg';
  else if (responsive.isXl) currentBreakpoint = 'xl';

  const firstTwoRowsCount = calculateFirstTwoRowsCount(currentBreakpoint);
  
  // Producto tiene alta prioridad si está en las primeras 2 filas
  return productIndex < firstTwoRowsCount;
}

/**
 * Genera un mapa de prioridades para una lista de productos
 * @param {Array} products - Lista de productos a renderizar
 * @param {Object} responsive - Objeto con flags de breakpoints
 * @returns {Map<number, boolean>} Mapa index -> shouldHaveHighPriority
 */
export function generatePriorityMap(products, responsive) {
  const priorityMap = new Map();
  
  products.forEach((_, index) => {
    priorityMap.set(index, shouldHaveHighPriority(index, responsive));
  });
  
  return priorityMap;
}

/**
 * Información de debug para desarrollo
 * @param {Object} responsive - Objeto con flags de breakpoints
 * @returns {Object} Información de debug con breakpoint y cálculos
 */
export function getGridPriorityDebugInfo(responsive) {
  let currentBreakpoint = 'md';
  if (responsive.isXs) currentBreakpoint = 'xs';
  else if (responsive.isSm) currentBreakpoint = 'sm';
  else if (responsive.isMd) currentBreakpoint = 'md';
  else if (responsive.isLg) currentBreakpoint = 'lg';
  else if (responsive.isXl) currentBreakpoint = 'xl';

  const columns = productGridColumns[currentBreakpoint];
  const firstTwoRowsCount = calculateFirstTwoRowsCount(currentBreakpoint);

  return {
    breakpoint: currentBreakpoint,
    columns,
    rowsForHighPriority: 2,
    highPriorityProductsCount: firstTwoRowsCount,
    calculation: `${columns} columnas × 2 filas = ${firstTwoRowsCount} productos con alta prioridad`
  };
}

/**
 * Hook personalizado que facilita el uso en componentes React
 * @param {Array} renderItems - Lista de productos que se están renderizando
 * @param {Object} responsive - Objeto con flags de breakpoints
 * @returns {Object} { getPriority: (index) => boolean, debugInfo: {...} }
 */
export function useGridPriority(renderItems, responsive) {
  const priorityMap = generatePriorityMap(renderItems, responsive);
  
  const getPriority = (index) => priorityMap.get(index) || false;
  
  const debugInfo = process.env.NODE_ENV === 'development' 
    ? getGridPriorityDebugInfo(responsive)
    : null;

  return {
    getPriority,
    debugInfo,
    highPriorityCount: calculateFirstTwoRowsCount(
      responsive.isXs ? 'xs' :
      responsive.isSm ? 'sm' :
      responsive.isMd ? 'md' :
      responsive.isLg ? 'lg' :
      responsive.isXl ? 'xl' : 'md'
    )
  };
}
