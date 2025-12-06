import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService } from '../services/database.service';
import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';

interface Message {
  text: string;
  isBot: boolean;
  timestamp: Date;
  context?: any;
}

interface UserContext {
  name?: string;
  preferences?: string[];
  cartItems?: any[];
  orderHistory?: any[];
  currentSession?: string;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent implements OnInit {
  isOpen = false;
  messages: Message[] = [];
  userInput = '';
  isTyping = false;
  userContext: UserContext = {};
  conversationHistory: string[] = [];
  currentUser: any = null;
  hasError = false;
  telegramLink = 'https://t.me/samaoto'; // Cambia por tu enlace real

  private responses: { [key: string]: string } = {
    'hola': '¡Hola! 👋 Bienvenido a Cerveza Premium. ¿En qué puedo ayudarte hoy?',
    'ayuda': 'Puedo ayudarte con:\n• Información sobre productos\n• Cómo realizar pedidos\n• Información de envíos\n• Métodos de pago\n• Historial de pedidos\n\n¿Qué te gustaría saber?',
    'productos': 'Ofrecemos una amplia variedad de cervezas premium. Puedes ver nuestro catálogo en la sección de productos donde encontrarás:\n• Cervezas artesanales\n• Cervezas importadas\n• Cervezas nacionales\n• Packs especiales',
    'pedido': 'Para realizar un pedido:\n1. Inicia sesión en tu cuenta\n2. Navega por nuestro catálogo\n3. Agrega productos al carrito\n4. Procede al pago\n5. Confirma tu dirección de envío\n\n¿Necesitas ayuda con algún paso específico?',
    'envío': 'Nuestros tiempos de envío son:\n• Ciudad: 24-48 horas\n• Nacional: 3-5 días hábiles\n\nEnvío gratis en pedidos mayores a $50.',
    'pago': 'Aceptamos los siguientes métodos de pago:\n• Tarjetas de crédito/débito\n• Transferencia bancaria\n• PayPal\n• Pago contra entrega',
    'cuenta': 'Para crear una cuenta:\n1. Haz clic en "Registrarse"\n2. Completa tus datos\n3. Verifica tu correo electrónico\n4. ¡Listo! Ya puedes empezar a comprar',
    'precio': 'Los precios varían según el producto. Puedes ver todos nuestros precios en la sección de productos. ¡Tenemos ofertas especiales regularmente!',
    'contacto': 'Puedes contactarnos:\n📧 Email: info@cervezapremium.com\n📱 WhatsApp: +123 456 7890\n🕐 Horario: Lun-Vie 9:00-18:00',
    'horario': 'Nuestro horario de atención es:\n🕐 Lunes a Viernes: 9:00 - 18:00\n🕐 Sábados: 10:00 - 14:00\n🕐 Domingos: Cerrado',
    'descuento': '¡Tenemos varias promociones!\n• 10% en tu primera compra\n• Envío gratis en pedidos +$50\n• Descuentos especiales para clientes frecuentes\n• Ofertas de temporada',
  };

  constructor(
    private databaseService: DatabaseService,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    // Mensaje de bienvenida
    this.messages.push({
      text: '¡Hola! Soy tu asistente virtual de Cerveza Premium 🍺\n\n¿En qué puedo ayudarte hoy?',
      isBot: true,
      timestamp: new Date()
    });
  }

  ngOnInit() {
    this.loadUserContext();
    this.loadConversationHistory();
  }

  private loadUserContext() {
    // Cargar contexto del usuario desde localStorage
    if (isPlatformBrowser(this.platformId)) {
      const savedContext = localStorage.getItem('chatbot-context');
      if (savedContext) {
        this.userContext = JSON.parse(savedContext);
      }
      // Cargar usuario actual si está logueado
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        this.currentUser = JSON.parse(currentUser);
        this.userContext.name = this.currentUser.nombre;
      }
    }
  }

  private loadConversationHistory() {
    if (isPlatformBrowser(this.platformId)) {
      const savedHistory = localStorage.getItem('chatbot-history');
      if (savedHistory) {
        this.conversationHistory = JSON.parse(savedHistory);
      }
    }
  }

  private saveUserContext() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('chatbot-context', JSON.stringify(this.userContext));
    }
  }

  private saveConversationHistory() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('chatbot-history', JSON.stringify(this.conversationHistory));
    }
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
  }

  sendMessage(): void {
    if (!this.userInput.trim()) {
      return;
    }

    // Agregar mensaje del usuario
    this.messages.push({
      text: this.userInput,
      isBot: false,
      timestamp: new Date()
    });

    const userMessage = this.userInput.toLowerCase();
    this.conversationHistory.push(userMessage);
    this.userInput = '';

    // Simular que el bot está escribiendo
    this.isTyping = true;

    setTimeout(async () => {
      try {
        const botResponse = await this.getBotResponse(userMessage);
        this.hasError = false;
        this.messages.push({
          text: botResponse,
          isBot: true,
          timestamp: new Date(),
          context: this.userContext
        });
      } catch (error) {
        console.error('Error en chatbot:', error);
        this.hasError = true;
      this.messages.push({
        text: `Lo siento, tuve un problema procesando tu solicitud. 😔\n\nSi necesitas ayuda inmediata, puedes contactarnos por Telegram:\n\n📱 <a href="${this.telegramLink}" target="_blank" style="color: #0088cc; text-decoration: underline; font-weight: 600;">Contáctanos por Telegram</a>`,
        isBot: true,
        timestamp: new Date(),
        context: this.userContext
      });
      } finally {
        this.isTyping = false;
        // Guardar contexto y historial
        this.saveUserContext();
        this.saveConversationHistory();
        // Scroll al final
        setTimeout(() => this.scrollToBottom(), 100);
      }
    }, 1000);
  }

  private async getBotResponse(message: string): Promise<string> {
    // Actualizar contexto basado en el mensaje
    this.updateUserContext(message);

    // Buscar palabras clave en el mensaje
    for (const key in this.responses) {
      if (message.includes(key)) {
        return this.personalizeResponse(this.responses[key]);
      }
    }

    // Respuestas contextuales mejoradas
    if (message.includes('gracias')) {
      return this.getPersonalizedThanks();
    }

    if (message.includes('adios') || message.includes('chao')) {
      return this.getPersonalizedGoodbye();
    }

    if (message.includes('cerveza') || message.includes('producto')) {
      return this.getProductRecommendations();
    }

    if (message.includes('comprar') || message.includes('orden')) {
      return this.getOrderAssistance();
    }

    if (message.includes('cuanto') || message.includes('costo')) {
      return this.getPriceInformation();
    }

    if (message.includes('recomendacion') || message.includes('sugerir')) {
      return this.getPersonalizedRecommendations();
    }

    if (message.includes('carrito') || message.includes('cart')) {
      return await this.getRealCartInformation();
    }

    if (message.includes('pedidos') || message.includes('historial') || message.includes('compras')) {
      return await this.getRealOrderHistory();
    }

    // Respuesta inteligente basada en contexto
    return this.getContextualResponse(message);
  }

  private updateUserContext(message: string): void {
    // Detectar preferencias del usuario
    if (message.includes('ipa') || message.includes('stout') || message.includes('lager')) {
      if (!this.userContext.preferences) {
        this.userContext.preferences = [];
      }
      const beerType = this.extractBeerType(message);
      if (beerType && !this.userContext.preferences.includes(beerType)) {
        this.userContext.preferences.push(beerType);
      }
    }

    // Detectar intención de compra
    if (message.includes('comprar') || message.includes('agregar') || message.includes('carrito')) {
      this.userContext.currentSession = 'shopping';
    }
  }

  private extractBeerType(message: string): string | null {
    const beerTypes = ['ipa', 'stout', 'lager', 'porter', 'ale', 'pilsner'];
    for (const type of beerTypes) {
      if (message.includes(type)) {
        return type;
      }
    }
    return null;
  }

  private personalizeResponse(response: string): string {
    if (this.userContext.name) {
      return response.replace('¡Hola!', `¡Hola ${this.userContext.name}!`);
    }
    return response;
  }

  private getPersonalizedThanks(): string {
    const thanks = [
      '¡De nada! 😊 ¿Hay algo más en lo que pueda ayudarte?',
      '¡Para eso estoy! 😊 ¿Necesitas ayuda con algo más?',
      '¡Un placer ayudarte! 😊 ¿Qué más te interesa?'
    ];
    return thanks[Math.floor(Math.random() * thanks.length)];
  }

  private getPersonalizedGoodbye(): string {
    const goodbyes = [
      '¡Hasta pronto! 👋 Que tengas un excelente día. ¡Salud! 🍺',
      '¡Nos vemos pronto! 👋 ¡Que disfrutes tus cervezas! 🍺',
      '¡Hasta la próxima! 👋 ¡Salud y que tengas un gran día! 🍺'
    ];
    return goodbyes[Math.floor(Math.random() * goodbyes.length)];
  }

  private getProductRecommendations(): string {
    let response = 'Ofrecemos una amplia variedad de cervezas premium:\n\n';
    
    if (this.userContext.preferences && this.userContext.preferences.length > 0) {
      response += `Basándome en tus preferencias (${this.userContext.preferences.join(', ')}), te recomiendo:\n\n`;
    }
    
    response += '• Cervezas artesanales\n• Cervezas importadas\n• Cervezas nacionales\n• Packs especiales\n\n';
    response += '¿Te gustaría que te recomiende algo específico?';
    
    return response;
  }

  private getOrderAssistance(): string {
    let response = 'Para realizar un pedido:\n1. Inicia sesión en tu cuenta\n2. Navega por nuestro catálogo\n3. Agrega productos al carrito\n4. Procede al pago\n5. Confirma tu dirección de envío\n\n';
    
    if (this.userContext.currentSession === 'shopping') {
      response += 'Veo que estás interesado en comprar. ¿Te ayudo a encontrar algo específico?';
    } else {
      response += '¿Necesitas ayuda con algún paso específico?';
    }
    
    return response;
  }

  private getPriceInformation(): string {
    return 'Los precios varían según el producto:\n• Cervezas individuales: $69.99 - $95.99\n• Packs de 6: $399.99 - $549.99\n• Packs especiales: $799.99 - $1299.99\n\n¡Tenemos ofertas especiales regularmente! ¿Te interesa algún producto en particular?';
  }

  private getPersonalizedRecommendations(): string {
    if (this.userContext.preferences && this.userContext.preferences.length > 0) {
      return `Basándome en que te gustan las cervezas ${this.userContext.preferences.join(' y ')}, te recomiendo:\n\n• Golden Sunset IPA - Perfecta para amantes de IPAs\n• Dark Thunder Stout - Ideal para quienes disfrutan las stouts\n• Bavarian Dream - Una excelente opción clásica\n\n¿Te interesa alguna de estas opciones?`;
    }
    
    return 'Para darte mejores recomendaciones, ¿podrías decirme qué tipo de cerveza prefieres? (IPA, Stout, Lager, etc.)';
  }

  // Métodos para integración con base de datos
  private async getRealProductRecommendations(): Promise<string> {
    try {
      const cervezas = await this.databaseService.getCervezas().toPromise();
      if (cervezas && cervezas.length > 0) {
        let response = 'Basándome en nuestro catálogo actual, te recomiendo:\n\n';
        cervezas.slice(0, 3).forEach((cerveza: any, index: number) => {
          response += `${index + 1}. ${cerveza.nombre} - $${cerveza.precio}\n`;
        });
        response += '\n¿Te interesa alguna de estas opciones?';
        return response;
      }
    } catch (error) {
      console.error('Error obteniendo cervezas:', error);
      this.hasError = true;
    }
    return this.getPersonalizedRecommendations();
  }

  private async getRealCartInformation(): Promise<string> {
    if (!this.currentUser) {
      return 'Para ver tu carrito, primero necesitas iniciar sesión. ¿Te ayudo a crear una cuenta?';
    }

    try {
      const carrito = await this.databaseService.getCarrito(this.currentUser.id).toPromise();
      if (carrito && carrito.length > 0) {
        let response = 'Tu carrito actual contiene:\n\n';
        let total = 0;
        carrito.forEach((item: any, index: number) => {
          response += `${index + 1}. ${item.cerveza_nombre} - Cantidad: ${item.cantidad} - $${item.precio_total}\n`;
          total += item.precio_total;
        });
        response += `\nTotal: $${total}\n\n¿Te ayudo con algo específico de tu carrito?`;
        return response;
      } else {
        return 'Tu carrito está vacío. ¿Te gustaría que te recomiende algunas cervezas?';
      }
    } catch (error) {
      console.error('Error obteniendo carrito:', error);
      this.hasError = true;
      return `Lo siento, no pude acceder a tu carrito en este momento. 😔<br><br>Si necesitas ayuda inmediata, puedes contactarnos por Telegram:<br><br>📱 <a href="${this.telegramLink}" target="_blank" style="color: #0088cc; text-decoration: underline; font-weight: 600;">Contáctanos por Telegram</a>`;
    }
  }

  private async getRealOrderHistory(): Promise<string> {
    if (!this.currentUser) {
      return 'Para ver tu historial de pedidos, primero necesitas iniciar sesión.';
    }

    try {
      const pedidos = await this.databaseService.getPedidos(this.currentUser.id).toPromise();
      if (pedidos && pedidos.length > 0) {
        let response = 'Tu historial de pedidos:\n\n';
        pedidos.slice(0, 3).forEach((pedido: any, index: number) => {
          response += `${index + 1}. Pedido #${pedido.id} - $${pedido.total} - ${pedido.estado}\n`;
        });
        response += '\n¿Te interesa repetir algún pedido o necesitas ayuda con algo específico?';
        return response;
      } else {
        return 'Aún no tienes pedidos. ¿Te gustaría hacer tu primera compra?';
      }
    } catch (error) {
      console.error('Error obteniendo pedidos:', error);
      this.hasError = true;
      return `No pude acceder a tu historial de pedidos en este momento. 😔<br><br>Si necesitas ayuda inmediata, puedes contactarnos por Telegram:<br><br>📱 <a href="${this.telegramLink}" target="_blank" style="color: #0088cc; text-decoration: underline; font-weight: 600;">Contáctanos por Telegram</a>`;
    }
  }

  private getCartInformation(): string {
    return 'Para ver tu carrito:\n1. Haz clic en el ícono del carrito en la parte superior\n2. Revisa los productos que has agregado\n3. Modifica cantidades si es necesario\n4. Procede al checkout cuando estés listo\n\n¿Necesitas ayuda con algo específico de tu carrito?';
  }

  private getContextualResponse(message: string): string {
    // Análisis más inteligente del mensaje
    if (message.includes('problema') || message.includes('error') || message.includes('no funciona')) {
      return 'Lamento que tengas un problema. ¿Podrías describir qué está pasando? Te ayudo a solucionarlo.';
    }
    
    if (message.includes('tiempo') || message.includes('cuando') || message.includes('fecha')) {
      return '¿Te refieres a tiempos de envío, horarios de atención, o algo más específico?';
    }
    
    if (message.includes('calidad') || message.includes('buena') || message.includes('mejor')) {
      return 'Todas nuestras cervezas son de la más alta calidad. ¿Te interesa conocer más sobre nuestros procesos de selección?';
    }

    if (message.includes('agregar') || message.includes('añadir') || message.includes('poner')) {
      return 'Para agregar productos al carrito:\n1. Navega por nuestro catálogo\n2. Haz clic en "Agregar al carrito"\n3. Ajusta la cantidad si es necesario\n4. Ve al carrito para revisar\n\n¿Te ayudo a encontrar algún producto específico?';
    }

    if (message.includes('eliminar') || message.includes('quitar') || message.includes('borrar')) {
      return 'Para eliminar productos del carrito:\n1. Ve a tu carrito\n2. Haz clic en el ícono de eliminar\n3. Confirma la eliminación\n\n¿Necesitas ayuda con algo específico de tu carrito?';
    }

    if (message.includes('pagar') || message.includes('checkout') || message.includes('comprar')) {
      return 'Para completar tu compra:\n1. Revisa los productos en tu carrito\n2. Haz clic en "Proceder al pago"\n3. Completa tus datos de envío\n4. Selecciona método de pago\n5. Confirma tu pedido\n\n¿Te ayudo con algún paso específico?';
    }

    if (message.includes('envio') || message.includes('entrega') || message.includes('llegar')) {
      return 'Nuestros tiempos de envío son:\n• Ciudad: 24-48 horas\n• Nacional: 3-5 días hábiles\n• Envío gratis en pedidos mayores a $50\n\n¿Te interesa hacer un pedido?';
    }

    if (message.includes('descuento') || message.includes('oferta') || message.includes('promocion')) {
      return '¡Tenemos varias promociones activas!\n• 10% en tu primera compra\n• Envío gratis en pedidos +$50\n• Descuentos especiales para clientes frecuentes\n• Ofertas de temporada\n\n¿Te interesa alguna promoción específica?';
    }
    
    // Respuesta por defecto mejorada
    return `Disculpa, no estoy seguro de entender tu pregunta. 🤔<br><br>Puedo ayudarte con:<br>• Información de productos<br>• Cómo hacer pedidos<br>• Envíos y pagos<br>• Recomendaciones personalizadas<br>• Gestión de carrito<br><br>¿Qué te gustaría saber?<br><br>Si necesitas ayuda más específica, puedes contactarnos por Telegram:<br>📱 <a href="${this.telegramLink}" target="_blank" style="color: #0088cc; text-decoration: underline; font-weight: 600;">Contáctanos por Telegram</a>`;
  }

  // Métodos para funcionalidades de e-commerce
  async addToCartFromChat(productName: string, quantity: number = 1): Promise<string> {
    if (!this.currentUser) {
      return 'Para agregar productos al carrito, primero necesitas iniciar sesión. ¿Te ayudo a crear una cuenta?';
    }

    try {
      // Buscar el producto por nombre
      const cervezas = await this.databaseService.getCervezas().toPromise();
      const cerveza = cervezas?.find((c: any) => 
        c.nombre.toLowerCase().includes(productName.toLowerCase())
      );

      if (!cerveza) {
        return `No encontré el producto "${productName}". ¿Podrías ser más específico?`;
      }

      // Agregar al carrito
      const result = await this.databaseService.addToCarrito(
        this.currentUser.id,
        cerveza.id,
        quantity
      ).toPromise();

      if (result) {
        return `¡Perfecto! Agregué ${quantity} ${cerveza.nombre} a tu carrito por $${cerveza.precio * quantity}. ¿Te ayudo con algo más?`;
      } else {
        return 'Hubo un problema agregando el producto. ¿Te ayudo a intentarlo de otra manera?';
      }
    } catch (error) {
      console.error('Error agregando al carrito:', error);
      this.hasError = true;
      return `No pude agregar el producto en este momento. 😔<br><br>Si necesitas ayuda inmediata, puedes contactarnos por Telegram:<br><br>📱 <a href="${this.telegramLink}" target="_blank" style="color: #0088cc; text-decoration: underline; font-weight: 600;">Contáctanos por Telegram</a>`;
    }
  }

  async getOrderStatus(orderId: string): Promise<string> {
    if (!this.currentUser) {
      return 'Para consultar el estado de tu pedido, primero necesitas iniciar sesión.';
    }

    try {
      const pedidos = await this.databaseService.getPedidos(this.currentUser.id).toPromise();
      const pedido = pedidos?.find((p: any) => p.id.toString() === orderId);

      if (!pedido) {
        return `No encontré el pedido #${orderId}. ¿Podrías verificar el número?`;
      }

      return `Tu pedido #${orderId} está en estado: ${pedido.estado}\n\n¿Te ayudo con algo más relacionado con tu pedido?`;
    } catch (error) {
      console.error('Error consultando pedido:', error);
      this.hasError = true;
      return `No pude consultar el estado de tu pedido en este momento. 😔<br><br>Si necesitas ayuda inmediata, puedes contactarnos por Telegram:<br><br>📱 <a href="${this.telegramLink}" target="_blank" style="color: #0088cc; text-decoration: underline; font-weight: 600;">Contáctanos por Telegram</a>`;
    }
  }

  private scrollToBottom(): void {
    const chatMessages = document.querySelector('.chat-messages');
    if (chatMessages) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  handleKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}

