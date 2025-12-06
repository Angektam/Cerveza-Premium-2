const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');

// Configuración del servicio de email
const emailConfig = {
  // Usar SendGrid si está configurado, sino usar SMTP (Gmail)
  useSendGrid: !!process.env.SENDGRID_API_KEY,
  sendGridApiKey: process.env.SENDGRID_API_KEY,
  emailFrom: process.env.EMAIL_FROM || 'noreply@cervezapremium.com',
  
  // Configuración SMTP (Gmail)
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true', // true para 465, false para otros puertos
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS // Para Gmail, usar "Contraseña de aplicación"
    }
  }
};

// Inicializar SendGrid si está configurado
if (emailConfig.useSendGrid && emailConfig.sendGridApiKey) {
  sgMail.setApiKey(emailConfig.sendGridApiKey);
}

// Crear transporter para SMTP
let transporter = null;
if (!emailConfig.useSendGrid && emailConfig.smtp.auth.user && emailConfig.smtp.auth.pass) {
  transporter = nodemailer.createTransport({
    host: emailConfig.smtp.host,
    port: emailConfig.smtp.port,
    secure: emailConfig.smtp.secure,
    auth: {
      user: emailConfig.smtp.auth.user,
      pass: emailConfig.smtp.auth.pass
    }
  });
}

/**
 * Envía un email usando SendGrid o SMTP
 * @param {Object} options - Opciones del email
 * @param {string} options.to - Email del destinatario
 * @param {string} options.subject - Asunto del email
 * @param {string} options.html - Contenido HTML del email
 * @param {string} options.text - Contenido de texto plano (opcional)
 * @returns {Promise} - Promesa que se resuelve cuando el email se envía
 */
async function sendEmail({ to, subject, html, text }) {
  try {
    if (emailConfig.useSendGrid && emailConfig.sendGridApiKey) {
      // Usar SendGrid
      const msg = {
        to,
        from: emailConfig.emailFrom,
        subject,
        text: text || html.replace(/<[^>]*>/g, ''), // Convertir HTML a texto si no se proporciona
        html
      };
      
      await sgMail.send(msg);
      console.log(`✅ Email enviado con SendGrid a: ${to}`);
      return { success: true, method: 'SendGrid' };
    } else if (transporter) {
      // Usar SMTP
      const mailOptions = {
        from: `"Cerveza Premium" <${emailConfig.smtp.auth.user}>`,
        to,
        subject,
        text: text || html.replace(/<[^>]*>/g, ''),
        html
      };
      
      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ Email enviado con SMTP a: ${to}`, info.messageId);
      return { success: true, method: 'SMTP', messageId: info.messageId };
    } else {
      throw new Error('No hay configuración de email disponible. Configura SMTP o SendGrid en .env');
    }
  } catch (error) {
    console.error('❌ Error al enviar email:', error);
    throw error;
  }
}

/**
 * Envía email de bienvenida
 */
async function sendWelcomeEmail(userEmail, userName) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #fdbb2d 0%, #f9a825 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: #2c3e50; margin: 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #fdbb2d; color: #2c3e50; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🍻 ¡Bienvenido a Cerveza Premium!</h1>
        </div>
        <div class="content">
          <h2>Hola ${userName},</h2>
          <p>¡Gracias por unirte a nuestra comunidad cervecera!</p>
          <p>Estamos emocionados de tenerte con nosotros. Ahora puedes:</p>
          <ul>
            <li>Explorar nuestro catálogo de cervezas premium</li>
            <li>Acumular puntos con cada compra</li>
            <li>Recibir ofertas exclusivas</li>
            <li>Hacer pedidos a domicilio</li>
          </ul>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}" class="button">Explorar Catálogo</a>
          <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
          <p>¡Salud! 🍺</p>
          <p><strong>El equipo de Cerveza Premium</strong></p>
        </div>
        <div class="footer">
          <p>Este es un email automático, por favor no respondas a este mensaje.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail({
    to: userEmail,
    subject: '¡Bienvenido a Cerveza Premium! 🍻',
    html
  });
}

/**
 * Envía email de confirmación de pedido
 */
async function sendOrderConfirmationEmail(userEmail, userName, orderData) {
  const itemsHtml = orderData.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.nombre}</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.cantidad}</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${item.precio.toFixed(2)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${(item.precio * item.cantidad).toFixed(2)}</td>
    </tr>
  `).join('');
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #fdbb2d 0%, #f9a825 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: #2c3e50; margin: 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #2c3e50; color: white; padding: 10px; text-align: left; }
        .total { font-size: 18px; font-weight: bold; color: #fdbb2d; margin-top: 20px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Pedido Confirmado</h1>
        </div>
        <div class="content">
          <h2>Hola ${userName},</h2>
          <p>Tu pedido #${orderData.id} ha sido confirmado.</p>
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th style="text-align: center;">Cantidad</th>
                <th style="text-align: right;">Precio</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="total">
            Total: $${orderData.total.toFixed(2)}
          </div>
          <p><strong>Estado:</strong> ${orderData.estado}</p>
          <p><strong>Método de entrega:</strong> ${orderData.metodo_entrega}</p>
          ${orderData.direccion ? `<p><strong>Dirección:</strong> ${orderData.direccion}</p>` : ''}
          <p>Te notificaremos cuando tu pedido esté en camino.</p>
          <p>¡Gracias por tu compra! 🍺</p>
        </div>
        <div class="footer">
          <p>Este es un email automático, por favor no respondas a este mensaje.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail({
    to: userEmail,
    subject: `Confirmación de Pedido #${orderData.id} - Cerveza Premium`,
    html
  });
}

/**
 * Envía email de actualización de estado de pedido
 */
async function sendOrderStatusUpdateEmail(userEmail, userName, orderId, newStatus) {
  const statusMessages = {
    'pendiente': 'Tu pedido está siendo procesado',
    'confirmado': 'Tu pedido ha sido confirmado',
    'preparando': 'Estamos preparando tu pedido',
    'en_camino': 'Tu pedido está en camino',
    'entregado': 'Tu pedido ha sido entregado',
    'cancelado': 'Tu pedido ha sido cancelado'
  };
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #fdbb2d 0%, #f9a825 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: #2c3e50; margin: 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .status-badge { display: inline-block; padding: 10px 20px; background: #fdbb2d; color: #2c3e50; border-radius: 5px; font-weight: bold; margin: 10px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📦 Actualización de Pedido</h1>
        </div>
        <div class="content">
          <h2>Hola ${userName},</h2>
          <p>${statusMessages[newStatus] || 'El estado de tu pedido ha cambiado'}.</p>
          <p><strong>Pedido #${orderId}</strong></p>
          <div class="status-badge">Estado: ${newStatus.toUpperCase()}</div>
          <p>Puedes ver el estado actualizado de tu pedido en tu cuenta.</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}" style="display: inline-block; padding: 12px 30px; background: #fdbb2d; color: #2c3e50; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0;">Ver Mis Pedidos</a>
        </div>
        <div class="footer">
          <p>Este es un email automático, por favor no respondas a este mensaje.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail({
    to: userEmail,
    subject: `Actualización de Pedido #${orderId} - Cerveza Premium`,
    html
  });
}

/**
 * Envía email de promoción
 */
async function sendPromotionEmail(userEmail, userName, promotionData) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #fdbb2d 0%, #f9a825 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: #2c3e50; margin: 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .promo-badge { display: inline-block; padding: 10px 20px; background: #e74c3c; color: white; border-radius: 5px; font-weight: bold; margin: 10px 0; }
        .button { display: inline-block; padding: 12px 30px; background: #fdbb2d; color: #2c3e50; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 ${promotionData.titulo || 'Oferta Especial'}</h1>
        </div>
        <div class="content">
          <h2>Hola ${userName},</h2>
          <div class="promo-badge">${promotionData.descuento || 'OFERTA ESPECIAL'}</div>
          <p>${promotionData.descripcion || 'Tenemos una oferta especial para ti'}</p>
          ${promotionData.imagen ? `<img src="${promotionData.imagen}" alt="Promoción" style="max-width: 100%; margin: 20px 0;">` : ''}
          <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}" class="button">Ver Oferta</a>
          <p>Esta oferta es válida hasta ${promotionData.fecha_fin || 'pronto'}.</p>
        </div>
        <div class="footer">
          <p>Este es un email promocional. Si no deseas recibir más emails, puedes desactivarlos en tu perfil.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail({
    to: userEmail,
    subject: promotionData.titulo || 'Oferta Especial - Cerveza Premium',
    html
  });
}

/**
 * Verifica la configuración del servicio de email
 */
function checkEmailConfig() {
  if (emailConfig.useSendGrid && emailConfig.sendGridApiKey) {
    return { configured: true, method: 'SendGrid' };
  } else if (transporter) {
    return { configured: true, method: 'SMTP' };
  } else {
    return { configured: false, method: null };
  }
}

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
  sendPromotionEmail,
  checkEmailConfig
};

