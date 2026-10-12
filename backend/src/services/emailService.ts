import nodemailer from 'nodemailer';
import { env } from '../config/env';

const transporter = env.smtp.host
  ? nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.password } : undefined,
    })
  : null;

/** Sends an email when SMTP is configured; otherwise logs it (never throws). */
export async function sendMail(to: string, subject: string, text: string) {
  if (!transporter) {
    console.log(`[email not configured] To: ${to} | ${subject}\n${text}`);
    return;
  }
  try {
    await transporter.sendMail({ from: env.smtp.from, to, subject, text });
  } catch (e) {
    console.error('Email sending failed:', (e as Error).message);
  }
}
