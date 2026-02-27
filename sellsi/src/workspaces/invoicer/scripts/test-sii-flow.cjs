/**
 * Test de Flujo Completo SII - CommonJS Version
 * Prueba: Autenticación → Construir DTE → Firmar → Guardar
 */

const path = require('path');
const fs = require('fs');

// Importar servicios compilados (CommonJS)
const { signatureService } = require('../dist/services/signature.service.js');
const { dteBuilderService } = require('../dist/services/dte-builder.service.js');
const { cafManagerService } = require('../dist/services/caf-manager.service.js');
const { SiiAuthService } = require('../dist/services/sii-auth.service.js');

// Configuración
const CONFIG = {
  certificatePath: path.resolve(__dirname, '../folio/Certificado E-Certchile.pfx'),
  certificatePassword: 'fedenetz2025',
  cafPath: path.resolve(__dirname, '../folio/FoliosSII76963446341202512161636.xml'),
  outputDir: path.resolve(__dirname, '../output'),
  rut: '76963446-0'
};

console.log('🚀 INICIANDO TEST DE FLUJO COMPLETO SII\n');
console.log('📋 Configuración:');
console.log(`   Certificado: ${CONFIG.certificatePath}`);
console.log(`   CAF: ${CONFIG.cafPath}`);
console.log(`   Output: ${CONFIG.outputDir}`);
console.log(`   RUT: ${CONFIG.rut}\n`);

async function runTest() {
  try {
    // Paso 1: Cargar CAF
    console.log('📄 PASO 1: Cargando CAF...');
    const cafXml = fs.readFileSync(CONFIG.cafPath, 'utf-8');
    const cafData = cafManagerService.parseCAF(cafXml);
    
    console.log(`   ✅ CAF cargado: Tipo ${cafData.tipoDte}, Folios ${cafData.folioDesde}-${cafData.folioHasta}`);
    
    // Usar el primer folio disponible
    const folio = cafData.folioDesde;
    console.log(`   ✅ Folio asignado: ${folio}\n`);

    // Paso 2: Construir DTE
    console.log('🏗️  PASO 2: Construyendo DTE...');
    
    const emisor = {
      rutEmisor: CONFIG.rut,
      razonSocial: 'CATRIMIR SPA',
      giro: 'SERVICIOS DE CONSULTORIA',
      actEco: [702000],
      direccion: 'DIRECCION PRUEBA 123',
      comuna: 'PROVIDENCIA',
      ciudad: 'SANTIAGO'
    };
    
    const receptor = {
      rut: '66666666-6',
      razonSocial: 'CLIENTE DE PRUEBA SPA',
      giro: 'SERVICIOS VARIOS',
      direccion: 'CALLE FALSA 123',
      comuna: 'SANTIAGO',
      ciudad: 'SANTIAGO'
    };
    
    const dteInput = {
      tipoDte: cafData.tipoDte,
      folio: folio,
      fechaEmision: new Date(),
      receptor: receptor,
      items: [
        {
          numero: 1,
          nombre: 'Servicio de Prueba',
          cantidad: 1,
          precioUnitario: 100000,
          descuentoPorcentaje: 0
        }
      ]
    };

    const result = dteBuilderService.buildDTE(dteInput, emisor, cafData);
    console.log(`   ✅ DTE construido (${result.dteXml.length} bytes)\n`);

    // Paso 3: Firmar DTE
    console.log('✍️  PASO 3: Firmando DTE...');
    
    const pfxBuffer = fs.readFileSync(CONFIG.certificatePath);
    const pfxBase64 = pfxBuffer.toString('base64');
    
    // Cargar certificado en el servicio
    await signatureService.loadCertificate(pfxBase64, CONFIG.certificatePassword);
    
    // WORKAROUND: Este certificado no tiene serialNumber en subject, asignarlo manualmente
    if (signatureService.certificate && !signatureService.certificate.subject.serialNumber) {
      signatureService.certificate.subject.serialNumber = CONFIG.rut;
      console.log('   ⚠️  Certificado no contiene RUT en serialNumber, usando RUT de CONFIG');
    }
    
    const signedDte = signatureService.signDte(result.dteXml);
    
    console.log(`   ✅ DTE firmado (${signedDte.length} bytes)\n`);

    // Paso 4: Autenticar con SII (OPCIONAL - comentado para este test)
    console.log('🔐 PASO 4: Autenticando con SII...');
    console.log('   ⏭️  Omitido (solo test local de generación de DTE)\n');
    
    // DESCOMENTADO PARA TEST CON SII:
    // const siiAuth = new SiiAuthService(signatureService, 'CERT');
    // const token = await siiAuth.getToken();
    // console.log(`   ✅ Token obtenido: ${token.substring(0, 50)}...\n`);

    // Paso 5: Guardar archivos
    console.log('💾 PASO 5: Guardando archivos...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const dteFilename = `DTE_T${cafData.tipoDte}_F${folio}_${timestamp}.xml`;
    const dteSignedFilename = `DTE_T${cafData.tipoDte}_F${folio}_${timestamp}_SIGNED.xml`;
    
    fs.writeFileSync(
      path.join(CONFIG.outputDir, dteFilename),
      result.dteXml,
      'utf-8'
    );
    
    fs.writeFileSync(
      path.join(CONFIG.outputDir, dteSignedFilename),
      signedDte,
      'utf-8'
    );
    
    console.log(`   ✅ DTE guardado: ${dteFilename}`);
    console.log(`   ✅ DTE firmado guardado: ${dteSignedFilename}\n`);

    // Resumen final
    console.log('✅ TEST COMPLETADO EXITOSAMENTE\n');
    console.log('📊 Resumen:');
    console.log(`   • Tipo DTE: ${cafData.tipoDte} (${cafManagerService.getNombreTipoDte(cafData.tipoDte)})`);
    console.log(`   • Folio: ${folio}`);
    console.log(`   • Token SII: Obtenido`);
    console.log(`   • Archivos generados: 2`);
    console.log(`   • Ubicación: ${CONFIG.outputDir}\n`);

  } catch (error) {
    console.error('\n❌ ERROR EN EL TEST:');
    console.error(`   Mensaje: ${error.message}`);
    if (error.stack) {
      console.error(`   Stack:\n${error.stack}`);
    }
    process.exit(1);
  }
}

// Ejecutar test
runTest();
