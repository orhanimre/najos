module.exports = async (req, res) => {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body;
    
    // Build companions list
    let companionsHTML = '';
    if (data.totalHuespedes > 0) {
      companionsHTML = '<h3>Acompañantes:</h3><ul>';
      for (let i = 0; i < data.totalHuespedes; i++) {
        if (data[`acomp${i}Nombre`]) {
          companionsHTML += `
            <li>
              <strong>Acompañante ${i + 1}:</strong><br>
              Nombre: ${data[`acomp${i}Nombre`]} ${data[`acomp${i}Apellido`]}<br>
              Tipo ID: ${data[`acomp${i}TipoId`]}<br>
              Número ID: ${data[`acomp${i}NumId`]}
            </li>
          `;
        }
      }
      companionsHTML += '</ul>';
    } else {
      companionsHTML = '<p><em>Sin acompañantes</em></p>';
    }

    // Send email using Resend (using native fetch - no import needed)
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Cabañas MariaMar <onboarding@resend.dev>',
        to: ['orhanimre@gmail.com'],
        subject: `🏡 Nueva Reserva - Cabaña MariaMar-1 - ${data.nombre} ${data.apellido}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .info-box { background: white; padding: 20px; margin: 15px 0; border-left: 4px solid #667eea; border-radius: 5px; }
              .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
              .info-row:last-child { border-bottom: none; }
              .label { font-weight: bold; color: #4a5568; }
              .value { color: #2d3748; }
              h2 { color: #667eea; margin-top: 25px; }
              ul { list-style: none; padding: 0; }
              li { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 3px solid #48bb78; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🏡 Nueva Reserva Registrada</h1>
                <p style="margin: 0; opacity: 0.9;">Cabaña MariaMar-1</p>
              </div>
              <div class="content">
                <div class="info-box">
                  <h2>👤 Información del Huésped Principal</h2>
                  <div class="info-row">
                    <span class="label">Nombre Completo:</span>
                    <span class="value">${data.nombre} ${data.apellido}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Celular:</span>
                    <span class="value">${data.celular}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Tipo ID:</span>
                    <span class="value">${data.tipoId}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Número ID:</span>
                    <span class="value">${data.numeroId}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Ciudad:</span>
                    <span class="value">${data.ciudad}</span>
                  </div>
                </div>

                <div class="info-box">
                  <h2>📅 Detalles de la Estadía</h2>
                  <div class="info-row">
                    <span class="label">Check-in:</span>
                    <span class="value">${data.fechaEntrada} a las ${data.horaEntrada}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Check-out:</span>
                    <span class="value">${data.fechaSalida} a las ${data.horaSalida}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Total Acompañantes:</span>
                    <span class="value">${data.totalHuespedes}</span>
                  </div>
                </div>

                <div class="info-box">
                  ${companionsHTML}
                </div>

                <div style="margin-top: 30px; padding: 20px; background: #ebf8ff; border-radius: 10px; text-align: center;">
                  <p style="margin: 0; color: #2d3748; font-size: 14px;">
                    📧 Este registro fue enviado desde el formulario web de Cabañas MariaMar
                  </p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Error sending email');
    }

    return res.status(200).json({ success: true, emailId: result.id });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
};