const express = require('express');
const router = express.Router();
const obraController = require('../controllers/obraController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Todas las rutas requieren autenticación de admin
router.use(authenticate);
router.use(requireAdmin);

/**
 * GET /api/admin/obras
 * Listar obras con filtros y paginación
 * Query params: evento_id, estado, artista, precio_min, precio_max, buscar, page, limit, order_by, order_dir
 */
router.get('/', obraController.listObras);

/**
 * GET /api/admin/obras/:id
 * Obtener una obra específica con detalles completos
 */
router.get('/:id', obraController.getObra);

/**
 * POST /api/admin/obras
 * Crear nueva obra
 */
router.post('/', obraController.createObra);

/**
 * PUT /api/admin/obras/:id
 * Actualizar obra existente
 */
router.put('/:id', obraController.updateObra);

/**
 * DELETE /api/admin/obras/:id
 * Eliminar obra (con validaciones)
 */
router.delete('/:id', obraController.deleteObra);

/**
 * POST /api/admin/obras/:id/images
 * Subir imágenes de obra (principal o galería)
 * Body: tipo ('principal' | 'galeria'), files (multipart/form-data)
 */
router.post('/:id/images', upload.array('images', 10), obraController.uploadImages);

/**
 * DELETE /api/admin/obras/:id/images
 * Eliminar una imagen específica
 * Body: imageUrl
 */
router.delete('/:id/images', obraController.deleteImage);

module.exports = router;
