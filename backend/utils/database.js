/**
 * Utilidades de base de datos
 * Pool de conexiones y funciones helper
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cerveza_premium',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

// Pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función helper para ejecutar queries
async function query(sql, params = []) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Error en query:', error);
    throw error;
  }
}

// Función helper para transacciones
async function transaction(callback) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  
  try {
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Verificar conexión
async function testConnection() {
  try {
    await pool.execute('SELECT 1');
    return true;
  } catch (error) {
    console.error('Error de conexión a la base de datos:', error);
    return false;
  }
}

module.exports = {
  pool,
  query,
  transaction,
  testConnection
};

