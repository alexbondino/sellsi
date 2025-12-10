/**
 * 🧪 Test de Conexión al SII - Ambiente CERT
 * 
 * Este script verifica la conectividad con los servidores del SII
 * sin necesidad de certificado digital.
 * 
 * Prueba:
 * 1. Conexión a maullin.sii.cl (CERT)
 * 2. Disponibilidad del servicio CrSeed (GetSeed)
 * 3. Disponibilidad del servicio GetTokenFromSeed
 * 4. Intento de obtener semilla (mostrará estructura de respuesta)
 */

import https from 'https';

// Configuración de endpoints
const SII_ENDPOINTS = {
  CERT: {
    host: 'maullin.sii.cl',
    seed_wsdl: '/DTEWS/CrSeed.jws?WSDL',
    seed_soap: '/DTEWS/CrSeed.jws',
    token_wsdl: '/DTEWS/GetTokenFromSeed.jws?WSDL',
  },
  PROD: {
    host: 'palena.sii.cl',
    seed_wsdl: '/DTEWS/CrSeed.jws?WSDL',
    seed_soap: '/DTEWS/CrSeed.jws',
    token_wsdl: '/DTEWS/GetTokenFromSeed.jws?WSDL',
  }
};

// Helper para hacer requests HTTPS
function httpsRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, data }));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Timeout de conexión (15s)'));
    });
    if (body) req.write(body);
    req.end();
  });
}

// Test 1: Verificar WSDL de CrSeed
async function testCrSeedWSDL(env) {
  const endpoint = SII_ENDPOINTS[env];
  console.log(`\n📡 Test 1: WSDL CrSeed (${env})`);
  console.log(`   URL: https://${endpoint.host}${endpoint.seed_wsdl}`);
  
  try {
    const response = await httpsRequest({
      hostname: endpoint.host,
      path: endpoint.seed_wsdl,
      method: 'GET',
      headers: { 'Accept': 'text/xml' }
    });
    
    if (response.status === 200) {
      const hasDefinitions = response.data.includes('definitions');
      const hasGetSeed = response.data.includes('getSeed');
      
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   📏 Tamaño: ${response.data.length} bytes`);
      console.log(`   ${hasDefinitions ? '✅' : '❌'} Contiene <definitions>`);
      console.log(`   ${hasGetSeed ? '✅' : '❌'} Contiene operación getSeed`);
      
      return { success: true, hasGetSeed };
    } else {
      console.log(`   ⚠️ Status: ${response.status}`);
      return { success: false };
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Test 2: Verificar WSDL de GetTokenFromSeed
async function testTokenWSDL(env) {
  const endpoint = SII_ENDPOINTS[env];
  console.log(`\n📡 Test 2: WSDL GetTokenFromSeed (${env})`);
  console.log(`   URL: https://${endpoint.host}${endpoint.token_wsdl}`);
  
  try {
    const response = await httpsRequest({
      hostname: endpoint.host,
      path: endpoint.token_wsdl,
      method: 'GET',
      headers: { 'Accept': 'text/xml' }
    });
    
    if (response.status === 200) {
      const hasGetToken = response.data.includes('getToken');
      
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   📏 Tamaño: ${response.data.length} bytes`);
      console.log(`   ${hasGetToken ? '✅' : '❌'} Contiene operación getToken`);
      
      return { success: true, hasGetToken };
    } else {
      console.log(`   ⚠️ Status: ${response.status}`);
      return { success: false };
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Test 3: Intentar obtener semilla (SOAP request)
async function testGetSeed(env) {
  const endpoint = SII_ENDPOINTS[env];
  console.log(`\n🌱 Test 3: Obtener Semilla (${env})`);
  console.log(`   URL: https://${endpoint.host}${endpoint.seed_soap}`);
  
  const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  <soapenv:Body>
    <getSeed/>
  </soapenv:Body>
</soapenv:Envelope>`;

  try {
    const response = await httpsRequest({
      hostname: endpoint.host,
      path: endpoint.seed_soap,
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': '',
        'Content-Length': Buffer.byteLength(soapEnvelope)
      }
    }, soapEnvelope);
    
    console.log(`   📨 Status HTTP: ${response.status}`);
    
    if (response.status === 200) {
      // Extraer información relevante de la respuesta
      const hasSemilla = response.data.includes('SEMILLA');
      const hasEstado = response.data.includes('ESTADO');
      
      // Intentar extraer la semilla
      const semillaMatch = response.data.match(/<SEMILLA>([^<]+)<\/SEMILLA>/);
      const estadoMatch = response.data.match(/<ESTADO>([^<]+)<\/ESTADO>/);
      
      console.log(`   ${hasEstado ? '✅' : '❌'} Respuesta contiene ESTADO`);
      console.log(`   ${hasSemilla ? '✅' : '❌'} Respuesta contiene SEMILLA`);
      
      if (estadoMatch) {
        const estado = estadoMatch[1];
        console.log(`   📊 Estado: ${estado} ${estado === '00' ? '(OK)' : '(Ver código)'}`);
      }
      
      if (semillaMatch) {
        const semilla = semillaMatch[1];
        console.log(`   🌱 SEMILLA OBTENIDA: ${semilla}`);
        console.log(`   ✅ ¡CONEXIÓN EXITOSA! El servicio GetSeed funciona correctamente.`);
        return { success: true, semilla, estado: estadoMatch?.[1] };
      } else {
        console.log(`\n   📄 Respuesta completa (primeros 500 chars):`);
        console.log(`   ${response.data.substring(0, 500)}...`);
      }
      
      return { success: true, hasSemilla };
    } else {
      console.log(`   ⚠️ Respuesta inesperada`);
      console.log(`   ${response.data.substring(0, 300)}`);
      return { success: false };
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Función principal
async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   🧪 TEST DE CONEXIÓN AL SII - SELLSI INVOICER');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`   Fecha: ${new Date().toISOString()}`);
  console.log(`   Ambiente: CERTIFICACIÓN (maullin.sii.cl)`);
  console.log('═══════════════════════════════════════════════════════════════');

  const results = {
    wsdl_seed: null,
    wsdl_token: null,
    get_seed: null
  };

  // Ejecutar tests en ambiente CERT
  results.wsdl_seed = await testCrSeedWSDL('CERT');
  results.wsdl_token = await testTokenWSDL('CERT');
  results.get_seed = await testGetSeed('CERT');

  // Resumen
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('   📊 RESUMEN DE PRUEBAS');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const allPassed = results.wsdl_seed?.success && 
                    results.wsdl_token?.success && 
                    results.get_seed?.success;

  console.log(`   WSDL CrSeed:        ${results.wsdl_seed?.success ? '✅ OK' : '❌ FALLO'}`);
  console.log(`   WSDL GetToken:      ${results.wsdl_token?.success ? '✅ OK' : '❌ FALLO'}`);
  console.log(`   GetSeed (SOAP):     ${results.get_seed?.success ? '✅ OK' : '❌ FALLO'}`);
  
  if (results.get_seed?.semilla) {
    console.log(`\n   🎉 ¡SEMILLA OBTENIDA EXITOSAMENTE!`);
    console.log(`   Semilla: ${results.get_seed.semilla}`);
    console.log(`\n   📌 SIGUIENTE PASO:`);
    console.log(`   Para continuar necesitas un certificado digital (.p12) de una`);
    console.log(`   empresa registrada en el SII para firmar esta semilla y`);
    console.log(`   obtener un token de autenticación.`);
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  
  if (allPassed) {
    console.log('   ✅ TODAS LAS PRUEBAS DE CONECTIVIDAD PASARON');
    console.log('   El sistema puede comunicarse con el SII correctamente.');
  } else {
    console.log('   ⚠️ ALGUNAS PRUEBAS FALLARON');
    console.log('   Revisa tu conexión a internet o firewall.');
  }
  
  console.log('═══════════════════════════════════════════════════════════════\n');
}

// Ejecutar
main().catch(console.error);
