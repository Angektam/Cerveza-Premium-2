/**
 * Utilidades para respuestas estandarizadas
 */

function success(res, data, message = 'Operación exitosa', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}

function error(res, message = 'Error en la operación', statusCode = 400, code = null) {
  return res.status(statusCode).json({
    success: false,
    error: message,
    code
  });
}

function paginated(res, data, page, limit, total) {
  return res.json({
    success: true,
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}

module.exports = {
  success,
  error,
  paginated
};

