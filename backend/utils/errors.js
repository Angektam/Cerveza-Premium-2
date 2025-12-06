/**
 * Manejo centralizado de errores
 */

class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handlers
function handleDatabaseError(error, req, res, next) {
  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ 
      error: 'El recurso ya existe',
      code: 'DUPLICATE_ENTRY'
    });
  }
  
  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({ 
      error: 'Referencia inválida',
      code: 'INVALID_REFERENCE'
    });
  }
  
  if (error.code === 'ER_BAD_FIELD_ERROR') {
    return res.status(400).json({ 
      error: 'Campo inválido en la consulta',
      code: 'INVALID_FIELD'
    });
  }
  
  next(error);
}

function handleValidationError(error, req, res, next) {
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: error.message,
      code: 'VALIDATION_ERROR',
      details: error.details
    });
  }
  next(error);
}

function handleJWTError(error, req, res, next) {
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token inválido',
      code: 'INVALID_TOKEN'
    });
  }
  
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expirado',
      code: 'EXPIRED_TOKEN'
    });
  }
  
  next(error);
}

function handleMulterError(error, req, res, next) {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'El archivo es demasiado grande. Máximo 5MB',
      code: 'FILE_TOO_LARGE'
    });
  }
  
  if (error.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      error: 'Demasiados archivos',
      code: 'TOO_MANY_FILES'
    });
  }
  
  next(error);
}

function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Error interno del servidor';
  
  // Log del error
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });
  
  // Respuesta al cliente
  res.status(statusCode).json({
    error: message,
    code: error.code || 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
}

module.exports = {
  AppError,
  handleDatabaseError,
  handleValidationError,
  handleJWTError,
  handleMulterError,
  errorHandler
};

