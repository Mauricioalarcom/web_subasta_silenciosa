const db = require('./db');

const createTables = async () => {
  try {
    console.log('🚀 Iniciando migración de base de datos...\n');

    // Tabla: usuarios
    console.log('📝 Creando tabla usuarios...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        google_id VARCHAR(255) UNIQUE,
        email VARCHAR(255) UNIQUE NOT NULL,
        nombre VARCHAR(255) NOT NULL,
        telefono VARCHAR(50),
        avatar_url TEXT,
        rol VARCHAR(20) DEFAULT 'USER' CHECK (rol IN ('USER', 'ADMIN')),
        estado VARCHAR(20) DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO', 'BLOQUEADO')),
        acepto_terminos BOOLEAN DEFAULT FALSE,
        fecha_registro TIMESTAMP DEFAULT NOW(),
        ultima_sesion TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
      CREATE INDEX IF NOT EXISTS idx_usuarios_google_id ON usuarios(google_id);
    `);

    // Tabla: evento
    console.log('📝 Creando tabla evento...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS evento (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nombre VARCHAR(255) NOT NULL,
        organizacion VARCHAR(255) NOT NULL,
        descripcion TEXT,
        logo_url TEXT,
        banner_url TEXT,
        imagenes TEXT[],
        fecha_inicio TIMESTAMP NOT NULL,
        fecha_cierre TIMESTAMP NOT NULL,
        email_contacto VARCHAR(255),
        telefono_contacto VARCHAR(50),
        mensaje_bienvenida TEXT,
        terminos TEXT,
        estado VARCHAR(20) DEFAULT 'ACTIVO' CHECK (estado IN ('BORRADOR', 'ACTIVO', 'FINALIZADO')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    await db.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_evento_activo 
      ON evento(estado) WHERE estado = 'ACTIVO';
    `);

    // Tabla: obras
    console.log('📝 Creando tabla obras...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS obras (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        evento_id UUID REFERENCES evento(id) ON DELETE CASCADE,
        nombre VARCHAR(255) NOT NULL,
        artista VARCHAR(255) NOT NULL,
        descripcion TEXT NOT NULL,
        tecnica VARCHAR(100),
        dimensiones VARCHAR(100),
        anio INTEGER,
        info_adicional TEXT,
        imagen_principal TEXT NOT NULL,
        imagenes TEXT[],
        precio_base DECIMAL(10,2) NOT NULL CHECK (precio_base > 0),
        incremento_minimo DECIMAL(10,2) NOT NULL CHECK (incremento_minimo > 0),
        precio_actual DECIMAL(10,2) DEFAULT 0,
        precio_comprar_ahora DECIMAL(10,2) CHECK (precio_comprar_ahora IS NULL OR precio_comprar_ahora > precio_base),
        mejor_postor_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
        fecha_cierre TIMESTAMP NOT NULL,
        fecha_cierre_original TIMESTAMP NOT NULL,
        numero_extensiones INTEGER DEFAULT 0,
        numero_ofertas INTEGER DEFAULT 0,
        estado VARCHAR(20) DEFAULT 'BORRADOR' CHECK (estado IN ('BORRADOR', 'PUBLICADA', 'ACTIVA', 'EXTENDIDA', 'CERRADA', 'VENDIDA', 'NO_VENDIDA')),
        compra_inmediata_usada BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_obras_evento ON obras(evento_id);
      CREATE INDEX IF NOT EXISTS idx_obras_estado ON obras(estado);
      CREATE INDEX IF NOT EXISTS idx_obras_fecha_cierre ON obras(fecha_cierre);
      CREATE INDEX IF NOT EXISTS idx_obras_mejor_postor ON obras(mejor_postor_id);
    `);

    // Tabla: ofertas
    console.log('📝 Creando tabla ofertas...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS ofertas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        obra_id UUID REFERENCES obras(id) ON DELETE CASCADE,
        usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
        monto DECIMAL(10,2) NOT NULL CHECK (monto > 0),
        precio_anterior DECIMAL(10,2),
        es_compra_inmediata BOOLEAN DEFAULT FALSE,
        estado VARCHAR(20) DEFAULT 'ACTIVA' CHECK (estado IN ('ACTIVA', 'SUPERADA', 'GANADORA', 'PERDIDA')),
        ip_address VARCHAR(50),
        user_agent TEXT,
        fecha_oferta TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_ofertas_obra ON ofertas(obra_id);
      CREATE INDEX IF NOT EXISTS idx_ofertas_usuario ON ofertas(usuario_id);
      CREATE INDEX IF NOT EXISTS idx_ofertas_fecha ON ofertas(fecha_oferta DESC);
      CREATE INDEX IF NOT EXISTS idx_ofertas_estado ON ofertas(estado);
      CREATE INDEX IF NOT EXISTS idx_ofertas_obra_fecha ON ofertas(obra_id, fecha_oferta DESC);
    `);

    // Tabla: pagos
    console.log('📝 Creando tabla pagos...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS pagos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        obra_id UUID REFERENCES obras(id) ON DELETE CASCADE,
        usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
        monto DECIMAL(10,2) NOT NULL,
        metodo VARCHAR(50) CHECK (metodo IN ('TARJETA', 'TRANSFERENCIA', 'QR') OR metodo IS NULL),
        estado_pago VARCHAR(20) DEFAULT 'PENDIENTE' CHECK (estado_pago IN ('PENDIENTE', 'PROCESANDO', 'CONFIRMADO', 'RECHAZADO')),
        estado_entrega VARCHAR(30) DEFAULT 'PENDIENTE' CHECK (estado_entrega IN ('PENDIENTE', 'EN_PREPARACION', 'LISTA_PARA_RECOGER', 'ENTREGADA')),
        transaccion_id VARCHAR(255),
        voucher_url TEXT,
        comprobante_url TEXT,
        fecha_pago TIMESTAMP,
        fecha_confirmacion TIMESTAMP,
        fecha_entrega TIMESTAMP,
        confirmado_por UUID REFERENCES usuarios(id),
        entregado_por UUID REFERENCES usuarios(id),
        notas_internas TEXT,
        razon_rechazo TEXT,
        notas_entrega TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_pagos_obra ON pagos(obra_id);
      CREATE INDEX IF NOT EXISTS idx_pagos_usuario ON pagos(usuario_id);
      CREATE INDEX IF NOT EXISTS idx_pagos_estado_pago ON pagos(estado_pago);
      CREATE INDEX IF NOT EXISTS idx_pagos_estado_entrega ON pagos(estado_entrega);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_pagos_obra_usuario ON pagos(obra_id, usuario_id);
    `);

    // Tabla: notificaciones
    console.log('📝 Creando tabla notificaciones...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS notificaciones (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
        tipo VARCHAR(50) NOT NULL,
        titulo VARCHAR(255) NOT NULL,
        mensaje TEXT NOT NULL,
        obra_id UUID REFERENCES obras(id) ON DELETE SET NULL,
        oferta_id UUID REFERENCES ofertas(id) ON DELETE SET NULL,
        leida BOOLEAN DEFAULT FALSE,
        enviada_email BOOLEAN DEFAULT FALSE,
        fecha_envio_email TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON notificaciones(usuario_id);
      CREATE INDEX IF NOT EXISTS idx_notificaciones_leida ON notificaciones(leida);
      CREATE INDEX IF NOT EXISTS idx_notificaciones_tipo ON notificaciones(tipo);
    `);

    // Tabla: logs_actividad
    console.log('📝 Creando tabla logs_actividad...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS logs_actividad (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
        tipo_accion VARCHAR(50) NOT NULL,
        entidad_tipo VARCHAR(50),
        entidad_id UUID,
        descripcion TEXT,
        metadata JSONB,
        ip_address VARCHAR(50),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_logs_usuario ON logs_actividad(usuario_id);
      CREATE INDEX IF NOT EXISTS idx_logs_tipo ON logs_actividad(tipo_accion);
      CREATE INDEX IF NOT EXISTS idx_logs_fecha ON logs_actividad(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_logs_entidad ON logs_actividad(entidad_tipo, entidad_id);
    `);

    console.log('\n✅ Todas las tablas fueron creadas exitosamente!');
    
  } catch (error) {
    console.error('❌ Error al crear las tablas:', error);
    throw error;
  }
};

// Ejecutar la migración
if (require.main === module) {
  createTables()
    .then(() => {
      console.log('✅ Migración completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en la migración:', error);
      process.exit(1);
    });
}

module.exports = { createTables };
