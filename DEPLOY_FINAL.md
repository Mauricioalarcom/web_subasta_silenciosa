# 🚀 Guía de Deploy Completa

## ✅ Backend (Railway) - YA COMPLETADO
- ✅ Deploy funcionando en: `https://websubastasilenciosa-production.up.railway.app`

## 🔧 Pasos pendientes:

### 1. Configurar Cloudinary
- [ ] Crear cuenta en Cloudinary
- [ ] Obtener credenciales (Cloud Name, API Key, API Secret)
- [ ] Agregar variables en Railway:
  ```
  CLOUDINARY_CLOUD_NAME=tu_cloud_name
  CLOUDINARY_API_KEY=tu_api_key
  CLOUDINARY_API_SECRET=tu_api_secret
  ```

### 2. Configurar Google OAuth
- [ ] Crear proyecto en Google Cloud Console
- [ ] Configurar OAuth 2.0 con las URLs correctas
- [ ] Agregar credenciales en Railway:
  ```
  GOOGLE_CLIENT_ID=tu_client_id
  GOOGLE_CLIENT_SECRET=tu_client_secret
  ```

### 3. Deploy Frontend Admin Panel en Vercel
- [ ] Crear nuevo proyecto en Vercel
- [ ] Conectar repo: `fatima-pv/web_subasta_silenciosa`
- [ ] Configurar:
  - Root Directory: `admin-panel`
  - Framework: Next.js
  - Build Command: `npm run build`
  - Output Directory: `.next`
- [ ] Variables de entorno:
  ```
  NEXT_PUBLIC_API_URL=https://websubastasilenciosa-production.up.railway.app
  GOOGLE_CLIENT_ID=tu_client_id
  GOOGLE_CLIENT_SECRET=tu_client_secret
  NEXTAUTH_SECRET=tu_secret_aleatorio
  NEXTAUTH_URL=https://tu-admin-panel.vercel.app
  ```

### 4. Deploy Frontend Public Web en Vercel
- [ ] Crear segundo proyecto en Vercel
- [ ] Conectar mismo repo: `fatima-pv/web_subasta_silenciosa`
- [ ] Configurar:
  - Root Directory: `public-web`
  - Framework: Next.js
  - Build Command: `npm run build`
  - Output Directory: `.next`
- [ ] Variables de entorno:
  ```
  NEXT_PUBLIC_API_URL=https://websubastasilenciosa-production.up.railway.app
  GOOGLE_CLIENT_ID=tu_client_id
  GOOGLE_CLIENT_SECRET=tu_client_secret
  NEXTAUTH_SECRET=tu_secret_aleatorio
  NEXTAUTH_URL=https://tu-public-web.vercel.app
  ```

### 5. Actualizar CORS en Railway
Después del deploy, actualizar variable `CORS_ORIGIN` en Railway:
```
CORS_ORIGIN=https://tu-admin-panel.vercel.app,https://tu-public-web.vercel.app
```

## 🎯 Resultado Final:
- 🖥️ **Backend API**: `https://websubastasilenciosa-production.up.railway.app`
- 👨‍💼 **Admin Panel**: `https://tu-admin-panel.vercel.app`
- 🌐 **Public Web**: `https://tu-public-web.vercel.app`

## ⚡ Enlaces útiles:
- [Cloudinary Setup Guide](./CLOUDINARY_SETUP.md)
- [Google OAuth Setup Guide](./GOOGLE_SETUP.md)
- [Railway Dashboard](https://railway.app/dashboard)
- [Vercel Dashboard](https://vercel.com/dashboard)
