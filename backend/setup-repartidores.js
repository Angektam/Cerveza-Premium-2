// Script para crear tablas de repartidores si no existen
// Ejecutar: node setup-repartidores.js

const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupRepartidores() {
  let connection;
  
  try {
    // Crear conexión a la base de datos
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'cerveza_premium',
      multipleStatements: true
    });

    console.log('✅ Conectado a la base de datos');

    // Verificar si la tabla repartidores existe
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'repartidores'
    `, [process.env.DB_NAME || 'cerveza_premium']);

    if (tables.length === 0) {
      console.log('📦 Creando tabla repartidores...');
      await connection.execute(`
        CREATE TABLE repartidores (
          id INT PRIMARY KEY AUTO_INCREMENT,
          nombre_completo VARCHAR(100) NOT NULL,
          telefono VARCHAR(20) NOT NULL,
          email VARCHAR(255) UNIQUE,
          vehiculo VARCHAR(50) DEFAULT 'Moto',
          placa VARCHAR(20),
          activo BOOLEAN DEFAULT TRUE,
          fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          ultima_actividad TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Tabla repartidores creada');
    } else {
      console.log('ℹ️  La tabla repartidores ya existe');
    }

    // Verificar si la tabla repartidor_ubicaciones existe
    const [tables2] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'repartidor_ubicaciones'
    `, [process.env.DB_NAME || 'cerveza_premium']);

    if (tables2.length === 0) {
      console.log('📦 Creando tabla repartidor_ubicaciones...');
      await connection.execute(`
        CREATE TABLE repartidor_ubicaciones (
          id INT PRIMARY KEY AUTO_INCREMENT,
          repartidor_id INT NOT NULL,
          latitud DECIMAL(10, 8) NOT NULL,
          longitud DECIMAL(11, 8) NOT NULL,
          velocidad DECIMAL(5, 2) DEFAULT 0,
          direccion TEXT,
          fecha_ubicacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (repartidor_id) REFERENCES repartidores(id) ON DELETE CASCADE,
          INDEX idx_repartidor_fecha (repartidor_id, fecha_ubicacion)
        )
      `);
      console.log('✅ Tabla repartidor_ubicaciones creada');
    } else {
      console.log('ℹ️  La tabla repartidor_ubicaciones ya existe');
    }

    // Verificar si la columna repartidor_id existe en pedidos
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'pedidos' 
      AND COLUMN_NAME = 'repartidor_id'
    `, [process.env.DB_NAME || 'cerveza_premium']);

    if (columns.length === 0) {
      console.log('📦 Agregando columna repartidor_id a pedidos...');
      await connection.execute(`
        ALTER TABLE pedidos 
        ADD COLUMN repartidor_id INT NULL,
        ADD FOREIGN KEY (repartidor_id) REFERENCES repartidores(id)
      `);
      console.log('✅ Columna repartidor_id agregada');
    } else {
      console.log('ℹ️  La columna repartidor_id ya existe en pedidos');
    }

    // Insertar repartidores de ejemplo si no existen
    const [existingRepartidores] = await connection.execute(`
      SELECT COUNT(*) as count FROM repartidores
    `);

    if (existingRepartidores[0].count === 0) {
      console.log('📦 Insertando repartidores de ejemplo...');
      await connection.execute(`
        INSERT INTO repartidores (nombre_completo, telefono, email, vehiculo, placa, activo) VALUES
        ('Juan Pérez', '5551234567', 'juan.perez@cervezapremium.com', 'Moto', 'ABC-123', TRUE),
        ('María González', '5552345678', 'maria.gonzalez@cervezapremium.com', 'Bicicleta', 'XYZ-789', TRUE),
        ('Carlos Rodríguez', '5553456789', 'carlos.rodriguez@cervezapremium.com', 'Moto', 'DEF-456', TRUE)
      `);
      console.log('✅ Repartidores de ejemplo insertados');
    } else {
      console.log(`ℹ️  Ya existen ${existingRepartidores[0].count} repartidores en la base de datos`);
    }

    console.log('\n🎉 Configuración de repartidores completada exitosamente');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️  La columna ya existe, no se necesita agregar');
    } else if (error.code === 'ER_NO_SUCH_TABLE') {
      console.log('❌ Error: La tabla pedidos no existe. Asegúrate de que la base de datos esté configurada correctamente.');
    } else {
      process.exit(1);
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ Conexión cerrada');
    }
  }
}

// Ejecutar el script
setupRepartidores();

