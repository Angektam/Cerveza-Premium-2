const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const crypto = require('crypto');
const helmet = require('helmet');
const morgan = require('morgan');
const hpp = require('hpp');
require('dotenv').config();

// Importar servicio de email
const emailService = require('./services/emailService');

// Importar middleware de seguridad
const {
  generalLimiter,
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  uploadLimiter,
  validateLogin,
  validateRegister,
  validateUserUpdate,
  validatePedido,
  sanitizeInput,
  validateFileUpload,
  logFailedLogin,
  logSuccessfulLogin,
  logUnauthorizedAccess
} = require('./middleware/security');

const app = express();
const PORT = process.env.PORT || 4000;

// ========== SEGURIDAD: HELMET ==========
// Configura headers de seguridad HTTP
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
// Crear directorio de logs si no existe
const logsDir = 'logs';
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Logger HTTP con Morgan
app.use(morgan('combined', {
  stream: fs.createWriteStream(path.join(logsDir, 'access.log'), { flags: 'a' })
}));
app.use(morgan('dev')); // También mostrar en consola en desarrollo

// ========== SEGURIDAD: RATE LIMITING ==========
// DESHABILITADO COMPLETAMENTE EN DESARROLLO
// Solo aplicar en producción
const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';

if (!isDevelopment) {
  // Aplicar rate limiting general a todas las rutas (excepto OPTIONS)
  app.use('/api/', (req, res, next) => {
    // Saltar rate limiting para peticiones OPTIONS
    if (req.method === 'OPTIONS') {
      return next();
    }
    generalLimiter(req, res, next);
  });
  console.log('✅ Rate limiting ACTIVADO (modo producción)');
} else {
  console.log('⚠️  Rate limiting DESHABILITADO (modo desarrollo)');
}

// ========== SEGURIDAD: CORS ==========
// Permitir múltiples orígenes separados por coma
const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:4200'];

// Función para verificar si el origen está permitido
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir peticiones sin origen (como Postman o aplicaciones móviles)
    if (!origin) return callback(null, true);
    
    // Verificar si el origen está en la lista permitida
    if (corsOrigins.indexOf(origin) !== -1 || corsOrigins.includes('*')) {
      callback(null, true);
    } else {
      console.log(`⚠️  CORS bloqueado para origen: ${origin}`);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
};

app.use(cors(corsOptions));

// ========== MIDDLEWARE BÁSICO ==========
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ========== SEGURIDAD: HPP (HTTP Parameter Pollution) ==========
app.use(hpp());

// ========== SEGURIDAD: SANITIZACIÓN ==========
app.use(sanitizeInput);

// ========== ARCHIVOS ESTÁTICOS ==========
app.use('/uploads', express.static('uploads'));

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cerveza_premium',
  port: process.env.DB_PORT || 3306
};

// Pool de conexiones
const pool = mysql.createPool(dbConfig);

// Asegurar directorio de uploads
const uploadsDir = process.env.UPLOAD_DIR || 'uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, `${uploadsDir}/`);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  }
});

// Middleware de autenticación (mejorado)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    logUnauthorizedAccess(req);
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'tu_secreto_super_seguro', (err, user) => {
    if (err) {
      logUnauthorizedAccess(req);
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expirado', expired: true });
      }
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// Middleware para verificar rol de admin/vendedor
const requireAdminOrVendor = (req, res, next) => {
  if (!req.user || (req.user.rol !== 'admin' && req.user.rol !== 'vendedor')) {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador o vendedor' });
  }
  next();
};

// Middleware para verificar rol de admin
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador' });
  }
  next();
};

// ========== RUTAS DE AUTENTICACIÓN ==========

// Healthcheck del servidor y base de datos
app.get('/api/health', async (req, res) => {
  try {
    const [result] = await pool.query('SELECT 1 AS ok');
    res.json({ status: 'ok', db: result[0]?.ok === 1 ? 'connected' : 'unknown' });
  } catch (error) {
    console.error('Health DB error:', error);
    res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

// Login (con rate limiting y validación)
app.post('/api/auth/login', loginLimiter, validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.execute(
      'SELECT * FROM usuarios WHERE email = ? AND activo = 1',
      [email]
    );

    if (rows.length === 0) {
      logFailedLogin(email, req);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      logFailedLogin(email, req);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar token JWT con expiración configurable
    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      process.env.JWT_SECRET || 'tu_secreto_super_seguro',
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );

    // Registrar login exitoso
    logSuccessfulLogin(user.id, email, req);

    // Actualizar última actividad
    await pool.execute(
      'UPDATE usuarios SET ultima_actividad = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    res.json({
      user: {
        id: user.id,
        nombre_completo: user.nombre_completo,
        email: user.email,
        telefono: user.telefono,
        direccion: user.direccion,
        fecha_nacimiento: user.fecha_nacimiento,
        puntos_acumulados: user.puntos_acumulados,
        tipo_identificacion: user.tipo_identificacion,
        numero_identificacion: user.numero_identificacion,
        foto_identificacion_frente: user.foto_identificacion_frente,
        foto_identificacion_reverso: user.foto_identificacion_reverso,
        rol: user.rol
      },
      token
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Registro (con rate limiting y validación)
app.post('/api/auth/register', registerLimiter, validateRegister, async (req, res) => {
  try {
    const {
      nombre_completo,
      email,
      password,
      telefono,
      direccion,
      fecha_nacimiento,
      tipo_identificacion,
      numero_identificacion,
      foto_identificacion_frente,
      foto_identificacion_reverso,
      confirmo_mayor_edad,
      acepto_terminos
    } = req.body;

    // Verificar si el email ya existe
    const [existingUser] = await pool.execute(
      'SELECT id FROM usuarios WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Hash de la contraseña con bcrypt rounds configurables
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Crear usuario
    const [result] = await pool.execute(
      `INSERT INTO usuarios (
        nombre_completo, email, password_hash, telefono, direccion, 
        fecha_nacimiento, tipo_identificacion, numero_identificacion,
        foto_identificacion_frente, foto_identificacion_reverso,
        confirmo_mayor_edad, acepto_terminos
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre_completo, email, password_hash, telefono, direccion,
        fecha_nacimiento, tipo_identificacion, numero_identificacion,
        foto_identificacion_frente, foto_identificacion_reverso,
        confirmo_mayor_edad, acepto_terminos
      ]
    );

    const userId = result.insertId;

    // Generar token
    const token = jwt.sign(
      { id: userId, email },
      process.env.JWT_SECRET || 'tu_secreto_super_seguro',
      { expiresIn: '24h' }
    );

    // Obtener datos del usuario creado
    const [newUser] = await pool.execute(
      'SELECT * FROM usuarios WHERE id = ?',
      [userId]
    );

    // Enviar email de bienvenida (en segundo plano, no bloquea la respuesta)
    emailService.sendWelcomeEmail(email, nombre_completo).catch(err => {
      console.error('Error al enviar email de bienvenida:', err);
      // No falla el registro si el email falla
    });

    res.status(201).json({
      user: {
        id: newUser[0].id,
        nombre_completo: newUser[0].nombre_completo,
        email: newUser[0].email,
        telefono: newUser[0].telefono,
        direccion: newUser[0].direccion,
        fecha_nacimiento: newUser[0].fecha_nacimiento,
        puntos_acumulados: newUser[0].puntos_acumulados,
        tipo_identificacion: newUser[0].tipo_identificacion,
        numero_identificacion: newUser[0].numero_identificacion,
        foto_identificacion_frente: newUser[0].foto_identificacion_frente,
        foto_identificacion_reverso: newUser[0].foto_identificacion_reverso
      },
      token
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Forgot Password
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email es requerido' });
    }

    // Verificar si el usuario existe
    const [rows] = await pool.execute(
      'SELECT id, nombre_completo FROM usuarios WHERE email = ? AND activo = 1',
      [email]
    );

    if (rows.length === 0) {
      // Por seguridad, no revelamos si el email existe o no
      return res.json({ 
        message: 'Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña' 
      });
    }

    const user = rows[0];

    // Generar token único
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hora

    // Guardar token en base de datos
    await pool.execute(
      'INSERT INTO reset_tokens (usuario_id, token, email, expires_at) VALUES (?, ?, ?, ?)',
      [user.id, resetToken, email, expiresAt]
    );

    // En un entorno real, aquí enviarías el email
    // Por ahora, solo logueamos el token para desarrollo
    console.log(`\n=== RESET PASSWORD TOKEN ===`);
    console.log(`Usuario: ${user.nombre_completo} (${email})`);
    console.log(`Token: ${resetToken}`);
    console.log(`Expira: ${expiresAt}`);
    console.log(`URL: http://localhost:4200/reset-password?token=${resetToken}`);
    console.log(`========================\n`);

    res.json({ 
      message: 'Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña',
      // Solo en desarrollo - remover en producción
      resetUrl: `http://localhost:4200/reset-password?token=${resetToken}`
    });
  } catch (error) {
    console.error('Error en forgot password:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token y nueva contraseña son requeridos' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }

    // Verificar token válido
    const [tokenRows] = await pool.execute(
      'SELECT rt.*, u.id as user_id FROM reset_tokens rt JOIN usuarios u ON rt.usuario_id = u.id WHERE rt.token = ? AND rt.used = FALSE AND rt.expires_at > NOW()',
      [token]
    );

    if (tokenRows.length === 0) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }

    const tokenData = tokenRows[0];

    // Hash de la nueva contraseña
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(newPassword, saltRounds);

    // Actualizar contraseña del usuario
    await pool.execute(
      'UPDATE usuarios SET password_hash = ? WHERE id = ?',
      [password_hash, tokenData.user_id]
    );

    // Marcar token como usado
    await pool.execute(
      'UPDATE reset_tokens SET used = TRUE WHERE id = ?',
      [tokenData.id]
    );

    res.json({ message: 'Contraseña restablecida exitosamente' });
  } catch (error) {
    console.error('Error en reset password:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ========== RUTAS DE USUARIOS ==========

// Obtener usuario por ID
app.get('/api/usuarios/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute(
      'SELECT * FROM usuarios WHERE id = ? AND activo = 1',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = rows[0];
    res.json({
      id: user.id,
      nombre_completo: user.nombre_completo,
      email: user.email,
      telefono: user.telefono,
      direccion: user.direccion,
      fecha_nacimiento: user.fecha_nacimiento,
      puntos_acumulados: user.puntos_acumulados,
      tipo_identificacion: user.tipo_identificacion,
      numero_identificacion: user.numero_identificacion,
      foto_identificacion_frente: user.foto_identificacion_frente,
      foto_identificacion_reverso: user.foto_identificacion_reverso
    });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar usuario
app.put('/api/usuarios/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Verificar que el usuario existe
    const [existingUser] = await pool.execute(
      'SELECT id FROM usuarios WHERE id = ? AND activo = 1',
      [id]
    );

    if (existingUser.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Construir query de actualización dinámicamente
    const allowedFields = ['nombre_completo', 'telefono', 'direccion'];
    const updates = [];
    const values = [];

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(updateData[field]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos válidos para actualizar' });
    }

    values.push(id);

    await pool.execute(
      `UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Obtener usuario actualizado
    const [updatedUser] = await pool.execute(
      'SELECT * FROM usuarios WHERE id = ?',
      [id]
    );

    res.json({
      id: updatedUser[0].id,
      nombre_completo: updatedUser[0].nombre_completo,
      email: updatedUser[0].email,
      telefono: updatedUser[0].telefono,
      direccion: updatedUser[0].direccion,
      fecha_nacimiento: updatedUser[0].fecha_nacimiento,
      puntos_acumulados: updatedUser[0].puntos_acumulados,
      tipo_identificacion: updatedUser[0].tipo_identificacion,
      numero_identificacion: updatedUser[0].numero_identificacion,
      foto_identificacion_frente: updatedUser[0].foto_identificacion_frente,
      foto_identificacion_reverso: updatedUser[0].foto_identificacion_reverso
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ========== RUTAS DE CERVEZAS ==========

// Función helper para normalizar URLs de imágenes
const normalizeImageUrl = (url) => {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return 'https://via.placeholder.com/280x200/EEE/333?text=Cerveza';
  }
  
  url = url.trim();
  
  // Si ya tiene protocolo, retornarla (limpiando :1 si existe)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url.replace(/(\?text=[^&]+):\d+($|&)/, '$1$2');
  }
  
  // Si contiene via.placeholder.com sin protocolo, agregar https://
  if (url.includes('via.placeholder.com')) {
    url = url.replace(/(\?text=[^&]+):\d+($|&)/, '$1$2');
    url = url.replace(/(\?text=[^:]+):\d+$/, '$1');
    return `https://${url}`;
  }
  
  // Si parece ser una URL de placeholder sin protocolo
  if (url.includes('/280x200/') || url.includes('/50x50/') || url.includes('/40x40/') || url.includes('/100x100/')) {
    return `https://${url}`;
  }
  
  // Si es un fragmento como "000000?text=IPA:1"
  const fragmentMatch = url.match(/^([0-9A-Fa-f]{6})\?text=(.+)$/);
  if (fragmentMatch) {
    const bgColor = fragmentMatch[1];
    const text = fragmentMatch[2].replace(/:\d+$/, '');
    return `https://via.placeholder.com/280x200/${bgColor}/FFFFFF?text=${encodeURIComponent(text)}`;
  }
  
  return url;
};

// Obtener todas las cervezas
app.get('/api/cervezas', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM cervezas WHERE activa = 1 ORDER BY nombre'
    );
    // Normalizar URLs de imágenes antes de enviar
    const normalizedRows = rows.map(cerveza => ({
      ...cerveza,
      imagen_url: normalizeImageUrl(cerveza.imagen_url)
    }));
    res.json(normalizedRows);
  } catch (error) {
    console.error('Error al obtener cervezas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener cervezas mexicanas con datos reales
app.get('/api/cervezas-mexicanas', async (req, res) => {
  try {
    const cervezasMexicanas = [
      {
        id: 1,
        nombre: "Corona Extra",
        estilo: "Lager",
        descripcion: "La cerveza mexicana más famosa del mundo, ligera y refrescante",
        precio: 45.99,
        puntos_ganados: 10,
        imagen_url: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400",
        categoria_id: 1,
        stock_disponible: 100,
        calificacion_promedio: 4.2,
        total_calificaciones: 1250,
        pais: "México",
        cerveceria: "Grupo Modelo",
        abv: "4.5%",
        ibu: "18"
      },
      {
        id: 2,
        nombre: "Dos Equis XX Lager",
        estilo: "Lager",
        descripcion: "Cerveza lager mexicana con sabor suave y refrescante",
        precio: 52.99,
        puntos_ganados: 12,
        imagen_url: "https://images.unsplash.com/photo-1600788907416-456578634209?w=400",
        categoria_id: 1,
        stock_disponible: 85,
        calificacion_promedio: 4.3,
        total_calificaciones: 980,
        pais: "México",
        cerveceria: "Grupo Modelo",
        abv: "4.2%",
        ibu: "15"
      },
      {
        id: 3,
        nombre: "Tecate Original",
        estilo: "Lager",
        descripcion: "Cerveza lager tradicional mexicana, perfecta para cualquier ocasión",
        precio: 38.99,
        puntos_ganados: 8,
        imagen_url: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400",
        categoria_id: 1,
        stock_disponible: 120,
        calificacion_promedio: 4.0,
        total_calificaciones: 750,
        pais: "México",
        cerveceria: "Heineken México",
        abv: "4.0%",
        ibu: "12"
      },
      {
        id: 4,
        nombre: "Negra Modelo",
        estilo: "Vienna Lager",
        descripcion: "Cerveza oscura mexicana con maltas tostadas y sabor robusto",
        precio: 58.99,
        puntos_ganados: 15,
        imagen_url: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400",
        categoria_id: 2,
        stock_disponible: 75,
        calificacion_promedio: 4.5,
        total_calificaciones: 1100,
        pais: "México",
        cerveceria: "Grupo Modelo",
        abv: "5.4%",
        ibu: "25"
      },
      {
        id: 5,
        nombre: "Bohemia Clara",
        estilo: "Pilsner",
        descripcion: "Pilsner mexicana premium con lúpulos nobles y sabor limpio",
        precio: 65.99,
        puntos_ganados: 18,
        imagen_url: "https://images.unsplash.com/photo-1600788907416-456578634209?w=400",
        categoria_id: 1,
        stock_disponible: 60,
        calificacion_promedio: 4.6,
        total_calificaciones: 850,
        pais: "México",
        cerveceria: "Grupo Modelo",
        abv: "4.7%",
        ibu: "22"
      },
      {
        id: 6,
        nombre: "Indio",
        estilo: "Lager",
        descripcion: "Cerveza lager mexicana con carácter único y sabor distintivo",
        precio: 48.99,
        puntos_ganados: 11,
        imagen_url: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400",
        categoria_id: 1,
        stock_disponible: 90,
        calificacion_promedio: 4.1,
        total_calificaciones: 650,
        pais: "México",
        cerveceria: "Grupo Modelo",
        abv: "4.3%",
        ibu: "16"
      },
      {
        id: 7,
        nombre: "Sol",
        estilo: "Lager",
        descripcion: "Cerveza lager mexicana clara y refrescante, perfecta para el clima tropical",
        precio: 42.99,
        puntos_ganados: 9,
        imagen_url: "https://images.unsplash.com/photo-1600788907416-456578634209?w=400",
        categoria_id: 1,
        stock_disponible: 110,
        calificacion_promedio: 4.0,
        total_calificaciones: 920,
        pais: "México",
        cerveceria: "Heineken México",
        abv: "4.1%",
        ibu: "14"
      },
      {
        id: 8,
        nombre: "Pacifico Clara",
        estilo: "Lager",
        descripcion: "Cerveza lager mexicana del Pacífico, ligera y perfecta para mariscos",
        precio: 49.99,
        puntos_ganados: 12,
        imagen_url: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400",
        categoria_id: 1,
        stock_disponible: 80,
        calificacion_promedio: 4.2,
        total_calificaciones: 780,
        pais: "México",
        cerveceria: "Grupo Modelo",
        abv: "4.4%",
        ibu: "17"
      },
      {
        id: 9,
        nombre: "Victoria",
        estilo: "Lager",
        descripcion: "Cerveza lager mexicana tradicional con más de 100 años de historia",
        precio: 55.99,
        puntos_ganados: 14,
        imagen_url: "https://images.unsplash.com/photo-1600788907416-456578634209?w=400",
        categoria_id: 1,
        stock_disponible: 70,
        calificacion_promedio: 4.4,
        total_calificaciones: 1050,
        pais: "México",
        cerveceria: "Grupo Modelo",
        abv: "4.6%",
        ibu: "20"
      },
      {
        id: 10,
        nombre: "Estrella Jalisco",
        estilo: "Lager",
        descripcion: "Cerveza lager artesanal mexicana con ingredientes locales",
        precio: 68.99,
        puntos_ganados: 20,
        imagen_url: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400",
        categoria_id: 3,
        stock_disponible: 45,
        calificacion_promedio: 4.7,
        total_calificaciones: 420,
        pais: "México",
        cerveceria: "Cervecería Artesanal",
        abv: "5.2%",
        ibu: "24"
      },
      {
        id: 11,
        nombre: "Cerveza Minerva",
        estilo: "Pale Ale",
        descripcion: "Cerveza artesanal mexicana con lúpulos americanos y sabor cítrico",
        precio: 75.99,
        puntos_ganados: 22,
        imagen_url: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400",
        categoria_id: 3,
        stock_disponible: 35,
        calificacion_promedio: 4.8,
        total_calificaciones: 380,
        pais: "México",
        cerveceria: "Cervecería Minerva",
        abv: "5.8%",
        ibu: "45"
      },
      {
        id: 12,
        nombre: "Cerveza Cucapá",
        estilo: "IPA",
        descripcion: "IPA artesanal mexicana con lúpulos tropicales y notas de mango",
        precio: 82.99,
        puntos_ganados: 25,
        imagen_url: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400",
        categoria_id: 3,
        stock_disponible: 30,
        calificacion_promedio: 4.9,
        total_calificaciones: 320,
        pais: "México",
        cerveceria: "Cervecería Cucapá",
        abv: "6.5%",
        ibu: "65"
      },
      {
        id: 13,
        nombre: "Cerveza Calavera",
        estilo: "Stout",
        descripcion: "Stout artesanal mexicana con café local y notas de chocolate",
        precio: 88.99,
        puntos_ganados: 28,
        imagen_url: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400",
        categoria_id: 3,
        stock_disponible: 25,
        calificacion_promedio: 4.8,
        total_calificaciones: 280,
        pais: "México",
        cerveceria: "Cervecería Calavera",
        abv: "7.2%",
        ibu: "35"
      },
      {
        id: 14,
        nombre: "Cerveza Tijuana",
        estilo: "Wheat Beer",
        descripcion: "Cerveza de trigo artesanal mexicana con notas de banana y clavo",
        precio: 72.99,
        puntos_ganados: 20,
        imagen_url: "https://images.unsplash.com/photo-1618885472179-5e474019f2a9?w=400",
        categoria_id: 3,
        stock_disponible: 40,
        calificacion_promedio: 4.6,
        total_calificaciones: 350,
        pais: "México",
        cerveceria: "Cervecería Tijuana",
        abv: "5.4%",
        ibu: "18"
      },
      {
        id: 15,
        nombre: "Cerveza Insurgente",
        estilo: "Imperial Stout",
        descripcion: "Imperial Stout artesanal mexicana envejecida en barricas de bourbon",
        precio: 125.99,
        puntos_ganados: 35,
        imagen_url: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400",
        categoria_id: 3,
        stock_disponible: 15,
        calificacion_promedio: 4.9,
        total_calificaciones: 180,
        pais: "México",
        cerveceria: "Cervecería Insurgente",
        abv: "10.5%",
        ibu: "55"
      }
    ];

    res.json(cervezasMexicanas);
  } catch (error) {
    console.error('Error al obtener cervezas mexicanas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener cerveza por ID
app.get('/api/cervezas/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute(
      'SELECT * FROM cervezas WHERE id = ? AND activa = 1',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Cerveza no encontrada' });
    }

    // Normalizar URL de imagen antes de enviar
    const cerveza = {
      ...rows[0],
      imagen_url: normalizeImageUrl(rows[0].imagen_url)
    };

    res.json(cerveza);
  } catch (error) {
    console.error('Error al obtener cerveza:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Buscar cervezas
app.get('/api/cervezas/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.json([]);
    }

    const [rows] = await pool.execute(
      `SELECT * FROM cervezas 
       WHERE activa = 1 AND (nombre LIKE ? OR estilo LIKE ? OR descripcion LIKE ?)
       ORDER BY nombre`,
      [`%${q}%`, `%${q}%`, `%${q}%`]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error al buscar cervezas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener cervezas por categoría
app.get('/api/cervezas/categoria/:categoriaId', async (req, res) => {
  try {
    const { categoriaId } = req.params;

    const [rows] = await pool.execute(
      'SELECT * FROM cervezas WHERE categoria_id = ? AND activa = 1 ORDER BY nombre',
      [categoriaId]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error al obtener cervezas por categoría:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ========== RUTAS DE CARRITO ==========

// Obtener carrito del usuario (esquema con tabla única `carrito`)
app.get('/api/carrito/:usuarioId', authenticateToken, async (req, res) => {
  try {
    const { usuarioId } = req.params;
    if (Number(usuarioId) !== req.user.id) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const [rows] = await pool.execute(
      `SELECT ca.*, c.nombre, c.estilo, c.descripcion, c.imagen_url, c.precio AS precio_actual, c.puntos_ganados
       FROM carrito ca
       JOIN cervezas c ON ca.cerveza_id = c.id
       WHERE ca.usuario_id = ?
       ORDER BY ca.fecha_agregado DESC`,
      [usuarioId]
    );

    const result = rows.map((r) => ({
      id: r.id,
      cerveza_id: r.cerveza_id,
      cantidad: r.cantidad,
      precio_unitario: r.precio_unitario,
      fecha_agregado: r.fecha_agregado,
      cerveza: {
        id: r.cerveza_id,
        nombre: r.nombre,
        estilo: r.estilo,
        descripcion: r.descripcion,
        imagen_url: normalizeImageUrl(r.imagen_url), // Normalizar URL de imagen
        precio: r.precio_actual,
        puntos_ganados: r.puntos_ganados
      }
    }));

    res.json(result);
  } catch (error) {
    console.error('Error al obtener carrito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Agregar al carrito (esquema con tabla única `carrito`)
app.post('/api/carrito/add', authenticateToken, async (req, res) => {
  try {
    const { usuario_id, cerveza_id, cantidad } = req.body;

    // Verificar si ya existe en el carrito del usuario
    const [existingItem] = await pool.execute(
      'SELECT id, cantidad FROM carrito WHERE usuario_id = ? AND cerveza_id = ?',
      [usuario_id, cerveza_id]
    );

    if (existingItem.length > 0) {
      // Actualizar cantidad acumulando
      const newQuantity = existingItem[0].cantidad + cantidad;
      await pool.execute(
        'UPDATE carrito SET cantidad = ? WHERE id = ?',
        [newQuantity, existingItem[0].id]
      );

      const [updatedItem] = await pool.execute(
        'SELECT * FROM carrito WHERE id = ?',
        [existingItem[0].id]
      );

      return res.json(updatedItem[0]);
    }

    // Obtener precio de la cerveza
    const [cerveza] = await pool.execute(
      'SELECT precio FROM cervezas WHERE id = ? AND activa = 1',
      [cerveza_id]
    );

    if (cerveza.length === 0) {
      return res.status(404).json({ error: 'Cerveza no encontrada' });
    }

    const precio_unitario = cerveza[0].precio;

    // Crear nuevo item
    const [result] = await pool.execute(
      'INSERT INTO carrito (usuario_id, cerveza_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
      [usuario_id, cerveza_id, cantidad, precio_unitario]
    );

    const [newItem] = await pool.execute(
      'SELECT * FROM carrito WHERE id = ?',
      [result.insertId]
    );

    res.json(newItem[0]);
  } catch (error) {
    console.error('Error al agregar al carrito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar cantidad en carrito (tabla `carrito`)
app.put('/api/carrito/item/:itemId', authenticateToken, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { cantidad } = req.body;
    const usuarioId = req.user.id;

    // Primero intenta por id del registro de carrito
    const [byId] = await pool.execute('SELECT * FROM carrito WHERE id = ? AND usuario_id = ?', [itemId, usuarioId]);
    if (byId.length > 0) {
      await pool.execute('UPDATE carrito SET cantidad = ? WHERE id = ?', [cantidad, itemId]);
      const [updated] = await pool.execute('SELECT * FROM carrito WHERE id = ?', [itemId]);
      return res.json(updated[0]);
    }

    // Si no existe, interpreta itemId como cerveza_id
    const cervezaId = Number(itemId);
    await pool.execute('UPDATE carrito SET cantidad = ? WHERE usuario_id = ? AND cerveza_id = ?', [cantidad, usuarioId, cervezaId]);
    const [updatedByCombo] = await pool.execute('SELECT * FROM carrito WHERE usuario_id = ? AND cerveza_id = ?', [usuarioId, cervezaId]);
    if (updatedByCombo.length === 0) {
      return res.status(404).json({ error: 'Item no encontrado' });
    }
    res.json(updatedByCombo[0]);
  } catch (error) {
    console.error('Error al actualizar carrito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar del carrito (tabla `carrito`)
app.delete('/api/carrito/item/:itemId', authenticateToken, async (req, res) => {
  try {
    const { itemId } = req.params;
    const usuarioId = req.user.id;

    // Intentar borrar por id del registro
    const [delById] = await pool.execute('DELETE FROM carrito WHERE id = ? AND usuario_id = ?', [itemId, usuarioId]);
    // Si no borró nada, interpreta como cerveza_id
    if (delById.affectedRows === 0) {
      const cervezaId = Number(itemId);
      const [delByCombo] = await pool.execute('DELETE FROM carrito WHERE usuario_id = ? AND cerveza_id = ?', [usuarioId, cervezaId]);
      if (delByCombo.affectedRows === 0) {
        return res.status(404).json({ error: 'Item no encontrado' });
      }
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error al eliminar del carrito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Limpiar carrito (tabla `carrito`)
app.delete('/api/carrito/:usuarioId', authenticateToken, async (req, res) => {
  try {
    const { usuarioId } = req.params;

    await pool.execute(
      'DELETE FROM carrito WHERE usuario_id = ?',
      [usuarioId]
    );

    res.status(204).send();
  } catch (error) {
    console.error('Error al limpiar carrito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ========== RUTAS DE PEDIDOS ==========

// Obtener pedidos del usuario
app.get('/api/pedidos/usuario/:usuarioId', authenticateToken, async (req, res) => {
  try {
    const { usuarioId } = req.params;

    // Obtener pedidos
    const [pedidos] = await pool.execute(
      'SELECT * FROM pedidos WHERE usuario_id = ? ORDER BY fecha_pedido DESC',
      [usuarioId]
    );

    // Para cada pedido, obtener sus items con información de la cerveza
    const pedidosConItems = await Promise.all(
      pedidos.map(async (pedido) => {
        try {
          const [items] = await pool.execute(
            `SELECT 
              pi.*,
              c.nombre as cerveza_nombre,
              c.estilo as cerveza_estilo,
              c.imagen_url as cerveza_imagen
            FROM pedido_items pi
            LEFT JOIN cervezas c ON pi.cerveza_id = c.id
            WHERE pi.pedido_id = ?`,
            [pedido.id]
          );

          // Formatear items
          const itemsFormateados = items.map((item) => ({
            id: item.id,
            cerveza_id: item.cerveza_id,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
            subtotal: item.subtotal,
            nombre: item.cerveza_nombre || 'Cerveza',
            estilo: item.cerveza_estilo || '',
            imagen: normalizeImageUrl(item.cerveza_imagen) || '',
            imagen_url: normalizeImageUrl(item.cerveza_imagen) || '' // También incluir imagen_url para compatibilidad
          }));

          return {
            ...pedido,
            items: itemsFormateados
          };
        } catch (error) {
          console.error(`Error al obtener items del pedido ${pedido.id}:`, error);
          // Retornar pedido sin items en caso de error
          return {
            ...pedido,
            items: []
          };
        }
      })
    );

    res.json(pedidosConItems);
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear pedido
app.post('/api/pedidos', authenticateToken, async (req, res) => {
  try {
    const {
      usuario_id,
      total: totalBody,
      puntos_usados = 0,
      puntos_ganados: puntosBody = 0,
      direccion_entrega = null,
      notas = '',
      metodo_pago = 'tarjeta',
      items = []
    } = req.body;

    if (!usuario_id) {
      return res.status(400).json({ error: 'usuario_id es requerido' });
    }

    // Calcular totales si no vienen
    const total = Number(totalBody) || 0;
    const puntos_ganados = puntosBody || Math.floor(total * 5);

    // Generar número de pedido único
    const numero_pedido = 'CP' + Date.now() + Math.floor(Math.random() * 1000);

    // Verificar si la columna metodo_pago existe
    let tieneMetodoPago = false;
    try {
      const [columns] = await pool.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'pedidos' 
        AND COLUMN_NAME = 'metodo_pago'
      `);
      tieneMetodoPago = columns.length > 0;
    } catch (err) {
      console.warn('No se pudo verificar columna metodo_pago, asumiendo que no existe');
    }

    // Insertar pedido (según esquema real)
    let result;
    if (tieneMetodoPago) {
      [result] = await pool.execute(
        `INSERT INTO pedidos (
          usuario_id, numero_pedido, total, puntos_usados, puntos_ganados, direccion_entrega, notas, metodo_pago
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          usuario_id, numero_pedido, total, puntos_usados, puntos_ganados, direccion_entrega, notas, metodo_pago
        ]
      );
    } else {
      // Si no existe la columna, insertar sin metodo_pago
      [result] = await pool.execute(
        `INSERT INTO pedidos (
          usuario_id, numero_pedido, total, puntos_usados, puntos_ganados, direccion_entrega, notas
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          usuario_id, numero_pedido, total, puntos_usados, puntos_ganados, direccion_entrega, notas
        ]
      );
      console.log('⚠️ Columna metodo_pago no existe, pedido creado sin método de pago');
    }

    const pedidoId = result.insertId;

    // Insertar items del pedido si vienen en la solicitud
    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        const cerveza_id = item.cerveza_id;
        const cantidad = item.cantidad;
        const precio_unitario = item.precio_unitario;
        const subtotal = item.subtotal ?? (Number(precio_unitario) * Number(cantidad));
        await pool.execute(
          `INSERT INTO pedido_items (pedido_id, cerveza_id, cantidad, precio_unitario, subtotal)
           VALUES (?, ?, ?, ?, ?)`,
          [pedidoId, cerveza_id, cantidad, precio_unitario, subtotal]
        );
      }
    }

    // Actualizar puntos del usuario
    if (puntos_usados > 0 || puntos_ganados > 0) {
      await pool.execute(
        'UPDATE usuarios SET puntos_acumulados = puntos_acumulados - ? + ? WHERE id = ?',
        [puntos_usados, puntos_ganados, usuario_id]
      );

      // Registrar transacciones de puntos
      if (puntos_usados > 0) {
        await pool.execute(
          'INSERT INTO puntos_historial (usuario_id, tipo, cantidad, descripcion, pedido_id) VALUES (?, ?, ?, ?, ?)',
          [usuario_id, 'usado', puntos_usados, `Puntos usados en pedido ${numero_pedido}`, pedidoId]
        );
      }

      if (puntos_ganados > 0) {
        await pool.execute(
          'INSERT INTO puntos_historial (usuario_id, tipo, cantidad, descripcion, pedido_id) VALUES (?, ?, ?, ?, ?)',
          [usuario_id, 'ganado', puntos_ganados, `Puntos ganados por pedido ${numero_pedido}`, pedidoId]
        );
      }
    }

    // Limpiar carrito del usuario (tabla `carrito`)
    await pool.execute(
      'DELETE FROM carrito WHERE usuario_id = ?',
      [usuario_id]
    );

    // Obtener datos del usuario y del pedido para el email
    const [userData] = await pool.execute(
      'SELECT nombre_completo, email FROM usuarios WHERE id = ?',
      [usuario_id]
    );

    // Obtener items del pedido
    const [pedidoItems] = await pool.execute(
      `SELECT ci.nombre, pi.cantidad, pi.precio_unitario as precio, pi.subtotal
       FROM pedido_items pi
       JOIN cervezas ci ON pi.cerveza_id = ci.id
       WHERE pi.pedido_id = ?`,
      [pedidoId]
    );

    // Enviar email de confirmación de pedido (en segundo plano, no bloquea la respuesta)
    if (userData.length > 0 && userData[0].email) {
      const orderData = {
        id: numero_pedido,
        total: total,
        estado: 'confirmado',
        metodo_entrega: direccion_entrega ? 'delivery' : 'pickup',
        direccion: direccion_entrega,
        items: pedidoItems.map(item => ({
          nombre: item.nombre,
          cantidad: item.cantidad,
          precio: Number(item.precio),
          subtotal: Number(item.subtotal)
        }))
      };

      emailService.sendOrderConfirmationEmail(
        userData[0].email,
        userData[0].nombre_completo,
        orderData
      ).catch(err => {
        console.error('Error al enviar email de confirmación de pedido:', err);
        // No falla el pedido si el email falla
      });
    }

    res.status(201).json({
      id: pedidoId,
      numero_pedido,
      total,
      puntos_ganados
    });
  } catch (error) {
    console.error('Error al crear pedido:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ========== RUTAS DE PUNTOS ==========

// Obtener puntos del usuario
app.get('/api/puntos/:usuarioId', authenticateToken, async (req, res) => {
  try {
    const { usuarioId } = req.params;

    const [rows] = await pool.execute(
      'SELECT puntos_acumulados FROM usuarios WHERE id = ?',
      [usuarioId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ puntos: rows[0].puntos_acumulados });
  } catch (error) {
    console.error('Error al obtener puntos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener historial de transacciones de puntos del usuario
app.get('/api/puntos/transacciones/:usuarioId', authenticateToken, async (req, res) => {
  try {
    const { usuarioId } = req.params;

    const [rows] = await pool.execute(
      `
      SELECT 
        id,
        usuario_id,
        tipo,
        cantidad,
        descripcion,
        pedido_id,
        fecha AS fecha_transaccion
      FROM puntos_historial
      WHERE usuario_id = ?
      ORDER BY fecha DESC
      LIMIT 200
      `,
      [usuarioId]
    );

    // Si no hay transacciones, devolver arreglo vacío (no es error)
    res.json(rows || []);
  } catch (error) {
    console.error('Error al obtener transacciones de puntos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ========== RUTAS DE UPLOAD ==========

// Subir archivo (con rate limiting y validación)
app.post('/api/upload', authenticateToken, uploadLimiter, upload.single('file'), validateFileUpload, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo' });
    }

    const fileUrl = `${process.env.BACKEND_URL || 'http://localhost:' + PORT}/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  } catch (error) {
    console.error('Error al subir archivo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ========== RUTAS DE ADMINISTRACIÓN ==========

// Obtener estadísticas generales
app.get('/api/admin/estadisticas', authenticateToken, requireAdminOrVendor, async (req, res) => {
  try {
    // Estadísticas de usuarios
    const [usuariosStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_usuarios,
        COUNT(CASE WHEN rol = 'cliente' THEN 1 END) as clientes,
        COUNT(CASE WHEN rol = 'vendedor' THEN 1 END) as vendedores,
        COUNT(CASE WHEN rol = 'admin' THEN 1 END) as admins
      FROM usuarios WHERE activo = 1
    `);

    // Estadísticas de cervezas
    const [cervezasStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_cervezas,
        COUNT(CASE WHEN activa = 1 THEN 1 END) as cervezas_activas,
        SUM(stock_disponible) as stock_total,
        AVG(precio) as precio_promedio
      FROM cervezas
    `);

    // Estadísticas de pedidos
    const [pedidosStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_pedidos,
        COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as pedidos_pendientes,
        COUNT(CASE WHEN estado = 'entregado' THEN 1 END) as pedidos_entregados,
        SUM(total) as ventas_totales,
        AVG(total) as ticket_promedio
      FROM pedidos
    `);

    // Ventas por mes (últimos 6 meses)
    const [ventasMensuales] = await pool.execute(`
      SELECT 
        DATE_FORMAT(fecha_pedido, '%Y-%m') as mes,
        COUNT(*) as pedidos,
        SUM(total) as ventas
      FROM pedidos 
      WHERE fecha_pedido >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(fecha_pedido, '%Y-%m')
      ORDER BY mes DESC
    `);

    res.json({
      usuarios: usuariosStats[0],
      cervezas: cervezasStats[0],
      pedidos: pedidosStats[0],
      ventas_mensuales: ventasMensuales
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// CRUD de cervezas para admin
app.get('/api/admin/cervezas', authenticateToken, requireAdminOrVendor, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT c.*, cat.nombre as categoria_nombre 
      FROM cervezas c 
      LEFT JOIN categorias cat ON c.categoria_id = cat.id 
      ORDER BY c.nombre
    `);
    // Normalizar URLs de imágenes antes de enviar
    const normalizedRows = rows.map(cerveza => ({
      ...cerveza,
      imagen_url: normalizeImageUrl(cerveza.imagen_url)
    }));
    res.json(normalizedRows);
  } catch (error) {
    console.error('Error al obtener cervezas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear nueva cerveza
app.post('/api/admin/cervezas', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      nombre,
      estilo,
      descripcion,
      precio,
      puntos_ganados,
      imagen_url,
      categoria_id,
      stock_disponible
    } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO cervezas (nombre, estilo, descripcion, precio, puntos_ganados, imagen_url, categoria_id, stock_disponible) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, estilo, descripcion, precio, puntos_ganados || 0, imagen_url, categoria_id, stock_disponible || 0]
    );

    const [newBeer] = await pool.execute('SELECT * FROM cervezas WHERE id = ?', [result.insertId]);
    res.status(201).json(newBeer[0]);
  } catch (error) {
    console.error('Error al crear cerveza:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar cerveza
app.put('/api/admin/cervezas/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const allowedFields = ['nombre', 'estilo', 'descripcion', 'precio', 'puntos_ganados', 'imagen_url', 'categoria_id', 'stock_disponible', 'activa'];
    const updates = [];
    const values = [];

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(updateData[field]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos válidos para actualizar' });
    }

    values.push(id);

    await pool.execute(
      `UPDATE cervezas SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const [updatedBeer] = await pool.execute('SELECT * FROM cervezas WHERE id = ?', [id]);
    res.json(updatedBeer[0]);
  } catch (error) {
    console.error('Error al actualizar cerveza:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar cerveza
app.delete('/api/admin/cervezas/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si hay pedidos con esta cerveza
    const [pedidos] = await pool.execute(
      'SELECT COUNT(*) as count FROM pedido_items WHERE cerveza_id = ?',
      [id]
    );

    if (pedidos[0].count > 0) {
      return res.status(400).json({ error: 'No se puede eliminar la cerveza porque tiene pedidos asociados' });
    }

    await pool.execute('DELETE FROM cervezas WHERE id = ?', [id]);
    res.status(204).send();
  } catch (error) {
    console.error('Error al eliminar cerveza:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Gestión de pedidos para admin
app.get('/api/admin/pedidos', authenticateToken, requireAdminOrVendor, async (req, res) => {
  try {
    const { estado, limit = 50, offset = 0 } = req.query;

    const limitNum = Math.max(0, parseInt(String(limit), 10) || 50);
    const offsetNum = Math.max(0, parseInt(String(offset), 10) || 0);

    let query = `
      SELECT p.*, u.nombre_completo, u.email, u.telefono
      FROM pedidos p
      LEFT JOIN usuarios u ON p.usuario_id = u.id
    `;

    const params = [];
    if (estado) {
      query += ' WHERE p.estado = ?';
      params.push(estado);
    }

    query += ` ORDER BY p.fecha_pedido DESC LIMIT ${limitNum} OFFSET ${offsetNum}`;

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar estado de pedido
app.put('/api/admin/pedidos/:id/estado', authenticateToken, requireAdminOrVendor, async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const validStates = ['pendiente', 'confirmado', 'en_preparacion', 'enviado', 'entregado', 'cancelado'];
    if (!validStates.includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    await pool.execute(
      'UPDATE pedidos SET estado = ? WHERE id = ?',
      [estado, id]
    );

    const [updatedOrder] = await pool.execute('SELECT * FROM pedidos WHERE id = ?', [id]);
    res.json(updatedOrder[0]);
  } catch (error) {
    console.error('Error al actualizar estado del pedido:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Gestión de usuarios para admin
app.get('/api/admin/usuarios', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { rol, limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT id, nombre_completo, email, telefono, rol, activo, fecha_registro FROM usuarios';
    const params = [];
    
    if (rol) {
      query += ' WHERE rol = ?';
      params.push(rol);
    }
    
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar rol de usuario
app.put('/api/admin/usuarios/:id/rol', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { rol } = req.body;

    const validRoles = ['cliente', 'vendedor', 'admin'];
    if (!validRoles.includes(rol)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    await pool.execute(
      'UPDATE usuarios SET rol = ? WHERE id = ?',
      [rol, id]
    );

    const [updatedUser] = await pool.execute('SELECT id, nombre_completo, email, rol FROM usuarios WHERE id = ?', [id]);
    res.json(updatedUser[0]);
  } catch (error) {
    console.error('Error al actualizar rol:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ========== REPORTES AVANZADOS ==========

// Reportes de ventas por período
app.get('/api/admin/reportes/ventas', authenticateToken, requireAdminOrVendor, async (req, res) => {
  try {
    const { periodo = 'mes', fecha_inicio, fecha_fin } = req.query;
    
    let fechaCondicion = '';
    let params = [];
    
    if (fecha_inicio && fecha_fin) {
      fechaCondicion = 'AND p.fecha_pedido BETWEEN ? AND ?';
      params = [fecha_inicio, fecha_fin];
    } else {
      // Por defecto, últimos 30 días
      fechaCondicion = 'AND p.fecha_pedido >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
    }

    // Ventas totales por período
    const [ventasTotales] = await pool.execute(`
      SELECT 
        SUM(p.total) as ventas_totales,
        COUNT(p.id) as total_pedidos,
        AVG(p.total) as ticket_promedio,
        COUNT(DISTINCT p.usuario_id) as clientes_unicos
      FROM pedidos p 
      WHERE p.estado != 'cancelado' 
      ${fechaCondicion}
    `, params);

    // Ventas por día/semana/mes
    const [ventasPeriodo] = await pool.execute(`
      SELECT 
        DATE(p.fecha_pedido) as fecha,
        SUM(p.total) as ventas,
        COUNT(p.id) as pedidos
      FROM pedidos p 
      WHERE p.estado != 'cancelado' 
      ${fechaCondicion}
      GROUP BY DATE(p.fecha_pedido)
      ORDER BY fecha DESC
      LIMIT 30
    `, params);

    // Productos más vendidos
    const [productosVendidos] = await pool.execute(`
      SELECT 
        c.nombre,
        c.imagen_url,
        SUM(dp.cantidad) as cantidad_vendida,
        SUM(dp.cantidad * dp.precio_unitario) as ingresos,
        COUNT(DISTINCT dp.pedido_id) as veces_pedido
      FROM pedido_items dp
      JOIN cervezas c ON dp.cerveza_id = c.id
      JOIN pedidos p ON dp.pedido_id = p.id
      WHERE p.estado != 'cancelado' 
      ${fechaCondicion}
      GROUP BY c.id, c.nombre, c.imagen_url
      ORDER BY cantidad_vendida DESC
      LIMIT 10
    `, params);

    // Clientes más activos
    const [clientesActivos] = await pool.execute(`
      SELECT 
        u.nombre_completo,
        u.email,
        COUNT(p.id) as total_pedidos,
        SUM(p.total) as total_gastado,
        AVG(p.total) as ticket_promedio
      FROM usuarios u
      JOIN pedidos p ON u.id = p.usuario_id
      WHERE p.estado != 'cancelado' 
      ${fechaCondicion}
      GROUP BY u.id, u.nombre_completo, u.email
      ORDER BY total_gastado DESC
      LIMIT 10
    `, params);

    res.json({
      ventas_totales: ventasTotales[0],
      ventas_por_periodo: ventasPeriodo,
      productos_mas_vendidos: productosVendidos,
      clientes_mas_activos: clientesActivos
    });
  } catch (error) {
    console.error('Error al generar reportes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Corte diario de ventas
app.get('/api/admin/corte-diario', authenticateToken, requireAdminOrVendor, async (req, res) => {
  try {
    const { fecha } = req.query;
    // Si no se proporciona fecha, usar la fecha actual
    let fechaCorte;
    if (fecha) {
      // Validar formato de fecha (YYYY-MM-DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        return res.status(400).json({ error: 'Formato de fecha inválido. Use YYYY-MM-DD' });
      }
      fechaCorte = new Date(fecha + 'T00:00:00');
    } else {
      fechaCorte = new Date();
    }
    
    // Asegurar que la fecha sea válida
    if (isNaN(fechaCorte.getTime())) {
      return res.status(400).json({ error: 'Fecha inválida' });
    }
    
    const fechaInicio = new Date(fechaCorte);
    fechaInicio.setHours(0, 0, 0, 0);
    const fechaFin = new Date(fechaCorte);
    fechaFin.setHours(23, 59, 59, 999);
    
    // Formatear fechas para MySQL (YYYY-MM-DD HH:MM:SS)
    // Ajustar a zona horaria local para evitar problemas
    const fechaInicioStr = fechaInicio.toISOString().slice(0, 19).replace('T', ' ');
    const fechaFinStr = fechaFin.toISOString().slice(0, 19).replace('T', ' ');

    console.log('📅 Fechas de corte:', { fechaInicioStr, fechaFinStr, fecha });

    // Resumen general del día
    let resumenDia;
    try {
      [resumenDia] = await pool.execute(`
        SELECT 
          COUNT(*) as total_pedidos,
          COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as pedidos_pendientes,
          COUNT(CASE WHEN estado = 'confirmado' THEN 1 END) as pedidos_confirmados,
          COUNT(CASE WHEN estado = 'en_preparacion' THEN 1 END) as pedidos_en_preparacion,
          COUNT(CASE WHEN estado = 'enviado' THEN 1 END) as pedidos_enviados,
          COUNT(CASE WHEN estado = 'entregado' THEN 1 END) as pedidos_entregados,
          COUNT(CASE WHEN estado = 'cancelado' THEN 1 END) as pedidos_cancelados,
          COALESCE(SUM(CASE WHEN estado != 'cancelado' THEN total ELSE 0 END), 0) as ventas_totales,
          COALESCE(SUM(CASE WHEN estado = 'cancelado' THEN total ELSE 0 END), 0) as ventas_canceladas,
          COALESCE(AVG(CASE WHEN estado != 'cancelado' THEN total ELSE NULL END), 0) as ticket_promedio,
          COUNT(DISTINCT usuario_id) as clientes_unicos
        FROM pedidos 
        WHERE DATE(fecha_pedido) = DATE(?)
      `, [fechaInicioStr]);
      console.log('✅ Resumen del día obtenido:', resumenDia[0]);
    } catch (error) {
      console.error('❌ Error en resumen del día:', error);
      throw error;
    }

    // Ventas por hora del día
    let ventasPorHora;
    try {
      [ventasPorHora] = await pool.execute(`
        SELECT 
          HOUR(fecha_pedido) as hora,
          COUNT(*) as pedidos,
          COALESCE(SUM(CASE WHEN estado != 'cancelado' THEN total ELSE 0 END), 0) as ventas
        FROM pedidos 
        WHERE DATE(fecha_pedido) = DATE(?)
        GROUP BY HOUR(fecha_pedido)
        ORDER BY hora ASC
      `, [fechaInicioStr]);
      console.log('✅ Ventas por hora obtenidas:', ventasPorHora.length);
    } catch (error) {
      console.error('❌ Error en ventas por hora:', error);
      ventasPorHora = [];
    }

    // Productos vendidos durante el día
    let productosVendidos;
    try {
      [productosVendidos] = await pool.execute(`
        SELECT 
          c.id,
          c.nombre,
          c.estilo,
          c.imagen_url,
          COALESCE(SUM(dp.cantidad), 0) as cantidad_vendida,
          COALESCE(SUM(dp.cantidad * dp.precio_unitario), 0) as ingresos,
          COUNT(DISTINCT dp.pedido_id) as veces_pedido
        FROM pedido_items dp
        JOIN cervezas c ON dp.cerveza_id = c.id
        JOIN pedidos p ON dp.pedido_id = p.id
        WHERE DATE(p.fecha_pedido) = DATE(?)
          AND p.estado != 'cancelado'
        GROUP BY c.id, c.nombre, c.estilo, c.imagen_url
        ORDER BY cantidad_vendida DESC
      `, [fechaInicioStr]);
      console.log('✅ Productos vendidos obtenidos:', productosVendidos.length);
    } catch (error) {
      console.error('❌ Error en productos vendidos:', error);
      productosVendidos = [];
    }

    // Pedidos del día con detalles
    let pedidosDia;
    try {
      // Verificar si la columna metodo_pago existe
      const [columns] = await pool.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'pedidos' 
        AND COLUMN_NAME = 'metodo_pago'
      `);
      
      const tieneMetodoPago = columns.length > 0;
      const metodoPagoField = tieneMetodoPago ? 'p.metodo_pago' : "'tarjeta' as metodo_pago";
      
      [pedidosDia] = await pool.execute(`
        SELECT 
          p.id,
          p.fecha_pedido,
          p.total,
          p.estado,
          ${metodoPagoField},
          u.nombre_completo,
          u.email,
          (
            SELECT COUNT(*) 
            FROM pedido_items pi 
            WHERE pi.pedido_id = p.id
          ) as items_count
        FROM pedidos p
        JOIN usuarios u ON p.usuario_id = u.id
        WHERE DATE(p.fecha_pedido) = DATE(?)
        ORDER BY p.fecha_pedido DESC
      `, [fechaInicioStr]);
      console.log('✅ Pedidos del día obtenidos:', pedidosDia.length);
    } catch (error) {
      console.error('❌ Error en pedidos del día:', error);
      pedidosDia = [];
    }

    // Métodos de pago utilizados
    let metodosPago;
    try {
      // Verificar si la columna metodo_pago existe
      const [columns] = await pool.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'pedidos' 
        AND COLUMN_NAME = 'metodo_pago'
      `);
      
      if (columns.length > 0) {
        // La columna existe, usar consulta normal
        [metodosPago] = await pool.execute(`
          SELECT 
            COALESCE(metodo_pago, 'tarjeta') as metodo_pago,
            COUNT(*) as cantidad,
            COALESCE(SUM(CASE WHEN estado != 'cancelado' THEN total ELSE 0 END), 0) as total
          FROM pedidos 
          WHERE DATE(fecha_pedido) = DATE(?)
          GROUP BY COALESCE(metodo_pago, 'tarjeta')
          ORDER BY total DESC
        `, [fechaInicioStr]);
      } else {
        // La columna no existe, retornar datos por defecto
        const [totalPedidos] = await pool.execute(`
          SELECT 
            COUNT(*) as cantidad,
            COALESCE(SUM(CASE WHEN estado != 'cancelado' THEN total ELSE 0 END), 0) as total
          FROM pedidos 
          WHERE DATE(fecha_pedido) = DATE(?)
        `, [fechaInicioStr]);
        
        metodosPago = [{
          metodo_pago: 'tarjeta',
          cantidad: totalPedidos[0]?.cantidad || 0,
          total: totalPedidos[0]?.total || 0
        }];
      }
      console.log('✅ Métodos de pago obtenidos:', metodosPago.length);
    } catch (error) {
      console.error('❌ Error en métodos de pago:', error);
      metodosPago = [];
    }

    res.json({
      fecha: fechaCorte.toISOString().split('T')[0],
      resumen: resumenDia[0] || {},
      ventas_por_hora: ventasPorHora,
      productos_vendidos: productosVendidos,
      pedidos: pedidosDia,
      metodos_pago: metodosPago
    });
  } catch (error) {
    console.error('Error al obtener corte diario:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Analytics avanzados
app.get('/api/admin/analytics', authenticateToken, requireAdminOrVendor, async (req, res) => {
  try {
    // Métricas de rendimiento
    const [metricas] = await pool.execute(`
      SELECT 
        -- Conversión
        CASE
          WHEN (SELECT COUNT(*) FROM usuarios WHERE rol = 'cliente') = 0 THEN 0
          ELSE (SELECT COUNT(*) FROM pedidos WHERE estado != 'cancelado') / 
               (SELECT COUNT(*) FROM usuarios WHERE rol = 'cliente') * 100 
        END as tasa_conversion,
        
        -- Retención de clientes
        (SELECT COUNT(DISTINCT usuario_id) FROM pedidos 
         WHERE fecha_pedido >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as clientes_activos_30d,
        
        -- Valor promedio del cliente
        AVG(total) as valor_promedio_cliente,
        
        -- Tiempo promedio entre pedidos (simplificado)
        (SELECT AVG(DATEDIFF(p2.fecha_pedido, p1.fecha_pedido))
         FROM pedidos p1
         JOIN pedidos p2 ON p1.usuario_id = p2.usuario_id 
           AND p2.fecha_pedido > p1.fecha_pedido
         WHERE p1.estado != 'cancelado' AND p2.estado != 'cancelado'
         LIMIT 1000) as dias_promedio_entre_pedidos
      FROM pedidos 
      WHERE estado != 'cancelado'
    `);

    // Tendencias de ventas
    const [tendencias] = await pool.execute(`
      SELECT 
        DATE_FORMAT(fecha_pedido, '%Y-%m') as mes,
        SUM(total) as ventas,
        COUNT(*) as pedidos,
        COUNT(DISTINCT usuario_id) as clientes_unicos
      FROM pedidos 
      WHERE estado != 'cancelado' 
        AND fecha_pedido >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(fecha_pedido, '%Y-%m')
      ORDER BY mes DESC
    `);

    // Análisis de categorías
    const [categoriasAnalisis] = await pool.execute(`
      SELECT 
        cat.nombre as categoria,
        COUNT(DISTINCT c.id) as cervezas_activas,
        SUM(dp.cantidad) as unidades_vendidas,
        SUM(dp.cantidad * dp.precio_unitario) as ingresos_categoria,
        AVG(dp.precio_unitario) as precio_promedio
      FROM categorias cat
      LEFT JOIN cervezas c ON cat.id = c.categoria_id
      LEFT JOIN pedido_items dp ON c.id = dp.cerveza_id
      LEFT JOIN pedidos p ON dp.pedido_id = p.id AND p.estado != 'cancelado'
      GROUP BY cat.id, cat.nombre
      ORDER BY ingresos_categoria DESC
    `);

    // Predicción de demanda (simple)
    const [prediccionDemanda] = await pool.execute(`
      SELECT 
        c.nombre,
        c.stock_disponible,
        AVG(dp.cantidad) as demanda_promedio_diaria,
        c.stock_disponible / GREATEST(AVG(dp.cantidad), 1) as dias_restantes_stock,
        CASE 
          WHEN c.stock_disponible / GREATEST(AVG(dp.cantidad), 1) < 7 THEN 'CRÍTICO'
          WHEN c.stock_disponible / GREATEST(AVG(dp.cantidad), 1) < 14 THEN 'BAJO'
          ELSE 'NORMAL'
        END as estado_stock
      FROM cervezas c
      LEFT JOIN pedido_items dp ON c.id = dp.cerveza_id
      LEFT JOIN pedidos p ON dp.pedido_id = p.id 
        AND p.estado != 'cancelado' 
        AND p.fecha_pedido >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      WHERE c.activa = 1
      GROUP BY c.id, c.nombre, c.stock_disponible
      ORDER BY dias_restantes_stock ASC
    `);

    res.json({
      metricas_rendimiento: metricas[0],
      tendencias_ventas: tendencias,
      analisis_categorias: categoriasAnalisis,
      prediccion_demanda: prediccionDemanda
    });
  } catch (error) {
    console.error('Error en analytics:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ========== SISTEMA DE NOTIFICACIONES ==========

// Crear tabla de notificaciones si no existe
app.get('/api/admin/setup-notifications', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS notificaciones (
        id INT PRIMARY KEY AUTO_INCREMENT,
        usuario_id INT,
        tipo ENUM('stock_bajo', 'nuevo_pedido', 'recordatorio', 'sistema') NOT NULL,
        titulo VARCHAR(255) NOT NULL,
        mensaje TEXT NOT NULL,
        leida BOOLEAN DEFAULT FALSE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_lectura TIMESTAMP NULL,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      )
    `);

    res.json({ message: 'Sistema de notificaciones configurado' });
  } catch (error) {
    console.error('Error al configurar notificaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener notificaciones
app.get('/api/admin/notificaciones', authenticateToken, requireAdminOrVendor, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;
    const limitNum = parseInt(limit) || 20;
    const offsetNum = parseInt(offset) || 0;
    
    // Primero asegurar que la tabla existe
    try {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS notificaciones (
          id INT PRIMARY KEY AUTO_INCREMENT,
          usuario_id INT,
          tipo ENUM('stock_bajo', 'nuevo_pedido', 'recordatorio', 'sistema') NOT NULL,
          titulo VARCHAR(255) NOT NULL,
          mensaje TEXT NOT NULL,
          leida BOOLEAN DEFAULT FALSE,
          fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          fecha_lectura TIMESTAMP NULL,
          INDEX idx_usuario_id (usuario_id)
        )
      `);
    } catch (createError) {
      console.warn('Advertencia al crear tabla notificaciones:', createError.message);
      // Continuar aunque falle la creación
    }
    
    // Consulta simplificada
    let notificaciones = [];
    try {
      [notificaciones] = await pool.execute(
        'SELECT * FROM notificaciones WHERE usuario_id = ? OR usuario_id IS NULL ORDER BY fecha_creacion DESC',
        [userId]
      );
      
      // Aplicar límite y offset manualmente
      if (notificaciones && Array.isArray(notificaciones)) {
        notificaciones = notificaciones.slice(offsetNum, offsetNum + limitNum);
      }
    } catch (queryError) {
      console.error('Error en consulta de notificaciones:', queryError.message);
      console.error('Código de error:', queryError.code);
      console.error('SQL State:', queryError.sqlState);
      
      // Si la tabla no existe, devolver array vacío
      if (queryError.code === 'ER_NO_SUCH_TABLE' || queryError.code === '42S02') {
        console.warn('Tabla notificaciones no existe, devolviendo array vacío');
        return res.json([]);
      }
      
      // Para otros errores, lanzar excepción
      throw queryError;
    }

    res.json(notificaciones || []);
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    console.error('Mensaje:', error.message);
    console.error('Stack:', error.stack);
    if (error.code) {
      console.error('Código MySQL:', error.code);
    }
    if (error.sqlState) {
      console.error('Estado SQL:', error.sqlState);
    }
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Marcar notificación como leída
app.put('/api/admin/notificaciones/:id/leer', authenticateToken, requireAdminOrVendor, async (req, res) => {
  try {
    await pool.execute(`
      UPDATE notificaciones 
      SET leida = TRUE, fecha_lectura = NOW() 
      WHERE id = ? AND (usuario_id = ? OR usuario_id IS NULL)
    `, [req.params.id, req.user.id]);

    res.json({ message: 'Notificación marcada como leída' });
  } catch (error) {
    console.error('Error al marcar notificación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear notificación
app.post('/api/admin/notificaciones', authenticateToken, requireAdminOrVendor, async (req, res) => {
  try {
    const { tipo, titulo, mensaje, usuario_id } = req.body;
    
    const [result] = await pool.execute(`
      INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje)
      VALUES (?, ?, ?, ?)
    `, [usuario_id || null, tipo, titulo, mensaje]);

    res.json({ 
      message: 'Notificación creada',
      id: result.insertId 
    });
  } catch (error) {
    console.error('Error al crear notificación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ========== GESTIÓN DE DESCUENTOS ==========

// Crear tabla de descuentos si no existe
app.get('/api/admin/setup-discounts', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS descuentos (
        id INT PRIMARY KEY AUTO_INCREMENT,
        codigo VARCHAR(50) UNIQUE NOT NULL,
        tipo ENUM('porcentaje', 'cantidad_fija') NOT NULL,
        valor DECIMAL(10,2) NOT NULL,
        descripcion TEXT,
        fecha_inicio DATETIME NOT NULL,
        fecha_fin DATETIME NOT NULL,
        uso_maximo INT DEFAULT NULL,
        uso_actual INT DEFAULT 0,
        activo BOOLEAN DEFAULT TRUE,
        aplicable_a ENUM('todos', 'categoria', 'producto') DEFAULT 'todos',
        categoria_id INT NULL,
        producto_id INT NULL,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (categoria_id) REFERENCES categorias(id),
        FOREIGN KEY (producto_id) REFERENCES cervezas(id)
      )
    `);

    res.json({ message: 'Sistema de descuentos configurado' });
  } catch (error) {
    console.error('Error al configurar descuentos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener descuentos
app.get('/api/admin/descuentos', authenticateToken, requireAdminOrVendor, async (req, res) => {
  try {
    const [descuentos] = await pool.execute(`
      SELECT d.*, 
        c.nombre as categoria_nombre,
        cer.nombre as producto_nombre
      FROM descuentos d
      LEFT JOIN categorias c ON d.categoria_id = c.id
      LEFT JOIN cervezas cer ON d.producto_id = cer.id
      ORDER BY d.fecha_creacion DESC
    `);

    res.json(descuentos);
  } catch (error) {
    console.error('Error al obtener descuentos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear descuento
app.post('/api/admin/descuentos', authenticateToken, requireAdminOrVendor, async (req, res) => {
  try {
    const { 
      codigo, tipo, valor, descripcion, 
      fecha_inicio, fecha_fin, uso_maximo,
      aplicable_a, categoria_id, producto_id 
    } = req.body;

    const [result] = await pool.execute(`
      INSERT INTO descuentos (
        codigo, tipo, valor, descripcion, fecha_inicio, fecha_fin,
        uso_maximo, aplicable_a, categoria_id, producto_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [codigo, tipo, valor, descripcion, fecha_inicio, fecha_fin, 
        uso_maximo, aplicable_a, categoria_id, producto_id]);

    res.json({ 
      message: 'Descuento creado exitosamente',
      id: result.insertId 
    });
  } catch (error) {
    console.error('Error al crear descuento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint temporal para crear usuarios de admin (SOLO PARA DESARROLLO)
app.post('/api/admin/create-admin-users', async (req, res) => {
  try {
    // Solo permitir en desarrollo
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'No disponible en producción' });
    }

    // Agregar columna de rol si no existe
    await pool.execute(`
      ALTER TABLE usuarios 
      ADD COLUMN IF NOT EXISTS rol ENUM('cliente', 'vendedor', 'admin') DEFAULT 'cliente'
    `);

    // Crear usuario admin
    await pool.execute(`
      INSERT IGNORE INTO usuarios (
        nombre_completo, email, password_hash, telefono, direccion, 
        fecha_nacimiento, tipo_identificacion, numero_identificacion, 
        confirmo_mayor_edad, acepto_terminos, rol
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'Administrador Sistema', 
      'admin@cervezapremium.com', 
      '$2b$10$IvP0HqweQ5Yam7kV9XqeOO5DjMBTBEUdQeLLM2Kz4MeCQwgwPiXza', // password: 1234
      '+52 555 000 0000', 
      'Oficina Principal', 
      '1990-01-01', 
      'INE', 
      'ADMIN001', 
      true, 
      true,
      'admin'
    ]);

    // Crear usuario vendedor
    await pool.execute(`
      INSERT IGNORE INTO usuarios (
        nombre_completo, email, password_hash, telefono, direccion, 
        fecha_nacimiento, tipo_identificacion, numero_identificacion, 
        confirmo_mayor_edad, acepto_terminos, rol
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'Vendedor Principal', 
      'vendedor@cervezapremium.com', 
      '$2b$10$IvP0HqweQ5Yam7kV9XqeOO5DjMBTBEUdQeLLM2Kz4MeCQwgwPiXza', // password: 1234
      '+52 555 000 0001', 
      'Oficina Ventas', 
      '1990-01-01', 
      'INE', 
      'VEND001', 
      true, 
      true,
      'vendedor'
    ]);

    // Actualizar usuarios existentes
    await pool.execute(`UPDATE usuarios SET rol = 'cliente' WHERE rol IS NULL OR rol = ''`);

    // Verificar usuarios creados
    const [usuarios] = await pool.execute(`
      SELECT id, nombre_completo, email, rol 
      FROM usuarios 
      WHERE email IN ('admin@cervezapremium.com', 'vendedor@cervezapremium.com')
    `);

    res.json({
      message: 'Usuarios de admin creados exitosamente',
      usuarios: usuarios
    });
  } catch (error) {
    console.error('Error al crear usuarios de admin:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ========== RUTAS DE REPARTIDORES Y TRACKING ==========

// Obtener todos los repartidores (admin)
app.get('/api/admin/repartidores', authenticateToken, requireAdminOrVendor, async (req, res) => {
  try {
    const [repartidores] = await pool.execute(`
      SELECT 
        r.*,
        (SELECT COUNT(*) FROM pedidos WHERE repartidor_id = r.id AND estado IN ('enviado', 'en_preparacion')) as pedidos_activos,
        (SELECT latitud, longitud, fecha_ubicacion 
         FROM repartidor_ubicaciones 
         WHERE repartidor_id = r.id 
         ORDER BY fecha_ubicacion DESC 
         LIMIT 1) as ultima_ubicacion
      FROM repartidores r
      WHERE r.activo = 1
      ORDER BY r.nombre_completo
    `);
    res.json(repartidores);
  } catch (error) {
    console.error('Error al obtener repartidores:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear nuevo repartidor (admin)
app.post('/api/admin/repartidores', authenticateToken, requireAdminOrVendor, async (req, res) => {
  try {
    const { nombre_completo, telefono, email, vehiculo, placa } = req.body;
    
    if (!nombre_completo || !telefono) {
      return res.status(400).json({ error: 'Nombre completo y teléfono son requeridos' });
    }
    
    const [result] = await pool.execute(`
      INSERT INTO repartidores (nombre_completo, telefono, email, vehiculo, placa, activo)
      VALUES (?, ?, ?, ?, ?, TRUE)
    `, [
      nombre_completo,
      telefono,
      email || null,
      vehiculo || 'Moto',
      placa || null
    ]);
    
    const [newRepartidor] = await pool.execute(`
      SELECT * FROM repartidores WHERE id = ?
    `, [result.insertId]);
    
    res.status(201).json(newRepartidor[0]);
  } catch (error) {
    console.error('Error al crear repartidor:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Ya existe un repartidor con ese email' });
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
});

// Actualizar repartidor (admin)
app.put('/api/admin/repartidores/:id', authenticateToken, requireAdminOrVendor, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_completo, telefono, email, vehiculo, placa, activo } = req.body;
    
    const updates = [];
    const values = [];
    
    if (nombre_completo !== undefined) {
      updates.push('nombre_completo = ?');
      values.push(nombre_completo);
    }
    if (telefono !== undefined) {
      updates.push('telefono = ?');
      values.push(telefono);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email);
    }
    if (vehiculo !== undefined) {
      updates.push('vehiculo = ?');
      values.push(vehiculo);
    }
    if (placa !== undefined) {
      updates.push('placa = ?');
      values.push(placa);
    }
    if (activo !== undefined) {
      updates.push('activo = ?');
      values.push(activo);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }
    
    values.push(id);
    
    await pool.execute(`
      UPDATE repartidores 
      SET ${updates.join(', ')}
      WHERE id = ?
    `, values);
    
    const [updated] = await pool.execute(`
      SELECT * FROM repartidores WHERE id = ?
    `, [id]);
    
    res.json(updated[0]);
  } catch (error) {
    console.error('Error al actualizar repartidor:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar repartidor (admin) - solo desactiva
app.delete('/api/admin/repartidores/:id', authenticateToken, requireAdminOrVendor, async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.execute(`
      UPDATE repartidores SET activo = FALSE WHERE id = ?
    `, [id]);
    
    res.json({ message: 'Repartidor desactivado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar repartidor:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener última ubicación de un repartidor
app.get('/api/repartidores/:id/ubicacion', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [ubicaciones] = await pool.execute(`
      SELECT latitud, longitud, velocidad, direccion, fecha_ubicacion
      FROM repartidor_ubicaciones
      WHERE repartidor_id = ?
      ORDER BY fecha_ubicacion DESC
      LIMIT 1
    `, [id]);
    
    if (ubicaciones.length === 0) {
      return res.status(404).json({ error: 'No se encontró ubicación para este repartidor' });
    }
    
    res.json(ubicaciones[0]);
  } catch (error) {
    console.error('Error al obtener ubicación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar ubicación de un repartidor
app.post('/api/repartidores/:id/ubicacion', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { latitud, longitud, velocidad, direccion } = req.body;
    
    if (!latitud || !longitud) {
      return res.status(400).json({ error: 'Latitud y longitud son requeridas' });
    }
    
    await pool.execute(`
      INSERT INTO repartidor_ubicaciones (repartidor_id, latitud, longitud, velocidad, direccion)
      VALUES (?, ?, ?, ?, ?)
    `, [id, latitud, longitud, velocidad || 0, direccion || null]);
    
    // Actualizar última actividad del repartidor
    await pool.execute(`
      UPDATE repartidores SET ultima_actividad = NOW() WHERE id = ?
    `, [id]);
    
    res.json({ message: 'Ubicación actualizada exitosamente' });
  } catch (error) {
    console.error('Error al actualizar ubicación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener información del repartidor asignado a un pedido (cliente)
app.get('/api/pedidos/:id/repartidor', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Verificar que el pedido pertenece al usuario
    const [pedidos] = await pool.execute(`
      SELECT usuario_id, repartidor_id FROM pedidos WHERE id = ?
    `, [id]);
    
    if (pedidos.length === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    
    if (pedidos[0].usuario_id !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para ver este pedido' });
    }
    
    if (!pedidos[0].repartidor_id) {
      return res.status(404).json({ error: 'No hay repartidor asignado a este pedido' });
    }
    
    // Obtener información del repartidor y su última ubicación
    const [repartidores] = await pool.execute(`
      SELECT 
        r.id,
        r.nombre_completo,
        r.telefono,
        r.vehiculo,
        r.placa,
        u.latitud,
        u.longitud,
        u.velocidad,
        u.direccion,
        u.fecha_ubicacion
      FROM repartidores r
      LEFT JOIN (
        SELECT repartidor_id, latitud, longitud, velocidad, direccion, fecha_ubicacion
        FROM repartidor_ubicaciones
        WHERE repartidor_id = ?
        ORDER BY fecha_ubicacion DESC
        LIMIT 1
      ) u ON r.id = u.repartidor_id
      WHERE r.id = ?
    `, [pedidos[0].repartidor_id, pedidos[0].repartidor_id]);
    
    if (repartidores.length === 0) {
      return res.status(404).json({ error: 'Repartidor no encontrado' });
    }
    
    res.json(repartidores[0]);
  } catch (error) {
    console.error('Error al obtener repartidor del pedido:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener todas las rutas de todos los repartidores (admin)
app.get('/api/admin/repartidores/rutas', authenticateToken, requireAdminOrVendor, async (req, res) => {
  try {
    const { horas = 24 } = req.query; // Últimas N horas por defecto
    const horasNum = parseInt(horas) || 24;
    
    // Verificar si las tablas existen
    try {
      const [tables] = await pool.execute(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME IN ('repartidores', 'repartidor_ubicaciones')
      `);
      
      if (tables.length < 2) {
        return res.status(503).json({ 
          error: 'Las tablas de repartidores no están configuradas',
          message: 'Por favor ejecuta el script SQL: database/add-repartidores-tracking.sql'
        });
      }
    } catch (tableCheckError) {
      console.error('Error al verificar tablas:', tableCheckError);
      return res.status(503).json({ 
        error: 'Error al verificar tablas de repartidores',
        message: 'Por favor ejecuta el script SQL: database/add-repartidores-tracking.sql'
      });
    }
    
    // Verificar si existe la columna repartidor_id en pedidos
    let tieneRepartidorId = false;
    try {
      const [columns] = await pool.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'pedidos' 
        AND COLUMN_NAME = 'repartidor_id'
      `);
      tieneRepartidorId = columns.length > 0;
    } catch (err) {
      console.warn('No se pudo verificar columna repartidor_id, continuando sin ella');
    }
    
    let query = `
      SELECT 
        r.id as repartidor_id,
        r.nombre_completo,
        r.telefono,
        r.vehiculo,
        r.placa,
        u.latitud,
        u.longitud,
        u.velocidad,
        u.direccion,
        u.fecha_ubicacion
    `;
    
    if (tieneRepartidorId) {
      query += `,
        (SELECT COUNT(*) FROM pedidos WHERE repartidor_id = r.id AND estado IN ('enviado', 'en_preparacion')) as pedidos_activos`;
    } else {
      query += `,
        0 as pedidos_activos`;
    }
    
    query += `
      FROM repartidores r
      LEFT JOIN repartidor_ubicaciones u ON r.id = u.repartidor_id
      WHERE r.activo = 1
        AND (u.fecha_ubicacion IS NULL OR u.fecha_ubicacion >= DATE_SUB(NOW(), INTERVAL ? HOUR))
      ORDER BY r.nombre_completo, u.fecha_ubicacion DESC
    `;
    
    const [rutas] = await pool.execute(query, [horasNum]);
    
    // Agrupar por repartidor
    const rutasAgrupadas = {};
    rutas.forEach((ruta) => {
      if (!rutasAgrupadas[ruta.repartidor_id]) {
        rutasAgrupadas[ruta.repartidor_id] = {
          repartidor: {
            id: ruta.repartidor_id,
            nombre_completo: ruta.nombre_completo,
            telefono: ruta.telefono,
            vehiculo: ruta.vehiculo,
            placa: ruta.placa,
            pedidos_activos: ruta.pedidos_activos || 0
          },
          ubicaciones: []
        };
      }
      if (ruta.latitud && ruta.longitud) {
        rutasAgrupadas[ruta.repartidor_id].ubicaciones.push({
          latitud: parseFloat(ruta.latitud),
          longitud: parseFloat(ruta.longitud),
          velocidad: ruta.velocidad ? parseFloat(ruta.velocidad) : 0,
          direccion: ruta.direccion || null,
          fecha_ubicacion: ruta.fecha_ubicacion
        });
      }
    });
    
    res.json(Object.values(rutasAgrupadas));
  } catch (error) {
    console.error('Error al obtener rutas de repartidores:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ========== RUTAS DE TIENDAS ==========

// Obtener todas las tiendas disponibles
app.get('/api/tiendas', async (req, res) => {
  try {
    const [tiendas] = await pool.execute(`
      SELECT 
        id,
        nombre,
        direccion,
        ciudad,
        estado,
        codigo_postal,
        telefono,
        email,
        latitud,
        longitud,
        horario_apertura,
        horario_cierre,
        dias_abierto,
        activa
      FROM tiendas
      WHERE activa = 1
      ORDER BY nombre
    `);
    
    res.json(tiendas);
  } catch (error) {
    console.error('Error al obtener tiendas:', error);
    // Si la tabla no existe, retornar array vacío
    if (error.code === 'ER_NO_SUCH_TABLE') {
      res.json([]);
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
});

// Obtener disponibilidad de productos en una tienda específica
app.get('/api/tiendas/:id/inventario', async (req, res) => {
  try {
    const { id } = req.params;
    const { cerveza_ids } = req.query; // IDs separados por comas
    
    let query = `
      SELECT 
        ti.tienda_id,
        ti.cerveza_id,
        ti.stock_disponible,
        c.nombre as cerveza_nombre,
        c.estilo,
        c.imagen_url,
        c.precio
      FROM tienda_inventario ti
      JOIN cervezas c ON ti.cerveza_id = c.id
      WHERE ti.tienda_id = ?
    `;
    
    const params = [id];
    
    if (cerveza_ids) {
      const ids = cerveza_ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      if (ids.length > 0) {
        query += ` AND ti.cerveza_id IN (${ids.map(() => '?').join(',')})`;
        params.push(...ids);
      }
    }
    
    const [inventario] = await pool.execute(query, params);
    
    res.json(inventario);
  } catch (error) {
    console.error('Error al obtener inventario de tienda:', error);
    if (error.code === 'ER_NO_SUCH_TABLE') {
      res.json([]);
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
});

// Obtener tiendas con disponibilidad de productos específicos
app.get('/api/tiendas/disponibles', async (req, res) => {
  try {
    const { cerveza_ids } = req.query; // IDs separados por comas
    
    if (!cerveza_ids) {
      // Si no se especifican productos, retornar todas las tiendas
      const [tiendas] = await pool.execute(`
        SELECT 
          id,
          nombre,
          direccion,
          ciudad,
          estado,
          codigo_postal,
          telefono,
          email,
          latitud,
          longitud,
          horario_apertura,
          horario_cierre,
          dias_abierto,
          activa
        FROM tiendas
        WHERE activa = 1
        ORDER BY nombre
      `);
      return res.json(tiendas);
    }
    
    const ids = cerveza_ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    
    if (ids.length === 0) {
      return res.json([]);
    }
    
    // Obtener tiendas que tengan stock de al menos uno de los productos solicitados
    const [tiendas] = await pool.execute(`
      SELECT DISTINCT
        t.id,
        t.nombre,
        t.direccion,
        t.ciudad,
        t.estado,
        t.codigo_postal,
        t.telefono,
        t.email,
        t.latitud,
        t.longitud,
        t.horario_apertura,
        t.horario_cierre,
        t.dias_abierto,
        t.activa,
        COUNT(DISTINCT ti.cerveza_id) as productos_disponibles,
        SUM(ti.stock_disponible) as stock_total
      FROM tiendas t
      LEFT JOIN tienda_inventario ti ON t.id = ti.tienda_id
      WHERE t.activa = 1
        AND ti.cerveza_id IN (${ids.map(() => '?').join(',')})
        AND ti.stock_disponible > 0
      GROUP BY t.id
      HAVING productos_disponibles > 0
      ORDER BY productos_disponibles DESC, t.nombre
    `, ids);
    
    // Para cada tienda, obtener el inventario detallado
    const tiendasConInventario = await Promise.all(
      tiendas.map(async (tienda) => {
        const [inventario] = await pool.execute(`
          SELECT 
            ti.cerveza_id,
            ti.stock_disponible,
            c.nombre as cerveza_nombre,
            c.estilo,
            c.imagen_url
          FROM tienda_inventario ti
          JOIN cervezas c ON ti.cerveza_id = c.id
          WHERE ti.tienda_id = ?
            AND ti.cerveza_id IN (${ids.map(() => '?').join(',')})
            AND ti.stock_disponible > 0
        `, [tienda.id, ...ids]);
        
        return {
          ...tienda,
          inventario: inventario
        };
      })
    );
    
    res.json(tiendasConInventario);
  } catch (error) {
    console.error('Error al obtener tiendas disponibles:', error);
    if (error.code === 'ER_NO_SUCH_TABLE') {
      res.json([]);
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
});

// Asignar repartidor a un pedido (admin)
app.post('/api/admin/pedidos/:id/asignar-repartidor', authenticateToken, requireAdminOrVendor, async (req, res) => {
  try {
    const { id } = req.params;
    const { repartidor_id } = req.body;
    
    if (!repartidor_id) {
      return res.status(400).json({ error: 'repartidor_id es requerido' });
    }
    
    // Verificar que el repartidor existe y está activo
    const [repartidores] = await pool.execute(`
      SELECT id FROM repartidores WHERE id = ? AND activo = 1
    `, [repartidor_id]);
    
    if (repartidores.length === 0) {
      return res.status(404).json({ error: 'Repartidor no encontrado o inactivo' });
    }
    
    // Actualizar el pedido
    await pool.execute(`
      UPDATE pedidos 
      SET repartidor_id = ?, estado = 'enviado'
      WHERE id = ?
    `, [repartidor_id, id]);
    
    res.json({ message: 'Repartidor asignado exitosamente' });
  } catch (error) {
    console.error('Error al asignar repartidor:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ========== RUTAS DE RESET DE CONTRASEÑA ==========

// Solicitar reset de contraseña
app.post('/api/auth/forgot-password', passwordResetLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    // Verificar si el usuario existe
    const [users] = await pool.execute(
      'SELECT id, nombre_completo FROM usuarios WHERE email = ? AND activo = 1',
      [email]
    );

    // Por seguridad, siempre devolver el mismo mensaje
    const successMessage = 'Si el email existe, recibirás un enlace para restablecer tu contraseña';

    if (users.length === 0) {
      return res.json({ message: successMessage });
    }

    const user = users[0];

    // Generar token de reset seguro (válido por 1 hora)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetExpire = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // Guardar token en base de datos (necesitarás crear esta columna)
    await pool.execute(
      `UPDATE usuarios 
       SET reset_token = ?, reset_token_expire = ? 
       WHERE id = ?`,
      [resetTokenHash, resetExpire, user.id]
    );

    // URL de reset
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // Aquí enviarías un email con el enlace
    // Por ahora, devolvemos el URL en desarrollo
    if (process.env.NODE_ENV === 'development') {
      return res.json({ 
        message: successMessage,
        resetUrl: resetUrl // Solo en desarrollo
      });
    }

    res.json({ message: successMessage });
  } catch (error) {
    console.error('Error en forgot-password:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Restablecer contraseña con token
app.post('/api/auth/reset-password', passwordResetLimiter, async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token y nueva contraseña son requeridos' });
    }

    // Validar contraseña
    if (newPassword.length < 8 || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      return res.status(400).json({ 
        error: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número' 
      });
    }

    // Hash del token para comparar
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Buscar usuario con token válido
    const [users] = await pool.execute(
      `SELECT id FROM usuarios 
       WHERE reset_token = ? 
       AND reset_token_expire > NOW() 
       AND activo = 1`,
      [resetTokenHash]
    );

    if (users.length === 0) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }

    const user = users[0];

    // Hash de la nueva contraseña
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const password_hash = await bcrypt.hash(newPassword, saltRounds);

    // Actualizar contraseña y limpiar token
    await pool.execute(
      `UPDATE usuarios 
       SET password_hash = ?, reset_token = NULL, reset_token_expire = NULL 
       WHERE id = ?`,
      [password_hash, user.id]
    );

    res.json({ message: 'Contraseña restablecida exitosamente' });
  } catch (error) {
    console.error('Error en reset-password:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ========== SERVICIO DE EMAIL ==========
// El servicio de email funciona automáticamente en:
// - Registro de usuarios (email de bienvenida)
// - Creación de pedidos (email de confirmación)
// No requiere endpoints adicionales, funciona en segundo plano

// ========== MANEJO DE ERRORES ==========

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'El archivo es demasiado grande' });
    }
  }
  
  console.error('Error no manejado:', error);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  console.log(`Base de datos: ${dbConfig.database} en ${dbConfig.host}:${dbConfig.port}`);
  console.log(`Modo: ${process.env.NODE_ENV || 'development'}`);
  
  // Verificar configuración de email al iniciar
  const emailConfig = emailService.checkEmailConfig();
  if (emailConfig.configured) {
    console.log(`✅ Servicio de email configurado: ${emailConfig.method}`);
  } else {
    console.log(`⚠️  Servicio de email no configurado. Revisa EMAIL-SETUP.md para más información.`);
  }
  
  // Mostrar estado del rate limiting
  if (process.env.NODE_ENV === 'development') {
    console.log(`⚠️  Rate limiting DESHABILITADO en modo desarrollo`);
  }
});
