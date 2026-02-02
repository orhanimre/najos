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
      companionsHTML = '<h3 style="color: #667eea; margin-top: 20px; margin-bottom: 12px;">👥 Acompañantes:</h3>';
      for (let i = 0; i < data.totalHuespedes; i++) {
        const nombre = data[`acomp${i}Nombre`];
        const apellido = data[`acomp${i}Apellido`];
        const tipoId = data[`acomp${i}TipoId`];
        const numId = data[`acomp${i}NumId`];
        
        if (nombre || apellido) {
          companionsHTML += `
            <div style="background: #f7fafc; padding: 12px; border-radius: 8px; margin-bottom: 8px;">
              <strong>Acompañante ${i + 1}:</strong> ${nombre} ${apellido}<br>
              <small>ID: ${tipoId?.toUpperCase()} - ${numId}</small>
            </div>
          `;
        }
      }
    }

    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">🏡 Nuevo Registro - ${data.cabana}</h1>
          </div>
          
          <div style="padding: 30px;">
            <div style="background: #f7fafc; border-left: 4px solid #667eea; padding: 16px; margin-bottom: 20px; border-radius: 8px;">
              <h3 style="color: #667eea; margin-top: 0;">👤 Huésped Principal</h3>
              <div style="margin-bottom: 12px;">
                <span style="font-weight: bold; color: #667eea;">Nombre:</span>
                <span style="color: #2d3748;">${data.nombre} ${data.apellido}</span>
              </div>
              <div style="margin-bottom: 12px;">
                <span style="font-weight: bold; color: #667eea;">Celular:</span>
                <span style="color: #2d3748;">${data.celular}</span>
              </div>
              <div style="margin-bottom: 12px;">
                <span style="font-weight: bold; color: #667eea;">Documento:</span>
                <span style="color: #2d3748;">${data.tipoId?.toUpperCase()} - ${data.numeroId}</span>
              </div>
              <div style="margin-bottom: 12px;">
                <span style="font-weight: bold; color: #667eea;">Ciudad:</span>
                <span style="color: #2d3748;">${data.ciudad}</span>
              </div>
            </div>

            <div style="background: #f7fafc; border-left: 4px solid #667eea; padding: 16px; margin-bottom: 20px; border-radius: 8px;">
              <h3 style="color: #667eea; margin-top: 0;">🏖️ Estadía</h3>
              <div style="margin-bottom: 12px;">
                <span style="font-weight: bold; color: #667eea;">Check-in:</span>
                <span style="color: #2d3748;">${formatDate(data.fechaEntrada)} a las ${data.horaEntrada}</span>
              </div>
              <div style="margin-bottom: 12px;">
                <span style="font-weight: bold; color: #667eea;">Check-out:</span>
                <span style="color: #2d3748;">${formatDate(data.fechaSalida)} a las ${data.horaSalida}</span>
              </div>
              <div style="margin-bottom: 12px;">
                <span style="font-weight: bold; color: #667eea;">Total personas:</span>
                <span style="color: #2d3748;">${(data.totalHuespedes || 0) + 1}</span>
              </div>
            </div>

            ${companionsHTML}
          </div>

          <div style="background: #f7fafc; padding: 20px; text-align: center; color: #718096; font-size: 14px;">
            <p>📧 Este es un correo automático del sistema de registro de Cabañas MariaMar</p>
            <p>Fecha de registro: ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</p>
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