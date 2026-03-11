#!/bin/bash

# Script para detener procesos corriendo en los puertos 4000 y 3001

echo "🛑 Deteniendo servidores de Subasta Silenciosa..."
echo ""

# Detener proceso en puerto 4000 (Backend)
BACKEND_PID=$(lsof -ti:4000)
if [ ! -z "$BACKEND_PID" ]; then
    echo "🔧 Deteniendo Backend API (Puerto 4000)..."
    kill -9 $BACKEND_PID 2>/dev/null
    echo "✅ Backend detenido"
else
    echo "ℹ️  No hay proceso corriendo en el puerto 4000"
fi

# Detener proceso en puerto 3001 (Admin Panel)
FRONTEND_PID=$(lsof -ti:3001)
if [ ! -z "$FRONTEND_PID" ]; then
    echo "🎨 Deteniendo Admin Panel (Puerto 3001)..."
    kill -9 $FRONTEND_PID 2>/dev/null
    echo "✅ Admin Panel detenido"
else
    echo "ℹ️  No hay proceso corriendo en el puerto 3001"
fi

# Detener proceso en puerto 3000 (Público - futuro)
PUBLIC_PID=$(lsof -ti:3000)
if [ ! -z "$PUBLIC_PID" ]; then
    echo "🌐 Deteniendo Web Pública (Puerto 3000)..."
    kill -9 $PUBLIC_PID 2>/dev/null
    echo "✅ Web Pública detenida"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Todos los servidores han sido detenidos"
echo ""
echo "Para iniciar nuevamente, ejecuta:"
echo "   ./start-dev.sh    (inicia ambos servidores)"
echo "   ./start.sh        (solo verifica configuración)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
