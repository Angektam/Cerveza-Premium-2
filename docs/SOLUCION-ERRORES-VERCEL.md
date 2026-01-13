# 🔧 Solución de Errores en Vercel

Esta guía ayuda a resolver errores comunes cuando despliegas en Vercel.

## 🚨 Error 500 en `/api/auth/login`

### Causas Posibles:

1. **Variables de entorno no configuradas**
2. **Error de conexión a la base de datos**
3. **Campo de contraseña incorrecto en la base de datos**

### Solución:

#### 1. Verificar Variables de Entorno en Vercel

Ve a Vercel → Tu Proyecto → Settings → Environment Variables

**Asegúrate de tener estas variables:**
```env
DB_HOST=tu-host-mysql
DB_USER=root
DB_PASSWORD=tu-password
DB_NAME=cerveza_premium
DB_PORT=3306
JWT_SECRET=tu-secreto-super-seguro-minimo-32-caracteres
JWT_EXPIRE=24h
```

#### 2. Verificar la Estructura de la Base de Datos

El código del login busca el campo `password_hash` o `password`. Verifica en tu base de datos:

```sql
DESCRIBE usuarios;
```

**Si el campo se llama `password`:**
- El código ya está preparado para ambos casos
- Debería funcionar automáticamente

**Si el campo se llama `password_hash`:**
- El código también lo maneja
- Debería funcionar

#### 3. Revisar los Logs de Vercel

1. Ve a Vercel → Tu Proyecto → Deployments
2. Haz clic en el deployment más reciente
3. Ve a "Functions" → `/api/auth/login`
4. Revisa los logs para ver el error exacto

#### 4. Probar la Conexión a la Base de Datos

Crea un endpoint de prueba temporal:

**`api/test-db.js`:**
```javascript
const mysql = require('mysql2/promise');

module.exports = async (req, res) => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT) || 3306
    });
    
    await connection.execute('SELECT 1');
    await connection.end();
    
    res.json({ 
      status: 'ok', 
      message: 'Conexión a base de datos exitosa',
      db_host: process.env.DB_HOST,
      db_name: process.env.DB_NAME
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
```

Luego prueba: `https://tu-app.vercel.app/api/test-db`

---

## 🚨 Error 401 en `manifest.webmanifest`

### Causa:

Vercel puede estar bloqueando el acceso a archivos estáticos o el archivo no se está copiando correctamente durante el build.

### Solución:

#### Opción 1: Verificar que el archivo se copie en el build

El `manifest.webmanifest` debe estar en `src/` y Angular lo copiará automáticamente si está en `assets`.

**Verifica en `angular.json`:**
```json
"assets": [
  "src/favicon.ico",
  "src/assets",
  "src/manifest.webmanifest"
]
```

#### Opción 2: Crear una función serverless para el manifest

Si el problema persiste, crea `api/manifest.js`:

```javascript
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json');
  res.json({
    "name": "ArribaElAmerica",
    "short_name": "ArribaElAmerica",
    "theme_color": "#1976d2",
    "background_color": "#fafafa",
    "display": "standalone",
    "scope": "./",
    "start_url": "./",
    "icons": [
      // ... tus iconos
    ]
  });
};
```

Luego actualiza `index.html` para apuntar a `/api/manifest`.

#### Opción 3: Ignorar el error (no crítico)

El error del manifest no afecta la funcionalidad principal. Puedes ignorarlo si la aplicación funciona correctamente.

---

## 🔍 Cómo Revisar Logs en Vercel

1. **Ve a tu proyecto en Vercel**
2. **Deployments** → Selecciona el deployment más reciente
3. **Functions** → Selecciona la función que falla (ej: `/api/auth/login`)
4. **Logs** → Verás los errores detallados

### Información Útil en los Logs:

- **Errores de conexión a BD:** Verás "ECONNREFUSED" o "Access denied"
- **Variables faltantes:** Verás "undefined" en los valores
- **Errores de SQL:** Verás el error de MySQL específico
- **Timeouts:** Verás "Function execution exceeded"

---

## ✅ Checklist de Verificación

Antes de reportar un error, verifica:

- [ ] Variables de entorno configuradas en Vercel
- [ ] Base de datos accesible desde internet (no solo localhost)
- [ ] Credenciales de base de datos correctas
- [ ] JWT_SECRET configurado (mínimo 32 caracteres)
- [ ] Revisaste los logs de Vercel para el error específico
- [ ] El health check funciona: `/api/auth/health`
- [ ] La base de datos tiene la tabla `usuarios`
- [ ] La tabla `usuarios` tiene los campos correctos

---

## 🆘 Si Nada Funciona

1. **Comparte los logs completos:**
   - Vercel → Functions → `/api/auth/login` → Logs
   - Copia los últimos 50-100 líneas

2. **Verifica que funcione localmente:**
   ```bash
   cd backend
   node server.js
   ```
   - Si funciona localmente, el problema está en Vercel
   - Si no funciona localmente, el problema está en el código

3. **Prueba el endpoint de test:**
   - Crea `api/test-db.js` (código arriba)
   - Prueba: `https://tu-app.vercel.app/api/test-db`
   - Esto te dirá si el problema es la conexión a BD

---

**¿Necesitas más ayuda?** Comparte los logs específicos de Vercel y te ayudo a identificar el problema exacto.
