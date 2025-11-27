/**
 * Ejecuta todos los verificadores y exporta resultados a Markdown
 * Uso: node run-all-verifiers.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const verifiers = [
  'verify-logic.js',
  'verify-caf-manager-logic.js',
  'verify-dte-builder-logic.js',
  'verify-dte-emission-logic.js',
  'verify-dte-print-logic.js',
  'verify-signature-logic.js',
  'verify-sii-auth-logic.js',
  'verify-sii-client-logic.js',
  'verify-xml-validator-logic.js',
];

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const outputFile = path.join(__dirname, `VERIFICATION_RESULTS_${timestamp}.md`);

let markdown = `# 🔍 Resultados de Verificación - Módulo Facturación SII

**Fecha de ejecución:** ${new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' })}

---

`;

console.log('╔══════════════════════════════════════════════════════════════════╗');
console.log('║  EJECUTANDO TODOS LOS VERIFICADORES                              ║');
console.log('╚══════════════════════════════════════════════════════════════════╝\n');

const results = [];

for (const verifier of verifiers) {
  const verifierPath = path.join(__dirname, verifier);
  
  if (!fs.existsSync(verifierPath)) {
    console.log(`⚠️  ${verifier} no encontrado, saltando...`);
    continue;
  }
  
  console.log(`▶ Ejecutando ${verifier}...`);
  
  try {
    const output = execSync(`node "${verifierPath}"`, {
      encoding: 'utf-8',
      cwd: __dirname,
      timeout: 30000,
    });
    
    // Limpiar caracteres de control ANSI si los hay
    const cleanOutput = output.replace(/\x1b\[[0-9;]*m/g, '');
    
    // Determinar si pasó o falló basándose en el output
    const passed = !cleanOutput.includes('✗ ERROR') && 
                   !cleanOutput.includes('FALLIDA') &&
                   !cleanOutput.includes('HAY ERRORES');
    
    results.push({
      name: verifier,
      passed,
      output: cleanOutput,
    });
    
    console.log(`   ${passed ? '✅' : '❌'} Completado\n`);
    
  } catch (error) {
    results.push({
      name: verifier,
      passed: false,
      output: error.message,
      error: true,
    });
    console.log(`   ❌ Error: ${error.message}\n`);
  }
}

// Generar resumen
const passedCount = results.filter(r => r.passed).length;
const totalCount = results.length;

markdown += `## 📊 Resumen Ejecutivo

| Métrica | Valor |
|---------|-------|
| **Verificadores ejecutados** | ${totalCount} |
| **Verificadores exitosos** | ${passedCount} |
| **Verificadores fallidos** | ${totalCount - passedCount} |
| **Tasa de éxito** | ${((passedCount / totalCount) * 100).toFixed(1)}% |

### Estado por Verificador

| Verificador | Estado |
|-------------|--------|
`;

for (const result of results) {
  const status = result.passed ? '✅ PASS' : '❌ FAIL';
  const name = result.name.replace('verify-', '').replace('-logic.js', '').replace('.js', '');
  markdown += `| \`${name}\` | ${status} |\n`;
}

markdown += `
---

## 📋 Detalle de Verificaciones

`;

// Agregar detalle de cada verificador
for (const result of results) {
  const name = result.name.replace('verify-', '').replace('-logic.js', '').replace('.js', '');
  const status = result.passed ? '✅ PASS' : '❌ FAIL';
  
  markdown += `### ${status} ${name.toUpperCase()}

\`\`\`
${result.output.trim()}
\`\`\`

---

`;
}

// Agregar conclusión
markdown += `## 🎯 Conclusión

`;

if (passedCount === totalCount) {
  markdown += `✅ **TODAS LAS VERIFICACIONES PASARON EXITOSAMENTE**

El módulo de facturación electrónica cumple con todas las especificaciones del SII:

- ✅ Algoritmo RUT Módulo 11
- ✅ Cálculo IVA 19%
- ✅ Redondeo según normativa SII
- ✅ Gestión de CAF (Código de Autorización de Folios)
- ✅ Construcción de DTE según XSD
- ✅ Flujo de emisión completo
- ✅ Representación impresa según Resolución Ex. N° 45/2003
- ✅ Firma digital XMLDSig (RSA-SHA1, C14N)
- ✅ Autenticación SII (GetSeed → GetToken)
- ✅ Cliente SII (Upload, Tracking, Consulta)
- ✅ Schemas XSD oficiales

**El módulo está listo para certificación con el SII.**
`;
} else {
  markdown += `⚠️ **ALGUNAS VERIFICACIONES FALLARON**

Se requiere revisión de los siguientes componentes:

`;
  for (const result of results) {
    if (!result.passed) {
      markdown += `- ❌ ${result.name}\n`;
    }
  }
}

markdown += `
---

*Generado automáticamente por \`run-all-verifiers.js\`*
`;

// Guardar archivo
fs.writeFileSync(outputFile, markdown, 'utf-8');

console.log('╔══════════════════════════════════════════════════════════════════╗');
console.log('║  RESUMEN FINAL                                                   ║');
console.log('╠══════════════════════════════════════════════════════════════════╣');
console.log(`║  Verificadores ejecutados: ${totalCount.toString().padEnd(36)}║`);
console.log(`║  Exitosos: ${passedCount.toString().padEnd(50)}║`);
console.log(`║  Fallidos: ${(totalCount - passedCount).toString().padEnd(50)}║`);
console.log('╠══════════════════════════════════════════════════════════════════╣');
console.log(`║  Resultados exportados a:                                        ║`);
console.log(`║  ${path.basename(outputFile).padEnd(62)}║`);
console.log('╚══════════════════════════════════════════════════════════════════╝');

if (passedCount === totalCount) {
  console.log('\n✅ TODAS LAS VERIFICACIONES PASARON');
} else {
  console.log('\n⚠️  ALGUNAS VERIFICACIONES FALLARON');
  process.exit(1);
}
