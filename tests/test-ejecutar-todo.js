/**
 * Script para ejecutar todos los tests
 * Verifica que los servidores estén corriendo antes de ejecutar
 */

const axios = require('axios');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const FRONTEND_URL = 'http://localhost:4200';
const API_BASE = process.env.API_BASE || 'http://localhost:4000/api';

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

async function verificarServidor(url, nombre) {
  try {
    await axios.get(url, { timeout: 2000 });
    log(`✅ ${nombre} disponible`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${nombre} no disponible`, 'red');
    return false;
  }
}

async function main() {
  log('\n' + '='.repeat(60), 'bold');
  log('🧪 VERIFICACIÓN Y EJECUCIÓN DE TESTS', 'bold');
  log('='.repeat(60), 'bold');
  
  log('\n🔍 Verificando servidores...', 'blue');
  
  const backendOk = await verificarServidor(API_BASE, 'Backend');
  const frontendOk = await verificarServidor(FRONTEND_URL, 'Frontend');
  
  if (!backendOk && !frontendOk) {
    log('\n⚠️  Ningún servidor está corriendo.', 'yellow');
    log('\n📝 Para ejecutar los tests:', 'cyan');
    log('   1. Inicia el backend: cd backend && node server.js', 'cyan');
    log('   2. Inicia el frontend: npm start', 'cyan');
    log('   3. Luego ejecuta este script nuevamente', 'cyan');
    return;
  }
  
  if (!backendOk) {
    log('\n⚠️  Backend no disponible. Solo se pueden ejecutar tests de frontend.', 'yellow');
    log('   Para tests de API, inicia el backend: cd backend && node server.js', 'cyan');
  }
  
  if (!frontendOk) {
    log('\n⚠️  Frontend no disponible. Solo se pueden ejecutar tests de API.', 'yellow');
    log('   Para tests E2E, inicia el frontend: npm start', 'cyan');
  }
  
  log('\n🚀 Ejecutando tests disponibles...', 'blue');
  
  // Ejecutar tests de API si el backend está disponible
  if (backendOk) {
    log('\n' + '-'.repeat(60), 'cyan');
    log('📡 Ejecutando tests de API...', 'cyan');
    log('-'.repeat(60), 'cyan');
    
    try {
      const { stdout, stderr } = await execAsync('node test-completo-api.js');
      console.log(stdout);
      if (stderr) console.error(stderr);
    } catch (error) {
      log(`Error ejecutando tests de API: ${error.message}`, 'red');
    }
  }
  
  // Ejecutar tests E2E si ambos servidores están disponibles
  if (backendOk && frontendOk) {
    log('\n' + '-'.repeat(60), 'cyan');
    log('🌐 Ejecutando tests End-to-End...', 'cyan');
    log('-'.repeat(60), 'cyan');
    log('⚠️  Nota: El navegador se abrirá automáticamente', 'yellow');
    
    try {
      const { stdout, stderr } = await execAsync('node test-completo-e2e.js');
      console.log(stdout);
      if (stderr) console.error(stderr);
    } catch (error) {
      log(`Error ejecutando tests E2E: ${error.message}`, 'red');
    }
  }
  
  log('\n' + '='.repeat(60), 'bold');
  log('✅ Tests completados', 'bold');
  log('='.repeat(60), 'bold');
}

main().catch(console.error);

