/**
 * 🧪 TEST COMPLETO DE APIs - Cerveza Premium
 * Prueba todas las APIs del backend sin necesidad de Puppeteer
 */

const axios = require('axios');

const API_BASE = process.env.API_BASE || 'http://localhost:4000/api';

// Credenciales de prueba
const CLIENTE_EMAIL = 'cliente@test.com';
const CLIENTE_PASSWORD = 'Test1234!';
const ADMIN_EMAIL = 'admin@test.com';
const ADMIN_PASSWORD = 'Admin1234!';

const resultados = {
  total: 0,
  exitosos: 0,
  fallidos: 0,
  detalles: []
};

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(mensaje, color = 'reset') {
  console.log(`${colors[color]}${mensaje}${colors.reset}`);
}

function agregarResultado(categoria, nombre, estado, mensaje) {
  resultados.total++;
  if (estado === 'exitoso') {
    resultados.exitosos++;
    log(`✅ [${categoria}] ${nombre}: ${mensaje}`, 'green');
  } else {
    resultados.fallidos++;
    log(`❌ [${categoria}] ${nombre}: ${mensaje}`, 'red');
  }
  resultados.detalles.push({ categoria, nombre, estado, mensaje });
}

// ============================================
// TESTS DE AUTENTICACIÓN
// ============================================

async function testLoginCliente() {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: CLIENTE_EMAIL,
      password: CLIENTE_PASSWORD
    });
    
    if (response.data && response.data.token) {
      agregarResultado('AUTH', 'Login Cliente', 'exitoso', 'Token recibido');
      return response.data.token;
    } else {
      agregarResultado('AUTH', 'Login Cliente', 'fallido', 'No se recibió token');
      return null;
    }
  } catch (error) {
    agregarResultado('AUTH', 'Login Cliente', 'fallido', error.response?.data?.error || error.message);
    return null;
  }
}

async function testLoginAdmin() {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    if (response.data && response.data.token) {
      agregarResultado('AUTH', 'Login Admin', 'exitoso', 'Token recibido');
      return response.data.token;
    } else {
      agregarResultado('AUTH', 'Login Admin', 'fallido', 'No se recibió token');
      return null;
    }
  } catch (error) {
    agregarResultado('AUTH', 'Login Admin', 'fallido', error.response?.data?.error || error.message);
    return null;
  }
}

// ============================================
// TESTS DE CERVEZAS
// ============================================

async function testCervezasMexicanas() {
  try {
    const response = await axios.get(`${API_BASE}/cervezas-mexicanas`);
    if (response.data && Array.isArray(response.data)) {
      agregarResultado('CERVEZAS', 'GET /cervezas-mexicanas', 'exitoso', `${response.data.length} cervezas encontradas`);
      return true;
    } else {
      agregarResultado('CERVEZAS', 'GET /cervezas-mexicanas', 'fallido', 'Respuesta no es un array');
      return false;
    }
  } catch (error) {
    agregarResultado('CERVEZAS', 'GET /cervezas-mexicanas', 'fallido', error.message);
    return false;
  }
}

async function testCervezas(token) {
  try {
    const response = await axios.get(`${API_BASE}/cervezas`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (response.data && Array.isArray(response.data)) {
      agregarResultado('CERVEZAS', 'GET /cervezas', 'exitoso', `${response.data.length} cervezas encontradas`);
    } else {
      agregarResultado('CERVEZAS', 'GET /cervezas', 'fallido', 'Respuesta no es un array');
    }
  } catch (error) {
    agregarResultado('CERVEZAS', 'GET /cervezas', 'fallido', error.message);
  }
}

// ============================================
// TESTS DE USUARIOS
// ============================================

async function testObtenerUsuario(token) {
  try {
    const response = await axios.get(`${API_BASE}/usuarios/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (response.data && response.data.id) {
      agregarResultado('USUARIOS', 'GET /usuarios/me', 'exitoso', `Usuario: ${response.data.nombre_completo}`);
    } else {
      agregarResultado('USUARIOS', 'GET /usuarios/me', 'fallido', 'Usuario no encontrado');
    }
  } catch (error) {
    agregarResultado('USUARIOS', 'GET /usuarios/me', 'fallido', error.message);
  }
}

// ============================================
// TESTS DE PEDIDOS
// ============================================

async function testPedidos(token) {
  try {
    const response = await axios.get(`${API_BASE}/pedidos`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (Array.isArray(response.data)) {
      agregarResultado('PEDIDOS', 'GET /pedidos', 'exitoso', `${response.data.length} pedidos encontrados`);
    } else {
      agregarResultado('PEDIDOS', 'GET /pedidos', 'fallido', 'Respuesta no es un array');
    }
  } catch (error) {
    agregarResultado('PEDIDOS', 'GET /pedidos', 'fallido', error.message);
  }
}

// ============================================
// TESTS DE PUNTOS
// ============================================

async function testPuntos(token, userId) {
  try {
    const response = await axios.get(`${API_BASE}/puntos/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (response.data && typeof response.data.puntos === 'number') {
      agregarResultado('PUNTOS', 'GET /puntos/:id', 'exitoso', `Puntos: ${response.data.puntos}`);
    } else {
      agregarResultado('PUNTOS', 'GET /puntos/:id', 'fallido', 'Respuesta inválida');
    }
  } catch (error) {
    agregarResultado('PUNTOS', 'GET /puntos/:id', 'fallido', error.message);
  }
}

async function testTransaccionesPuntos(token, userId) {
  try {
    const response = await axios.get(`${API_BASE}/puntos/transacciones/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (Array.isArray(response.data)) {
      agregarResultado('PUNTOS', 'GET /puntos/transacciones/:id', 'exitoso', `${response.data.length} transacciones`);
    } else {
      agregarResultado('PUNTOS', 'GET /puntos/transacciones/:id', 'fallido', 'Respuesta no es un array');
    }
  } catch (error) {
    agregarResultado('PUNTOS', 'GET /puntos/transacciones/:id', 'fallido', error.message);
  }
}

// ============================================
// TESTS DE ADMIN
// ============================================

async function testAdminCervezas(token) {
  try {
    const response = await axios.get(`${API_BASE}/admin/cervezas`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (Array.isArray(response.data)) {
      agregarResultado('ADMIN', 'GET /admin/cervezas', 'exitoso', `${response.data.length} cervezas`);
    } else {
      agregarResultado('ADMIN', 'GET /admin/cervezas', 'fallido', 'Respuesta no es un array');
    }
  } catch (error) {
    agregarResultado('ADMIN', 'GET /admin/cervezas', 'fallido', error.message);
  }
}

async function testAdminPedidos(token) {
  try {
    const response = await axios.get(`${API_BASE}/admin/pedidos`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (Array.isArray(response.data)) {
      agregarResultado('ADMIN', 'GET /admin/pedidos', 'exitoso', `${response.data.length} pedidos`);
    } else {
      agregarResultado('ADMIN', 'GET /admin/pedidos', 'fallido', 'Respuesta no es un array');
    }
  } catch (error) {
    agregarResultado('ADMIN', 'GET /admin/pedidos', 'fallido', error.message);
  }
}

async function testAdminUsuarios(token) {
  try {
    const response = await axios.get(`${API_BASE}/admin/usuarios`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (Array.isArray(response.data)) {
      agregarResultado('ADMIN', 'GET /admin/usuarios', 'exitoso', `${response.data.length} usuarios`);
    } else {
      agregarResultado('ADMIN', 'GET /admin/usuarios', 'fallido', 'Respuesta no es un array');
    }
  } catch (error) {
    agregarResultado('ADMIN', 'GET /admin/usuarios', 'fallido', error.message);
  }
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

async function ejecutarTests() {
  log('\n' + '='.repeat(60), 'bold');
  log('🧪 TEST COMPLETO DE APIs - Cerveza Premium', 'bold');
  log('='.repeat(60), 'bold');
  
  // Verificar servidor
  log('\n🔍 Verificando servidor...', 'blue');
  try {
    await axios.get(API_BASE);
    log('✅ Backend disponible', 'green');
  } catch (error) {
    log('❌ Backend no disponible. Asegúrate de que esté corriendo en puerto 4000', 'red');
    return;
  }
  
  // Tests de Cervezas (sin autenticación)
  log('\n🍺 Tests de Cervezas...', 'cyan');
  await testCervezasMexicanas();
  
  // Tests como Cliente
  log('\n👤 Tests como Cliente...', 'cyan');
  const tokenCliente = await testLoginCliente();
  
  if (tokenCliente) {
    // Obtener ID del usuario
    try {
      const userResponse = await axios.get(`${API_BASE}/usuarios/me`, {
        headers: { Authorization: `Bearer ${tokenCliente}` }
      });
      const userId = userResponse.data?.id;
      
      if (userId) {
        await testCervezas(tokenCliente);
        await testObtenerUsuario(tokenCliente);
        await testPedidos(tokenCliente);
        await testPuntos(tokenCliente, userId);
        await testTransaccionesPuntos(tokenCliente, userId);
      }
    } catch (error) {
      log('⚠️  No se pudo obtener ID de usuario', 'yellow');
    }
  }
  
  // Tests como Admin
  log('\n👨‍💼 Tests como Admin...', 'cyan');
  const tokenAdmin = await testLoginAdmin();
  
  if (tokenAdmin) {
    await testAdminCervezas(tokenAdmin);
    await testAdminPedidos(tokenAdmin);
    await testAdminUsuarios(tokenAdmin);
  }
  
  // Reporte final
  log('\n' + '='.repeat(60), 'bold');
  log('📊 REPORTE FINAL', 'bold');
  log('='.repeat(60), 'bold');
  
  log(`\nTotal de tests: ${resultados.total}`, 'blue');
  log(`✅ Exitosos: ${resultados.exitosos}`, 'green');
  log(`❌ Fallidos: ${resultados.fallidos}`, 'red');
  
  const tasaExito = resultados.total > 0 
    ? Math.round((resultados.exitosos / resultados.total) * 100) 
    : 0;
  
  log(`📈 Tasa de éxito: ${tasaExito}%`, tasaExito >= 80 ? 'green' : tasaExito >= 60 ? 'yellow' : 'red');
  
  if (resultados.fallidos > 0) {
    log('\n❌ Tests Fallidos:', 'red');
    resultados.detalles
      .filter(r => r.estado === 'fallido')
      .forEach(r => {
        log(`   - [${r.categoria}] ${r.nombre}: ${r.mensaje}`, 'red');
      });
  }
  
  if (resultados.exitosos === resultados.total) {
    log('\n🎉 ¡Todos los tests pasaron exitosamente!', 'green');
  }
}

// Ejecutar
if (require.main === module) {
  ejecutarTests().catch(console.error);
}

module.exports = { ejecutarTests };

