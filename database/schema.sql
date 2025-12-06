-- Base de datos para Cerveza Premium
-- Sistema de ventas de cerveza artesanal

CREATE DATABASE IF NOT EXISTS cerveza_premium;
USE cerveza_premium;

-- Tabla de usuarios
CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre_completo VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    direccion TEXT,
    fecha_nacimiento DATE NOT NULL,
    puntos_acumulados INT DEFAULT 0,
    tipo_identificacion ENUM('INE', 'Pasaporte', 'Licencia', 'Cedula') NOT NULL,
    numero_identificacion VARCHAR(20) NOT NULL,
    foto_identificacion_frente VARCHAR(500),
    foto_identificacion_reverso VARCHAR(500),
    confirmo_mayor_edad BOOLEAN DEFAULT FALSE,
    acepto_terminos BOOLEAN DEFAULT FALSE,
    rol ENUM('admin', 'vendedor', 'cliente') DEFAULT 'cliente',
    activo BOOLEAN DEFAULT TRUE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_actividad TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de categorías de cerveza
CREATE TABLE categorias (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    activa BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de cervezas
CREATE TABLE cervezas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(200) NOT NULL,
    estilo VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    puntos_ganados INT DEFAULT 0,
    imagen_url VARCHAR(500),
    categoria_id INT,
    stock_disponible INT DEFAULT 0,
    activa BOOLEAN DEFAULT TRUE,
    calificacion_promedio DECIMAL(3,2) DEFAULT 0.00,
    total_calificaciones INT DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

-- Tabla de carritos de compra
CREATE TABLE carritos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabla de items del carrito
CREATE TABLE carrito_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    carrito_id INT NOT NULL,
    cerveza_id INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(10,2) NOT NULL,
    fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (carrito_id) REFERENCES carritos(id),
    FOREIGN KEY (cerveza_id) REFERENCES cervezas(id),
    UNIQUE KEY unique_carrito_cerveza (carrito_id, cerveza_id)
);

-- Tabla de pedidos
CREATE TABLE pedidos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    numero_pedido VARCHAR(20) UNIQUE NOT NULL,
    estado ENUM('pendiente', 'confirmado', 'preparando', 'enviado', 'entregado', 'cancelado') DEFAULT 'pendiente',
    subtotal DECIMAL(10,2) NOT NULL,
    descuento DECIMAL(10,2) DEFAULT 0.00,
    envio DECIMAL(10,2) DEFAULT 3.99,
    total DECIMAL(10,2) NOT NULL,
    puntos_usados INT DEFAULT 0,
    puntos_ganados INT DEFAULT 0,
    direccion_envio TEXT NOT NULL,
    telefono_contacto VARCHAR(20),
    notas TEXT,
    fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_entrega_estimada TIMESTAMP NULL,
    fecha_entrega_real TIMESTAMP NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabla de items del pedido
CREATE TABLE pedido_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pedido_id INT NOT NULL,
    cerveza_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
    FOREIGN KEY (cerveza_id) REFERENCES cervezas(id)
);

-- Tabla de transacciones de puntos
CREATE TABLE transacciones_puntos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    tipo ENUM('ganado', 'usado', 'expirado', 'bonificacion') NOT NULL,
    cantidad INT NOT NULL,
    descripcion VARCHAR(255),
    pedido_id INT NULL,
    fecha_transaccion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
);

-- Tabla de sesiones de usuario
CREATE TABLE sesiones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    token VARCHAR(500) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMP NOT NULL,
    activa BOOLEAN DEFAULT TRUE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabla de códigos de descuento
CREATE TABLE codigos_descuento (
    id INT PRIMARY KEY AUTO_INCREMENT,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    tipo ENUM('porcentaje', 'monto_fijo') NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP NOT NULL,
    uso_maximo INT DEFAULT NULL,
    uso_actual INT DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de uso de códigos de descuento
CREATE TABLE uso_codigos_descuento (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    codigo_id INT NOT NULL,
    pedido_id INT NOT NULL,
    descuento_aplicado DECIMAL(10,2) NOT NULL,
    fecha_uso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (codigo_id) REFERENCES codigos_descuento(id),
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
);

-- Insertar datos iniciales

-- Categorías
INSERT INTO categorias (nombre, descripcion) VALUES
('India Pale Ale', 'Cervezas con alto contenido de lúpulo, amargor intenso y aroma cítrico'),
('Imperial Stout', 'Cervezas oscuras con notas de café, chocolate y un cuerpo robusto'),
('Weissbier', 'Cervezas de trigo alemanas, refrescantes y con notas de plátano y clavo'),
('Red Ale', 'Cervezas ámbar con sabor maltoso y balance entre dulce y amargo'),
('Premium Lager', 'Cervezas doradas, limpias y refrescantes'),
('Smoked Porter', 'Cervezas oscuras con notas ahumadas distintivas');

-- Cervezas
INSERT INTO cervezas (nombre, estilo, descripcion, precio, puntos_ganados, imagen_url, categoria_id, stock_disponible, calificacion_promedio, total_calificaciones) VALUES
('Golden Sunset IPA', 'India Pale Ale', 'Cerveza con alto contenido de lúpulo, amargor intenso y un aroma cítrico y floral. Ideal para paladares atrevidos.', 89.99, 90, 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400', 1, 50, 4.5, 120),
('Dark Thunder Stout', 'Imperial Stout', 'Cerveza oscura con notas profundas de café tostado, chocolate negro y un final sedoso. Perfecta para el invierno.', 95.99, 96, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400', 2, 30, 4.8, 85),
('Bavarian Dream', 'Weissbier', 'Cerveza de trigo tradicional con notas de plátano, clavo y levadura. Refrescante y perfecta para el verano.', 79.99, 80, 'https://images.unsplash.com/photo-1618885472179-5e474019f2a9?w=400', 3, 75, 4.3, 95),
('Amber Breeze', 'Red Ale', 'Cerveza ámbar con sabor maltoso balanceado, notas de caramelo y un final suave. Ideal para cualquier ocasión.', 84.99, 85, 'https://images.unsplash.com/photo-1612528443702-f6741f70a049?w=400', 4, 60, 4.6, 110),
('Crystal Light Lager', 'Premium Lager', 'Cerveza dorada, limpia y refrescante con un sabor suave y balanceado. Perfecta para el día a día.', 69.99, 70, 'https://images.unsplash.com/photo-1600788907416-456578634209?w=400', 5, 100, 4.2, 150),
('Smoky Oak Porter', 'Smoked Porter', 'Cerveza oscura con notas ahumadas distintivas, sabor robusto y un carácter único. Para los amantes de lo intenso.', 92.99, 93, 'https://images.unsplash.com/photo-1615332579937-c7d28a272375?w=400', 6, 25, 4.7, 70);

-- Usuario de prueba
INSERT INTO usuarios (nombre_completo, email, password_hash, telefono, direccion, fecha_nacimiento, puntos_acumulados, tipo_identificacion, numero_identificacion, confirmo_mayor_edad, acepto_terminos) VALUES
('Pito Pérez', 'pitoperez@ejemplo.com', '$2b$10$IvP0HqweQ5Yam7kV9XqeOO5DjMBTBEUdQeLLM2Kz4MeCQwgwPiXza', '+52 123 456 7890', 'Calle Falsa 123, Ciudad, Estado, 12345', '1990-05-15', 1250, 'INE', 'ABC123456789', TRUE, TRUE);

-- Códigos de descuento
INSERT INTO codigos_descuento (codigo, tipo, valor, fecha_inicio, fecha_fin, uso_maximo) VALUES
('BIENVENIDO10', 'porcentaje', 10.00, '2024-01-01 00:00:00', '2024-12-31 23:59:59', 1000),
('PRIMERACOMPRA', 'monto_fijo', 50.00, '2024-01-01 00:00:00', '2024-12-31 23:59:59', 500),
('NAVIDAD2024', 'porcentaje', 15.00, '2024-12-01 00:00:00', '2024-12-31 23:59:59', 200);

-- Índices para optimizar consultas
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_activo ON usuarios(activo);
CREATE INDEX idx_cervezas_categoria ON cervezas(categoria_id);
CREATE INDEX idx_cervezas_activa ON cervezas(activa);
CREATE INDEX idx_pedidos_usuario ON pedidos(usuario_id);
CREATE INDEX idx_pedidos_estado ON pedidos(estado);
CREATE INDEX idx_carrito_items_carrito ON carrito_items(carrito_id);
CREATE INDEX idx_sesiones_token ON sesiones(token);
CREATE INDEX idx_sesiones_activa ON sesiones(activa);
CREATE INDEX idx_transacciones_usuario ON transacciones_puntos(usuario_id);
