# 🚀 Guía Completa de Despliegue en Netlify

Esta guía detalla cómo desplegar tu aplicación **ArribaElAmerica** completamente en Netlify (frontend Angular + backend con Netlify Functions o servicios externos).

## 📊 Resumen Rápido

| Componente | Solución Netlify | Costo |
|------------|------------------|-------|
| **Frontend (Angular)** | Netlify Hosting | Gratis (100GB/mes) |
| **Backend (Node.js)** | Netlify Functions + Servicios externos | Gratis - $19/mes |
| **Base de Datos (MySQL)** | PlanetScale, Supabase, o Railway | Gratis - $15/mes |

---

## 🎨 Frontend (Angular) en Netlify

### ✅ Configuración Completa

**Ventajas:**
- ✅ Gratis (100GB bandwidth/mes en plan gratuito)
- ✅ Deploy automático desde GitHub
- ✅ SSL automático
- ✅ CDN global
- ✅ Deploy previews para Pull Requests
- ✅ Formularios integrados
- ✅ Funciones serverless
- ✅ URL personalizada: `tu-app.netlify.app`

**Desventajas:**
- ⚠️ Límites en plan gratuito (100GB bandwidth/mes)
- ⚠️ Build time limitado (300 min/mes en plan gratuito)

### 📋 Configuración

El archivo `netlify.toml` ya está configurado en la raíz del proyecto con:

```toml
[build]
  command = "npm run build"
  publish = "dist/arriba-el-america/browser"

# Redirecciones para SPA (Single Page Application)
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# Headers de seguridad
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

# Cache para assets
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### 🚀 Despliegue Paso a Paso

1. **Prepara tu repositorio:**
   - Asegúrate de que tu código esté en GitHub
   - El archivo `netlify.toml` ya está configurado

2. **Conecta con Netlify:**
   - Ve a [netlify.com](https://netlify.com)
   - Haz clic en "Sign up" o "Log in"
   - Selecciona "Sign up with GitHub" para conectar tu cuenta

3. **Crea un nuevo sitio:**
   - Haz clic en "Add new site" > "Import an existing project"
   - Selecciona "GitHub" como proveedor
   - Autoriza a Netlify a acceder a tus repositorios
   - Selecciona el repositorio `ArribaElAmerica`

4. **Configura el build:**
   Netlify detectará automáticamente la configuración desde `netlify.toml`:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist/arriba-el-america/browser`
   - **Base directory:** (dejar vacío, es la raíz)

5. **Variables de entorno (opcional):**
   Si necesitas variables de entorno para el build:
   - Ve a "Site settings" > "Environment variables"
   - Agrega las variables necesarias:
     - `NODE_VERSION=18` (para especificar la versión de Node.js)
     - `NPM_FLAGS=--legacy-peer-deps` (si tienes problemas con dependencias)
     - `API_URL=https://tu-backend.netlify.app/.netlify/functions/api` (si usas Netlify Functions)

6. **Despliega:**
   - Haz clic en "Deploy site"
   - Netlify comenzará a construir y desplegar tu aplicación
   - Espera 2-5 minutos

7. **¡Listo!**
   - Tu aplicación estará disponible en: `https://tu-app-random.netlify.app`
   - Puedes cambiar el nombre en "Site settings" > "Change site name"

### 🔄 Deploy Automático

Netlify se conecta automáticamente a GitHub y despliega cada vez que haces push:

- **Push a `main` o `master`:** Deploy automático a producción
- **Pull Requests:** Deploy preview automático con URL única

Puedes configurar esto en "Site settings" > "Build & deploy" > "Continuous Deployment".

---

## ⚙️ Backend (Node.js/Express) - Opciones con Netlify

### Opción 1: Netlify Functions (Recomendado para APIs simples) ⭐

Netlify Functions permite crear funciones serverless que actúan como endpoints de API.

**Ventajas:**
- ✅ Gratis (125,000 requests/mes en plan gratuito)
- ✅ Integrado con Netlify
- ✅ Sin servidor que mantener
- ✅ Escala automáticamente

**Desventajas:**
- ⚠️ Timeout de 10 segundos (plan gratuito) o 26 segundos (plan Pro)
- ⚠️ Requiere refactorizar el código para funciones serverless
- ⚠️ No soporta conexiones persistentes (WebSockets, etc.)

**Cómo implementar:**

1. **Crear estructura de funciones:**
```bash
mkdir -p netlify/functions
```

2. **Crear función de ejemplo (`netlify/functions/api.js`):**
```javascript
const mysql = require('mysql2/promise');

exports.handler = async (event, context) => {
  // Solo permitir métodos específicos
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Manejar preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Tu lógica de API aquí
    const path = event.path.replace('/.netlify/functions/api', '');
    
    // Ejemplo: endpoint de cervezas
    if (path === '/cervezas' && event.httpMethod === 'GET') {
      // Conectar a base de datos
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
      });

      const [rows] = await connection.execute('SELECT * FROM cervezas');
      await connection.end();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(rows)
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not found' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

3. **Actualizar `netlify.toml`:**
```toml
[build]
  command = "npm run build"
  publish = "dist/arriba-el-america/browser"
  functions = "netlify/functions"

# Redirecciones para API
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api"
  status = 200
  force = true
```

4. **Variables de entorno:**
   - Ve a "Site settings" > "Environment variables"
   - Agrega las variables de base de datos:
     - `DB_HOST`
     - `DB_USER`
     - `DB_PASSWORD`
     - `DB_NAME`
     - `JWT_SECRET`

5. **Actualizar frontend:**
   En `src/app/services/database.service.ts`:
   ```typescript
   private apiUrl = 'https://tu-app.netlify.app/.netlify/functions/api';
   ```

### Opción 2: Backend Separado (Recomendado para aplicaciones complejas)

Para aplicaciones con lógica compleja, es mejor desplegar el backend en un servicio separado.

#### 2.1 Railway (Recomendado) ⭐

**Ventajas:**
- ✅ $5 crédito gratis/mes
- ✅ Muy fácil de usar
- ✅ Soporta MySQL
- ✅ Deploy automático desde GitHub
- ✅ SSL automático

**Cómo desplegar:**

1. **Crear `railway.json` en `backend/`:**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node server.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

2. **En Railway:**
   - Ve a [railway.app](https://railway.app)
   - Conecta tu repositorio
   - Selecciona el directorio `backend/`
   - Agrega variables de entorno desde `backend/env.example`
   - Railway detecta Node.js automáticamente
   - ¡Deploy automático!

3. **Configurar CORS:**
   En las variables de entorno de Railway:
   ```env
   CORS_ORIGIN=https://tu-app.netlify.app
   ```

4. **Actualizar frontend:**
   En `src/app/services/database.service.ts`:
   ```typescript
   private apiUrl = 'https://tu-backend.railway.app/api';
   ```

#### 2.2 Render

**Ventajas:**
- ✅ Plan gratuito disponible
- ✅ Deploy automático desde GitHub
- ✅ SSL automático
- ✅ Soporta MySQL

**Desventajas:**
- ⚠️ Plan gratuito se "duerme" después de 15 min de inactividad

**Cómo desplegar:**

1. **Crear `render.yaml` en la raíz:**
```yaml
services:
  - type: web
    name: arriba-el-america-backend
    env: node
    buildCommand: cd backend && npm install
    startCommand: cd backend && node server.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 4000
      - key: CORS_ORIGIN
        value: https://tu-app.netlify.app
```

2. **En Render:**
   - Ve a [render.com](https://render.com)
   - Conecta tu repositorio
   - Selecciona "Web Service"
   - Configura:
     - Root Directory: `backend`
     - Build Command: `npm install`
     - Start Command: `node server.js`
   - Agrega variables de entorno
   - ¡Deploy!

3. **Actualizar frontend:**
   En `src/app/services/database.service.ts`:
   ```typescript
   private apiUrl = 'https://tu-backend.onrender.com/api';
   ```

---

## 🗄️ Base de Datos (MySQL) - Opciones Compatibles con Netlify

### 1. PlanetScale (Recomendado) ⭐

**Ventajas:**
- ✅ Plan gratuito generoso
- ✅ MySQL compatible
- ✅ Branching de base de datos
- ✅ Muy fácil de usar
- ✅ Funciona perfectamente con Netlify Functions y servicios externos

**Cómo usar:**
1. Ve a [planetscale.com](https://planetscale.com)
2. Crea una base de datos
3. Obtén la URL de conexión
4. Úsala en tus variables de entorno (Netlify o Railway/Render)

**URL de conexión ejemplo:**
```
mysql://usuario:password@host.planetscale.com/database?sslaccept=strict
```

### 2. Supabase (Alternativa con PostgreSQL)

**Ventajas:**
- ✅ Plan gratuito generoso
- ✅ PostgreSQL (más moderno que MySQL)
- ✅ API REST automática
- ✅ Dashboard completo

**Cómo usar:**
1. Ve a [supabase.com](https://supabase.com)
2. Crea un proyecto
3. Obtén la URL de conexión
4. Usa la API REST o conecta directamente

### 3. Railway MySQL

**Ventajas:**
- ✅ Integrado con Railway
- ✅ Muy fácil si usas Railway para el backend

**Cómo usar:**
- En Railway, agrega un servicio MySQL
- Railway te da la URL automáticamente

---

## 🔧 Configuración Post-Despliegue

### 1. Actualizar URLs en el Frontend

Después de desplegar el backend, actualiza `src/app/services/database.service.ts`:

**Opción A: Netlify Functions**
```typescript
private apiUrl = 'https://tu-app.netlify.app/.netlify/functions/api';
```

**Opción B: Backend en Railway**
```typescript
private apiUrl = 'https://tu-backend.railway.app/api';
```

**Opción C: Backend en Render**
```typescript
private apiUrl = 'https://tu-backend.onrender.com/api';
```

**Mejor opción: Usar variables de entorno**

1. **Crear `src/environments/environment.prod.ts`:**
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://tu-backend.railway.app/api'
  // O para Netlify Functions:
  // apiUrl: 'https://tu-app.netlify.app/.netlify/functions/api'
};
```

2. **Actualizar `database.service.ts`:**
```typescript
import { environment } from '../environments/environment';

export class DatabaseService {
  private apiUrl = environment.apiUrl;
  // ...
}
```

3. **Actualizar `angular.json`:**
```json
"configurations": {
  "production": {
    "fileReplacements": [
      {
        "replace": "src/environments/environment.ts",
        "with": "src/environments/environment.prod.ts"
      }
    ]
  }
}
```

### 2. Configurar CORS en el Backend

Si usas un backend separado, actualiza `CORS_ORIGIN` en las variables de entorno:

**Para Railway:**
```env
CORS_ORIGIN=https://tu-app.netlify.app
```

**Para Render:**
```env
CORS_ORIGIN=https://tu-app.netlify.app
```

**Para Netlify Functions:**
Las funciones ya incluyen headers CORS en el código.

### 3. Variables de Entorno en Netlify

Configura todas las variables necesarias en Netlify:

1. Ve a "Site settings" > "Environment variables"
2. Agrega las variables:

**Para el build:**
```env
NODE_VERSION=18
NPM_FLAGS=--legacy-peer-deps
```

**Para Netlify Functions (si las usas):**
```env
DB_HOST=tu-host
DB_USER=root
DB_PASSWORD=tu-password
DB_NAME=cerveza_premium
JWT_SECRET=tu-secreto-super-seguro
JWT_EXPIRE=24h
```

**Para el frontend (si usas variables de entorno):**
```env
API_URL=https://tu-backend.railway.app/api
```

---

## 🎯 Recomendación Final para Netlify

### Opción Recomendada (Todo en Netlify + Servicios Externos):

- **Frontend:** Netlify Hosting ✅
- **Backend:** Railway o Render (más flexible que Netlify Functions)
- **Base de Datos:** PlanetScale (gratis y MySQL compatible)

**Por qué:**
- Netlify es excelente para el frontend
- Railway/Render son mejores para backends complejos con Express
- PlanetScale ofrece MySQL gratuito y fácil de usar

### Opción Todo en Netlify:

- **Frontend:** Netlify Hosting ✅
- **Backend:** Netlify Functions (si tu API es simple)
- **Base de Datos:** PlanetScale o Supabase

**Por qué:**
- Todo en un solo lugar
- Netlify Functions es suficiente para APIs simples
- Requiere refactorizar el código Express a funciones serverless

---

## 📚 Recursos Adicionales

- [Documentación de Netlify](https://docs.netlify.com)
- [Netlify Functions](https://docs.netlify.com/functions/overview/)
- [Netlify CLI](https://cli.netlify.com)
- [Guía de Netlify para Angular](docs/NETLIFY-SETUP.md)
- [Documentación de Railway](https://docs.railway.app)
- [Documentación de Render](https://render.com/docs)
- [Documentación de PlanetScale](https://planetscale.com/docs)

---

## ❓ ¿Necesitas Ayuda?

Si tienes problemas con el despliegue en Netlify, revisa:

1. **Los logs de deploy:**
   - Ve a "Deploys" > selecciona el deploy > "Deploy log"
   - Busca errores en rojo

2. **Variables de entorno:**
   - Verifica que estén configuradas correctamente
   - Asegúrate de que los nombres coincidan exactamente

3. **URLs de CORS:**
   - Verifica que coincidan con tu dominio de Netlify
   - Incluye el protocolo `https://`

4. **Base de datos:**
   - Verifica que la base de datos esté accesible
   - Revisa las credenciales de conexión

5. **Consulta la guía detallada:**
   - Revisa `docs/NETLIFY-SETUP.md` para más detalles

---

## ✅ Checklist de Despliegue en Netlify

- [ ] Código en GitHub
- [ ] Archivo `netlify.toml` creado y configurado
- [ ] Cuenta de Netlify creada
- [ ] Repositorio conectado a Netlify
- [ ] Build configurado correctamente
- [ ] Variables de entorno configuradas (si es necesario)
- [ ] Backend desplegado (Railway/Render o Netlify Functions)
- [ ] Base de datos configurada (PlanetScale, etc.)
- [ ] CORS configurado en el backend
- [ ] URLs actualizadas en el frontend
- [ ] Sitio desplegado y funcionando
- [ ] Nombre del sitio personalizado (opcional)
- [ ] Dominio personalizado configurado (opcional)

¡Tu aplicación debería estar funcionando completamente en Netlify! 🎉
