# 🔧 Corrección de Puerto

## Problema
El backend estaba configurado para usar el puerto **3000**, pero el frontend está configurado para conectarse al puerto **4000**.

## Solución Aplicada
Se actualizó el archivo `backend/.env` para cambiar:
- `PORT=3000` → `PORT=4000`

## Próximos Pasos

1. **Detén el servidor backend** (Ctrl+C en la terminal donde está corriendo)

2. **Reinicia el backend:**
   ```powershell
   npm start
   ```

3. **Verifica que ahora dice:**
   ```
   Servidor corriendo en puerto 4000
   ```

4. **El frontend ahora podrá conectarse correctamente**

## Verificación

Una vez reiniciado, deberías ver:
- ✅ Backend: `http://localhost:4000`
- ✅ Frontend: `http://localhost:4200`
- ✅ Sin errores `ERR_CONNECTION_REFUSED`

