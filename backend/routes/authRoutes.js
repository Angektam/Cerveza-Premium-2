/**
 * Rutas de autenticación
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const {
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  validateLogin,
  validateRegister
} = require('../middleware/security');

// Health check
router.get('/health', async (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Login
router.post('/login', loginLimiter, validateLogin, authController.login.bind(authController));

// Registro
router.post('/register', registerLimiter, validateRegister, authController.register.bind(authController));

// Forgot password
router.post('/forgot-password', passwordResetLimiter, authController.forgotPassword.bind(authController));

// Reset password
router.post('/reset-password', authController.resetPassword.bind(authController));

module.exports = router;

