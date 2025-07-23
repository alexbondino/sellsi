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
  
  // Hooks duplicados - CRÍTICO
  'CategoryNavigation': [
    'src/domains/marketplace/CategoryNavigation',
    'src/domains/marketplace/hooks/CategoryNavigation',
    'src/domains/marketplace/pages/CategoryNavigation',
    'src/domains/marketplace/pages/hooks/CategoryNavigation'
  ],
  
  'FilterPanel': [
    'src/domains/marketplace/FilterPanel',
    'src/domains/marketplace/hooks/FilterPanel',
    'src/domains/marketplace/pages/FilterPanel',
    'src/domains/marketplace/pages/hooks/FilterPanel'
  ],
  
  'ProductCard': [
    'src/domains/marketplace/hooks/ProductCard',
    'src/domains/marketplace/pages/hooks/ProductCard'
  ],
  
  'ProductGrid': [
    'src/domains/marketplace/hooks/ProductGrid',
    'src/domains/marketplace/pages/hooks/ProductGrid'
  ],
  
  // Componentes duplicados
  'PriceDisplay': [
    'src/domains/marketplace/PriceDisplay',
    'src/domains/marketplace/pages/PriceDisplay'
  ],
  
  'product': [
    'src/domains/marketplace/product',
    'src/domains/marketplace/pages/product'
  ],
  
  'sections': [
    'src/domains/marketplace/sections',
    'src/domains/marketplace/pages/sections'
  ],
  
  'StockIndicator': [
    'src/domains/marketplace/StockIndicator',
    'src/domains/marketplace/pages/StockIndicator'
  ],
  
  'view_page': [
    'src/domains/marketplace/view_page',
    'src/domains/marketplace/pages/view_page'
  ],
  
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
