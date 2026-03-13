# ☁️ Configurar Cloudinary

## Paso 1: Crear cuenta en Cloudinary

1. Ve a [Cloudinary](https://cloudinary.com/users/register/free)
2. Regístrate con tu email
3. Verifica tu cuenta

## Paso 2: Obtener credenciales

1. Ve al Dashboard de Cloudinary
2. En la sección **Account Details** encontrarás:
   - **Cloud Name**: tu_cloud_name
   - **API Key**: 123456789012345
   - **API Secret**: abcdefghijklmnopqrstuvwxyz12345

## Paso 3: Configurar en Railway

Ve a tu proyecto en Railway > Settings > Variables y agrega:

```
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz12345
```

## Paso 4: Configurar carpetas (Opcional)

En Cloudinary Dashboard:
1. Ve a **Media Library**
2. Crea carpeta: `subasta_silenciosa`
3. Subcarpetas sugeridas:
   - `obras` (imágenes de obras)
   - `perfiles` (fotos de perfil)
   - `eventos` (imágenes de eventos)

## ✅ Beneficios de Cloudinary

- ✅ Almacenamiento en la nube
- ✅ Optimización automática de imágenes
- ✅ Conversión a WebP automática
- ✅ Redimensionamiento dinámico
- ✅ CDN global para carga rápida
- ✅ Respaldo automático
