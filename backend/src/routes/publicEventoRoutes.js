const express = require('express');
const router = express.Router();
const db = require('../database/db');

/**
 * GET /api/evento
 * Obtener el evento actual (público, sin autenticación)
 */
router.get('/', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT id, nombre, organizacion, descripcion, fecha_inicio, fecha_cierre, 
              estado, logo_url, banner_url, mensaje_bienvenida
       FROM evento
       WHERE estado = 'ACTIVO'
       ORDER BY created_at DESC
       LIMIT 1`
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: null
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
