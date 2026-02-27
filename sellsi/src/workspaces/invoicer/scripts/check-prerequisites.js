#!/usr/bin/env node
/**
 * 🔍 VERIFICADOR DE PREREQUISITOS - Test SII Flow
 * 
 * Verifica que todo esté listo antes de ejecutar test-sii-flow.ts
 * 
 * Uso:
 *   node scripts/check-prerequisites.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('═══════════════════════════════════════════════════════════');
console.log('🔍 VERIFICACIÓN DE PREREQUISITOS - Test SII Flow');
console.log('═══════════════════════════════════════════════════════════\n');

// Cambiar al directorio raíz del módulo invoicer
const rootDir = path.join(__dirname, '..');
process.chdir(rootDir);

let allGood = true;

// ============================================================================
// 1. VERIFICAR ARCHIVOS REALES
// ============================================================================

console.log('📋 PASO 1: Verificar archivos reales\n');

const certPath = './folio/Certificado E-Certchile.pfx';
const cafPath = './folio/FoliosSII76963446341202512161636.xml';

if (fs.existsSync(certPath)) {
  const stats = fs.statSync(certPath);
  console.log(`   ✅ Certificado encontrado: ${certPath}`);
  console.log(`      Tamaño: ${(stats.size / 1024).toFixed(2)} KB`);
} else {
  console.log(`   ❌ FALTA: ${certPath}`);
  console.log(`      Mueve tu certificado a la carpeta folio/\n`);
  allGood = false;
}

if (fs.existsSync(cafPath)) {
  const stats = fs.statSync(cafPath);
  console.log(`   ✅ CAF encontrado: ${cafPath}`);
  console.log(`      Tamaño: ${(stats.size / 1024).toFixed(2)} KB\n`);
} else {
  console.log(`   ❌ FALTA: ${cafPath}`);
  console.log(`      Mueve tu CAF a la carpeta folio/\n`);
  allGood = false;
}

// ============================================================================
// 2. VERIFICAR COMPILACIÓN
// ============================================================================

console.log('🔨 PASO 2: Verificar compilación TypeScript\n');

const distPath = './dist';
const servicesPath = './dist/services';

if (!fs.existsSync(distPath)) {
  console.log(`   ❌ FALTA: Carpeta dist/ no existe`);
  console.log(`      Ejecuta: npm run build (o npx tsc)\n`);
  allGood = false;
} else {
  console.log(`   ✅ Carpeta dist/ existe`);
  
  const requiredServices = [
    'signature.service.js',
    'sii-auth.service.js',
    'dte-builder.service.js',
    'caf-manager.service.js',
  ];

  let servicesOk = true;
  for (const service of requiredServices) {
    const servicePath = path.join(servicesPath, service);
    if (fs.existsSync(servicePath)) {
      console.log(`   ✅ ${service}`);
    } else {
      console.log(`   ❌ FALTA: ${service}`);
      servicesOk = false;
    }
  }

  if (!servicesOk) {
    console.log(`\n   ⚠️  Algunos servicios no compilados`);
    console.log(`      Ejecuta: npm run build (o npx tsc)\n`);
    allGood = false;
  } else {
    console.log(`   ✅ Todos los servicios compilados\n`);
  }
}

// ============================================================================
// 3. VERIFICAR NODE_MODULES
// ============================================================================

console.log('📦 PASO 3: Verificar dependencias\n');

if (!fs.existsSync('./node_modules')) {
  console.log(`   ❌ FALTA: Carpeta node_modules/`);
  console.log(`      Ejecuta: npm install\n`);
  allGood = false;
} else {
  console.log(`   ✅ Dependencias instaladas\n`);
}

// ============================================================================
// 4. VERIFICAR CARPETA OUTPUT
// ============================================================================

console.log('📂 PASO 4: Verificar carpeta de salida\n');

if (!fs.existsSync('./output')) {
  console.log(`   ℹ️  Carpeta output/ no existe (se creará automáticamente)`);
} else {
  console.log(`   ✅ Carpeta output/ existe`);
}

console.log('');

// ============================================================================
// RESUMEN FINAL
// ============================================================================

console.log('═══════════════════════════════════════════════════════════');

if (allGood) {
  console.log('✅ TODOS LOS PREREQUISITOS CUMPLIDOS');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('\n🚀 Puedes ejecutar el test ahora:');
  console.log('   npx ts-node scripts/test-sii-flow.ts\n');
  process.exit(0);
} else {
  console.log('❌ PREREQUISITOS FALTANTES');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('\n⚠️  Corrige los errores arriba antes de ejecutar el test.\n');
  console.log('Pasos rápidos:');
  console.log('  1. Mueve certificado y CAF a folio/');
  console.log('  2. npm install');
  console.log('  3. npm run build (o npx tsc)');
  console.log('  4. node scripts/check-prerequisites.js (verificar de nuevo)');
  console.log('  5. npx ts-node scripts/test-sii-flow.ts\n');
  process.exit(1);
}
