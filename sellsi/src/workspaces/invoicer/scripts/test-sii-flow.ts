/**
 * 🧪 TEST DE INTEGRACIÓN MANUAL - FACTURADOR SII
 * 
 * Script de prueba de flujo completo con archivos reales:
 * - Certificado digital (.pfx)
 * - CAF XML del SII (tipo 34)
 * 
 * Ambiente: CERTIFICACIÓN (maullin.sii.cl)
 * 
 * ⚠️ PREREQUISITOS OBLIGATORIOS:
 * 
 * 1. Archivos reales en folio/:
 *    - folio/Certificado E-Certchile.pfx
 *    - folio/FoliosSII76963446341202512161636.xml
 * 
 * 2. Compilar ANTES de ejecutar:
 *    npm run build  (o npx tsc)
 *    El script importa desde ../dist/services/ - si no compilas, fallará
 * 
 * 3. Instalar dependencias:
 *    npm install
 * 
 * Ejecución:
 *   npx ts-node scripts/test-sii-flow.ts
 * 
 * Objetivo:
 *   Validar autenticación → Construcción DTE → Firma XMLDSig → Guardado
 *   SIN enviar al SII (para evitar consumo innecesario de folios)
 * 
 * @author Sellsi Invoicer Team
 * @date 2025-12-16
 */

import * as fs from 'fs';
import * as path from 'path';
import { SignatureService } from '../dist/services/signature.service.js';
import { SiiAuthService } from '../dist/services/sii-auth.service.js';
import { DteBuilderService } from '../dist/services/dte-builder.service.js';
import { CafManagerService } from '../dist/services/caf-manager.service.js';

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const CONFIG = {
  CERT_PATH: './folio/Certificado E-Certchile.pfx',
  CERT_PASSWORD: 'fedenetz2025',
  CAF_PATH: './folio/FoliosSII76963446341202512161636.xml',
  RUT_EMISOR: '76963446-0',
  RAZON_SOCIAL: 'CATRIÑIR SPA',
  OUTPUT_DIR: './output',
  FOLIO_COUNTER_FILE: './.folio-counter.json',
};

// ============================================================================
// HELPER: CONTADOR DE FOLIOS
// ============================================================================

interface FolioCounter {
  [tipoDte: string]: {
    current: number;
    min: number;
    max: number;
  };
}

class FolioCounterManager {
  private counterPath: string;
  private counter: FolioCounter;

  constructor(counterPath: string) {
    this.counterPath = counterPath;
    this.counter = this.load();
  }

  private load(): FolioCounter {
    if (!fs.existsSync(this.counterPath)) {
      return {};
    }

    try {
      const data = fs.readFileSync(this.counterPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.warn('⚠️  Error leyendo contador de folios, creando nuevo:', error);
      return {};
    }
  }

  private save(): void {
    fs.writeFileSync(this.counterPath, JSON.stringify(this.counter, null, 2), 'utf-8');
  }

  /**
   * Inicializa el contador para un tipo DTE si no existe
   */
  initIfNotExists(tipoDte: number, min: number, max: number): void {
    const key = tipoDte.toString();
    if (!this.counter[key]) {
      this.counter[key] = {
        current: min,
        min,
        max,
      };
      this.save();
    }
  }

  /**
   * Obtiene el siguiente folio y lo incrementa
   */
  getNext(tipoDte: number): number {
    const key = tipoDte.toString();
    
    if (!this.counter[key]) {
      throw new Error(`Tipo DTE ${tipoDte} no inicializado. Llame a initIfNotExists() primero.`);
    }

    const current = this.counter[key].current;
    
    if (current > this.counter[key].max) {
      throw new Error(
        `Folios agotados para tipo ${tipoDte}. Rango: ${this.counter[key].min}-${this.counter[key].max}`
      );
    }

    // Incrementar para próxima ejecución
    this.counter[key].current = current + 1;
    this.save();

    return current;
  }

  /**
   * Obtiene el folio actual sin incrementar
   */
  getCurrent(tipoDte: number): number {
    const key = tipoDte.toString();
    return this.counter[key]?.current || 0;
  }

  /**
   * Reinicia el contador (útil para debugging)
   */
  reset(tipoDte: number): void {
    const key = tipoDte.toString();
    if (this.counter[key]) {
      this.counter[key].current = this.counter[key].min;
      this.save();
    }
  }

  /**
   * Obtiene estadísticas de uso
   */
  getStats(tipoDte: number): { current: number; min: number; max: number; disponibles: number } | null {
    const key = tipoDte.toString();
    if (!this.counter[key]) return null;

    const { current, min, max } = this.counter[key];
    return {
      current,
      min,
      max,
      disponibles: max - current + 1,
    };
  }
}

// ============================================================================
// HELPERS GENERALES
// ============================================================================

function ensureOutputDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadPfxAsBase64(pfxPath: string): string {
  const pfxBuffer = fs.readFileSync(pfxPath);
  return pfxBuffer.toString('base64');
}

function formatRut(rut: string): string {
  // Formato: 76963446-0
  const cleaned = rut.replace(/[^\dkK]/g, '');
  if (cleaned.length < 2) return rut;

  const dv = cleaned.slice(-1);
  const num = cleaned.slice(0, -1);
  return `${num}-${dv}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// FUNCIÓN PRINCIPAL
// ============================================================================

async function main(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 TEST DE INTEGRACIÓN SII - SELLSI INVOICER');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`📅 Fecha: ${new Date().toISOString()}`);
  console.log(`🌍 Ambiente: CERTIFICACIÓN (maullin.sii.cl)`);
  console.log(`📂 Directorio de salida: ${CONFIG.OUTPUT_DIR}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  ensureOutputDir(CONFIG.OUTPUT_DIR);

  try {
    // ────────────────────────────────────────────────────────────────────
    // PASO 0: VERIFICAR ARCHIVOS
    // ────────────────────────────────────────────────────────────────────
    console.log('📋 PASO 0: Verificación de archivos\n');

    if (!fs.existsSync(CONFIG.CERT_PATH)) {
      throw new Error(`Certificado no encontrado: ${CONFIG.CERT_PATH}`);
    }
    console.log(`   ✅ Certificado: ${CONFIG.CERT_PATH}`);

    if (!fs.existsSync(CONFIG.CAF_PATH)) {
      throw new Error(`CAF no encontrado: ${CONFIG.CAF_PATH}`);
    }
    console.log(`   ✅ CAF: ${CONFIG.CAF_PATH}\n`);

    // ────────────────────────────────────────────────────────────────────
    // PASO 1: PARSEAR CAF
    // ────────────────────────────────────────────────────────────────────
    console.log('📄 PASO 1: Parsear CAF\n');

    const cafManager = new CafManagerService();
    const cafXml = fs.readFileSync(CONFIG.CAF_PATH, 'utf-8');
    const cafData = cafManager.parseCAF(cafXml);

    console.log(`   Emisor: ${cafData.rutEmisor}`);
    console.log(`   Tipo DTE: ${cafData.tipoDte} (${getTipoDteNombre(cafData.tipoDte)})`);
    console.log(`   Rango: ${cafData.folioDesde} - ${cafData.folioHasta}`);
    console.log(`   Fecha Autorización: ${cafData.fechaAutorizacion}`);
    console.log(`   Total folios: ${cafData.folioHasta - cafData.folioDesde + 1}\n`);
    
    // Calcular vencimiento (6 meses para boletas, 2 años para facturas)
    const mesesVencimiento = [39, 41].includes(cafData.tipoDte) ? 6 : 24;
    const fechaVenc = new Date(cafData.fechaAutorizacion);
    fechaVenc.setMonth(fechaVenc.getMonth() + mesesVencimiento);
    console.log(`   Vencimiento estimado: ${fechaVenc.toISOString().split('T')[0]}\n`);

    // Verificar que el RUT coincide
    if (cafData.rutEmisor !== CONFIG.RUT_EMISOR) {
      throw new Error(
        `RUT del CAF (${cafData.rutEmisor}) no coincide con CONFIG.RUT_EMISOR (${CONFIG.RUT_EMISOR})`
      );
    }

    // ────────────────────────────────────────────────────────────────────
    // PASO 2: INICIALIZAR CONTADOR DE FOLIOS
    // ────────────────────────────────────────────────────────────────────
    console.log('🔢 PASO 2: Gestión de Folios\n');

    const folioCounter = new FolioCounterManager(CONFIG.FOLIO_COUNTER_FILE);
    folioCounter.initIfNotExists(cafData.tipoDte, cafData.folioDesde, cafData.folioHasta);

    const stats = folioCounter.getStats(cafData.tipoDte);
    if (!stats) {
      throw new Error('Error obteniendo estadísticas de folios');
    }

    console.log(`   Folio actual: ${stats.current}`);
    console.log(`   Folios disponibles: ${stats.disponibles}`);

    const folioActual = folioCounter.getNext(cafData.tipoDte);
    console.log(`\n   ℹ️  Usando Folio de prueba N°: ${folioActual}`);
    console.log(`   ℹ️  Próximo folio será: ${folioCounter.getCurrent(cafData.tipoDte)}\n`);

    // ────────────────────────────────────────────────────────────────────
    // PASO 3: AUTENTICACIÓN
    // ────────────────────────────────────────────────────────────────────
    console.log('🔐 PASO 3: Autenticación con SII\n');

    console.log('   Cargando certificado.pfx...');
    const signatureService = new SignatureService();
    const pfxBase64 = loadPfxAsBase64(CONFIG.CERT_PATH);

    const certInfo = await signatureService.loadCertificate(pfxBase64, CONFIG.CERT_PASSWORD);
    console.log(`   ✅ Certificado cargado`);
    console.log(`      RUT: ${certInfo.subject.serialNumber}`);
    console.log(`      Titular: ${certInfo.subject.commonName}`);
    console.log(`      Organización: ${certInfo.subject.organization || 'N/A'}`);
    console.log(`      Válido desde: ${certInfo.validity.notBefore.toISOString()}`);
    console.log(`      Válido hasta: ${certInfo.validity.notAfter.toISOString()}\n`);

    console.log('   Obteniendo token SII (GetSeed → SignSeed → GetToken)...');
    const authService = new SiiAuthService(signatureService, 'CERT');
    const token = await authService.getToken();
    console.log(`   ✅ TOKEN OBTENIDO: ${token.substring(0, 60)}...`);
    console.log(`      Longitud: ${token.length} caracteres`);
    console.log(`      Válido por: ~60 minutos\n`);

    // ────────────────────────────────────────────────────────────────────
    // PASO 4: CONSTRUCCIÓN DTE
    // ────────────────────────────────────────────────────────────────────
    console.log('🧾 PASO 4: Construcción del DTE\n');

    const dteBuilder = new DteBuilderService();

    // Contexto del emisor (EmisorContext según types/certificate.types.d.ts)
    const emisor = {
      supplierId: 'manual-test', // ID ficticio para test manual
      rutEmisor: CONFIG.RUT_EMISOR,
      razonSocial: CONFIG.RAZON_SOCIAL,
      giro: 'Servicios de software y tecnología',
      direccion: 'Av. Libertador Bernardo O\'Higgins 1449',
      comuna: 'Santiago',
      ciudad: 'Santiago',
      actEco: [620200], // Desarrollo de software
      ambiente: 'CERT' as const,
      certificate: certInfo, // Incluir certificado cargado
    };

    // Para prueba: Emisor = Receptor (evita errores de RUT inválido)
    const receptor = {
      rut: formatRut(CONFIG.RUT_EMISOR),
      razonSocial: CONFIG.RAZON_SOCIAL,
      giro: 'Servicios de software',
      direccion: 'Av. Libertador Bernardo O\'Higgins 1449',
      comuna: 'Santiago',
      ciudad: 'Santiago',
    };

    console.log('   Construyendo DTE...');
    console.log(`      Tipo: ${cafData.tipoDte} (${getTipoDteNombre(cafData.tipoDte)})`);
    console.log(`      Folio: ${folioActual}`);
    console.log(`      Emisor: ${emisor.rutEmisor} - ${emisor.razonSocial}`);
    console.log(`      Receptor: ${receptor.rut} - ${receptor.razonSocial}\n`);

    const dteInput = {
      tipoDte: cafData.tipoDte,
      folio: folioActual,
      fechaEmision: new Date(),
      receptor: {
        rut: receptor.rut,
        razonSocial: receptor.razonSocial,
        giro: receptor.giro,
        direccion: receptor.direccion,
        comuna: receptor.comuna,
        ciudad: receptor.ciudad,
      },
      items: [
        {
          nombre: 'Producto de Prueba - TEST SII',
          descripcion: 'Item de prueba para validación de integración con SII',
          cantidad: 1,
          unidad: 'UN',
          precioUnitario: 10000,
          exento: cafData.tipoDte === 34, // Exento solo si es tipo 34
        },
        {
          nombre: 'Servicio de Testing',
          descripcion: 'Servicio técnico de validación',
          cantidad: 2,
          unidad: 'HRS',
          precioUnitario: 25000,
          exento: cafData.tipoDte === 34,
        },
      ],
      medioPago: 'EF' as const, // Efectivo
      observaciones: 'Documento de prueba - Ambiente de Certificación SII',
    };

    const dteResult = dteBuilder.buildDTE(dteInput, emisor, cafData);
    
    console.log(`   ✅ DTE construido exitosamente`);
    console.log(`      ID: ${dteResult.dteId}`);
    console.log(`      Total Neto: $${dteResult.totales.montoNeto || 0}`);
    console.log(`      IVA: $${dteResult.totales.iva || 0}`);
    console.log(`      Total: $${dteResult.totales.montoTotal}`);
    console.log(`      TED generado: ${dteResult.ted ? 'Sí' : 'No'}\n`);

    // Verificar que TED existe
    if (!dteResult.ted) {
      throw new Error('❌ CRÍTICO: TED no generado. El timbre electrónico es OBLIGATORIO.');
    }

    console.log(`   ✅ TED (Timbre Electrónico) generado correctamente`);
    console.log(`      Versión TED: ${dteResult.ted.version}`);
    console.log(`      Folio: ${dteResult.ted.dd.f}`);
    console.log(`      Longitud FRMT: ${dteResult.ted.frmt?.length || 0} caracteres\n`);

    // ────────────────────────────────────────────────────────────────────
    // PASO 5: FIRMA XMLDSig
    // ────────────────────────────────────────────────────────────────────
    console.log('🔏 PASO 5: Firma Digital XMLDSig\n');

    console.log(`   Firmando DTE (ID: ${dteResult.dteId})...`);
    const dteFirmado = signatureService.signDte(dteResult.dteXml, dteResult.dteId);
    console.log(`   ✅ DTE firmado exitosamente\n`);

    // ────────────────────────────────────────────────────────────────────
    // PASO 6: GUARDADO
    // ────────────────────────────────────────────────────────────────────
    console.log('💾 PASO 6: Guardado de archivos\n');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const outputPath = path.join(
      CONFIG.OUTPUT_DIR,
      `DTE-${cafData.tipoDte}-F${folioActual}-${timestamp}.xml`
    );

    fs.writeFileSync(outputPath, dteFirmado, 'utf-8');
    console.log(`   ✅ XML firmado guardado: ${outputPath}`);

    // Guardar también metadata en JSON
    const metadataPath = outputPath.replace('.xml', '.meta.json');
    const metadata = {
      timestamp: new Date().toISOString(),
      tipoDte: cafData.tipoDte,
      tipoDteNombre: getTipoDteNombre(cafData.tipoDte),
      folio: folioActual,
      emisor: {
        rut: emisor.rutEmisor,
        razonSocial: emisor.razonSocial,
      },
      receptor: {
        rut: receptor.rut,
        razonSocial: receptor.razonSocial,
      },
      totales: dteResult.totales,
      token: {
        obtenido: true,
        preview: token.substring(0, 40) + '...',
      },
      archivos: {
        xml: path.basename(outputPath),
        metadata: path.basename(metadataPath),
      },
    };

    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
    console.log(`   ✅ Metadata guardada: ${metadataPath}\n`);

    // ────────────────────────────────────────────────────────────────────
    // PASO 7: VALIDACIÓN BÁSICA
    // ────────────────────────────────────────────────────────────────────
    console.log('✔️  PASO 7: Validación Básica del XML\n');

    const hasSignature = dteFirmado.includes('<Signature');
    const hasSignatureValue = dteFirmado.includes('<SignatureValue>');
    const hasEncabezado = dteFirmado.includes('<Encabezado>');
    const hasDetalle = dteFirmado.includes('<Detalle>');
    const hasTED = dteFirmado.includes('<TED');
    const hasFRMT = dteFirmado.includes('<FRMT');

    console.log(`   ${hasSignature ? '✅' : '❌'} Contiene <Signature>`);
    console.log(`   ${hasSignatureValue ? '✅' : '❌'} Contiene <SignatureValue>`);
    console.log(`   ${hasEncabezado ? '✅' : '❌'} Contiene <Encabezado>`);
    console.log(`   ${hasDetalle ? '✅' : '❌'} Contiene <Detalle>`);
    console.log(`   ${hasTED ? '✅' : '❌'} Contiene <TED> (Timbre Electrónico)`);
    console.log(`   ${hasFRMT ? '✅' : '❌'} Contiene <FRMT> (Firma TED)`);

    const allValid = hasSignature && hasSignatureValue && hasEncabezado && hasDetalle && hasTED && hasFRMT;

    if (!allValid) {
      console.log('\n   ⚠️  ADVERTENCIA: El XML no contiene todos los elementos esperados');
    } else {
      console.log('\n   ✅ Todas las validaciones básicas pasaron');
    }

    // ────────────────────────────────────────────────────────────────────
    // RESUMEN FINAL
    // ────────────────────────────────────────────────────────────────────
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ TEST COMPLETADO EXITOSAMENTE');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📄 Archivos generados:`);
    console.log(`   - XML: ${path.basename(outputPath)}`);
    console.log(`   - Metadata: ${path.basename(metadataPath)}`);
    console.log(`\n🎫 Token SII: Válido por ~60 minutos`);
    console.log(`📋 Folio usado: ${folioActual} (Tipo ${cafData.tipoDte})`);
    console.log(`📊 Total documento: $${dteResult.totales.montoTotal}`);
    console.log(`\n📌 SIGUIENTE PASO:`);
    console.log(`   Para ENVIAR al SII, usar SiiClientService.enviarDTE()`);
    console.log(`   (No incluido en este test para evitar consumir folios reales)`);
    console.log(`\n💡 PRÓXIMA EJECUCIÓN:`);
    console.log(`   El próximo folio será: ${folioCounter.getCurrent(cafData.tipoDte)}`);
    console.log(`   Folios restantes: ${stats.disponibles - 1}`);
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error: any) {
    console.error('\n❌ ERROR:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// ============================================================================
// UTILIDADES
// ============================================================================

function getTipoDteNombre(tipoDte: number): string {
  const nombres: Record<number, string> = {
    33: 'Factura Electrónica',
    34: 'Factura No Afecta o Exenta',
    39: 'Boleta Electrónica',
    41: 'Boleta Exenta Electrónica',
    52: 'Guía de Despacho Electrónica',
    56: 'Nota de Débito Electrónica',
    61: 'Nota de Crédito Electrónica',
  };

  return nombres[tipoDte] || `Tipo ${tipoDte}`;
}

// ============================================================================
// EJECUTAR
// ============================================================================

main().catch((error) => {
  console.error('Error fatal:', error);
  process.exit(1);
});
