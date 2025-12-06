# 🚀 Configuración Rápida de Email

## Opción 1: Gmail (Más Fácil para Probar)

### Paso 1: Crear Contraseña de Aplicación en Google

1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. Ve a **Seguridad**
3. Activa **Verificación en 2 pasos** (si no lo tienes activado)
4. Ve a **Contraseñas de aplicaciones**
5. Selecciona **Correo** y **Otro (nombre personalizado)**
6. Escribe "Cerveza Premium" y haz clic en **Generar**
7. **Copia la contraseña de 16 caracteres** que te muestra

### Paso 2: Agregar al archivo .env

Abre el archivo `backend/.env` y agrega estas líneas al final:

```env
# Email - Configuración SMTP (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu_email@gmail.com
SMTP_PASS=la_contraseña_de_16_caracteres_que_copiaste
EMAIL_FROM=tu_email@gmail.com
```

**Reemplaza:**
- `tu_email@gmail.com` con tu email de Gmail
- `la_contraseña_de_16_caracteres_que_copiaste` con la contraseña que generaste

### Paso 3: Reiniciar el servidor

```bash
# Detén el servidor (Ctrl+C) y vuelve a iniciarlo
npm start
```

Deberías ver: `✅ Servicio de email configurado: SMTP`

### Paso 4: Probar

```bash
node test-email.js tu_email@ejemplo.com
```

---

## Opción 2: SendGrid (Para Producción)

1. Crea cuenta en https://sendgrid.com/
2. Ve a Settings > API Keys
3. Crea una nueva API Key con permisos "Mail Send"
4. Copia la API Key

Agrega al `.env`:

```env
SENDGRID_API_KEY=tu_api_key_aqui
EMAIL_FROM=noreply@cervezapremium.com
```

---

## ⚠️ Problemas Comunes

### "Invalid login" o "Authentication failed"
- Verifica que usaste una **Contraseña de aplicación**, no tu contraseña normal de Gmail
- Asegúrate de que la verificación en 2 pasos esté activada

### "Connection timeout"
- Verifica tu conexión a internet
- Algunos firewalls bloquean el puerto 587, prueba con 465 y `SMTP_SECURE=true`

### No recibo el email
- Revisa la carpeta de **Spam**
- Verifica que el email de destino sea correcto
- Revisa los logs del servidor para ver errores

