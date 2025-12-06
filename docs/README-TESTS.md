# 🧪 Suite de Tests - Cerveza Premium

Esta suite de tests completa verifica todas las funcionalidades de la aplicación Cerveza Premium.

## 📋 Archivos de Test

### 🔧 Tests del Backend (`test-backend.js`)
- ✅ Conexión al servidor (Puerto 3000)
- ✅ API de cervezas mexicanas (`/api/cervezas-mexicanas`)
- ✅ Validación de datos de cervezas
- ✅ Validación de imágenes
- ✅ Rendimiento de la API
- ✅ Headers CORS
- ✅ Manejo de errores

### 🎨 Tests del Frontend (`test-frontend.js`)
- ✅ Carga de la página (Puerto 4201)
- ✅ Visualización de cervezas
- ✅ Sistema de filtros
- ✅ Modal de detalles
- ✅ Diseño responsive
- ✅ Rendimiento
- ✅ Accesibilidad básica

### 🔗 Tests de Integración (`test-runner.js`)
- ✅ Comunicación frontend-backend
- ✅ Validación de datos
- ✅ Verificación de servidores

### 🌐 Tests Web (`test-completo.html`)
- ✅ Interfaz visual de tests
- ✅ Tests interactivos
- ✅ Reportes en tiempo real
- ✅ Estadísticas de rendimiento

## 🚀 Cómo Ejecutar los Tests

### Opción 1: Tests Automáticos (Recomendado)
```bash
# Instalar dependencias
npm install --save-dev axios puppeteer

# Ejecutar todos los tests
node test-runner.js
```

### Opción 2: Tests Individuales
```bash
# Solo backend
node test-backend.js

# Solo frontend
node test-frontend.js

# Solo web (abrir en navegador)
open test-completo.html
```

### Opción 3: Tests Web Interactivos
1. Abrir `test-completo.html` en el navegador
2. Hacer clic en "🚀 Ejecutar Todos los Tests"
3. Ver resultados en tiempo real

## 📊 Qué Verifican los Tests

### 🔧 Backend
- **Conectividad**: Servidor respondiendo en puerto 3000
- **API Endpoints**: `/api/cervezas-mexicanas` funcionando
- **Datos**: 15 cervezas mexicanas con estructura válida
- **Validación**: País = "México", precios válidos, calificaciones 0-5
- **Imágenes**: URLs de imágenes accesibles
- **Rendimiento**: Tiempo de respuesta < 1 segundo
- **CORS**: Headers configurados correctamente
- **Errores**: Manejo de endpoints inexistentes

### 🎨 Frontend
- **Carga**: Página cargando en < 3 segundos
- **Contenido**: Cervezas mostradas correctamente
- **Filtros**: Filtro por estilo, precio, calificación funcionando
- **Búsqueda**: Campo de búsqueda operativo
- **Modal**: Detalles de cerveza se abren/cierran
- **Responsive**: Funciona en móvil, tablet, desktop
- **Memoria**: Uso < 50MB
- **Accesibilidad**: Alt text en imágenes, estructura de headings

### 🔗 Integración
- **Comunicación**: Frontend puede comunicarse con backend
- **Datos**: API devuelve datos válidos al frontend
- **Flujo**: Aplicación completa funcional

## 📈 Interpretación de Resultados

### ✅ Exitoso (Verde)
- Funcionalidad trabajando perfectamente
- Cumple todos los criterios de calidad

### ⚠️ Advertencia (Amarillo)
- Funcionalidad trabajando con limitaciones
- Puede necesitar optimización
- No crítico para el funcionamiento

### ❌ Fallido (Rojo)
- Funcionalidad no trabajando
- Requiere atención inmediata
- Crítico para el funcionamiento

## 🎯 Criterios de Éxito

### Mínimo Aceptable
- ✅ 80% de tests exitosos
- ✅ Backend y frontend funcionando
- ✅ API respondiendo correctamente
- ✅ Datos de cervezas válidos

### Excelente
- ✅ 95% de tests exitosos
- ✅ Todos los filtros funcionando
- ✅ Modal de detalles operativo
- ✅ Diseño responsive perfecto
- ✅ Rendimiento óptimo

## 🔧 Solución de Problemas

### Backend No Responde
```bash
cd backend
npm start
```

### Frontend No Carga
```bash
ng serve --port 4201
```

### Tests Fallan
1. Verificar que ambos servidores estén funcionando
2. Revisar logs de error
3. Ejecutar tests individuales para aislar problemas

### Dependencias Faltantes
```bash
npm install axios puppeteer
```

## 📱 URLs de la Aplicación

- **Aplicación**: http://localhost:4201
- **API**: http://localhost:3000/api/cervezas-mexicanas
- **Tests Web**: `file:///ruta/completa/test-completo.html`

## 🏆 Funcionalidades Verificadas

### 🍺 Catálogo de Cervezas
- ✅ 15 cervezas mexicanas auténticas
- ✅ Fotos profesionales de Unsplash
- ✅ Información completa (país, cervecería, stock)
- ✅ Especificaciones técnicas (ABV, IBU)

### 🔍 Sistema de Filtros
- ✅ Filtro por estilo (8 estilos)
- ✅ Filtro por precio (4 rangos)
- ✅ Filtro por calificación (3 niveles)
- ✅ Filtro por categoría (6 categorías)
- ✅ Búsqueda inteligente

### 🎨 Interfaz de Usuario
- ✅ Diseño responsive
- ✅ Animaciones suaves
- ✅ Modal de detalles
- ✅ Contador de resultados
- ✅ Badges de destacadas

### 🚀 Rendimiento
- ✅ Carga rápida (< 3 segundos)
- ✅ Uso eficiente de memoria
- ✅ Recursos optimizados
- ✅ API rápida (< 1 segundo)

## 📞 Soporte

Si encuentras problemas con los tests:

1. **Verifica los servidores**: Backend (3000) y Frontend (4201)
2. **Revisa los logs**: Busca errores en la consola
3. **Ejecuta tests individuales**: Para aislar problemas
4. **Revisa dependencias**: Asegúrate de tener todas instaladas

---

**¡Los tests están diseñados para asegurar que tu aplicación Cerveza Premium funcione perfectamente!** 🍺✨
