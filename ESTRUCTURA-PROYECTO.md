# 📁 Estructura del Proyecto - Cerveza Premium

## 🗂️ Organización de Carpetas

```
ArribaElAmerica/
├── src/                    # Código fuente Angular (Frontend)
│   ├── app/               # Componentes de la aplicación
│   └── assets/            # Recursos estáticos
│
├── backend/                # API REST (Backend)
│   ├── server.js          # Servidor principal
│   ├── server-improved.js # Servidor mejorado (nueva estructura)
│   ├── controllers/       # Controladores (lógica de negocio)
│   ├── routes/            # Rutas de la API
│   ├── middleware/        # Middleware personalizado
│   ├── services/          # Servicios (email, etc.)
│   ├── utils/             # Utilidades reutilizables
│   ├── logs/              # Logs del servidor
│   └── uploads/           # Archivos subidos
│
├── database/              # Scripts SQL
│   ├── schema.sql         # Esquema básico
│   ├── schema-completo.sql # Esquema completo
│   ├── add-security-features.sql
│   └── reset-password.sql
│
├── tests/                 # Scripts de prueba
│   ├── test-completo-api.js      # Tests de API
│   ├── test-completo-e2e.js      # Tests End-to-End
│   └── test-ejecutar-todo.js     # Ejecutor de tests
│
├── scripts/               # Scripts de utilidad
│   └── create-test-users.js      # Crear usuarios de prueba
│
├── docs/                  # Documentación
│   ├── README.md
│   ├── README-DATABASE.md
│   ├── README-TESTS.md
│   └── ... (otros docs)
│
├── dist/                  # Build de producción (generado)
├── node_modules/          # Dependencias (generado)
└── package.json           # Configuración del proyecto
```

## 📄 Archivos Principales

### Frontend
- `src/app/app.component.ts` - Componente principal
- `src/app/app.component.html` - Template principal
- `angular.json` - Configuración de Angular
- `package.json` - Dependencias del frontend

### Backend
- `backend/server.js` - Servidor principal
- `backend/server-improved.js` - Servidor mejorado
- `backend/package.json` - Dependencias del backend
- `backend/.env` - Variables de entorno (crear desde env.example)

### Base de Datos
- `database/schema.sql` - Esquema básico
- `database/schema-completo.sql` - Esquema completo con todas las tablas

## 🗑️ Archivos Eliminados (No Necesarios)

Se eliminaron los siguientes archivos que no son necesarios para el funcionamiento:

### Scripts Temporales
- `package-test.json`
- `server.ts`
- Scripts de password temporales
- Scripts de test duplicados

### SQL Temporales
- `test-database.sql`
- `fix-database-issues.sql`
- `fix-password.sql`
- `add-products.js` y `.ps1`
- `add-more-products.sql`
- Scripts de setup duplicados

### Tests Duplicados
- `test-simple.js`
- `test-login-simple.js`
- `test-completo-funcionalidades.js`
- `test-runner.js`
- `test-server.js`
- `test-api.js`
- `test-login.js`
- `test-backend.js`
- `test-frontend.js`
- `test-completo.html`

### Scripts de Configuración Temporales
- `backend/setup-security.js`
- `backend/configurar-email.ps1`
- `backend/install-security.bat`
- `backend/install-security.sh`

## ✅ Archivos Necesarios para Funcionamiento

### Frontend
- ✅ `src/` - Todo el código fuente
- ✅ `angular.json`
- ✅ `package.json`
- ✅ `tsconfig.json`

### Backend
- ✅ `backend/server.js`
- ✅ `backend/package.json`
- ✅ `backend/middleware/`
- ✅ `backend/services/`
- ✅ `backend/utils/`
- ✅ `backend/routes/`
- ✅ `backend/controllers/`

### Base de Datos
- ✅ `database/schema.sql` o `schema-completo.sql`
- ✅ `database/add-security-features.sql`
- ✅ `database/reset-password.sql`

### Utilidades
- ✅ `scripts/create-test-users.js`
- ✅ `tests/test-completo-api.js`
- ✅ `tests/test-completo-e2e.js`

### Documentación
- ✅ `README.md`
- ✅ `docs/` - Documentación adicional

## 🚀 Para Iniciar la Aplicación

1. **Backend**: `cd backend && node server.js`
2. **Frontend**: `npm start`
3. **Base de datos**: Ejecutar `database/schema-completo.sql`

## 📝 Notas

- La carpeta `dist/` se genera automáticamente al hacer build
- La carpeta `node_modules/` se genera al instalar dependencias
- Los archivos `.env` no deben versionarse (están en .gitignore)
- Los logs se guardan en `backend/logs/`
- Los uploads se guardan en `backend/uploads/`

