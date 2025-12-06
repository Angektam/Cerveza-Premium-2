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
- [Tests](docs/README-TESTS.md) - Guía de testing
- [Seguridad](docs/SECURITY.md) - Características de seguridad

## 🛠️ Scripts Disponibles

### Frontend
- `npm start` - Servidor de desarrollo
- `npm run build` - Build de producción
- `npm test` - Ejecutar tests

### Backend
- `node server.js` - Iniciar servidor
- `node server-improved.js` - Servidor mejorado

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

## 📝 Licencia

MIT

## 👨‍💻 Desarrollo

Para contribuir al proyecto, consulta la documentación en `docs/`.

