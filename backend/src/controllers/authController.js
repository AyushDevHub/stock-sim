import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendEmail } from "../services/emailService.js";

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

const makeOTP = () => String(Math.floor(100000 + Math.random() * 900000)); // 6 digits

// ── OTP email HTML ────────────────────────────────────────────────────────────
function otpHtml(username, otp) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#0b0f18;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
  <tr><td align="center">
    <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%">

      <!-- Header -->
      <tr><td style="background:#131924;border-radius:16px 16px 0 0;padding:28px 32px 24px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.07)">
        <span style="width:36px;height:36px;background:#6366f1;border-radius:9px;display:inline-block;text-align:center;line-height:36px;font-weight:900;font-size:16px;color:#fff">S</span>
        <div style="font-size:18px;font-weight:800;color:#e8edf5;margin-top:10px">StockSim</div>
        <div style="font-size:12px;color:#5a7080;letter-spacing:0.1em;text-transform:uppercase;margin-top:4px">Email Verification</div>
      </td></tr>

      <!-- Body -->
      <tr><td style="background:#131924;padding:32px">
        <div style="font-size:16px;font-weight:600;color:#e8edf5;margin-bottom:8px">Hey ${username} 👋</div>
        <div style="font-size:14px;color:#b0bec8;line-height:1.6;margin-bottom:28px">
          Use the code below to verify your email and activate your StockSim account.
          The code expires in <strong style="color:#e8edf5">15 minutes</strong>.
        </div>

        <!-- OTP box -->
        <div style="background:#1a2332;border:2px solid #6366f1;border-radius:14px;padding:24px;text-align:center;margin-bottom:28px">
          <div style="font-size:11px;font-weight:600;color:#6366f1;letter-spacing:0.14em;text-transform:uppercase;margin-bottom:12px">Your Verification Code</div>
          <div style="font-size:40px;font-weight:900;color:#e8edf5;letter-spacing:0.18em;font-family:monospace">${otp}</div>
        </div>

        <div style="font-size:13px;color:#5a7080;line-height:1.6">
          If you didn't create a StockSim account, you can safely ignore this email.
          <br/>This code can only be used once.
        </div>
      </td></tr>

      <!-- Footer -->
      <tr><td style="background:#0f1923;border-radius:0 0 16px 16px;padding:18px 32px;text-align:center;border-top:1px solid rgba(255,255,255,0.05)">
        <div style="font-size:12px;color:#5a7080">StockSim — Virtual Paper Trading · No real money involved</div>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// ── REGISTER ──────────────────────────────────────────────────────────────────

export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    if (await User.findOne({ email }))
      return res.status(409).json({ message: "Email already registered" });

    const otp = makeOTP();
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    const user = await User.create({
      username,
      email,
      password: await bcrypt.hash(password, 10),
      emailVerified: false,
      emailOTP: otp,
      emailOTPExpiry: expiry,
    });

    // Send verification email
    await sendEmail({
      to: email,
      subject: `${otp} is your StockSim verification code`,
      html: otpHtml(username, otp),
      text: `Your StockSim verification code is: ${otp}\n\nExpires in 15 minutes.`,
    });

    res.status(201).json({
      message: "Account created — check your email for the verification code",
      requiresVerification: true,
      email, // return so frontend can show "code sent to ****@gmail.com"
    });
  } catch (error) {
    console.error("Register error:", error);
    res
      .status(500)
      .json({ message: "Registration failed", error: error.message });
  }
};

// ── VERIFY OTP ────────────────────────────────────────────────────────────────

export const verifyEmailOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ message: "Email and OTP are required" });

    const user = await User.findOne({ email }).select(
      "+emailOTP +emailOTPExpiry"
    );

    if (!user) return res.status(404).json({ message: "Account not found" });

    if (user.emailVerified)
      return res
        .status(400)
        .json({ message: "Email already verified — please log in" });

    if (!user.emailOTP || !user.emailOTPExpiry)
      return res
        .status(400)
        .json({ message: "No verification code found — request a new one" });

    if (new Date() > user.emailOTPExpiry)
      return res
        .status(400)
        .json({ message: "Code expired — request a new one" });

    if (user.emailOTP !== String(otp).trim())
      return res.status(400).json({ message: "Incorrect code — try again" });

    // Mark verified, clear OTP
    user.emailVerified = true;
    user.emailOTP = undefined;
    user.emailOTPExpiry = undefined;
    await user.save();

    // Auto-login after verification
    res.json({
      message: "Email verified successfully!",
      token: signToken(user._id),
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        balance: user.balance,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Verification failed", error: error.message });
  }
};

// ── RESEND OTP ────────────────────────────────────────────────────────────────

export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email }).select(
      "+emailOTP +emailOTPExpiry"
    );
    if (!user) return res.status(404).json({ message: "Account not found" });

    if (user.emailVerified)
      return res.status(400).json({ message: "Email already verified" });

    const otp = makeOTP();
    user.emailOTP = otp;
    user.emailOTPExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    await sendEmail({
      to: email,
      subject: `${otp} is your new StockSim verification code`,
      html: otpHtml(user.username, otp),
      text: `Your new StockSim verification code is: ${otp}\n\nExpires in 15 minutes.`,
    });

    res.json({ message: "New code sent — check your inbox" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to resend code", error: error.message });
  }
};

// ── LOGIN ─────────────────────────────────────────────────────────────────────

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Email and password are required" });

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: "Invalid credentials" });

    // Block unverified users from logging in
    if (!user.emailVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in",
        requiresVerification: true,
        email: user.email,
      });
    }

    res.json({
      message: "Login successful",
      token: signToken(user._id),
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        balance: user.balance,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};
