# 🍺 Cerveza Premium - Sistema de Ventas

Sistema completo de ventas de cerveza artesanal mexicana con gestión de pedidos, puntos de fidelidad y panel de administración.

## 📋 Características

- 🛒 **Catálogo de Cervezas**: Amplia selección de cervezas mexicanas
- 👤 **Gestión de Usuarios**: Registro, login y perfiles
- 🛍️ **Carrito de Compras**: Sistema completo de compras
- 📦 **Pedidos**: Seguimiento y gestión de pedidos
- ⭐ **Sistema de Puntos**: Programa de fidelidad
- 👨‍💼 **Panel Admin**: Gestión completa del sistema
- 📱 **PWA**: Aplicación web progresiva
- 🔒 **Seguridad**: Autenticación JWT, rate limiting, validaciones

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js 18+
- MySQL 8+
- npm o yarn

### Instalación

1. **Clonar el repositorio**
```bash
git clone <repo-url>
cd ArribaElAmerica
```

2. **Instalar dependencias del frontend**
```bash
npm install
```

3. **Instalar dependencias del backend**
```bash
cd backend
npm install
cd ..
```

4. **Configurar base de datos**
```bash
# Crear base de datos
mysql -u root -p < database/schema.sql

# O usar el schema completo
mysql -u root -p < database/schema-completo.sql
```

5. **Configurar variables de entorno**
```bash
# Backend
cd backend
cp env.example .env
# Editar .env con tus credenciales
```

6. **Crear usuarios de prueba**
```bash
node scripts/create-test-users.js
```

7. **Iniciar servidores**

**Terminal 1 - Backend:**
```bash
cd backend
node server.js
```

**Terminal 2 - Frontend:**
```bash
npm start
```

## 📁 Estructura del Proyecto

```
ArribaElAmerica/
├── src/                    # Código fuente Angular
│   ├── app/               # Componentes y servicios
│   └── assets/            # Recursos estáticos
├── backend/               # API REST
│   ├── server.js         # Servidor principal
│   ├── controllers/      # Controladores
│   ├── routes/           # Rutas de la API
│   ├── middleware/       # Middleware
│   ├── services/         # Servicios
│   └── utils/            # Utilidades
├── database/             # Scripts SQL
│   ├── schema.sql        # Esquema principal
│   └── schema-completo.sql
├── tests/                # Scripts de prueba
├── scripts/              # Scripts de utilidad
├── docs/                 # Documentación
└── dist/                 # Build de producción
```

## 🧪 Testing

### Tests de API
```bash
node tests/test-completo-api.js
```

### Tests End-to-End
```bash
node tests/test-completo-e2e.js
```

### Ejecutar todos los tests
```bash
node tests/test-ejecutar-todo.js
```

## 👥 Usuarios de Prueba

**Cliente:**
- Email: `cliente@test.com`
- Password: `Test1234!`

**Admin:**
- Email: `admin@test.com`
- Password: `Admin1234!`

## 📚 Documentación

- [README Backend](backend/README.md) - Documentación del backend
- [README Database](docs/README-DATABASE.md) - Esquema de base de datos
- [Opciones de Despliegue](docs/OPCIONES-DESPLIEGUE.md) - Guía completa de despliegue
- [GitHub Pages](docs/GITHUB-PAGES.md) - Configuración de GitHub Pages
- [Netlify](docs/NETLIFY-SETUP.md) - Configuración de Netlify
- [Configurar URL del Backend](docs/CONFIGURAR-BACKEND-URL.md) - Cómo configurar la URL del backend para producción
- [Tests](docs/README-TESTS.md) - Guía de testing
- [Seguridad](docs/SECURITY.md) - Características de seguridad

## 🛠️ Scripts Disponibles

### Frontend
- `npm start` - Servidor de desarrollo
- `npm run build` - Build de producción
- `npm test` - Ejecutar tests

### Backend
- `node server.js` - Iniciar servidor

### Utilidades
- `node scripts/create-test-users.js` - Crear usuarios de prueba
- `node tests/test-completo-api.js` - Tests de API

## 🔧 Configuración

### Variables de Entorno (Backend)

```env
# Base de datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=cerveza_premium

# Servidor
PORT=4000
NODE_ENV=development

# JWT
JWT_SECRET=tu_secreto_super_seguro
JWT_EXPIRE=24h

# CORS
CORS_ORIGIN=http://localhost:4200
```

## 📦 Tecnologías

### Frontend
- Angular 17
- TypeScript
- RxJS
- Chart.js
- PWA

### Backend
- Node.js
- Express
- MySQL
- JWT
- Bcrypt
- Multer

## 🔒 Seguridad

- Autenticación JWT
- Rate limiting
- Validación de inputs
- Sanitización de datos
- CORS configurado
- Helmet para headers de seguridad

## 🚀 Despliegue

### Despliegue en Netlify (Recomendado)

El proyecto está configurado para desplegarse en **Netlify**. Consulta la **[Guía Completa de Despliegue en Netlify](docs/OPCIONES-DESPLIEGUE.md)** para instrucciones detalladas.

**Resumen rápido:**
- **Frontend:** Netlify Hosting (ya configurado con `netlify.toml`)
- **Backend:** Railway o Render (recomendado) o Netlify Functions
- **Base de Datos:** PlanetScale (gratis y MySQL compatible)

**Despliegue rápido:**
1. Ve a [netlify.com](https://netlify.com) y conecta tu repositorio
2. Netlify detectará automáticamente la configuración
3. ¡Despliega en minutos!

Consulta [docs/NETLIFY-SETUP.md](docs/NETLIFY-SETUP.md) para la guía paso a paso.

### Otras Opciones de Despliegue

También puedes desplegar en:
- **GitHub Pages:** Ya configurado (ver `docs/GITHUB-PAGES.md`)
- **Vercel:** Similar a Netlify, muy fácil de usar
- **Firebase Hosting:** Si usas otros servicios de Firebase

### Configuración Inicial

1. **Habilita GitHub Pages en tu repositorio:**
   - Ve a `Settings` > `Pages` en tu repositorio de GitHub
   - En `Source`, selecciona `GitHub Actions`
   - Guarda los cambios

2. **Ajusta el baseHref (si es necesario):**
   - Si tu repositorio se llama diferente a `ArribaElAmerica`, edita `.github/workflows/deploy-gh-pages.yml`
   - Cambia `base-href="/${{ github.event.repository.name }}/"` por el nombre correcto
   - O edita `angular.json` y actualiza `baseHref` en la configuración `github-pages`

3. **Ajusta la rama principal:**
   - Si tu rama principal es `master` en lugar de `main`, edita `.github/workflows/deploy-gh-pages.yml`
   - Cambia `branches: - main` por `branches: - master`

### Despliegue Automático

El workflow se ejecuta automáticamente cuando:
- Haces push a la rama `main` (o `master`)
- Ejecutas manualmente desde la pestaña `Actions` en GitHub

### Despliegue Manual

Para construir y desplegar manualmente:

```bash
# Build con configuración para GitHub Pages
npm run build -- --configuration=github-pages

# O con baseHref personalizado
npm run build -- --configuration=production --base-href="/tu-repositorio/"
```

### URL de la Aplicación

Una vez desplegado, tu aplicación estará disponible en:
```
https://tu-usuario.github.io/ArribaElAmerica/
```

**Nota:** El backend no se despliega en GitHub Pages. Necesitarás desplegar el backend por separado (Heroku, Railway, Render, etc.) y actualizar las URLs de la API en el código.

## 📝 Licencia

MIT

## 👨‍💻 Desarrollo

Para contribuir al proyecto, consulta la documentación en `docs/`.

