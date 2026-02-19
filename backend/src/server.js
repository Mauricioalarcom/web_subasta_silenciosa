const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const config = require('./config');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const eventoRoutes = require('./routes/eventoRoutes');

const app = express();

// Middlewares de seguridad
app.use(helmet());
app.use(cors(config.cors));

// Servir archivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Middlewares de parseo
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logger
if (config.server.env === 'development') {
  app.use(morgan('dev'));
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: config.server.env
  });
});

// Rutas de la API
app.use('/api/admin/auth', authRoutes);
app.use('/api/admin/evento', eventoRoutes);

// Ruta de bienvenida
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API de Subasta Silenciosa',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      admin: {
        auth: '/api/admin/auth',
        evento: '/api/admin/evento'
      }
    }
  });
});

// Middleware para rutas no encontradas
app.use(notFound);

// Middleware de manejo de errores (debe ser el último)
app.use(errorHandler);

// Iniciar servidor
const PORT = config.server.port;

app.listen(PORT, () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📡 Ambiente: ${config.server.env}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('Endpoints disponibles:');
  console.log(`  ✓ Health check: http://localhost:${PORT}/health`);
  console.log(`  ✓ Admin auth:   http://localhost:${PORT}/api/admin/auth/login`);
  console.log('');
});

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

module.exports = app;
