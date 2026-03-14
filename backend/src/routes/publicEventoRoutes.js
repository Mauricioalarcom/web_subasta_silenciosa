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
      `SELECT id, nombre, descripcion, fecha_inicio, fecha_fin, estado, imagen_banner
       FROM evento
       ORDER BY fecha_creacion DESC
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
