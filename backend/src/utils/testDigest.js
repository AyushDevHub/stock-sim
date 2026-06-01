/**
 * testDigest.js
 * Run this directly to send the evening digest email immediately.
 *
 * Usage (from backend/ folder):
 *   node src/utils/testDigest.js
 *
 * No server needed, no curl, no token.
 * It connects to MongoDB, builds the digest, sends the email, then exits.
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import { runEveningDigest } from "../services/eveningDigestService.js";
import { verifyEmailConnection } from "../services/emailService.js";

dotenv.config();

async function main() {
  if (!process.env.MONGO_URI) {
    console.error("❌  MONGO_URI not set in .env");
    process.exit(1);
  }
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("❌  EMAIL_USER / EMAIL_PASS not set in .env");
    console.error("    Add them and try again.");
    process.exit(1);
  }

  console.log("Connecting to MongoDB…");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected ✓");

  const ok = await verifyEmailConnection();
  if (!ok) {
    console.error("❌  SMTP connection failed — check EMAIL_USER / EMAIL_PASS");
    await mongoose.disconnect();
    process.exit(1);
  }

  await runEveningDigest();

  await mongoose.disconnect();
  console.log("Done. Check your inbox 📬");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
