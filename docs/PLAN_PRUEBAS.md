# 📋 Plan de Pruebas Completo - Cerveza Premium

## 🎯 Objetivo
Verificar el funcionamiento correcto de todas las páginas y funciones de la aplicación.

---

## 📱 PÁGINAS Y VISTAS A PROBAR

### 1. **Vista de Login** (`loginView`)
**Funciones a probar:**
- [ ] Login con credenciales válidas (admin@cervezapremium.com / 1234)
- [ ] Login con credenciales válidas (vendedor@cervezapremium.com / 1234)
- [ ] Login con credenciales válidas (maria@ejemplo.com / 1234)
- [ ] Login con credenciales inválidas (debe mostrar error)
- [ ] Campo email vacío (validación)
- [ ] Campo contraseña vacío (validación)
- [ ] Email inválido (validación de formato)
- [ ] Toggle de visibilidad de contraseña
- [ ] Link "¿Olvidaste tu contraseña?" funciona
- [ ] Link "Crear cuenta" funciona
- [ ] Link "Acceso Admin" funciona
- [ ] Redirección correcta según rol (admin/vendedor → adminDashboard, cliente → dashboard)

### 2. **Vista de Registro** (`signupView`)
**Funciones a probar:**
- [ ] Navegación entre pasos (0, 1, 2, 3)
- [ ] Paso 0: Verificación de identidad
  - [ ] Selección de tipo de identificación
  - [ ] Ingreso de número de identificación
  - [ ] Subida de foto frontal
  - [ ] Subida de foto reverso
  - [ ] Validación de campos completos
- [ ] Paso 1: Datos básicos
  - [ ] Nombre completo (validación)
  - [ ] Email (validación de formato y duplicado)
  - [ ] Contraseña (mínimo 8 caracteres)
  - [ ] Confirmar contraseña (debe coincidir)
  - [ ] Toggle de visibilidad de contraseñas
- [ ] Paso 2: Información adicional
  - [ ] Fecha de nacimiento (validación de edad)
  - [ ] Teléfono (validación de formato)
  - [ ] Dirección completa
- [ ] Paso 3: Confirmación
  - [ ] Checkbox de confirmación de edad
  - [ ] Checkbox de términos y condiciones
  - [ ] Envío del formulario completo
- [ ] Botones de navegación (Siguiente/Atrás)
- [ ] Validación de campos requeridos en cada paso

### 3. **Vista de Recuperación de Contraseña** (`forgotPasswordView`)
**Funciones a probar:**
- [ ] Ingreso de email
- [ ] Validación de email
- [ ] Envío de solicitud de recuperación
- [ ] Mensaje de confirmación
- [ ] Link de regreso a login

### 4. **Vista de Restablecer Contraseña** (`resetPasswordView`)
**Funciones a probar:**
- [ ] Ingreso de nueva contraseña
- [ ] Confirmación de nueva contraseña
- [ ] Validación de coincidencia
- [ ] Toggle de visibilidad
- [ ] Envío del formulario

### 5. **Vista de Login Admin** (`adminLoginView`)
**Funciones a probar:**
- [ ] Login con credenciales de admin
- [ ] Login con credenciales de vendedor
- [ ] Login con credenciales de cliente (debe rechazar)
- [ ] Validaciones de campos
- [ ] Redirección a adminDashboard

### 6. **Dashboard Principal** (`dashboardView`)
**Funciones a probar:**
- [ ] Visualización de puntos acumulados
- [ ] Badge de carrito (muestra cantidad correcta)
- [ ] Badge de favoritos (muestra cantidad correcta)
- [ ] Badge de notificaciones (muestra cantidad correcta)
- [ ] Botón "Pedir a Domicilio"
- [ ] Botón "Ver Catálogo"
- [ ] Botón "Mi Carrito"
- [ ] Botón "Mis Pedidos"
- [ ] Botón "Mi Perfil"
- [ ] Botón "Mis Favoritos"
- [ ] Botón "Historial de Puntos"
- [ ] Botón "Mis Direcciones"
- [ ] Botón "Notificaciones"
- [ ] Botón "Configuración"
- [ ] Botón "Promociones"
- [ ] Botón "Recomendaciones"
- [ ] Botón "Cerrar Sesión"
- [ ] Navegación a todas las vistas desde el dashboard

### 7. **Vista de Catálogo** (`catalogView`)
**Funciones a probar:**
- [ ] Carga de cervezas desde la API
- [ ] Visualización de tarjetas de cervezas
- [ ] Imágenes se cargan correctamente (sin errores ERR_NAME_NOT_RESOLVED)
- [ ] Búsqueda de cervezas (por nombre, estilo)
- [ ] Filtros funcionan correctamente
- [ ] Botón "Agregar al Carrito" funciona
- [ ] Botón "Favorito" (corazón) funciona
- [ ] Vista de cuadrícula/lista (toggle)
- [ ] Paginación (si existe)
- [ ] Botón "Volver" al dashboard
- [ ] Información de cada cerveza (nombre, precio, puntos, descripción)

### 8. **Vista de Carrito** (`cartView`)
**Funciones a probar:**
- [ ] Visualización de items del carrito
- [ ] Imágenes de productos se cargan correctamente
- [ ] Aumentar cantidad (+)
- [ ] Disminuir cantidad (-)
- [ ] Eliminar item del carrito
- [ ] Cálculo correcto de subtotal
- [ ] Cálculo correcto de envío
- [ ] Cálculo correcto de total
- [ ] Aplicar puntos como descuento
- [ ] Opción de recogida en tienda
- [ ] Opción de entrega a domicilio
- [ ] Selección de dirección de entrega
- [ ] Mapa de entrega (si aplica)
- [ ] Botón "Proceder al Pago"
- [ ] Botón "Continuar Comprando"
- [ ] Botón "Volver" al dashboard
- [ ] Mensaje cuando el carrito está vacío

### 9. **Vista de Perfil** (`profileView`)
**Funciones a probar:**
- [ ] Visualización de información del usuario
- [ ] Edición de nombre completo
- [ ] Edición de teléfono
- [ ] Edición de dirección
- [ ] Cambio de contraseña
  - [ ] Contraseña actual (validación)
  - [ ] Nueva contraseña (validación)
  - [ ] Confirmar nueva contraseña (validación)
- [ ] Guardar cambios
- [ ] Tabs de navegación (Información, Seguridad, Preferencias)
- [ ] Botón "Volver" al dashboard
- [ ] Estadísticas del perfil (pedidos, puntos, etc.)

### 10. **Vista de Pedidos** (`ordersView`)
**Funciones a probar:**
- [ ] Carga de pedidos desde la API
- [ ] Visualización de lista de pedidos
- [ ] Información de cada pedido (fecha, total, estado)
- [ ] Detalles de pedido
- [ ] Filtros de pedidos (si existen)
- [ ] Botón "Volver" al dashboard
- [ ] Mensaje cuando no hay pedidos

### 11. **Vista de Favoritos** (`favoritesView`)
**Funciones a probar:**
- [ ] Visualización de cervezas favoritas
- [ ] Imágenes se cargan correctamente
- [ ] Eliminar de favoritos
- [ ] Agregar al carrito desde favoritos
- [ ] Botón "Volver" al dashboard
- [ ] Mensaje cuando no hay favoritos
- [ ] Botón "Ir al Catálogo"

### 12. **Vista de Direcciones** (`addressesView`)
**Funciones a probar:**
- [ ] Visualización de direcciones guardadas
- [ ] Agregar nueva dirección
- [ ] Editar dirección existente
- [ ] Eliminar dirección
- [ ] Establecer dirección predeterminada
- [ ] Validación de campos de dirección
- [ ] Botón "Volver" al dashboard

### 13. **Vista de Notificaciones** (`notificationsView`)
**Funciones a probar:**
- [ ] Visualización de notificaciones
- [ ] Marcar como leída
- [ ] Eliminar notificación
- [ ] Contador de notificaciones no leídas
- [ ] Botón "Volver" al dashboard
- [ ] Mensaje cuando no hay notificaciones

### 14. **Vista de Configuración** (`settingsView`)
**Funciones a probar:**
- [ ] Configuración de notificaciones por email
- [ ] Configuración de notificaciones de promociones
- [ ] Configuración de notificaciones de pedidos
- [ ] Perfil público/privado
- [ ] Compartir datos
- [ ] Selector de tema (claro/oscuro)
- [ ] Guardar configuración
- [ ] Botón "Volver" al dashboard

### 15. **Vista de Recomendaciones** (`recommendationsView`)
**Funciones a probar:**
- [ ] Visualización de recomendaciones
- [ ] Imágenes se cargan correctamente (sin errores)
- [ ] Agregar al carrito desde recomendaciones
- [ ] Badges de recomendación (Popular, Trending, Nuevo, Recomendado)
- [ ] Botón "Volver" al dashboard

### 16. **Dashboard de Admin** (`adminDashboardView`)
**Funciones a probar:**
- [ ] Visualización de estadísticas generales
- [ ] Navegación a secciones:
  - [ ] Gestión de Cervezas
  - [ ] Gestión de Pedidos
  - [ ] Gestión de Usuarios
  - [ ] Reportes y Analytics
  - [ ] Notificaciones
  - [ ] Descuentos
  - [ ] Configuración de Domicilio
- [ ] Modales se abren correctamente
- [ ] Modales se cierran correctamente (X, ESC, clic fuera)
- [ ] Solo un modal abierto a la vez

---

## 🔧 FUNCIONALIDADES ADMINISTRATIVAS

### 17. **Gestión de Cervezas** (Admin)
**Funciones a probar:**
- [ ] Lista de cervezas se carga correctamente
- [ ] Imágenes se muestran correctamente (sin errores)
- [ ] Agregar nueva cerveza
  - [ ] Formulario completo
  - [ ] Validación de campos
  - [ ] Subida de imagen
  - [ ] Guardar cerveza
- [ ] Editar cerveza existente
  - [ ] Cargar datos en formulario
  - [ ] Modificar campos
  - [ ] Actualizar cerveza
- [ ] Eliminar cerveza
- [ ] Gestionar stock
  - [ ] Ver stock actual
  - [ ] Establecer nuevo stock
  - [ ] Aumentar stock
  - [ ] Disminuir stock
- [ ] Filtros y búsqueda

### 18. **Gestión de Pedidos** (Admin)
**Funciones a probar:**
- [ ] Lista de pedidos se carga
- [ ] Ver detalles de pedido
- [ ] Cambiar estado de pedido
- [ ] Filtros de pedidos

### 19. **Gestión de Usuarios** (Admin)
**Funciones a probar:**
- [ ] Lista de usuarios se carga
- [ ] Ver detalles de usuario
- [ ] Editar usuario
- [ ] Activar/desactivar usuario

### 20. **Reportes y Analytics** (Admin)
**Funciones a probar:**
- [ ] Carga de reportes
- [ ] Visualización de gráficos
- [ ] Productos más vendidos
- [ ] Ventas totales
- [ ] Clientes únicos
- [ ] Imágenes de productos en reportes se cargan correctamente

### 21. **Gestión de Notificaciones** (Admin)
**Funciones a probar:**
- [ ] Crear notificación
  - [ ] Formulario completo
  - [ ] Selección de usuarios
  - [ ] Envío de notificación
- [ ] Lista de notificaciones
- [ ] Editar notificación
- [ ] Eliminar notificación

### 22. **Gestión de Descuentos** (Admin)
**Funciones a probar:**
- [ ] Crear descuento
  - [ ] Código de descuento
  - [ ] Tipo (porcentaje/cantidad fija)
  - [ ] Valor
  - [ ] Fechas de vigencia
  - [ ] Límite de usos
- [ ] Lista de descuentos
- [ ] Editar descuento
- [ ] Eliminar descuento
- [ ] Activar/desactivar descuento

### 23. **Configuración de Domicilio** (Admin)
**Funciones a probar:**
- [ ] Configuración de dirección del negocio
- [ ] Configuración de costos de envío
- [ ] Configuración de tiempo de entrega
- [ ] Configuración de zonas de entrega
- [ ] Guardar configuración

---

## 🛠️ FUNCIONALIDADES GENERALES

### 24. **Sistema de Puntos**
**Funciones a probar:**
- [ ] Visualización de puntos acumulados
- [ ] Historial de puntos se carga correctamente
- [ ] Puntos ganados por compra
- [ ] Uso de puntos como descuento
- [ ] Cálculo correcto de puntos ganados

### 25. **Sistema de Carrito**
**Funciones a probar:**
- [ ] Agregar producto al carrito
- [ ] Actualizar cantidad
- [ ] Eliminar producto
- [ ] Persistencia del carrito (recarga de página)
- [ ] Sincronización con backend
- [ ] Badge de carrito se actualiza

### 26. **Sistema de Favoritos**
**Funciones a probar:**
- [ ] Agregar a favoritos
- [ ] Eliminar de favoritos
- [ ] Persistencia de favoritos
- [ ] Badge de favoritos se actualiza
- [ ] Visualización en vista de favoritos

### 27. **Sistema de Autenticación**
**Funciones a probar:**
- [ ] Login exitoso
- [ ] Logout
- [ ] Persistencia de sesión
- [ ] Protección de rutas (requiere autenticación)
- [ ] Redirección según rol
- [ ] Token JWT válido

### 28. **Sistema de Modales**
**Funciones a probar:**
- [ ] Apertura de modales
- [ ] Cierre con botón X
- [ ] Cierre con tecla ESC
- [ ] Cierre al hacer clic fuera
- [ ] Solo un modal abierto a la vez
- [ ] Formularios en modales funcionan

### 29. **Sistema de Imágenes**
**Funciones a probar:**
- [ ] Todas las imágenes se cargan correctamente
- [ ] No hay errores ERR_NAME_NOT_RESOLVED
- [ ] Placeholders funcionan cuando no hay imagen
- [ ] Normalización de URLs funciona

### 30. **Chatbot**
**Funciones a probar:**
- [ ] Botón flotante visible
- [ ] Apertura/cierre del chat
- [ ] Envío de mensajes
- [ ] Respuestas automáticas
- [ ] Botones de respuesta rápida
- [ ] Integración con datos reales (carrito, pedidos)

---

## 🐛 VERIFICACIONES DE ERRORES

### 31. **Errores de Consola**
- [ ] No hay errores ERR_NAME_NOT_RESOLVED
- [ ] No hay errores 404
- [ ] No hay errores 500
- [ ] No hay errores de CORS
- [ ] No hay errores de JavaScript

### 32. **Errores de Red**
- [ ] Todas las peticiones API responden correctamente
- [ ] No hay llamadas duplicadas innecesarias
- [ ] Throttling funciona en carrito

### 33. **Errores de UI**
- [ ] Todos los modales se cierran correctamente
- [ ] No hay superposición de modales
- [ ] Navegación fluida entre vistas
- [ ] Mensajes de error se muestran correctamente

---

## 📝 CHECKLIST DE PRUEBAS RÁPIDAS

### Pruebas Críticas (Hacer primero):
1. [ ] Login con cada tipo de usuario
2. [ ] Navegación entre todas las vistas
3. [ ] Agregar producto al carrito
4. [ ] Proceso de checkout completo
5. [ ] Cierre de modales (X, ESC, clic fuera)
6. [ ] Carga de imágenes (sin errores)
7. [ ] Funciones de admin (si eres admin)

### Pruebas de Integración:
1. [ ] Flujo completo: Login → Catálogo → Carrito → Checkout
2. [ ] Flujo de registro completo
3. [ ] Flujo de recuperación de contraseña
4. [ ] Flujo de admin: Login → Dashboard → Gestión → Guardar

### Pruebas de Validación:
1. [ ] Todos los formularios validan correctamente
2. [ ] Mensajes de error apropiados
3. [ ] Campos requeridos funcionan
4. [ ] Formatos de email, teléfono, etc.

---

## 🎯 CREDENCIALES DE PRUEBA

### Admin:
- Email: `admin@cervezapremium.com`
- Contraseña: `1234`

### Vendedor:
- Email: `vendedor@cervezapremium.com`
- Contraseña: `1234`

### Cliente:
- Email: `maria@ejemplo.com`
- Contraseña: `1234`

---

## ✅ CRITERIOS DE ÉXITO

- ✅ Todas las páginas cargan sin errores
- ✅ Todas las funciones principales funcionan
- ✅ No hay errores en la consola del navegador
- ✅ Las imágenes se cargan correctamente
- ✅ Los modales se cierran correctamente
- ✅ La navegación es fluida
- ✅ Las validaciones funcionan
- ✅ La autenticación funciona correctamente
- ✅ El carrito persiste y sincroniza
- ✅ Los puntos se calculan correctamente

---

**Fecha de creación:** 2025-12-01
**Última actualización:** 2025-12-01

