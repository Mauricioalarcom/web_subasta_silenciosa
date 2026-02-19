const bcrypt = require('bcryptjs');
const db = require('../database/db');
const { generateToken } = require('../middleware/auth');
const { ValidationError, AuthenticationError } = require('../middleware/errorHandler');

/**
 * Login de administrador con email y contraseña
 */
const loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validar campos requeridos
    if (!email || !password) {
      throw new ValidationError('Email y contraseña son requeridos');
    }

    // Buscar usuario por email
    const result = await db.query(
      `SELECT id, email, nombre, rol, estado 
       FROM usuarios 
       WHERE email = $1 AND rol = 'ADMIN'`,
      [email]
    );

    if (result.rows.length === 0) {
      throw new AuthenticationError('Credenciales inválidas');
    }

    const user = result.rows[0];

    // Verificar que el usuario esté activo
    if (user.estado !== 'ACTIVO') {
      throw new AuthenticationError('Usuario inactivo o bloqueado');
    }

    // Para este MVP simplificado, usaremos una contraseña temporal
    // En producción, deberías almacenar contraseñas hasheadas
    // Por ahora, aceptamos 'admin123' para el usuario admin
    const isValidPassword = password === 'admin123';

    if (!isValidPassword) {
      throw new AuthenticationError('Credenciales inválidas');
    }

    // Generar token JWT
    const token = generateToken(user.id, user.email, user.rol);

    // Actualizar última sesión
    await db.query(
      'UPDATE usuarios SET ultima_sesion = NOW() WHERE id = $1',
      [user.id]
    );

    // Log de actividad
    await db.query(
      `INSERT INTO logs_actividad (usuario_id, tipo_accion, descripcion, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        user.id,
        'LOGIN_ADMIN',
        'Inicio de sesión en panel admin',
        req.ip,
        req.headers['user-agent']
      ]
    );

    // Establecer cookie httpOnly
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
    });

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: {
          id: user.id,
          email: user.email,
          nombre: user.nombre,
          rol: user.rol
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout de administrador
 */
const logoutAdmin = async (req, res, next) => {
  try {
    // Log de actividad
    if (req.user) {
      await db.query(
        `INSERT INTO logs_actividad (usuario_id, tipo_accion, descripcion)
         VALUES ($1, $2, $3)`,
        [req.user.id, 'LOGOUT_ADMIN', 'Cierre de sesión del panel admin']
      );
    }

    // Limpiar cookie
    res.clearCookie('auth_token');

    res.json({
      success: true,
      message: 'Logout exitoso'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener perfil del usuario actual
 */
const getProfile = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT id, email, nombre, telefono, avatar_url, rol, fecha_registro, ultima_sesion
       FROM usuarios 
       WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Usuario');
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verificar sesión actual
 */
const verifySession = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        authenticated: true,
        user: {
          id: req.user.id,
          email: req.user.email,
          nombre: req.user.nombre,
          rol: req.user.rol
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loginAdmin,
  logoutAdmin,
  getProfile,
  verifySession
};
