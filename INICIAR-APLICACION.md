# 🚀 Guía Rápida para Iniciar la Aplicación

## ⚠️ Error Actual
El frontend está corriendo pero el backend no está activo. Necesitas iniciar el backend en una terminal separada.

## 📋 Pasos para Iniciar

### 1. **Terminal 1 - Backend** (Nueva ventana de PowerShell)

```powershell
cd backend
node server.js
```

**O si prefieres usar npm:**
```powershell
cd backend
npm start
```

Deberías ver:
```
Servidor corriendo en puerto 4000
Base de datos: cerveza_premium en localhost:3306
Modo: development
```

### 2. **Terminal 2 - Frontend** (Ya está corriendo)

El frontend ya está corriendo en `http://localhost:4200`

## ⚙️ Configuración Requerida

### Si no tienes archivo `.env` en `backend/`:

1. Copia el archivo de ejemplo:
```powershell
cd backend
Copy-Item env.example .env
```

2. Edita `.env` con tus credenciales:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password_mysql
DB_NAME=cerveza_premium
PORT=4000
JWT_SECRET=tu_secreto_super_seguro_minimo_32_caracteres
CORS_ORIGIN=http://localhost:4200
```

### Verificar Base de Datos

Asegúrate de que MySQL esté corriendo y la base de datos exista:

```powershell
# Crear base de datos si no existe
mysql -u root -p < database/schema-completo.sql
```

## ✅ Verificación

Una vez que ambos servidores estén corriendo:

- ✅ Frontend: http://localhost:4200
- ✅ Backend: http://localhost:4000
- ✅ API Health: http://localhost:4000/api/auth/health

## 🔧 Solución de Problemas

### Error: "Cannot find module"
```powershell
cd backend
npm install
```

### Error: "Access denied for user"
- Verifica las credenciales en `backend/.env`
- Asegúrate de que MySQL esté corriendo

### Error: "Port 4000 already in use"
- Cambia el puerto en `backend/.env` a otro (ej: 4001)
- O mata el proceso que está usando el puerto

## 📝 Resumen

**Necesitas 2 terminales:**

1. **Terminal 1**: `cd backend && node server.js`
2. **Terminal 2**: `npm start` (ya está corriendo)

¡Listo! 🎉

