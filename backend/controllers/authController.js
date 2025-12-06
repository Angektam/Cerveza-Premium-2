/**
 * Controlador de autenticación
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query, transaction } = require('../utils/database');
const { success, error } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { logFailedLogin, logSuccessfulLogin } = require('../middleware/security');

class AuthController {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Buscar usuario
      const users = await query(
        'SELECT * FROM usuarios WHERE email = ? AND activo = 1',
        [email]
      );

      if (users.length === 0) {
        logFailedLogin(email, req);
        return error(res, 'Credenciales inválidas', 401, 'INVALID_CREDENTIALS');
      }

      const user = users[0];
      
      // Verificar contraseña
      const validPassword = await bcrypt.compare(password, user.password_hash);

      if (!validPassword) {
        logFailedLogin(email, req);
        return error(res, 'Credenciales inválidas', 401, 'INVALID_CREDENTIALS');
      }

      // Generar token JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, rol: user.rol },
        process.env.JWT_SECRET || 'tu_secreto_super_seguro',
        { expiresIn: process.env.JWT_EXPIRE || '24h' }
      );

      // Registrar login exitoso
      logSuccessfulLogin(user.id, email, req);

      // Actualizar última actividad
      await query(
        'UPDATE usuarios SET ultima_actividad = CURRENT_TIMESTAMP WHERE id = ?',
        [user.id]
      );

      // Preparar datos del usuario (sin información sensible)
      const userData = {
        id: user.id,
        nombre_completo: user.nombre_completo,
        email: user.email,
        telefono: user.telefono,
        direccion: user.direccion,
        fecha_nacimiento: user.fecha_nacimiento,
        puntos_acumulados: user.puntos_acumulados,
        tipo_identificacion: user.tipo_identificacion,
        numero_identificacion: user.numero_identificacion,
        foto_identificacion_frente: user.foto_identificacion_frente,
        foto_identificacion_reverso: user.foto_identificacion_reverso,
        rol: user.rol
      };

      return success(res, { user: userData, token }, 'Login exitoso');
    } catch (err) {
      next(err);
    }
  }

  async register(req, res, next) {
    try {
      const {
        nombre_completo,
        email,
        password,
        telefono,
        direccion,
        fecha_nacimiento,
        tipo_identificacion,
        numero_identificacion,
        foto_identificacion_frente,
        foto_identificacion_reverso,
        confirmo_mayor_edad,
        acepto_terminos
      } = req.body;

      // Verificar si el email ya existe
      const existingUsers = await query(
        'SELECT id FROM usuarios WHERE email = ?',
        [email]
      );

      if (existingUsers.length > 0) {
        return error(res, 'El email ya está registrado', 400, 'EMAIL_EXISTS');
      }

      // Hash de la contraseña
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const password_hash = await bcrypt.hash(password, saltRounds);

      // Crear usuario
      const result = await query(
        `INSERT INTO usuarios (
          nombre_completo, email, password_hash, telefono, direccion, 
          fecha_nacimiento, tipo_identificacion, numero_identificacion,
          foto_identificacion_frente, foto_identificacion_reverso,
          confirmo_mayor_edad, acepto_terminos, rol, activo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'cliente', TRUE)`,
        [
          nombre_completo, email, password_hash, telefono, direccion,
          fecha_nacimiento, tipo_identificacion, numero_identificacion,
          foto_identificacion_frente, foto_identificacion_reverso,
          confirmo_mayor_edad, acepto_terminos
        ]
      );

      const userId = result.insertId;

      // Obtener usuario creado
      const newUsers = await query(
        'SELECT id, nombre_completo, email, rol FROM usuarios WHERE id = ?',
        [userId]
      );

      return success(res, { user: newUsers[0] }, 'Usuario registrado exitosamente', 201);
    } catch (err) {
      next(err);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      if (!email) {
        return error(res, 'Email es requerido', 400, 'EMAIL_REQUIRED');
      }

      // Verificar si el usuario existe
      const users = await query(
        'SELECT id, nombre_completo FROM usuarios WHERE email = ? AND activo = 1',
        [email]
      );

      // Por seguridad, siempre devolver el mismo mensaje
      const successMessage = 'Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña';

      if (users.length === 0) {
        return success(res, { message: successMessage }, successMessage);
      }

      const user = users[0];

      // Generar token único
      const crypto = require('crypto');
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 3600000); // 1 hora

      // Guardar token en base de datos
      await query(
        'INSERT INTO reset_tokens (usuario_id, token, email, expires_at) VALUES (?, ?, ?, ?)',
        [user.id, resetToken, email, expiresAt]
      );

      // En desarrollo, mostrar URL en consola
      if (process.env.NODE_ENV === 'development') {
        console.log(`\n=== RESET PASSWORD TOKEN ===`);
        console.log(`Usuario: ${user.nombre_completo} (${email})`);
        console.log(`Token: ${resetToken}`);
        console.log(`Expira: ${expiresAt}`);
        console.log(`URL: http://localhost:4200/reset-password?token=${resetToken}`);
        console.log(`========================\n`);
      }

      return success(res, {
        message: successMessage,
        ...(process.env.NODE_ENV === 'development' && {
          resetUrl: `http://localhost:4200/reset-password?token=${resetToken}`
        })
      }, successMessage);
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return error(res, 'Token y nueva contraseña son requeridos', 400, 'MISSING_FIELDS');
      }

      if (newPassword.length < 8) {
        return error(res, 'La contraseña debe tener al menos 8 caracteres', 400, 'PASSWORD_TOO_SHORT');
      }

      // Verificar token válido
      const tokenRows = await query(
        'SELECT rt.*, u.id as user_id FROM reset_tokens rt JOIN usuarios u ON rt.usuario_id = u.id WHERE rt.token = ? AND rt.used = FALSE AND rt.expires_at > NOW()',
        [token]
      );

      if (tokenRows.length === 0) {
        return error(res, 'Token inválido o expirado', 400, 'INVALID_TOKEN');
      }

      const tokenData = tokenRows[0];

      // Hash de la nueva contraseña
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const password_hash = await bcrypt.hash(newPassword, saltRounds);

      // Actualizar contraseña del usuario
      await query(
        'UPDATE usuarios SET password_hash = ? WHERE id = ?',
        [password_hash, tokenData.user_id]
      );

      // Marcar token como usado
      await query(
        'UPDATE reset_tokens SET used = TRUE WHERE id = ?',
        [tokenData.id]
      );

      return success(res, null, 'Contraseña restablecida exitosamente');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();

