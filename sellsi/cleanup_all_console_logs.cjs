const fs = require('fs');
const path = require('path');
const glob = require('glob');

function removeConsoleLogs(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalLength = content.length;
    
    // Remover console.log statements con try/catch wrapper
    content = content.replace(/\s*try\s*\{\s*console\.(log|warn|debug|info)\([^}]*?\);\s*\}\s*catch\s*\([^}]*?\)\s*\{\s*\}/gs, '');
    
    // Remover console statements simples (preservar console.error para errores críticos)
    content = content.replace(/^\s*console\.(log|warn|debug|info)\([^;]*?\);\s*$/gm, '');
    
    // Remover comentarios de eslint-disable-next-line no-console seguidos de console
    content = content.replace(/^\s*\/\/\s*eslint-disable-next-line\s+no-console\s*\n\s*console\.(log|warn|debug|info)\([^;]*?\);\s*$/gm, '');
    
    // Limpiar líneas vacías excesivas
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    if (content.length !== originalLength) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Limpiado: ${filePath} (${originalLength - content.length} caracteres removidos)`);
      return true;
    }
    return false;
    
  } catch (error) {
    console.error(`❌ Error procesando ${filePath}:`, error.message);
    return false;
  }
}

// Archivos específicos encontrados en el análisis
const filesToClean = [
  'src/services/user/cartService.js',
  'src/domains/supplier/validators/ProductValidator.js',
  'src/domains/supplier/pages/offers/hooks/useSupplierOffers.js',
  'src/domains/supplier/pages/offers/components/SupplierOffersList.jsx',
  'src/domains/supplier/pages/my-products/AddProduct.jsx',
  'src/lib/sentryDeferred.js'
];

let totalCleaned = 0;

console.log('🧹 Iniciando limpieza de console logs de debug...');

filesToClean.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    if (removeConsoleLogs(fullPath)) {
      totalCleaned++;
    }
  } else {
    console.log(`⚠️ Archivo no encontrado: ${file}`);
  }
});

console.log(`🎉 Limpieza completada - ${totalCleaned} archivos procesados`);
