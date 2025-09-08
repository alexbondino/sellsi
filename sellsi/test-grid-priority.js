/**
 * Test Script para Verificar Sistema de Prioridades de Grid
 * 
 * Ejecutar en consola del navegador para verificar que los cálculos son correctos
 */

// Mock del objeto responsive para diferentes breakpoints
const mockResponsive = {
  xs: { isXs: true, isSm: false, isMd: false, isLg: false, isXl: false },
  sm: { isXs: false, isSm: true, isMd: false, isLg: false, isXl: false },
  md: { isXs: false, isSm: false, isMd: true, isLg: false, isXl: false },
  lg: { isXs: false, isSm: false, isMd: false, isLg: true, isXl: false },
  xl: { isXs: false, isSm: false, isMd: false, isLg: false, isXl: true }
};

// Simulación de la función shouldHaveHighPriority
function shouldHaveHighPriority(productIndex, responsive) {
  const gridColumns = {
    xs: 2, sm: 2, md: 4, lg: 4, xl: 5
  };
  
  let currentBreakpoint = 'md';
  if (responsive.isXs) currentBreakpoint = 'xs';
  else if (responsive.isSm) currentBreakpoint = 'sm';
  else if (responsive.isMd) currentBreakpoint = 'md';
  else if (responsive.isLg) currentBreakpoint = 'lg';
  else if (responsive.isXl) currentBreakpoint = 'xl';

  const firstTwoRowsCount = gridColumns[currentBreakpoint] * 2;
  return productIndex < firstTwoRowsCount;
}

// Tests para cada breakpoint
console.group('🎯 Grid Priority System Test');

Object.keys(mockResponsive).forEach(breakpoint => {
  const responsive = mockResponsive[breakpoint];
  
  console.group(`📱 Breakpoint: ${breakpoint.toUpperCase()}`);
  
  // Simular 25 productos (más que cualquier configuración)
  const testProducts = Array.from({ length: 25 }, (_, i) => ({ id: i, name: `Producto ${i}` }));
  
  let highPriorityCount = 0;
  let highPriorityIndices = [];
  
  testProducts.forEach((_, index) => {
    const hasHighPriority = shouldHaveHighPriority(index, responsive);
    if (hasHighPriority) {
      highPriorityCount++;
      highPriorityIndices.push(index);
    }
  });
  
  const gridColumns = { xs: 2, sm: 2, md: 4, lg: 4, xl: 5 };
  const columns = gridColumns[breakpoint];
  const expectedHighPriority = columns * 2;
  
  console.log(`Columnas: ${columns}`);
  console.log(`Productos con alta prioridad esperados: ${expectedHighPriority} (primeras 2 filas)`);
  console.log(`Productos con alta prioridad calculados: ${highPriorityCount}`);
  console.log(`Índices con alta prioridad: [${highPriorityIndices.join(', ')}]`);
  console.log(`✅ Test ${highPriorityCount === expectedHighPriority ? 'PASÓ' : 'FALLÓ'}`);
  
  console.groupEnd();
});

console.groupEnd();

// Test específico para verificar límites
console.group('🔍 Verificación de Límites');

const xlResponsive = mockResponsive.xl; // 5 columnas = 10 productos alta prioridad

console.log('XL Breakpoint - Productos individuales:');
for (let i = 0; i < 15; i++) {
  const hasHighPriority = shouldHaveHighPriority(i, xlResponsive);
  const rowNumber = Math.floor(i / 5) + 1;
  const colNumber = (i % 5) + 1;
  console.log(`Producto ${i}: Fila ${rowNumber}, Col ${colNumber} -> ${hasHighPriority ? '🔴 HIGH' : '🔵 LOW'} priority`);
}

console.groupEnd();

console.log('🎯 Tests completados. El sistema debería mostrar HIGH priority solo para las primeras 2 filas de cada breakpoint.');

export {}; // Para que TypeScript trate esto como módulo
