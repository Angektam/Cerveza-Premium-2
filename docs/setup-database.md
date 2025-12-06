# 🍺 Configuración de Base de Datos - Cerveza Premium

## 📋 Requisitos Previos

1. **MySQL** instalado y funcionando
2. **Node.js** (versión 14 o superior)
3. **npm** o **yarn**

## 🚀 Pasos de Instalación

### 1. Configurar la Base de Datos

```bash
# Conectar a MySQL
mysql -u root -p

# Ejecutar el script de creación de la base de datos
source database/schema.sql
```

### 2. Configurar el Backend

```bash
# Navegar al directorio del backend
cd backend

# Instalar dependencias
npm install

# Copiar archivo de configuración
cp env.example .env

# Editar el archivo .env con tus datos
nano .env
```

### 3. Configurar Variables de Entorno

Edita el archivo `.env` con tus datos:

```env
# Configuración de la Base de Datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password_mysql
DB_NAME=cerveza_premium
DB_PORT=3306

# Configuración del Servidor
PORT=3000
JWT_SECRET=tu_secreto_super_seguro_aqui

# Configuración de Upload
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880

# Configuración de CORS
CORS_ORIGIN=http://localhost:4200
```

### 4. Crear Directorio de Uploads

```bash
mkdir uploads
chmod 755 uploads
```

### 5. Iniciar el Backend

```bash
# Modo desarrollo (con auto-reload)
npm run dev

# Modo producción
npm start
```

### 6. Configurar Angular

En `src/app/services/database.service.ts`, verifica que la URL del API sea correcta:

```typescript
private apiUrl = 'http://localhost:3000/api';
```

## 🗄️ Estructura de la Base de Datos

### Tablas Principales:

- **usuarios**: Información de usuarios registrados
- **cervezas**: Catálogo de cervezas disponibles
- **categorias**: Categorías de cervezas
- **carritos**: Carritos de compra de usuarios
- **carrito_items**: Items individuales en el carrito
- **pedidos**: Pedidos realizados por usuarios
- **pedido_items**: Items individuales en pedidos
- **transacciones_puntos**: Historial de puntos de usuarios
- **sesiones**: Sesiones activas de usuarios
- **codigos_descuento**: Códigos de descuento disponibles

## 🔧 Funcionalidades Implementadas

### ✅ Autenticación
- Login con email y contraseña
- Registro de nuevos usuarios
- Tokens JWT para sesiones
- Middleware de autenticación

### ✅ Gestión de Usuarios
- Perfil de usuario
- Actualización de datos
- Verificación de edad
- Subida de documentos de identidad

### ✅ Catálogo de Cervezas
- Listado de cervezas
- Búsqueda por nombre/estilo
- Filtrado por categoría
- Información detallada

### ✅ Carrito de Compras
- Agregar/eliminar productos
- Actualizar cantidades
- Persistencia de datos
- Cálculo de totales

### ✅ Sistema de Pedidos
- Creación de pedidos
- Historial de compras
- Estados de pedido
- Cálculo de envíos

### ✅ Sistema de Puntos
- Acumulación de puntos
- Uso de puntos para descuentos
- Historial de transacciones
- Cálculo automático

### ✅ Upload de Archivos
- Subida de imágenes de identificación
- Validación de tipos de archivo
- Límite de tamaño (5MB)
- Almacenamiento seguro

## 🧪 Datos de Prueba

La base de datos incluye datos de prueba:

- **Usuario de prueba**: pitoperez@ejemplo.com
- **6 cervezas** de diferentes estilos
- **3 códigos de descuento** activos
- **Categorías** predefinidas

## 🔒 Seguridad

- Contraseñas hasheadas con bcrypt
- Tokens JWT con expiración
- Validación de archivos
- Sanitización de inputs
- CORS configurado

## 📊 Monitoreo

Para verificar que todo funciona:

1. **Backend**: http://localhost:3000
2. **API Health**: http://localhost:3000/api/cervezas
3. **Base de datos**: Verificar conexión en logs

## 🚨 Solución de Problemas

### Error de conexión a MySQL:
```bash
# Verificar que MySQL esté corriendo
sudo systemctl status mysql

# Reiniciar MySQL si es necesario
sudo systemctl restart mysql
```

### Error de permisos en uploads:
```bash
chmod 755 uploads/
chown -R www-data:www-data uploads/
```

### Error de CORS:
Verificar que `CORS_ORIGIN` en `.env` coincida con la URL de Angular.

## 📝 Notas Adicionales

- El backend incluye manejo completo de errores
- Todas las rutas están documentadas
- La base de datos está optimizada con índices
- Se incluyen validaciones de seguridad
- El código está listo para producción

¡Tu sistema de ventas de cerveza está listo para funcionar! 🍻
