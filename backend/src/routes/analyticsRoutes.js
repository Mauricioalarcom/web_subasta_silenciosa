const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getTopObras,
  getActividadOfertas,
  getTopPostores,
  getLiveStats,
  getDistribucionPrecios
} = require('../controllers/analyticsController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Todas las rutas requieren autenticación de admin
router.use(authenticate);
router.use(requireAdmin);

// GET /api/admin/analytics/dashboard - Estadísticas generales
router.get('/dashboard', getDashboardStats);

// GET /api/admin/analytics/top-obras - Top 5 obras con más ofertas
router.get('/top-obras', getTopObras);

// GET /api/admin/analytics/actividad-ofertas - Actividad por hora (24h)
router.get('/actividad-ofertas', getActividadOfertas);

// GET /api/admin/analytics/top-postores - Top 10 postores activos
router.get('/top-postores', getTopPostores);

// GET /api/admin/analytics/live - Estadísticas en tiempo real
router.get('/live', getLiveStats);

// GET /api/admin/analytics/distribucion-precios - Distribución de precios
router.get('/distribucion-precios', getDistribucionPrecios);

module.exports = router;
