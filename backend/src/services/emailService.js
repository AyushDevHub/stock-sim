import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

/**
 * Nodemailer transporter.
 *
 * For Gmail:
 *   1. Enable 2-Step Verification on your Google account
 *   2. Go to Google Account → Security → App Passwords → create one for "Mail"
 *   3. Set EMAIL_USER=you@gmail.com and EMAIL_PASS=the_16_char_app_password in .env
 *
 * For any other SMTP (Brevo, SendGrid, etc.) set all four EMAIL_* vars.
 */
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === "true", // true for port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Verify SMTP connection on startup (logs, never crashes server).
 */
export const verifyEmailConnection = async () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn(
      "[Email] EMAIL_USER / EMAIL_PASS not set — evening digest disabled"
    );
    return false;
  }
  try {
    await transporter.verify();
    console.log("[Email] SMTP connection verified ✓");
    return true;
  } catch (err) {
    console.warn("[Email] SMTP verify failed:", err.message);
    return false;
  }
};

/**
 * Send a single email.
 * @param {string} to          Recipient address
 * @param {string} subject     Email subject
 * @param {string} html        HTML body
 * @param {string} [text]      Plain-text fallback (auto-generated if omitted)
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  const from = process.env.EMAIL_FROM || `StockSim <${process.env.EMAIL_USER}>`;
  const info = await transporter.sendMail({
    from,
    to,
    subject,
    html,
    text: text || subject,
  });
  return info;
};
