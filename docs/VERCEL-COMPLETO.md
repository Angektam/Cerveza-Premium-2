# 🚀 Desplegar Todo en Vercel (Frontend + Backend)

Esta guía explica cómo desplegar **todo** (frontend Angular + backend API) en Vercel usando Serverless Functions.

## 📋 Resumen

- **Frontend:** Vercel Hosting (Angular)
- **Backend:** Vercel Serverless Functions (API Routes)
- **Base de Datos:** Externa (Railway MySQL, PlanetScale, etc.)

## ⚙️ Configuración

### 1. Estructura del Proyecto

Vercel usa la carpeta `api/` para las funciones serverless. Ya está configurada:

```
ArribaElAmerica/
├── api/                    # Serverless Functions (Backend)
│   ├── auth/
│   │   ├── health.js      # Health check
│   │   └── login.js       # Login endpoint
│   └── _lib/
│       └── db.js          # Utilidad de base de datos
├── src/                    # Frontend Angular
├── vercel.json            # Configuración de Vercel
└── package.json
```

### 2. Configuración de `vercel.json`

El archivo `vercel.json` ya está configurado con:
- Build command para Angular
- Rewrites para API routes
- Headers de seguridad
- Configuración de funciones

### 3. Variables de Entorno en Vercel

**IMPORTANTE:** Configura estas variables en Vercel:

1. **Ve a tu proyecto en Vercel:**
   - [vercel.com](https://vercel.com)
   - Selecciona tu proyecto
   - Settings → Environment Variables

2. **Agrega estas variables:**

```env
# Base de datos
DB_HOST=tu-host-mysql
DB_USER=root
DB_PASSWORD=tu-password
DB_NAME=cerveza_premium
DB_PORT=3306

# Seguridad
JWT_SECRET=tu-secreto-super-seguro-minimo-32-caracteres
JWT_EXPIRE=24h

# CORS (no necesario, mismo dominio)
CORS_ORIGIN=*
```

### 4. Actualizar URL del Backend

El archivo `src/environments/environment.prod.ts` ya está configurado para usar rutas relativas:

```typescript
export const environment = {
  production: true,
  apiUrl: '/api'  // Rutas relativas, mismo dominio
};
```

## 🚀 Despliegue

### Opción 1: Desde GitHub (Recomendado)

1. **Conecta tu repositorio en Vercel:**
   - Ve a [vercel.com](https://vercel.com)
   - "Add New Project"
   - Conecta tu repositorio de GitHub
   - Selecciona el proyecto `ArribaElAmerica`

2. **Configura el proyecto:**
   - **Framework Preset:** Angular
   - **Root Directory:** (dejar vacío)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist/arriba-el-america/browser`
   - **Install Command:** `npm install`

3. **Agrega variables de entorno:**
   - Ve a Settings → Environment Variables
   - Agrega todas las variables necesarias (ver arriba)

4. **Despliega:**
   - Haz clic en "Deploy"
   - Vercel construirá y desplegará automáticamente

### Opción 2: Desde Vercel CLI

1. **Instalar Vercel CLI:**
```bash
npm i -g vercel
```

2. **Iniciar sesión:**
```bash
vercel login
```

3. **Desplegar:**
```bash
vercel
```

4. **Configurar variables de entorno:**
```bash
vercel env add DB_HOST
vercel env add DB_USER
# ... etc
```

5. **Desplegar a producción:**
```bash
vercel --prod
```

## 📝 Agregar Más Endpoints

Para agregar más endpoints, crea archivos en `api/`:

### Ejemplo: Registrar Usuario

**Crear `api/auth/register.js`:**

```javascript
const { getPool } = require('../_lib/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, nombre_completo } = req.body;
    
    const pool = getPool();
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const [result] = await pool.execute(
      'INSERT INTO usuarios (email, password, nombre_completo) VALUES (?, ?, ?)',
      [email, hashedPassword, nombre_completo]
    );

    const token = jwt.sign(
      { id: result.insertId, email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );

    res.json({ user: { id: result.insertId, email, nombre_completo }, token });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error interno' });
  }
};
```

**La ruta será:** `POST /api/auth/register`

## 🔍 Estructura de API Routes en Vercel

Vercel mapea archivos así:

```
api/
├── auth/
│   ├── health.js    → GET /api/auth/health
│   ├── login.js     → POST /api/auth/login
│   └── register.js  → POST /api/auth/register
└── cervezas/
    └── index.js     → GET /api/cervezas
```

## ⚠️ Limitaciones de Vercel Functions

1. **Timeout:**
   - Plan Gratis: 10 segundos máximo
   - Plan Pro: 60 segundos máximo
   - Plan Enterprise: Configurable

2. **Conexiones de Base de Datos:**
   - No mantener conexiones persistentes
   - Crear conexiones bajo demanda (ya implementado)
   - Usar connection pooling

3. **Estado:**
   - Las funciones son stateless
   - No guardar estado entre requests
   - Usar base de datos para estado persistente

4. **Tamaño:**
   - Límite de 50MB por función (incluye node_modules)
   - Considerar optimizar dependencias

## 🔧 Solución de Problemas

### Error: "Function not found"

**Causa:** La estructura de archivos no es correcta.

**Solución:**
- Verifica que los archivos estén en `api/`
- Verifica la estructura de rutas
- Revisa `vercel.json`

### Error: "Database connection failed"

**Causa:** Variables de entorno no configuradas o incorrectas.

**Solución:**
1. Verifica que todas las variables DB_* estén en Vercel
2. Verifica que la base de datos permita conexiones externas
3. Revisa los logs de Vercel

### Error: "Function timeout"

**Causa:** La función tarda más de 10 segundos (plan gratuito).

**Solución:**
1. Optimiza las queries a la base de datos
2. Considera usar índices en la base de datos
3. Upgrade al plan Pro (60 segundos)

### Las rutas no funcionan

**Causa:** `vercel.json` no está configurado correctamente.

**Solución:**
1. Verifica que `vercel.json` tenga los rewrites correctos
2. Verifica que la estructura de `api/` sea correcta
3. Re-despliega después de cambios

## 📚 Migrar Endpoints del Backend

Para migrar endpoints de `backend/server.js` a Vercel Functions:

1. **Identifica la ruta:** Ej: `POST /api/cervezas`
2. **Crea el archivo:** `api/cervezas.js`
3. **Copia la lógica:** Adapta el código a formato serverless
4. **Usa la utilidad de DB:** `const { getPool } = require('../_lib/db')`
5. **Exporta la función:** `module.exports = async (req, res) => { ... }`

## ✅ Checklist de Despliegue

- [ ] Proyecto conectado en Vercel
- [ ] `vercel.json` configurado correctamente
- [ ] Variables de entorno configuradas en Vercel
- [ ] `environment.prod.ts` usa `/api` (rutas relativas)
- [ ] Endpoints básicos creados en `api/`
- [ ] Base de datos externa configurada y accesible
- [ ] Proyecto desplegado correctamente
- [ ] Health check funciona: `/api/auth/health`
- [ ] Login funciona: `POST /api/auth/login`

## 🎯 Ventajas de Vercel

- ✅ Todo en un solo lugar
- ✅ Despliegue automático desde GitHub
- ✅ SSL automático
- ✅ CDN global
- ✅ Sin servidor que mantener
- ✅ Escala automáticamente
- ✅ Logs integrados

## 📖 Recursos Adicionales

- [Documentación de Vercel Functions](https://vercel.com/docs/functions)
- [Guía de API Routes](https://vercel.com/docs/functions/serverless-functions/runtimes/node-js)
- [Variables de Entorno en Vercel](https://vercel.com/docs/concepts/projects/environment-variables)

---

**¡Con esto tendrás todo funcionando en Vercel!** 🎉
