# 🧪 Test Completo End-to-End - Cerveza Premium

Este script realiza pruebas completas de todas las funcionalidades de la aplicación, tanto como **Cliente** como **Administrador**.

## 📋 Requisitos

1. **Frontend corriendo**: `npm start` (puerto 4200)
2. **Backend corriendo**: `cd backend && node server.js` (puerto 3000)
3. **Base de datos configurada** con usuarios de prueba

## 🚀 Instalación

```bash
# Instalar Puppeteer si no está instalado
npm install puppeteer --save-dev
```

## ▶️ Ejecución

```bash
# Ejecutar todos los tests
node test-completo-e2e.js
```

## 📊 Qué Prueba

### 👤 Como Cliente

1. **Login de Cliente**
   - ✅ Carga de vista de login
   - ✅ Autenticación exitosa
   - ✅ Redirección al dashboard

2. **Navegación del Dashboard**
   - ✅ Ver Catálogo
   - ✅ Mi Carrito
   - ✅ Mis Pedidos
   - ✅ Mi Perfil
   - ✅ Mis Favoritos
   - ✅ Historial de Puntos
   - ✅ Mis Direcciones
   - ✅ Notificaciones
   - ✅ Configuración
   - ✅ Promociones
   - ✅ Recomendaciones

3. **Catálogo de Cervezas**
   - ✅ Carga de vista de catálogo
   - ✅ Visualización de cervezas

4. **Carrito de Compras**
   - ✅ Carga de vista de carrito

5. **Perfil de Usuario**
   - ✅ Carga de vista de perfil

6. **Historial de Puntos**
   - ✅ Apertura de modal
   - ✅ Cierre de modal

7. **Promociones**
   - ✅ Apertura de modal
   - ✅ Cierre de modal

8. **Logout**
   - ✅ Cierre de sesión
   - ✅ Redirección a login

### 👨‍💼 Como Administrador

1. **Login de Admin**
   - ✅ Acceso al panel de administración
   - ✅ Autenticación exitosa

2. **Panel de Administración**
   - ✅ Gestión de Cervezas
   - ✅ Gestión de Pedidos
   - ✅ Gestión de Usuarios
   - ✅ Reportes

### 🔌 APIs del Backend

1. **GET /cervezas-mexicanas**
   - ✅ Endpoint disponible
   - ✅ Retorna lista de cervezas

2. **POST /auth/login**
   - ✅ Endpoint disponible
   - ✅ Autenticación funciona

## 📝 Configuración de Usuarios de Prueba

Asegúrate de tener estos usuarios en la base de datos:

### Cliente
- **Email**: `cliente@test.com`
- **Password**: `Test1234!`
- **Rol**: `cliente`

### Admin
- **Email**: `admin@test.com`
- **Password**: `Admin1234!`
- **Rol**: `admin`

Puedes modificar las credenciales en el archivo `test-completo-e2e.js`:

```javascript
const CLIENTE_EMAIL = 'tu-email@cliente.com';
const CLIENTE_PASSWORD = 'TuPassword123!';
const ADMIN_EMAIL = 'tu-email@admin.com';
const ADMIN_PASSWORD = 'TuPassword123!';
```

## 📊 Interpretación de Resultados

El script mostrará:
- ✅ **Verde**: Test exitoso
- ❌ **Rojo**: Test fallido
- 📈 **Tasa de éxito**: Porcentaje de tests que pasaron

### Ejemplo de Salida

```
🧪 TEST COMPLETO END-TO-END - Cerveza Premium
============================================================

🔍 Verificando servidores...
✅ Frontend disponible
✅ Backend disponible

👤 EJECUTANDO TESTS COMO CLIENTE
============================================================
✅ [CLIENTE] Login - Vista: Vista de login cargada
✅ [CLIENTE] Login - Autenticación: Login exitoso
✅ [CLIENTE] Botón Ver Catálogo: Funciona correctamente
...

👨‍💼 EJECUTANDO TESTS COMO ADMIN
============================================================
✅ [ADMIN] Login: Login de admin exitoso
✅ [ADMIN] Panel - Vista: Panel de admin cargado
...

📊 REPORTE FINAL
============================================================
Total de tests: 25
✅ Exitosos: 23
❌ Fallidos: 2
📈 Tasa de éxito: 92%
```

## 🔧 Solución de Problemas

### Error: "Frontend no disponible"
- Verifica que `npm start` esté corriendo
- Verifica que el puerto 4200 esté libre

### Error: "Backend no disponible"
- Verifica que el servidor backend esté corriendo
- Verifica que el puerto 3000 esté libre

### Error: "Login fallido"
- Verifica que los usuarios de prueba existan en la base de datos
- Verifica las credenciales en el archivo de test

### Error: "Puppeteer no encontrado"
```bash
npm install puppeteer --save-dev
```

## 📝 Notas

- El navegador se abre en modo visible (`headless: false`) para que puedas ver las pruebas
- Los tests incluyen delays para esperar que las páginas carguen
- Si algún test falla, revisa la consola del navegador para más detalles

