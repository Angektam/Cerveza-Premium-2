# ⚠️ URGENTE: Actualizar URL del Backend

Estás viendo el error **504 Gateway Timeout** porque el archivo `src/environments/environment.prod.ts` todavía tiene una **URL de ejemplo** en lugar de tu URL real.

## 🚨 El Problema

Tu archivo actual tiene:
```typescript
apiUrl: 'https://tu-backend.railway.app/api' // ⚠️ Esta es una URL de EJEMPLO que NO existe
```

Esta URL no existe. Necesitas reemplazarla con la **URL REAL** de tu backend en Railway.

## ✅ Solución Rápida (3 pasos)

### Paso 1: Obtener tu URL Real de Railway

1. Ve a [railway.app](https://railway.app)
2. Abre tu servicio de backend
3. Ve a **Settings** → **Networking** o busca **"Public Domain"**
4. Copia la URL completa (algo como: `https://cerveza-premium-production.up.railway.app`)

### Paso 2: Actualizar el Archivo

Edita `src/environments/environment.prod.ts` y reemplaza la línea 8:

**ANTES:**
```typescript
apiUrl: 'https://tu-backend.railway.app/api' // ⚠️ CAMBIA ESTA URL
```

**DESPUÉS (con tu URL real):**
```typescript
apiUrl: 'https://TU-URL-REAL-AQUI.up.railway.app/api'
```

**Ejemplo real:**
```typescript
apiUrl: 'https://cerveza-premium-backend-production.up.railway.app/api'
```

### Paso 3: Verificar y Subir

1. **Verifica que funciona:**
   - Abre en tu navegador: `https://TU-URL-REAL.up.railway.app/api/auth/health`
   - Deberías ver: `{"status":"ok",...}`

2. **Haz commit y push:**
```bash
git add src/environments/environment.prod.ts
git commit -m "Actualizar URL del backend con la URL real de Railway"
git push
```

3. **Netlify desplegará automáticamente** con la nueva URL

## 🔍 ¿No Encuentras la URL en Railway?

### Opción A: Desde Settings
1. Servicio → Settings → Networking
2. Busca "Public Domain" o "Custom Domain"

### Opción B: Desde el Dashboard
1. En la página principal del servicio
2. Busca un banner o sección con la URL pública

### Opción C: Desde los Logs
1. Ve a la pestaña "Logs"
2. Busca mensajes como "Server running on" o "Listening on"
3. La URL puede aparecer ahí

### Opción D: Generar un Dominio Público
Si no tienes dominio público:
1. Ve a Settings → Networking
2. Haz clic en "Generate Domain" o "Create Public Domain"
3. Railway generará una URL única para ti

## ⚠️ Importante

- ✅ **Cada proyecto tiene una URL única** - No uses URLs de ejemplo
- ✅ **Agrega `/api` al final** en el código
- ✅ **Usa HTTPS** - Railway siempre usa HTTPS
- ✅ **No incluyas barra final** - No pongas `/` después de `.app`

## 🐛 Si Aún No Funciona

1. **Verifica que el backend esté corriendo:**
   - En Railway, verifica que el servicio esté "Active"
   - Revisa los logs para ver si hay errores

2. **Verifica CORS:**
   - En Railway, agrega la variable: `CORS_ORIGIN=https://tu-app.netlify.app,http://localhost:4200`
   - Reinicia el servicio

3. **Verifica la base de datos:**
   - Asegúrate de que todas las variables de entorno estén configuradas
   - Verifica que la base de datos esté conectada

## 📝 Ejemplo Completo

Si tu URL en Railway es:
```
https://cerveza-premium-backend-production.up.railway.app
```

Entonces en `environment.prod.ts` debe ser:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://cerveza-premium-backend-production.up.railway.app/api'
};
```

---

**Una vez actualizado, el error 504 debería desaparecer.** 🎉

