const fs = require('fs');
const path = require('path');

function removeConsoleLogs(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Patrón más preciso para console.logs multilínea
    let originalLength = content.length;
    
    // Primero eliminar console.logs simples de una línea
    content = content.replace(/^\s*console\.(log|warn|error|debug|info)\([^;]*?\);\s*$/gm, '');
    
    // Eliminar console.logs multilínea
    content = content.replace(/console\.(log|warn|error|debug|info)\s*\(\s*[\s\S]*?\)\s*;?\s*/g, '');
    
    // Limpiar líneas vacías excesivas
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    if (content.length !== originalLength) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Limpiado: ${filePath}`);
      return true;
    }
    return false;
    
  } catch (error) {
    console.error(`❌ Error procesando ${filePath}:`, error.message);
    return false;
  }
}

// LIMPIEZA VERDADERAMENTE FINAL
const filesToClean = [
  'src/domains/profile/components/ChangePasswordModal.jsx',
  'src/domains/profile/components/sections/ShippingInfoSection.jsx'
];

let totalCleaned = 0;

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
