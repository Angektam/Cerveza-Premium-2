# 🚀 Backend - Cerveza Premium

Backend API RESTful para la aplicación Cerveza Premium.

## 📁 Estructura del Proyecto

```
backend/
├── server.js              # Servidor principal
├── controllers/           # Controladores (lógica de negocio)
│   └── authController.js
├── routes/                # Rutas de la API
│   └── authRoutes.js
├── middleware/            # Middleware personalizado
│   └── security.js
├── services/              # Servicios (email, etc.)
│   └── emailService.js
├── utils/                 # Utilidades
│   ├── database.js        # Pool de conexiones y helpers
│   ├── errors.js          # Manejo de errores
│   └── response.js        # Respuestas estandarizadas
├── logs/                  # Logs del servidor
├── uploads/               # Archivos subidos
└── package.json
```

## 🚀 Inicio Rápido

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
Crea un archivo `.env` en el directorio `backend/`:

```env
# Base de datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=cerveza_premium
DB_PORT=3306

# Servidor
PORT=4000
NODE_ENV=development

# JWT
JWT_SECRET=tu_secreto_super_seguro
JWT_EXPIRE=24h

# Bcrypt
BCRYPT_ROUNDS=12

# CORS
CORS_ORIGIN=http://localhost:4200

# Uploads
UPLOAD_DIR=uploads
```

### 3. Iniciar servidor
```bash
node server.js
```

## 📡 Endpoints Principales

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrarse
- `POST /api/auth/forgot-password` - Solicitar reset de contraseña
- `POST /api/auth/reset-password` - Restablecer contraseña
- `GET /api/auth/health` - Health check

### Usuarios
- `GET /api/usuarios/:id` - Obtener usuario
- `PUT /api/usuarios/:id` - Actualizar usuario
- `GET /api/usuarios/me` - Obtener usuario actual

### Cervezas
- `GET /api/cervezas` - Listar todas las cervezas
- `GET /api/cervezas-mexicanas` - Cervezas mexicanas
- `GET /api/cervezas/:id` - Obtener cerveza por ID
- `GET /api/cervezas/search` - Buscar cervezas

### Carrito
- `GET /api/carrito/:usuarioId` - Obtener carrito
- `POST /api/carrito/add` - Agregar al carrito
- `PUT /api/carrito/item/:itemId` - Actualizar item
- `DELETE /api/carrito/item/:itemId` - Eliminar item

### Pedidos
- `GET /api/pedidos` - Listar pedidos
- `POST /api/pedidos` - Crear pedido
- `GET /api/pedidos/:id` - Obtener pedido

### Puntos
- `GET /api/puntos/:usuarioId` - Obtener puntos
- `GET /api/puntos/transacciones/:usuarioId` - Historial de transacciones

### Admin
- `GET /api/admin/cervezas` - Gestión de cervezas
- `GET /api/admin/pedidos` - Gestión de pedidos
- `GET /api/admin/usuarios` - Gestión de usuarios

## 🔒 Seguridad

### Middleware de Seguridad
- **Helmet**: Headers de seguridad HTTP
- **CORS**: Control de acceso cross-origin
- **Rate Limiting**: Protección contra ataques de fuerza bruta
- **HPP**: Protección contra HTTP Parameter Pollution
- **Sanitización**: Limpieza de inputs
- **Validación**: Validación de datos de entrada

### Autenticación
- JWT (JSON Web Tokens)
- Bcrypt para hash de contraseñas
- Rate limiting en login/registro

## 🛠️ Mejoras Implementadas

### Estructura del Servidor
- ✅ Separación de rutas en módulos
- ✅ Controladores para lógica de negocio
- ✅ Utilidades reutilizables
- ✅ Manejo centralizado de errores
- ✅ Respuestas estandarizadas
- ✅ Pool de conexiones optimizado

### Utilidades
- `utils/database.js`: Pool de conexiones y helpers
- `utils/errors.js`: Manejo centralizado de errores
- `utils/response.js`: Respuestas estandarizadas

## 📝 Scripts Disponibles

### Crear usuarios de prueba
```bash
node ../scripts/create-test-users.js
```

### Verificar conexión a BD
```bash
node check-db.js
```

## 🧪 Testing

Ver `../tests/` para scripts de prueba.

## 📚 Documentación Adicional

- `SECURITY-FEATURES.md` - Características de seguridad
- `EMAIL-SETUP.md` - Configuración de email
- `CONFIGURAR-EMAIL.md` - Guía de configuración

## 🔧 Troubleshooting

### Error de conexión a la base de datos
- Verifica que MySQL esté corriendo
- Revisa las credenciales en `.env`
- Verifica que la base de datos exista

### Error de puerto en uso
- Cambia el `PORT` en `.env`
- O mata el proceso que está usando el puerto

### Error de JWT
- Verifica que `JWT_SECRET` esté configurado
- No uses el secreto por defecto en producción

