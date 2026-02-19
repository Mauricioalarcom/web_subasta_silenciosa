#!/bin/bash

# Script de inicio con servidores en paralelo
# Ejecuta este script para iniciar backend y frontend simultáneamente

set -e  # Exit on error

echo "🚀 Iniciando aplicación de Subasta Silenciosa..."
echo ""

# Verificar que PostgreSQL esté corriendo
echo "1️⃣ Verificando PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL no está instalado"
    echo "Instálalo siguiendo las instrucciones en INSTALL.md"
    exit 1
fi

echo "✅ PostgreSQL encontrado"
echo ""

# Verificar que existan las dependencias del backend
echo "2️⃣ Verificando dependencias del backend..."
if [ ! -d "backend/node_modules" ]; then
    echo "❌ Las dependencias del backend no están instaladas"
    echo "Ejecuta: ./install.sh"
    exit 1
fi
echo "✅ Dependencias del backend instaladas"
echo ""

# Verificar que existan las dependencias del admin-panel
echo "3️⃣ Verificando dependencias del admin-panel..."
if [ ! -d "admin-panel/node_modules" ]; then
    echo "❌ Las dependencias del admin-panel no están instaladas"
    echo "Ejecuta: ./install.sh"
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
    echo "⚠️  Edita backend/.env con tus credenciales antes de continuar"
    echo ""
    read -p "¿Deseas continuar de todas formas? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "✅ Configuración verificada"
echo ""

# Verificar si la base de datos existe (opcional, ignora error si no puede conectar)
echo "5️⃣ Verificando base de datos..."
if psql -U postgres -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw subasta_silenciosa; then
    echo "✅ Base de datos 'subasta_silenciosa' encontrada"
else
    echo "⚠️  Base de datos 'subasta_silenciosa' no encontrada o no se pudo verificar"
    echo "Puedes crearla manualmente con: createdb subasta_silenciosa"
    echo "Luego ejecuta: cd backend && npm run db:migrate && npm run db:seed"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Iniciando servidores..."
echo ""

# Trap Ctrl+C para matar ambos procesos
trap 'echo ""; echo "🛑 Deteniendo servidores..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit' INT TERM

# Iniciar backend
echo "🔧 Iniciando Backend API en http://localhost:4000 ..."
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Esperar 3 segundos para que el backend se inicie
echo "⏳ Esperando que el backend inicie..."
sleep 3

# Iniciar frontend
echo "🎨 Iniciando Admin Panel en http://localhost:3001 ..."
cd admin-panel
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Esperar 2 segundos
sleep 2

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Servidores iniciados correctamente!"
echo ""
echo "🌐 URLs disponibles:"
echo ""
echo "   📡 Backend API:   http://localhost:4000"
echo "   🎨 Admin Panel:   http://localhost:3001"
echo "   ❤️  Health Check:  http://localhost:4000/health"
echo ""
echo "🔐 Credenciales de login:"
echo ""
echo "   📧 Email:    admin@subasta.com"
echo "   🔑 Password: admin123"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Comandos útiles:"
echo ""
echo "   Ver logs backend:   tail -f backend.log"
echo "   Ver logs frontend:  tail -f frontend.log"
echo "   Detener todo:       Presiona Ctrl+C"
echo "   Reiniciar:          Ejecuta ./start-dev.sh nuevamente"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⏳ Los servidores están corriendo. Presiona Ctrl+C para detener."
echo ""
echo "💡 Tip: Abre http://localhost:3001 en tu navegador para acceder al panel admin"
echo ""

# Esperar a que ambos procesos terminen
wait $BACKEND_PID $FRONTEND_PID
