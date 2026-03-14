const express = require('express');
const router = express.Router();
const db = require('../database/db');

/**
 * GET /api/obras
 * Listar obras públicas (sin autenticación requerida)
 * Query params: estado, evento_id, limit, offset
 */
router.get('/', async (req, res, next) => {
  try {
    const { estado = 'ACTIVA', evento_id, limit = 20, offset = 0 } = req.query;

    let query = `
      SELECT id, titulo, descripcion, imagen_principal, precio_base, 
             estado, artista, evento_id, fecha_creacion
      FROM obras
      WHERE estado = $1
    `;
    const params = [estado];
    let paramCount = 1;

    if (evento_id) {
      paramCount++;
      query += ` AND evento_id = $${paramCount}`;
      params.push(evento_id);
    }

    query += ` ORDER BY fecha_creacion DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit));
    params.push(parseInt(offset));

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/obras/:id
 * Obtener detalles de una obra pública
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT id, titulo, descripcion, imagen_principal, precio_base, 
              estado, artista, evento_id, fecha_creacion
       FROM obras
       WHERE id = $1 AND estado = 'ACTIVA'`,
      [id]
    );

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
    next(error);
  }
});

module.exports = router;
