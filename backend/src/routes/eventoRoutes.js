const express = require('express');
const router = express.Router();
const eventoController = require('../controllers/eventoController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Todas las rutas requieren autenticación y rol de admin
router.use(authenticate);
router.use(requireAdmin);

/**
 * @route   GET /api/admin/evento
 * @desc    Obtener el evento actual
 * @access  Admin
 */
router.get('/', eventoController.getEvento);

/**
 * @route   PUT /api/admin/evento
 * @desc    Actualizar información del evento
 * @access  Admin
 */
router.put('/', eventoController.updateEvento);

/**
 * @route   POST /api/admin/evento/image
 * @desc    Subir imagen (logo o banner) del evento
 * @access  Admin
 */
router.post('/image', upload.single('image'), eventoController.uploadImage);

/**
 * @route   DELETE /api/admin/evento/image/:tipo
 * @desc    Eliminar imagen del evento (logo o banner)
 * @access  Admin
 */
router.delete('/image/:tipo', eventoController.deleteImage);

module.exports = router;
