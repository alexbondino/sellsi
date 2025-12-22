@echo off
REM ========================================
REM Script de compilación rápida
REM Compilar TypeScript del facturador SII
REM ========================================

echo.
echo ========================================
echo    COMPILACION FACTURADOR SII
echo ========================================
echo.

echo [1/3] Verificando TypeScript...
where tsc >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] TypeScript no instalado
    echo Instala con: npm install -g typescript
    pause
    exit /b 1
)
echo [OK] TypeScript encontrado
echo.

echo [2/3] Compilando...
npx tsc
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Compilacion fallo
    echo Revisa los errores arriba
    pause
    exit /b 1
)
echo [OK] Compilacion exitosa
echo.

echo [3/3] Verificando archivos generados...
if not exist "dist\services\signature.service.js" (
    echo [ERROR] Archivos no generados correctamente
    pause
    exit /b 1
)
echo [OK] Archivos generados en dist/
echo.

echo ========================================
echo    COMPILACION COMPLETADA
echo ========================================
echo.
echo Archivos generados en: dist/
echo.
echo Proximo paso:
echo   node scripts\check-prerequisites.js
echo.
pause
