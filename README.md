# 🎨 Plataforma de Subasta Silenciosa

> Sistema completo de subasta silenciosa con panel de administración y plataforma pública para postores.

**Estado Actual:** ✅ Checkpoint 1 Completado - Base del proyecto funcional

---

## 🚀 Inicio Rápido

```bash
# Instalación automática
./install.sh

# Iniciar aplicación
./start.sh
```

Accede al panel admin en **http://localhost:3001**  
Credenciales: `admin@subasta.com` / `admin123`

---

## 📋 Documentación

| Documento | Descripción |
|-----------|-------------|
| **[📦 INSTALL.md](INSTALL.md)** | Guía completa de instalación y troubleshooting |
| **[🏗️ ARQUITECTURA_MVP.md](ARQUITECTURA_MVP.md)** | Documentación técnica detallada |
| **[✅ CHECKPOINT_1_COMPLETADO.md](CHECKPOINT_1_COMPLETADO.md)** | Resumen del progreso actual |

---

## 📦 Requisitos Previos

| Herramienta | Versión Mínima | Verificar |
|-------------|----------------|-----------|
| **Node.js** | v18+ | `node --version` |
| **PostgreSQL** | v14+ | `psql --version` |
| **npm** | v9+ | `npm --version` |

**Instalación rápida:** Ver [INSTALL.md](INSTALL.md#-requisitos-previos)

---

## 🏗️ Arquitectura

```
┌─────────────────┐        ┌─────────────────┐
│   Admin Panel   │───────▶│   Backend API   │
│   (Next.js)     │  HTTP  │   (Express)     │
│   Port: 3001    │◀───────│   Port: 4000    │
└─────────────────┘        └─────────────────┘
                                    │
                                    ▼
                           ┌─────────────────┐
                           │   PostgreSQL    │
                           │   Database      │
                           └─────────────────┘
```

### Stack Tecnológico

**Backend:**
- Node.js 18+ + Express 4.18
- PostgreSQL 14+
- JWT Authentication
- Bcrypt, Helmet, CORS

**Frontend:**
- Next.js 14 + TypeScript 5
- React 18
- TailwindCSS 3
- Axios + React Query
- React Hot Toast

Ver más en [ARQUITECTURA_MVP.md](ARQUITECTURA_MVP.md)

---

## 🛠️ Instalación

### Opción 1: Instalación Automática (Recomendada)

```bash
./install.sh
```

### Opción 2: Instalación Manual

```bash
# 1. Instalar dependencias
cd backend && npm install
cd ../admin-panel && npm install

# 2. Configurar variables de entorno
cd ../backend
cp .env.example .env
# Editar .env con tus credenciales

# 3. Crear base de datos
createdb subasta_silenciosa

# 4. Ejecutar migraciones
npm run db:migrate

# 5. Poblar con datos de ejemplo
npm run db:seed
```

**Para más detalles, consulta [INSTALL.md](INSTALL.md)**

---

## ▶️ Ejecución

### Opción 1: Script de Inicio (Recomendado)

```bash
./start.sh
```

### Opción 2: Manual

```bash
# Terminal 1: Backend API
cd backend
npm run dev

# Terminal 2: Admin Panel
cd admin-panel
npm run dev
```

### URLs de Acceso

| Aplicación | URL | Credenciales |
|------------|-----|--------------|
| **Panel Admin** | http://localhost:3001 | `admin@subasta.com` / `admin123` |
| **Backend API** | http://localhost:4000 | - |
| **Health Check** | http://localhost:4000/health | - |

---

## 🔐 Credenciales por Defecto

> ⚠️ **Solo para desarrollo - Cambiar en producción**

- **Email:** admin@subasta.com
- **Password:** admin123

---

## 📁 Estructura del Proyecto

```
web_silenciosa/
├── 📂 backend/                # API Backend (Node.js + Express)
│   ├── src/
│   │   ├── config/           # Configuración (db, jwt, email)
│   │   ├── controllers/      # Lógica de negocio
│   │   ├── database/         # Migraciones y seeds
│   │   ├── middleware/       # Auth, errorHandler
│   │   ├── routes/           # Endpoints de API
│   │   └── server.js         # Entry point
│   ├── .env.example          # Template de variables
│   └── package.json          # Dependencias backend
│
├── 📂 admin-panel/           # Panel Admin (Next.js + TypeScript)
│   ├── src/
│   │   ├── components/       # Componentes reutilizables
│   │   ├── contexts/         # AuthContext, etc.
│   │   ├── lib/              # API client (axios)
│   │   ├── pages/            # Páginas (Dashboard, Login, etc.)
│   │   └── styles/           # CSS global y Tailwind
│   ├── .env.local            # Variables de entorno
│   └── package.json          # Dependencias frontend
│
├── 📄 ARQUITECTURA_MVP.md    # Documentación técnica completa
├── 📄 INSTALL.md             # Guía de instalación detallada
├── 📄 CHECKPOINT_1_COMPLETADO.md  # Estado actual
├── 🚀 install.sh             # Script de instalación
├── 🚀 start.sh               # Script de inicio
└── 📄 README.md              # Este archivo
```

---

## 🎯 Roadmap de Desarrollo

### ✅ Checkpoint 1: Configuración Inicial (COMPLETADO)

<details>
<summary>Ver detalles del Checkpoint 1</summary>

**Backend:**
- [x] Estructura base del proyecto
- [x] Base de datos PostgreSQL con 7 tablas
- [x] API REST con Express
- [x] Sistema de autenticación JWT
- [x] Middleware de seguridad (helmet, cors)
- [x] Migraciones y seeds

**Frontend:**
- [x] Panel Admin con Next.js + TypeScript
- [x] Sistema de autenticación
- [x] Dashboard con métricas básicas
- [x] Layout con sidebar navegación
- [x] Páginas placeholder para futuros checkpoints

**Datos de prueba:**
- [x] Usuario admin: admin@subasta.com / admin123
- [x] Evento de ejemplo: "Subasta de Arte Contemporáneo 2026"
- [x] 3 obras de ejemplo con imágenes

📚 **Más detalles:** [CHECKPOINT_1_COMPLETADO.md](CHECKPOINT_1_COMPLETADO.md)

</details>

---

### 🔄 Checkpoint 2: Gestión de Eventos (PRÓXIMO)

**Objetivo:** Permitir al administrador configurar el evento de subasta

**Tareas:**
- [ ] Formulario de edición de evento
- [ ] Upload de imágenes (logo y banner)
- [ ] Selector de fechas (inicio y cierre)
- [ ] Validaciones de formulario
- [ ] Preview del evento
- [ ] Guardar cambios en base de datos

**Endpoints a crear:**
- `GET /api/admin/evento` - Obtener evento actual
- `PUT /api/admin/evento` - Actualizar evento
- `POST /api/admin/evento/image` - Subir imágenes

---

### 📋 Checkpoint 3: Gestión de Obras

**Objetivo:** CRUD completo de obras de arte

**Tareas:**
- [ ] Listado de obras con filtros
- [ ] Formulario crear nueva obra
- [ ] Editar obra existente  
- [ ] Eliminar obra (soft delete)
- [ ] Upload múltiple de imágenes
- [ ] Configuración de precio inicial y cierre
- [ ] Preview de obra

**Endpoints a crear:**
- `GET /api/admin/obras` - Listar obras
- `POST /api/admin/obras` - Crear obra
- `PUT /api/admin/obras/:id` - Actualizar obra
- `DELETE /api/admin/obras/:id` - Eliminar obra
- `POST /api/admin/obras/:id/images` - Subir imágenes

---

### 💰 Checkpoint 4: Sistema de Ofertas

**Objetivo:** Implementar lógica de subasta y ofertas

**Tareas:**
- [ ] API de ofertas con validaciones
- [ ] Regla: oferta mínima > oferta actual + incremento
- [ ] Control de concurrencia con locks
- [ ] Cierre dinámico (extensión de 10 min si oferta en últimos 10 min)
- [ ] Notificaciones por email al ser superado
- [ ] Historial de ofertas por obra

**Endpoints a crear:**
- `GET /api/admin/ofertas` - Listar todas las ofertas
- `GET /api/admin/ofertas/obra/:obraId` - Ofertas de una obra
- `POST /api/admin/ofertas/:id/accept` - Aceptar/rechazar oferta

---

### 💳 Checkpoint 5: Sistema de Pagos

**Objetivo:** Gestionar pagos y entregas

**Tareas:**
- [ ] Listado de pagos pendientes
- [ ] Confirmación manual de pagos
- [ ] Estados de entrega (pendiente, enviado, entregado)
- [ ] Registro de información de entrega
- [ ] Notificaciones de pago confirmado
- [ ] Exportar comprobantes PDF

**Endpoints a crear:**
- `GET /api/admin/pagos` - Listar pagos
- `PUT /api/admin/pagos/:id/confirm` - Confirmar pago
- `PUT /api/admin/pagos/:id/delivery` - Actualizar entrega
- `GET /api/admin/pagos/:id/receipt` - Generar comprobante

---

### 📊 Checkpoint 6: Dashboard y Reportes Avanzados

**Objetivo:** Panel con métricas en tiempo real

**Tareas:**
- [ ] Dashboard con WebSocket para actualizaciones en tiempo real
- [ ] Gráficos interactivos (Chart.js o Recharts)
- [ ] Métricas: recaudación, obras activas, participantes, ofertas
- [ ] Tabla de top obras por precio
- [ ] Timeline de actividad reciente
- [ ] Exportar reportes a CSV/Excel
- [ ] Filtros por fecha

**Endpoints a crear:**
- `GET /api/admin/dashboard/metrics` - Métricas generales
- `GET /api/admin/dashboard/activity` - Actividad reciente
- `GET /api/admin/dashboard/export` - Exportar datos
- `WebSocket /admin` - Actualizaciones en tiempo real

---

### 🌐 Checkpoint 7: Plataforma Pública (Postores)

**Objetivo:** Frontend para usuarios finales (postores)

**Tareas:**
- [ ] Aplicación Next.js separada (public-web/)
- [ ] Login con Google OAuth
- [ ] Registro de usuarios
- [ ] Galería de obras con filtros y búsqueda
- [ ] Detalle de obra con contador en vivo
- [ ] Sistema de ofertas con validación en tiempo real
- [ ] Notificaciones cuando son superados
- [ ] Vista "Mis Ofertas"
- [ ] Página de pago para ganadores
- [ ] Perfil de usuario

**Endpoints a crear:**
- `POST /api/auth/google` - Login con Google
- `GET /api/obras` - Listar obras públicas
- `GET /api/obras/:id` - Detalle de obra
- `POST /api/ofertas` - Hacer oferta
- `GET /api/user/ofertas` - Mis ofertas
- `POST /api/pagos` - Iniciar pago
- `WebSocket /public` - Actualizaciones de ofertas

---

## 🎨 Características Principales

| Característica | Descripción | Checkpoint |
|----------------|-------------|------------|
| 🔐 **Autenticación** | JWT con httpOnly cookies | 1 ✅ |
| 👔 **Panel Admin** | Dashboard con métricas | 1 ✅ |
| 🎪 **Gestión de Eventos** | Configurar fecha, logo, banner | 2 |
| 🖼️ **Gestión de Obras** | CRUD con upload de imágenes | 3 |
| 💵 **Sistema de Ofertas** | Validaciones + cierre dinámico | 4 |
| 💳 **Sistema de Pagos** | Confirmación manual + entrega | 5 |
| 📊 **Dashboard Avanzado** | Tiempo real con WebSocket | 6 |
| 🌐 **Web Pública** | Login Google + ofertas en vivo | 7 |

---

## 🔒 Seguridad

- ✅ Passwords hasheados con bcrypt (10 rounds)
- ✅ JWT tokens en httpOnly cookies
- ✅ Helmet.js para headers de seguridad
- ✅ CORS configurado por whitelist
- ✅ Validación de inputs en backend
- ✅ Rate limiting (a implementar en producción)
- ✅ SQL injection protection (queries parametrizadas)

---

## 🐛 Troubleshooting

### Error: "Cannot find module"

```bash
# Limpiar cache y reinstalar
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

### Error: "ECONNREFUSED" (PostgreSQL no conecta)

```bash
# macOS
brew services start postgresql@14

# Ubuntu/Debian
sudo systemctl start postgresql

# Verificar que esté corriendo
psql -U postgres -c "SELECT version();"
```

### Error: "password authentication failed"

```bash
# Verificar credenciales en backend/.env
DB_USER=postgres
DB_PASSWORD=tu_password_real

# Probar conexión manual
psql -U postgres -d subasta_silenciosa
```

### Error: "relation does not exist"

```bash
# No ejecutaste las migraciones
cd backend
npm run db:migrate
```

### Error: Puerto 4000 o 3001 en uso

```bash
# Ver qué proceso usa el puerto
lsof -i :4000
lsof -i :3001

# Matar el proceso (reemplaza <PID>)
kill -9 <PID>

# O cambiar el puerto en los .env
```

### Error de CORS en el navegador

```bash
# Verificar backend/.env
CORS_ORIGIN=http://localhost:3001,http://localhost:3000

# Reiniciar el backend después de cambiar
cd backend
npm run dev
```

**Más soluciones:** Ver [INSTALL.md - Solución de Problemas](INSTALL.md#-solución-de-problemas)

---

## 📚 Comandos Útiles

### Backend

```bash
cd backend

# Desarrollo
npm run dev              # Iniciar con nodemon

# Base de datos
npm run db:migrate       # Crear tablas
npm run db:seed          # Poblar datos de prueba
npm run db:reset         # Limpiar y recrear

# Testing (próximamente)
npm test                 # Ejecutar tests
```

### Admin Panel

```bash
cd admin-panel

# Desarrollo
npm run dev              # Iniciar dev server

# Build
npm run build            # Compilar para producción
npm start                # Ejecutar build

# Linting
npm run lint             # Ejecutar ESLint
npm run type-check       # Verificar tipos TypeScript
```

---

## 📝 Variables de Entorno

### Backend (`backend/.env`)

```env
# Server
PORT=4000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=subasta_silenciosa
DB_USER=postgres
DB_PASSWORD=tu_contraseña

# JWT
JWT_SECRET=un_secreto_muy_seguro
JWT_EXPIRES_IN=7d

# URLs
ADMIN_PANEL_URL=http://localhost:3001
PUBLIC_WEB_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3001,http://localhost:3000
```

### Admin Panel (`admin-panel/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## 🚀 Deployment (Próximamente)

### Backend (Railway / Render / Heroku)
- Configurar variables de entorno
- Conectar a PostgreSQL en la nube
- Deploy automático desde GitHub

### Frontend (Vercel / Netlify)
- Configurar `NEXT_PUBLIC_API_URL`
- Deploy automático desde GitHub
- Configurar dominio personalizado

---

## 📖 Recursos Adicionales

- [📦 Guía de Instalación Completa](INSTALL.md)
- [🏗️ Arquitectura y Especificaciones Técnicas](ARQUITECTURA_MVP.md)
- [✅ Estado del Checkpoint 1](CHECKPOINT_1_COMPLETADO.md)
- [🎯 Roadmap Detallado](#-roadmap-de-desarrollo)

---

## 💬 Preguntas Frecuentes

<details>
<summary><strong>¿Por qué dos aplicaciones separadas (backend y admin-panel)?</strong></summary>

Separar el backend de los frontends permite:
- Escalabilidad independiente
- Reutilizar la API para múltiples clientes (admin, web pública, mobile)
- Desplegar en servicios diferentes
- Mejor organización del código

</details>

<details>
<summary><strong>¿Es necesario Redis?</strong></summary>

No es obligatorio en el MVP. Redis se usaría para:
- Cache de sesiones
- Queue de emails con Bull
- Rate limiting

Por ahora es opcional, se puede agregar después.

</details>

<details>
<summary><strong>¿Cómo cambio el puerto del backend o frontend?</strong></summary>

**Backend:** Edita `backend/.env`
```env
PORT=5000
```

**Admin Panel:** Next.js automáticamente usa el puerto disponible, pero puedes especificarlo:
```bash
npm run dev -- -p 3002
```

</details>

<details>
<summary><strong>¿Puedo usar MySQL en vez de PostgreSQL?</strong></summary>

Sí, pero necesitarías:
1. Instalar `mysql2` en vez de `pg`
2. Modificar las queries SQL (sintaxis puede variar)
3. Cambiar el driver en `backend/src/config/db.js`

PostgreSQL es recomendado por sus características avanzadas.

</details>

---

## 🤝 Contribución

Este proyecto está en desarrollo activo siguiendo los checkpoints del roadmap.

**Para contribuir:**
1. Revisar el checkpoint actual
2. Crear un branch desde `main`
3. Implementar funcionalidad siguiendo las especificaciones
4. Crear PR con descripción detallada

---

## 📄 Licencia

Proyecto privado - Todos los derechos reservados

---

## ✨ Autor

**Proyecto Web Silenciosa** - MVP de Plataforma de Subasta Silenciosa  
UTEC - 2026

---

<div align="center">

**[⬆ Volver arriba](#-plataforma-de-subasta-silenciosa)**

Made with ❤️ using Node.js, Next.js, and PostgreSQL

</div>
