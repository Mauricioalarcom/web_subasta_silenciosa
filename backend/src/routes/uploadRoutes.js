const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const uploadController = require('../controllers/uploadController');
const { authenticate } = require('../middleware/auth');

/**
 * POST /api/upload/image
 * Subir una sola imagen
 */
router.post('/image', 
  authenticate,
  upload.single('image'), 
  uploadController.uploadImage
);

/**
 * POST /api/upload/multiple
 * Subir múltiples imágenes
 */
router.post('/multiple', 
  authenticate,
  upload.array('images', 10), // máximo 10 imágenes
  uploadController.uploadMultipleImages
);

/**
 * DELETE /api/upload/:public_id
 * Eliminar imagen por public_id de Cloudinary
 */
router.delete('/:public_id', 
  authenticate,
  uploadController.deleteImage
);

/**
 * GET /api/upload/:public_id/info
 * Obtener información de imagen de Cloudinary
 */
router.get('/:public_id/info', 
  authenticate,
  uploadController.getImageInfo
);

module.exports = router;
