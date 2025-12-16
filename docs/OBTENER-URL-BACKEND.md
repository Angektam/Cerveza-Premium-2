# 🔗 Cómo Obtener la URL de tu Backend Desplegado

Esta guía te ayuda a encontrar la URL correcta de tu backend desplegado en Railway, Render u otros servicios.

## 🚨 Problema Común

Si ves este error:
```
Http failure response for https://tu-backend.railway.app/api/auth/login: 504 Gateway Timeout
```

Esto significa que estás usando una URL de ejemplo en lugar de tu URL real del backend.

## 🚀 Obtener la URL en Railway

### Paso 1: Acceder a tu Proyecto
1. Ve a [railway.app](https://railway.app)
2. Inicia sesión en tu cuenta
3. Selecciona tu proyecto

### Paso 2: Encontrar la URL
1. Haz clic en tu servicio de backend
2. Ve a la pestaña **"Settings"** o **"Deployments"**
3. Busca la sección **"Domains"** o **"Networking"**
4. Verás algo como:
   - `https://tu-app-production.up.railway.app`
   - O un dominio personalizado si lo configuraste

### Paso 3: Copiar la URL Completa
La URL debería verse así:
```
https://tu-app-production.up.railway.app
```

**IMPORTANTE:** No incluyas `/api` al final, eso se agrega en el código.

## 🚀 Obtener la URL en Render

### Paso 1: Acceder a tu Proyecto
1. Ve a [render.com](https://render.com)
2. Inicia sesión
3. Selecciona tu servicio

### Paso 2: Encontrar la URL
1. En el dashboard de tu servicio
2. Verás la URL en la parte superior, algo como:
   - `https://tu-app.onrender.com`

### Paso 3: Copiar la URL
La URL completa será:
```
https://tu-app.onrender.com
```

## 🔧 Actualizar la URL en el Código

Una vez que tengas la URL real, actualiza `src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://tu-app-production.up.railway.app/api' // ⚠️ Tu URL real aquí
};
```

**Nota:** Agrega `/api` al final de la URL.

## ✅ Verificar que el Backend Funciona

Antes de actualizar el código, verifica que tu backend esté funcionando:

### 1. Probar el Health Check
Abre en tu navegador:
```
https://tu-backend-real.railway.app/api/auth/health
```

Deberías ver una respuesta JSON como:
```json
{
  "status": "ok",
  "message": "Servidor funcionando correctamente"
}
```

### 2. Si no funciona, verifica:
- ✅ El backend está desplegado y corriendo
- ✅ El servicio no está "dormido" (Render se duerme después de 15 min de inactividad)
- ✅ No hay errores en los logs del servicio
- ✅ La base de datos está conectada correctamente

## 🐛 Solución de Problemas

### Error 504 Gateway Timeout

**Causas posibles:**
1. **URL incorrecta:** Estás usando una URL de ejemplo
2. **Backend no desplegado:** El servicio no está corriendo
3. **Backend dormido (Render):** El servicio se durmió por inactividad
4. **Error en el backend:** El backend tiene un error y no responde

**Soluciones:**
1. Verifica que la URL en `environment.prod.ts` sea la correcta
2. Revisa los logs del backend en Railway/Render
3. Si usas Render, haz una petición para "despertar" el servicio
4. Verifica que todas las variables de entorno estén configuradas

### Error 502 Bad Gateway

**Causa:** El backend está desplegado pero tiene un error interno.

**Solución:**
1. Revisa los logs del backend
2. Verifica que la base de datos esté conectada
3. Verifica que todas las variables de entorno estén configuradas

### El Backend Responde pero da Error 404

**Causa:** La ruta no existe o la URL está mal formada.

**Solución:**
1. Verifica que agregaste `/api` al final de la URL en `environment.prod.ts`
2. Verifica que las rutas del backend estén correctamente configuradas

## 📝 Ejemplo Completo

### 1. URL del Backend en Railway:
```
https://cerveza-premium-backend-production.up.railway.app
```

### 2. Actualizar `environment.prod.ts`:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://cerveza-premium-backend-production.up.railway.app/api'
};
```

### 3. Configurar CORS en Railway:
Variable de entorno:
```
CORS_ORIGIN=https://verdant-heliotrope-257e65.netlify.app,http://localhost:4200
```

### 4. Hacer Commit y Push:
```bash
git add src/environments/environment.prod.ts
git commit -m "Actualizar URL del backend para producción"
git push
```

### 5. Netlify desplegará automáticamente

## 🔍 Verificar que Todo Funciona

1. **Backend funcionando:**
   - Abre: `https://tu-backend.railway.app/api/auth/health`
   - Deberías ver una respuesta JSON

2. **Frontend actualizado:**
   - Verifica que `environment.prod.ts` tenga la URL correcta
   - Haz push de los cambios

3. **CORS configurado:**
   - Verifica que `CORS_ORIGIN` en Railway incluya tu dominio de Netlify

4. **Probar en Netlify:**
   - Abre tu aplicación en Netlify
   - Intenta hacer login
   - Debería funcionar sin errores

---

**¿Necesitas ayuda?** Revisa los logs del backend en Railway/Render para ver qué está pasando.

