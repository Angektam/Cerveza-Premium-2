# 🔧 Configurar URL del Backend

Esta guía explica cómo configurar la URL del backend para diferentes entornos (desarrollo y producción).

## 📋 Problema Común

Si ves el error:
```
Http failure response for http://localhost:4000/api/auth/login: 0 undefined
```

Esto significa que la aplicación está intentando conectarse a `localhost:4000`, que no está disponible en producción (Netlify, etc.).

## ✅ Solución

El proyecto ahora usa **archivos de environment** para manejar diferentes URLs según el entorno.

### Archivos de Environment

1. **`src/environments/environment.ts`** - Para desarrollo
   ```typescript
   export const environment = {
     production: false,
     apiUrl: 'http://localhost:4000/api'
   };
   ```

2. **`src/environments/environment.prod.ts`** - Para producción
   ```typescript
   export const environment = {
     production: true,
     apiUrl: 'https://tu-backend.railway.app/api' // ⚠️ CAMBIA ESTA URL
   };
   ```

## 🚀 Pasos para Configurar

### 1. Desplegar el Backend

Primero, necesitas desplegar tu backend en algún servicio:

- **Railway** (recomendado): https://railway.app
- **Render**: https://render.com
- **Heroku**: https://heroku.com
- **Netlify Functions**: Si quieres usar Netlify Functions

Consulta `docs/OPCIONES-DESPLIEGUE.md` para más detalles.

### 2. Obtener la URL del Backend

Una vez desplegado, obtén la URL de tu backend:
- Railway: `https://tu-app.railway.app`
- Render: `https://tu-app.onrender.com`
- Heroku: `https://tu-app.herokuapp.com`

### 3. Actualizar `environment.prod.ts`

Edita `src/environments/environment.prod.ts` y actualiza la URL:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://tu-backend-real.railway.app/api' // Tu URL real aquí
};
```

### 4. Configurar CORS en el Backend

**IMPORTANTE:** El backend ahora soporta múltiples orígenes separados por coma.

**En Railway/Render/Heroku, agrega esta variable de entorno:**
```env
CORS_ORIGIN=https://tu-app.netlify.app,http://localhost:4200
```

**Nota:** Puedes agregar múltiples orígenes separados por coma. El backend automáticamente los procesará.

Consulta `docs/CONFIGURAR-CORS.md` para más detalles sobre la configuración de CORS.

### 5. Re-desplegar el Frontend

Después de actualizar `environment.prod.ts`:

```bash
git add src/environments/environment.prod.ts
git commit -m "Actualizar URL del backend para producción"
git push
```

Netlify detectará el cambio y volverá a desplegar automáticamente.

## 🔍 Verificación

### Desarrollo Local

1. Asegúrate de que el backend esté corriendo en `localhost:4000`
2. Inicia el frontend: `npm start`
3. La aplicación usará `http://localhost:4000/api`

### Producción (Netlify)

1. Verifica que `environment.prod.ts` tenga la URL correcta
2. El build de producción usará automáticamente `environment.prod.ts`
3. La aplicación usará la URL de producción configurada

## 🛠️ Usar Variables de Entorno en Netlify (Opcional)

Si prefieres no hardcodear la URL, puedes usar variables de entorno de Netlify:

### 1. Crear `src/environments/environment.prod.ts` con variable:

```typescript
export const environment = {
  production: true,
  apiUrl: (window as any).__API_URL__ || 'https://tu-backend.railway.app/api'
};
```

### 2. Inyectar la variable en `index.html`:

```html
<script>
  window.__API_URL__ = '%API_URL%';
</script>
```

### 3. Configurar en Netlify:

- Ve a "Site settings" > "Build & deploy" > "Environment variables"
- Agrega: `API_URL` = `https://tu-backend.railway.app/api`

### 4. Usar plugin de Netlify para reemplazar:

Agrega a `netlify.toml`:
```toml
[[plugins]]
  package = "@netlify/plugin-inline-functions-env"
```

**Nota:** Este método es más complejo. La solución con `environment.prod.ts` es más simple y recomendada.

## 📝 Resumen

1. ✅ Despliega el backend (Railway, Render, etc.)
2. ✅ Obtén la URL del backend
3. ✅ Actualiza `src/environments/environment.prod.ts` con la URL real
4. ✅ Configura CORS en el backend para permitir tu dominio de Netlify
5. ✅ Haz push y Netlify desplegará automáticamente

## ❓ Problemas Comunes

### Error: "Http failure response for http://localhost:4000/api"

**Causa:** La aplicación está usando la URL de desarrollo en producción.

**Solución:**
1. Verifica que `environment.prod.ts` tenga la URL correcta
2. Asegúrate de que `angular.json` tenga configurado `fileReplacements` para producción
3. Re-despliega el frontend

### Error de CORS

**Causa:** El backend no permite peticiones desde tu dominio de Netlify.

**Solución:**
1. Agrega tu dominio de Netlify a `CORS_ORIGIN` en las variables de entorno del backend
2. Reinicia el backend

### La aplicación funciona en local pero no en Netlify

**Causa:** Probablemente estás usando `localhost` en producción.

**Solución:**
1. Verifica que `environment.prod.ts` tenga la URL de producción
2. Verifica que el build de producción esté usando el archivo correcto
3. Revisa los logs de Netlify para ver qué URL está usando

---

¿Necesitas ayuda? Consulta `docs/OPCIONES-DESPLIEGUE.md` para más información sobre el despliegue del backend.

