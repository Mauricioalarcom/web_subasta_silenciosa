# 📦 Guía de Instalación Completa

Esta guía te ayudará a instalar y configurar la Plataforma de Subasta Silenciosa paso a paso.

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

### Node.js (v18 o superior)
```bash
# Verificar versión
node --version

# Si no tienes Node.js, descárgalo desde:
# https://nodejs.org/
```

### PostgreSQL (v14 o superior)
```bash
# macOS (con Homebrew)
brew install postgresql@14
brew services start postgresql@14

# Ubuntu/Debian
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Windows
# Descargar desde: https://www.postgresql.org/download/windows/
```

### npm (viene con Node.js)
```bash
# Verificar versión
npm --version
```

## 🚀 Instalación Rápida (Automática)

### Opción 1: Script de Instalación

```bash
# 1. Navegar al directorio del proyecto
cd web_silenciosa

# 2. Ejecutar el script de instalación
./install.sh
```

El script automáticamente:
- ✅ Verifica Node.js
- ✅ Instala dependencias del backend
- ✅ Instala dependencias del admin-panel
- ✅ Crea archivo .env desde .env.example
- ✅ Te muestra los próximos pasos

## 📝 Instalación Manual (Paso a Paso)

Si prefieres instalar manualmente o el script automático falla:

### 1. Instalar Dependencias del Backend

```bash
cd backend
npm install
```

**Paquetes instalados:**
- express (servidor web)
- pg (PostgreSQL client)
- jsonwebtoken (autenticación)
- bcryptjs (hash de contraseñas)
- cors, helmet (seguridad)
- dotenv (variables de entorno)
- y más...

### 2. Instalar Dependencias del Admin Panel

```bash
cd ../admin-panel
npm install
```

**Paquetes instalados:**
- react, react-dom (UI framework)
- next (framework React)
- typescript (type safety)
- tailwindcss (estilos)
- axios (HTTP client)
- react-hot-toast (notificaciones)
- lucide-react (iconos)
- y más...

### 3. Configurar Variables de Entorno

```bash
cd ../backend
cp .env.example .env
```

Edita `backend/.env` con tu editor favorito:

```env
# Server
PORT=4000
NODE_ENV=development

# Database - EDITA ESTOS VALORES
DB_HOST=localhost
DB_PORT=5432
DB_NAME=subasta_silenciosa
DB_USER=postgres
DB_PASSWORD=TU_CONTRASEÑA_AQUI  # ⚠️ CAMBIAR

# JWT - EDITA EN PRODUCCIÓN
JWT_SECRET=un_secreto_muy_seguro_cambialo_en_produccion
JWT_EXPIRES_IN=7d

# Redis (opcional por ahora)
REDIS_HOST=localhost
REDIS_PORT=6379

# Email (configurar más tarde)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASSWORD=tu_password

# URLs
ADMIN_PANEL_URL=http://localhost:3001
PUBLIC_WEB_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3001,http://localhost:3000
```

### 4. Crear Base de Datos PostgreSQL

```bash
# Opción A: Con createdb
createdb subasta_silenciosa

# Opción B: Con psql
psql -U postgres
CREATE DATABASE subasta_silenciosa;
\q
```

Si tienes problemas de autenticación con PostgreSQL:

```bash
# macOS
psql postgres

# Ubuntu (como usuario postgres)
sudo -u postgres psql
```

### 5. Ejecutar Migraciones

```bash
cd backend
npm run db:migrate
```

**Esto creará 7 tablas:**
- ✅ usuarios
- ✅ evento
- ✅ obras
- ✅ ofertas
- ✅ pagos
- ✅ notificaciones
- ✅ logs_actividad

### 6. Poblar con Datos de Ejemplo

```bash
npm run db:seed
```

**Esto creará:**
- ✅ Usuario admin: admin@subasta.com / admin123
- ✅ Evento de ejemplo
- ✅ 3 obras de ejemplo

## ▶️ Ejecutar la Aplicación

### Iniciar Backend

```bash
# Terminal 1
cd backend
npm run dev
```

Deberías ver:
```
🚀 Servidor corriendo en puerto 4000
📡 Ambiente: development
🔗 URL: http://localhost:4000
```

### Iniciar Admin Panel

```bash
# Terminal 2 (nueva terminal)
cd admin-panel
npm run dev
```

Deberías ver:
```
ready - started server on 0.0.0.0:3001, url: http://localhost:3001
```

## 🔐 Acceder al Sistema

1. Abre tu navegador en: **http://localhost:3001**
2. Inicia sesión con:
   - **Email:** admin@subasta.com
   - **Password:** admin123

## ✅ Verificar la Instalación

### Verificar Backend

```bash
# Probar endpoint de health
curl http://localhost:4000/health
```

Respuesta esperada:
```json
{
  "success": true,
  "message": "API funcionando correctamente",
  "timestamp": "2026-02-18T...",
  "environment": "development"
}
```

### Verificar Frontend

1. Ve a http://localhost:3001
2. Deberías ver la página de login
3. Inicia sesión con las credenciales de prueba
4. Deberías ver el dashboard con métricas

## 🐛 Solución de Problemas

### Error: "Cannot find module"

```bash
# Limpiar cache de npm y reinstalar
cd backend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# Repetir para admin-panel
cd ../admin-panel
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Error: "ECONNREFUSED" (PostgreSQL)

PostgreSQL no está corriendo. Inícialo:

```bash
# macOS
brew services start postgresql@14

# Ubuntu
sudo systemctl start postgresql

# Windows
# Usa el Panel de Servicios para iniciar PostgreSQL
```

### Error: "password authentication failed"

Edita `backend/.env` con las credenciales correctas:

```bash
# Verificar usuario y password de PostgreSQL
psql -U postgres -W

# Si no recuerdas el password, puedes resetearlo:
# macOS/Linux
sudo -u postgres psql
ALTER USER postgres PASSWORD 'nuevo_password';
```

### Error: "relation does not exist"

No ejecutaste las migraciones:

```bash
cd backend
npm run db:migrate
```

### Error: Puerto 4000 o 3001 en uso

```bash
# Ver qué proceso usa el puerto
lsof -i :4000
lsof -i :3001

# Matar el proceso (reemplaza PID)
kill -9 PID
```

### Error de CORS en el navegador

Verifica que en `backend/.env` tengas:
```env
CORS_ORIGIN=http://localhost:3001,http://localhost:3000
```

## 📊 Estructura de Base de Datos

Después de las migraciones, tendrás:

```
subasta_silenciosa
├── usuarios (1 admin)
├── evento (1 evento de ejemplo)
├── obras (3 obras de ejemplo)
├── ofertas (vacío)
├── pagos (vacío)
├── notificaciones (vacío)
└── logs_actividad (vacío)
```

## 🔄 Actualizar el Proyecto

```bash
# Backend
cd backend
npm install

# Admin Panel
cd ../admin-panel
npm install
```

## 🧹 Limpiar y Reiniciar

```bash
# Borrar base de datos y recrear
dropdb subasta_silenciosa
createdb subasta_silenciosa

# Ejecutar migraciones nuevamente
cd backend
npm run db:migrate
npm run db:seed
```

## 📚 Próximos Pasos

Una vez instalado y funcionando:

1. ✅ **Explora el Dashboard** - Ve las métricas básicas
2. ✅ **Configura el Evento** - Ve a la sección "Evento"
3. ✅ **Agrega Obras** - Ve a la sección "Obras"
4. ✅ **Lee la Documentación** - Revisa [ARQUITECTURA_MVP.md](ARQUITECTURA_MVP.md)

## 🆘 Soporte

Si encuentras problemas:

1. Verifica los logs en la terminal
2. Revisa la sección de Troubleshooting en [README.md](README.md)
3. Asegúrate de haber seguido todos los pasos
4. Verifica que PostgreSQL esté corriendo
5. Confirma que los puertos 4000 y 3001 estén libres

## ✨ ¡Listo!

Si llegaste hasta aquí exitosamente, ¡felicidades! 🎉

Tu plataforma de Subasta Silenciosa está instalada y lista para usar.

**URLs de acceso:**
- 🔧 Backend API: http://localhost:4000
- 🎨 Panel Admin: http://localhost:3001

**Credenciales:**
- 📧 Email: admin@subasta.com
- 🔑 Password: admin123

---

**Siguiente:** Implementa el [Checkpoint 2: Gestión de Eventos](CHECKPOINT_1_COMPLETADO.md#próximos-checkpoints)
