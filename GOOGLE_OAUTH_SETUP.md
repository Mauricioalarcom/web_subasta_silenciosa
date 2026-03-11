# Configuración de Google OAuth

## 1. Crear proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la **Google+ API** o **Google Identity API**

## 2. Configurar OAuth 2.0

1. Ve a **APIs & Services > Credentials**
2. Clic en **+ CREATE CREDENTIALS > OAuth 2.0 Client IDs**
3. Selecciona **Web application**
4. Configura:
   - **Name**: Tu app name
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000` (desarrollo)
     - `https://tu-dominio.com` (producción)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/callback/google` (desarrollo)
     - `https://tu-dominio.com/api/auth/callback/google` (producción)

## 3. Obtener credenciales

Después de crear, obtendrás:
- **Client ID**: `xxxxxx.apps.googleusercontent.com`
- **Client Secret**: `xxxxxx`

## 4. Configurar variables de entorno

### Backend (.env)
```env
# Agregar estas líneas
GOOGLE_CLIENT_ID=tu_client_id_aqui
GOOGLE_CLIENT_SECRET=tu_client_secret_aqui
```

### Frontend (.env.local)
```env
GOOGLE_CLIENT_ID=tu_client_id_aqui
GOOGLE_CLIENT_SECRET=tu_client_secret_aqui
NEXTAUTH_SECRET=tu_secret_para_nextauth
NEXTAUTH_URL=http://localhost:3000  # cambiar en producción
```
