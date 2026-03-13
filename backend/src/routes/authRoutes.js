const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, requireAdmin } = require('../middleware/auth');

/**
 * POST /api/admin/auth/login
 * Login de administrador
 */
router.post('/login', authController.loginAdmin);

/**
 * POST /api/admin/auth/google
 * Google OAuth login
 */
router.post('/google', authController.googleAuth);

/**
 * POST /api/admin/auth/logout
 * Logout de administrador
 */
router.post('/logout', authenticate, requireAdmin, authController.logoutAdmin);

/**
 * GET /api/admin/auth/profile
 * Obtener perfil del usuario actual
 */
router.get('/profile', authenticate, requireAdmin, authController.getProfile);

/**
 * GET /api/admin/auth/verify
 * Verificar sesión actual
 */
router.get('/verify', authenticate, requireAdmin, authController.verifySession);

module.exports = router;
