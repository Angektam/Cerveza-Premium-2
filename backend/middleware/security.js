const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');

// ========== RATE LIMITING ==========

// Rate limiter general para todas las rutas
// En desarrollo, deshabilitado completamente
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // Límite muy alto (prácticamente deshabilitado)
  message: 'Demasiadas solicitudes desde esta IP, por favor intente más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
  // Excluir peticiones OPTIONS (preflight de CORS) del rate limiting
  skip: (req) => {
    // En desarrollo, saltar todas las peticiones
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
    // En producción, solo saltar OPTIONS
    return req.method === 'OPTIONS';
  },
});

// Rate limiter estricto para login (prevenir ataques de fuerza bruta)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Solo 5 intentos de login
  message: 'Demasiados intentos de inicio de sesión, por favor intente más tarde.',
  skipSuccessfulRequests: true, // No contar intentos exitosos
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para registro
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // Solo 3 registros por hora
  message: 'Demasiados registros desde esta IP, por favor intente más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para reset de contraseña
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // Solo 3 intentos de reset por hora
  message: 'Demasiadas solicitudes de restablecimiento de contraseña.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para upload de archivos
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Solo 10 uploads cada 15 minutos
  message: 'Demasiadas solicitudes de carga de archivos.',
  standardHeaders: true,
  legacyHeaders: false,
});

// ========== VALIDADORES DE INPUT ==========

// Validador de login
const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  body('password')
    .isLength({ min: 4 })
    .withMessage('La contraseña debe tener al menos 4 caracteres'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Datos de entrada inválidos', details: errors.array() });
    }
    next();
  }
];

// Validador de registro
const validateRegister = [
  body('nombre_completo')
    .trim()
    .isLength({ min: 3, max: 100 })
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('Nombre completo inválido'),
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número'),
  body('telefono')
    .optional()
    .matches(/^\+?[\d\s-]+$/)
    .withMessage('Teléfono inválido'),
  body('fecha_nacimiento')
    .isDate()
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 18) {
        throw new Error('Debes ser mayor de 18 años');
      }
      return true;
    }),
  body('tipo_identificacion')
    .isIn(['INE', 'Pasaporte', 'Licencia', 'Cedula'])
    .withMessage('Tipo de identificación inválido'),
  body('numero_identificacion')
    .trim()
    .isLength({ min: 5, max: 20 })
    .isAlphanumeric()
    .withMessage('Número de identificación inválido'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Datos de entrada inválidos', details: errors.array() });
    }
    next();
  }
];

// Validador de actualización de usuario
const validateUserUpdate = [
  body('nombre_completo')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('Nombre completo inválido'),
  body('telefono')
    .optional()
    .matches(/^\+?[\d\s-]+$/)
    .withMessage('Teléfono inválido'),
  body('direccion')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Dirección demasiado larga'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Datos de entrada inválidos', details: errors.array() });
    }
    next();
  }
];

// Validador de pedidos
const validatePedido = [
  body('direccion_envio')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Dirección de envío inválida'),
  body('telefono_contacto')
    .matches(/^\+?[\d\s-]+$/)
    .withMessage('Teléfono de contacto inválido'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('Debe incluir al menos un producto'),
  body('items.*.cerveza_id')
    .isInt({ min: 1 })
    .withMessage('ID de cerveza inválido'),
  body('items.*.cantidad')
    .isInt({ min: 1, max: 100 })
    .withMessage('Cantidad inválida'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Datos de pedido inválidos', details: errors.array() });
    }
    next();
  }
];

// ========== PROTECCIÓN CONTRA CSRF ==========

// Generar token CSRF
const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Middleware para verificar token CSRF (para formularios)
const csrfProtection = (req, res, next) => {
  // Skip CSRF para peticiones GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const token = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionToken = req.session?.csrfToken;

  if (!token || !sessionToken || token !== sessionToken) {
    return res.status(403).json({ error: 'Token CSRF inválido' });
  }

  next();
};

// ========== SANITIZACIÓN DE INPUTS ==========

// Sanitizar objeto recursivamente
const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const sanitized = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      // Remover caracteres peligrosos
      sanitized[key] = obj[key]
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    } else if (typeof obj[key] === 'object') {
      sanitized[key] = sanitizeObject(obj[key]);
    } else {
      sanitized[key] = obj[key];
    }
  }

  return sanitized;
};

// Middleware de sanitización
const sanitizeInput = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  next();
};

// ========== VALIDACIÓN DE ARCHIVOS ==========

// Validar tipo de archivo permitido
const allowedMimeTypes = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
];

const validateFileUpload = (req, res, next) => {
  if (!req.file && !req.files) {
    return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
  }

  const file = req.file || (req.files ? req.files[0] : null);

  if (!file) {
    return res.status(400).json({ error: 'No se proporcionó ningún archivo válido' });
  }

  // Verificar tipo MIME
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return res.status(400).json({ 
      error: 'Tipo de archivo no permitido',
      allowedTypes: allowedMimeTypes 
    });
  }

  // Verificar tamaño (5MB máximo)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return res.status(400).json({ 
      error: 'Archivo demasiado grande',
      maxSize: '5MB' 
    });
  }

  // Verificar extensión del archivo
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const fileExtension = file.originalname.toLowerCase().match(/\.[^.]+$/);
  
  if (!fileExtension || !allowedExtensions.includes(fileExtension[0])) {
    return res.status(400).json({ 
      error: 'Extensión de archivo no permitida',
      allowedExtensions 
    });
  }

  next();
};

// ========== LOGGING DE SEGURIDAD ==========

// Registrar eventos de seguridad
const securityLogger = (event, req, details = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    userId: req.user?.id || 'anonymous',
    ...details
  };

  console.log('[SECURITY]', JSON.stringify(logEntry));
  
  // Aquí podrías guardar en base de datos o archivo de logs
};

// Middleware para registrar intentos de login fallidos
const logFailedLogin = (email, req) => {
  securityLogger('FAILED_LOGIN', req, { email });
};

// Middleware para registrar login exitoso
const logSuccessfulLogin = (userId, email, req) => {
  securityLogger('SUCCESSFUL_LOGIN', req, { userId, email });
};

// Middleware para registrar accesos no autorizados
const logUnauthorizedAccess = (req) => {
  securityLogger('UNAUTHORIZED_ACCESS', req, { 
    path: req.path,
    method: req.method 
  });
};

module.exports = {
  // Rate limiters
  generalLimiter,
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  uploadLimiter,
  
  // Validadores
  validateLogin,
  validateRegister,
  validateUserUpdate,
  validatePedido,
  
  // CSRF
  generateCSRFToken,
  csrfProtection,
  
  // Sanitización
  sanitizeInput,
  sanitizeObject,
  
  // Validación de archivos
  validateFileUpload,
  
  // Logging
  securityLogger,
  logFailedLogin,
  logSuccessfulLogin,
  logUnauthorizedAccess
};

