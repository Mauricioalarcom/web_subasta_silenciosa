const db = require('./db');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
  try {
    console.log('🌱 Iniciando seed de base de datos...\n');

    // Crear usuario admin por defecto
    console.log('👤 Creando usuario administrador...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminResult = await db.query(`
      INSERT INTO usuarios (email, nombre, telefono, rol, estado, acepto_terminos)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO NOTHING
      RETURNING id;
    `, [
      'admin@subasta.com',
      'Administrador',
      '999999999',
      'ADMIN',
      'ACTIVO',
      true
    ]);

    if (adminResult.rows.length > 0) {
      console.log('✅ Usuario admin creado:');
      console.log('   Email: admin@subasta.com');
      console.log('   Password: admin123');
      console.log('   ⚠️  ¡Cambia esta contraseña en producción!\n');
    } else {
      console.log('ℹ️  Usuario admin ya existe\n');
    }

    // Crear evento de ejemplo
    console.log('🎨 Creando evento de ejemplo...');
    const eventoResult = await db.query(`
      INSERT INTO evento (
        nombre, 
        organizacion, 
        descripcion, 
        fecha_inicio, 
        fecha_cierre,
        email_contacto,
        estado
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT DO NOTHING
      RETURNING id;
    `, [
      'Subasta de Arte Contemporáneo 2026',
      'Galería Arte & Cultura',
      'Una colección exclusiva de obras de artistas contemporáneos',
      new Date('2026-03-01T18:00:00'),
      new Date('2026-03-15T22:00:00'),
      'contacto@galeria.com',
      'ACTIVO'
    ]);

    let eventoId;
    if (eventoResult.rows.length > 0) {
      eventoId = eventoResult.rows[0].id;
      console.log('✅ Evento de ejemplo creado\n');

      // Crear obras de ejemplo
      console.log('🖼️  Creando obras de ejemplo...');
      
      const obras = [
        {
          nombre: 'Amanecer en la Costa',
          artista: 'María González',
          descripcion: 'Óleo sobre lienzo que captura la belleza del amanecer en la costa peruana',
          tecnica: 'Óleo sobre lienzo',
          dimensiones: '120 x 80 cm',
          anio: 2025,
          precio_base: 1000.00,
          incremento_minimo: 100.00,
          precio_comprar_ahora: 5000.00,
          imagen_principal: 'https://via.placeholder.com/800x600/FF6B6B/FFFFFF?text=Amanecer+Costa'
        },
        {
          nombre: 'Geometría Urbana',
          artista: 'Carlos Mendoza',
          descripcion: 'Acrílico contemporáneo que explora las formas geométricas de la ciudad moderna',
          tecnica: 'Acrílico sobre lienzo',
          dimensiones: '100 x 100 cm',
          anio: 2024,
          precio_base: 800.00,
          incremento_minimo: 50.00,
          precio_comprar_ahora: 3500.00,
          imagen_principal: 'https://via.placeholder.com/800x600/4ECDC4/FFFFFF?text=Geometr%C3%ADa+Urbana'
        },
        {
          nombre: 'Naturaleza Abstracta',
          artista: 'Ana Ruiz',
          descripcion: 'Técnica mixta que representa la naturaleza desde una perspectiva abstracta',
          tecnica: 'Técnica mixta',
          dimensiones: '90 x 70 cm',
          anio: 2025,
          precio_base: 1200.00,
          incremento_minimo: 100.00,
          precio_comprar_ahora: null,
          imagen_principal: 'https://via.placeholder.com/800x600/95E1D3/FFFFFF?text=Naturaleza+Abstracta'
        }
      ];

      for (const obra of obras) {
        const fechaCierre = new Date('2026-03-15T22:00:00');
        await db.query(`
          INSERT INTO obras (
            evento_id, nombre, artista, descripcion, tecnica, dimensiones, anio,
            precio_base, incremento_minimo, precio_comprar_ahora,
            imagen_principal, fecha_cierre, fecha_cierre_original, estado
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        `, [
          eventoId,
          obra.nombre,
          obra.artista,
          obra.descripcion,
          obra.tecnica,
          obra.dimensiones,
          obra.anio,
          obra.precio_base,
          obra.incremento_minimo,
          obra.precio_comprar_ahora,
          obra.imagen_principal,
          fechaCierre,
          fechaCierre,
          'PUBLICADA'
        ]);
        console.log(`   ✓ ${obra.nombre}`);
      }
      
      console.log('\n✅ Obras de ejemplo creadas');
    } else {
      console.log('ℹ️  Evento ya existe\n');
    }

    console.log('\n✅ Seed completado exitosamente!');
    console.log('\nCredenciales de acceso:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:    admin@subasta.com');
    console.log('Password: admin123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  Recuerda cambiar estas credenciales en producción\n');
    
  } catch (error) {
    console.error('❌ Error al hacer seed:', error);
    throw error;
  }
};

// Ejecutar el seed
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✅ Proceso completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en el proceso:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
