// Script para agregar la columna metodo_pago a la tabla pedidos
// Ejecutar: node add-metodo-pago-column.js

const mysql = require('mysql2/promise');
require('dotenv').config();

async function addMetodoPagoColumn() {
  let connection;
  
  try {
    // Crear conexión a la base de datos
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'cerveza_premium'
    });

    console.log('✅ Conectado a la base de datos');

    // Verificar si la columna ya existe
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'pedidos' 
      AND COLUMN_NAME = 'metodo_pago'
    `, [process.env.DB_NAME || 'cerveza_premium']);

    if (columns.length > 0) {
      console.log('ℹ️  La columna metodo_pago ya existe en la tabla pedidos');
    } else {
      // Agregar la columna
      await connection.execute(`
        ALTER TABLE pedidos 
        ADD COLUMN metodo_pago VARCHAR(50) DEFAULT 'tarjeta' 
        AFTER notas
      `);
      console.log('✅ Columna metodo_pago agregada exitosamente');
    }

    // Actualizar pedidos existentes sin método de pago
    const [updateResult] = await connection.execute(`
      UPDATE pedidos 
      SET metodo_pago = 'tarjeta' 
      WHERE metodo_pago IS NULL OR metodo_pago = ''
    `);
    console.log(`✅ ${updateResult.affectedRows} pedidos actualizados con método de pago por defecto`);

    // Verificar que la columna se agregó correctamente
    const [verify] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'pedidos' 
      AND COLUMN_NAME = 'metodo_pago'
    `, [process.env.DB_NAME || 'cerveza_premium']);

    if (verify.length > 0) {
      console.log('✅ Verificación exitosa:');
      console.log(verify[0]);
    }

    console.log('\n🎉 Proceso completado exitosamente');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️  La columna ya existe, no se necesita agregar');
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
addMetodoPagoColumn();

