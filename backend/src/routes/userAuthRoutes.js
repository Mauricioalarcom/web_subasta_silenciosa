const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../database/db');
const config = require('../config');
const { authenticate } = require('../middleware/auth');

/**
 * POST /api/auth/register
 * Registro de nuevo usuario
 */
router.post('/register', async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    // Validar campos requeridos
    if (!nombre || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, email y contraseña son requeridos'
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email inválido'
      });
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Verificar si el email ya existe
    const usuarioExistente = await db.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email]
    );

    if (usuarioExistente.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // Hashear contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Crear usuario
    const result = await db.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol, fecha_registro) 
       VALUES ($1, $2, $3, $4, NOW()) 
       RETURNING id, nombre, email, rol`,
      [nombre, email, passwordHash, 'USER']
    );

    const usuario = result.rows[0];

    // Generar token JWT
    const token = jwt.sign(
      { 
        userId: usuario.id, 
        email: usuario.email, 
        rol: usuario.rol 
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol
        },
        token
      }
    });
  } catch (error) {
    console.error('❌ Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario',
      error: error.message
    });
  }
});

/**
 * POST /api/auth/login
 * Login de usuario
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar campos requeridos
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }

    // Buscar usuario por email
    const result = await db.query(
      `SELECT id, nombre, email, password_hash, rol, imagen_perfil, google_id 
       FROM usuarios WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    const usuario = result.rows[0];

    // Verificar si el usuario se registró con Google (y no tiene password_hash)
    if (!usuario.password_hash && usuario.google_id) {
      return res.status(400).json({
        success: false,
        message: 'Esta cuenta fue creada con Google. Por favor inicia sesión con Google.'
      });
    }

    // Verificar que exista password_hash
    if (!usuario.password_hash) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Verificar contraseña con bcrypt
    const passwordValida = await bcrypt.compare(password, usuario.password_hash);

    if (!passwordValida) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      { 
        userId: usuario.id, 
        email: usuario.email, 
        rol: usuario.rol 
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          imagen_perfil: usuario.imagen_perfil
        },
        token
      }
    });
  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión',
      error: error.message
    });
  }
});

/**
 * POST /api/auth/google
 * Autenticación/registro con Google OAuth
 */
router.post('/google', async (req, res) => {
  try {
    const { email, nombre, foto_perfil } = req.body;

    // Validar campos requeridos
    if (!email || !nombre) {
      return res.status(400).json({
        success: false,
        message: 'Email y nombre son requeridos'
      });
    }

    // Verificar si el usuario ya existe
    let usuario = await db.query(
      'SELECT id, nombre, email, rol, imagen_perfil, google_id FROM usuarios WHERE email = $1',
      [email]
    );

    if (usuario.rows.length === 0) {
      // Crear nuevo usuario PÚBLICO (nunca admin) si no existe
      const result = await db.query(
        `INSERT INTO usuarios (nombre, email, rol, google_id, imagen_perfil, fecha_registro) 
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING id, nombre, email, rol, imagen_perfil`,
        [nombre, email, 'USUARIO', email, foto_perfil]
      );
      usuario = result;
    } else {
      // Actualizar foto de perfil si cambió, pero NO cambiar el rol
      if (foto_perfil && usuario.rows[0].imagen_perfil !== foto_perfil) {
        await db.query(
          'UPDATE usuarios SET imagen_perfil = $1 WHERE id = $2',
          [foto_perfil, usuario.rows[0].id]
        );
        usuario.rows[0].imagen_perfil = foto_perfil;
      }
      // Actualizar última sesión
      await db.query(
        'UPDATE usuarios SET ultima_sesion = NOW() WHERE id = $1',
        [usuario.rows[0].id]
      );
    }

    const userData = usuario.rows[0];

    // Generar token JWT
    const token = jwt.sign(
      { 
        userId: userData.id, 
        email: userData.email, 
        rol: userData.rol 
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.json({
      success: true,
      message: 'Autenticación con Google exitosa',
      data: {
        usuario: userData,
        token
      }
    });
  } catch (error) {
    console.error('❌ Error en autenticación Google:', error);
    res.status(500).json({
      success: false,
      message: 'Error en autenticación con Google',
      error: error.message
    });
  }
});

/**
 * POST /api/auth/logout
 * Cerrar sesión
 */
router.post('/logout', authenticate, async (req, res) => {
  try {
    // Limpiar cookie
    res.clearCookie('auth_token');

    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });
  } catch (error) {
    console.error('❌ Error en logout:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cerrar sesión',
      error: error.message
    });
  }
});

/**
 * GET /api/auth/profile
 * Obtener perfil del usuario actual
 */
router.get('/profile', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, nombre, email, rol, foto_perfil, provider, created_at 
       FROM usuarios WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error al obtener perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil',
      error: error.message
    });
  }
});

module.exports = router;
