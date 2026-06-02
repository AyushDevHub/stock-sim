import dotenv from "dotenv";
dotenv.config();

/**
 * Sends email via Brevo HTTP API (no SMTP — works on all hosting platforms).
 * Falls back gracefully if API key is missing.
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    console.warn("[Email] BREVO_API_KEY not set — skipping email to", to);
    return null;
  }

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: {
        name: "StockSim",
        email: process.env.EMAIL_FROM_ADDRESS || "noreply@stocksim.app",
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text || subject,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Brevo API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  console.log(
    "[Email] Sent via Brevo API to",
    to,
    "— messageId:",
    data.messageId
  );
  return data;
};

/**
 * Called on startup — just checks the API key is present.
 */
export const verifyEmailConnection = async () => {
  if (!process.env.BREVO_API_KEY) {
    console.warn("[Email] BREVO_API_KEY not set — email disabled");
    return false;
  }
  console.log("[Email] Brevo HTTP API ready ✓");
  return true;
};
