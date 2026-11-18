import "server-only";
import nodemailer from "nodemailer";

export function mailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
  );
}

export interface MailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

/** Sends one email through the configured SMTP account. Returns false on any failure. */
export async function sendMail(input: MailInput): Promise<boolean> {
  if (!mailConfigured()) return false;
  try {
    const port = Number(process.env.SMTP_PORT || 465);
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      connectionTimeout: 10000,
      socketTimeout: 15000,
    });
    const from =
      process.env.MAIL_FROM || `Somkid+ <${process.env.SMTP_USER}>`;
    await transport.sendMail({ from, ...input });
    return true;
  } catch (err) {
    console.error("sendMail failed:", err instanceof Error ? err.message : err);
    return false;
  }
}
