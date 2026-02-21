const express = require('express');
const router = express.Router();
const pagoController = require('../controllers/pagoController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * GET /api/admin/pagos/estadisticas
 * Obtener estadísticas de pagos (solo admin)
 */
router.get('/estadisticas', requireAdmin, pagoController.getEstadisticasPagos);

/**
 * GET /api/admin/pagos
 * Listar pagos con filtros (solo admin)
 */
router.get('/', requireAdmin, pagoController.listPagos);

/**
 * GET /api/admin/pagos/:id
 * Obtener un pago específico (solo admin o dueño)
 */
router.get('/:id', pagoController.getPago);

/**
 * POST /api/admin/pagos
 * Crear registro de pago (automático cuando se gana subasta)
 */
router.post('/', pagoController.createPago);

/**
 * PUT /api/admin/pagos/:id/metodo
 * Seleccionar método de pago (usuario ganador)
 */
router.put('/:id/metodo', pagoController.selectMetodoPago);

/**
 * POST /api/admin/pagos/:id/comprobante
 * Subir comprobante de pago (usuario ganador)
 */
router.post('/:id/comprobante', upload.single('comprobante'), pagoController.uploadComprobante);

/**
 * PUT /api/admin/pagos/:id/confirmar
 * Confirmar pago (solo admin)
 */
router.put('/:id/confirmar', requireAdmin, pagoController.confirmarPago);

/**
 * PUT /api/admin/pagos/:id/rechazar
 * Rechazar pago (solo admin)
 */
router.put('/:id/rechazar', requireAdmin, pagoController.rechazarPago);

/**
 * PUT /api/admin/pagos/:id/entrega
 * Actualizar estado de entrega (solo admin)
 */
router.put('/:id/entrega', requireAdmin, pagoController.updateEstadoEntrega);

module.exports = router;
