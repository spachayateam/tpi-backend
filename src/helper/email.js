import nodemailer from "nodemailer";

export async function sendConfirmationEmail(to, turno) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER, // debe ser una variable .env
      pass: process.env.GMAIL_PASS, // contraseña de aplicación
    },
  });

  const mailOptions = {
    from: `"SPA sentirse bien" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Confirmación de turno - SPA Sentirse Bien",
    html: `
     <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
       <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center; display: flex; align-items: center; justify-content: center; gap: 15px;">
         <div>
           <h1 style="margin: 0;">SPA Sentirse Bien</h1>
           <p style="margin: 5px 0 0;">Confirmación de turno</p>
         </div>
       </div>
     </div>

        <div style="padding: 20px; color: #333;">
          <p>Hola <strong>${turno.name}</strong>,</p>
          <p>Gracias por reservar tu turno. Aquí tienes los detalles:</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tbody>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Profesional:</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${turno.professional}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Fecha:</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${turno.date}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Hora:</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${turno.time}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Duración:</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${turno.duration} minutos</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Método de pago:</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${turno.payment_method}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Código de confirmación:</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${turno.token}</td>
              </tr>
            </tbody>
          </table>
          <p style="margin-top: 20px;">Por favor, presenta este comprobante al llegar. ¡Gracias por confiar en SPA Sentirse Bien!</p>
          <p style="font-size: 12px; color: #999;">Este es un correo automático, por favor no responder.</p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}
