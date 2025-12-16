# 🔗 Cómo Encontrar la URL de tu Backend en Railway

Esta guía te ayuda a encontrar la URL pública de tu backend desplegado en Railway.

## 📍 Pasos para Encontrar la URL

### Opción 1: Desde el Dashboard del Servicio

1. **Abre tu servicio en Railway:**
   - Ve a tu proyecto en [railway.app](https://railway.app)
   - Haz clic en tu servicio de backend

2. **Ve a la pestaña "Settings":**
   - En el menú lateral, busca "Settings"
   - O busca "Networking" o "Domains"

3. **Busca "Public Domain" o "Custom Domain":**
   - Verás una sección con el dominio público
   - La URL será algo como: `https://tu-servicio-production.up.railway.app`

4. **Copia la URL completa:**
   - Copia toda la URL (sin `/api` al final)
   - Ejemplo: `https://cerveza-premium-backend-production.up.railway.app`

### Opción 2: Desde la Pestaña "Deployments"

1. **Ve a "Deployments":**
   - En el menú lateral de tu servicio
   - Haz clic en "Deployments"

2. **Busca el deployment más reciente:**
   - Deberías ver una lista de deployments
   - Haz clic en el más reciente (el que está activo)

3. **Busca la URL:**
   - En los detalles del deployment, busca la URL pública
   - O busca en los logs por "Listening on" o "Server running on"

### Opción 3: Desde la Pestaña "Metrics" o "Logs"

1. **Abre los logs:**
   - Ve a la pestaña "Logs" de tu servicio
   - Busca mensajes como:
     ```
     Server running on port 4000
     Listening on https://tu-servicio-production.up.railway.app
     ```

2. **La URL también puede aparecer en:**
   - Variables de entorno
   - Configuración del servicio
   - Información del deployment

## 🔍 Verificar que la URL Funciona

Una vez que tengas la URL, verifica que funciona:

1. **Abre en tu navegador:**
   ```
   https://TU-URL-REAL.up.railway.app/api/auth/health
   ```

2. **Deberías ver una respuesta JSON:**
   ```json
   {
     "status": "ok",
     "message": "Servidor funcionando correctamente"
   }
   ```

3. **Si ves un error:**
   - Verifica que el backend esté desplegado y corriendo
   - Revisa los logs del servicio en Railway
   - Verifica que todas las variables de entorno estén configuradas

## 📝 Formato de URL en Railway

Las URLs de Railway generalmente tienen este formato:
```
https://[nombre-servicio]-[ambiente].up.railway.app
```

Ejemplos:
- `https://cerveza-premium-backend-production.up.railway.app`
- `https://backend-main.up.railway.app`
- `https://api-production.up.railway.app`

## ⚠️ Importante

- **Cada servicio tiene una URL única:** No uses URLs de ejemplo
- **Agrega `/api` en el código:** La URL base no incluye `/api`
- **Verifica HTTPS:** Railway siempre usa HTTPS
- **No incluyas la barra final:** No pongas `/` al final de la URL base

## 🔧 Actualizar el Código

Una vez que tengas la URL real:

1. **Edita `src/environments/environment.prod.ts`:**
   ```typescript
   export const environment = {
     production: true,
     apiUrl: 'https://TU-URL-REAL.up.railway.app/api'
   };
   ```

2. **Haz commit y push:**
   ```bash
   git add src/environments/environment.prod.ts
   git commit -m "Actualizar URL del backend con la URL real de Railway"
   git push
   ```

3. **Netlify desplegará automáticamente** con la nueva URL

## 🐛 Si No Encuentras la URL

Si no puedes encontrar la URL pública:

1. **Verifica que el servicio esté desplegado:**
   - Debe estar en estado "Active" o "Running"
   - No debe estar en "Building" o "Failed"

2. **Verifica que tenga un dominio público:**
   - Algunos servicios pueden no tener dominio público configurado
   - Ve a Settings > Networking y habilita "Public Domain"

3. **Revisa los logs:**
   - Los logs pueden mostrar la URL donde el servidor está escuchando
   - Busca mensajes de inicio del servidor

4. **Contacta con Railway:**
   - Si aún no encuentras la URL, revisa la documentación de Railway
   - O verifica en el dashboard si hay algún error

---

**¿Necesitas más ayuda?** Revisa `docs/CONFIGURAR-BACKEND-URL.md` para más información sobre cómo configurar la URL del backend.

