// Cargar configuración según el entorno
if (process.env.NODE_ENV === 'development') {
  require('dotenv').config({ path: '.env.local' });
} else {
  require('dotenv').config();
}

module.exports = {
  server: {
    port: process.env.PORT || 4000,
    env: process.env.NODE_ENV || 'development',
  },
  
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'subasta_silenciosa',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || undefined,
  },
  
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
  },
  
  email: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true' || false,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || 'noreply@subasta.com',
  },
  
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3001', 'http://localhost:3000'],
    credentials: true,
  },
  
  urls: {
    adminPanel: process.env.ADMIN_PANEL_URL || 'http://localhost:3001',
    publicWeb: process.env.PUBLIC_WEB_URL || 'http://localhost:3000',
  },

  frontend: {
    url: process.env.FRONTEND_URL || process.env.PUBLIC_WEB_URL || 'http://localhost:3000',
  },
};
