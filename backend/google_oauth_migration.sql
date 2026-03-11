-- Migración para completar soporte de Google OAuth
-- Ejecutar SOLO si estos campos no existen

-- Verificar si necesitas agregar estos campos:
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS password VARCHAR(255),  -- Para usuarios locales
ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'local',  -- 'local' o 'google'
ADD COLUMN IF NOT EXISTS foto_perfil TEXT;  -- URL de foto de perfil

-- Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_usuarios_provider ON usuarios(provider);

-- Actualizar usuarios existentes (opcional)
UPDATE usuarios SET provider = 'local' WHERE provider IS NULL;
