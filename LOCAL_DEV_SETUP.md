# 🏠 Desarrollo Local - Guía Completa

## ✅ Configuración Completa para Desarrollo Local

Esta configuración te permite probar **todos los cambios localmente** sin afectar:
- ❌ Base de datos de producción
- ❌ Backend de producción (Railway)
- ❌ Deployments en Vercel

---

## 🗄️ Base de Datos

### **Local (Desarrollo):**
```
Host: localhost
Database: subasta_silenciosa_local
User: postgres
Port: 5432
```

### **Producción (NO tocar):**
```
Host: Railway
Database: railway
Usuario: postgres
```

---

## 🔗 URLs

### **Desarrollo Local:**
- **Backend**: `http://localhost:4000`
- **Admin Panel**: `http://localhost:3000` 
- **Public Web**: `http://localhost:3001`

### **Producción (NO afectada):**
- **Backend**: `https://websubastasilenciosa-production.up.railway.app`
- **Admin Panel**: `https://web-admin-lake.vercel.app`
- **Public Web**: (por deployar)

---

## 🚀 Cómo Iniciar Desarrollo Local

### **Opción 1: Script Automático (Recomendado)**
```bash
./start-local-dev.sh
```

### **Opción 2: Manual**

**Terminal 1 - Backend:**
```bash
cd backend
npm install
npm run dev        # Usa .env.local automáticamente
```

**Terminal 2 - Admin Panel:**
```bash
cd admin-panel
npm install
npm run dev        # Puerto 3000, usa .env.local
```

**Terminal 3 - Public Web:**
```bash
cd public-web
npm install
npm run dev        # Puerto 3001, usa .env.local
```

---

## 🔧 Archivos de Configuración

### **Backend (.env.local):**
- Base de datos local
- JWT secrets locales
- CORS para localhost

### **Admin Panel (.env.local):**
- `NEXT_PUBLIC_API_URL=http://localhost:4000`
- Google OAuth credentials
- NextAuth config local

### **Public Web (.env.local):**
- `NEXT_PUBLIC_API_URL=http://localhost:4000`
- Google OAuth credentials
- NextAuth config local

---

## 🧪 Qué Puedes Probar

### ✅ **Funcionalidades Completas:**
- **SSO entre admin-panel y public-web**
- **Google OAuth** (usando las mismas credenciales)
- **Registro automático de administradores**
- **Login con email/password**
- **Creación de eventos y obras**
- **Sistema de ofertas**
- **WebSockets en tiempo real**

### ✅ **Sin Riesgo:**
- Cambios en base de datos local
- Pruebas de autenticación
- Modificaciones de código
- Testing completo

---

## 📊 Base de Datos Local

### **Migrar Esquema:**
```bash
cd backend
npm run db:migrate
```

### **Datos de Prueba:**
```bash
cd backend
npm run db:seed
```

### **Conectar desde CLI:**
```bash
psql subasta_silenciosa_local
```

---

## 🔑 Google OAuth

Las mismas credenciales de Google Cloud Console funcionan porque ya incluimos:
- ✅ `http://localhost:3000`
- ✅ `http://localhost:3001` 
- ✅ `http://localhost:3000/api/auth/callback/google`
- ✅ `http://localhost:3001/api/auth/callback/google`

---

## 🚀 Cuando Estés Listo

### **Para Producción:**
1. Cambiar `.env.local` a `.env`
2. Usar URLs de producción
3. Deploy a Vercel/Railway
4. Commit a rama `main`

### **Para Mergear a Main:**
```bash
git add .
git commit -m "feat: SSO completo entre admin y public web"
git checkout main
git merge fati2
git push origin main
```

---

## 🛟 Troubleshooting

### **Si el backend no conecta a la BD:**
```bash
# Verificar PostgreSQL activo
brew services start postgresql

# Crear BD si no existe
createdb subasta_silenciosa_local
```

### **Si hay error de puertos:**
```bash
# Verificar qué está usando el puerto
lsof -i :4000
lsof -i :3000
lsof -i :3001
```

### **Si NextAuth falla:**
- Verificar `NEXTAUTH_SECRET` en `.env.local`
- Verificar Google OAuth credentials
- Revisar URLs en Google Cloud Console

---

## 📝 Notas Importantes

- ✅ **Todos los cambios son locales**
- ✅ **No afecta producción**  
- ✅ **Base de datos separada**
- ✅ **Puedes probar Google OAuth**
- ✅ **SSO completo funcional**
- ⚠️ **Cambios en código requieren commit para persistir**
