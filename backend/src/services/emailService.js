const nodemailer = require('nodemailer');
const config = require('../config');

/**
 * Configurar transporter de nodemailer
 * En desarrollo, usar ethereal.email o SMTP de prueba
 * En producción, configurar con Gmail, SendGrid, etc.
 */
const createTransporter = () => {
  // Si hay configuración SMTP en las variables de entorno
  if (config.email && config.email.host) {
    return nodemailer.createTransporter({
      host: config.email.host,
      port: config.email.port || 587,
      secure: config.email.secure || false,
      auth: {
        user: config.email.user,
        pass: config.email.pass
      }
    });
  }

  // Configuración por defecto para desarrollo (logs en consola)
  return {
    sendMail: async (mailOptions) => {
      console.log('📧 Email simulado (modo desarrollo):');
      console.log('   De:', mailOptions.from);
      console.log('   Para:', mailOptions.to);
      console.log('   Asunto:', mailOptions.subject);
      console.log('   Contenido:', mailOptions.text || mailOptions.html);
      console.log('');
      return { messageId: 'dev-' + Date.now() };
    }
  };
};

const transporter = createTransporter();

/**
 * Enviar email genérico
 */
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const mailOptions = {
      from: config.email?.from || '"Subasta Silenciosa" <noreply@subasta.com>',
      to,
      subject,
      text,
      html: html || text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email enviado:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error al enviar email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Plantilla HTML base
 */
const htmlTemplate = (content, eventoNombre = 'Subasta Silenciosa') => {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px 20px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #ffffff;
          padding: 30px;
          border-left: 1px solid #e0e0e0;
          border-right: 1px solid #e0e0e0;
        }
        .footer {
          background: #f5f5f5;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #666;
          border-radius: 0 0 10px 10px;
          border: 1px solid #e0e0e0;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background: #667eea;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .highlight {
          background: #f0f4ff;
          padding: 15px;
          border-left: 4px solid #667eea;
          margin: 20px 0;
        }
        .obra-card {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
        }
        .obra-title {
          font-size: 18px;
          font-weight: bold;
          color: #667eea;
          margin-bottom: 10px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${eventoNombre}</h1>
      </div>
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        <p>Este es un correo automático, por favor no respondas directamente.</p>
        <p>&copy; ${new Date().getFullYear()} ${eventoNombre}. Todos los derechos reservados.</p>
      </div>
    </body>
    </html>
  `;
};

/**
 * Email: Ganaste la subasta
 */
const sendWinnerNotification = async ({ email, nombre, obra, monto, eventoNombre }) => {
  const subject = `🎉 ¡Felicitaciones! Ganaste la subasta de "${obra.nombre}"`;
  
  const htmlContent = htmlTemplate(`
    <h2>¡Felicitaciones ${nombre}!</h2>
    <p>Has ganado la subasta de la siguiente obra:</p>
    
    <div class="obra-card">
      <div class="obra-title">${obra.nombre}</div>
      <p><strong>Artista:</strong> ${obra.artista}</p>
      <p><strong>Tu oferta ganadora:</strong> S/ ${parseFloat(monto).toFixed(2)}</p>
    </div>
    
    <div class="highlight">
      <strong>Próximos pasos:</strong>
      <ol>
        <li>Ingresa a tu cuenta para seleccionar el método de pago</li>
        <li>Completa el pago dentro de las próximas 48 horas</li>
        <li>Recibirás confirmación una vez verificado el pago</li>
        <li>Coordinaremos la entrega de tu obra</li>
      </ol>
    </div>
    
    <p style="text-align: center;">
      <a href="${config.frontend?.url || 'http://localhost:3000'}/mis-compras" class="button">
        Ver mis compras
      </a>
    </p>
    
    <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
  `, eventoNombre);

  const text = `
¡Felicitaciones ${nombre}!

Has ganado la subasta de: ${obra.nombre}
Artista: ${obra.artista}
Tu oferta ganadora: S/ ${parseFloat(monto).toFixed(2)}

Por favor, ingresa a tu cuenta para completar el pago dentro de las próximas 48 horas.
  `;

  return await sendEmail({ to: email, subject, text, html: htmlContent });
};

/**
 * Email: Método de pago seleccionado
 */
const sendPaymentMethodSelected = async ({ email, nombre, obra, monto, metodo, contactInfo, eventoNombre }) => {
  const subject = `Método de pago seleccionado - ${obra.nombre}`;
  
  let instrucciones = '';
  if (metodo === 'CASH') {
    instrucciones = `
      <div class="highlight">
        <strong>Instrucciones para pago en efectivo:</strong>
        <p>Por favor, contacta al administrador para coordinar el pago:</p>
        <ul>
          ${contactInfo.email ? `<li>Email: ${contactInfo.email}</li>` : ''}
          ${contactInfo.telefono ? `<li>Teléfono: ${contactInfo.telefono}</li>` : ''}
          ${contactInfo.whatsapp ? `<li><a href="${contactInfo.whatsapp}">WhatsApp</a></li>` : ''}
        </ul>
      </div>
    `;
  } else if (metodo === 'TRANSFERENCIA') {
    instrucciones = `
      <div class="highlight">
        <strong>Instrucciones para transferencia bancaria:</strong>
        <p>Realiza la transferencia y envía el comprobante por WhatsApp:</p>
        <ul>
          ${contactInfo.whatsapp ? `<li><a href="${contactInfo.whatsapp}" class="button">Enviar comprobante por WhatsApp</a></li>` : ''}
          ${contactInfo.telefono ? `<li>Teléfono: ${contactInfo.telefono}</li>` : ''}
        </ul>
        <p><strong>Monto a transferir:</strong> S/ ${parseFloat(monto).toFixed(2)}</p>
      </div>
    `;
  } else if (metodo === 'TARJETA') {
    instrucciones = `
      <div class="highlight">
        <strong>Pago con tarjeta:</strong>
        <p>Haz clic en el botón para proceder con el pago seguro:</p>
        <p style="text-align: center;">
          <a href="${config.frontend?.url || 'http://localhost:3000'}/pagar/${obra.id}" class="button">
            Pagar S/ ${parseFloat(monto).toFixed(2)}
          </a>
        </p>
      </div>
    `;
  }

  const htmlContent = htmlTemplate(`
    <h2>Hola ${nombre},</h2>
    <p>Has seleccionado el método de pago: <strong>${metodo}</strong></p>
    
    <div class="obra-card">
      <div class="obra-title">${obra.nombre}</div>
      <p><strong>Artista:</strong> ${obra.artista}</p>
      <p><strong>Monto a pagar:</strong> S/ ${parseFloat(monto).toFixed(2)}</p>
    </div>
    
    ${instrucciones}
    
    <p>Recuerda completar tu pago dentro de las próximas 48 horas.</p>
  `, eventoNombre);

  const text = `
Hola ${nombre},

Has seleccionado el método de pago: ${metodo}
Obra: ${obra.nombre}
Monto a pagar: S/ ${parseFloat(monto).toFixed(2)}

${metodo === 'CASH' ? 'Por favor, contacta al administrador para coordinar el pago en efectivo.' : ''}
${metodo === 'TRANSFERENCIA' ? 'Realiza la transferencia y envía el comprobante por WhatsApp al número proporcionado.' : ''}
  `;

  return await sendEmail({ to: email, subject, text, html: htmlContent });
};

/**
 * Email: Pago confirmado
 */
const sendPaymentConfirmed = async ({ email, nombre, obra, monto, eventoNombre }) => {
  const subject = `✅ Pago confirmado - ${obra.nombre}`;
  
  const htmlContent = htmlTemplate(`
    <h2>¡Excelente noticia, ${nombre}!</h2>
    <p>Tu pago ha sido confirmado exitosamente.</p>
    
    <div class="obra-card">
      <div class="obra-title">${obra.nombre}</div>
      <p><strong>Artista:</strong> ${obra.artista}</p>
      <p><strong>Monto pagado:</strong> S/ ${parseFloat(monto).toFixed(2)}</p>
      <p><strong>Estado:</strong> <span style="color: green;">✓ Pagado</span></p>
    </div>
    
    <div class="highlight">
      <strong>Próximos pasos:</strong>
      <p>Estamos preparando tu obra para la entrega. Te notificaremos cuando esté lista para recoger.</p>
    </div>
    
    <p>Gracias por tu participación en nuestra subasta.</p>
  `, eventoNombre);

  const text = `
¡Excelente noticia, ${nombre}!

Tu pago ha sido confirmado exitosamente.

Obra: ${obra.nombre}
Artista: ${obra.artista}
Monto pagado: S/ ${parseFloat(monto).toFixed(2)}

Estamos preparando tu obra para la entrega. Te notificaremos cuando esté lista para recoger.
  `;

  return await sendEmail({ to: email, subject, text, html: htmlContent });
};

/**
 * Email: Obra lista para recoger
 */
const sendReadyForPickup = async ({ email, nombre, obra, contactInfo, eventoNombre }) => {
  const subject = `📦 Tu obra está lista para recoger - ${obra.nombre}`;
  
  const htmlContent = htmlTemplate(`
    <h2>Hola ${nombre},</h2>
    <p>¡Tu obra ya está lista para ser recogida!</p>
    
    <div class="obra-card">
      <div class="obra-title">${obra.nombre}</div>
      <p><strong>Artista:</strong> ${obra.artista}</p>
      <p><strong>Estado:</strong> <span style="color: blue;">📦 Lista para recoger</span></p>
    </div>
    
    <div class="highlight">
      <strong>Información de retiro:</strong>
      <p>Por favor, coordina el retiro de tu obra:</p>
      <ul>
        ${contactInfo.email ? `<li>Email: ${contactInfo.email}</li>` : ''}
        ${contactInfo.telefono ? `<li>Teléfono: ${contactInfo.telefono}</li>` : ''}
        ${contactInfo.whatsapp ? `<li><a href="${contactInfo.whatsapp}">WhatsApp</a></li>` : ''}
      </ul>
    </div>
    
    <p>¡Esperamos que disfrutes tu nueva adquisición!</p>
  `, eventoNombre);

  const text = `
Hola ${nombre},

¡Tu obra ya está lista para ser recogida!

Obra: ${obra.nombre}
Artista: ${obra.artista}

Por favor, contacta al administrador para coordinar el retiro.
  `;

  return await sendEmail({ to: email, subject, text, html: htmlContent });
};

/**
 * Email: Recordatorio de pago pendiente
 */
const sendPaymentReminder = async ({ email, nombre, obra, monto, horasRestantes, eventoNombre }) => {
  const subject = `⏰ Recordatorio: Pago pendiente - ${obra.nombre}`;
  
  const htmlContent = htmlTemplate(`
    <h2>Hola ${nombre},</h2>
    <p>Te recordamos que tienes un pago pendiente por la siguiente obra:</p>
    
    <div class="obra-card">
      <div class="obra-title">${obra.nombre}</div>
      <p><strong>Artista:</strong> ${obra.artista}</p>
      <p><strong>Monto a pagar:</strong> S/ ${parseFloat(monto).toFixed(2)}</p>
      <p><strong>Tiempo restante:</strong> <span style="color: red;">${horasRestantes} horas</span></p>
    </div>
    
    <div class="highlight" style="border-left-color: #f59e0b;">
      <strong>⚠️ Atención:</strong>
      <p>Por favor, completa tu pago antes de que expire el plazo para asegurar tu compra.</p>
    </div>
    
    <p style="text-align: center;">
      <a href="${config.frontend?.url || 'http://localhost:3000'}/mis-compras" class="button">
        Completar pago
      </a>
    </p>
  `, eventoNombre);

  const text = `
Hola ${nombre},

Te recordamos que tienes un pago pendiente:

Obra: ${obra.nombre}
Artista: ${obra.artista}
Monto: S/ ${parseFloat(monto).toFixed(2)}
Tiempo restante: ${horasRestantes} horas

Por favor, completa tu pago antes de que expire el plazo.
  `;

  return await sendEmail({ to: email, subject, text, html: htmlContent });
};

module.exports = {
  sendEmail,
  sendWinnerNotification,
  sendPaymentMethodSelected,
  sendPaymentConfirmed,
  sendReadyForPickup,
  sendPaymentReminder
};
