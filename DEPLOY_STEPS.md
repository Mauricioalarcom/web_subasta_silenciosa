# Deploy del Backend en Railway

## 1. Crear cuenta en Railway
- Ve a https://railway.app
- Registrate con GitHub

## 2. Preparar el proyecto
- Conectar tu repo de GitHub
- Seleccionar la carpeta `backend`

## 3. Variables de entorno en Railway
DATABASE_URL=postgresql://usuario:password@host:puerto/database
PORT=4000
NODE_ENV=production
JWT_SECRET=un_secreto_super_seguro_para_produccion

# URLs (actualizar después del deploy)
ADMIN_PANEL_URL=https://tu-admin.vercel.app
PUBLIC_WEB_URL=https://tu-app.vercel.app
CORS_ORIGIN=https://tu-admin.vercel.app,https://tu-app.vercel.app

# Google OAuth (después)
GOOGLE_CLIENT_ID=xxxxxx
GOOGLE_CLIENT_SECRET=xxxxxx

# Cloudinary (si usas imágenes)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
