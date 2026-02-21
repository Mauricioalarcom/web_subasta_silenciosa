const db = require('../database/db');
const path = require('path');
const fs = require('fs/promises');

/**
 * Listar todas las obras con filtros
 */
const listObras = async (req, res) => {
  try {
    const { 
      evento_id, 
      estado, 
      artista, 
      precio_min, 
      precio_max,
      buscar,
      page = 1,
      limit = 20,
      order_by = 'created_at',
      order_dir = 'DESC'
    } = req.query;

    // Construir query dinámicamente
    let query = `
      SELECT 
        o.*,
        e.nombre as evento_nombre,
        u.nombre as mejor_postor_nombre,
        u.email as mejor_postor_email,
        COUNT(*) OVER() as total_count
      FROM obras o
      LEFT JOIN evento e ON o.evento_id = e.id
      LEFT JOIN usuarios u ON o.mejor_postor_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;

    // Filtros
    if (evento_id) {
      query += ` AND o.evento_id = $${paramCount++}`;
      params.push(evento_id);
    }

    if (estado) {
      query += ` AND o.estado = $${paramCount++}`;
      params.push(estado);
    }

    if (artista) {
      query += ` AND o.artista ILIKE $${paramCount++}`;
      params.push(`%${artista}%`);
    }

    if (precio_min) {
      query += ` AND o.precio_base >= $${paramCount++}`;
      params.push(parseFloat(precio_min));
    }

    if (precio_max) {
      query += ` AND o.precio_base <= $${paramCount++}`;
      params.push(parseFloat(precio_max));
    }

    if (buscar) {
      query += ` AND (o.nombre ILIKE $${paramCount} OR o.artista ILIKE $${paramCount} OR o.descripcion ILIKE $${paramCount})`;
      params.push(`%${buscar}%`);
      paramCount++;
    }

    // Validar order_by para prevenir SQL injection
    const validOrderFields = ['nombre', 'artista', 'precio_base', 'precio_actual', 'fecha_cierre', 'created_at', 'numero_ofertas'];
    const orderField = validOrderFields.includes(order_by) ? order_by : 'created_at';
    const orderDirection = order_dir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    query += ` ORDER BY o.${orderField} ${orderDirection}`;

    // Paginación
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(parseInt(limit), offset);

    const result = await db.query(query, params);
    
    const total = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;
    const obras = result.rows.map(row => {
      const { total_count, ...obra } = row;
      return obra;
    });

    res.json({
      success: true,
      data: obras,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error al listar obras:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener obras',
      error: error.message
    });
  }
};

/**
 * Obtener una obra por ID
 */
const getObra = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT 
        o.*,
        e.nombre as evento_nombre,
        e.fecha_inicio as evento_fecha_inicio,
        e.fecha_cierre as evento_fecha_cierre,
        u.nombre as mejor_postor_nombre,
        u.email as mejor_postor_email,
        u.telefono as mejor_postor_telefono,
        (
          SELECT json_agg(json_build_object(
            'id', of.id,
            'monto', of.monto,
            'usuario_nombre', usr.nombre,
            'fecha_oferta', of.fecha_oferta
          ) ORDER BY of.fecha_oferta DESC)
          FROM ofertas of
          LEFT JOIN usuarios usr ON of.usuario_id = usr.id
          WHERE of.obra_id = o.id
          LIMIT 10
        ) as ultimas_ofertas
      FROM obras o
      LEFT JOIN evento e ON o.evento_id = e.id
      LEFT JOIN usuarios u ON o.mejor_postor_id = u.id
      WHERE o.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Obra no encontrada'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al obtener obra:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener obra',
      error: error.message
    });
  }
};

/**
 * Crear nueva obra
 */
const createObra = async (req, res) => {
  try {
    const {
      evento_id,
      nombre,
      artista,
      descripcion,
      tecnica,
      dimensiones,
      anio,
      info_adicional,
      precio_base,
      incremento_minimo,
      precio_comprar_ahora,
      fecha_cierre
    } = req.body;

    // Validaciones
    if (!nombre || !artista || !descripcion || !precio_base || !incremento_minimo || !fecha_cierre) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: nombre, artista, descripción, precio_base, incremento_minimo, fecha_cierre'
      });
    }

    if (parseFloat(precio_base) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El precio base debe ser mayor a 0'
      });
    }

    if (parseFloat(incremento_minimo) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El incremento mínimo debe ser mayor a 0'
      });
    }

    if (precio_comprar_ahora && parseFloat(precio_comprar_ahora) <= parseFloat(precio_base)) {
      return res.status(400).json({
        success: false,
        message: 'El precio de compra inmediata debe ser mayor al precio base'
      });
    }

    // Si no se especifica evento_id, usar el evento activo
    let eventoId = evento_id;
    if (!eventoId) {
      const eventoResult = await db.query(`
        SELECT id FROM evento WHERE estado = 'ACTIVO' LIMIT 1
      `);
      
      if (eventoResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No hay evento activo'
        });
      }
      
      eventoId = eventoResult.rows[0].id;
    }

    // Crear obra
    const result = await db.query(`
      INSERT INTO obras (
        evento_id,
        nombre,
        artista,
        descripcion,
        tecnica,
        dimensiones,
        anio,
        info_adicional,
        imagen_principal,
        imagenes,
        precio_base,
        incremento_minimo,
        precio_actual,
        precio_comprar_ahora,
        fecha_cierre,
        fecha_cierre_original,
        estado
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $11, $13, $14, $14, 'BORRADOR')
      RETURNING *
    `, [
      eventoId,
      nombre,
      artista,
      descripcion,
      tecnica || null,
      dimensiones || null,
      anio || null,
      info_adicional || null,
      '', // imagen_principal - se actualizará con upload
      [], // imagenes vacío inicialmente
      precio_base,
      incremento_minimo,
      precio_comprar_ahora || null,
      fecha_cierre
    ]);

    res.status(201).json({
      success: true,
      message: 'Obra creada exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al crear obra:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear obra',
      error: error.message
    });
  }
};

/**
 * Actualizar obra
 */
const updateObra = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      artista,
      descripcion,
      tecnica,
      dimensiones,
      anio,
      info_adicional,
      precio_base,
      incremento_minimo,
      precio_comprar_ahora,
      fecha_cierre,
      estado
    } = req.body;

    // Verificar que la obra existe
    const obraExistente = await db.query('SELECT * FROM obras WHERE id = $1', [id]);
    
    if (obraExistente.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Obra no encontrada'
      });
    }

    const obra = obraExistente.rows[0];

    // No permitir cambiar precios si ya hay ofertas
    if (obra.numero_ofertas > 0 && precio_base && parseFloat(precio_base) !== parseFloat(obra.precio_base)) {
      return res.status(400).json({
        success: false,
        message: 'No se puede cambiar el precio base de una obra con ofertas activas'
      });
    }

    // Validaciones
    if (precio_comprar_ahora) {
      const precioBaseActual = precio_base || obra.precio_base;
      if (parseFloat(precio_comprar_ahora) <= parseFloat(precioBaseActual)) {
        return res.status(400).json({
          success: false,
          message: 'El precio de compra inmediata debe ser mayor al precio base'
        });
      }
    }

    // Construir query de actualización dinámicamente
    const updates = [];
    const params = [];
    let paramCount = 1;

    const campos = {
      nombre,
      artista,
      descripcion,
      tecnica,
      dimensiones,
      anio,
      info_adicional,
      precio_base,
      incremento_minimo,
      precio_comprar_ahora,
      fecha_cierre,
      estado
    };

    Object.entries(campos).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = $${paramCount++}`);
        params.push(value);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay campos para actualizar'
      });
    }

    updates.push(`updated_at = NOW()`);
    params.push(id);

    const query = `
      UPDATE obras 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, params);

    res.json({
      success: true,
      message: 'Obra actualizada exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar obra:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar obra',
      error: error.message
    });
  }
};

/**
 * Eliminar obra
 */
const deleteObra = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que la obra existe
    const obraResult = await db.query('SELECT * FROM obras WHERE id = $1', [id]);
    
    if (obraResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Obra no encontrada'
      });
    }

    const obra = obraResult.rows[0];

    // No permitir eliminar obras con ofertas o en ciertos estados
    if (obra.numero_ofertas > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar una obra con ofertas activas'
      });
    }

    if (['VENDIDA', 'ACTIVA', 'EXTENDIDA'].includes(obra.estado)) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar una obra en estado ACTIVA, EXTENDIDA o VENDIDA'
      });
    }

    // Eliminar imágenes del filesystem
    try {
      if (obra.imagen_principal) {
        const imagePath = path.join(__dirname, '../../uploads', path.basename(obra.imagen_principal));
        await fs.unlink(imagePath).catch(() => {});
      }

      if (obra.imagenes && obra.imagenes.length > 0) {
        for (const imagen of obra.imagenes) {
          const imagePath = path.join(__dirname, '../../uploads', path.basename(imagen));
          await fs.unlink(imagePath).catch(() => {});
        }
      }
    } catch (error) {
      console.error('Error al eliminar imágenes:', error);
    }

    // Eliminar obra
    await db.query('DELETE FROM obras WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Obra eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar obra:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar obra',
      error: error.message
    });
  }
};

/**
 * Subir imágenes de obra
 */
const uploadImages = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo } = req.body; // 'principal' o 'galeria'

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se recibieron imágenes'
      });
    }

    // Verificar que la obra existe
    const obraResult = await db.query('SELECT * FROM obras WHERE id = $1', [id]);
    
    if (obraResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Obra no encontrada'
      });
    }

    const obra = obraResult.rows[0];
    const imageUrls = req.files.map(file => `/uploads/${file.filename}`);

    let result;

    if (tipo === 'principal') {
      // Eliminar imagen principal anterior si existe
      if (obra.imagen_principal) {
        const oldImagePath = path.join(__dirname, '../../uploads', path.basename(obra.imagen_principal));
        await fs.unlink(oldImagePath).catch(() => {});
      }

      // Actualizar imagen principal (solo la primera)
      result = await db.query(`
        UPDATE obras 
        SET imagen_principal = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `, [imageUrls[0], id]);
    } else {
      // Agregar a galería
      const currentImages = obra.imagenes || [];
      const newImages = [...currentImages, ...imageUrls];

      result = await db.query(`
        UPDATE obras 
        SET imagenes = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `, [newImages, id]);
    }

    res.json({
      success: true,
      message: 'Imágenes subidas exitosamente',
      data: result.rows[0],
      uploadedUrls: imageUrls
    });
  } catch (error) {
    console.error('Error al subir imágenes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al subir imágenes',
      error: error.message
    });
  }
};

/**
 * Eliminar imagen de obra
 */
const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'URL de imagen requerida'
      });
    }

    // Verificar que la obra existe
    const obraResult = await db.query('SELECT * FROM obras WHERE id = $1', [id]);
    
    if (obraResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Obra no encontrada'
      });
    }

    const obra = obraResult.rows[0];
    let result;

    // Verificar si es la imagen principal
    if (obra.imagen_principal === imageUrl) {
      result = await db.query(`
        UPDATE obras 
        SET imagen_principal = '', updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `, [id]);
    } else {
      // Remover de la galería
      const currentImages = obra.imagenes || [];
      const newImages = currentImages.filter(img => img !== imageUrl);

      result = await db.query(`
        UPDATE obras 
        SET imagenes = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `, [newImages, id]);
    }

    // Eliminar archivo del filesystem
    try {
      const imagePath = path.join(__dirname, '../../uploads', path.basename(imageUrl));
      await fs.unlink(imagePath);
    } catch (error) {
      console.error('Error al eliminar archivo de imagen:', error);
    }

    res.json({
      success: true,
      message: 'Imagen eliminada exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al eliminar imagen:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar imagen',
      error: error.message
    });
  }
};

module.exports = {
  listObras,
  getObra,
  createObra,
  updateObra,
  deleteObra,
  uploadImages,
  deleteImage
};
