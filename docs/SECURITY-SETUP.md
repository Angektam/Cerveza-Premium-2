# 🔒 Instalación de Características de Seguridad

## 📋 Guía Rápida de Instalación

### Paso 1: Instalar Nuevas Dependencias

```bash
cd backend
npm install
```

Esto instalará las siguientes dependencias de seguridad:
- `helmet` - Headers HTTP seguros
- `express-rate-limit` - Limitación de tasa de peticiones
- `express-validator` - Validación de datos
- `hpp` - Protección contra HTTP Parameter Pollution
- `morgan` - Logging HTTP
- `xss-clean` - Protección contra XSS

### Paso 2: Ejecutar Script de Configuración

```bash
cd backend
node setup-security.js
```

Este script:
- ✅ Genera un JWT Secret seguro
- ✅ Crea columnas de seguridad en la base de datos
- ✅ Crea tablas de logging
- ✅ Configura directorios necesarios

### Paso 3: Configurar Variables de Entorno

Edita tu archivo `.env` y asegúrate de configurar:

```bash
# IMPORTANTE: Cambia estos valores
DB_PASSWORD=tu_password_real
JWT_SECRET=el_secreto_generado_automaticamente
BCRYPT_ROUNDS=12

# Configuración de seguridad
NODE_ENV=development
JWT_EXPIRE=24h

# URLs
FRONTEND_URL=http://localhost:4200
BACKEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:4200
```

### Paso 4: Aplicar Cambios a la Base de Datos (Opcional)

Si prefieres aplicar manualmente:

```bash
# En MySQL
mysql -u root -p < database/add-security-features.sql
```

### Paso 5: Reiniciar el Servidor

```bash
npm run dev
```

## ✅ Verificación

### Probar Rate Limiting

```bash
# Intentar login múltiples veces (debería bloquearse después de 5 intentos)
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
  echo "\n"
done
```

### Probar Validación de Inputs

```bash
# Email inválido (debería rechazarse)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"invalido","password":"1234"}'
```

### Verificar Headers de Seguridad

```bash
curl -I http://localhost:3000/api/health
```

Deberías ver headers como:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Strict-Transport-Security`

## 🔍 Monitoreo

### Ver Logs en Tiempo Real

```bash
# Logs de acceso
tail -f backend/logs/access.log

# Logs de errores
tail -f backend/logs/error.log
```

### Verificar Intentos de Login

```sql
-- En MySQL
SELECT * FROM login_attempts 
ORDER BY attempt_time DESC 
LIMIT 10;
```

### Ver Logs de Seguridad

```sql
-- En MySQL
SELECT * FROM security_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

## 🚨 Solución de Problemas

### Error: "Cannot find module './middleware/security'"

```bash
# Asegúrate de que el archivo existe
ls backend/middleware/security.js

# Si no existe, verifica que copiaste todos los archivos
```

### Error: "Column 'reset_token' doesn't exist"

```bash
# Ejecuta el script de configuración
cd backend
node setup-security.js
```

### Error: Rate limit alcanzado durante desarrollo

```bash
# Edita backend/middleware/security.js y aumenta los límites
# O espera 15 minutos para que se reinicie el contador
```

## 📚 Características Implementadas

### ✅ Rate Limiting
- Login: 5 intentos / 15 min
- Registro: 3 intentos / hora
- Reset password: 3 intentos / hora
- Upload: 10 archivos / 15 min
- General: 100 requests / 15 min

### ✅ Validación de Datos
- Email válido y normalizado
- Contraseñas fuertes (8+ caracteres, mayúsculas, minúsculas, números)
- Edad mayor de 18 años
- Sanitización contra XSS
- Protección SQL injection

### ✅ Headers de Seguridad
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy
- Permissions-Policy

### ✅ Autenticación Mejorada
- JWT tokens con expiración
- Bcrypt con 12 rounds
- Reset de contraseña seguro
- Tokens de reset con expiración de 1 hora

### ✅ Logging
- Todos los requests HTTP
- Intentos de login fallidos
- Accesos no autorizados
- Eventos de seguridad

## 📖 Documentación Adicional

- [SECURITY.md](SECURITY.md) - Guía completa de seguridad
- [README.md](README.md) - Documentación general del proyecto

## 🔄 Actualizar Seguridad

### Cada semana:
```bash
npm audit
npm audit fix
```

### Cada mes:
```bash
npm update
npm audit
```

## ⚠️ Importante para Producción

Antes de ir a producción, asegúrate de:

1. ✅ Cambiar `NODE_ENV=production`
2. ✅ Usar un JWT_SECRET único y fuerte
3. ✅ Configurar HTTPS
4. ✅ Configurar CORS solo para tu dominio
5. ✅ Revisar todos los valores en `.env`
6. ✅ Configurar backups automatizados
7. ✅ Implementar monitoreo de logs
8. ✅ Configurar email real para reset de contraseña

---

**¿Necesitas ayuda?** Consulta [SECURITY.md](SECURITY.md) para más información.

