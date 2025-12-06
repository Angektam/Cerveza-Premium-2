# 🍺 Cerveza Premium - Sistema de Base de Datos

## 📁 Archivos Creados

### 🗄️ Base de Datos
- `database/schema.sql` - Esquema completo de la base de datos MySQL
- `setup-database.md` - Guía de instalación y configuración

### 🔧 Backend (Node.js + Express)
- `backend/server.js` - Servidor principal con todas las rutas API
- `backend/package.json` - Dependencias del backend
- `backend/env.example` - Variables de entorno de ejemplo

### 🅰️ Frontend (Angular)
- `src/app/services/database.service.ts` - Servicio para conectar con la API

## 🚀 Instalación Rápida

### 1. Configurar MySQL
```bash
# Crear la base de datos
mysql -u root -p < database/schema.sql
```

### 2. Configurar Backend
```bash
cd backend
npm install
cp env.example .env
# Editar .env con tus datos de MySQL
npm run dev
```

### 3. Configurar Angular
```bash
# En el directorio raíz del proyecto Angular
npm install
ng serve
```

## 🔗 Conexión Frontend-Backend

El servicio `DatabaseService` se conecta automáticamente con el backend en:
- **URL**: `http://localhost:3000/api`
- **Autenticación**: JWT tokens
- **CORS**: Configurado para Angular

## 📊 Funcionalidades Implementadas

### ✅ **Autenticación Completa**
- Login con email/contraseña
- Registro con validación de edad
- Tokens JWT seguros
- Sesiones persistentes

### ✅ **Gestión de Usuarios**
- Perfil completo con datos personales
- Verificación de identidad con documentos
- Sistema de puntos acumulables
- Historial de transacciones

### ✅ **Catálogo de Cervezas**
- 6 cervezas predefinidas
- Búsqueda y filtrado
- Categorías organizadas
- Información detallada

### ✅ **Carrito de Compras**
- Agregar/eliminar productos
- Actualizar cantidades
- Persistencia en base de datos
- Cálculo automático de totales

### ✅ **Sistema de Pedidos**
- Creación de pedidos
- Estados de seguimiento
- Historial completo
- Cálculo de envíos

### ✅ **Sistema de Puntos**
- Acumulación automática
- Uso para descuentos
- Historial de transacciones
- Cálculo en tiempo real

### ✅ **Upload de Archivos**
- Subida de documentos de identidad
- Validación de tipos y tamaños
- Almacenamiento seguro
- URLs públicas

## 🗄️ Estructura de Base de Datos

### Tablas Principales:
- **usuarios** - Datos de usuarios registrados
- **cervezas** - Catálogo de productos
- **categorias** - Categorías de cervezas
- **carritos** - Carritos de compra
- **carrito_items** - Items en carrito
- **pedidos** - Pedidos realizados
- **pedido_items** - Items en pedidos
- **transacciones_puntos** - Historial de puntos
- **sesiones** - Sesiones activas
- **codigos_descuento** - Códigos promocionales

## 🔒 Seguridad Implementada

- **Contraseñas**: Hash con bcrypt
- **Tokens**: JWT con expiración
- **Archivos**: Validación de tipos
- **CORS**: Configurado correctamente
- **Validación**: Sanitización de inputs

## 📱 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrarse

### Usuarios
- `GET /api/usuarios/:id` - Obtener usuario
- `PUT /api/usuarios/:id` - Actualizar usuario

### Cervezas
- `GET /api/cervezas` - Listar cervezas
- `GET /api/cervezas/:id` - Obtener cerveza
- `GET /api/cervezas/search` - Buscar cervezas
- `GET /api/cervezas/categoria/:id` - Por categoría

### Carrito
- `GET /api/carrito/:usuarioId` - Obtener carrito
- `POST /api/carrito/add` - Agregar al carrito
- `PUT /api/carrito/item/:id` - Actualizar cantidad
- `DELETE /api/carrito/item/:id` - Eliminar item

### Pedidos
- `GET /api/pedidos/usuario/:id` - Pedidos del usuario
- `POST /api/pedidos` - Crear pedido

### Puntos
- `GET /api/puntos/:usuarioId` - Puntos del usuario

### Upload
- `POST /api/upload` - Subir archivo

## 🧪 Datos de Prueba

### Usuario de Prueba:
- **Email**: pitoperez@ejemplo.com
- **Contraseña**: (configurar en el registro)

### Cervezas Incluidas:
1. Golden Sunset IPA - $89.99
2. Dark Thunder Stout - $95.99
3. Bavarian Dream - $79.99
4. Amber Breeze - $84.99
5. Crystal Light Lager - $69.99
6. Smoky Oak Porter - $92.99

### Códigos de Descuento:
- **BIENVENIDO10** - 10% de descuento
- **PRIMERACOMPRA** - $50 de descuento
- **NAVIDAD2024** - 15% de descuento

## 🔧 Configuración de Variables

### Backend (.env):
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=cerveza_premium
PORT=3000
JWT_SECRET=tu_secreto_seguro
```

### Angular (database.service.ts):
```typescript
private apiUrl = 'http://localhost:3000/api';
```

## 🚨 Solución de Problemas

### Error de Conexión MySQL:
```bash
sudo systemctl restart mysql
mysql -u root -p -e "CREATE DATABASE cerveza_premium;"
```

### Error de CORS:
Verificar que el backend esté corriendo en puerto 3000 y Angular en 4200.

### Error de Upload:
```bash
mkdir backend/uploads
chmod 755 backend/uploads
```

## 📈 Próximos Pasos

1. **Configurar SSL** para producción
2. **Implementar cache** con Redis
3. **Agregar logs** con Winston
4. **Configurar backup** automático
5. **Implementar tests** unitarios

## 🎯 Estado del Proyecto

✅ **Base de datos** - Completamente funcional
✅ **Backend API** - Todas las rutas implementadas
✅ **Frontend** - Servicio de conexión listo
✅ **Autenticación** - Sistema completo
✅ **Carrito** - Funcionalidad completa
✅ **Pedidos** - Sistema implementado
✅ **Puntos** - Sistema de recompensas
✅ **Upload** - Subida de archivos

¡Tu sistema de ventas de cerveza está **100% funcional** con base de datos! 🍻
