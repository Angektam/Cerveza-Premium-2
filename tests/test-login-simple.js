/**
 * Test simple de login
 */

const axios = require('axios');

const API_BASE = 'http://localhost:4000/api';
const CLIENTE_EMAIL = 'cliente@test.com';
const CLIENTE_PASSWORD = 'Test1234!';

async function testLogin() {
  console.log('🧪 Probando login...\n');
  
  try {
    // Verificar que el backend esté corriendo
    console.log('1. Verificando backend...');
    try {
      const healthCheck = await axios.get(`${API_BASE}/auth/health`);
      console.log('✅ Backend disponible:', healthCheck.data);
    } catch (err) {
      console.error('❌ Backend no disponible en', API_BASE);
      console.error('   Asegúrate de que el backend esté corriendo:');
      console.error('   cd backend && node server.js\n');
      return;
    }
    
    // Intentar login
    console.log('\n2. Intentando login...');
    console.log(`   Email: ${CLIENTE_EMAIL}`);
    console.log(`   Password: ${CLIENTE_PASSWORD}`);
    
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: CLIENTE_EMAIL,
      password: CLIENTE_PASSWORD
    });
    
    console.log('\n✅ Login exitoso!');
    console.log('   Token:', response.data.token ? '✅ Presente' : '❌ Faltante');
    console.log('   Usuario:', response.data.user?.nombre_completo || 'N/A');
    console.log('   Rol:', response.data.user?.rol || 'N/A');
    console.log('   ID:', response.data.user?.id || 'N/A');
    
    if (!response.data.user) {
      console.error('\n❌ ERROR: La respuesta no incluye el objeto "user"');
      console.log('Respuesta completa:', JSON.stringify(response.data, null, 2));
    }
    
    if (!response.data.user?.rol) {
      console.error('\n❌ ERROR: El usuario no tiene el campo "rol"');
    }
    
  } catch (error) {
    console.error('\n❌ Error en login:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Mensaje:', error.response.data?.error || error.response.data);
    } else if (error.request) {
      console.error('   No se recibió respuesta del servidor');
      console.error('   Verifica que el backend esté corriendo en puerto 4000');
    } else {
      console.error('   Error:', error.message);
    }
  }
}

testLogin();

