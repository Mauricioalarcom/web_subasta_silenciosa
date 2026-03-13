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

    // Buscar usuario por email (incluye password_hash)
    const result = await db.query(
      `SELECT id, email, nombre, rol, estado, password_hash, imagen_perfil
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

    // Verificar que exista password_hash
    if (!user.password_hash) {
      throw new AuthenticationError('Cuenta sin contraseña. Usa Google OAuth o establece una contraseña.');
    }

    // Verificar contraseña real con bcrypt
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
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
          rol: user.rol,
          imagen_perfil: user.imagen_perfil
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

/**
 * Google OAuth Login
 */
const googleAuth = async (req, res, next) => {
  try {
    const { email, name, googleId, picture } = req.body;

    // Validar campos requeridos
    if (!email || !name || !googleId) {
      throw new ValidationError('Datos de Google incompletos');
    }

    // Verificar si el usuario ya existe
    let result = await db.query(
      'SELECT id, email, nombre, rol, estado, google_id FROM usuarios WHERE email = $1',
      [email]
    );

    let user;

    if (result.rows.length > 0) {
      // Usuario existe, actualizar google_id si no lo tiene
      user = result.rows[0];
      
      if (!user.google_id) {
        await db.query(
          'UPDATE usuarios SET google_id = $1, imagen_perfil = $2, ultima_sesion = NOW() WHERE id = $3',
          [googleId, picture, user.id]
        );
        user.google_id = googleId;
      } else {
        // Solo actualizar última sesión
        await db.query(
          'UPDATE usuarios SET ultima_sesion = NOW() WHERE id = $1',
          [user.id]
        );
      }
    } else {
      // Crear usuario nuevo con rol por defecto USER (backend admin flow will set ADMIN on admin endpoint)
      const insert = await db.query(
        `INSERT INTO usuarios (email, nombre, google_id, imagen_perfil, rol, fecha_registro, ultima_sesion)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id, email, nombre, rol`,
        [email, name, googleId, picture, 'USER']
      );
      user = insert.rows[0];
    }

    // Generar token y responder (si tu app requiere JWT aquí puedes generarlo)
    const token = generateToken(user.id, user.email, user.rol);

    res.json({ success: true, message: 'Autenticación Google exitosa', data: { user, token } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loginAdmin,
  logoutAdmin,
  getProfile,
  verifySession,
  googleAuth
};
