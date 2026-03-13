#!/bin/bash

# Script para Railway - Inicialización de la base de datos
echo "🔄 Iniciando migración de base de datos..."

# Ejecutar migraciones
node src/database/migrate.js

if [ $? -eq 0 ]; then
    echo "✅ Migración completada exitosamente"
    
    # Solo ejecutar seed en primera instalación si no hay datos
    echo "🌱 Verificando si necesita datos iniciales..."
    node src/database/seed.js
    
    if [ $? -eq 0 ]; then
        echo "✅ Datos iniciales configurados"
    else
        echo "ℹ️ Los datos iniciales ya existían o no se pudieron crear"
    fi
else
    echo "❌ Error en la migración de base de datos"
    exit 1
fi

echo "🚀 Iniciando servidor..."
