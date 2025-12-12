# 🚀 Guía de Despliegue en Netlify

Esta guía te ayudará a desplegar tu aplicación Angular en Netlify paso a paso.

## 📋 Requisitos Previos

- Cuenta de GitHub (tu código debe estar en GitHub)
- Cuenta de Netlify (gratis)
- Node.js 18+ instalado localmente (para pruebas)

## 🚀 Despliegue Rápido (5 minutos)

### Opción 1: Desde GitHub (Recomendado)

1. **Prepara tu repositorio:**
   - Asegúrate de que tu código esté en GitHub
   - El archivo `netlify.toml` ya está configurado en la raíz del proyecto

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
   Netlify debería detectar automáticamente la configuración desde `netlify.toml`, pero verifica:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist/arriba-el-america/browser`
   - **Base directory:** (dejar vacío, es la raíz)

5. **Variables de entorno (opcional):**
   Si necesitas variables de entorno para el build:
   - Ve a "Site settings" > "Environment variables"
   - Agrega las variables necesarias (por ejemplo, `NODE_VERSION=18`)

6. **Despliega:**
   - Haz clic en "Deploy site"
   - Netlify comenzará a construir y desplegar tu aplicación
   - Espera 2-5 minutos

7. **¡Listo!**
   - Tu aplicación estará disponible en: `https://tu-app-random.netlify.app`
   - Puedes cambiar el nombre en "Site settings" > "Change site name"

### Opción 2: Desde la Terminal (Netlify CLI)

1. **Instalar Netlify CLI:**
```bash
npm install -g netlify-cli
```

2. **Iniciar sesión:**
```bash
netlify login
```

3. **Construir la aplicación:**
```bash
npm run build
```

4. **Desplegar:**
```bash
# Despliegue de prueba
netlify deploy

# Despliegue a producción
netlify deploy --prod
```

5. **Seguir las instrucciones:**
   - Netlify te pedirá crear un nuevo sitio o usar uno existente
   - Selecciona "Create & configure a new site"
   - Elige un nombre para tu sitio
   - ¡Listo!

## ⚙️ Configuración Avanzada

### Cambiar el Nombre del Sitio

1. Ve a tu sitio en Netlify
2. Ve a "Site settings" > "Change site name"
3. Ingresa el nuevo nombre (debe ser único)
4. Tu nueva URL será: `https://nuevo-nombre.netlify.app`

### Dominio Personalizado

1. Ve a "Site settings" > "Domain management"
2. Haz clic en "Add custom domain"
3. Ingresa tu dominio (ej: `tudominio.com`)
4. Sigue las instrucciones para configurar DNS:
   - Agrega un registro CNAME apuntando a tu sitio de Netlify
   - O agrega un registro A con la IP de Netlify

### Variables de Entorno

Si necesitas variables de entorno para el build o runtime:

1. Ve a "Site settings" > "Environment variables"
2. Agrega las variables necesarias:
   - `NODE_VERSION=18` (para especificar la versión de Node.js)
   - `NPM_FLAGS=--legacy-peer-deps` (si tienes problemas con dependencias)

### Configurar el Backend

**Importante:** Netlify solo sirve el frontend. Necesitas desplegar el backend por separado.

1. **Despliega el backend** en Railway, Render, Heroku, etc.
2. **Actualiza la URL del API** en tu código Angular:
   
   Edita `src/app/services/database.service.ts`:
   ```typescript
   // Para producción con Netlify
   private apiUrl = 'https://tu-backend.railway.app/api';
   ```

3. **O usa variables de entorno:**
   
   Crea `src/environments/environment.prod.ts`:
   ```typescript
   export const environment = {
     production: true,
     apiUrl: process.env['API_URL'] || 'https://tu-backend.railway.app/api'
   };
   ```
   
   Y en Netlify, agrega la variable de entorno `API_URL`.

### Deploy Automático

Netlify se conecta automáticamente a GitHub y despliega cada vez que haces push:

- **Push a `main` o `master`:** Deploy automático a producción
- **Pull Requests:** Deploy preview automático

Puedes configurar esto en "Site settings" > "Build & deploy" > "Continuous Deployment".

### Deploy Previews

Cada Pull Request genera automáticamente un preview:
- URL única para cada PR
- Perfecto para revisar cambios antes de mergear
- Se elimina automáticamente cuando se cierra el PR

## 🔧 Solución de Problemas

### El build falla

1. **Revisa los logs:**
   - Ve a "Deploys" > selecciona el deploy fallido > "Deploy log"
   - Busca errores en rojo

2. **Problemas comunes:**
   - **Error de memoria:** Agrega `NODE_OPTIONS=--max_old_space_size=4096` en variables de entorno
   - **Versión de Node.js:** Especifica `NODE_VERSION=18` en variables de entorno
   - **Dependencias:** Verifica que `package.json` tenga todas las dependencias
   - **Conflicto de peer dependencies (ERESOLVE):** 
     - El proyecto ya está configurado con `--legacy-peer-deps` en `netlify.toml` y `.npmrc`
     - Si aún tienes problemas, verifica que `@angular/cdk` esté en las dependencias con la versión correcta
   - **Error de budgets excedidos:**
     - Los budgets de Angular están configurados para permitir tamaños más grandes
     - Si necesitas ajustarlos, edita `angular.json` en la sección `budgets`
     - Los budgets actuales permiten hasta 5MB para bundles y 150KB para estilos de componentes

3. **Prueba localmente:**
```bash
npm install --legacy-peer-deps
npm run build
```
Si falla localmente, el problema está en tu código, no en Netlify.

### Las rutas no funcionan (404)

El archivo `netlify.toml` ya incluye las redirecciones necesarias. Si aún tienes problemas:

1. Verifica que `netlify.toml` esté en la raíz del proyecto
2. Verifica que la sección `[[redirects]]` esté presente
3. Si usas rutas con hash (`#`), no necesitas redirecciones

### Los assets no se cargan

1. Verifica que el `baseHref` en `angular.json` esté vacío o sea `/`:
```json
"baseHref": "/"
```

2. Verifica que las rutas a los assets sean relativas (sin `/` al inicio)

### CORS Errors

Si ves errores de CORS al conectar con tu backend:

1. **Actualiza CORS en el backend:**
   ```env
   CORS_ORIGIN=https://tu-app.netlify.app
   ```

2. **O permite múltiples orígenes:**
   ```javascript
   // En tu backend
   const allowedOrigins = [
     'https://tu-app.netlify.app',
     'http://localhost:4200'
   ];
   ```

### El sitio está en blanco

1. Verifica que el `publish directory` sea correcto: `dist/arriba-el-america/browser`
2. Verifica que el build se haya completado correctamente
3. Revisa la consola del navegador para errores de JavaScript

## 📊 Funciones de Netlify

### Formularios

Netlify puede procesar formularios automáticamente:

1. Agrega `netlify` a tu formulario:
```html
<form netlify>
  <!-- campos del formulario -->
</form>
```

2. Los envíos aparecen en "Forms" en tu dashboard

### Funciones Serverless

Puedes crear funciones serverless en `netlify/functions/`:

```javascript
// netlify/functions/hello.js
exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Hello from Netlify!' })
  };
};
```

### Analytics

Netlify ofrece analytics básico:
- Ve a "Analytics" en tu dashboard
- Activa "Netlify Analytics" (requiere plan de pago)

## 🎯 Mejores Prácticas

1. **Usa Deploy Previews:** Revisa cada cambio antes de producción
2. **Configura variables de entorno:** No hardcodees URLs o secrets
3. **Monitorea los builds:** Revisa los logs regularmente
4. **Usa branch deploys:** Configura deploys para diferentes ramas
5. **Optimiza el build:** Asegúrate de que el build sea lo más rápido posible

## 📚 Recursos Adicionales

- [Documentación oficial de Netlify](https://docs.netlify.com)
- [Guía de Angular en Netlify](https://docs.netlify.com/integrations/frameworks/angular/)
- [Netlify CLI Documentation](https://cli.netlify.com)
- [Netlify Community](https://answers.netlify.com)

## ✅ Checklist de Despliegue

- [ ] Código en GitHub
- [ ] Archivo `netlify.toml` creado
- [ ] Cuenta de Netlify creada
- [ ] Repositorio conectado a Netlify
- [ ] Build configurado correctamente
- [ ] Variables de entorno configuradas (si es necesario)
- [ ] Backend desplegado y URL actualizada
- [ ] CORS configurado en el backend
- [ ] Sitio desplegado y funcionando
- [ ] Nombre del sitio personalizado (opcional)
- [ ] Dominio personalizado configurado (opcional)

---

¡Tu aplicación debería estar funcionando en Netlify! 🎉

Si tienes problemas, revisa los logs de deploy o consulta la [documentación oficial](https://docs.netlify.com).

