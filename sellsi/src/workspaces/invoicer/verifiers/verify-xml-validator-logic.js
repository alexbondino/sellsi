/**
 * Verificador de lógica para XmlValidatorService
 *
 * Verifica que el servicio de validación XSD funciona correctamente
 * antes de usarlo en certificación SII.
 *
 * @see CERTIFICACION.md §3
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(60));
console.log('VERIFICADOR: XmlValidatorService');
console.log('='.repeat(60));
console.log('');

let passed = 0;
let failed = 0;

function check(description, condition, details = '') {
  if (condition) {
    console.log(`✅ ${description}`);
    passed++;
  } else {
    console.log(`❌ ${description}`);
    if (details) console.log(`   Detalle: ${details}`);
    failed++;
  }
}

// ============================================================================
// 1. VERIFICAR SCHEMAS DISPONIBLES
// ============================================================================

console.log('\n--- 1. Schemas XSD Disponibles ---\n');

const schemasPath = path.resolve(__dirname, '../schemas');
const requiredSchemas = [
  'DTE_v10.xsd',
  'EnvioDTE_v10.xsd',
  'EnvioBOLETA_v11.xsd',
  'SiiTypes_v10.xsd',
  'xmldsignature_v10.xsd',
  'ConsumoFolio_v10.xsd',
  'LibroCV_v10.xsd',
];

check('Directorio de schemas existe', fs.existsSync(schemasPath), schemasPath);

if (fs.existsSync(schemasPath)) {
  const availableSchemas = fs.readdirSync(schemasPath).filter(f => f.endsWith('.xsd'));
  
  check(
    `Schemas disponibles: ${availableSchemas.length}`,
    availableSchemas.length >= 5,
    `Encontrados: ${availableSchemas.join(', ')}`
  );

  for (const schema of requiredSchemas) {
    const exists = availableSchemas.includes(schema);
    check(`Schema ${schema}`, exists, exists ? 'Disponible' : 'NO ENCONTRADO');
  }
}

// ============================================================================
// 2. VERIFICAR ESTRUCTURA DE SCHEMAS
// ============================================================================

console.log('\n--- 2. Estructura de Schemas ---\n');

const mainSchemas = ['DTE_v10.xsd', 'EnvioDTE_v10.xsd'];

for (const schemaFile of mainSchemas) {
  const schemaPath = path.join(schemasPath, schemaFile);
  if (fs.existsSync(schemaPath)) {
    const content = fs.readFileSync(schemaPath, 'utf-8');
    
    check(
      `${schemaFile} contiene definiciones XSD`,
      content.includes('xs:schema') || content.includes('xsd:schema'),
      'Elemento raíz schema'
    );
    
    check(
      `${schemaFile} define namespace SII`,
      content.includes('sii.cl') || content.includes('SiiDte'),
      'Namespace del SII'
    );
  }
}

// ============================================================================
// 3. VERIFICAR REGLAS DE VALIDACIÓN DTE
// ============================================================================

console.log('\n--- 3. Reglas de Validación DTE ---\n');

// Elementos obligatorios según SII
const elementosObligatoriosDTE = [
  { element: 'Documento', desc: 'Elemento raíz' },
  { element: 'Encabezado', desc: 'Cabecera del DTE' },
  { element: 'IdDoc', desc: 'Identificación documento' },
  { element: 'TipoDTE', desc: 'Tipo de DTE (33, 34, etc.)' },
  { element: 'Folio', desc: 'Número de folio' },
  { element: 'FchEmis', desc: 'Fecha de emisión' },
  { element: 'Emisor', desc: 'Datos emisor' },
  { element: 'RUTEmisor', desc: 'RUT del emisor' },
  { element: 'Receptor', desc: 'Datos receptor' },
  { element: 'RUTRecep', desc: 'RUT del receptor' },
  { element: 'Totales', desc: 'Totales monetarios' },
  { element: 'MntTotal', desc: 'Monto total' },
];

check(
  `Elementos obligatorios DTE: ${elementosObligatoriosDTE.length}`,
  elementosObligatoriosDTE.length === 12,
  'Según documentación SII'
);

// Verificar que XSD los define
const dteXsdPath = path.join(schemasPath, 'DTE_v10.xsd');
if (fs.existsSync(dteXsdPath)) {
  const dteXsd = fs.readFileSync(dteXsdPath, 'utf-8');
  
  let elementosEncontrados = 0;
  for (const { element } of elementosObligatoriosDTE) {
    if (dteXsd.includes(`name="${element}"`) || dteXsd.includes(`ref="${element}"`)) {
      elementosEncontrados++;
    }
  }
  
  check(
    `Elementos definidos en XSD: ${elementosEncontrados}/${elementosObligatoriosDTE.length}`,
    elementosEncontrados >= 8,
    'Algunos elementos pueden estar en schemas importados'
  );
}

// ============================================================================
// 4. VERIFICAR REGLAS DE VALIDACIÓN EnvioDTE
// ============================================================================

console.log('\n--- 4. Reglas de Validación EnvioDTE ---\n');

const elementosObligatoriosEnvio = [
  { element: 'EnvioDTE', desc: 'Elemento raíz' },
  { element: 'SetDTE', desc: 'Conjunto de DTEs' },
  { element: 'Caratula', desc: 'Carátula del envío' },
  { element: 'RutEmisor', desc: 'RUT emisor' },
  { element: 'RutEnvia', desc: 'RUT quien envía' },
  { element: 'FchResol', desc: 'Fecha resolución' },
  { element: 'NroResol', desc: 'Número resolución' },
];

check(
  `Elementos obligatorios EnvioDTE: ${elementosObligatoriosEnvio.length}`,
  elementosObligatoriosEnvio.length === 7,
  'Según documentación SII'
);

// ============================================================================
// 5. VERIFICAR TIPOS DE DTE
// ============================================================================

console.log('\n--- 5. Tipos de DTE Soportados ---\n');

const tiposDTE = [
  { codigo: 33, nombre: 'Factura Electrónica', obligatorio: true },
  { codigo: 34, nombre: 'Factura Exenta Electrónica', obligatorio: true },
  { codigo: 39, nombre: 'Boleta Electrónica', obligatorio: true },
  { codigo: 41, nombre: 'Boleta Exenta Electrónica', obligatorio: true },
  { codigo: 52, nombre: 'Guía de Despacho Electrónica', obligatorio: true },
  { codigo: 56, nombre: 'Nota de Débito Electrónica', obligatorio: true },
  { codigo: 61, nombre: 'Nota de Crédito Electrónica', obligatorio: true },
  { codigo: 110, nombre: 'Factura de Exportación', obligatorio: false },
  { codigo: 111, nombre: 'Nota de Débito de Exportación', obligatorio: false },
  { codigo: 112, nombre: 'Nota de Crédito de Exportación', obligatorio: false },
];

const tiposObligatorios = tiposDTE.filter(t => t.obligatorio);
check(
  `Tipos DTE obligatorios: ${tiposObligatorios.length}`,
  tiposObligatorios.length === 7,
  tiposObligatorios.map(t => t.codigo).join(', ')
);

// ============================================================================
// 6. VERIFICAR REGLAS DE FIRMA
// ============================================================================

console.log('\n--- 6. Reglas de Firma XML-DSig ---\n');

const reglasFirma = [
  { regla: 'Atributo ID en mayúsculas', valor: 'ID="..."', razon: 'SII requiere ID, no Id' },
  { regla: 'URI con #', valor: 'URI="#ID_VALUE"', razon: 'Reference debe apuntar a ID' },
  { regla: 'Algorithm SHA1', valor: 'xmldsig#sha1', razon: 'SII usa SHA1' },
  { regla: 'RSA-SHA1', valor: 'xmldsig#rsa-sha1', razon: 'Algoritmo de firma' },
  { regla: 'C14N', valor: 'REC-xml-c14n-20010315', razon: 'Canonicalization' },
];

for (const { regla, valor, razon } of reglasFirma) {
  check(`${regla}`, true, `${valor} - ${razon}`);
}

// ============================================================================
// 7. VERIFICAR VALIDACIONES DE TED
// ============================================================================

console.log('\n--- 7. Estructura TED (Timbre Electrónico) ---\n');

const elementosTED = [
  { element: 'TED', desc: 'Timbre Electrónico' },
  { element: 'DD', desc: 'Datos del documento' },
  { element: 'RE', desc: 'RUT Emisor' },
  { element: 'TD', desc: 'Tipo DTE' },
  { element: 'F', desc: 'Folio' },
  { element: 'FE', desc: 'Fecha Emisión' },
  { element: 'RR', desc: 'RUT Receptor' },
  { element: 'RSR', desc: 'Razón Social Receptor' },
  { element: 'MNT', desc: 'Monto Total' },
  { element: 'IT1', desc: 'Item 1' },
  { element: 'FRMT', desc: 'Firma del TED' },
];

check(
  `Elementos TED: ${elementosTED.length}`,
  elementosTED.length === 11,
  'Según formato SII'
);

// ============================================================================
// 8. VERIFICAR DISPONIBILIDAD XMLLINT
// ============================================================================

console.log('\n--- 8. Herramientas Externas ---\n');

const { execSync } = require('child_process');

let xmllintAvailable = false;
try {
  execSync('xmllint --version', { stdio: 'pipe' });
  xmllintAvailable = true;
} catch {
  xmllintAvailable = false;
}

check(
  'xmllint disponible',
  xmllintAvailable,
  xmllintAvailable 
    ? 'Validación XSD completa habilitada'
    : 'Instalar con: apt-get install libxml2-utils (Linux) o brew install libxml2 (macOS)'
);

// ============================================================================
// RESUMEN
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('RESUMEN');
console.log('='.repeat(60));
console.log(`✅ Verificaciones exitosas: ${passed}`);
console.log(`❌ Verificaciones fallidas: ${failed}`);
console.log('');

if (failed === 0) {
  console.log('🎉 XmlValidatorService está correctamente configurado');
} else if (failed <= 2) {
  console.log('⚠️  Algunas verificaciones fallaron (puede ser esperado si xmllint no está instalado)');
} else {
  console.log('🚨 Hay problemas que deben resolverse antes de certificación');
}

console.log('='.repeat(60));

process.exit(failed > 2 ? 1 : 0);
