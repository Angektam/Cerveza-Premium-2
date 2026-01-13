# 🚨 Diagnóstico Rápido: Error 504 Gateway Timeout

## ⚡ Verificación Rápida (5 minutos)

### 1. Verifica el Estado en Railway

**En Railway:**
1. Abre tu servicio de backend
2. **¿Qué estado ves?**
   - ✅ **Active/Running** → Ve al paso 2
   - ❌ **Failed/Stopped** → Ve al paso 3
   - ⏳ **Building** → Espera a que termine

### 2. Revisa los Logs

**En Railway → Logs:**
1. Busca el último mensaje
2. **¿Qué dice?**
   - "Server running on port..." → El servidor está funcionando
   - "Cannot connect to database" → Problema con MySQL
   - "Missing required environment variable" → Falta una variable
   - Otro error → Copia el mensaje exacto

### 3. Verifica Variables de Entorno Básicas

**En Railway → Variables, verifica que existan:**

```
✅ DB_HOST
✅ DB_USER
✅ DB_PASSWORD
✅ DB_NAME
✅ PORT (debe ser 4000)
✅ NODE_ENV (debe ser production)
✅ JWT_SECRET (al menos 32 caracteres)
✅ CORS_ORIGIN
```

**Si falta alguna, agrégalas.**

### 4. Verifica la Base de Datos

**¿Tienes MySQL en Railway?**
- ❌ **No** → Agrega un servicio MySQL y actualiza las variables DB_*
- ✅ **Sí** → Verifica que esté corriendo y que las variables apunten a él

### 5. Verifica la Configuración del Servicio

**En Railway → Settings:**
- **Root Directory:** `backend`
- **Start Command:** `node server.js`

## 🔧 Soluciones por Error

### Si ves "Cannot connect to database":

1. **Verifica que MySQL esté corriendo**
2. **Verifica las variables DB_***
3. **Copia los valores exactos desde Railway MySQL**
4. **Reinicia el servicio**

### Si ves "Missing required environment variable":

1. **Lee el mensaje:** te dirá qué variable falta
2. **Agrégala en Railway → Variables**
3. **Reinicia el servicio**

### Si ves "Port already in use":

1. **Verifica que uses `process.env.PORT`** (ya está configurado)
2. **No hardcodees el puerto a 4000**
3. **Deja que Railway asigne el puerto**

### Si no hay errores pero sigue sin responder:

1. **Verifica que el servidor esté escuchando:**
   - Busca en logs: "Server running on port..."
   - Si no aparece, el servidor no inició

2. **Prueba el health check directamente:**
   ```
   https://cerveza-premium-2-production.up.railway.app/api/auth/health
   ```
   - Si funciona → El backend está bien, el problema es otro
   - Si da 504 → El backend no responde

## ✅ Checklist Completo

Marca cada punto:

- [ ] El servicio está en estado "Active" en Railway
- [ ] No hay errores en los logs
- [ ] Todas las variables de entorno están configuradas
- [ ] El servicio MySQL está corriendo
- [ ] Las variables DB_* apuntan al MySQL correcto
- [ ] Root Directory está configurado como `backend`
- [ ] Start Command es `node server.js`
- [ ] El health check responde: `/api/auth/health`
- [ ] CORS_ORIGIN incluye tu dominio de Vercel/Netlify

## 🆘 Si Nada Funciona

1. **Comparte los logs completos:**
   - Railway → Logs → Copia los últimos 50-100 líneas
   - Especialmente errores en rojo

2. **Reinicia el servicio:**
   - Railway → Settings → Redeploy o Restart

3. **Verifica que funcione localmente:**
   ```bash
   cd backend
   npm install
   node server.js
   ```
   - Si no funciona localmente, el problema está en el código
   - Si funciona localmente, el problema está en Railway

## 📝 Información que Necesito para Ayudarte

1. **Estado del servicio en Railway:** ¿Active, Failed, Building?
2. **Últimos 10-20 líneas de los logs:** Copia y pega
3. **Variables de entorno configuradas:** ¿Cuáles tienes?
4. **¿Tienes MySQL en Railway?** ¿Está corriendo?
5. **¿Funciona localmente?** Prueba `node server.js` localmente

---

**Comparte esta información y te ayudo a solucionarlo específicamente.**
