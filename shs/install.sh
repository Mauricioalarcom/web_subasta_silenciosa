#!/bin/bash

# Script de instalación completa para el proyecto de Subasta Silenciosa

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Instalación - Plataforma de Subasta Silenciosa"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verificar Node.js
echo "1️⃣ Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    echo "Por favor instala Node.js v18 o superior desde https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "⚠️  Tienes Node.js v$NODE_VERSION, se recomienda v18 o superior"
else    
    echo "✅ Node.js $(node -v) encontrado"
fi
echo ""

# Instalar dependencias del Backend
echo "2️⃣ Instalando dependencias del Backend..."
cd backend
npm install
if [ $? -eq 0 ]; then
    echo "✅ Dependencias del backend instaladas"
else
    echo "❌ Error al instalar dependencias del backend"
    exit 1
fi
cd ..
echo ""

# Instalar dependencias del Admin Panel
echo "3️⃣ Instalando dependencias del Admin Panel..."
cd admin-panel
npm install
if [ $? -eq 0 ]; then
    echo "✅ Dependencias del admin-panel instaladas"
else
    echo "❌ Error al instalar dependencias del admin-panel"
    exit 1
fi
cd ..
echo ""

# Verificar PostgreSQL
echo "4️⃣ Verificando PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL no está instalado"
    echo "Instálalo con:"
    echo "  macOS:  brew install postgresql"
    echo "  Ubuntu: sudo apt-get install postgresql"
    echo ""
else
    echo "✅ PostgreSQL encontrado"
fi
echo ""

# Verificar archivo .env
echo "5️⃣ Configurando archivos de entorno..."
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Creando archivo backend/.env..."
    cp backend/.env.example backend/.env
    echo "✅ Archivo backend/.env creado"
    echo "⚠️  IMPORTANTE: Edita backend/.env con tus credenciales de PostgreSQL"
else
    echo "✅ Archivo backend/.env ya existe"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Instalación completada!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Próximos pasos:"
echo ""
echo "1. ✏️  Edita backend/.env con tus credenciales de PostgreSQL"
echo ""
echo "2. 🗄️  Crea la base de datos:"
echo "   createdb subasta_silenciosa"
echo "   # O con psql: CREATE DATABASE subasta_silenciosa;"
echo ""
echo "3. 📊 Ejecuta las migraciones:"
echo "   cd backend"
echo "   npm run db:migrate"
echo ""
echo "4. 🌱 Puebla con datos de ejemplo:"
echo "   npm run db:seed"
echo ""
echo "5. 🚀 Inicia los servidores:"
echo "   Terminal 1: cd backend && npm run dev"
echo "   Terminal 2: cd admin-panel && npm run dev"
echo ""
echo "🌐 URLs de acceso:"
echo "   Backend API:  http://localhost:4000"
echo "   Panel Admin:  http://localhost:3001"
echo ""
echo "🔐 Credenciales iniciales:"
echo "   Email:    admin@subasta.com"
echo "   Password: admin123"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
