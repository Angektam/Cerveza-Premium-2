-- Script para agregar tabla de tiendas
-- Ejecutar este script en tu base de datos MySQL

USE cerveza_premium;

-- Tabla de tiendas
CREATE TABLE IF NOT EXISTS tiendas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    direccion TEXT NOT NULL,
    ciudad VARCHAR(100) NOT NULL,
    estado VARCHAR(100) NOT NULL,
    codigo_postal VARCHAR(10),
    telefono VARCHAR(20),
    email VARCHAR(255),
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    horario_apertura TIME DEFAULT '09:00:00',
    horario_cierre TIME DEFAULT '21:00:00',
    dias_abierto VARCHAR(50) DEFAULT 'Lunes-Domingo',
    activa BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de inventario por tienda
CREATE TABLE IF NOT EXISTS tienda_inventario (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tienda_id INT NOT NULL,
    cerveza_id INT NOT NULL,
    stock_disponible INT DEFAULT 0,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tienda_id) REFERENCES tiendas(id) ON DELETE CASCADE,
    FOREIGN KEY (cerveza_id) REFERENCES cervezas(id) ON DELETE CASCADE,
    UNIQUE KEY unique_tienda_cerveza (tienda_id, cerveza_id),
    INDEX idx_tienda (tienda_id),
    INDEX idx_cerveza (cerveza_id)
);

-- Insertar tiendas de ejemplo
INSERT INTO tiendas (nombre, direccion, ciudad, estado, codigo_postal, telefono, email, latitud, longitud, horario_apertura, horario_cierre, dias_abierto, activa) VALUES
('Cerveza Premium - Centro', 'Av. Reforma 123, Col. Centro', 'Ciudad de México', 'CDMX', '06000', '5551234567', 'centro@cervezapremium.com', 19.4326, -99.1332, '09:00:00', '21:00:00', 'Lunes-Domingo', TRUE),
('Cerveza Premium - Polanco', 'Av. Presidente Masaryk 456, Polanco', 'Ciudad de México', 'CDMX', '11560', '5552345678', 'polanco@cervezapremium.com', 19.4285, -99.1946, '10:00:00', '22:00:00', 'Lunes-Domingo', TRUE),
('Cerveza Premium - Roma', 'Av. Álvaro Obregón 789, Roma Norte', 'Ciudad de México', 'CDMX', '06700', '5553456789', 'roma@cervezapremium.com', 19.4194, -99.1616, '09:00:00', '21:00:00', 'Lunes-Domingo', TRUE)
ON DUPLICATE KEY UPDATE nombre = nombre;

-- Sincronizar inventario inicial (copiar stock de cervezas a todas las tiendas)
INSERT INTO tienda_inventario (tienda_id, cerveza_id, stock_disponible)
SELECT t.id, c.id, c.stock_disponible
FROM tiendas t
CROSS JOIN cervezas c
WHERE t.activa = 1 AND c.activa = 1
ON DUPLICATE KEY UPDATE stock_disponible = VALUES(stock_disponible);

-- Verificar que las tablas se crearon correctamente
SELECT 'Tablas creadas exitosamente' AS mensaje;
SELECT COUNT(*) AS total_tiendas FROM tiendas;
SELECT COUNT(*) AS total_inventarios FROM tienda_inventario;

