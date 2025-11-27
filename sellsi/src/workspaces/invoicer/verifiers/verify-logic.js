/**
 * VERIFICACIÓN INDEPENDIENTE DE LÓGICA CRÍTICA
 * Contra especificaciones oficiales del SII
 */

// ===========================================
// 1. ALGORITMO RUT - MÓDULO 11
// Referencia: https://www.sii.cl/ayuda_portal/help/hlp_fec/hlp_rep_ve.htm
// ===========================================

function calcularDV(rutNumber) {
  let suma = 0;
  let multiplicador = 2;
  let rut = rutNumber;

  // Algoritmo Módulo 11: multiplicar por 2,3,4,5,6,7,2,3,4...
  while (rut > 0) {
    suma += (rut % 10) * multiplicador;
    rut = Math.floor(rut / 10);
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }

  const resto = suma % 11;
  const dv = 11 - resto;

  if (dv === 11) return '0';
  if (dv === 10) return 'K';
  return dv.toString();
}

// RUTs PÚBLICOS VERIFICABLES
const rutsConocidos = [
  { numero: 60803000, dvEsperado: 'K', nombre: 'SII (Servicio de Impuestos Internos)' },
  { numero: 76086428, dvEsperado: '5', nombre: 'Empresa ejemplo' },
  { numero: 96963440, dvEsperado: '6', nombre: 'Otra empresa' },
  { numero: 11111111, dvEsperado: '1', nombre: 'Patrón repetitivo' },
  { numero: 12345678, dvEsperado: '5', nombre: 'Secuencial estándar' },
  { numero: 23000000, dvEsperado: 'K', nombre: 'RUT con DV K' },
  { numero: 99500410, dvEsperado: '0', nombre: 'RUT con DV 0' },
  { numero: 5126663, dvEsperado: '3', nombre: 'RUT corto' },
];

console.log('╔══════════════════════════════════════════════════════════════════╗');
console.log('║  VERIFICACIÓN INDEPENDIENTE - LÓGICA SII                         ║');
console.log('╚══════════════════════════════════════════════════════════════════╝\n');

console.log('═══════════════════════════════════════════════════════════════════');
console.log('1. ALGORITMO RUT MÓDULO 11');
console.log('   Referencia: Manual SII, documentación oficial');
console.log('═══════════════════════════════════════════════════════════════════\n');

let rutCorrectos = 0;
for (const rut of rutsConocidos) {
  const dvCalculado = calcularDV(rut.numero);
  const correcto = dvCalculado === rut.dvEsperado;
  if (correcto) rutCorrectos++;
  
  console.log(`   ${rut.nombre}:`);
  console.log(`   RUT: ${rut.numero.toLocaleString('es-CL')}-${rut.dvEsperado}`);
  console.log(`   DV Calculado: ${dvCalculado} | Esperado: ${rut.dvEsperado} | ${correcto ? '✓ OK' : '✗ ERROR'}`);
  console.log('');
}

console.log(`   RESULTADO RUT: ${rutCorrectos}/${rutsConocidos.length} correctos\n`);

// ===========================================
// 2. CÁLCULO IVA 19%
// Referencia: Ley de IVA Chile, Art. 14
// ===========================================

console.log('═══════════════════════════════════════════════════════════════════');
console.log('2. CÁLCULO IVA 19%');
console.log('   Referencia: Ley IVA Chile (19% sobre monto neto)');
console.log('═══════════════════════════════════════════════════════════════════\n');

const casosIva = [
  { neto: 1000, ivaEsperado: 190, desc: '1.000 * 0.19 = 190' },
  { neto: 10000, ivaEsperado: 1900, desc: '10.000 * 0.19 = 1.900' },
  { neto: 100000, ivaEsperado: 19000, desc: '100.000 * 0.19 = 19.000' },
  { neto: 1000000, ivaEsperado: 190000, desc: '1.000.000 * 0.19 = 190.000' },
  { neto: 100, ivaEsperado: 19, desc: '100 * 0.19 = 19 exacto' },
  { neto: 105, ivaEsperado: 20, desc: '105 * 0.19 = 19.95 → 20 (redondeo)' },
  { neto: 101, ivaEsperado: 19, desc: '101 * 0.19 = 19.19 → 19 (redondeo)' },
  { neto: 999, ivaEsperado: 190, desc: '999 * 0.19 = 189.81 → 190 (redondeo)' },
];

let ivaCorrectos = 0;
for (const caso of casosIva) {
  const ivaCalculado = Math.round(caso.neto * 0.19);
  const correcto = ivaCalculado === caso.ivaEsperado;
  if (correcto) ivaCorrectos++;
  
  console.log(`   ${caso.desc}`);
  console.log(`   IVA Calculado: ${ivaCalculado} | Esperado: ${caso.ivaEsperado} | ${correcto ? '✓ OK' : '✗ ERROR'}`);
  console.log('');
}

console.log(`   RESULTADO IVA: ${ivaCorrectos}/${casosIva.length} correctos\n`);

// ===========================================
// 3. CÓDIGOS DTE
// Referencia: Resolución SII Ex. N° 45 de 2003
// ===========================================

console.log('═══════════════════════════════════════════════════════════════════');
console.log('3. CÓDIGOS DTE');
console.log('   Referencia: Resolución Ex. N° 45/2003 SII');
console.log('═══════════════════════════════════════════════════════════════════\n');

const codigosDTE = [
  { codigo: 33, nombre: 'Factura Electrónica' },
  { codigo: 34, nombre: 'Factura No Afecta o Exenta Electrónica' },
  { codigo: 39, nombre: 'Boleta Electrónica' },
  { codigo: 41, nombre: 'Boleta Exenta Electrónica' },
  { codigo: 46, nombre: 'Factura de Compra Electrónica' },
  { codigo: 52, nombre: 'Guía de Despacho Electrónica' },
  { codigo: 56, nombre: 'Nota de Débito Electrónica' },
  { codigo: 61, nombre: 'Nota de Crédito Electrónica' },
  { codigo: 110, nombre: 'Factura de Exportación Electrónica' },
  { codigo: 111, nombre: 'Nota de Débito de Exportación' },
  { codigo: 112, nombre: 'Nota de Crédito de Exportación' },
];

console.log('   Códigos oficiales SII:\n');
for (const dte of codigosDTE) {
  console.log(`   ${dte.codigo.toString().padStart(3, ' ')} - ${dte.nombre}`);
}

// ===========================================
// 4. FORMATO FECHA SII
// Referencia: XSD SII (formato ISO 8601)
// ===========================================

console.log('\n═══════════════════════════════════════════════════════════════════');
console.log('4. FORMATO FECHA SII');
console.log('   Referencia: XSD SII - formato YYYY-MM-DD');
console.log('═══════════════════════════════════════════════════════════════════\n');

const fecha = new Date(2024, 0, 15); // 15 de enero 2024
const formatoSII = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
console.log(`   Fecha: ${fecha.toLocaleDateString('es-CL')}`);
console.log(`   Formato SII: ${formatoSII}`);
console.log(`   Regex validación: /^\\d{4}-\\d{2}-\\d{2}$/`);
console.log(`   Validación: ${/^\d{4}-\d{2}-\d{2}$/.test(formatoSII) ? '✓ OK' : '✗ ERROR'}`);

// ===========================================
// 5. REDONDEO SII
// Referencia: Circular SII - redondeo al entero más cercano
// ===========================================

console.log('\n═══════════════════════════════════════════════════════════════════');
console.log('5. REDONDEO SII');
console.log('   Referencia: Circular SII - ROUND_HALF_UP');
console.log('═══════════════════════════════════════════════════════════════════\n');

const casosRedondeo = [
  { valor: 100.4, esperado: 100, desc: '100.4 → 100 (hacia abajo)' },
  { valor: 100.5, esperado: 101, desc: '100.5 → 101 (hacia arriba - banquero)' },
  { valor: 100.6, esperado: 101, desc: '100.6 → 101 (hacia arriba)' },
  { valor: 100.49, esperado: 100, desc: '100.49 → 100' },
  { valor: 100.51, esperado: 101, desc: '100.51 → 101' },
];

let redondeoCorrectos = 0;
for (const caso of casosRedondeo) {
  const redondeado = Math.round(caso.valor);
  const correcto = redondeado === caso.esperado;
  if (correcto) redondeoCorrectos++;
  
  console.log(`   ${caso.desc}`);
  console.log(`   Calculado: ${redondeado} | Esperado: ${caso.esperado} | ${correcto ? '✓ OK' : '✗ ERROR'}`);
}

console.log(`\n   RESULTADO REDONDEO: ${redondeoCorrectos}/${casosRedondeo.length} correctos\n`);

// ===========================================
// RESUMEN FINAL
// ===========================================

console.log('╔══════════════════════════════════════════════════════════════════╗');
console.log('║  RESUMEN VERIFICACIÓN                                            ║');
console.log('╠══════════════════════════════════════════════════════════════════╣');
console.log(`║  RUT Módulo 11:    ${rutCorrectos}/${rutsConocidos.length} correctos                                  ║`);
console.log(`║  Cálculo IVA 19%:  ${ivaCorrectos}/${casosIva.length} correctos                                   ║`);
console.log(`║  Redondeo SII:     ${redondeoCorrectos}/${casosRedondeo.length} correctos                                   ║`);
console.log('╚══════════════════════════════════════════════════════════════════╝');

const totalCorrectos = rutCorrectos + ivaCorrectos + redondeoCorrectos;
const totalTests = rutsConocidos.length + casosIva.length + casosRedondeo.length;

if (totalCorrectos === totalTests) {
  console.log('\n✓ LÓGICA VERIFICADA: Todos los cálculos coinciden con especificaciones SII');
} else {
  console.log('\n✗ HAY ERRORES EN LA LÓGICA');
}
