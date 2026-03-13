# 🔑 Configurar Google OAuth

## Paso 1: Crear proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Nombre sugerido: "Subasta Silenciosa"

## Paso 2: Habilitar APIs

1. Ve a **APIs & Services > Library**
2. Busca y habilita:
   - **Google+ API** (o **Google Identity API**)

## Paso 3: Configurar OAuth 2.0

1. Ve a **APIs & Services > Credentials**
2. Clic en **+ CREATE CREDENTIALS > OAuth 2.0 Client IDs**
3. Selecciona **Web application**
4. Configura:

### Para desarrollo:
- **Name**: Subasta Silenciosa Dev
- **Authorized JavaScript origins**: 
  - `http://localhost:3000` (admin-panel)
  - `http://localhost:3001` (public-web)
  - `https://websubastasilenciosa-production.up.railway.app` (backend)
- **Authorized redirect URIs**:
  - `http://localhost:3000/api/auth/callback/google`
  - `http://localhost:3001/api/auth/callback/google`

### Para producción (después del deploy en Vercel):
- **Authorized JavaScript origins**: 
  - `https://tu-admin-panel.vercel.app`
  - `https://tu-public-web.vercel.app`
  - `https://websubastasilenciosa-production.up.railway.app`
- **Authorized redirect URIs**:
  - `https://tu-admin-panel.vercel.app/api/auth/callback/google`
  - `https://tu-public-web.vercel.app/api/auth/callback/google`

## Paso 4: Obtener credenciales

Después de crear obtendrás:
- **Client ID**: `123456789-abcdefg.apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-abcdefg123456789`

## Paso 5: Actualizar variables de entorno

### Backend (Railway):
Ve a tu proyecto en Railway > Settings > Variables y agrega:
```
GOOGLE_CLIENT_ID=tu_client_id_aqui
GOOGLE_CLIENT_SECRET=tu_client_secret_aqui
```

### Frontend (.env.local):
```
GOOGLE_CLIENT_ID=tu_client_id_aqui
GOOGLE_CLIENT_SECRET=tu_client_secret_aqui
NEXTAUTH_SECRET=tu_secret_aleatorio_aqui
```

## Paso 6: Generar NEXTAUTH_SECRET

En terminal ejecuta:
```bash
openssl rand -base64 32
```

Copia el resultado y úsalo como `NEXTAUTH_SECRET`
