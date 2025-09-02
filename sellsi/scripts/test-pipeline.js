#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 PIPELINE COMPLETO DE TESTING - SISTEMA DE OFERTAS\n');

const runCommand = (command, description) => {
  console.log(`\n📋 ${description}`);
  console.log(`🔧 Ejecutando: ${command}\n`);
  
  try {
    execSync(command, { 
      stdio: 'inherit', 
      cwd: path.resolve(__dirname, '..') 
    });
    console.log(`✅ ${description} - COMPLETADO\n`);
    return true;
  } catch (error) {
    console.log(`❌ ${description} - FALLÓ\n`);
    console.error(error.message);
    return false;
  }
};

async function runTestPipeline() {
  const results = {
    lint: false,
    unit: false,
    integration: false,
    build: false,
    e2e: false
  };

  console.log('🚀 Iniciando pipeline de testing...\n');

  // 1. Linting y validación de código
  results.lint = runCommand(
    'npm run lint', 
    'LINTING Y VALIDACIÓN DE CÓDIGO'
  );

  // 2. Tests unitarios
  results.unit = runCommand(
    'npx jest --testPathPattern="unit" --coverage --coverageDirectory=coverage/unit',
    'TESTS UNITARIOS'
  );

  // 3. Tests de integración
  results.integration = runCommand(
    'npx jest --testPathPattern="integration" --coverage --coverageDirectory=coverage/integration',
    'TESTS DE INTEGRACIÓN'
  );

  // 4. Build de la aplicación
  results.build = runCommand(
    'npm run build',
    'BUILD DE APLICACIÓN'
  );

  // 5. Tests E2E (solo si build fue exitoso)
  if (results.build) {
    results.e2e = runCommand(
      'npx playwright test',
      'TESTS END-TO-END (E2E)'
    );
  } else {
    console.log('⚠️  TESTS E2E - OMITIDOS (build falló)\n');
  }

  // Resumen final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DEL PIPELINE DE TESTING');
  console.log('='.repeat(60));
  
  const status = (passed) => passed ? '✅ PASSED' : '❌ FAILED';
  
  console.log(`Linting:          ${status(results.lint)}`);
  console.log(`Tests Unitarios:  ${status(results.unit)}`);
  console.log(`Tests Integración:${status(results.integration)}`);
  console.log(`Build:            ${status(results.build)}`);
  console.log(`Tests E2E:        ${results.build ? status(results.e2e) : '⚠️  SKIPPED'}`);
  
  const totalTests = Object.values(results).filter(Boolean).length;
  const totalPossible = results.build ? 5 : 4;
  
  console.log('\n' + '-'.repeat(60));
  console.log(`TOTAL: ${totalTests}/${totalPossible} tests passed`);
  
  if (totalTests === totalPossible) {
    console.log('🎉 ¡TODOS LOS TESTS PASARON! El sistema está listo para producción.');
    process.exit(0);
  } else {
    console.log('⚠️  Algunos tests fallaron. Revisa los errores antes de continuar.');
    process.exit(1);
  }
}

// Ejecutar pipeline
runTestPipeline().catch(error => {
  console.error('❌ Error en pipeline de testing:', error);
  process.exit(1);
});
