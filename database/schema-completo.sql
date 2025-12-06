-- Base de datos Cerveza Premium - Datos de prueba actualizados
-- Ejecutar: mysql -u root -p < database/schema-completo.sql

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS cerveza_premium CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cerveza_premium;

-- Tabla de usuarios
CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre_completo VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    direccion TEXT,
    fecha_nacimiento DATE NOT NULL,
    puntos_acumulados INT DEFAULT 0,
    tipo_identificacion ENUM('INE', 'Pasaporte', 'Licencia') NOT NULL,
    numero_identificacion VARCHAR(50) NOT NULL,
    foto_identificacion_frente VARCHAR(255),
    foto_identificacion_reverso VARCHAR(255),
    confirmo_mayor_edad BOOLEAN NOT NULL DEFAULT FALSE,
    acepto_terminos BOOLEAN NOT NULL DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_actividad TIMESTAMP NULL
);

-- Tabla de categorías
CREATE TABLE categorias (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT,
    activa BOOLEAN DEFAULT TRUE
);

-- Tabla de cervezas
CREATE TABLE cervezas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    estilo VARCHAR(50) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    puntos_ganados INT DEFAULT 0,
    imagen_url VARCHAR(255),
    categoria_id INT,
    stock_disponible INT DEFAULT 0,
    calificacion_promedio DECIMAL(3,2) DEFAULT 0.00,
    total_calificaciones INT DEFAULT 0,
    activa BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

-- Tabla de carrito
CREATE TABLE carrito (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    cerveza_id INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(10,2) NOT NULL,
    fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (cerveza_id) REFERENCES cervezas(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_beer (usuario_id, cerveza_id)
);

-- Tabla de pedidos
CREATE TABLE pedidos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    numero_pedido VARCHAR(20) UNIQUE NOT NULL,
    fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('pendiente', 'confirmado', 'en_preparacion', 'enviado', 'entregado', 'cancelado') DEFAULT 'pendiente',
    total DECIMAL(10,2) NOT NULL,
    puntos_usados INT DEFAULT 0,
    puntos_ganados INT DEFAULT 0,
    direccion_entrega TEXT,
    notas TEXT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabla de items de pedido
CREATE TABLE pedido_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pedido_id INT NOT NULL,
    cerveza_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (cerveza_id) REFERENCES cervezas(id)
);

-- Tabla de historial de puntos
CREATE TABLE puntos_historial (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    tipo ENUM('ganado', 'usado', 'expirado') NOT NULL,
    cantidad INT NOT NULL,
    descripcion VARCHAR(255),
    pedido_id INT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
);

-- Tabla de documentos de usuario
CREATE TABLE documentos_usuario (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    tipo_documento ENUM('identificacion_frente', 'identificacion_reverso', 'comprobante_domicilio') NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    ruta_archivo VARCHAR(500) NOT NULL,
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla de direcciones
CREATE TABLE direcciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    direccion TEXT NOT NULL,
    ciudad VARCHAR(50) NOT NULL,
    estado VARCHAR(50) NOT NULL,
    codigo_postal VARCHAR(10) NOT NULL,
    telefono VARCHAR(20),
    es_principal BOOLEAN DEFAULT FALSE,
    activa BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla de métodos de pago
CREATE TABLE metodos_pago (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    tipo ENUM('tarjeta', 'paypal', 'transferencia') NOT NULL,
    datos_pago JSON,
    es_principal BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla de códigos de descuento
CREATE TABLE codigos_descuento (
    id INT PRIMARY KEY AUTO_INCREMENT,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    tipo ENUM('porcentaje', 'monto_fijo') NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP NOT NULL,
    uso_maximo INT DEFAULT 1,
    uso_actual INT DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE
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
('Smoked Porter', 'Cervezas oscuras con notas ahumadas distintivas'),
('Pale Ale', 'Cervezas doradas con sabor balanceado y aroma floral'),
('Wheat Beer', 'Cervezas de trigo refrescantes y ligeras');

-- Cervezas
INSERT INTO cervezas (nombre, estilo, descripcion, precio, puntos_ganados, imagen_url, categoria_id, stock_disponible, calificacion_promedio, total_calificaciones) VALUES
('Golden Sunset IPA', 'India Pale Ale', 'Cerveza con alto contenido de lúpulo, amargor intenso y un aroma cítrico y floral. Ideal para paladares atrevidos.', 89.99, 90, 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400', 1, 50, 4.5, 120),
('Dark Thunder Stout', 'Imperial Stout', 'Cerveza oscura con notas profundas de café tostado, chocolate negro y un final sedoso. Perfecta para el invierno.', 95.99, 96, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400', 2, 30, 4.8, 85),
('Bavarian Dream', 'Weissbier', 'Cerveza de trigo tradicional con notas de plátano, clavo y levadura. Refrescante y perfecta para el verano.', 79.99, 80, 'https://images.unsplash.com/photo-1618885472179-5e474019f2a9?w=400', 3, 75, 4.3, 95),
('Amber Breeze', 'Red Ale', 'Cerveza ámbar con sabor maltoso balanceado, notas de caramelo y un final suave. Ideal para cualquier ocasión.', 84.99, 85, 'https://images.unsplash.com/photo-1612528443702-f6741f70a049?w=400', 4, 60, 4.6, 110),
('Crystal Light Lager', 'Premium Lager', 'Cerveza dorada, limpia y refrescante con un sabor suave y balanceado. Perfecta para el día a día.', 69.99, 70, 'https://images.unsplash.com/photo-1600788907416-456578634209?w=400', 5, 100, 4.2, 150),
('Smoky Oak Porter', 'Smoked Porter', 'Cerveza oscura con notas ahumadas distintivas, sabor robusto y un carácter único. Para los amantes de lo intenso.', 92.99, 93, 'https://images.unsplash.com/photo-1615332579937-c7d28a272375?w=400', 6, 25, 4.7, 70),
('Citrus Haze Pale Ale', 'Pale Ale', 'Cerveza dorada con notas cítricas, sabor balanceado y aroma floral. Perfecta para cualquier momento.', 76.99, 77, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400', 7, 80, 4.4, 95),
('Summer Wheat', 'Wheat Beer', 'Cerveza de trigo refrescante con notas de cítricos y especias. Ideal para días calurosos.', 72.99, 73, 'https://images.unsplash.com/photo-1618885472179-5e474019f2a9?w=400', 8, 90, 4.1, 120),
('Midnight Express IPA', 'India Pale Ale', 'Cerveza IPA con lúpulo intenso, notas tropicales y un amargor equilibrado. Para los amantes del lúpulo.', 88.99, 89, 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400', 1, 45, 4.6, 85),
('Velvet Chocolate Stout', 'Imperial Stout', 'Cerveza stout con notas de chocolate, vainilla y un cuerpo sedoso. Una experiencia única.', 98.99, 99, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400', 2, 20, 4.9, 65);

-- Usuarios de prueba (con hash correcto para contraseña "1234")
INSERT INTO usuarios (nombre_completo, email, password_hash, telefono, direccion, fecha_nacimiento, puntos_acumulados, tipo_identificacion, numero_identificacion, confirmo_mayor_edad, acepto_terminos) VALUES
('Pito Pérez', 'pitoperez@ejemplo.com', '$2b$10$IvP0HqweQ5Yam7kV9XqeOO5DjMBTBEUdQeLLM2Kz4MeCQwgwPiXza', '+52 123 456 7890', 'Calle Falsa 123, Ciudad, Estado, 12345', '1990-05-15', 1250, 'INE', 'ABC123456789', TRUE, TRUE),
('María González', 'maria@ejemplo.com', '$2b$10$IvP0HqweQ5Yam7kV9XqeOO5DjMBTBEUdQeLLM2Kz4MeCQwgwPiXza', '+52 987 654 3210', 'Av. Principal 456, Ciudad, Estado, 54321', '1985-08-22', 850, 'INE', 'DEF987654321', TRUE, TRUE),
('Carlos Rodríguez', 'carlos@ejemplo.com', '$2b$10$IvP0HqweQ5Yam7kV9XqeOO5DjMBTBEUdQeLLM2Kz4MeCQwgwPiXza', '+52 555 123 4567', 'Calle Secundaria 789, Ciudad, Estado, 67890', '1992-12-03', 2100, 'Pasaporte', 'GHI456789123', TRUE, TRUE);

-- Códigos de descuento
INSERT INTO codigos_descuento (codigo, tipo, valor, fecha_inicio, fecha_fin, uso_maximo) VALUES
('BIENVENIDO10', 'porcentaje', 10.00, '2024-01-01 00:00:00', '2024-12-31 23:59:59', 1000),
('PRIMERACOMPRA', 'monto_fijo', 50.00, '2024-01-01 00:00:00', '2024-12-31 23:59:59', 500),
('NAVIDAD2024', 'porcentaje', 15.00, '2024-12-01 00:00:00', '2024-12-31 23:59:59', 200),
('VERANO20', 'porcentaje', 20.00, '2024-06-01 00:00:00', '2024-08-31 23:59:59', 100),
('DESCUENTO50', 'monto_fijo', 50.00, '2024-01-01 00:00:00', '2024-12-31 23:59:59', 300);

-- Pedidos de ejemplo
INSERT INTO pedidos (usuario_id, numero_pedido, fecha_pedido, estado, total, puntos_usados, puntos_ganados) VALUES
(1, 'PED-2024-001', '2024-01-15 10:30:00', 'entregado', 179.98, 0, 180),
(1, 'PED-2024-002', '2024-02-20 14:45:00', 'entregado', 95.99, 100, 96),
(2, 'PED-2024-003', '2024-03-10 09:15:00', 'pendiente', 159.98, 0, 160),
(3, 'PED-2024-004', '2024-03-25 16:20:00', 'enviado', 284.97, 200, 285);

-- Items de pedidos
INSERT INTO pedido_items (pedido_id, cerveza_id, cantidad, precio_unitario, subtotal) VALUES
(1, 1, 2, 89.99, 179.98),
(2, 2, 1, 95.99, 95.99),
(3, 3, 2, 79.99, 159.98),
(4, 1, 1, 89.99, 89.99),
(4, 2, 1, 95.99, 95.99),
(4, 3, 1, 79.99, 79.99);

-- Historial de puntos
INSERT INTO puntos_historial (usuario_id, tipo, cantidad, descripcion, pedido_id) VALUES
(1, 'ganado', 180, 'Compra pedido PED-2024-001', 1),
(1, 'ganado', 96, 'Compra pedido PED-2024-002', 2),
(1, 'usado', 100, 'Descuento en pedido PED-2024-002', 2),
(2, 'ganado', 160, 'Compra pedido PED-2024-003', 3),
(3, 'ganado', 285, 'Compra pedido PED-2024-004', 4),
(3, 'usado', 200, 'Descuento en pedido PED-2024-004', 4);

-- Direcciones de ejemplo
INSERT INTO direcciones (usuario_id, nombre, direccion, ciudad, estado, codigo_postal, telefono, es_principal) VALUES
(1, 'Casa', 'Calle Falsa 123', 'Ciudad', 'Estado', '12345', '+52 123 456 7890', TRUE),
(2, 'Oficina', 'Av. Principal 456', 'Ciudad', 'Estado', '54321', '+52 987 654 3210', TRUE),
(3, 'Residencia', 'Calle Secundaria 789', 'Ciudad', 'Estado', '67890', '+52 555 123 4567', TRUE);

-- Índices para optimizar consultas
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_activo ON usuarios(activo);
CREATE INDEX idx_cervezas_categoria ON cervezas(categoria_id);
CREATE INDEX idx_cervezas_activa ON cervezas(activa);
CREATE INDEX idx_pedidos_usuario ON pedidos(usuario_id);
CREATE INDEX idx_pedidos_estado ON pedidos(estado);
CREATE INDEX idx_carrito_usuario ON carrito(usuario_id);
CREATE INDEX idx_puntos_usuario ON puntos_historial(usuario_id);

-- Verificar datos insertados
SELECT 'Usuarios:' as tabla, COUNT(*) as total FROM usuarios
UNION ALL
SELECT 'Cervezas:', COUNT(*) FROM cervezas
UNION ALL
SELECT 'Categorías:', COUNT(*) FROM categorias
UNION ALL
SELECT 'Pedidos:', COUNT(*) FROM pedidos
UNION ALL
SELECT 'Códigos descuento:', COUNT(*) FROM codigos_descuento;

-- Mostrar usuarios de prueba
SELECT id, nombre_completo, email, puntos_acumulados FROM usuarios WHERE email LIKE '%@ejemplo.com';
