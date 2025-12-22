@echo off
REM ========================================
REM Script de inicio rápido - Test SII
REM Compila + Verifica + Ejecuta
REM ========================================

echo.
echo ========================================
echo   TEST FACTURADOR SII - INICIO RAPIDO
echo ========================================
echo.

REM Verificar si estamos en el directorio correcto
if not exist "scripts\test-sii-flow.ts" (
    echo [ERROR] Ejecuta este script desde la raiz del modulo invoicer
    echo Directorio correcto: ...\sellsi\src\workspaces\invoicer
    pause
    exit /b 1
)

echo [PASO 1/4] Verificando archivos reales...
echo.

if not exist "folio\Certificado E-Certchile.pfx" (
    echo [ERROR] Falta: folio\Certificado E-Certchile.pfx
    echo Mueve tu certificado a la carpeta folio\
    pause
    exit /b 1
)
echo   [OK] Certificado encontrado

if not exist "folio\FoliosSII76963446341202512161636.xml" (
    echo [ERROR] Falta: folio\FoliosSII76963446341202512161636.xml
    echo Mueve tu CAF a la carpeta folio\
    pause
    exit /b 1
)
echo   [OK] CAF encontrado
echo.

echo [PASO 2/4] Compilando TypeScript...
echo.
call npx tsc
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Compilacion fallo
    pause
    exit /b 1
)
echo   [OK] Compilacion exitosa
echo.

echo [PASO 3/4] Verificando prerequisitos...
echo.
call node scripts\check-prerequisites.js
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Prerequisitos no cumplidos
    echo Revisa los errores arriba
    pause
    exit /b 1
)
echo.

echo [PASO 4/4] Ejecutando test de integracion...
echo.
echo ========================================
echo.

call npx ts-node scripts\test-sii-flow.ts

echo.
echo ========================================
echo   TEST COMPLETADO
echo ========================================
echo.
echo Archivos generados en: output\
echo.
pause
