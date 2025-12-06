# 🚀 Configuración Rápida de Email

## Para configurar y probar el email a angek23412@gmail.com:

### Paso 1: Obtener Contraseña de Aplicación de Gmail

1. Ve a: https://myaccount.google.com/security
2. Activa **"Verificación en 2 pasos"** (si no lo tienes)
3. Ve a **"Contraseñas de aplicaciones"**
4. Selecciona **"Correo"** y **"Otro (nombre personalizado)"**
5. Escribe "Cerveza Premium" y haz clic en **"Generar"**
6. **Copia la contraseña de 16 caracteres** (sin espacios)

### Paso 2: Ejecutar el Script

Desde el directorio `backend`, ejecuta:

```powershell
node quick-email-setup.js tu_email@gmail.com tu_contraseña_de_16_caracteres angek23412@gmail.com
```

**Ejemplo:**
```powershell
node quick-email-setup.js miemail@gmail.com abcdefghijklmnop angek23412@gmail.com
```

### Paso 3: Verificar

El script:
- ✅ Creará/actualizará el archivo `.env`
- ✅ Configurará Gmail SMTP
- ✅ Enviará un email de prueba a angek23412@gmail.com
- ✅ Te mostrará el resultado

### Alternativa: Script Interactivo

Si prefieres un script interactivo:

```powershell
node setup-email.js
```

Este script te pedirá los datos paso a paso.

---

## ⚠️ Nota Importante

**NO compartas tu contraseña de aplicación.** Es específica para esta aplicación y debe mantenerse segura.

