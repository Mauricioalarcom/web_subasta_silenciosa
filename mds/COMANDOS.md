# 🚀 Comandos Rápidos - Cheat Sheet

Referencia rápida de comandos para desarrollo diario.

---

## 📦 Instalación y Setup

```bash
# Instalación completa automática
./install.sh

# O instalación manual
cd backend && npm install
cd ../admin-panel && npm install
cd ../backend && npm run db:migrate && npm run db:seed
```

---

## ▶️ Ejecutar Aplicación

```bash
# Iniciar todo (backend + frontend)
./start.sh

# O manualmente en 2 terminales
# Terminal 1:
cd backend && npm run dev

# Terminal 2:
cd admin-panel && npm run dev
```

---

## 🗄️ Base de Datos

```bash
cd backend

# Crear tablas
npm run db:migrate

# Poblar con datos de ejemplo
npm run db:seed

# Limpiar y recrear todo
npm run db:reset

# Conectar manualmente
psql -U postgres -d subasta_silenciosa

# Ver tablas
psql -U postgres -d subasta_silenciosa -c "\dt"

# Contar registros
psql -U postgres -d subasta_silenciosa -c "SELECT COUNT(*) FROM usuarios;"
```

---

## 🔍 Verificación y Testing

```bash
# Verificar que el backend esté corriendo
curl http://localhost:4000/health

# Ver logs del backend
cd backend && npm run dev

# Verificar errores TypeScript en admin
cd admin-panel && npm run type-check

# Build de producción del admin
cd admin-panel && npm run build

# Verificar linting
cd admin-panel && npm run lint
```

---

## 🧹 Limpieza

```bash
# Limpiar node_modules del backend
cd backend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# Limpiar node_modules del admin
cd admin-panel
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# Limpiar build del admin
cd admin-panel
rm -rf .next

# Limpiar todo el proyecto
cd /path/to/web_silenciosa
rm -rf backend/node_modules admin-panel/node_modules admin-panel/.next
npm cache clean --force
./install.sh
```

---

## 🐛 Troubleshooting

```bash
# Ver qué usa los puertos
lsof -i :4000  # Backend
lsof -i :3001  # Admin Panel

# Matar procesos
kill -9 <PID>

# Ver logs de PostgreSQL (macOS)
tail -f /usr/local/var/log/postgres.log

# Reiniciar PostgreSQL
# macOS
brew services restart postgresql@14

# Ubuntu
sudo systemctl restart postgresql

# Verificar estado de PostgreSQL
# macOS
brew services list

# Ubuntu
sudo systemctl status postgresql
```

---

## 📊 Consultas SQL Útiles

```sql
-- Conectar a la base de datos
psql -U postgres -d subasta_silenciosa

-- Ver todas las tablas
\dt

-- Ver usuarios
SELECT id, nombre, email, rol, activo FROM usuarios;

-- Ver evento
SELECT * FROM evento;

-- Ver obras
SELECT id, titulo, artista, precio_inicial, estado FROM obras;

-- Contar ofertas
SELECT COUNT(*) FROM ofertas;

-- Ver oferta más alta de cada obra
SELECT obra_id, MAX(monto) as oferta_maxima 
FROM ofertas 
GROUP BY obra_id;

-- Ver logs de actividad recientes
SELECT * FROM logs_actividad 
ORDER BY fecha DESC 
LIMIT 10;

-- Resetear password del admin
UPDATE usuarios 
SET password_hash = '$2a$10$XgWYRqHN3k.YXQQ2mEGjqOVHHq7qGJKXKYgJEhkJ.qQqrKb9z8TaW'
WHERE email = 'admin@subasta.com';
-- Password: admin123

-- Eliminar todos los datos (cuidado!)
TRUNCATE usuarios, evento, obras, ofertas, pagos, notificaciones, logs_actividad RESTART IDENTITY CASCADE;
```

---

## 🔐 Credenciales por Defecto

```
Email:    admin@subasta.com
Password: admin123
```

---

## 📝 Git Workflow

```bash
# Ver estado
git status

# Agregar cambios
git add .

# Commit
git commit -m "feat: descripción del cambio"

# Push
git push origin main

# Crear nuevo branch
git checkout -b feature/nombre-feature

# Ver branches
git branch

# Cambiar de branch
git checkout main
```

---

## 🌐 URLs

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Admin Panel** | http://localhost:3001 | Panel de administración |
| **Backend API** | http://localhost:4000 | API REST |
| **Health Check** | http://localhost:4000/health | Verificar backend |
| **Web Pública** | http://localhost:3000 | (Checkpoint 7) |

---

## 📦 NPM Scripts

### Backend (`cd backend`)

```bash
npm run dev          # Desarrollo con nodemon
npm start            # Producción
npm run db:migrate   # Crear tablas
npm run db:seed      # Datos de ejemplo
npm run db:reset     # Limpiar y recrear
npm test             # Tests (próximamente)
```

### Admin Panel (`cd admin-panel`)

```bash
npm run dev          # Desarrollo
npm run build        # Build producción
npm start            # Ejecutar build
npm run lint         # ESLint
npm run type-check   # TypeScript check
```

---

## 🔧 Variables de Entorno

### Backend (`.env`)

```env
PORT=4000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=subasta_silenciosa
DB_USER=postgres
DB_PASSWORD=tu_password
JWT_SECRET=secreto_seguro
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3001,http://localhost:3000
```

### Admin Panel (`.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## 🚀 Comandos de Producción (Próximamente)

```bash
# Build backend
cd backend
npm install --production

# Build frontend
cd admin-panel
npm run build
npm start

# Usar PM2 para procesos
npm install -g pm2
pm2 start backend/src/server.js --name api
pm2 start "npm start" --name admin --cwd admin-panel
pm2 save
pm2 startup
```

---

## 📊 Monitoreo

```bash
# Ver procesos Node.js
ps aux | grep node

# Ver uso de puertos
netstat -tuln | grep LISTEN

# Ver uso de memoria
top -o mem

# Ver logs en tiempo real
tail -f backend/logs/app.log
```

---

## 🎯 Próximos Checkpoints

```bash
# Checkpoint 2: Gestión de Eventos
# - Implementar formulario de evento
# - Upload de imágenes
# - Edición de fechas

# Checkpoint 3: Gestión de Obras
# - CRUD de obras
# - Upload múltiple de imágenes
# - Filtros y búsqueda

# Ver más en ARQUITECTURA_MVP.md
```

---

## 💡 Tips

- Usa `npm run dev` para desarrollo (hot reload)
- Siempre verifica logs en la terminal
- `Ctrl + C` para detener servidores
- Usa `npm ci` en vez de `npm install` en CI/CD
- Commit frecuentemente
- Lee los errores completos antes de buscar soluciones
- Usa `.env.example` como template

---

<div align="center">

**[Ver README completo](README.md)** | **[Guía de instalación](INSTALL.md)** | **[Arquitectura](ARQUITECTURA_MVP.md)**

</div>
