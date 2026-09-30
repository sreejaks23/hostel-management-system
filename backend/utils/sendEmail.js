import nodemailer from "nodemailer";

let transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

// Sends an email. Fails silently (logs only) so core flows never break
// if email credentials are not configured, which is common in dev.
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log(`[email:skipped-no-config] to=${to} subject=${subject}`);
      return { skipped: true };
    }
    const info = await getTransporter().sendMail({
      from: process.env.EMAIL_FROM || "Hostel Management <no-reply@hostel.com>",
      to,
      subject,
      html,
      text,
    });
    return info;
  } catch (error) {
    console.error("sendEmail error:", error.message);
    return { error: error.message };
  }
};

export default sendEmail;
