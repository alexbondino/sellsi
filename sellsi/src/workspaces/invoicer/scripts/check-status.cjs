/**
 * Script para consultar estado de un envío DTE en el SII
 * Consulta el estado de un Track ID obtenido previamente
 */

const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { DOMParser } = require('@xmldom/xmldom');

// Importar servicios
const { SiiAuthService } = require('../dist/services/sii-auth.service');
const { SignatureService } = require('../dist/services/signature.service');

// Configuración
const CERT_PATH = path.join(__dirname, '../folio/Certificado E-Certchile.pfx');
const CERT_PASSWORD = 'fedenetz2025';
const RUT_EMISOR = '76963446-0';
const AMBIENTE = 'CERT'; // o 'PROD'
const SII_BASE_URL = 'https://maullin.sii.cl'; // CERT
// const SII_BASE_URL = 'https://palena.sii.cl'; // PROD

/**
 * Consulta el estado de un envío usando Track ID
 */
async function consultarEstado(trackId, token, rutEmisor, rutEnvia = '17616124-8') {
  try {
    console.log('\n📊 CONSULTANDO ESTADO DEL ENVÍO...');
    console.log(`   Track ID: ${trackId}`);
    console.log(`   RUT Emisor: ${rutEmisor}`);
    console.log(`   RUT Envía: ${rutEnvia}`);

    // Preparar parámetros
    const [rutNumEmisor, dvEmisor] = rutEmisor.split('-');
    const [rutNumEnvia, dvEnvia] = rutEnvia.split('-');

    // Construir URL con parámetros
    // Nota: El SII tiene endpoints inconsistentes, probar ambas variantes
    const url = `${SII_BASE_URL}/cgi_dte/UPL/DTEQueryEstUp.cgi`;
    const params = {
      RUT_EMPRESA: rutNumEmisor,
      DV_EMPRESA: dvEmisor,
      RUT_ENVIA: rutNumEnvia,
      DV_ENVIA: dvEnvia,
      TRACK_ID: trackId,
      ESTADO: '', // Vacío para consultar cualquier estado
    };

    console.log('\n🔍 Parámetros de consulta:', params);

    const response = await axios.get(url, {
      params,
      headers: {
        'User-Agent': 'Mozilla/4.0 (compatible; PROG 1.0; Windows NT)',
        Cookie: `TOKEN=${token}`,
      },
      timeout: 30000,
    });

    console.log('\n============================================================');
    console.log('📡 RESPUESTA DEL SII (QUERY):');
    console.log('Status:', response.status);
    console.log('Body:', response.data);
    console.log('============================================================\n');

    // Parsear respuesta XML
    const doc = new DOMParser().parseFromString(response.data, 'text/xml');
    
    // Extraer información
    const estado = doc.getElementsByTagName('ESTADO')[0]?.textContent;
    const trackIdResp = doc.getElementsByTagName('TRACKID')[0]?.textContent;
    const numAte = doc.getElementsByTagName('NUMATENCION')[0]?.textContent;
    const estadoEnvio = doc.getElementsByTagName('ESTADOENVIO')[0]?.textContent;
    
    // Buscar errores o glosas
    const errors = doc.getElementsByTagName('ERROR');
    const glosas = doc.getElementsByTagName('GLOSA_ESTADO');

    console.log('📋 RESULTADO DE LA CONSULTA:');
    console.log('   Estado respuesta:', estado);
    console.log('   Track ID:', trackIdResp);
    console.log('   Número de atención:', numAte);
    console.log('   Estado del envío:', estadoEnvio);

    if (errors.length > 0) {
      console.log('\n❌ ERRORES:');
      for (let i = 0; i < errors.length; i++) {
        console.log(`   - ${errors[i].textContent}`);
      }
    }

    if (glosas.length > 0) {
      console.log('\n📝 GLOSAS:');
      for (let i = 0; i < glosas.length; i++) {
        console.log(`   - ${glosas[i].textContent}`);
      }
    }

    // Interpretar estados conocidos
    console.log('\n💡 INTERPRETACIÓN:');
    if (estadoEnvio) {
      switch (estadoEnvio) {
        case 'EPR':
          console.log('   ⏳ ENVÍO EN PROCESO - El SII está validando el documento');
          break;
        case 'DOK':
          console.log('   ✅ DOCUMENTO OK - Validación exitosa, DTE aceptado');
          break;
        case 'RCH':
          console.log('   ❌ RECHAZADO - El documento fue rechazado por el SII');
          break;
        case 'RCT':
          console.log('   ❌ RECHAZADO TOTAL - Todos los documentos del envío fueron rechazados');
          break;
        case 'RFR':
          console.log('   ❌ RECHAZADO CON REPARO - Rechazado con reparos');
          break;
        default:
          console.log(`   ❓ Estado desconocido: ${estadoEnvio}`);
      }
    }

    return {
      estado,
      trackId: trackIdResp,
      numAtencion: numAte,
      estadoEnvio,
    };

  } catch (error) {
    console.error('\n❌ Error al consultar estado:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    throw error;
  }
}

/**
 * Función principal
 */
async function main() {
  try {
    console.log('\n🚀 CONSULTA DE ESTADO DE ENVÍO DTE\n');
    console.log('============================================================\n');

    // Leer Track ID desde argumentos o usar uno por defecto
    const trackId = process.argv[2] || '0244601576';
    
    console.log(`📍 Track ID a consultar: ${trackId}\n`);

    // ========================================
    // PASO 1: Autenticación
    // ========================================
    console.log('🔑 PASO 1: Autenticando con SII...\n');
    
    const signatureService = new SignatureService();
    const certBuffer = fs.readFileSync(CERT_PATH);
    const certBase64 = certBuffer.toString('base64');
    await signatureService.loadCertificate(certBase64, CERT_PASSWORD);
    
    // Workaround: asignar RUT manualmente si no está en el certificado
    if (signatureService.certificate && !signatureService.certificate.subject.serialNumber) {
      signatureService.certificate.subject.serialNumber = RUT_EMISOR;
    }
    
    const authService = new SiiAuthService(signatureService, AMBIENTE);
    const token = await authService.getToken();
    
    console.log(`   ✅ Token obtenido: ${token.substring(0, 10)}...\n`);

    // ========================================
    // PASO 2: Consultar estado
    // ========================================
    console.log('📊 PASO 2: Consultando estado del envío...\n');
    
    const resultado = await consultarEstado(trackId, token, RUT_EMISOR);

    console.log('\n============================================================');
    console.log('✅ CONSULTA COMPLETADA\n');
    console.log('Resumen:');
    console.log(`   Track ID: ${resultado.trackId}`);
    console.log(`   Estado: ${resultado.estadoEnvio}`);
    console.log(`   Número atención: ${resultado.numAtencion}`);
    console.log('============================================================\n');

  } catch (error) {
    console.error('\n❌ ERROR EN CONSULTA:', error.message);
    if (error.stack) {
      console.error('\nStack:', error.stack);
    }
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { consultarEstado };
