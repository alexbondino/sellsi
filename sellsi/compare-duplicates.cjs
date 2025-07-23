const fs = require('fs');

function compareFilesExcludingImports(file1Path, file2Path) {
  const content1 = fs.readFileSync(file1Path, 'utf8');
  const content2 = fs.readFileSync(file2Path, 'utf8');
  
  // Función para filtrar líneas de imports
  function removeImportLines(content) {
    return content
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        return !(
          trimmed.startsWith('import ') || 
          trimmed.startsWith('export ') ||
          (trimmed.startsWith('from ') && trimmed.includes("'"))
        );
      })
      .join('\n');
  }
  
  const cleanContent1 = removeImportLines(content1);
  const cleanContent2 = removeImportLines(content2);
  
  if (cleanContent1 === cleanContent2) {
    console.log('✅ Los archivos son IDÉNTICOS (excluyendo imports)');
    return true;
  } else {
    console.log('❌ Los archivos son DIFERENTES (excluyendo imports)');
    
    // Mostrar algunas diferencias
    const lines1 = cleanContent1.split('\n');
    const lines2 = cleanContent2.split('\n');
    
    console.log('\n📊 Estadísticas:');
    console.log(`Archivo 1: ${lines1.length} líneas`);
    console.log(`Archivo 2: ${lines2.length} líneas`);
    
    // Buscar primera diferencia
    const maxLines = Math.max(lines1.length, lines2.length);
    for (let i = 0; i < maxLines; i++) {
      const line1 = lines1[i] || '';
      const line2 = lines2[i] || '';
      
      if (line1 !== line2) {
        console.log(`\n🔍 Primera diferencia en línea ${i + 1}:`);
        console.log(`Archivo 1: "${line1}"`);
        console.log(`Archivo 2: "${line2}"`);
        break;
      }
    }
    
    return false;
  }
}

// Comparar useTechnicalSpecs.js
console.log('🔍 Comparando useTechnicalSpecs.js...');
const identical1 = compareFilesExcludingImports(
  'src/domains/marketplace/view_page/hooks/useTechnicalSpecs.js',
  'src/domains/marketplace/pages/view_page/hooks/useTechnicalSpecs.js'
);

console.log('\n' + '='.repeat(60));

// Comparar TechnicalSpecs.jsx
console.log('🔍 Comparando TechnicalSpecs.jsx...');
const identical2 = compareFilesExcludingImports(
  'src/domains/marketplace/view_page/TechnicalSpecs.jsx',
  'src/domains/marketplace/pages/view_page/TechnicalSpecs.jsx'
);

console.log('\n' + '='.repeat(60));
console.log('📋 RESUMEN FINAL:');

if (identical1 && identical2) {
  console.log('✅ TODOS los archivos son idénticos (excluyendo imports)');
  console.log('💡 Recomendación: Usar una sola ubicación y eliminar la duplicada');
} else {
  console.log('❌ Los archivos tienen diferencias más allá de los imports');
  console.log('⚠️  Se requiere revisión manual para decidir cuál usar');
}
