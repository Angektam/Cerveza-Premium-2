# 📧 Configuración del Servicio de Email

Este documento explica cómo configurar el servicio de email para Cerveza Premium.

## 🚀 Opciones de Configuración

El sistema soporta dos métodos para enviar emails:

### Opción 1: SendGrid (Recomendado para Producción)

1. Crea una cuenta en [SendGrid](https://sendgrid.com/)
2. Genera una API Key:
   - Ve a Settings > API Keys
   - Crea una nueva API Key con permisos de "Mail Send"
3. Agrega la API Key a tu archivo `.env`:
   ```env
   SENDGRID_API_KEY=tu_api_key_aqui
   EMAIL_FROM=noreply@cervezapremium.com
   ```

### Opción 2: SMTP (Gmail u otro servidor)

#### Para Gmail:

1. Habilita la verificación en 2 pasos en tu cuenta de Google
2. Genera una "Contraseña de aplicación":
   - Ve a tu cuenta de Google
   - Seguridad > Verificación en 2 pasos
   - Contraseñas de aplicaciones
   - Genera una contraseña para "Correo"
3. Agrega la configuración a tu archivo `.env`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=tu_email@gmail.com
   SMTP_PASS=tu_contraseña_de_aplicacion
   EMAIL_FROM=tu_email@gmail.com
   ```

#### Para otros servidores SMTP:

```env
SMTP_HOST=smtp.tu-servidor.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu_email@dominio.com
SMTP_PASS=tu_contraseña
EMAIL_FROM=tu_email@dominio.com
```

## 🧪 Probar el Servicio

### Método 1: Script de Prueba

```bash
cd backend
node test-email.js tu_email@ejemplo.com
```

### Método 2: API Endpoint

```bash
# Verificar configuración
curl http://localhost:3000/api/email/check

# Enviar email de prueba
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"to": "tu_email@ejemplo.com", "subject": "Prueba", "message": "Mensaje de prueba"}'
```

## 📋 Endpoints Disponibles

### GET `/api/email/check`
Verifica la configuración del servicio de email.

**Respuesta:**
```json
{
  "configured": true,
  "method": "SMTP"
}
```

### POST `/api/email/test`
Envía un email de prueba.

**Body:**
```json
{
  "to": "destino@ejemplo.com",
  "subject": "Asunto (opcional)",
  "message": "Mensaje personalizado (opcional)"
}
```

### POST `/api/email/welcome`
Envía un email de bienvenida.

**Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "name": "Nombre del Usuario"
}
```

### POST `/api/email/send`
Envía un email personalizado.

**Body:**
```json
{
  "to": "destino@ejemplo.com",
  "subject": "Asunto",
  "html": "<h1>Contenido HTML</h1>",
  "text": "Contenido de texto plano (opcional)"
}
```

## 🔧 Funcionalidades

El servicio de email incluye:

- ✅ Email de bienvenida (se envía automáticamente al registrarse)
- ✅ Confirmación de pedidos
- ✅ Actualizaciones de estado de pedidos
- ✅ Promociones y ofertas
- ✅ Emails personalizados

## ⚠️ Notas Importantes

1. **Gmail**: Si usas Gmail, debes usar una "Contraseña de aplicación", no tu contraseña normal.
2. **Rate Limits**: Gmail tiene límites de envío (500 emails/día para cuentas gratuitas).
3. **Producción**: Para producción, se recomienda usar SendGrid o un servicio profesional.
4. **Spam**: Asegúrate de que tu dominio tenga configurado SPF, DKIM y DMARC para evitar que los emails vayan a spam.

## 🐛 Solución de Problemas

### Error: "Invalid login"
- Verifica que `SMTP_USER` y `SMTP_PASS` sean correctos
- Para Gmail, asegúrate de usar una contraseña de aplicación

### Error: "Connection timeout"
- Verifica que `SMTP_HOST` y `SMTP_PORT` sean correctos
- Verifica tu conexión a internet
- Algunos servidores requieren `SMTP_SECURE=true` para el puerto 465

### Error: "Email not sent"
- Revisa los logs del servidor para más detalles
- Verifica que el email de destino sea válido
- Para SendGrid, verifica que la API Key tenga permisos de "Mail Send"

