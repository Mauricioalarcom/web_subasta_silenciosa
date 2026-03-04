const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticate } = require('../middleware/auth');

/**
 * POST /api/favoritos
 * Agregar obra a favoritos
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { obra_id } = req.body;
    const usuario_id = req.user.id;

    if (!obra_id) {
      return res.status(400).json({
        success: false,
        message: 'El ID de la obra es requerido'
      });
    }

    // Verificar que la obra existe
    const obraExists = await db.query(
      'SELECT id FROM obras WHERE id = $1',
      [obra_id]
    );

    if (obraExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'La obra no existe'
      });
    }

    // Verificar si ya está en favoritos
    const existing = await db.query(
      'SELECT id FROM favoritos WHERE usuario_id = $1 AND obra_id = $2',
      [usuario_id, obra_id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Esta obra ya está en tus favoritos'
      });
    }

    // Agregar a favoritos
    const result = await db.query(
      `INSERT INTO favoritos (usuario_id, obra_id) 
       VALUES ($1, $2) 
       RETURNING id, created_at`,
      [usuario_id, obra_id]
    );

    res.status(201).json({
      success: true,
      message: 'Obra agregada a favoritos',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al agregar a favoritos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar a favoritos',
      error: error.message
    });
  }
});

/**
 * DELETE /api/favoritos/:obraId
 * Eliminar obra de favoritos
 */
router.delete('/:obraId', authenticate, async (req, res) => {
  try {
    const { obraId } = req.params;
    const usuario_id = req.user.id;

    const result = await db.query(
      'DELETE FROM favoritos WHERE usuario_id = $1 AND obra_id = $2 RETURNING id',
      [usuario_id, obraId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Esta obra no está en tus favoritos'
      });
    }

    res.json({
      success: true,
      message: 'Obra eliminada de favoritos'
    });
  } catch (error) {
    console.error('Error al eliminar de favoritos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar de favoritos',
      error: error.message
    });
  }
});

/**
 * GET /api/favoritos
 * Obtener favoritos del usuario con información de las obras
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const usuario_id = req.user.id;

    const result = await db.query(
      `SELECT 
        f.id as favorito_id,
        f.created_at as fecha_agregado,
        o.id,
        o.nombre,
        o.artista,
        o.descripcion,
        o.imagen_principal,
        o.precio_base,
        o.precio_actual,
        o.incremento_minimo,
        o.precio_comprar_ahora,
        o.numero_ofertas,
        o.fecha_cierre,
        o.estado
      FROM favoritos f
      INNER JOIN obras o ON f.obra_id = o.id
      WHERE f.usuario_id = $1
      ORDER BY f.created_at DESC`,
      [usuario_id]
    );

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error al obtener favoritos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener favoritos',
      error: error.message
    });
  }
});

/**
 * GET /api/favoritos/check/:obraId
 * Verificar si una obra está en favoritos
 */
router.get('/check/:obraId', authenticate, async (req, res) => {
  try {
    const { obraId } = req.params;
    const usuario_id = req.user.id;

    const result = await db.query(
      'SELECT id FROM favoritos WHERE usuario_id = $1 AND obra_id = $2',
      [usuario_id, obraId]
    );

    res.json({
      success: true,
      data: {
        es_favorito: result.rows.length > 0
      }
    });
  } catch (error) {
    console.error('Error al verificar favorito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar favorito',
      error: error.message
    });
  }
});

/**
 * GET /api/favoritos/ids
 * Obtener solo los IDs de obras favoritas (útil para marcar en UI)
 */
router.get('/ids', authenticate, async (req, res) => {
  try {
    const usuario_id = req.user.id;

    const result = await db.query(
      'SELECT obra_id FROM favoritos WHERE usuario_id = $1',
      [usuario_id]
    );

    const ids = result.rows.map(row => row.obra_id);

    res.json({
      success: true,
      data: ids
    });
  } catch (error) {
    console.error('Error al obtener IDs de favoritos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener IDs de favoritos',
      error: error.message
    });
  }
});

module.exports = router;
