import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// Interfaces para tipado
export interface Usuario {
  id?: number;
  nombre_completo: string;
  email: string;
  telefono?: string;
  direccion?: string;
  fecha_nacimiento: string;
  puntos_acumulados?: number;
  tipo_identificacion: string;
  numero_identificacion: string;
  foto_identificacion_frente?: string;
  foto_identificacion_reverso?: string;
  confirmo_mayor_edad: boolean;
  acepto_terminos: boolean;
  activo?: boolean;
  fecha_registro?: string;
  rol?: 'admin' | 'vendedor' | 'cliente';
}

export interface Cerveza {
  id: number;
  nombre: string;
  estilo: string;
  descripcion: string;
  precio: number;
  puntos_ganados: number;
  imagen_url: string;
  categoria_id: number;
  stock_disponible: number;
  calificacion_promedio: number;
  total_calificaciones: number;
}

export interface CarritoItem {
  id?: number;
  cerveza_id: number;
  cantidad: number;
  precio_unitario: number;
  cerveza?: Cerveza;
}

export interface Pedido {
  id?: number;
  usuario_id: number;
  numero_pedido: string;
  estado: string;
  subtotal: number;
  descuento: number;
  envio: number;
  total: number;
  puntos_usados: number;
  puntos_ganados: number;
  direccion_envio: string;
  telefono_contacto: string;
  notas?: string;
  fecha_pedido: string;
  fecha_entrega_estimada?: string;
  fecha_entrega_real?: string;
  items?: PedidoItem[];
}

export interface PedidoItem {
  id?: number;
  pedido_id: number;
  cerveza_id: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  cerveza?: Cerveza;
}

export interface TransaccionPuntos {
  id?: number;
  usuario_id: number;
  tipo: 'ganado' | 'usado' | 'expirado' | 'bonificacion';
  cantidad: number;
  descripcion: string;
  pedido_id?: number;
  fecha_transaccion: string;
}

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private apiUrl = environment.apiUrl; // URL del backend según el entorno
  private currentUserSubject = new BehaviorSubject<Usuario | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  // Caché simple para evitar peticiones repetidas
  private usuarioCache: { [key: number]: { data: Usuario; timestamp: number } } = {};
  private cacheTimeout = 30000; // 30 segundos

  constructor(private http: HttpClient) {}

  // Headers para las peticiones
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  // ========== AUTENTICACIÓN ==========
  
  login(email: string, password: string): Observable<{user: Usuario, token: string}> {
    return this.http.post<{user: Usuario, token: string}>(`${this.apiUrl}/auth/login`, {
      email,
      password
    }).pipe(
      tap(response => {
        localStorage.setItem('auth_token', response.token);
        this.currentUserSubject.next(response.user);
      })
    );
  }

  register(userData: Usuario): Observable<{user: Usuario, token: string}> {
    return this.http.post<{user: Usuario, token: string}>(`${this.apiUrl}/auth/register`, userData).pipe(
      tap(response => {
        localStorage.setItem('auth_token', response.token);
        this.currentUserSubject.next(response.user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): Usuario | null {
    return this.currentUserSubject.value;
  }

  // ========== RESET PASSWORD ==========

  forgotPassword(email: string): Observable<{message: string, resetUrl?: string}> {
    return this.http.post<{message: string, resetUrl?: string}>(`${this.apiUrl}/auth/forgot-password`, {
      email
    });
  }

  resetPassword(token: string, newPassword: string): Observable<{message: string}> {
    return this.http.post<{message: string}>(`${this.apiUrl}/auth/reset-password`, {
      token,
      newPassword
    });
  }

  // ========== ADMIN FUNCTIONS ==========

  // Estadísticas del admin
  getAdminStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/admin/estadisticas`, {
      headers: this.getHeaders()
    });
  }

  // Gestión de cervezas
  getAdminCervezas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/cervezas`, {
      headers: this.getHeaders()
    });
  }

  createCerveza(cervezaData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/admin/cervezas`, cervezaData, {
      headers: this.getHeaders()
    });
  }

  updateCerveza(id: number, cervezaData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/admin/cervezas/${id}`, cervezaData, {
      headers: this.getHeaders()
    });
  }

  deleteCerveza(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/cervezas/${id}`, {
      headers: this.getHeaders()
    });
  }

  // Gestión de pedidos
  getAdminPedidos(estado?: string, limit = 50, offset = 0): Observable<any[]> {
    let url = `${this.apiUrl}/admin/pedidos?limit=${limit}&offset=${offset}`;
    if (estado) {
      url += `&estado=${estado}`;
    }
    return this.http.get<any[]>(url, {
      headers: this.getHeaders()
    });
  }

  updatePedidoEstado(id: number, estado: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/admin/pedidos/${id}/estado`, {
      estado
    }, {
      headers: this.getHeaders()
    });
  }

  // Corte diario de ventas
  getCorteDiario(fecha?: string): Observable<any> {
    let url = `${this.apiUrl}/admin/corte-diario`;
    if (fecha) {
      url += `?fecha=${fecha}`;
    }
    return this.http.get<any>(url, {
      headers: this.getHeaders()
    });
  }

  // Gestión de usuarios (solo admin)
  getAdminUsuarios(rol?: string, limit = 50, offset = 0): Observable<any[]> {
    let url = `${this.apiUrl}/admin/usuarios?limit=${limit}&offset=${offset}`;
    if (rol) {
      url += `&rol=${rol}`;
    }
    return this.http.get<any[]>(url, {
      headers: this.getHeaders()
    });
  }

  updateUsuarioRol(id: number, rol: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/admin/usuarios/${id}/rol`, {
      rol
    }, {
      headers: this.getHeaders()
    });
  }

  // ========== REPORTES Y ANALYTICS ==========

  // Reportes de ventas
  getReportesVentas(periodo?: string, fechaInicio?: string, fechaFin?: string): Observable<any> {
    let url = `${this.apiUrl}/admin/reportes/ventas`;
    const params = new URLSearchParams();
    
    if (periodo) params.append('periodo', periodo);
    if (fechaInicio) params.append('fecha_inicio', fechaInicio);
    if (fechaFin) params.append('fecha_fin', fechaFin);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    return this.http.get<any>(url, {
      headers: this.getHeaders()
    });
  }

  // Analytics avanzados
  getAnalytics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/admin/analytics`, {
      headers: this.getHeaders()
    });
  }

  // ========== NOTIFICACIONES ==========

  // Configurar sistema de notificaciones
  setupNotifications(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/admin/setup-notifications`, {
      headers: this.getHeaders()
    });
  }

  // Obtener notificaciones
  getNotificaciones(limit = 20, offset = 0): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/notificaciones?limit=${limit}&offset=${offset}`, {
      headers: this.getHeaders()
    });
  }

  // Marcar notificación como leída
  marcarNotificacionLeida(id: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/admin/notificaciones/${id}/leer`, {}, {
      headers: this.getHeaders()
    });
  }

  // Crear notificación
  crearNotificacion(tipo: string, titulo: string, mensaje: string, usuarioId?: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/admin/notificaciones`, {
      tipo,
      titulo,
      mensaje,
      usuario_id: usuarioId
    }, {
      headers: this.getHeaders()
    });
  }

  // ========== DESCUENTOS ==========

  // Configurar sistema de descuentos
  setupDiscounts(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/admin/setup-discounts`, {
      headers: this.getHeaders()
    });
  }

  // Obtener descuentos
  getDescuentos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/descuentos`, {
      headers: this.getHeaders()
    });
  }

  // Crear descuento
  crearDescuento(descuentoData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/admin/descuentos`, descuentoData, {
      headers: this.getHeaders()
    });
  }

  // Actualizar descuento
  actualizarDescuento(id: number, descuentoData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/admin/descuentos/${id}`, descuentoData, {
      headers: this.getHeaders()
    });
  }

  // Eliminar descuento
  eliminarDescuento(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/descuentos/${id}`, {
      headers: this.getHeaders()
    });
  }

  // ========== USUARIOS ==========

  getUsuario(id: number): Observable<Usuario> {
    // Verificar caché
    const cached = this.usuarioCache[id];
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < this.cacheTimeout) {
      // Retornar datos del caché
      return new Observable(observer => {
        observer.next(cached.data);
        observer.complete();
      });
    }
    
    // Hacer petición y actualizar caché
    return this.http.get<Usuario>(`${this.apiUrl}/usuarios/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      tap(user => {
        // Actualizar caché
        this.usuarioCache[id] = {
          data: user,
          timestamp: Date.now()
        };
      })
    );
  }

  updateUsuario(id: number, userData: Partial<Usuario>): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/usuarios/${id}`, userData, {
      headers: this.getHeaders()
    }).pipe(
      tap(user => this.currentUserSubject.next(user))
    );
  }

  // ========== CERVEZAS ==========

  getCervezas(): Observable<Cerveza[]> {
    return this.http.get<Cerveza[]>(`${this.apiUrl}/cervezas`);
  }

  getCervezasMexicanas(): Observable<Cerveza[]> {
    return this.http.get<Cerveza[]>(`${this.apiUrl}/cervezas-mexicanas`);
  }

  getCerveza(id: number): Observable<Cerveza> {
    return this.http.get<Cerveza>(`${this.apiUrl}/cervezas/${id}`);
  }

  searchCervezas(query: string): Observable<Cerveza[]> {
    return this.http.get<Cerveza[]>(`${this.apiUrl}/cervezas/search?q=${encodeURIComponent(query)}`);
  }

  getCervezasByCategoria(categoriaId: number): Observable<Cerveza[]> {
    return this.http.get<Cerveza[]>(`${this.apiUrl}/cervezas/categoria/${categoriaId}`);
  }

  // ========== CARRITO ==========

  getCarrito(usuarioId: number): Observable<CarritoItem[]> {
    return this.http.get<CarritoItem[]>(`${this.apiUrl}/carrito/${usuarioId}`, {
      headers: this.getHeaders()
    });
  }

  addToCarrito(usuarioId: number, cervezaId: number, cantidad: number = 1): Observable<CarritoItem> {
    return this.http.post<CarritoItem>(`${this.apiUrl}/carrito/add`, {
      usuario_id: usuarioId,
      cerveza_id: cervezaId,
      cantidad
    }, {
      headers: this.getHeaders()
    });
  }

  updateCarritoItem(itemId: number, cantidad: number): Observable<CarritoItem> {
    return this.http.put<CarritoItem>(`${this.apiUrl}/carrito/item/${itemId}`, {
      cantidad
    }, {
      headers: this.getHeaders()
    });
  }

  removeFromCarrito(itemId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/carrito/item/${itemId}`, {
      headers: this.getHeaders()
    });
  }

  clearCarrito(usuarioId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/carrito/${usuarioId}`, {
      headers: this.getHeaders()
    });
  }

  // ========== USUARIOS ==========

  updateProfile(usuarioId: number, profileData: Partial<Usuario>): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/usuarios/${usuarioId}`, profileData, {
      headers: this.getHeaders()
    });
  }

  // ========== PEDIDOS ==========

  getPedidos(usuarioId: number): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${this.apiUrl}/pedidos/usuario/${usuarioId}`, {
      headers: this.getHeaders()
    });
  }

  getPedido(id: number): Observable<Pedido> {
    return this.http.get<Pedido>(`${this.apiUrl}/pedidos/${id}`, {
      headers: this.getHeaders()
    });
  }

  createPedido(pedidoData: Partial<Pedido>): Observable<Pedido> {
    return this.http.post<Pedido>(`${this.apiUrl}/pedidos`, pedidoData, {
      headers: this.getHeaders()
    });
  }

  // (Eliminado duplicado de updatePedidoEstado para pedidos del cliente)

  // ========== PUNTOS ==========

  getPuntosUsuario(usuarioId: number): Observable<number> {
    return this.http.get<{puntos: number}>(`${this.apiUrl}/puntos/${usuarioId}`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.puntos)
    );
  }

  getTransaccionesPuntos(usuarioId: number): Observable<TransaccionPuntos[]> {
    return this.http.get<TransaccionPuntos[]>(`${this.apiUrl}/puntos/transacciones/${usuarioId}`, {
      headers: this.getHeaders()
    });
  }

  usarPuntos(usuarioId: number, cantidad: number, pedidoId?: number): Observable<{puntos_restantes: number}> {
    return this.http.post<{puntos_restantes: number}>(`${this.apiUrl}/puntos/usar`, {
      usuario_id: usuarioId,
      cantidad,
      pedido_id: pedidoId
    }, {
      headers: this.getHeaders()
    });
  }

  // ========== CÓDIGOS DE DESCUENTO ==========

  validarCodigoDescuento(codigo: string): Observable<{valido: boolean, descuento: number, tipo: string}> {
    return this.http.get<{valido: boolean, descuento: number, tipo: string}>(`${this.apiUrl}/descuentos/validar/${codigo}`, {
      headers: this.getHeaders()
    });
  }

  aplicarCodigoDescuento(codigo: string, pedidoId: number): Observable<{descuento_aplicado: number}> {
    return this.http.post<{descuento_aplicado: number}>(`${this.apiUrl}/descuentos/aplicar`, {
      codigo,
      pedido_id: pedidoId
    }, {
      headers: this.getHeaders()
    });
  }

  // ========== UPLOAD DE ARCHIVOS ==========

  uploadFile(file: File, tipo: 'identificacion_frente' | 'identificacion_reverso'): Observable<{url: string}> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tipo', tipo);

    return this.http.post<{url: string}>(`${this.apiUrl}/upload`, formData, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
  }

  // ========== ESTADÍSTICAS ==========

  getEstadisticasUsuario(usuarioId: number): Observable<{
    total_pedidos: number;
    total_gastado: number;
    puntos_acumulados: number;
    cerveza_favorita: Cerveza;
  }> {
    return this.http.get<{
      total_pedidos: number;
      total_gastado: number;
      puntos_acumulados: number;
      cerveza_favorita: Cerveza;
    }>(`${this.apiUrl}/estadisticas/usuario/${usuarioId}`, {
      headers: this.getHeaders()
    });
  }

  // ========== REPARTIDORES Y TRACKING ==========

  // Obtener todos los repartidores (admin)
  getRepartidores(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/repartidores`, {
      headers: this.getHeaders()
    });
  }

  // Obtener última ubicación de un repartidor
  getRepartidorUbicacion(repartidorId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/repartidores/${repartidorId}/ubicacion`, {
      headers: this.getHeaders()
    });
  }

  // Actualizar ubicación de un repartidor
  updateRepartidorUbicacion(repartidorId: number, ubicacion: {latitud: number, longitud: number, velocidad?: number, direccion?: string}): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/repartidores/${repartidorId}/ubicacion`, ubicacion, {
      headers: this.getHeaders()
    });
  }

  // Obtener información del repartidor asignado a un pedido (cliente)
  getRepartidorPedido(pedidoId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/pedidos/${pedidoId}/repartidor`, {
      headers: this.getHeaders()
    });
  }

  // Obtener todas las rutas de todos los repartidores (admin)
  getRutasRepartidores(horas: number = 24): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/repartidores/rutas?horas=${horas}`, {
      headers: this.getHeaders()
    });
  }

  // Asignar repartidor a un pedido (admin)
  asignarRepartidorPedido(pedidoId: number, repartidorId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/admin/pedidos/${pedidoId}/asignar-repartidor`, {
      repartidor_id: repartidorId
    }, {
      headers: this.getHeaders()
    });
  }

  // Crear nuevo repartidor (admin)
  createRepartidor(repartidorData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/admin/repartidores`, repartidorData, {
      headers: this.getHeaders()
    });
  }

  // Actualizar repartidor (admin)
  updateRepartidor(id: number, repartidorData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/admin/repartidores/${id}`, repartidorData, {
      headers: this.getHeaders()
    });
  }

  // Eliminar repartidor (admin)
  deleteRepartidor(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/admin/repartidores/${id}`, {
      headers: this.getHeaders()
    });
  }

  // ========== TIENDAS ==========

  // Obtener todas las tiendas disponibles
  getTiendas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/tiendas`);
  }

  // Obtener inventario de una tienda específica
  getTiendaInventario(tiendaId: number, cervezaIds?: number[]): Observable<any[]> {
    let url = `${this.apiUrl}/tiendas/${tiendaId}/inventario`;
    if (cervezaIds && cervezaIds.length > 0) {
      url += `?cerveza_ids=${cervezaIds.join(',')}`;
    }
    return this.http.get<any[]>(url);
  }

  // Obtener tiendas con disponibilidad de productos específicos
  getTiendasDisponibles(cervezaIds: number[]): Observable<any[]> {
    const url = `${this.apiUrl}/tiendas/disponibles?cerveza_ids=${cervezaIds.join(',')}`;
    return this.http.get<any[]>(url);
  }

  // ========== EMAIL ==========
  // El servicio de email funciona automáticamente en el backend:
  // - Email de bienvenida al registrarse
  // - Email de confirmación al crear un pedido
  // - Email de actualización cuando cambia el estado de un pedido
  // No requiere llamadas desde el frontend
}
