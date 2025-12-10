# Test de Autenticacion SII - Flujo completo
# GetSeed -> SignSeed -> GetToken

Write-Host "=== TEST DE AUTENTICACION SII ===" -ForegroundColor Cyan
Write-Host "Fecha: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "Ambiente: PRODUCCION (palena.sii.cl)"
Write-Host ""

# PASO 1: Obtener Semilla
Write-Host "[PASO 1] Obteniendo semilla del SII..." -ForegroundColor Yellow

$soapGetSeed = '<?xml version="1.0" encoding="UTF-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Body><getSeed/></soapenv:Body></soapenv:Envelope>'

try {
    $responseSeed = Invoke-WebRequest -Uri "https://palena.sii.cl/DTEWS/CrSeed.jws" -Method POST -ContentType "text/xml; charset=utf-8" -Body $soapGetSeed -Headers @{"SOAPAction"=""} -TimeoutSec 30

    # Decodificar entidades HTML primero
    $decodedContent = $responseSeed.Content.Replace('&lt;', '<').Replace('&gt;', '>').Replace('&quot;', '"')
    
    $semillaMatch = [regex]::Match($decodedContent, 'SEMILLA>(\d+)<')
    if ($semillaMatch.Success) {
        $semilla = $semillaMatch.Groups[1].Value
        Write-Host "   OK - Semilla obtenida: $semilla" -ForegroundColor Green
    } else {
        Write-Host "   ERROR - No se pudo extraer la semilla" -ForegroundColor Red
        Write-Host $responseSeed.Content
        exit 1
    }
} catch {
    Write-Host "   ERROR obteniendo semilla: $_" -ForegroundColor Red
    exit 1
}

# PASO 2: Obtener certificado y firmar
Write-Host ""
Write-Host "[PASO 2] Firmando semilla con certificado..." -ForegroundColor Yellow

$cert = Get-ChildItem -Path Cert:\CurrentUser\My | Where-Object { $_.Subject -like "*ROMERO*" -and $_.HasPrivateKey } | Select-Object -First 1

if (-not $cert) {
    Write-Host "   ERROR - No se encontro certificado" -ForegroundColor Red
    exit 1
}

Write-Host "   Certificado: $($cert.Subject.Substring(0, 60))..."
Write-Host "   Thumbprint: $($cert.Thumbprint)"

# XML a firmar segun SII
$xmlToSign = "<getToken><item><Semilla>$semilla</Semilla></item></getToken>"

Write-Host "   XML a firmar: $xmlToSign"

# Cargar ensamblados necesarios
Add-Type -AssemblyName System.Security

$xmlDoc = New-Object System.Xml.XmlDocument
$xmlDoc.PreserveWhitespace = $true
$xmlDoc.LoadXml($xmlToSign)

# Crear SignedXml
$signedXml = New-Object System.Security.Cryptography.Xml.SignedXml($xmlDoc)
$signedXml.SigningKey = $cert.PrivateKey

# Referencia al documento completo
$reference = New-Object System.Security.Cryptography.Xml.Reference("")
$reference.AddTransform((New-Object System.Security.Cryptography.Xml.XmlDsigEnvelopedSignatureTransform))
$signedXml.AddReference($reference)

# KeyInfo con certificado X509
$keyInfo = New-Object System.Security.Cryptography.Xml.KeyInfo
$keyInfoData = New-Object System.Security.Cryptography.Xml.KeyInfoX509Data($cert)
$keyInfo.AddClause($keyInfoData)
$signedXml.KeyInfo = $keyInfo

try {
    $signedXml.ComputeSignature()
    $signatureElement = $signedXml.GetXml()
    $importedSig = $xmlDoc.ImportNode($signatureElement, $true)
    $xmlDoc.DocumentElement.AppendChild($importedSig) | Out-Null
    $signedSeedXml = $xmlDoc.OuterXml
    Write-Host "   OK - Semilla firmada exitosamente" -ForegroundColor Green
} catch {
    Write-Host "   ERROR al firmar: $_" -ForegroundColor Red
    exit 1
}

# PASO 3: Obtener Token
Write-Host ""
Write-Host "[PASO 3] Obteniendo token de autenticacion..." -ForegroundColor Yellow

$soapGetToken = '<?xml version="1.0" encoding="UTF-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Body><getToken><pszXml><![CDATA[' + $signedSeedXml + ']]></pszXml></getToken></soapenv:Body></soapenv:Envelope>'

try {
    $responseToken = Invoke-WebRequest -Uri "https://palena.sii.cl/DTEWS/GetTokenFromSeed.jws" -Method POST -ContentType "text/xml; charset=utf-8" -Body $soapGetToken -Headers @{"SOAPAction"=""} -TimeoutSec 30

    Write-Host "   HTTP Status: $($responseToken.StatusCode)"
    
    # Decodificar respuesta
    $content = $responseToken.Content.Replace('&lt;', '<').Replace('&gt;', '>').Replace('&quot;', '"')
    
    # Extraer estado
    $estadoMatch = [regex]::Match($content, 'ESTADO>(\d+)<')
    if ($estadoMatch.Success) {
        $estado = $estadoMatch.Groups[1].Value
        if ($estado -eq '00') {
            Write-Host "   Estado SII: $estado (OK)" -ForegroundColor Green
        } else {
            Write-Host "   Estado SII: $estado (ERROR)" -ForegroundColor Red
        }
    }
    
    # Extraer glosa
    $glosaMatch = [regex]::Match($content, 'GLOSA>([^<]+)<')
    if ($glosaMatch.Success) {
        Write-Host "   Glosa: $($glosaMatch.Groups[1].Value)" -ForegroundColor Yellow
    }
    
    # Extraer token
    $tokenMatch = [regex]::Match($content, 'TOKEN>([^<]+)<')
    if ($tokenMatch.Success) {
        $token = $tokenMatch.Groups[1].Value
        Write-Host ""
        Write-Host "=== TOKEN OBTENIDO EXITOSAMENTE ===" -ForegroundColor Green
        Write-Host "Token: $token" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "El token tiene validez de 60 minutos."
        Write-Host "Puede usarse para enviar DTEs al SII."
    } else {
        Write-Host ""
        Write-Host "   No se obtuvo token" -ForegroundColor Yellow
        Write-Host "   Respuesta completa:"
        Write-Host $content
    }
    
} catch {
    Write-Host "   ERROR obteniendo token: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
