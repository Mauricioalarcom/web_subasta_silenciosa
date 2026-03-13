const db = require('../database/db');

/**
 * Middleware para verificar si un usuario es administrador
 */
const checkAdminStatus = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return next();
    }

    // Verificar si el email pertenece a un administrador
    const adminCheck = await db.query(
      'SELECT id, rol FROM usuarios WHERE email = $1 AND (rol = $2 OR rol = $3)',
      [email, 'ADMIN', 'SUPER_ADMIN']
    );

    // Agregar flag al request
    req.isAdminUser = adminCheck.rows.length > 0;
    req.adminData = adminCheck.rows[0] || null;
    
    next();
  } catch (error) {
    console.error('Error verificando estado admin:', error);
    next();
  }
};

/**
 * Verificar si un usuario puede acceder como admin
 */
const verifyAdminAccess = async (email) => {
  try {
    const result = await db.query(
      'SELECT id, nombre, email, rol, imagen_perfil FROM usuarios WHERE email = $1 AND (rol = $2 OR rol = $3)',
      [email, 'ADMIN', 'SUPER_ADMIN']
    );
    
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error('Error verificando acceso admin:', error);
    return null;
  }
};

/**
 * Verificar si un usuario es admin o usuario público
 */
const getUserRole = async (email) => {
  try {
    const result = await db.query(
      'SELECT id, nombre, email, rol, imagen_perfil, foto_perfil FROM usuarios WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];
    return {
      ...user,
      isAdmin: ['ADMIN', 'SUPER_ADMIN'].includes(user.rol),
      isPublicUser: ['USUARIO', 'USER'].includes(user.rol)
    };
  } catch (error) {
    console.error('Error obteniendo rol usuario:', error);
    return null;
  }
};

module.exports = {
  checkAdminStatus,
  verifyAdminAccess,
  getUserRole
};
