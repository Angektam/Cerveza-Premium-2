# 🔒 Guía de Seguridad - Cerveza Premium

## 📋 Índice
1. [Características de Seguridad Implementadas](#características-de-seguridad-implementadas)
2. [Configuración Segura](#configuración-segura)
3. [Mejores Prácticas](#mejores-prácticas)
4. [Rate Limiting](#rate-limiting)
5. [Validación de Datos](#validación-de-datos)
6. [Manejo de Contraseñas](#manejo-de-contraseñas)
7. [Seguridad de Archivos](#seguridad-de-archivos)
8. [Logging y Monitoreo](#logging-y-monitoreo)

## 🛡️ Características de Seguridad Implementadas

### 1. Helmet - Cabeceras HTTP Seguras
- Content Security Policy (CSP)
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Strict-Transport-Security (HSTS)

### 2. Rate Limiting
- **General**: 100 requests por 15 minutos
- **Login**: 5 intentos por 15 minutos
- **Registro**: 3 registros por hora
- **Reset de contraseña**: 3 intentos por hora
- **Upload de archivos**: 10 uploads por 15 minutos

### 3. Validación de Inputs
- Validación con express-validator
- Sanitización de datos
- Protección contra XSS
- Protección contra SQL Injection (prepared statements)
- Protección contra HTTP Parameter Pollution (HPP)

### 4. Autenticación y Autorización
- JWT tokens con expiración configurable
- Bcrypt para hash de contraseñas (12 rounds por defecto)
- Reset de contraseña seguro con tokens únicos
- Middleware de autorización por roles

### 5. Logging de Seguridad
- Registro de intentos de login fallidos
- Registro de accesos no autorizados
- Logs de actividad con Morgan
- Almacenamiento de logs en archivos

## ⚙️ Configuración Segura

### Variables de Entorno Críticas

```bash
# NUNCA uses estos valores en producción
JWT_SECRET=genera_un_secreto_super_seguro_aleatorio_minimo_32_caracteres
BCRYPT_ROUNDS=12
NODE_ENV=production

# Genera un secreto seguro con:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Generar JWT Secret Seguro

```bash
# En terminal
openssl rand -hex 64

# O con Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 📝 Mejores Prácticas

### 1. Variables de Entorno
- ✅ NUNCA comitear archivos `.env` al repositorio
- ✅ Usar valores diferentes en desarrollo y producción
- ✅ Rotar secretos regularmente
- ✅ Usar gestores de secretos en producción (AWS Secrets Manager, HashiCorp Vault)

### 2. Base de Datos
- ✅ Usar prepared statements (ya implementado)
- ✅ Principio de mínimo privilegio para usuarios de BD
- ✅ Encriptar datos sensibles
- ✅ Backups regulares y seguros

### 3. HTTPS
```bash
# En producción, SIEMPRE usa HTTPS
# Configura tu servidor con certificados SSL/TLS
# Puedes usar Let's Encrypt para certificados gratuitos
```

### 4. CORS
```bash
# Configura CORS solo para tu dominio en producción
CORS_ORIGIN=https://tu-dominio.com
```

## 🚫 Rate Limiting

### Configuración Actual

```javascript
// Puedes ajustar en .env
RATE_LIMIT_WINDOW_MS=900000  # 15 minutos
RATE_LIMIT_MAX_REQUESTS=100  # Máximo de requests
```

### Endpoints Protegidos

| Endpoint | Límite | Ventana |
|----------|--------|---------|
| /api/auth/login | 5 requests | 15 min |
| /api/auth/register | 3 requests | 1 hora |
| /api/auth/forgot-password | 3 requests | 1 hora |
| /api/upload | 10 requests | 15 min |
| Todas las demás rutas | 100 requests | 15 min |

## ✅ Validación de Datos

### Registro de Usuario
```javascript
// Validaciones aplicadas:
- Nombre: mínimo 3 caracteres, solo letras y espacios
- Email: formato válido y normalizado
- Contraseña: mínimo 8 caracteres, 1 mayúscula, 1 minúscula, 1 número
- Teléfono: formato válido
- Edad: verificación de mayoría de edad (18+)
```

### Login
```javascript
// Validaciones aplicadas:
- Email: formato válido
- Contraseña: mínimo 4 caracteres
```

## 🔐 Manejo de Contraseñas

### Hash de Contraseñas
```javascript
// Usando bcrypt con rounds configurables
const saltRounds = process.env.BCRYPT_ROUNDS || 12;
const hash = await bcrypt.hash(password, saltRounds);
```

### Reset de Contraseña
1. Usuario solicita reset
2. Se genera token aleatorio seguro (32 bytes)
3. Token se hashea antes de guardar en BD
4. Token expira en 1 hora
5. Se envía email con enlace único
6. Usuario puede resetear solo una vez

### Requisitos de Contraseña
- Mínimo 8 caracteres
- Al menos 1 letra mayúscula
- Al menos 1 letra minúscula
- Al menos 1 número
- Se recomienda símbolos especiales

## 📁 Seguridad de Archivos

### Validaciones Implementadas
```javascript
// Tipos MIME permitidos
const allowedMimeTypes = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
];

// Tamaño máximo: 5MB
// Extensiones permitidas: .jpg, .jpeg, .png, .gif, .webp
```

### Mejores Prácticas
- ✅ Validar tipo MIME
- ✅ Validar extensión
- ✅ Limitar tamaño de archivo
- ✅ Renombrar archivos al subir
- ✅ Almacenar fuera del directorio web público
- ✅ Escanear archivos con antivirus (recomendado en producción)

## 📊 Logging y Monitoreo

### Logs Implementados

1. **Access Logs** (Morgan)
   - Todas las peticiones HTTP
   - Guardado en `logs/access.log`

2. **Security Logs** (Custom)
   - Intentos de login fallidos
   - Accesos no autorizados
   - Tokens expirados
   - Guardado en base de datos (tabla `security_logs`)

### Eventos Registrados
```javascript
- FAILED_LOGIN: Intento de login fallido
- SUCCESSFUL_LOGIN: Login exitoso
- UNAUTHORIZED_ACCESS: Acceso sin autorización
- TOKEN_EXPIRED: Token expirado
- FILE_UPLOAD: Subida de archivo
```

### Revisar Logs
```bash
# Ver logs de acceso
tail -f backend/logs/access.log

# Ver logs de errores
tail -f backend/logs/error.log
```

## 🚨 Respuesta a Incidentes

### Si detectas actividad sospechosa:

1. **Revisar logs**:
```bash
grep "FAILED_LOGIN" backend/logs/access.log
```

2. **Bloquear IP (temporal)**:
```javascript
// Agregar a rate limiter o firewall
```

3. **Forzar logout de sesiones**:
```sql
-- Invalidar todas las sesiones de un usuario
UPDATE active_sessions SET is_active = FALSE WHERE usuario_id = ?;
```

4. **Cambiar secretos JWT**:
```bash
# Genera nuevo JWT_SECRET y reinicia servidor
```

## 📚 Recursos Adicionales

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

## ⚠️ Advertencias

### NO hacer en Producción:
- ❌ Exponer errores detallados al cliente
- ❌ Usar JWT_SECRET débil o por defecto
- ❌ Deshabilitar HTTPS
- ❌ Deshabilitar rate limiting
- ❌ Usar console.log para información sensible
- ❌ Comitear credenciales al repositorio
- ❌ Usar dependencias desactualizadas

### Checklist de Producción:
- ✅ NODE_ENV=production
- ✅ HTTPS habilitado
- ✅ Secretos seguros y únicos
- ✅ CORS configurado para dominio específico
- ✅ Rate limiting activo
- ✅ Logs configurados
- ✅ Backups automatizados
- ✅ Monitoreo activo
- ✅ Dependencias actualizadas
- ✅ Certificados SSL válidos

## 🔄 Mantenimiento de Seguridad

### Actualizar Dependencias
```bash
# Revisar vulnerabilidades
npm audit

# Corregir automáticamente
npm audit fix

# Actualizar dependencias
npm update
```

### Revisar Periódicamente
- Logs de seguridad (diario)
- Dependencias vulnerables (semanal)
- Secretos y tokens (mensual)
- Políticas de acceso (trimestral)

---

**Última actualización**: Octubre 2025
**Mantenedor**: Equipo de Desarrollo Cerveza Premium

