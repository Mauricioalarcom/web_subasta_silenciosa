const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const config = require('./config');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { initializeWebSocket } = require('./services/websocketService');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const adminAuthRoutes = require('./routes/adminAuthRoutes');
const userAuthRoutes = require('./routes/userAuthRoutes');
const eventoRoutes = require('./routes/eventoRoutes');
const publicEventoRoutes = require('./routes/publicEventoRoutes');
const obraRoutes = require('./routes/obraRoutes');
const publicObraRoutes = require('./routes/publicObraRoutes');
const pagoRoutes = require('./routes/pagoRoutes');
const ofertaRoutes = require('./routes/ofertaRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const favoritosRoutes = require('./routes/favoritosRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();
const server = http.createServer(app);

// Configurar Socket.io con CORS
const io = new Server(server, {
  cors: {
    origin: config.cors.origin,
    credentials: true,
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling']
});

// Inicializar servicio de WebSocket
initializeWebSocket(io);

// Middlewares de seguridad
app.use(helmet());
app.use(cors(config.cors));

// Servir archivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Middlewares de parseo
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Middleware para forzar atributos SameSite=None y Secure en cookies
// Esto es crucial para la autenticación entre dominios (localhost -> railway.app)
app.use((req, res, next) => {
  const originalSetHeader = res.setHeader.bind(res);
  res.setHeader = (name, value) => {
    if (name.toLowerCase() === 'set-cookie' && Array.isArray(value)) {
      const newValues = value.map(cookie => {
        let newCookie = cookie;
        // Añadir SameSite=None si no está presente
        if (!/samesite/i.test(cookie)) {
          newCookie += '; SameSite=None';
        }
        // Añadir Secure si no está presente
        if (!/secure/i.test(cookie)) {
          newCookie += '; Secure';
        }
        return newCookie;
      });
      return originalSetHeader(name, newValues);
    }
    return originalSetHeader(name, value);
  };
  next();
});

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
app.use('/api/admin/auth', adminAuthRoutes); // Rutas específicas para administradores
app.use('/api/admin/auth', authRoutes); // Rutas legacy de admin (mantener compatibilidad)
app.use('/api/auth', userAuthRoutes); // Rutas de autenticación para usuarios públicos
app.use('/api/admin/evento', eventoRoutes); // Evento protegido (solo admin)
app.use('/api/evento', publicEventoRoutes); // Evento público (sin autenticación)
app.use('/api/admin/obras', obraRoutes); // Obras protegidas (solo admin)
app.use('/api/obras', publicObraRoutes); // Obras públicas (sin autenticación)
app.use('/api/admin/pagos', pagoRoutes);
app.use('/api/admin/analytics', analyticsRoutes);
app.use('/api/ofertas', ofertaRoutes);
app.use('/api/favoritos', favoritosRoutes);
app.use('/api/upload', uploadRoutes); // Rutas de upload de imágenes

// Ruta de bienvenida
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API de Subasta Silenciosa',
    version: '1.0.0',
    websocket: {
      enabled: true,
      path: '/socket.io'
    },
    endpoints: {
      health: '/health',
      admin: {
        auth: '/api/admin/auth',
        evento: '/api/admin/evento',
        obras: '/api/admin/obras',
        pagos: '/api/admin/pagos'
      },
      public: {
        ofertas: '/api/ofertas'
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

server.listen(PORT, () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📡 Ambiente: ${config.server.env}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket: HABILITADO`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('Endpoints disponibles:');
  console.log(`  ✓ Health check: http://localhost:${PORT}/health`);
  console.log(`  ✓ Admin auth:   http://localhost:${PORT}/api/admin/auth/login`);
  console.log(`  ✓ Ofertas:      http://localhost:${PORT}/api/ofertas`);
  console.log(`  ✓ WebSocket:    ws://localhost:${PORT}`);
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
