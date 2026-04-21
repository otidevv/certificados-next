import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  secure: false,
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
});

export async function sendPasswordChangedNotification(email) {
  await transporter.sendMail({
    from: `"UNAMAD - Certificados" <${process.env.MAIL_FROM_ADDRESS}>`,
    to: email,
    subject: 'Tu contraseña fue cambiada - UNAMAD Certificados',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #16a34a;">UNAMAD - Sistema de Certificados</h2>
        </div>
        <p>Hola,</p>
        <p>Te confirmamos que la contraseña de tu cuenta fue actualizada exitosamente.</p>
        <p style="color: #666; font-size: 14px;">Fecha: ${new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })}</p>
        <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 6px; padding: 14px; margin: 24px 0; color: #92400e; font-size: 14px;">
          <strong>¿No fuiste tú?</strong><br />
          Si no realizaste este cambio, restablece tu contraseña inmediatamente y contacta al administrador.
        </div>
        <p style="color: #666; font-size: 14px;">
          Por tu seguridad, todas las sesiones activas fueron cerradas y tendrás que volver a iniciar sesión.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #999; font-size: 12px; text-align: center;">Universidad Nacional Amazónica de Madre de Dios</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email, token) {
  const resetUrl = `${process.env.NEXTAUTH_URL}auth/reset-password?token=${token}`;

  await transporter.sendMail({
    from: `"UNAMAD - Certificados" <${process.env.MAIL_FROM_ADDRESS}>`,
    to: email,
    subject: 'Recuperar contraseña - UNAMAD Certificados',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #16a34a;">UNAMAD - Sistema de Certificados</h2>
        </div>
        <p>Hola,</p>
        <p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #16a34a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Restablecer contraseña
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">Este enlace expirará en <strong>1 hora</strong>.</p>
        <p style="color: #666; font-size: 14px;">Si no solicitaste este cambio, puedes ignorar este correo.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #999; font-size: 12px; text-align: center;">Universidad Nacional Amazónica de Madre de Dios</p>
      </div>
    `,
  });
}
