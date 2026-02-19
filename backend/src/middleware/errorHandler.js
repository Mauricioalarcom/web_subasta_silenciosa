/**
 * Clase base para errores personalizados
 */
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Errores específicos
 */
class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'No autenticado') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'No autorizado') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Recurso') {
    super(`${resource} no encontrado`, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, 409, 'CONFLICT');
  }
}

class ConcurrencyError extends AppError {
  constructor(message = 'Conflicto de concurrencia') {
    super(message, 409, 'CONCURRENCY_ERROR');
  }
}

/**
 * Middleware de manejo de errores
 */
const errorHandler = (err, req, res, next) => {
  // Log del error
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    user: req.user?.id,
    timestamp: new Date().toISOString()
  });

  // Si es un error operacional conocido
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.code,
      message: err.message,
      ...(err.details && { details: err.details })
    });
  }

  // Error de validación de express-validator
  if (err.errors && Array.isArray(err.errors)) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Errores de validación',
      details: err.errors
    });
  }

  // Error de PostgreSQL
  if (err.code && err.code.startsWith('23')) {
    if (err.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'DUPLICATE_ERROR',
        message: 'El registro ya existe'
      });
    }
    if (err.code === '23503') {
      return res.status(400).json({
        success: false,
        error: 'REFERENCE_ERROR',
        message: 'Error de referencia en la base de datos'
      });
    }
  }

  // Error genérico de servidor
  const statusCode = err.statusCode || 500;
  const response = {
    success: false,
    error: err.code || 'SERVER_ERROR',
    message: err.message || 'Error interno del servidor'
  };

  // En desarrollo, incluir stack trace
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * Middleware para rutas no encontradas
 */
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'ROUTE_NOT_FOUND',
    message: `Ruta no encontrada: ${req.method} ${req.url}`
  });
};

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  ConcurrencyError,
  errorHandler,
  notFound
};
