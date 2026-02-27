/**
 * Test simple para cargar certificado PFX
 */
const fs = require('fs');
const path = require('path');
const forge = require('node-forge');

const certPath = path.resolve(__dirname, '../folio/Certificado E-Certchile.pfx');
const password = 'fedenetz2025';

console.log('📂 Cargando certificado:', certPath);
console.log('🔑 Password:', password, '\n');

try {
  // Leer archivo
  const pfxBuffer = fs.readFileSync(certPath);
  console.log('✅ Archivo leído:', pfxBuffer.length, 'bytes\n');
  
  // Convertir a base64
  const pfxBase64 = pfxBuffer.toString('base64');
  console.log('✅ Convertido a base64:', pfxBase64.substring(0, 50) + '...\n');
  
  // Decodificar
  const pfxDer = forge.util.decode64(pfxBase64);
  console.log('✅ Decodificado DER:', pfxDer.length, 'bytes\n');
  
  // Parse ASN.1
  const pfxAsn1 = forge.asn1.fromDer(pfxDer);
  console.log('✅ ASN.1 parseado');
  console.log('   Type:', pfxAsn1.tagClass, pfxAsn1.type);
  console.log('   Value type:', Array.isArray(pfxAsn1.value) ? 'Array' : typeof pfxAsn1.value);
  console.log('   Value length:', Array.isArray(pfxAsn1.value) ? pfxAsn1.value.length : 'N/A');
  console.log();
  
  // Intentar abrir con contraseña
  console.log('🔓 Intentando abrir PKCS#12 con password...');
  const pfx = forge.pkcs12.pkcs12FromAsn1(pfxAsn1, false, password);
  console.log('✅ PKCS#12 abierto exitosamente!\n');
  
  // Intentar extraer certificado
  const certBags = pfx.getBags({ bagType: forge.pki.oids.certBag });
  console.log('📜 Certificados encontrados:', Object.keys(certBags).length);
  
  const cert = certBags[forge.pki.oids.certBag][0].cert;
  console.log('✅ Certificado extraído:');
  console.log('   CN:', cert.subject.getField('CN').value);
  console.log('   Serial:', cert.subject.getField('serialNumber')?.value);
  console.log('   Válido desde:', cert.validity.notBefore);
  console.log('   Válido hasta:', cert.validity.notAfter);
  console.log('\n📋 Todos los campos del Subject:');
  cert.subject.attributes.forEach(attr => {
    console.log(`   ${attr.shortName || attr.name}: ${attr.value}`);
  });
  
} catch (error) {
  console.error('\n❌ ERROR:');
  console.error('   Mensaje:', error.message);
  console.error('   Stack:\n', error.stack);
  process.exit(1);
}
