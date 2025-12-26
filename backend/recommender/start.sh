#!/bin/bash

# 🚀 Quick Start Script para el Recommender Service

echo "🎯 Sellsi Backend - Recommender Service"
echo "========================================"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "requirements.txt" ]; then
    echo "❌ Error: Ejecuta este script desde backend/recommender/"
    exit 1
fi

# Verificar Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 no está instalado"
    exit 1
fi

echo "1️⃣  Configurando entorno..."

# Crear .env si no existe
if [ ! -f ".env" ]; then
    echo "📝 Creando archivo .env desde .env.example..."
    cp .env.example .env
    echo "⚠️  IMPORTANTE: Edita .env con tus credenciales de Supabase"
    echo ""
fi

# Crear virtual environment si no existe
if [ ! -d "venv" ]; then
    echo "📦 Creando virtual environment..."
    python3 -m venv venv
fi

# Activar virtual environment
echo "🔌 Activando virtual environment..."
source venv/bin/activate

# Instalar dependencias
echo "📥 Instalando dependencias..."
pip install -q --upgrade pip
pip install -q -r requirements.txt

echo ""
echo "✅ Setup completado!"
echo ""
echo "📝 Próximos pasos:"
echo "   1. Edita .env con tus credenciales de Supabase"
echo "   2. Ejecuta: python -m app.main"
echo "   3. Abre http://localhost:8000/docs"
echo ""
echo "🚀 ¿Listo para iniciar el servidor?"
read -p "Presiona Enter para continuar o Ctrl+C para salir..."

echo ""
echo "🌟 Iniciando servidor..."
python -m app.main
