#!/bin/bash

# =======================================================
# 🚀 DESARROLLO LOCAL - Subasta Silenciosa
# =======================================================
# Este script inicia todo el entorno de desarrollo local
# sin afectar la base de datos ni servicios de producción

echo "🏠 Iniciando entorno de desarrollo LOCAL..."
echo "================================================"

# Verificar que existe PostgreSQL local
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL no encontrado. Instálalo con:"
    echo "   brew install postgresql"
    exit 1
fi

# Crear base de datos si no existe
echo "📊 Configurando base de datos local..."
createdb subasta_silenciosa_local 2>/dev/null || true
echo "✅ Base de datos local configurada"

# Migrar base de datos local
echo "🔄 Ejecutando migraciones..."
cd backend && npm run db:migrate
echo "✅ Migraciones completadas"

# Configurar variables para desarrollo local
echo "🔧 Configurando entorno LOCAL..."
export NODE_ENV=development
export NEXT_PUBLIC_API_URL=http://localhost:4000

echo ""
echo "🌟 ¡Todo listo! Ahora ejecuta en terminales separadas:"
echo ""
echo "📱 Terminal 1 - Backend:"
echo "   cd backend && npm run dev"
echo ""
echo "🖥️  Terminal 2 - Admin Panel:"
echo "   cd admin-panel && npm run dev"
echo ""
echo "🌐 Terminal 3 - Public Web:"
echo "   cd public-web && npm run dev"
echo ""
echo "🔗 URLs de desarrollo:"
echo "   • Backend:     http://localhost:4000"
echo "   • Admin Panel: http://localhost:3000"
echo "   • Public Web:  http://localhost:3001"
echo ""
echo "⚠️  IMPORTANTE: Esto usa BD local, no afecta producción"
echo "================================================"
