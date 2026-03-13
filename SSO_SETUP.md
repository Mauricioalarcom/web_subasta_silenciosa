# 🔐 Single Sign-On (SSO) - Admin & Public Web

## ✅ Configuración Completada

### **Cómo Funciona el SSO:**

1. **Administradores** pueden acceder a ambas aplicaciones con la misma cuenta
2. **Usuarios públicos** solo pueden acceder a public-web
3. **Detección automática** del rol del usuario

---

## 🎯 Flujo de Autenticación

### **Para Administradores:**

1. **Registro en admin-panel:**
   - ✅ Google OAuth → Automáticamente ADMIN
   - ✅ Email/Password → Automáticamente ADMIN
   
2. **Acceso a public-web:**
   - ✅ Mismo Google OAuth → Detectado como ADMIN
   - ✅ Banner especial con link al admin-panel
   - ✅ Indicador "👑 Administrador" en navbar

### **Para Usuarios Públicos:**

1. **Registro en public-web:**
   - ✅ Google OAuth → USUARIO (nunca admin)
   - ✅ Email/Password → USUARIO (nunca admin)

2. **No pueden acceder a admin-panel**

---

## 🚀 URLs de Aplicaciones

### **Desarrollo:**
- **Admin Panel**: `http://localhost:3000`
- **Public Web**: `http://localhost:3001`

### **Producción:**
- **Admin Panel**: `https://web-admin-lake.vercel.app`
- **Public Web**: `https://tu-public-web.vercel.app`

---

## 🔧 Variables de Entorno Necesarias

### **Ambas Aplicaciones:**
```env
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret
NEXTAUTH_SECRET=tu_secret_aleatorio_seguro
NEXT_PUBLIC_API_URL=https://websubastasilenciosa-production.up.railway.app
```

### **Admin Panel:**
```env
NEXTAUTH_URL=https://web-admin-lake.vercel.app
```

### **Public Web:**
```env
NEXTAUTH_URL=https://tu-public-web.vercel.app
```

---

## 📋 Configuración Google OAuth

### **Authorized JavaScript Origins:**
```
http://localhost:3000
http://localhost:3001
https://web-admin-lake.vercel.app
https://tu-public-web.vercel.app
https://websubastasilenciosa-production.up.railway.app
```

### **Authorized Redirect URIs:**
```
http://localhost:3000/api/auth/callback/google
http://localhost:3001/api/auth/callback/google
https://web-admin-lake.vercel.app/api/auth/callback/google
https://tu-public-web.vercel.app/api/auth/callback/google
```

---

## 🎨 Características UI/UX

### **Para Administradores en Public Web:**

1. **AdminBanner:**
   - Banner púrpura en la parte superior
   - Link directo al panel admin
   - Opción para ocultar

2. **Navbar Actualizado:**
   - Indicador "👑 Administrador"
   - Información de rol visible

3. **Acceso Completo:**
   - Todas las funciones de usuario público
   - Acceso directo al panel admin

---

## 🛠 Endpoints Creados

### **Backend:**

1. **`POST /api/admin/auth/google`** - OAuth para admins
2. **`POST /api/admin/auth/login`** - Login tradicional admin
3. **`POST /api/admin/auth/register`** - Registro admin
4. **`GET /api/admin/auth/check-admin?email=...`** - Verificar si es admin

### **Público:**

1. **`POST /api/auth/google`** - OAuth usuarios públicos (nunca admin)
2. **`POST /api/auth/login`** - Login tradicional público

---

## 📱 Casos de Uso

### **Caso 1: Admin se registra en admin-panel**
- ✅ Crea cuenta como ADMIN
- ✅ Puede entrar a public-web con misma cuenta
- ✅ Ve banner de administrador

### **Caso 2: Usuario público se registra en public-web**
- ✅ Crea cuenta como USUARIO
- ❌ NO puede acceder al admin-panel
- ✅ Solo ve interfaz pública

### **Caso 3: Admin existente usa public-web**
- ✅ Google detecta que ya es admin
- ✅ Login exitoso con permisos admin
- ✅ Acceso a ambas aplicaciones

---

## 🔒 Seguridad

- ✅ **Separación de roles** clara
- ✅ **Validación en backend** del rol
- ✅ **No escalación de privilegios** automática
- ✅ **Tokens JWT** seguros
- ✅ **Verificación de email** en múltiples puntos

---

## ✨ Próximos Pasos

1. **Deploy ambas aplicaciones**
2. **Configurar Google OAuth** con todas las URLs
3. **Probar flujo completo** de SSO
4. **Agregar más proveedores** (Facebook, GitHub, etc.)
