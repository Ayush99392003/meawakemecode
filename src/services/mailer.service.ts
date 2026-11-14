import nodemailer from "nodemailer";
import { EmailDispatchPayload } from "./notification.service.js";

export function createSmtpSender() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT) || (process.env.SMTP_SECURE === "true" ? 465 : 587);
  const isSecure = port === 465;
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";
  const from = process.env.EMAIL_FROM || (user ? `"meawakemecode" <${user}>` : "noreply@meawakemecode.com");

  // Optional HTTPS gateways as fallback
  const gmailWebAppUrl = process.env.GMAIL_WEBAPP_URL || "";
  const brevoApiKey = process.env.BREVO_API_KEY || "";
  const resendApiKey = process.env.RESEND_API_KEY || "";

  // Configure SMTP transport with robust timeouts and TLS options
  const isGmail = host === "smtp.gmail.com" || (!process.env.SMTP_HOST && user.endsWith("@gmail.com"));
  const transportConfig: any = {
    host,
    port,
    secure: isSecure,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false, // Prevents certificate chain issues on cloud networks
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  };

  // If using Gmail on port 465 or default, nodemailer's built-in service config optimizes socket settings
  if (isGmail && isSecure) {
    transportConfig.service = "gmail";
  }

  const transporter = nodemailer.createTransport(transportConfig);

  return async (payload: EmailDispatchPayload) => {
    // 1. Primary: Standard SMTP Transport
    if (user && pass) {
      try {
        console.log(`[Mailer] 📤 Attempting SMTP dispatch to ${payload.to} via ${host}:${port} (secure: ${isSecure})...`);
        const info = await transporter.sendMail({
          from,
          to: payload.to,
          subject: payload.subject,
          text: payload.text || payload.body,
          html: payload.html,
        });
        console.log(`[Mailer] ✅ SMTP sent successfully to ${payload.to}! MessageId: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
      } catch (err: any) {
        console.error(`[Mailer] ⚠️ SMTP dispatch failed to ${payload.to}:`, err?.code || err?.message || err);
        // If no fallback is available, return the error directly
        if (!gmailWebAppUrl && !brevoApiKey && !resendApiKey) {
          return {
            success: false,
            error: `SMTP Error (${err?.code || "FAILED"}): ${err?.message || String(err)}`,
          };
        }
        console.log("[Mailer] Attempting configured HTTPS fallback...");
      }
    }

    // 2. Fallback: Google Apps Script Webhook (Port 443 HTTPS)
    if (gmailWebAppUrl) {
      try {
        console.log(`[Mailer] 🌐 Dispatching via Google Apps Script HTTPS Gateway...`);
        const res = await fetch(gmailWebAppUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          redirect: "follow",
          body: JSON.stringify({
            to: payload.to,
            subject: payload.subject,
            text: payload.text || payload.body,
            html: payload.html,
          }),
        });
        const data = await res.json().catch(() => ({ success: res.ok }));
        if (data.success || res.ok) {
          console.log(`[Mailer] ✅ Sent via Google Apps Script Gateway to ${payload.to}`);
          return { success: true, messageId: data.messageId || `gas-${Date.now()}` };
        }
      } catch (err: any) {
        console.error(`[Mailer] Google Apps Script fallback failed:`, err?.message);
      }
    }

    // 3. Fallback: Brevo HTTPS REST API (Port 443)
    if (brevoApiKey) {
      try {
        console.log(`[Mailer] 🌐 Dispatching via Brevo HTTPS API...`);
        const res = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "api-key": brevoApiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sender: { name: "meawakemecode", email: user || "meawakemecode@gmail.com" },
            to: [{ email: payload.to }],
            subject: payload.subject,
            htmlContent: payload.html,
            textContent: payload.text || payload.body,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          console.log(`[Mailer] ✅ Sent via Brevo to ${payload.to}: ${data.messageId}`);
          return { success: true, messageId: data.messageId };
        }
      } catch (err: any) {
        console.error(`[Mailer] Brevo fallback failed:`, err?.message);
      }
    }

    // 4. Fallback: Resend HTTPS REST API (Port 443)
    if (resendApiKey) {
      try {
        console.log(`[Mailer] 🌐 Dispatching via Resend HTTPS API...`);
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: from || "onboarding@resend.dev",
            to: payload.to,
            subject: payload.subject,
            html: payload.html,
            text: payload.text || payload.body,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          console.log(`[Mailer] ✅ Sent via Resend to ${payload.to}: ${data.id}`);
          return { success: true, messageId: data.id };
        }
      } catch (err: any) {
        console.error(`[Mailer] Resend fallback failed:`, err?.message);
      }
    }

    return {
      success: false,
      error: "No email sender succeeded. Verify SMTP credentials or configure an HTTPS fallback.",
    };
  };
}
