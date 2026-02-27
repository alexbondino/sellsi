/**
 * TEST COMPLETO: Construcción, Firma y Envío de DTE al SII
 * Incluye:
 * 1. Construcción de DTE individual
 * 2. Firma del DTE
 * 3. Envoltura en EnvioDTE
 * 4. Firma del EnvioDTE
 * 5. Envío al SII (maullin.sii.cl)
 */

const fs = require('fs');
const path = require('path');

// Importar servicios compilados
const { cafManagerService } = require('../dist/services/caf-manager.service.js');
const { dteBuilderService } = require('../dist/services/dte-builder.service.js');
const { signatureService } = require('../dist/services/signature.service.js');
const { SiiAuthService } = require('../dist/services/sii-auth.service.js');
const { SiiClientService } = require('../dist/services/sii-client.service.js');

const CONFIG = {
  ambiente: 'CERT',
  certificado: {
    path: path.resolve(__dirname, '../folio/Certificado E-Certchile.pfx'),
    password: 'fedenetz2025',
  },
  caf: {
    path: path.resolve(__dirname, '../folio/FoliosSII76963446341202512161636.xml'),
  },
  output: {
    dir: path.resolve(__dirname, '../output'),
  },
  // RUT del certificado (workaround para certificados sin serialNumber)
  rut: '76963446-0', // RUT Empresa (Catrimir)
  rutEnvia: '17616124-8', // RUT Personal (Dueño del Certificado - Federico)
};

// ============================================================
// SET DE PRUEBAS SII - FACTURA EXENTA (Número Atención: 4621801)
// ============================================================
const CASOS_SET_PRUEBAS = [
  // CASO 4621801-1: Factura Exenta
  {
    folio: 1,
    tipoDte: 34, // Factura Exenta
    items: [
      {
        numero: 1,
        nombre: 'HORAS PROGRAMADOR',
        unidadMedida: 'Hora',
        cantidad: 9,
        precioUnitario: 5354,
      },
    ],
  },
  // CASO 4621801-2: Nota de Crédito - Modifica Monto
  {
    folio: 2,
    tipoDte: 61, // Nota de Crédito
    items: [
      {
        numero: 1,
        nombre: 'HORAS PROGRAMADOR',
        unidadMedida: 'Hora',
        cantidad: 1,
        precioUnitario: 669, // Solo el ajuste de monto
      },
    ],
    referencias: [
      {
        nroLinRef: 1,
        tpoDocRef: 34,
        folioRef: 1,
        codRef: 3, // Modifica Monto
        razonRef: 'MODIFICA MONTO',
      },
    ],
  },
  // CASO 4621801-3: Factura Exenta
  {
    folio: 3,
    tipoDte: 34,
    items: [
      {
        numero: 1,
        nombre: 'SERV CONSULTORIA FACT ELECTRONICA',
        cantidad: 1,
        precioUnitario: 293674,
      },
      {
        numero: 2,
        nombre: 'SERV CONSULTORIA GUIA DESPACHO ELECT',
        cantidad: 1,
        precioUnitario: 237676,
      },
    ],
  },
  // CASO 4621801-4: Nota de Crédito - Corrige Giro
  {
    folio: 4,
    tipoDte: 61,
    items: [
      {
        numero: 1,
        nombre: 'SERV CONSULTORIA FACT ELECTRONICA',
        cantidad: 1,
        precioUnitario: 293674,
      },
      {
        numero: 2,
        nombre: 'SERV CONSULTORIA GUIA DESPACHO ELECT',
        cantidad: 1,
        precioUnitario: 237676,
      },
    ],
    referencias: [
      {
        nroLinRef: 1,
        tpoDocRef: 34,
        folioRef: 3,
        codRef: 2, // Corrige Giro
        razonRef: 'CORRIGE GIRO',
      },
    ],
  },
  // CASO 4621801-5: Nota de Débito - Anula Nota de Crédito
  {
    folio: 5,
    tipoDte: 56, // Nota de Débito
    items: [
      {
        numero: 1,
        nombre: 'SERV CONSULTORIA FACT ELECTRONICA',
        cantidad: 1,
        precioUnitario: 293674,
      },
      {
        numero: 2,
        nombre: 'SERV CONSULTORIA GUIA DESPACHO ELECT',
        cantidad: 1,
        precioUnitario: 237676,
      },
    ],
    referencias: [
      {
        nroLinRef: 1,
        tpoDocRef: 61,
        folioRef: 4,
        codRef: 1, // Anula
        razonRef: 'ANULA NOTA DE CREDITO ELECTRONICA',
      },
    ],
  },
  // CASO 4621801-6: Factura Exenta
  {
    folio: 6,
    tipoDte: 34,
    items: [
      {
        numero: 1,
        nombre: 'CAPACITACION USO CIGUEÑALES',
        cantidad: 1,
        precioUnitario: 321809,
      },
      {
        numero: 2,
        nombre: 'CAPACITACION USO PLC\'s CNC',
        cantidad: 1,
        precioUnitario: 214494,
      },
    ],
  },
  // CASO 4621801-7: Nota de Crédito - Modifica Monto
  {
    folio: 7,
    tipoDte: 61,
    items: [
      {
        numero: 1,
        nombre: 'CAPACITACION USO CIGUEÑALES',
        cantidad: 1,
        precioUnitario: 160904, // Ajuste de monto
      },
    ],
    referencias: [
      {
        nroLinRef: 1,
        tpoDocRef: 34,
        folioRef: 6,
        codRef: 3, // Modifica Monto
        razonRef: 'MODIFICA MONTO',
      },
    ],
  },
  // CASO 4621801-8: Nota de Débito - Modifica Monto
  {
    folio: 8,
    tipoDte: 56,
    items: [
      {
        numero: 1,
        nombre: 'CAPACITACION USO PLC\'s CNC',
        cantidad: 1,
        precioUnitario: 42899, // Ajuste de monto
      },
    ],
    referencias: [
      {
        nroLinRef: 1,
        tpoDocRef: 34,
        folioRef: 6,
        codRef: 3, // Modifica Monto
        razonRef: 'MODIFICA MONTO',
      },
    ],
  },
];

// Helper: Pausa entre envíos
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('\n🚀 TEST SET DE PRUEBAS SII - FACTURA EXENTA (Nº 4621801)\n');
  console.log('=' .repeat(60));
  console.log(`Total de casos a procesar: ${CASOS_SET_PRUEBAS.length}`);
  console.log('=' .repeat(60));

  try {
    // ========================================
    // PASO 1: Cargar CAF
    // ========================================
    console.log('\n📄 PASO 1: Cargando CAF...');
    const cafXml = fs.readFileSync(CONFIG.caf.path, 'latin1');
    const cafData = cafManagerService.parseCAF(cafXml);
    
    console.log(`   Tipo DTE: ${cafData.tipoDte}`);
    console.log(`   Rango folios: ${cafData.folioDesde} - ${cafData.folioHasta}`);
    console.log(`   Emisor: ${cafData.rutEmisor}`);
    console.log(`   ✅ CAF parseado correctamente`);

    // ========================================
    // Cargar certificado UNA VEZ (no por cada DTE)
    // ========================================
    console.log('\n🔐 Cargando certificado...');
    const pfxBuffer = fs.readFileSync(CONFIG.certificado.path);
    const pfxBase64 = pfxBuffer.toString('base64');
    await signatureService.loadCertificate(pfxBase64, CONFIG.certificado.password);
    
    if (signatureService.certificate && !signatureService.certificate.subject.serialNumber) {
      signatureService.certificate.subject.serialNumber = CONFIG.rut;
      console.log('   ⚠️  Certificado sin serialNumber, usando RUT manual');
    }
    console.log('   ✅ Certificado cargado');

    // Datos del emisor (constantes para todos los casos)
    const emisor = {
      rutEmisor: '76963446-0',
      razonSocial: 'CATRIMIR SPA',
      giro: 'SERVICIOS INFORMATICOS',
      actEco: [620200],
      direccion: 'AV LIBERTADOR BERNARDO OHIGGINS 1449',
      comuna: 'SANTIAGO',
      ciudad: 'SANTIAGO',
      ambiente: CONFIG.ambiente,
    };

    const receptor = {
      rut: '66666666-6',
      razonSocial: 'CLIENTE DE PRUEBA',
      giro: 'GIRO DE PRUEBA',
      direccion: 'CALLE FALSA 123',
      comuna: 'SANTIAGO',
      ciudad: 'SANTIAGO',
    };

    // Array para almacenar resultados
    const resultados = [];

    // ========================================
    // ITERAR SOBRE CADA CASO
    // ========================================
    for (let i = 0; i < CASOS_SET_PRUEBAS.length; i++) {
      const caso = CASOS_SET_PRUEBAS[i];
      const casoNum = i + 1;
      
      console.log('\n' + '='.repeat(60));
      console.log(`📋 PROCESANDO CASO ${casoNum}/${CASOS_SET_PRUEBAS.length}`);
      console.log(`   Tipo DTE: ${caso.tipoDte}, Folio: ${caso.folio}`);
      console.log('='.repeat(60));

      // ========================================
      // PASO 2: Construir DTE
      // ========================================
      console.log('\n📝 PASO 2: Construyendo DTE...');
      
      const dteData = {
        tipoDte: caso.tipoDte,
        folio: caso.folio,
        fechaEmision: new Date(),
        emisor: emisor,
        receptor: receptor,
        items: caso.items,
        referencias: caso.referencias || [],
      };

      const dteResult = dteBuilderService.buildDTE(dteData, emisor, cafData);
      const dteXmlSinFirmar = dteResult.dteXml;
      
      console.log(`   DTE ID: ${dteResult.dteId}`);
      console.log(`   Items: ${caso.items.length}`);
      if (caso.referencias) {
        console.log(`   Referencias: ${caso.referencias.length}`);
      }
      console.log(`   ✅ DTE construido (${dteXmlSinFirmar.length} bytes)`);

      // Guardar DTE sin firmar
      const dteFilename = `DTE_Caso${casoNum}_T${caso.tipoDte}_F${caso.folio}_${new Date().toISOString().replace(/[:.]/g, '-').split('.')[0]}`;
      const dtePath = path.join(CONFIG.output.dir, `${dteFilename}.xml`);
      fs.writeFileSync(dtePath, dteXmlSinFirmar);
      console.log(`   📁 Guardado: ${dteFilename}.xml`);

      // ============================================================
      // PASO 3: FIRMA FORENSE (XML DEFENSIVO + SIBLING + C14N ONLY)
      // ============================================================
      console.log('\n🔏 PASO 3: Firma Forense (Namespace Explícito + Solo C14N)...');

      // 1. LIMPIEZA Y PREPARACIÓN
      // IMPORTANTE: NO reemplazar Ñ dentro del bloque CAF (rompe la firma FRMA)
      // Extraer CAF antes de sanitizar
      const cafMatch = dteXmlSinFirmar.match(/<CAF[\s\S]*?<\/CAF>/);
      const cafOriginal = cafMatch ? cafMatch[0] : null;
      
      let dteBase = dteXmlSinFirmar
          .replace(/\r\n/g, '')
          .replace(/\n/g, '')
          .replace(/>\s+</g, '><')
          .trim();
      
      // Solo reemplazar Ñ FUERA del CAF
      if (cafOriginal) {
          // Reemplazar CAF temporalmente con un marcador
          const cafPlaceholder = '___CAF_PLACEHOLDER___';
          dteBase = dteBase.replace(/<CAF[\s\S]*?<\/CAF>/, cafPlaceholder);
          // Sanitizar Ñ en el resto del documento
          dteBase = dteBase.replace(/Ñ/g, 'N');
          // Restaurar CAF original (sin modificar)
          const cafLimpio = cafOriginal.replace(/\r\n/g, '').replace(/\n/g, '').replace(/>\s+</g, '><').trim();
          dteBase = dteBase.replace(cafPlaceholder, cafLimpio);
      } else {
          // Si no hay CAF (raro), sanitizar todo
          dteBase = dteBase.replace(/Ñ/g, 'N');
      }

      // 2. INYECCIÓN DEFENSIVA DE NAMESPACE
      // Repetimos el namespace en <Documento> para evitar ambigüedad en C14N.
      const nsSII = 'xmlns="http://www.sii.cl/SiiDte"';
      // Aseguramos que el tag quede limpio antes de inyectar
      if (!dteBase.includes(nsSII)) {
          dteBase = dteBase.replace(/<Documento[\s\S]*?>/, `<Documento ID="${dteResult.dteId}" ${nsSII}>`);
      }

      console.log('   🔧 Firmando documento con namespace explícito...');

      // 3. FIRMAR (Usando SignatureService con SOLO C14N transform)
      const dteFirmado = signatureService.signDte(dteBase, dteResult.dteId);

      // 4. EXTRAER FIRMA Y FORMATEAR CERTIFICADO
      const match = dteFirmado.match(/<Signature[\s\S]*?<\/Signature>/);
      if (!match) throw new Error("No se generó la firma");
      let bloqueFirma = match[0];

      bloqueFirma = bloqueFirma.replace(/<X509Certificate>(.*?)<\/X509Certificate>/, (m, cert) => {
          const cleanCert = cert.replace(/\s/g, '');
          const chunked = cleanCert.match(/.{1,64}/g).join('\n');
          return `<X509Certificate>${chunked}</X509Certificate>`;
      });

      // 5. ENSAMBLAJE SIBLING (HERMANO)
      // Documento (con xmlns explícito) + Firma (al lado)
      // Nota: Como quitamos 'enveloped-signature', xml-crypto no intentó borrar nada, así que dteBase sigue intacto.
      const dteXmlFirmado = `${dteBase}${bloqueFirma}`;

      console.log('   ✅ XML Ensamblado: Documento Defensivo + Firma Hermana');
      console.log(`   ✅ DTE firmado (${dteXmlFirmado.length} bytes)`);
      
      // Guardar DTE firmado
      const dtePathFirmado = path.join(CONFIG.output.dir, `${dteFilename}_SIGNED.xml`);
      fs.writeFileSync(dtePathFirmado, dteXmlFirmado);
      console.log(`   📁 Guardado: ${dteFilename}_SIGNED.xml`);

      // ========================================
      // PASO 4: Construir EnvioDTE
      // ========================================
      console.log('\n📦 PASO 4: Construyendo EnvioDTE (sobre)...');
      
      const documentos = [
        {
          dteId: dteResult.dteId,
          dteXml: dteXmlFirmado,
        },
      ];

      const envioDteResult = dteBuilderService.buildEnvioDTE(
        documentos,
        emisor,
        CONFIG.rutEnvia // RUT del que envía (dueño del certificado)
      );

      const envioDteXmlSinFirmar = envioDteResult.xml;
      
      console.log(`   SetDTE ID: ${envioDteResult.setDteId}`);
      console.log(`   EnvioDTE ID: ${envioDteResult.envioDteId}`);
      console.log(`   ✅ EnvioDTE construido (${envioDteXmlSinFirmar.length} bytes)`);

      // Guardar EnvioDTE sin firmar
      const envioFilename = `EnvioDTE_Caso${casoNum}_${new Date().toISOString().replace(/[:.]/g, '-').split('.')[0]}`;
      const envioPath = path.join(CONFIG.output.dir, `${envioFilename}.xml`);
      fs.writeFileSync(envioPath, envioDteXmlSinFirmar);
      console.log(`   📁 Guardado: ${envioFilename}.xml`);

      // ========================================
      // PASO 5: Firmar EnvioDTE
      // ========================================
      console.log('\n🔐 PASO 5: Firmando EnvioDTE...');
      
      // Firmar el EnvioDTE completo (NO firmar SetDTE por separado)
      // La firma va al final del EnvioDTE y apunta al SetDTE como referencia
      const envioDteXmlFirmado = signatureService.signSetDte(
        envioDteXmlSinFirmar,
        envioDteResult.setDteId  // Firma apunta al SetDTE
      );

      console.log(`   ✅ EnvioDTE firmado (${envioDteXmlFirmado.length} bytes)`);
      
      // Guardar EnvioDTE firmado
      const envioPathFirmado = path.join(CONFIG.output.dir, `${envioFilename}_SIGNED.xml`);
      fs.writeFileSync(envioPathFirmado, envioDteXmlFirmado);
      console.log(`   📁 Guardado: ${envioFilename}_SIGNED.xml`);

      // ========================================
      // PASO 6: Autenticación SII (solo primera vez)
      // ========================================
      let authService;
      let token;
      
      if (i === 0) {
        console.log('\n🔑 PASO 6: Autenticando con SII...');
        authService = new SiiAuthService(
          signatureService,
          CONFIG.ambiente
        );

        try {
          token = await authService.getToken();
          console.log(`   ✅ Token obtenido: ${token.substring(0, 20)}...`);
        } catch (error) {
          console.error(`   ❌ Error en autenticación: ${error.message}`);
          console.log('\n⚠️  Finalizando test (no se puede continuar sin autenticación)');
          return;
        }
      } else {
        console.log('\n🔑 PASO 6: Reutilizando autenticación...');
        // Reutilizar la autenticación del primer envío
        authService = new SiiAuthService(signatureService, CONFIG.ambiente);
        token = await authService.getToken();
        console.log(`   ✅ Token renovado`);
      }

      // ========================================
      // PASO 7: Enviar al SII
      // ========================================
      console.log('\n📤 PASO 7: Enviando al SII (maullin.sii.cl)...');
      
      const clientService = new SiiClientService(authService, CONFIG.ambiente);
      
      try {
        const uploadResult = await clientService.uploadEnvioDte(
          envioDteXmlFirmado,
          emisor.rutEmisor
        );

        console.log(`   ✅ ENVÍO EXITOSO!`);
        console.log(`   Track ID: ${uploadResult.trackId}`);
        console.log(`   Timestamp: ${uploadResult.timestamp}`);

        // Guardar resultado
        resultados.push({
          caso: casoNum,
          folio: caso.folio,
          tipoDte: caso.tipoDte,
          trackId: uploadResult.trackId,
          timestamp: uploadResult.timestamp,
          status: uploadResult.status,
        });

      } catch (error) {
        console.error(`   ❌ Error en envío: ${error.message}`);
        resultados.push({
          caso: casoNum,
          folio: caso.folio,
          tipoDte: caso.tipoDte,
          error: error.message,
        });
      }

      // Pausa entre envíos (excepto el último)
      if (i < CASOS_SET_PRUEBAS.length - 1) {
        console.log(`\n⏳ Esperando 3 segundos antes del siguiente envío...\n`);
        await sleep(3000);
      }
    } // FIN DEL LOOP

    // ========================================
    // RESUMEN FINAL
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST COMPLETADO - RESUMEN DE RESULTADOS');
    console.log('='.repeat(60));
    
    console.log(`\nTotal de casos procesados: ${resultados.length}`);
    console.log('\nDetalle:');
    resultados.forEach((r) => {
      if (r.trackId) {
        console.log(`  ✅ Caso ${r.caso} (Folio ${r.folio}, Tipo ${r.tipoDte}): Track ID ${r.trackId}`);
      } else {
        console.log(`  ❌ Caso ${r.caso} (Folio ${r.folio}, Tipo ${r.tipoDte}): ${r.error}`);
      }
    });

    console.log('\n' + '='.repeat(60));
    console.log('🎉 SET DE PRUEBAS FINALIZADO');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ ERROR EN TEST:');
    console.error(error);
    process.exit(1);
  }
}

// Ejecutar
main();
