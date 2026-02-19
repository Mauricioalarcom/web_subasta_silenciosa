const db = require('../database/db');
const path = require('path');
const fs = require('fs').promises;

/**
 * Obtener el evento actual
 */
const getEvento = async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT * FROM evento ORDER BY created_at DESC LIMIT 1'
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró ningún evento configurado'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar información del evento
 */
const updateEvento = async (req, res, next) => {
  try {
    const {
      nombre,
      organizacion,
      descripcion,
      fecha_inicio,
      fecha_cierre,
      email_contacto,
      telefono_contacto,
      terminos,
      mensaje_bienvenida,
      estado
    } = req.body;

    // Validaciones
    if (!nombre || !fecha_inicio || !fecha_cierre) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, fecha de inicio y fecha de cierre son obligatorios'
      });
    }

    // Validar que fecha_cierre sea posterior a fecha_inicio
    if (new Date(fecha_cierre) <= new Date(fecha_inicio)) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de cierre debe ser posterior a la fecha de inicio'
      });
    }

    // Obtener el evento actual
    const eventoActual = await db.query(
      'SELECT id FROM evento ORDER BY created_at DESC LIMIT 1'
    );

    if (eventoActual.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró ningún evento para actualizar'
      });
    }

    const eventoId = eventoActual.rows[0].id;

    // Actualizar evento
    const result = await db.query(
      `UPDATE evento 
       SET nombre = $1,
           organizacion = $2,
           descripcion = $3,
           fecha_inicio = $4,
           fecha_cierre = $5,
           email_contacto = $6,
           telefono_contacto = $7,
           terminos = $8,
           mensaje_bienvenida = $9,
           estado = $10,
           updated_at = NOW()
       WHERE id = $11
       RETURNING *`,
      [
        nombre,
        organizacion,
        descripcion,
        fecha_inicio,
        fecha_cierre,
        email_contacto,
        telefono_contacto,
        terminos,
        mensaje_bienvenida,
        estado || 'ACTIVO',
        eventoId
      ]
    );

    res.json({
      success: true,
      message: 'Evento actualizado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Subir imagen del evento (logo o banner)
 */
const uploadImage = async (req, res, next) => {
  try {
    const { tipo } = req.body; // 'logo' o 'banner'

    if (!tipo || !['logo', 'banner'].includes(tipo)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de imagen inválido. Debe ser "logo" o "banner"'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ninguna imagen'
      });
    }

    // Obtener el evento actual
    const eventoActual = await db.query(
      'SELECT id, logo_url, banner_url FROM evento ORDER BY created_at DESC LIMIT 1'
    );

    if (eventoActual.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró ningún evento'
      });
    }

    const evento = eventoActual.rows[0];
    const imageUrl = `/uploads/${req.file.filename}`;

    // Eliminar imagen anterior si existe
    if (tipo === 'logo' && evento.logo_url) {
      const oldPath = path.join(__dirname, '../..', evento.logo_url);
      try {
        await fs.unlink(oldPath);
      } catch (err) {
        console.log('Imagen anterior no encontrada o ya eliminada');
      }
    } else if (tipo === 'banner' && evento.banner_url) {
      const oldPath = path.join(__dirname, '../..', evento.banner_url);
      try {
        await fs.unlink(oldPath);
      } catch (err) {
        console.log('Imagen anterior no encontrada o ya eliminada');
      }
    }

    // Actualizar URL en la base de datos
    const columna = tipo === 'logo' ? 'logo_url' : 'banner_url';
    const result = await db.query(
      `UPDATE evento 
       SET ${columna} = $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [imageUrl, evento.id]
    );

    res.json({
      success: true,
      message: `${tipo === 'logo' ? 'Logo' : 'Banner'} actualizado exitosamente`,
      data: {
        url: imageUrl,
        evento: result.rows[0]
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar imagen del evento
 */
const deleteImage = async (req, res, next) => {
  try {
    const { tipo } = req.params; // 'logo' o 'banner'

    if (!['logo', 'banner'].includes(tipo)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de imagen inválido'
      });
    }

    // Obtener el evento actual
    const eventoActual = await db.query(
      'SELECT id, logo_url, banner_url FROM evento ORDER BY created_at DESC LIMIT 1'
    );

    if (eventoActual.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró ningún evento'
      });
    }

    const evento = eventoActual.rows[0];
    const imageUrl = tipo === 'logo' ? evento.logo_url : evento.banner_url;

    if (!imageUrl) {
      return res.status(404).json({
        success: false,
        message: 'No hay imagen para eliminar'
      });
    }

    // Eliminar archivo físico
    const imagePath = path.join(__dirname, '../..', imageUrl);
    try {
      await fs.unlink(imagePath);
    } catch (err) {
      console.log('Imagen no encontrada en el sistema de archivos');
    }

    // Actualizar base de datos
    const columna = tipo === 'logo' ? 'logo_url' : 'banner_url';
    await db.query(
      `UPDATE evento 
       SET ${columna} = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [evento.id]
    );

    res.json({
      success: true,
      message: `${tipo === 'logo' ? 'Logo' : 'Banner'} eliminado exitosamente`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEvento,
  updateEvento,
  uploadImage,
  deleteImage
};
