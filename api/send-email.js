
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body;
    
    // Get API key from environment variable
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return res.status(500).json({ error: 'Email service not configured' });
    }
    
    const formatDate = (dateStr) => {
      if (!dateStr) return 'N/A';
      const [year, month, day] = dateStr.split('-');
      return `${day}.${month}.${year}`;
    };

    let companionsHTML = '';
    if (data.totalHuespedes > 0) {
      companionsHTML = '<div style="margin-top: 20px;"><h3 style="color: #667eea; margin-bottom: 12px; font-size: 16px;">👥 Acompañantes:</h3>';
      for (let i = 0; i < data.totalHuespedes; i++) {
        const nombre = data[`acomp${i}Nombre`];
        const apellido = data[`acomp${i}Apellido`];
        const tipoId = data[`acomp${i}TipoId`];
        const numId = data[`acomp${i}NumId`];
        
        if (nombre || apellido) {
          companionsHTML += `
            <div style="background: #f7fafc; padding: 10px 12px; border-radius: 8px; margin-bottom: 8px; font-size: 14px;">
              <strong>Acompañante ${i + 1}:</strong> ${nombre} ${apellido}<br>
              <small style="color: #718096;">ID: ${tipoId?.toUpperCase()} - ${numId}</small>
            </div>
          `;
        }
      }
      companionsHTML += '</div>';
    }

    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 700;">🏡 Nuevo Registro</h1>
            <div style="margin-top: 12px; font-size: 18px; font-weight: 600;">${data.cabana}</div>
          </div>
          
          <!-- Admin Button -->
          <div style="padding: 20px; text-align: center; background: #f7fafc;">
            <a href="https://mariamar.vercel.app/admin.html" 
               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
              📋 Ver Panel Admin
            </a>
          </div>
          
          <!-- Content -->
          <div style="padding: 20px;">
            <!-- Guest Info -->
            <div style="background: #f7fafc; border-left: 4px solid #667eea; padding: 16px; margin-bottom: 20px; border-radius: 8px;">
              <h3 style="color: #667eea; margin-top: 0; margin-bottom: 12px; font-size: 16px;">👤 Huésped Principal</h3>
              <div style="margin-bottom: 8px; font-size: 14px;">
                <strong style="color: #667eea;">Nombre:</strong>
                <span style="color: #2d3748;">${data.nombre} ${data.apellido}</span>
              </div>
              <div style="margin-bottom: 8px; font-size: 14px;">
                <strong style="color: #667eea;">Celular:</strong>
                <span style="color: #2d3748;">${data.celular}</span>
              </div>
              <div style="margin-bottom: 8px; font-size: 14px;">
                <strong style="color: #667eea;">Documento:</strong>
                <span style="color: #2d3748;">${data.tipoId?.toUpperCase()} - ${data.numeroId}</span>
              </div>
              <div style="font-size: 14px;">
                <strong style="color: #667eea;">Ciudad:</strong>
                <span style="color: #2d3748;">${data.ciudad}</span>
              </div>
            </div>

            <!-- Stay Info -->
            <div style="background: #f7fafc; border-left: 4px solid #667eea; padding: 16px; margin-bottom: 20px; border-radius: 8px;">
              <h3 style="color: #667eea; margin-top: 0; margin-bottom: 12px; font-size: 16px;">🏖️ Estadía</h3>
              <div style="margin-bottom: 8px; font-size: 14px;">
                <strong style="color: #667eea;">Check-in:</strong>
                <span style="color: #2d3748;">${formatDate(data.fechaEntrada)} a las ${data.horaEntrada}</span>
              </div>
              <div style="margin-bottom: 8px; font-size: 14px;">
                <strong style="color: #667eea;">Check-out:</strong>
                <span style="color: #2d3748;">${formatDate(data.fechaSalida)} a las ${data.horaSalida}</span>
              </div>
              <div style="font-size: 14px;">
                <strong style="color: #667eea;">Total personas:</strong>
                <span style="color: #2d3748;">${(data.totalHuespedes || 0) + 1}</span>
              </div>
            </div>

            ${companionsHTML}
          </div>

          <!-- Footer -->
          <div style="background: #f7fafc; padding: 20px; text-align: center; color: #718096; font-size: 12px; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0 0 8px 0;">📧 Correo automático del sistema de registro</p>
            <p style="margin: 0;">Fecha: ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Cabañas MariaMar <onboarding@resend.dev>',
        to: ['orhanimre@gmail.com'],
        subject: `🏡 Nuevo Registro - ${data.cabana} - ${data.nombre} ${data.apellido}`,
        html: emailHTML
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Resend error:', result);
      return res.status(500).json({ 
        error: 'Failed to send email',
        details: result 
      });
    }

    return res.status(200).json({ 
      success: true,
      messageId: result.id 
    });

  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};