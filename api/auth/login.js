/**
 * Login endpoint
 * POST /api/auth/login
 */
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let connection = null;
  
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    // Verificar que las variables de entorno estén configuradas
    if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
      console.error('Variables de entorno de base de datos no configuradas');
      return res.status(500).json({ error: 'Configuración del servidor incompleta' });
    }

    // Crear conexión a la base de datos
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT) || 3306,
      connectTimeout: 10000,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    });

    // Buscar usuario
    const [users] = await connection.execute(
      'SELECT * FROM usuarios WHERE email = ? AND activo = 1',
      [email]
    );

    if (users.length === 0) {
      await connection.end();
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = users[0];

    // Verificar contraseña (el campo puede ser 'password' o 'password_hash')
    const passwordField = user.password_hash || user.password;
    const isValidPassword = await bcrypt.compare(password, passwordField);

    if (!isValidPassword) {
      await connection.end();
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        rol: user.rol 
      },
      process.env.JWT_SECRET || 'default-secret-change-in-production',
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );

    // Remover información sensible de la respuesta
    const { password: _, password_hash: __, ...userWithoutPassword } = user;

    await connection.end();

    res.json({
      user: userWithoutPassword,
      token
    });

  } catch (error) {
    console.error('Error en login:', error);
    // Cerrar conexión si está abierta
    try {
      if (connection && typeof connection.end === 'function') {
        await connection.end();
      }
    } catch (closeError) {
      console.error('Error cerrando conexión:', closeError);
    }
    
    // Retornar error más descriptivo en desarrollo
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Error interno del servidor';
    
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
