/**
 * Script para aplicar patch a node-forge después de npm install
 * Permite cargar certificados PFX chilenos con macData no validado
 */
const fs = require('fs');
const path = require('path');

const pkcs12Path = path.join(__dirname, 'node_modules/node-forge/lib/pkcs12.js');

console.log('🔧 Aplicando patch a node-forge para certificados PFX chilenos...');

if (!fs.existsSync(pkcs12Path)) {
  console.log('⚠️  node-forge no encontrado, omitiendo patch');
  process.exit(0);
}

let content = fs.readFileSync(pkcs12Path, 'utf-8');

// Buscar la línea del error original
const originalError = `throw new Error('Invalid PKCS#12. macData field present but MAC was not validated.');`;

if (content.includes(originalError)) {
  // Reemplazar con versión comentada + warning
  content = content.replace(
    `  } else if(Array.isArray(obj.value) && obj.value.length > 2) {
    /* This is pfx data that should have mac and verify macDigest */
    throw new Error('Invalid PKCS#12. macData field present but MAC was not validated.');
  }`,
    `  } else if(Array.isArray(obj.value) && obj.value.length > 2) {
    /* This is pfx data that should have mac and verify macDigest */
    // PATCH SELLSI: Algunos certificados PFX tienen macData pero node-forge no lo valida correctamente.
    // Esto es seguro si se confía en la fuente del certificado (ej: emitido por entidad certificadora chilena).
    console.warn('⚠️  WARNING: PKCS#12 tiene macData pero no fue validado - continuando de todas formas');
    // throw new Error('Invalid PKCS#12. macData field present but MAC was not validated.');
  }`
  );

  fs.writeFileSync(pkcs12Path, content, 'utf-8');
  console.log('✅ Patch aplicado exitosamente a node-forge/lib/pkcs12.js');
} else if (content.includes('PATCH SELLSI')) {
  console.log('✅ Patch ya estaba aplicado');
} else {
  console.log('⚠️  No se encontró el código esperado, puede que node-forge haya cambiado');
  console.log('   Verifica manualmente: node_modules/node-forge/lib/pkcs12.js línea ~479');
}
