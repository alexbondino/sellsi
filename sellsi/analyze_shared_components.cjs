const fs = require('fs');
const path = require('path');

// Script para analizar qué exports de shared/components se están usando realmente
console.log('🔍 Analizando uso de exports de shared/components...');

const srcDir = path.join(__dirname, 'src');
const sharedComponentsIndex = path.join(srcDir, 'shared/components/index.js');

// Leer el archivo index.js para extraer todos los exports
const indexContent = fs.readFileSync(sharedComponentsIndex, 'utf8');

// Extraer nombres de exports usando regex
const exportMatches = indexContent.match(/export\s+{\s*([^}]+)\s*}/g) || [];
const defaultExportMatches = indexContent.match(/export\s+{\s*default\s+as\s+(\w+)/g) || [];

const allExports = new Set();

// Procesar exports normales
exportMatches.forEach(match => {
  const exports = match.replace(/export\s+{\s*/, '').replace(/\s*}.*/, '');
  exports.split(',').forEach(exp => {
    const cleanExp = exp.trim().split(' as ')[exp.includes(' as ') ? 1 : 0].trim();
    if (cleanExp) allExports.add(cleanExp);
  });
});

// Procesar default exports
defaultExportMatches.forEach(match => {
  const name = match.match(/as\s+(\w+)/)[1];
  allExports.add(name);
});

console.log(`📊 Total exports encontrados: ${allExports.size}`);
console.log('📝 Exports:', Array.from(allExports).sort());

// Función para buscar archivos recursivamente
function findJsxFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('.git')) {
      findJsxFiles(fullPath, files);
    } else if (item.match(/\.(js|jsx|ts|tsx)$/)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Buscar todos los archivos JS/JSX
const allFiles = findJsxFiles(srcDir);

// Analizar uso de cada export
const usageMap = new Map();
Array.from(allExports).forEach(exp => usageMap.set(exp, []));

console.log(`\n🔍 Analizando ${allFiles.length} archivos...`);

let totalImports = 0;

allFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  
  // Buscar imports de shared/components
  const importMatches = content.match(/import\s+{[^}]+}\s+from\s+['"'][^'"]*shared\/components['"']/g) || [];
  
  importMatches.forEach(importLine => {
    totalImports++;
    const imports = importLine.match(/{([^}]+)}/)[1];
    
    imports.split(',').forEach(imp => {
      const cleanImp = imp.trim().split(' as ')[0].trim();
      if (usageMap.has(cleanImp)) {
        const relativePath = file.replace(srcDir, '').replace(/\\/g, '/');
        usageMap.get(cleanImp).push(relativePath);
      }
    });
  });
});

console.log(`\n📊 Total líneas de import encontradas: ${totalImports}`);

// Generar reporte
console.log('\n📈 REPORTE DE USO:');
console.log('=' .repeat(50));

const used = [];
const unused = [];

Array.from(allExports).sort().forEach(exp => {
  const usage = usageMap.get(exp);
  if (usage && usage.length > 0) {
    used.push(exp);
    console.log(`✅ ${exp} (${usage.length} usos)`);
    if (usage.length <= 3) {
      usage.forEach(file => console.log(`   - ${file}`));
    }
  } else {
    unused.push(exp);
    console.log(`❌ ${exp} (0 usos)`);
  }
});

console.log('\n📊 RESUMEN:');
console.log(`✅ Exports usados: ${used.length}`);
console.log(`❌ Exports sin usar: ${unused.length}`);
console.log(`📉 Porcentaje sin usar: ${((unused.length / allExports.size) * 100).toFixed(1)}%`);

if (unused.length > 0) {
  console.log('\n🗑️ EXPORTS CANDIDATOS PARA ELIMINACIÓN:');
  unused.forEach(exp => console.log(`  - ${exp}`));
}
