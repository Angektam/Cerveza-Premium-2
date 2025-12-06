-- Script para agregar la columna metodo_pago a la tabla pedidos
-- Ejecutar este script en tu base de datos MySQL

USE cerveza_premium;

-- Verificar si la columna ya existe antes de agregarla
SET @col_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'cerveza_premium' 
    AND TABLE_NAME = 'pedidos' 
    AND COLUMN_NAME = 'metodo_pago'
);

-- Agregar columna metodo_pago solo si no existe
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE pedidos ADD COLUMN metodo_pago VARCHAR(50) DEFAULT ''tarjeta'' AFTER notas',
    'SELECT ''La columna metodo_pago ya existe'' AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Actualizar pedidos existentes sin método de pago (si la columna existe)
UPDATE pedidos 
SET metodo_pago = 'tarjeta' 
WHERE metodo_pago IS NULL OR metodo_pago = '';

-- Verificar que la columna se agregó correctamente
SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'cerveza_premium' 
AND TABLE_NAME = 'pedidos' 
AND COLUMN_NAME = 'metodo_pago';

