-- Agregar características de seguridad a la base de datos
USE cerveza_premium;

-- Agregar columnas para reset de contraseña
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS reset_token_expire DATETIME NULL;

-- Crear índice para búsquedas rápidas de reset tokens
CREATE INDEX IF NOT EXISTS idx_reset_token ON usuarios(reset_token);

-- Tabla para registrar intentos de login fallidos (opcional pero recomendado)
CREATE TABLE IF NOT EXISTS login_attempts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  user_agent TEXT,
  successful BOOLEAN DEFAULT FALSE,
  attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_ip (ip_address),
  INDEX idx_attempt_time (attempt_time)
);

-- Tabla para logs de seguridad
CREATE TABLE IF NOT EXISTS security_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  event_type VARCHAR(50) NOT NULL,
  user_id INT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  details JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES usuarios(id),
  INDEX idx_event_type (event_type),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);

-- Tabla para sesiones activas (mejorada)
CREATE TABLE IF NOT EXISTS active_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  INDEX idx_token_hash (token_hash),
  INDEX idx_usuario_id (usuario_id),
  INDEX idx_expires_at (expires_at)
);

SELECT 'Características de seguridad agregadas exitosamente' as status;

