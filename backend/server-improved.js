/**
 * Servidor mejorado - Cerveza Premium
 * Versión organizada con rutas y controladores separados
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const hpp = require('hpp');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Importar utilidades
const { testConnection } = require('./utils/database');
const {
  handleDatabaseError,
  handleValidationError,
  handleJWTError,
  handleMulterError,
  errorHandler
} = require('./utils/errors');
const { sanitizeInput } = require('./middleware/security');

// Importar rutas
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 4000;

// ========== SEGURIDAD: HELMET ==========
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// ========== SEGURIDAD: LOGGING ==========
const logsDir = 'logs';
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

app.use(morgan('combined', {
  stream: fs.createWriteStream(path.join(logsDir, 'access.log'), { flags: 'a' })
}));
app.use(morgan('dev'));

// ========== SEGURIDAD: CORS ==========
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:4200';
app.use(cors({ 
  origin: corsOrigin, 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

// ========== MIDDLEWARE BÁSICO ==========
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(hpp());
app.use(sanitizeInput);

// ========== ARCHIVOS ESTÁTICOS ==========
const uploadsDir = process.env.UPLOAD_DIR || 'uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// ========== RUTAS ==========
app.use('/api/auth', authRoutes);

// Mantener rutas antiguas para compatibilidad (se pueden migrar gradualmente)
// TODO: Migrar todas las rutas a archivos separados

// ========== MANEJO DE ERRORES ==========
app.use(handleDatabaseError);
app.use(handleValidationError);
app.use(handleJWTError);
app.use(handleMulterError);
app.use(errorHandler);

// ========== INICIO DEL SERVIDOR ==========
async function startServer() {
  // Verificar conexión a la base de datos
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('❌ No se pudo conectar a la base de datos');
    process.exit(1);
  }
  console.log('✅ Conexión a la base de datos establecida');

  app.listen(PORT, () => {
    console.log(`\n🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`📡 API disponible en http://localhost:${PORT}/api`);
    console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}\n`);
  });
}

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Iniciar servidor
startServer();

module.exports = app;

