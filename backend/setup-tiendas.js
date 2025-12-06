// Script para crear tablas de tiendas si no existen
// Ejecutar: node setup-tiendas.js

const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupTiendas() {
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

    // Verificar si la tabla tiendas existe
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'tiendas'
    `, [process.env.DB_NAME || 'cerveza_premium']);

    if (tables.length === 0) {
      console.log('📦 Creando tabla tiendas...');
      await connection.execute(`
        CREATE TABLE tiendas (
          id INT PRIMARY KEY AUTO_INCREMENT,
          nombre VARCHAR(100) NOT NULL,
          direccion TEXT NOT NULL,
          ciudad VARCHAR(100) NOT NULL,
          estado VARCHAR(100) NOT NULL,
          codigo_postal VARCHAR(10),
          telefono VARCHAR(20),
          email VARCHAR(255),
          latitud DECIMAL(10, 8),
          longitud DECIMAL(11, 8),
          horario_apertura TIME DEFAULT '09:00:00',
          horario_cierre TIME DEFAULT '21:00:00',
          dias_abierto VARCHAR(50) DEFAULT 'Lunes-Domingo',
          activa BOOLEAN DEFAULT TRUE,
          fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Tabla tiendas creada');
    } else {
      console.log('ℹ️  La tabla tiendas ya existe');
    }

    // Verificar si la tabla tienda_inventario existe
    const [tables2] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'tienda_inventario'
    `, [process.env.DB_NAME || 'cerveza_premium']);

    if (tables2.length === 0) {
      console.log('📦 Creando tabla tienda_inventario...');
      await connection.execute(`
        CREATE TABLE tienda_inventario (
          id INT PRIMARY KEY AUTO_INCREMENT,
          tienda_id INT NOT NULL,
          cerveza_id INT NOT NULL,
          stock_disponible INT DEFAULT 0,
          fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (tienda_id) REFERENCES tiendas(id) ON DELETE CASCADE,
          FOREIGN KEY (cerveza_id) REFERENCES cervezas(id) ON DELETE CASCADE,
          UNIQUE KEY unique_tienda_cerveza (tienda_id, cerveza_id),
          INDEX idx_tienda (tienda_id),
          INDEX idx_cerveza (cerveza_id)
        )
      `);
      console.log('✅ Tabla tienda_inventario creada');
    } else {
      console.log('ℹ️  La tabla tienda_inventario ya existe');
    }

    // Insertar tiendas de ejemplo si no existen
    const [existingTiendas] = await connection.execute(`
      SELECT COUNT(*) as count FROM tiendas
    `);

    if (existingTiendas[0].count === 0) {
      console.log('📦 Insertando tiendas de ejemplo...');
      await connection.execute(`
        INSERT INTO tiendas (nombre, direccion, ciudad, estado, codigo_postal, telefono, email, latitud, longitud, horario_apertura, horario_cierre, dias_abierto, activa) VALUES
        ('Cerveza Premium - Centro', 'Av. Reforma 123, Col. Centro', 'Ciudad de México', 'CDMX', '06000', '5551234567', 'centro@cervezapremium.com', 19.4326, -99.1332, '09:00:00', '21:00:00', 'Lunes-Domingo', TRUE),
        ('Cerveza Premium - Polanco', 'Av. Presidente Masaryk 456, Polanco', 'Ciudad de México', 'CDMX', '11560', '5552345678', 'polanco@cervezapremium.com', 19.4285, -99.1946, '10:00:00', '22:00:00', 'Lunes-Domingo', TRUE),
        ('Cerveza Premium - Roma', 'Av. Álvaro Obregón 789, Roma Norte', 'Ciudad de México', 'CDMX', '06700', '5553456789', 'roma@cervezapremium.com', 19.4194, -99.1616, '09:00:00', '21:00:00', 'Lunes-Domingo', TRUE)
      `);
      console.log('✅ Tiendas de ejemplo insertadas');
    } else {
      console.log(`ℹ️  Ya existen ${existingTiendas[0].count} tiendas en la base de datos`);
    }

    // Sincronizar inventario inicial
    console.log('📦 Sincronizando inventario inicial...');
    await connection.execute(`
      INSERT INTO tienda_inventario (tienda_id, cerveza_id, stock_disponible)
      SELECT t.id, c.id, c.stock_disponible
      FROM tiendas t
      CROSS JOIN cervezas c
      WHERE t.activa = 1 AND c.activa = 1
      ON DUPLICATE KEY UPDATE stock_disponible = VALUES(stock_disponible)
    `);
    console.log('✅ Inventario sincronizado');

    console.log('\n🎉 Configuración de tiendas completada exitosamente');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.log('❌ Error: La tabla cervezas no existe. Asegúrate de que la base de datos esté configurada correctamente.');
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
setupTiendas();

