import nodemailer from "nodemailer";
import { EmailDispatchPayload } from "./notification.service.js";

export function createSmtpSender() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";
  const from = process.env.EMAIL_FROM || (user ? `"meawakemecode" <${user}>` : "noreply@meawakemecode.com");

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });

  return async (payload: EmailDispatchPayload) => {
    try {
      const info = await transporter.sendMail({
        from,
        to: payload.to,
        subject: payload.subject,
        text: payload.text || payload.body,
        html: payload.html,
      });
      return { success: true, messageId: info.messageId };
    } catch (err: any) {
      console.error("Failed to dispatch email via Gmail SMTP:", err);
      return { success: false, error: err?.message || String(err) };
    }
  };
}

