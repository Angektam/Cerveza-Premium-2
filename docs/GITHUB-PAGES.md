# 🚀 Guía de Despliegue en GitHub Pages

Esta guía explica cómo desplegar la aplicación Angular en GitHub Pages.

## 📋 Requisitos Previos

- Repositorio de GitHub configurado
- Permisos de escritura en el repositorio
- Node.js 18+ instalado localmente (para pruebas)

## ⚙️ Configuración

### 1. Habilitar GitHub Pages

1. Ve a tu repositorio en GitHub
2. Navega a `Settings` > `Pages`
3. En la sección `Source`, selecciona `GitHub Actions`
4. Guarda los cambios

### 2. Configurar el Nombre del Repositorio

El workflow está configurado para usar automáticamente el nombre del repositorio. Si necesitas cambiarlo:

**Opción A: Editar el workflow**
Edita `.github/workflows/deploy-gh-pages.yml` y cambia:
```yaml
--base-href="/${{ github.event.repository.name }}/"
```
Por:
```yaml
--base-href="/tu-nombre-repositorio/"
```

**Opción B: Editar angular.json**
Edita `angular.json` y actualiza el `baseHref` en la configuración `github-pages`:
```json
"github-pages": {
  "baseHref": "/tu-nombre-repositorio/",
  ...
}
```

### 3. Configurar la Rama Principal

Si tu rama principal es `master` en lugar de `main`:

1. Edita `.github/workflows/deploy-gh-pages.yml`
2. Cambia:
```yaml
branches:
  - main
```
Por:
```yaml
branches:
  - master
```

## 🔄 Flujo de Despliegue

### Despliegue Automático

El workflow se ejecuta automáticamente cuando:
- Haces `push` a la rama principal (`main` o `master`)
- Ejecutas el workflow manualmente desde `Actions` > `Deploy to GitHub Pages` > `Run workflow`

### Proceso de Despliegue

1. **Checkout**: Descarga el código del repositorio
2. **Setup Node.js**: Configura Node.js 18
3. **Install dependencies**: Instala las dependencias con `npm ci`
4. **Build**: Construye la aplicación Angular con la configuración de producción
5. **Deploy**: Despliega los archivos estáticos a GitHub Pages

## 🧪 Pruebas Locales

Para probar el build localmente antes de desplegar:

```bash
# Build con configuración de GitHub Pages
npm run build -- --configuration=github-pages

# O con baseHref personalizado
npm run build -- --configuration=production --base-href="/ArribaElAmerica/"

# Servir localmente para probar
npx http-server dist/arriba-el-america/browser -p 8080
```

Luego visita `http://localhost:8080/ArribaElAmerica/` en tu navegador.

## 🌐 URL de la Aplicación

Una vez desplegado, tu aplicación estará disponible en:
```
https://tu-usuario.github.io/ArribaElAmerica/
```

Reemplaza `tu-usuario` con tu nombre de usuario de GitHub y `ArribaElAmerica` con el nombre de tu repositorio.

## ⚠️ Consideraciones Importantes

### Backend

**GitHub Pages solo sirve archivos estáticos.** El backend de Node.js/Express NO se puede desplegar en GitHub Pages.

Opciones para el backend:
- **Heroku**: Fácil de usar, plan gratuito disponible
- **Railway**: Moderno y fácil
- **Render**: Alternativa gratuita
- **Vercel**: Para funciones serverless
- **DigitalOcean App Platform**: Opción de pago

### Variables de Entorno

Si tu aplicación necesita variables de entorno:
1. Configúralas en el servicio donde despliegues el backend
2. Actualiza las URLs de la API en el código Angular para apuntar al backend desplegado

### Rutas de Angular

Asegúrate de que tu aplicación use `RouterModule` con `useHash: false` (por defecto) para que las rutas funcionen correctamente en GitHub Pages.

Si tienes problemas con las rutas, puedes usar el modo hash:
```typescript
RouterModule.forRoot(routes, { useHash: true })
```

## 🔍 Solución de Problemas

### La aplicación no carga

1. Verifica que el `baseHref` coincida con el nombre de tu repositorio
2. Revisa la consola del navegador para errores
3. Verifica que el workflow se haya ejecutado correctamente en `Actions`

### Las rutas no funcionan

1. Asegúrate de que el `baseHref` esté configurado correctamente
2. Verifica que el archivo `.nojekyll` esté presente en la raíz
3. Considera usar `useHash: true` en el router si persisten los problemas

### El build falla

1. Revisa los logs en `Actions` > `Deploy to GitHub Pages`
2. Verifica que todas las dependencias estén en `package.json`
3. Asegúrate de que Node.js 18+ sea compatible con tu código

### Los assets no se cargan

1. Verifica que los assets estén en `src/assets/`
2. Asegúrate de que las rutas a los assets sean relativas
3. Revisa que el `baseHref` esté configurado correctamente

## 📚 Recursos Adicionales

- [Documentación oficial de GitHub Pages](https://docs.github.com/en/pages)
- [Angular Deployment Guide](https://angular.io/guide/deployment)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

