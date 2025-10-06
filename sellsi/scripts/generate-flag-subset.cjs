const fs = require('fs');
const path = require('path');

// Países que usas en tu CountrySelector
const USED_COUNTRIES = [
  'cl', 'ar', 'pe', 'co', 'mx', 'es', 'us', 'ec', 
  'bo', 'uy', 'py', 've', 'br', 'gt', 'cr', 'pa'
];

function generateFlagSubset() {
  try {
    // Leer CSS completo de flag-icons
    const flagIconsPath = path.join(__dirname, '../node_modules/flag-icons/css/flag-icons.min.css');
    
    if (!fs.existsSync(flagIconsPath)) {
      console.log('❌ No se encontró flag-icons CSS. Instalando...');
      console.log('💡 Ejecuta: npm install flag-icons');
      return;
    }
    
    const fullCSS = fs.readFileSync(flagIconsPath, 'utf8');
    
    console.log(`📊 CSS original: ${(fullCSS.length / 1024).toFixed(1)} KB`);
    
    // Extraer estilos base (clases generales)
    const baseStyles = extractBaseStyles(fullCSS);
    
    // Extraer estilos específicos de países usados
    const countryStyles = extractCountryStyles(fullCSS, USED_COUNTRIES);
    
    // Combinar estilos
    const subsetCSS = baseStyles + '\n' + countryStyles;
    
    // Crear directorio si no existe
    const outputDir = path.join(__dirname, '../src/shared/components/forms/CountrySelector');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Guardar subset
    const outputPath = path.join(outputDir, 'flag-icons-subset.css');
    fs.writeFileSync(outputPath, subsetCSS);
    
    console.log(`✅ Subset generado: ${(subsetCSS.length / 1024).toFixed(1)} KB`);
    console.log(`💾 Ahorro: ${((fullCSS.length - subsetCSS.length) / 1024).toFixed(1)} KB`);
    console.log(`📁 Guardado en: ${outputPath}`);
    console.log(`🎯 Países incluidos: ${USED_COUNTRIES.length}`);
    
    return outputPath;
    
  } catch (error) {
    console.error('❌ Error generando subset:', error.message);
    throw error;
  }
}

function extractBaseStyles(css) {
  // Extraer clases base (.fi, .fi-XX genérico, etc.)
  const baseRegex = /\.fi\s*\{[^}]+\}|\.fi:before\s*\{[^}]+\}/g;
  const matches = css.match(baseRegex) || [];
  return matches.join('\n');
}

function extractCountryStyles(css, countries) {
  let countryCSS = '';
  
  countries.forEach(country => {
    // Buscar .fi-XX y .fi-XX:before
    const regex = new RegExp(`\\.fi-${country}\\s*\\{[^}]+\\}|\\.fi-${country}:before\\s*\\{[^}]+\\}`, 'g');
    const matches = css.match(regex) || [];
    if (matches.length > 0) {
      // Corregir rutas para que Vite las pueda resolver
      const correctedMatches = matches.map(match => {
        return match.replace(
          /url\(\.\.\/flags\/4x3\/([^)]+)\)/g, 
          'url("/node_modules/flag-icons/flags/4x3/$1")'
        );
      });
      countryCSS += correctedMatches.join('\n') + '\n';
      console.log(`🏳️  ${country.toUpperCase()}: ${matches.length} estilos`);
    }
  });
  
  return countryCSS;
}

// Ejecutar si se llama directamente
if (require.main === module) {
  generateFlagSubset();
}

module.exports = { generateFlagSubset };
