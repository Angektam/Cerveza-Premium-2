# 🧪 INSTRUCCIONES PARA EJECUTAR TESTS COMPLETOS

He creado dos scripts de pruebas completas para testear toda la aplicación:

## 📁 Archivos Creados

1. **`test-completo-e2e.js`** - Tests End-to-End con Puppeteer (interfaz completa)
2. **`test-completo-api.js`** - Tests de APIs del backend (sin interfaz)
3. **`README-TEST-COMPLETO.md`** - Documentación completa

## 🚀 Cómo Ejecutar los Tests

### Paso 1: Iniciar Servidores

**Terminal 1 - Backend:**
```bash
cd backend
node server.js
```

**Terminal 2 - Frontend:**
```bash
npm start
```

### Paso 2: Ejecutar Tests

**Opción A: Tests de APIs (Más rápido, no requiere interfaz)**
```bash
node test-completo-api.js
```

**Opción B: Tests End-to-End (Prueba interfaz completa)**
```bash
node test-completo-e2e.js
```

## 📊 Qué Prueban los Tests

### ✅ Tests de APIs (`test-completo-api.js`)

- ✅ Login de Cliente
- ✅ Login de Admin
- ✅ GET /cervezas-mexicanas
- ✅ GET /cervezas (autenticado)
- ✅ GET /usuarios/me
- ✅ GET /pedidos
- ✅ GET /puntos/:id
- ✅ GET /puntos/transacciones/:id
- ✅ GET /admin/cervezas
- ✅ GET /admin/pedidos
- ✅ GET /admin/usuarios

### ✅ Tests End-to-End (`test-completo-e2e.js`)

**Como Cliente:**
- ✅ Login y autenticación
- ✅ Navegación del dashboard (todos los botones)
- ✅ Catálogo de cervezas
- ✅ Carrito de compras
- ✅ Perfil de usuario
- ✅ Historial de puntos
- ✅ Promociones
- ✅ Logout

**Como Admin:**
- ✅ Login de administrador
- ✅ Panel de administración
- ✅ Gestión de cervezas
- ✅ Gestión de pedidos
- ✅ Gestión de usuarios
- ✅ Reportes

## ⚙️ Configuración de Usuarios de Prueba

Los tests usan estas credenciales por defecto:

**Cliente:**
- Email: `cliente@test.com`
- Password: `Test1234!`

**Admin:**
- Email: `admin@test.com`
- Password: `Admin1234!`

**Para cambiar las credenciales**, edita las constantes al inicio de los archivos de test:

```javascript
const CLIENTE_EMAIL = 'tu-email@cliente.com';
const CLIENTE_PASSWORD = 'TuPassword123!';
const ADMIN_EMAIL = 'tu-email@admin.com';
const ADMIN_PASSWORD = 'TuPassword123!';
```

## 📝 Crear Usuarios de Prueba

Si no tienes estos usuarios, créalos en la base de datos:

```sql
-- Usuario Cliente
INSERT INTO usuarios (nombre_completo, email, password_hash, fecha_nacimiento, tipo_identificacion, numero_identificacion, confirmo_mayor_edad, acepto_terminos, rol, activo)
VALUES ('Cliente Test', 'cliente@test.com', '$2b$10$...', '1990-01-01', 'INE', 'TEST123', TRUE, TRUE, 'cliente', TRUE);

-- Usuario Admin
INSERT INTO usuarios (nombre_completo, email, password_hash, fecha_nacimiento, tipo_identificacion, numero_identificacion, confirmo_mayor_edad, acepto_terminos, rol, activo)
VALUES ('Admin Test', 'admin@test.com', '$2b$10$...', '1990-01-01', 'INE', 'ADMIN123', TRUE, TRUE, 'admin', TRUE);
```

**Nota:** Necesitas generar los hashes de contraseña con bcrypt. Puedes usar el script `backend/reset-password-manual.js` o crear los usuarios desde la interfaz de registro.

## 🎯 Resultados Esperados

Los tests mostrarán:
- ✅ **Verde**: Test exitoso
- ❌ **Rojo**: Test fallido
- 📈 **Tasa de éxito**: Porcentaje de tests que pasaron

### Ejemplo de Salida Exitosa:

```
🧪 TEST COMPLETO DE APIs - Cerveza Premium
============================================================

🔍 Verificando servidor...
✅ Backend disponible

🍺 Tests de Cervezas...
✅ [CERVEZAS] GET /cervezas-mexicanas: 15 cervezas encontradas

👤 Tests como Cliente...
✅ [AUTH] Login Cliente: Token recibido
✅ [CERVEZAS] GET /cervezas: 15 cervezas encontradas
✅ [USUARIOS] GET /usuarios/me: Usuario: Cliente Test
✅ [PEDIDOS] GET /pedidos: 3 pedidos encontrados
✅ [PUNTOS] GET /puntos/:id: Puntos: 150
✅ [PUNTOS] GET /puntos/transacciones/:id: 5 transacciones

👨‍💼 Tests como Admin...
✅ [AUTH] Login Admin: Token recibido
✅ [ADMIN] GET /admin/cervezas: 15 cervezas
✅ [ADMIN] GET /admin/pedidos: 10 pedidos
✅ [ADMIN] GET /admin/usuarios: 5 usuarios

📊 REPORTE FINAL
============================================================
Total de tests: 12
✅ Exitosos: 12
❌ Fallidos: 0
📈 Tasa de éxito: 100%

🎉 ¡Todos los tests pasaron exitosamente!
```

## 🔧 Solución de Problemas

### Error: "Backend no disponible"
- Verifica que el backend esté corriendo: `cd backend && node server.js`
- Verifica que el puerto 3000 esté libre

### Error: "Frontend no disponible" (solo en E2E)
- Verifica que el frontend esté corriendo: `npm start`
- Verifica que el puerto 4200 esté libre

### Error: "Login fallido"
- Verifica que los usuarios de prueba existan en la base de datos
- Verifica las credenciales en los archivos de test
- Verifica que los usuarios estén activos (`activo = TRUE`)

### Error: "Puppeteer no encontrado"
```bash
npm install puppeteer --save-dev --legacy-peer-deps
```

## 📚 Más Información

Para más detalles, consulta:
- `README-TEST-COMPLETO.md` - Documentación completa de los tests E2E
- `test-completo-funcionalidades.js` - Tests funcionales existentes

