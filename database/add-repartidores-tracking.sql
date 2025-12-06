-- Script para agregar tablas de repartidores y tracking
-- Ejecutar este script en tu base de datos MySQL

USE cerveza_premium;

-- Tabla de repartidores
CREATE TABLE IF NOT EXISTS repartidores (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre_completo VARCHAR(100) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    email VARCHAR(255) UNIQUE,
    vehiculo VARCHAR(50) DEFAULT 'Moto',
    placa VARCHAR(20),
    activo BOOLEAN DEFAULT TRUE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_actividad TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de ubicaciones de repartidores (tracking en tiempo real)
CREATE TABLE IF NOT EXISTS repartidor_ubicaciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    repartidor_id INT NOT NULL,
    latitud DECIMAL(10, 8) NOT NULL,
    longitud DECIMAL(11, 8) NOT NULL,
    velocidad DECIMAL(5, 2) DEFAULT 0,
    direccion TEXT,
    fecha_ubicacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (repartidor_id) REFERENCES repartidores(id) ON DELETE CASCADE,
    INDEX idx_repartidor_fecha (repartidor_id, fecha_ubicacion)
);

-- Agregar columna repartidor_id a la tabla pedidos si no existe
SET @col_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'cerveza_premium' 
    AND TABLE_NAME = 'pedidos' 
    AND COLUMN_NAME = 'repartidor_id'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE pedidos ADD COLUMN repartidor_id INT NULL AFTER metodo_pago, ADD FOREIGN KEY (repartidor_id) REFERENCES repartidores(id)',
    'SELECT ''La columna repartidor_id ya existe'' AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Insertar algunos repartidores de ejemplo
INSERT INTO repartidores (nombre_completo, telefono, email, vehiculo, placa, activo) VALUES
('Juan Pérez', '5551234567', 'juan.perez@cervezapremium.com', 'Moto', 'ABC-123', TRUE),
('María González', '5552345678', 'maria.gonzalez@cervezapremium.com', 'Bicicleta', 'XYZ-789', TRUE),
('Carlos Rodríguez', '5553456789', 'carlos.rodriguez@cervezapremium.com', 'Moto', 'DEF-456', TRUE)
ON DUPLICATE KEY UPDATE nombre_completo = nombre_completo;

-- Verificar que las tablas se crearon correctamente
SELECT 'Tablas creadas exitosamente' AS mensaje;
SELECT COUNT(*) AS total_repartidores FROM repartidores;

