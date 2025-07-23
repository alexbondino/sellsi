const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuración de reemplazos de imports
const importReplacements = [
  // ProductPageView: de 6 niveles a 4 niveles (se movió de marketplace/pages/ProductPageView a ProductPageView)
  {
    pattern: /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/services\/([^'"]+)['"]/g,
    replacement: "from '../../../../services/$1'",
    targetDirs: ['src/domains/ProductPageView/**/*.{js,jsx,ts,tsx}']
  },
  {
    pattern: /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/utils\/([^'"]+)['"]/g,
    replacement: "from '../../../../utils/$1'",
    targetDirs: ['src/domains/ProductPageView/**/*.{js,jsx,ts,tsx}']
  },
  {
    pattern: /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/hooks\/([^'"]+)['"]/g,
    replacement: "from '../../../../hooks/$1'",
    targetDirs: ['src/domains/ProductPageView/**/*.{js,jsx,ts,tsx}']
  },
  {
    pattern: /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/domains\/([^'"]+)['"]/g,
    replacement: "from '../../../../domains/$1'",
    targetDirs: ['src/domains/ProductPageView/**/*.{js,jsx,ts,tsx}']
  },
  {
    pattern: /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/components\/([^'"]+)['"]/g,
    replacement: "from '../../../../components/$1'",
    targetDirs: ['src/domains/ProductPageView/**/*.{js,jsx,ts,tsx}']
  },
  
  // ProductPageView components: de 5 niveles a 3 niveles
  {
    pattern: /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/services\/([^'"]+)['"]/g,
    replacement: "from '../../../services/$1'",
    targetDirs: ['src/domains/ProductPageView/components/**/*.{js,jsx,ts,tsx}']
  },
  {
    pattern: /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/utils\/([^'"]+)['"]/g,
    replacement: "from '../../../utils/$1'",
    targetDirs: ['src/domains/ProductPageView/components/**/*.{js,jsx,ts,tsx}']
  },
  {
    pattern: /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/hooks\/([^'"]+)['"]/g,
    replacement: "from '../../../hooks/$1'",
    targetDirs: ['src/domains/ProductPageView/components/**/*.{js,jsx,ts,tsx}']
  },
  
  // ProductPageView utils: de 5 niveles a 4 niveles (ya corregido en quotationPDFGeneratorDynamic.js)
  {
    pattern: /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/services\/([^'"]+)['"]/g,
    replacement: "from '../../../../services/$1'",
    targetDirs: ['src/domains/ProductPageView/utils/**/*.{js,jsx,ts,tsx}']
  },
  
  // Importaciones dinámicas
  {
    pattern: /await import\(['"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/services\/([^'"]+)['"]\)/g,
    replacement: "await import('../../../../services/$1')",
    targetDirs: ['src/domains/ProductPageView/**/*.{js,jsx,ts,tsx}']
  }
];

function fixImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    importReplacements.forEach(replacement => {
      // Verificar si el archivo está en uno de los directorios objetivo
      const shouldApply = replacement.targetDirs.some(targetDir => {
        const normalizedFilePath = filePath.replace(/\\/g, '/');
        const normalizedTargetDir = targetDir.replace('**/*.{js,jsx,ts,tsx}', '').replace(/\\/g, '/');
        return normalizedFilePath.includes(normalizedTargetDir);
      });
      
      if (shouldApply) {
        const newContent = content.replace(replacement.pattern, replacement.replacement);
        if (newContent !== content) {
          content = newContent;
          modified = true;
        }
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed imports in: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔧 Starting import fixes...\n');
  
  // Buscar todos los archivos JavaScript/TypeScript en ProductPageView
  const patterns = [
    'src/domains/ProductPageView/**/*.js',
    'src/domains/ProductPageView/**/*.jsx',
    'src/domains/ProductPageView/**/*.ts',
    'src/domains/ProductPageView/**/*.tsx'
  ];
  
  let totalFiles = 0;
  let fixedFiles = 0;
  
  patterns.forEach(pattern => {
    const files = glob.sync(pattern);
    files.forEach(file => {
      totalFiles++;
      if (fixImportsInFile(file)) {
        fixedFiles++;
      }
    });
  });
  
  console.log(`\n📊 Summary:`);
  console.log(`   Total files processed: ${totalFiles}`);
  console.log(`   Files with fixes: ${fixedFiles}`);
  console.log(`   Files unchanged: ${totalFiles - fixedFiles}`);
  
  if (fixedFiles > 0) {
    console.log('\n🎉 Import fixes completed!');
  } else {
    console.log('\n✨ No fixes needed - all imports are already correct!');
  }
}

main();
