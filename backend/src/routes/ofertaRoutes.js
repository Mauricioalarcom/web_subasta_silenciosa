const express = require('express');
const router = express.Router();
const ofertaController = require('../controllers/ofertaController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// ============================================
// RUTAS PÚBLICAS/USUARIOS AUTENTICADOS
// ============================================

/**
 * @route   POST /api/ofertas
 * @desc    Crear una nueva oferta
 * @access  Private (usuario autenticado)
 */
router.post('/', authenticate, ofertaController.createOferta);

/**
 * @route   GET /api/ofertas/obra/:obraId
 * @desc    Listar ofertas de una obra específica
 * @access  Public
 */
router.get('/obra/:obraId', ofertaController.getOfertasByObra);

/**
 * @route   GET /api/ofertas/obra/:obraId/ganadora
 * @desc    Obtener oferta ganadora/actual de una obra
 * @access  Public
 */
router.get('/obra/:obraId/ganadora', ofertaController.getOfertaGanadora);

/**
 * @route   GET /api/ofertas/mis-ofertas
 * @desc    Obtener historial de ofertas del usuario autenticado
 * @access  Private
 */
router.get('/mis-ofertas', authenticate, ofertaController.getMisOfertas);

/**
 * @route   GET /api/ofertas/mis-estadisticas
 * @desc    Obtener estadísticas de ofertas del usuario autenticado
 * @access  Private
 */
router.get('/mis-estadisticas', authenticate, ofertaController.getMisEstadisticas);

// ============================================
// RUTAS DE ADMINISTRADOR
// ============================================

/**
 * @route   GET /api/admin/ofertas
 * @desc    Listar todas las ofertas con filtros (admin)
 * @access  Private + Admin
 */
router.get('/admin/all', authenticate, requireAdmin, ofertaController.getAllOfertas);

/**
 * @route   DELETE /api/admin/ofertas/:id
 * @desc    Cancelar una oferta (casos excepcionales)
 * @access  Private + Admin
 */
router.delete('/admin/:id', authenticate, requireAdmin, ofertaController.cancelarOferta);

module.exports = router;
