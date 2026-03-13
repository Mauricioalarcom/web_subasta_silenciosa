const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const { verifyAdminAccess, getUserRole } = require('../middleware/adminCheck');

const router = express.Router();

/**
 * Login para administradores
 * POST /api/admin/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }

    // Buscar administrador
    const query = 'SELECT * FROM usuarios WHERE email = $1 AND (rol = $2 OR rol = $3)';
    const result = await db.query(query, [email, 'ADMIN', 'SUPER_ADMIN']);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas o sin permisos de administrador'
      });
    }

    const admin = result.rows[0];

    // Verificar contraseña
    if (!admin.password_hash) {
      return res.status(401).json({
        success: false,
        message: 'Cuenta sin contraseña. Usa Google OAuth o registra una contraseña.'
      });
    }
    const passwordMatch = await bcrypt.compare(password, admin.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      { 
        userId: admin.id, 
        email: admin.email,
        rol: admin.rol 
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    // Respuesta exitosa
    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: {
          id: admin.id,
          email: admin.email,
          nombre: admin.nombre,
          rol: admin.rol,
          imagen_perfil: admin.imagen_perfil
        },
        token
      }
    });

  } catch (error) {
    console.error('Error en login admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * Autenticación con Google para administradores
 * POST /api/admin/auth/google
 */
router.post('/google', async (req, res) => {
  const client = await db.getClient();
  
  try {
    const { email, nombre, google_id, imagen_perfil } = req.body;

    if (!email || !nombre) {
      return res.status(400).json({
        success: false,
        message: 'Email y nombre son requeridos'
      });
    }

    await client.query('BEGIN');

    // Buscar si ya existe el administrador
    let admin = await client.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email]
    );

    if (admin.rows.length === 0) {
      // Crear nuevo administrador automáticamente
      const insertResult = await client.query(
        `INSERT INTO usuarios (
          email, nombre, google_id, imagen_perfil, rol, 
          fecha_verificacion_email, activo
        ) VALUES ($1, $2, $3, $4, $5, NOW(), true)
        RETURNING *`,
        [email, nombre, google_id, imagen_perfil, 'ADMIN']
      );
      
      admin = insertResult;
    } else {
      // Actualizar administrador existente
      await client.query(
        `UPDATE usuarios SET 
          google_id = $1, 
          imagen_perfil = $2,
          rol = CASE WHEN rol IS NULL THEN 'ADMIN' ELSE rol END,
          fecha_verificacion_email = COALESCE(fecha_verificacion_email, NOW()),
          activo = true
        WHERE email = $3`,
        [google_id, imagen_perfil, email]
      );

      // Obtener datos actualizados
      admin = await client.query(
        'SELECT * FROM usuarios WHERE email = $1',
        [email]
      );
    }

    await client.query('COMMIT');

    const adminData = admin.rows[0];

    res.json({
      success: true,
      message: 'Autenticación exitosa',
      data: {
        user: {
          id: adminData.id,
          email: adminData.email,
          nombre: adminData.nombre,
          rol: adminData.rol,
          imagen_perfil: adminData.imagen_perfil
        }
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en autenticación Google admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  } finally {
    client.release();
  }
});

/**
 * Registro para administradores
 * POST /api/admin/auth/register
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, nombre } = req.body;

    if (!email || !password || !nombre) {
      return res.status(400).json({
        success: false,
        message: 'Email, contraseña y nombre son requeridos'
      });
    }

    // Verificar si ya existe
    const existingUser = await db.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un usuario con este email'
      });
    }

    // Hashear contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Crear administrador automáticamente
    const result = await db.query(
      `INSERT INTO usuarios (
        email, password_hash, nombre, rol, 
        fecha_verificacion_email, activo
      ) VALUES ($1, $2, $3, $4, NOW(), true)
      RETURNING id, email, nombre, rol`,
      [email, passwordHash, nombre, 'ADMIN']
    );

    const newAdmin = result.rows[0];

    // Generar token JWT
    const token = jwt.sign(
      { 
        userId: newAdmin.id, 
        email: newAdmin.email,
        rol: newAdmin.rol 
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Administrador creado exitosamente',
      data: {
        user: newAdmin,
        token
      }
    });

  } catch (error) {
    console.error('Error en registro admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * Verificar si un email pertenece a un administrador
 * GET /api/admin/auth/check-admin?email=user@example.com
 */
router.get('/check-admin', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email es requerido'
      });
    }

    const adminUser = await verifyAdminAccess(email);

    if (adminUser) {
      res.json({
        success: true,
        isAdmin: true,
        user: {
          id: adminUser.id,
          email: adminUser.email,
          nombre: adminUser.nombre,
          rol: adminUser.rol,
          imagen_perfil: adminUser.imagen_perfil
        }
      });
    } else {
      res.json({
        success: true,
        isAdmin: false,
        user: null
      });
    }

  } catch (error) {
    console.error('Error verificando admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * Establecer o actualizar contraseña y teléfono para un usuario admin
 * POST /api/admin/auth/set-password
 * Body: { email, newPassword, currentPassword?, google_id?, telefono? }
 */
router.post('/set-password', async (req, res) => {
  try {
    const { email, newPassword, currentPassword, google_id, telefono } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email y nueva contraseña son requeridos' });
    }

    // Buscar usuario
    const result = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const user = result.rows[0];

    // Si ya tiene password, requerir currentPassword
    if (user.password_hash) {
      if (!currentPassword) {
        return res.status(403).json({ success: false, message: 'Se requiere contraseña actual para cambiar la contraseña' });
      }
      const match = await require('bcryptjs').compare(currentPassword, user.password_hash);
      if (!match) {
        return res.status(401).json({ success: false, message: 'Contraseña actual incorrecta' });
      }
    } else {
      // Si no tiene password, permitir set si google_id coincide
      if (user.google_id) {
        if (!google_id || google_id !== user.google_id) {
          return res.status(403).json({ success: false, message: 'Google ID requerido para establecer contraseña' });
        }
      } else {
        // No tiene password ni google_id -> requerir algún control (bloquear)
        return res.status(403).json({ success: false, message: 'No se puede establecer contraseña para este usuario' });
      }
    }

    // Hashear y actualizar
    const bcrypt = require('bcryptjs');
    const newHash = bcrypt.hashSync(newPassword, 10);

    await db.query(
      `UPDATE usuarios SET password_hash = $1, telefono = COALESCE($2, telefono) WHERE email = $3`,
      [newHash, telefono || null, email]
    );

    res.json({ success: true, message: 'Contraseña y teléfono actualizados correctamente' });
  } catch (error) {
    console.error('Error en set-password:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

module.exports = router;
