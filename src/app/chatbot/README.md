# 🤖 Chatbot - Asistente Virtual

## Descripción
Componente de chatbot interactivo para responder preguntas frecuentes sobre la página de Cerveza Premium.

## Características

### ✨ Funcionalidades
- **Botón flotante**: Ubicado en la esquina inferior derecha
- **Chat expandible**: Ventana de chat moderna y responsive
- **Respuestas automáticas**: Responde preguntas comunes sobre:
  - Productos y catálogo
  - Realización de pedidos
  - Envíos y tiempos de entrega
  - Métodos de pago
  - Información de contacto
  - Horarios de atención
  - Descuentos y promociones

### 🎨 Diseño
- Interfaz moderna con gradientes
- Animaciones suaves
- Indicador de escritura
- Botones de respuesta rápida
- Avatar del bot
- Timestamps en mensajes
- Responsive (se adapta a móviles)

## Palabras Clave Reconocidas

El chatbot responde a las siguientes palabras clave:

| Palabra Clave | Respuesta |
|--------------|-----------|
| `hola` | Saludo de bienvenida |
| `ayuda` | Muestra opciones disponibles |
| `productos`, `cerveza` | Información del catálogo |
| `pedido`, `comprar`, `orden` | Cómo realizar pedidos |
| `envío` | Información de envíos |
| `pago` | Métodos de pago disponibles |
| `cuenta` | Cómo crear una cuenta |
| `precio`, `cuanto`, `costo` | Información de precios |
| `contacto` | Datos de contacto |
| `horario` | Horarios de atención |
| `descuento` | Promociones disponibles |
| `gracias` | Respuesta de cortesía |
| `adios`, `chao` | Despedida |

## Uso

El componente es standalone y se importa automáticamente. Solo necesitas incluir el selector en tu HTML:

\`\`\`html
<app-chatbot></app-chatbot>
\`\`\`

## Personalización

### Agregar nuevas respuestas

Edita el objeto `responses` en `chatbot.component.ts`:

\`\`\`typescript
private responses: { [key: string]: string } = {
  'nueva_palabra': 'Nueva respuesta aquí',
  // ... más respuestas
};
\`\`\`

### Modificar estilos

Los estilos están en `chatbot.component.css`. Principales variables:

- **Colores primarios**: `#667eea` y `#764ba2`
- **Tamaño ventana**: `380px x 600px`
- **Posición**: `bottom: 20px; right: 20px`

### Cambiar el avatar

Modifica el ícono de Font Awesome en el HTML:

\`\`\`html
<i class="fas fa-robot"></i> <!-- Avatar del bot -->
<i class="fas fa-beer"></i>  <!-- Ícono del header -->
\`\`\`

## Integración con Backend (Opcional)

Para conectar con un backend real:

1. Inyecta un servicio HTTP en el constructor
2. Modifica el método `getBotResponse()` para hacer llamadas API
3. Maneja las respuestas asíncronas con observables

\`\`\`typescript
constructor(private http: HttpClient) { ... }

private getBotResponse(message: string): Observable<string> {
  return this.http.post<string>('api/chatbot', { message });
}
\`\`\`

## Responsive

El chatbot es completamente responsive:
- **Desktop**: Ventana de 380x600px
- **Móvil**: Se adapta al ancho de la pantalla

## Dependencias

- `@angular/common` - CommonModule
- `@angular/forms` - FormsModule
- Font Awesome 6.4.0 - Iconos

## Licencia

Parte del proyecto Cerveza Premium

