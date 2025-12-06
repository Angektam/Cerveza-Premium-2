/**
 * Script para crear usuarios de prueba en la base de datos
 * Cliente: cliente@test.com / Test1234!
 * Admin: admin@test.com / Admin1234!
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'cerveza_premium'
};

async function createTestUsers() {
  let connection;
  
  try {
    console.log('🔌 Conectando a la base de datos...');
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Conectado a la base de datos\n');
    
    // Generar hashes de contraseñas
    console.log('🔐 Generando hashes de contraseñas...');
    const saltRounds = 10;
    const clientePasswordHash = await bcrypt.hash('Test1234!', saltRounds);
    const adminPasswordHash = await bcrypt.hash('Admin1234!', saltRounds);
    console.log('✅ Hashes generados\n');
    
    // Verificar si los usuarios ya existen
    console.log('🔍 Verificando usuarios existentes...');
    const [existingCliente] = await connection.execute(
      'SELECT id, email FROM usuarios WHERE email = ?',
      ['cliente@test.com']
    );
    
    const [existingAdmin] = await connection.execute(
      'SELECT id, email FROM usuarios WHERE email = ?',
      ['admin@test.com']
    );
    
    // Crear o actualizar usuario Cliente
    if (existingCliente.length > 0) {
      console.log('⚠️  Usuario cliente@test.com ya existe. Actualizando...');
      await connection.execute(
        `UPDATE usuarios 
         SET nombre_completo = ?, 
             password_hash = ?, 
             fecha_nacimiento = ?,
             tipo_identificacion = ?,
             numero_identificacion = ?,
             confirmo_mayor_edad = TRUE,
             acepto_terminos = TRUE,
             rol = 'cliente',
             activo = TRUE
         WHERE email = ?`,
        [
          'Cliente Test',
          clientePasswordHash,
          '1990-01-01',
          'INE',
          'TEST123456',
          'cliente@test.com'
        ]
      );
      console.log('✅ Usuario cliente actualizado\n');
    } else {
      console.log('➕ Creando usuario cliente@test.com...');
      await connection.execute(
        `INSERT INTO usuarios 
         (nombre_completo, email, password_hash, fecha_nacimiento, 
          tipo_identificacion, numero_identificacion, confirmo_mayor_edad, 
          acepto_terminos, rol, activo, puntos_acumulados) 
         VALUES (?, ?, ?, ?, ?, ?, TRUE, TRUE, 'cliente', TRUE, 100)`,
        [
          'Cliente Test',
          'cliente@test.com',
          clientePasswordHash,
          '1990-01-01',
          'INE',
          'TEST123456'
        ]
      );
      console.log('✅ Usuario cliente creado\n');
    }
    
    // Crear o actualizar usuario Admin
    if (existingAdmin.length > 0) {
      console.log('⚠️  Usuario admin@test.com ya existe. Actualizando...');
      await connection.execute(
        `UPDATE usuarios 
         SET nombre_completo = ?, 
             password_hash = ?, 
             fecha_nacimiento = ?,
             tipo_identificacion = ?,
             numero_identificacion = ?,
             confirmo_mayor_edad = TRUE,
             acepto_terminos = TRUE,
             rol = 'admin',
             activo = TRUE
         WHERE email = ?`,
        [
          'Admin Test',
          adminPasswordHash,
          '1985-01-01',
          'INE',
          'ADMIN123456',
          'admin@test.com'
        ]
      );
      console.log('✅ Usuario admin actualizado\n');
    } else {
      console.log('➕ Creando usuario admin@test.com...');
      await connection.execute(
        `INSERT INTO usuarios 
         (nombre_completo, email, password_hash, fecha_nacimiento, 
          tipo_identificacion, numero_identificacion, confirmo_mayor_edad, 
          acepto_terminos, rol, activo, puntos_acumulados) 
         VALUES (?, ?, ?, ?, ?, ?, TRUE, TRUE, 'admin', TRUE, 0)`,
        [
          'Admin Test',
          'admin@test.com',
          adminPasswordHash,
          '1985-01-01',
          'INE',
          'ADMIN123456'
        ]
      );
      console.log('✅ Usuario admin creado\n');
    }
    
    // Verificar usuarios creados
    console.log('🔍 Verificando usuarios creados...');
    const [clientes] = await connection.execute(
      'SELECT id, email, nombre_completo, rol, activo, puntos_acumulados FROM usuarios WHERE email IN (?, ?)',
      ['cliente@test.com', 'admin@test.com']
    );
    
    console.log('\n📋 Usuarios en la base de datos:');
    console.log('='.repeat(60));
    clientes.forEach(user => {
      console.log(`\n👤 ${user.nombre_completo}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Rol: ${user.rol}`);
      console.log(`   Activo: ${user.activo ? 'Sí' : 'No'}`);
      console.log(`   Puntos: ${user.puntos_acumulados || 0}`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ ¡Usuarios de prueba creados exitosamente!');
    console.log('\n📝 Credenciales:');
    console.log('   Cliente: cliente@test.com / Test1234!');
    console.log('   Admin: admin@test.com / Admin1234!');
    console.log('\n🎯 Ahora puedes ejecutar los tests:');
    console.log('   node test-completo-api.js');
    console.log('   node test-completo-e2e.js\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('   Verifica las credenciales de la base de datos en el script');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('   La base de datos "cerveza_premium" no existe. Créala primero.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   No se puede conectar a MySQL. Verifica que esté corriendo.');
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createTestUsers().catch(console.error);
}

module.exports = { createTestUsers };

