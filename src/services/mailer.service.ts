import nodemailer from "nodemailer";
import { EmailDispatchPayload } from "./notification.service.js";

export function createSmtpSender() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";
  const from = process.env.EMAIL_FROM || (user ? `"meawakemecode" <${user}>` : "noreply@meawakemecode.com");

  // HTTPS-based gateways (bypass Render Free Tier SMTP port 25/465/587 blocks)
  const gmailWebAppUrl = process.env.GMAIL_WEBAPP_URL || "";
  const brevoApiKey = process.env.BREVO_API_KEY || "";
  const resendApiKey = process.env.RESEND_API_KEY || "";

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
    // Strict timeouts to prevent silent hanging on restricted cloud firewalls
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

  return async (payload: EmailDispatchPayload) => {
    // 1. Google Apps Script HTTPS Gateway (Sends directly from meawakemecode@gmail.com over HTTPS 443)
    if (gmailWebAppUrl) {
      try {
        console.log(`[Mailer] Dispatching via Google Apps Script HTTPS Gateway...`);
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
          return { success: true, messageId: data.messageId || "gas-" + Date.now() };
        }
        console.warn(`[Mailer] Google Apps Script Gateway error:`, data.error || res.statusText);
      } catch (err: any) {
        console.error(`[Mailer] Google Apps Script dispatch failed:`, err?.message || err);
      }
    }

    // 2. Brevo HTTPS API (port 443, 300 free emails/day)
    if (brevoApiKey) {
      try {
        console.log(`[Mailer] Dispatching via Brevo HTTPS API...`);
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
          console.log(`[Mailer] ✅ Sent via Brevo to ${payload.to}:`, data.messageId);
          return { success: true, messageId: data.messageId };
        }
        console.warn(`[Mailer] Brevo API error:`, data);
      } catch (err: any) {
        console.error(`[Mailer] Brevo dispatch failed:`, err?.message || err);
      }
    }

    // 3. Resend HTTPS API (port 443)
    if (resendApiKey) {
      try {
        console.log(`[Mailer] Dispatching via Resend HTTPS API...`);
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
          console.log(`[Mailer] ✅ Sent via Resend to ${payload.to}:`, data.id);
          return { success: true, messageId: data.id };
        }
        console.warn(`[Mailer] Resend API error:`, data);
      } catch (err: any) {
        console.error(`[Mailer] Resend dispatch failed:`, err?.message || err);
      }
    }

    // 4. Default SMTP Transport (Nodemailer)
    try {
      console.log(`[Mailer] Attempting standard SMTP transport (${host}:${port})...`);
      const info = await transporter.sendMail({
        from,
        to: payload.to,
        subject: payload.subject,
        text: payload.text || payload.body,
        html: payload.html,
      });
      console.log(`[Mailer] ✅ Sent via SMTP to ${payload.to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err: any) {
      console.error("[Mailer] ❌ SMTP dispatch failed:", err?.message || String(err));
      return {
        success: false,
        error: `SMTP Error (${err?.code || "TIMED_OUT"}): ${err?.message || String(err)}. Note: Render Free tier blocks outbound SMTP ports 25, 465, and 587. Set GMAIL_WEBAPP_URL or BREVO_API_KEY to send via HTTPS.`,
      };
    }
  };
}

