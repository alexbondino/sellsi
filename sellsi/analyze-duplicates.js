// Script para analizar archivos duplicados y determinar cuáles eliminar
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Analizar carpetas duplicadas específicas
const duplicateFolders = {
  // Marketplace duplicados - ✅ ELIMINADO EXITOSAMENTE
  // 'marketplace': [
  //   'src/domains/marketplace/marketplace', // ✅ ELIMINADO
  //   'src/domains/marketplace/pages/marketplace' // ✅ MANTENER
  // ],
  
  // Hooks duplicados - ✅ ELIMINADO EXITOSAMENTE
  // 'CategoryNavigation': [
  //   'src/domains/marketplace/CategoryNavigation', // ✅ ELIMINADO
  //   'src/domains/marketplace/hooks/CategoryNavigation', // ✅ ELIMINADO
  //   'src/domains/marketplace/pages/CategoryNavigation', // ✅ MANTENER
  //   'src/domains/marketplace/pages/hooks/CategoryNavigation' // ✅ MANTENER
  // ],
  
  // 'FilterPanel': [
  //   'src/domains/marketplace/FilterPanel', // ✅ ELIMINADO
  //   'src/domains/marketplace/hooks/FilterPanel', // ✅ ELIMINADO
  //   'src/domains/marketplace/pages/FilterPanel', // ✅ MANTENER
  //   'src/domains/marketplace/pages/hooks/FilterPanel' // ✅ MANTENER
  // ],
  
  // 'ProductCard': [
  //   'src/domains/marketplace/hooks/ProductCard', // ✅ ELIMINADO
  //   'src/domains/marketplace/pages/hooks/ProductCard' // ✅ ELIMINADO
  // ],
  
  // 'ProductGrid': [
  //   'src/domains/marketplace/hooks/ProductGrid', // ✅ ELIMINADO
  //   'src/domains/marketplace/pages/hooks/ProductGrid' // ✅ ELIMINADO
  // ],
  
  // Componentes duplicados - ✅ ELIMINADO EXITOSAMENTE
  // 'PriceDisplay': [
  //   'src/domains/marketplace/PriceDisplay', // ✅ MANTENER
  //   'src/domains/marketplace/pages/PriceDisplay' // ✅ ELIMINADO
  // ],
  
  // 'product': [
  //   'src/domains/marketplace/product', // ✅ ELIMINADO
  //   'src/domains/marketplace/pages/product' // ✅ ELIMINADO
  // ],
  
  // 'sections': [
  //   'src/domains/marketplace/sections', // ✅ ELIMINADO
  //   'src/domains/marketplace/pages/sections' // ✅ MANTENER
  // ],
  
  // 'StockIndicator': [
  //   'src/domains/marketplace/StockIndicator', // ✅ MANTENER
  //   'src/domains/marketplace/pages/StockIndicator' // ✅ ELIMINADO
  // ],
  
  // 'view_page': [
  //   'src/domains/marketplace/view_page', // ✅ ELIMINADO
  //   'src/domains/marketplace/pages/view_page' // ✅ ELIMINADO
  // ],
  
  // Formatters
  'formatters': [
    'src/shared/components/formatters',
    'src/shared/utils/formatters'
  ]
};

function analyzeImports(folderName, paths) {
  console.log(`\n🔍 Analizando: ${folderName}`);
  console.log('═'.repeat(50));
  
  paths.forEach((folderPath, index) => {
    console.log(`\n📁 Carpeta ${index + 1}: ${folderPath}`);
    
    // Buscar imports que referencien esta carpeta
    try {
      const searchPath = folderPath.replace(/\\/g, '/');
      const result = execSync(`grep -r "${searchPath}" src/ --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" || true`, { encoding: 'utf8' });
      
      if (result.trim()) {
        console.log('✅ IMPORTS ENCONTRADOS:');
        console.log(result);
      } else {
        console.log('❌ NO SE ENCONTRARON IMPORTS');
      }
    } catch (error) {
      console.log('❓ Error al buscar imports:', error.message);
    }
  });
}

// Analizar cada grupo de carpetas duplicadas
Object.entries(duplicateFolders).forEach(([name, paths]) => {
  analyzeImports(name, paths);
});
