# 🔧 Solución al Error de Autenticación de Email

## Error: "Invalid login: Username and Password not accepted"

Este error ocurre cuando:
- ❌ Usaste valores de ejemplo en lugar de tus datos reales
- ❌ La contraseña de aplicación no es correcta
- ❌ No usaste una "Contraseña de aplicación" (usaste tu contraseña normal)

## ✅ Solución Paso a Paso

### Paso 1: Obtener Contraseña de Aplicación Correcta

1. **Ve a tu cuenta de Google:**
   - https://myaccount.google.com/security

2. **Activa Verificación en 2 pasos** (si no está activada):
   - Es OBLIGATORIO tener esto activado
   - Sin esto, no puedes generar contraseñas de aplicación

3. **Ve a "Contraseñas de aplicaciones":**
   - En la sección "Cómo iniciar sesión en Google"
   - Haz clic en "Contraseñas de aplicaciones"

4. **Genera una nueva contraseña:**
   - Selecciona "Correo"
   - Selecciona "Otro (nombre personalizado)"
   - Escribe: "Cerveza Premium"
   - Haz clic en "Generar"

5. **Copia la contraseña:**
   - Te mostrará una contraseña de **16 caracteres**
   - Ejemplo: `abcd efgh ijkl mnop` (cópiala SIN espacios)
   - Esta es tu contraseña de aplicación

### Paso 2: Actualizar la Configuración

Ejecuta el script interactivo:

```powershell
cd backend
node actualizar-password.js
```

El script te pedirá:
1. Tu email de Gmail (si no está configurado)
2. La contraseña de aplicación de 16 caracteres
3. Si quieres probar el servicio

### Paso 3: Verificar

Después de actualizar, el script probará el servicio automáticamente.

---

## ⚠️ Importante

- **NO uses tu contraseña normal de Gmail**
- **DEBES usar una "Contraseña de aplicación"** de 16 caracteres
- **La verificación en 2 pasos DEBE estar activada**
- La contraseña de aplicación es específica para esta aplicación

---

## 🧪 Probar Manualmente

Si quieres probar manualmente después de configurar:

```powershell
node test-email.js angek23412@gmail.com
```

---

## 📝 Verificar Configuración Actual

Para ver qué tienes configurado:

```powershell
Get-Content backend\.env | Select-String -Pattern "SMTP"
```

Debes ver algo como:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu_email_real@gmail.com
SMTP_PASS=abcdefghijklmnop
EMAIL_FROM=tu_email_real@gmail.com
```

Si ves `tu_email@gmail.com` o `tu_contraseña_de_16_caracteres`, necesitas actualizar con tus valores reales.

