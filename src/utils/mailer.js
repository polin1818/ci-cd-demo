import nodemailer from 'nodemailer';

console.log(`📧 [MAILER] EMAIL_USER : ${process.env.EMAIL_USER ? '✅ ' + process.env.EMAIL_USER : '❌ MANQUANT'}`);
console.log(`📧 [MAILER] EMAIL_PASS : ${process.env.EMAIL_PASS ? '✅ (défini)' : '❌ MANQUANT'}`);

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  family: 4,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendTaskEmail = async (to, type, taskTitle, message) => {
  try {
    const isStarting = type === "TASK_STARTING";
    const accentColor = isStarting ? "#10B981" : "#4F46E5";

    const mailOptions = {
      from: `"Task Manager" <${process.env.EMAIL_USER}>`,
      to,
      subject: `Notification : ${taskTitle}`,
      html: `
        <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F9FAFB; padding: 40px; color: #1F2937;">
          <div style="background-color: #FFFFFF; border-radius: 12px; padding: 32px; max-width: 560px; margin: auto; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #E5E7EB;">
            
            <div style="margin-bottom: 24px; text-align: left;">
              <span style="color: ${accentColor}; font-weight: 700; font-size: 18px; letter-spacing: -0.5px;">
                TaskControl <span style="color: #9CA3AF; font-weight: 400;">/ System</span>
              </span>
            </div>

            ${isStarting ? `
              <div style="display: inline-block; background-color: #ECFDF5; color: #065F46; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; margin-bottom: 16px;">
                ● Mission en cours
              </div>
            ` : ''}

            <h2 style="font-size: 24px; font-weight: 700; color: #111827; margin: 0 0 12px 0; line-height: 1.2;">
              ${taskTitle}
            </h2>

            <div style="font-size: 16px; line-height: 1.6; color: #4B5563; margin-bottom: 32px;">
              ${message}
              ${isStarting ? `<p style="color: #10B981; font-weight: 500; margin-top: 12px;">Le suivi de temps a été activé automatiquement.</p>` : ''}
            </div>

            <div style="background-color: #F3F4F6; border-radius: 8px; padding: 16px; font-size: 14px; color: #6B7280; border-left: 4px solid ${accentColor};">
              <strong>Info :</strong> Cette notification est générée suite à une mise à jour de votre planning.
            </div>

            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #F3F4F6; text-align: center;">
              <p style="font-size: 13px; color: #9CA3AF; margin: 0;">
                Envoyé à Laurence • Task Manager v2.0
              </p>
            </div>

          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ [MAILER] Email [${type}] envoyé à ${to} — MessageId: ${info.messageId}`);
    return true;

  } catch (error) {
    console.error(`❌ [MAILER] Échec envoi à ${to} :`, error.message);
    console.error(`❌ [MAILER] Détail complet :`, error);
    return false;
  }
};