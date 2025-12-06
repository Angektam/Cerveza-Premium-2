/**
 * 🧪 TEST COMPLETO END-TO-END - Cerveza Premium
 * Prueba todas las funcionalidades como Cliente y Admin
 */

const puppeteer = require('puppeteer');
const axios = require('axios');

const FRONTEND_URL = 'http://localhost:4200';
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

async function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// TESTS COMO CLIENTE
// ============================================

async function testLoginCliente(page) {
  try {
    log('\n🔐 Probando Login de Cliente...', 'cyan');
    
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle0' });
    await esperar(1000);
    
    // Verificar que estemos en la vista de login
    const loginView = await page.$('#loginView');
    if (!loginView) {
      agregarResultado('CLIENTE', 'Login - Vista', 'fallido', 'Vista de login no encontrada');
      return false;
    }
    agregarResultado('CLIENTE', 'Login - Vista', 'exitoso', 'Vista de login cargada');
    
    // Llenar formulario de login
    await page.type('#email', CLIENTE_EMAIL);
    await page.type('#password', CLIENTE_PASSWORD);
    await esperar(500);
    
    // Enviar formulario
    await page.click('button[type="submit"]');
    await esperar(2000);
    
    // Verificar que se haya iniciado sesión
    const dashboardView = await page.$('#dashboardView');
    if (dashboardView) {
      agregarResultado('CLIENTE', 'Login - Autenticación', 'exitoso', 'Login exitoso');
      return true;
    } else {
      agregarResultado('CLIENTE', 'Login - Autenticación', 'fallido', 'No se redirigió al dashboard');
      return false;
    }
  } catch (error) {
    agregarResultado('CLIENTE', 'Login', 'fallido', error.message);
    return false;
  }
}

async function testNavegacionDashboard(page) {
  try {
    log('\n🧭 Probando Navegación del Dashboard...', 'cyan');
    
    const botones = [
      { id: 'showCatalog', nombre: 'Ver Catálogo' },
      { id: 'showCart', nombre: 'Mi Carrito' },
      { id: 'showOrders', nombre: 'Mis Pedidos' },
      { id: 'showProfile', nombre: 'Mi Perfil' },
      { id: 'showFavorites', nombre: 'Mis Favoritos' },
      { id: 'showPointsHistory', nombre: 'Historial de Puntos' },
      { id: 'showAddresses', nombre: 'Mis Direcciones' },
      { id: 'showNotifications', nombre: 'Notificaciones' },
      { id: 'showSettings', nombre: 'Configuración' },
      { id: 'showPromotions', nombre: 'Promociones' },
      { id: 'showRecommendations', nombre: 'Recomendaciones' }
    ];
    
    for (const boton of botones) {
      try {
        const elemento = await page.$(`#${boton.id}`);
        if (elemento) {
          await elemento.click();
          await esperar(1000);
          
          // Verificar que algo cambió (vista o modal)
          const activo = await page.evaluate(() => {
            const views = document.querySelectorAll('.view');
            for (const view of views) {
              if (view.style.display !== 'none' && view.id !== 'dashboardView') {
                return true;
              }
            }
            return document.getElementById('messagePopup')?.style.display === 'flex';
          });
          
          if (activo) {
            agregarResultado('CLIENTE', `Botón ${boton.nombre}`, 'exitoso', 'Funciona correctamente');
          } else {
            agregarResultado('CLIENTE', `Botón ${boton.nombre}`, 'fallido', 'No cambió la vista');
          }
          
          // Volver al dashboard
          const backBtn = await page.$('#backToDashboard, .back-btn');
          if (backBtn) {
            await backBtn.click();
            await esperar(500);
          }
        } else {
          agregarResultado('CLIENTE', `Botón ${boton.nombre}`, 'fallido', 'Botón no encontrado');
        }
      } catch (error) {
        agregarResultado('CLIENTE', `Botón ${boton.nombre}`, 'fallido', error.message);
      }
    }
  } catch (error) {
    agregarResultado('CLIENTE', 'Navegación Dashboard', 'fallido', error.message);
  }
}

async function testCatalogo(page) {
  try {
    log('\n🍺 Probando Catálogo de Cervezas...', 'cyan');
    
    const catalogBtn = await page.$('#showCatalog');
    if (catalogBtn) {
      await catalogBtn.click();
      await esperar(2000);
      
      // Verificar que se cargó el catálogo
      const catalogView = await page.$('#catalogView');
      if (catalogView) {
        agregarResultado('CLIENTE', 'Catálogo - Vista', 'exitoso', 'Vista de catálogo cargada');
        
        // Verificar que hay cervezas
        const cervezas = await page.$$('.beer-card, .beer-item');
        if (cervezas.length > 0) {
          agregarResultado('CLIENTE', 'Catálogo - Cervezas', 'exitoso', `${cervezas.length} cervezas encontradas`);
        } else {
          agregarResultado('CLIENTE', 'Catálogo - Cervezas', 'fallido', 'No se encontraron cervezas');
        }
      } else {
        agregarResultado('CLIENTE', 'Catálogo - Vista', 'fallido', 'Vista de catálogo no encontrada');
      }
    }
  } catch (error) {
    agregarResultado('CLIENTE', 'Catálogo', 'fallido', error.message);
  }
}

async function testCarrito(page) {
  try {
    log('\n🛒 Probando Carrito de Compras...', 'cyan');
    
    const cartBtn = await page.$('#showCart');
    if (cartBtn) {
      await cartBtn.click();
      await esperar(1000);
      
      const cartView = await page.$('#cartView');
      if (cartView) {
        agregarResultado('CLIENTE', 'Carrito - Vista', 'exitoso', 'Vista de carrito cargada');
      } else {
        agregarResultado('CLIENTE', 'Carrito - Vista', 'fallido', 'Vista de carrito no encontrada');
      }
    }
  } catch (error) {
    agregarResultado('CLIENTE', 'Carrito', 'fallido', error.message);
  }
}

async function testPerfil(page) {
  try {
    log('\n👤 Probando Perfil de Usuario...', 'cyan');
    
    const profileBtn = await page.$('#showProfile');
    if (profileBtn) {
      await profileBtn.click();
      await esperar(1000);
      
      const profileView = await page.$('#profileView');
      if (profileView) {
        agregarResultado('CLIENTE', 'Perfil - Vista', 'exitoso', 'Vista de perfil cargada');
      } else {
        agregarResultado('CLIENTE', 'Perfil - Vista', 'fallido', 'Vista de perfil no encontrada');
      }
    }
  } catch (error) {
    agregarResultado('CLIENTE', 'Perfil', 'fallido', error.message);
  }
}

async function testHistorialPuntos(page) {
  try {
    log('\n⭐ Probando Historial de Puntos...', 'cyan');
    
    const pointsBtn = await page.$('#showPointsHistory');
    if (pointsBtn) {
      await pointsBtn.click();
      await esperar(1500);
      
      // Verificar que se abrió el modal
      const modal = await page.$('#genericPointsModal, .modal');
      if (modal) {
        agregarResultado('CLIENTE', 'Historial Puntos - Modal', 'exitoso', 'Modal de historial abierto');
        
        // Cerrar modal
        const closeBtn = await page.$('#closePointsHistoryModal, .modal-close, .message-close');
        if (closeBtn) {
          await closeBtn.click();
          await esperar(500);
        }
      } else {
        agregarResultado('CLIENTE', 'Historial Puntos - Modal', 'fallido', 'Modal no se abrió');
      }
    }
  } catch (error) {
    agregarResultado('CLIENTE', 'Historial Puntos', 'fallido', error.message);
  }
}

async function testPromociones(page) {
  try {
    log('\n🎁 Probando Promociones...', 'cyan');
    
    const promoBtn = await page.$('#showPromotions');
    if (promoBtn) {
      await promoBtn.click();
      await esperar(1500);
      
      const modal = await page.$('#messagePopup');
      if (modal) {
        const isVisible = await page.evaluate(() => {
          const popup = document.getElementById('messagePopup');
          return popup && popup.style.display === 'flex';
        });
        
        if (isVisible) {
          agregarResultado('CLIENTE', 'Promociones - Modal', 'exitoso', 'Modal de promociones abierto');
          
          // Cerrar modal
          const closeBtn = await page.$('#closeMessage');
          if (closeBtn) {
            await closeBtn.click();
            await esperar(500);
          }
        } else {
          agregarResultado('CLIENTE', 'Promociones - Modal', 'fallido', 'Modal no visible');
        }
      } else {
        agregarResultado('CLIENTE', 'Promociones - Modal', 'fallido', 'Modal no encontrado');
      }
    }
  } catch (error) {
    agregarResultado('CLIENTE', 'Promociones', 'fallido', error.message);
  }
}

async function testLogout(page) {
  try {
    log('\n🚪 Probando Logout...', 'cyan');
    
    const logoutBtn = await page.$('#logoutBtn');
    if (logoutBtn) {
      await logoutBtn.click();
      await esperar(2000);
      
      const loginView = await page.$('#loginView');
      if (loginView) {
        agregarResultado('CLIENTE', 'Logout', 'exitoso', 'Logout exitoso, redirigido a login');
      } else {
        agregarResultado('CLIENTE', 'Logout', 'fallido', 'No se redirigió a login');
      }
    }
  } catch (error) {
    agregarResultado('CLIENTE', 'Logout', 'fallido', error.message);
  }
}

// ============================================
// TESTS COMO ADMIN
// ============================================

async function testLoginAdmin(page) {
  try {
    log('\n🔐 Probando Login de Admin...', 'cyan');
    
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle0' });
    await esperar(1000);
    
    // Buscar enlace de admin
    const adminLink = await page.$('a[onclick*="admin"], .admin-link');
    if (adminLink) {
      await adminLink.click();
      await esperar(1000);
    }
    
    // Llenar formulario de admin
    const emailInput = await page.$('#adminEmail, #email');
    const passwordInput = await page.$('#adminPassword, #password');
    
    if (emailInput && passwordInput) {
      await emailInput.type(ADMIN_EMAIL);
      await passwordInput.type(ADMIN_PASSWORD);
      await esperar(500);
      
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();
        await esperar(2000);
        
        const adminView = await page.$('#adminDashboardView, .admin-dashboard');
        if (adminView) {
          agregarResultado('ADMIN', 'Login', 'exitoso', 'Login de admin exitoso');
          return true;
        } else {
          agregarResultado('ADMIN', 'Login', 'fallido', 'No se redirigió al panel admin');
          return false;
        }
      }
    } else {
      agregarResultado('ADMIN', 'Login', 'fallido', 'Campos de login no encontrados');
      return false;
    }
  } catch (error) {
    agregarResultado('ADMIN', 'Login', 'fallido', error.message);
    return false;
  }
}

async function testPanelAdmin(page) {
  try {
    log('\n⚙️ Probando Panel de Administración...', 'cyan');
    
    // Verificar que estamos en el panel admin
    const adminView = await page.$('#adminDashboardView');
    if (adminView) {
      agregarResultado('ADMIN', 'Panel - Vista', 'exitoso', 'Panel de admin cargado');
    } else {
      agregarResultado('ADMIN', 'Panel - Vista', 'fallido', 'Panel de admin no encontrado');
      return;
    }
    
    // Probar secciones del panel
    const secciones = [
      { selector: '#cervezasSection, [data-section="cervezas"]', nombre: 'Gestión de Cervezas' },
      { selector: '#pedidosSection, [data-section="pedidos"]', nombre: 'Gestión de Pedidos' },
      { selector: '#usuariosSection, [data-section="usuarios"]', nombre: 'Gestión de Usuarios' },
      { selector: '#reportesSection, [data-section="reportes"]', nombre: 'Reportes' }
    ];
    
    for (const seccion of secciones) {
      try {
        const elemento = await page.$(seccion.selector);
        if (elemento) {
          await elemento.click();
          await esperar(1000);
          agregarResultado('ADMIN', seccion.nombre, 'exitoso', 'Sección accesible');
        } else {
          agregarResultado('ADMIN', seccion.nombre, 'fallido', 'Sección no encontrada');
        }
      } catch (error) {
        agregarResultado('ADMIN', seccion.nombre, 'fallido', error.message);
      }
    }
  } catch (error) {
    agregarResultado('ADMIN', 'Panel Admin', 'fallido', error.message);
  }
}

// ============================================
// TESTS DE API
// ============================================

async function testAPIs() {
  try {
    log('\n🔌 Probando APIs del Backend...', 'cyan');
    
    // Test de cervezas
    try {
      const response = await axios.get(`${API_BASE}/cervezas-mexicanas`);
      if (response.data && Array.isArray(response.data)) {
        agregarResultado('API', 'GET /cervezas-mexicanas', 'exitoso', `${response.data.length} cervezas encontradas`);
      }
    } catch (error) {
      agregarResultado('API', 'GET /cervezas-mexicanas', 'fallido', error.message);
    }
    
    // Test de login
    try {
      const response = await axios.post(`${API_BASE}/auth/login`, {
        email: CLIENTE_EMAIL,
        password: CLIENTE_PASSWORD
      });
      if (response.data && response.data.token) {
        agregarResultado('API', 'POST /auth/login', 'exitoso', 'Login API funciona');
      }
    } catch (error) {
      agregarResultado('API', 'POST /auth/login', 'fallido', error.message);
    }
  } catch (error) {
    agregarResultado('API', 'APIs', 'fallido', error.message);
  }
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

async function ejecutarTests() {
  log('\n' + '='.repeat(60), 'bold');
  log('🧪 TEST COMPLETO END-TO-END - Cerveza Premium', 'bold');
  log('='.repeat(60), 'bold');
  
  let browser;
  let page;
  
  try {
    // Verificar que los servidores estén corriendo
    log('\n🔍 Verificando servidores...', 'blue');
    try {
      await axios.get(FRONTEND_URL);
      log('✅ Frontend disponible', 'green');
    } catch (error) {
      log('❌ Frontend no disponible. Asegúrate de que esté corriendo en puerto 4200', 'red');
      return;
    }
    
    try {
      await axios.get(API_BASE);
      log('✅ Backend disponible', 'green');
    } catch (error) {
      log('⚠️  Backend no disponible. Algunos tests pueden fallar', 'yellow');
    }
    
    // Iniciar navegador
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1280, height: 720 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // Tests de API
    await testAPIs();
    
    // Tests como Cliente
    log('\n' + '='.repeat(60), 'bold');
    log('👤 EJECUTANDO TESTS COMO CLIENTE', 'bold');
    log('='.repeat(60), 'bold');
    
    if (await testLoginCliente(page)) {
      await testNavegacionDashboard(page);
      await testCatalogo(page);
      await testCarrito(page);
      await testPerfil(page);
      await testHistorialPuntos(page);
      await testPromociones(page);
      await testLogout(page);
    }
    
    // Tests como Admin
    log('\n' + '='.repeat(60), 'bold');
    log('👨‍💼 EJECUTANDO TESTS COMO ADMIN', 'bold');
    log('='.repeat(60), 'bold');
    
    if (await testLoginAdmin(page)) {
      await testPanelAdmin(page);
    }
    
    // Generar reporte
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
    
  } catch (error) {
    log(`\n💥 Error durante la ejecución: ${error.message}`, 'red');
    console.error(error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Ejecutar tests
if (require.main === module) {
  ejecutarTests().catch(console.error);
}

module.exports = { ejecutarTests };

