# Script de inicio rápido
# Ejecuta este script después de instalar las dependencias

echo "🚀 Iniciando aplicación de Subasta Silenciosa..."
echo ""

# Verificar que PostgreSQL esté corriendo
echo "1️⃣ Verificando PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL no está instalado"
    echo "Instálalo siguiendo las instrucciones en el README.md"
    exit 1
fi

echo "✅ PostgreSQL encontrado"
echo ""

# Verificar que existan las dependencias del backend
echo "2️⃣ Verificando dependencias del backend..."
if [ ! -d "backend/node_modules" ]; then
    echo "❌ Las dependencias del backend no están instaladas"
    echo "Ejecuta: cd backend && npm install"
    exit 1
fi
echo "✅ Dependencias del backend instaladas"
echo ""

# Verificar que existan las dependencias del admin-panel
echo "3️⃣ Verificando dependencias del admin-panel..."
if [ ! -d "admin-panel/node_modules" ]; then
    echo "❌ Las dependencias del admin-panel no están instaladas"
    echo "Ejecuta: cd admin-panel && npm install"
    exit 1
fi
echo "✅ Dependencias del admin-panel instaladas"
echo ""

# Verificar archivo .env
echo "4️⃣ Verificando configuración..."
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Archivo .env no encontrado en /backend"
    echo "Copiando .env.example a .env..."
    cp backend/.env.example backend/.env
    echo "✅ Archivo .env creado"
    echo "⚠️  Recuerda editar backend/.env con tus credenciales de base de datos"
    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Todo listo para comenzar!"
echo ""
echo "📝 Próximos pasos:"
echo ""
echo "1. Edita backend/.env con tus credenciales de PostgreSQL"
echo "2. Crea la base de datos: CREATE DATABASE subasta_silenciosa;"
echo "3. Ejecuta las migraciones: cd backend && npm run db:migrate"
echo "4. Puebla con datos de ejemplo: npm run db:seed"
echo "5. Inicia el backend: npm run dev"
echo "6. En otra terminal, inicia el admin-panel: cd admin-panel && npm run dev"
echo ""
echo "🌐 URLs:"
echo "   Backend API:  http://localhost:4000"
echo "   Admin Panel:  http://localhost:3001"
echo ""
echo "🔐 Login admin:"
echo "   Email:    admin@subasta.com"
echo "   Password: admin123"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
