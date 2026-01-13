# 🚨 Solución: Error 504 Gateway Timeout

Si ves este error:
```
Http failure response for https://cerveza-premium-2-production.up.railway.app/api/auth/login: 504 Gateway Timeout
```

Esto significa que tu backend en Railway **no está respondiendo**. Aquí te explicamos cómo solucionarlo.

## 🔍 Causas Posibles

1. **Backend no está corriendo** - El servicio se detuvo o falló
2. **Error en el código** - Hay un error que impide que el servidor inicie
3. **Base de datos no conectada** - El servidor no puede conectarse a MySQL
4. **Variables de entorno faltantes** - Faltan configuraciones necesarias
5. **Puerto incorrecto** - El servidor está escuchando en un puerto diferente

## ✅ Solución Paso a Paso

### Paso 1: Verificar el Estado del Servicio en Railway

1. **Ve a Railway:**
   - Abre [railway.app](https://railway.app)
   - Selecciona tu proyecto
   - Haz clic en tu servicio de backend

2. **Verifica el estado:**
   - Debe estar en estado **"Active"** o **"Running"**
   - Si está en **"Failed"** o **"Stopped"**, hay un problema

3. **Revisa los logs:**
   - Ve a la pestaña **"Logs"**
   - Busca errores en rojo
   - Los logs te dirán qué está fallando

### Paso 2: Verificar Variables de Entorno

Asegúrate de que estas variables estén configuradas en Railway:

#### Variables Obligatorias:
```env
# Base de datos
DB_HOST=tu-host
DB_USER=root
DB_PASSWORD=tu-password
DB_NAME=cerveza_premium
DB_PORT=3306

# Servidor
PORT=4000
NODE_ENV=production

# Seguridad
JWT_SECRET=tu-secreto-super-seguro-minimo-32-caracteres
JWT_EXPIRE=24h

# CORS
CORS_ORIGIN=https://cerveza-premium-2.vercel.app,https://verdant-heliotrope-257e65.netlify.app,http://localhost:4200
```

**Para agregar variables en Railway:**
1. Ve a Settings → Variables
2. Agrega cada variable de entorno
3. Haz clic en "Save"
4. Railway reiniciará el servicio automáticamente

### Paso 3: Verificar la Conexión a la Base de Datos

El error más común es que la base de datos no está conectada:

1. **En Railway, verifica:**
   - ¿Tienes un servicio MySQL agregado?
   - ¿Está corriendo?
   - ¿Las variables `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` son correctas?

2. **Si no tienes base de datos:**
   - En Railway, agrega un servicio MySQL
   - Railway te dará las variables de conexión automáticamente
   - Actualiza las variables de entorno del backend con estos valores

### Paso 4: Verificar los Logs para Errores Específicos

**Errores comunes y soluciones:**

#### Error: "Cannot connect to database"
**Solución:** 
- Verifica que el servicio MySQL esté corriendo
- Verifica que las credenciales de DB sean correctas
- Asegúrate de que `DB_HOST` apunte a la URL correcta de Railway MySQL

#### Error: "Port already in use" o "EADDRINUSE"
**Solución:**
- Railway asigna el puerto automáticamente a través de `PORT`
- Asegúrate de que tu código use `process.env.PORT` y no un puerto hardcodeado
- Verifica que no tengas `PORT=4000` hardcodeado en el código

#### Error: "Missing required environment variables"
**Solución:**
- Revisa los logs para ver qué variable falta
- Agrega todas las variables necesarias en Railway

#### Error: "Module not found" o errores de dependencias
**Solución:**
- Verifica que `package.json` esté en el directorio correcto
- Asegúrate de que Railway esté ejecutando `npm install` correctamente
- Revisa que el directorio raíz del servicio sea `backend/`

### Paso 5: Verificar la Configuración del Servicio

En Railway, verifica:

1. **Root Directory:**
   - Debe ser `backend` (no la raíz del proyecto)
   - Settings → Root Directory → `backend`

2. **Start Command:**
   - Debe ser: `node server.js`
   - Settings → Start Command → `node server.js`

3. **Build Command (si es necesario):**
   - Normalmente no necesitas build para Node.js
   - Pero si tienes TypeScript, podría ser: `npm install`

### Paso 6: Probar el Backend Localmente

Antes de desplegar, prueba que funciona localmente:

1. **Configura `.env` local:**
```bash
cd backend
cp env.example .env
# Edita .env con tus valores
```

2. **Inicia el servidor:**
```bash
npm install
node server.js
```

3. **Prueba:**
```bash
curl http://localhost:4000/api/auth/health
```

Si funciona localmente pero no en Railway, el problema es la configuración de Railway.

### Paso 7: Reiniciar el Servicio

1. **En Railway:**
   - Ve a tu servicio
   - Haz clic en "Redeploy" o "Restart"
   - Esto reiniciará el servicio desde cero

2. **Espera a que termine el despliegue:**
   - Verifica que el estado sea "Active"
   - Revisa los logs para ver si inició correctamente

## 🔍 Verificar que Funciona

Una vez corregido, prueba:

1. **Health Check:**
   ```
   https://cerveza-premium-2-production.up.railway.app/api/auth/health
   ```
   Deberías ver: `{"status":"ok",...}`

2. **Desde tu frontend:**
   - Intenta hacer login
   - Debería funcionar sin el error 504

## 📝 Checklist de Verificación

- [ ] El servicio está en estado "Active" en Railway
- [ ] No hay errores en los logs de Railway
- [ ] Todas las variables de entorno están configuradas
- [ ] El servicio MySQL está corriendo y conectado
- [ ] El Root Directory está configurado como `backend`
- [ ] El Start Command es `node server.js`
- [ ] El puerto usa `process.env.PORT` (no hardcodeado)
- [ ] Las credenciales de la base de datos son correctas
- [ ] CORS está configurado con tu dominio de Vercel/Netlify

## 🆘 Si Nada Funciona

1. **Revisa los logs completos:**
   - En Railway, descarga los logs completos
   - Busca el primer error que apareció

2. **Prueba desplegar desde cero:**
   - Crea un nuevo servicio en Railway
   - Conecta el mismo repositorio
   - Configura todas las variables desde el inicio

3. **Verifica que el código funcione localmente:**
   - Si no funciona localmente, el problema está en el código
   - Arregla los errores locales primero

4. **Contacta el soporte:**
   - Railway tiene un buen soporte
   - Puedes pedir ayuda en su Discord o documentación

## 🔗 Recursos

- [Railway Documentation](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)
- [Troubleshooting Railway](https://docs.railway.app/troubleshooting)

---

**¿Necesitas más ayuda?** Comparte los logs de Railway y te ayudo a identificar el problema específico.
