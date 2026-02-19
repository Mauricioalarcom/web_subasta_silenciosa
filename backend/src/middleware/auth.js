const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../database/db');

/**
 * Middleware para verificar que el usuario está autenticado
 */
const authenticate = async (req, res, next) => {
  try {
    // Obtener token de las cookies o del header
    const token = req.cookies?.auth_token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'NO_TOKEN',
        message: 'No se proporcionó token de autenticación'
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Obtener usuario de la base de datos
    const result = await db.query(
      'SELECT id, email, nombre, rol, estado FROM usuarios WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'Usuario no encontrado'
      });
    }

    const user = result.rows[0];

    // Verificar que el usuario esté activo
    if (user.estado !== 'ACTIVO') {
      return res.status(403).json({
        success: false,
        error: 'USER_INACTIVE',
        message: 'Usuario inactivo o bloqueado'
      });
    }

    // Añadir usuario al request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Token inválido'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'TOKEN_EXPIRED',
        message: 'Token expirado'
      });
    }

    console.error('Error en autenticación:', error);
    res.status(500).json({
      success: false,
      error: 'AUTH_ERROR',
      message: 'Error en la autenticación'
    });
  }
};

/**
 * Middleware para verificar que el usuario tiene rol de administrador
 */
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'NOT_AUTHENTICATED',
        message: 'Debes estar autenticado'
      });
    }

    if (req.user.rol !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'No tienes permisos para realizar esta acción'
      });
    }

    next();
  } catch (error) {
    console.error('Error en verificación de admin:', error);
    res.status(500).json({
      success: false,
      error: 'AUTH_ERROR',
      message: 'Error en la verificación de permisos'
    });
  }
};

/**
 * Generar token JWT
 */
const generateToken = (userId, email, rol) => {
  return jwt.sign(
    { userId, email, rol },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

module.exports = {
  authenticate,
  requireAdmin,
  generateToken
};
