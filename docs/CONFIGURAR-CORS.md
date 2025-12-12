# 🔧 Configurar CORS para Producción

Esta guía explica cómo configurar CORS (Cross-Origin Resource Sharing) para que tu frontend en Netlify pueda comunicarse con tu backend desplegado.

## 🚨 Problema Común

Si ves este error en la consola del navegador:
```
Access to fetch at 'https://tu-backend.railway.app/api/auth/login' from origin 'https://tu-app.netlify.app' 
has been blocked by CORS policy
```

Esto significa que el backend no está permitiendo peticiones desde tu dominio de Netlify.

## ✅ Solución

### Opción 1: Configurar CORS en Railway (Recomendado)

1. **Ve a tu proyecto en Railway:**
   - Abre tu proyecto en [railway.app](https://railway.app)
   - Selecciona tu servicio de backend

2. **Agrega la variable de entorno:**
   - Ve a la pestaña "Variables"
   - Agrega una nueva variable:
     - **Nombre:** `CORS_ORIGIN`
     - **Valor:** `https://tu-app.netlify.app,http://localhost:4200`
   
   **Nota:** Puedes agregar múltiples orígenes separados por coma:
   ```
   https://tu-app.netlify.app,http://localhost:4200,https://tu-dominio-personalizado.com
   ```

3. **Reinicia el servicio:**
   - Railway detectará automáticamente el cambio
   - O puedes hacer clic en "Redeploy" si es necesario

### Opción 2: Configurar CORS en Render

1. **Ve a tu proyecto en Render:**
   - Abre tu proyecto en [render.com](https://render.com)
   - Selecciona tu servicio de backend

2. **Agrega la variable de entorno:**
   - Ve a "Environment"
   - Agrega una nueva variable:
     - **Key:** `CORS_ORIGIN`
     - **Value:** `https://tu-app.netlify.app,http://localhost:4200`

3. **Reinicia el servicio:**
   - Render reiniciará automáticamente

### Opción 3: Configurar CORS en Heroku

1. **Usando Heroku CLI:**
```bash
heroku config:set CORS_ORIGIN="https://tu-app.netlify.app,http://localhost:4200" -a tu-app-backend
```

2. **O desde el dashboard:**
   - Ve a Settings > Config Vars
   - Agrega `CORS_ORIGIN` con el valor

## 🔍 Verificar la Configuración

### 1. Verificar que el backend acepta múltiples orígenes

El código del backend ya está actualizado para aceptar múltiples orígenes separados por coma. Verifica que tu `backend/server.js` tenga esta configuración:

```javascript
const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:4200'];
```

### 2. Probar la conexión

Abre la consola del navegador en tu aplicación de Netlify e intenta hacer login. Deberías ver que la petición se completa sin errores de CORS.

### 3. Verificar los logs del backend

En los logs de Railway/Render, deberías ver que las peticiones se están procesando correctamente. Si ves:
```
⚠️  CORS bloqueado para origen: https://tu-app.netlify.app
```

Significa que el origen no está en la lista permitida. Verifica la variable `CORS_ORIGIN`.

## 📝 Ejemplos de Configuración

### Desarrollo Local
```env
CORS_ORIGIN=http://localhost:4200
```

### Producción (solo Netlify)
```env
CORS_ORIGIN=https://tu-app.netlify.app
```

### Producción (múltiples orígenes)
```env
CORS_ORIGIN=https://tu-app.netlify.app,http://localhost:4200,https://tu-dominio.com
```

### Permitir todos los orígenes (NO RECOMENDADO para producción)
```env
CORS_ORIGIN=*
```

**⚠️ Advertencia:** Permitir `*` es inseguro y no funciona con `credentials: true`. Solo úsalo para desarrollo.

## 🛠️ Solución de Problemas

### Error: "No permitido por CORS"

**Causa:** El origen no está en la lista permitida.

**Solución:**
1. Verifica que `CORS_ORIGIN` incluya exactamente tu dominio de Netlify
2. Asegúrate de incluir el protocolo `https://`
3. No incluyas la barra final `/` al final de la URL
4. Verifica que no haya espacios extra

### Error: "Response to preflight request doesn't pass access control check"

**Causa:** El backend no está respondiendo correctamente a las peticiones OPTIONS.

**Solución:**
1. Verifica que el backend tenga `OPTIONS` en los métodos permitidos
2. Asegúrate de que el backend esté corriendo
3. Verifica los logs del backend para ver errores

### El CORS funciona en local pero no en producción

**Causa:** La variable de entorno no está configurada en producción.

**Solución:**
1. Verifica que hayas agregado `CORS_ORIGIN` en Railway/Render
2. Reinicia el servicio después de agregar la variable
3. Verifica que el valor sea correcto (sin espacios, con https://)

## 📚 Recursos Adicionales

- [Documentación de CORS en Express](https://expressjs.com/en/resources/middleware/cors.html)
- [MDN: CORS](https://developer.mozilla.org/es/docs/Web/HTTP/CORS)
- [Railway Environment Variables](https://docs.railway.app/develop/variables)
- [Render Environment Variables](https://render.com/docs/environment-variables)

---

**¿Necesitas ayuda?** Revisa los logs del backend para ver qué origen está intentando acceder y agrégalo a `CORS_ORIGIN`.

