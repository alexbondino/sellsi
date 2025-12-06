# =============================================================================
# 🔐 TEST COMPLETO DE AUTENTICACIÓN SII
# Flujo: GetSeed → SignSeed → GetToken
# =============================================================================

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   🔐 TEST DE AUTENTICACIÓN COMPLETA SII - SELLSI INVOICER" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   Fecha: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "   Ambiente: PRODUCCIÓN (palena.sii.cl)"
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan

# -----------------------------------------------------------------------------
# PASO 1: Obtener Semilla del SII
# -----------------------------------------------------------------------------
Write-Host "`n🌱 PASO 1: Obteniendo semilla del SII..." -ForegroundColor Yellow

$soapGetSeed = @"
<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  <soapenv:Body>
    <getSeed/>
  </soapenv:Body>
</soapenv:Envelope>
"@

try {
    $responseSeed = Invoke-WebRequest -Uri "https://palena.sii.cl/DTEWS/CrSeed.jws" `
        -Method POST `
        -ContentType "text/xml; charset=utf-8" `
        -Body $soapGetSeed `
        -Headers @{"SOAPAction"=""} `
        -TimeoutSec 30

    # Extraer la semilla del XML de respuesta
    if ($responseSeed.Content -match '<SEMILLA>(\d+)</SEMILLA>') {
        $semilla = $matches[1]
        Write-Host "   ✅ Semilla obtenida: $semilla" -ForegroundColor Green
    } else {
        Write-Host "   ❌ No se pudo extraer la semilla" -ForegroundColor Red
        Write-Host "   Respuesta: $($responseSeed.Content)"
        exit 1
    }
} catch {
    Write-Host "   ❌ Error obteniendo semilla: $_" -ForegroundColor Red
    exit 1
}

# -----------------------------------------------------------------------------
# PASO 2: Obtener el certificado y firmar la semilla
# -----------------------------------------------------------------------------
Write-Host "`n🔏 PASO 2: Firmando semilla con certificado digital..." -ForegroundColor Yellow

# Buscar el certificado de ROYAN SPA
$cert = Get-ChildItem -Path Cert:\CurrentUser\My | Where-Object { 
    $_.Subject -like "*ROMERO*" -and $_.HasPrivateKey 
} | Select-Object -First 1

if (-not $cert) {
    Write-Host "   ❌ No se encontró certificado con clave privada" -ForegroundColor Red
    exit 1
}

Write-Host "   📜 Certificado encontrado:" -ForegroundColor Cyan
Write-Host "      Subject: $($cert.Subject)"
Write-Host "      Thumbprint: $($cert.Thumbprint)"
Write-Host "      Válido hasta: $($cert.NotAfter)"

# Construir el XML a firmar (según especificación SII)
$xmlToSign = @"
<getToken>
<item>
<Semilla>$semilla</Semilla>
</item>
</getToken>
"@

Write-Host "   📄 XML a firmar:"
Write-Host "   $xmlToSign"

# Cargar el XML como documento
Add-Type -AssemblyName System.Security
$xmlDoc = New-Object System.Xml.XmlDocument
$xmlDoc.PreserveWhitespace = $true
$xmlDoc.LoadXml($xmlToSign)

# Crear el objeto SignedXml
$signedXml = New-Object System.Security.Cryptography.Xml.SignedXml($xmlDoc)
$signedXml.SigningKey = $cert.PrivateKey

# Crear referencia al documento completo
$reference = New-Object System.Security.Cryptography.Xml.Reference("")
$reference.AddTransform((New-Object System.Security.Cryptography.Xml.XmlDsigEnvelopedSignatureTransform))
$signedXml.AddReference($reference)

# Agregar información del certificado (KeyInfo)
$keyInfo = New-Object System.Security.Cryptography.Xml.KeyInfo
$keyInfoData = New-Object System.Security.Cryptography.Xml.KeyInfoX509Data($cert)
$keyInfo.AddClause($keyInfoData)
$signedXml.KeyInfo = $keyInfo

# Calcular la firma
try {
    $signedXml.ComputeSignature()
    $signatureElement = $signedXml.GetXml()
    
    # Insertar la firma en el documento
    $xmlDoc.DocumentElement.AppendChild($xmlDoc.ImportNode($signatureElement, $true)) | Out-Null
    
    $signedSeedXml = $xmlDoc.OuterXml
    Write-Host "   ✅ Semilla firmada exitosamente" -ForegroundColor Green
    
    # Mostrar parte de la firma para verificación
    if ($signedSeedXml -match '<SignatureValue>([^<]+)</SignatureValue>') {
        $sigPreview = $matches[1].Substring(0, [Math]::Min(50, $matches[1].Length))
        Write-Host "   🔏 Firma (preview): $sigPreview..." -ForegroundColor DarkGray
    }
} catch {
    Write-Host "   ❌ Error al firmar: $_" -ForegroundColor Red
    exit 1
}

# -----------------------------------------------------------------------------
# PASO 3: Enviar semilla firmada y obtener token
# -----------------------------------------------------------------------------
Write-Host "`n🎫 PASO 3: Obteniendo token de autenticación..." -ForegroundColor Yellow

# Escapar el XML firmado para incluirlo en CDATA
$soapGetToken = @"
<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  <soapenv:Body>
    <getToken>
      <pszXml><![CDATA[$signedSeedXml]]></pszXml>
    </getToken>
  </soapenv:Body>
</soapenv:Envelope>
"@

try {
    $responseToken = Invoke-WebRequest -Uri "https://palena.sii.cl/DTEWS/GetTokenFromSeed.jws" `
        -Method POST `
        -ContentType "text/xml; charset=utf-8" `
        -Body $soapGetToken `
        -Headers @{"SOAPAction"=""} `
        -TimeoutSec 30

    Write-Host "   📨 Respuesta HTTP: $($responseToken.StatusCode)" -ForegroundColor Cyan
    
    # Decodificar entidades HTML en la respuesta
    $content = $responseToken.Content -replace '&lt;', '<' -replace '&gt;', '>' -replace '&quot;', '"' -replace '&amp;', '&'
    
    # Extraer estado
    if ($content -match '<ESTADO>(\d+)</ESTADO>') {
        $estado = $matches[1]
        Write-Host "   📊 Estado SII: $estado" -ForegroundColor $(if ($estado -eq '00') { 'Green' } else { 'Red' })
    }
    
    # Extraer glosa si hay error
    if ($content -match '<GLOSA>([^<]+)</GLOSA>') {
        Write-Host "   📝 Glosa: $($matches[1])" -ForegroundColor Yellow
    }
    
    # Extraer token si existe
    if ($content -match '<TOKEN>([^<]+)</TOKEN>') {
        $token = $matches[1]
        Write-Host "`n   ✅ ¡TOKEN OBTENIDO EXITOSAMENTE!" -ForegroundColor Green
        Write-Host "   🎫 Token: $token" -ForegroundColor Cyan
        
        Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host "   ✅ AUTENTICACIÓN COMPLETA - FLUJO EXITOSO" -ForegroundColor Green
        Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host "   El token tiene validez de 60 minutos."
        Write-Host "   Puede usarse para enviar DTEs al SII."
    } else {
        Write-Host "`n   ⚠️ No se obtuvo token" -ForegroundColor Yellow
        Write-Host "   Respuesta completa:" -ForegroundColor DarkGray
        Write-Host $content
    }
    
} catch {
    Write-Host "   ❌ Error obteniendo token: $_" -ForegroundColor Red
    Write-Host "   Respuesta: $($_.Exception.Response)" -ForegroundColor DarkGray
}

Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
