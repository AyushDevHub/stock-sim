import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import styles from "./Register.module.css";

const PERKS = [
  "₹1,00,000 virtual capital to start",
  "Real-time NSE stock prices",
  "Full candlestick charts",
  "Zero risk, 100% free",
];

const FEATURES = [
  {
    icon: "📈",
    title: "Real Candlestick Charts",
    desc: "7 intervals from 1m to monthly. Volume bars, full zoom.",
  },
  {
    icon: "⚡",
    title: "Live Prices Every 10s",
    desc: "Direct NSE data via Yahoo Finance. No delays.",
  },
  {
    icon: "💼",
    title: "Full Portfolio Tracker",
    desc: "Holdings, market value, complete order history.",
  },
  {
    icon: "🔒",
    title: "100% Free Forever",
    desc: "No credit card. No hidden charges. Ever.",
  },
];

// ── OTP input: 6 individual digit boxes ─────────────────────────────────────
function OTPInput({ value, onChange, disabled }) {
  const inputs = useRef([]);
  const digits = value.split("").concat(Array(6).fill("")).slice(0, 6);

  const handleKey = (i, e) => {
    if (e.key === "Backspace") {
      const next = [...digits];
      if (next[i]) {
        next[i] = "";
        onChange(next.join(""));
      } else if (i > 0) {
        inputs.current[i - 1]?.focus();
      }
      return;
    }
    if (!/^\d$/.test(e.key)) return;
    const next = [...digits];
    next[i] = e.key;
    onChange(next.join(""));
    if (i < 5) inputs.current[i + 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    onChange(pasted);
    const focusIdx = Math.min(pasted.length, 5);
    inputs.current[focusIdx]?.focus();
  };

  return (
    <div className={styles.otpRow}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (inputs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          disabled={disabled}
          className={`${styles.otpBox} ${d ? styles.otpBoxFilled : ""}`}
          onChange={() => {}}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
          autoFocus={i === 0}
        />
      ))}
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────
export default function Register() {
  const [step, setStep] = useState("form"); // "form" | "verify"
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  const { login } = useAuth();
  const navigate = useNavigate();
  const sentEmail = useRef("");

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const id = setInterval(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [resendCountdown]);

  // ── Step 1: register ──────────────────────────────────────────────────────
  const submitForm = async (e) => {
    e?.preventDefault();
    setError("");
    setMsg("");
    if (!form.username || !form.email || !form.password)
      return setError("All fields are required");
    if (form.password.length < 8)
      return setError("Password must be at least 8 characters");

    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", form);
      sentEmail.current = data.email || form.email;
      setStep("verify");
      setResendCountdown(60);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: verify OTP ────────────────────────────────────────────────────
  const submitOTP = async () => {
    if (otp.length < 6) return setError("Enter all 6 digits");
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/verify-otp", {
        email: sentEmail.current,
        otp,
      });
      login(data.user, data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Incorrect code — try again");
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ────────────────────────────────────────────────────────────
  const resend = async () => {
    if (resendCountdown > 0) return;
    setError("");
    setMsg("");
    try {
      await api.post("/auth/resend-otp", { email: sentEmail.current });
      setMsg("New code sent — check your inbox");
      setOtp("");
      setResendCountdown(60);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend");
    }
  };

  const maskedEmail = sentEmail.current
    ? sentEmail.current.replace(/(.{2}).+(@.+)/, "$1****$2")
    : "";

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      <div className={styles.glow1} />
      <div className={styles.glow2} />

      {/* ── FORM side ── */}
      <div className={styles.left}>
        <div className={styles.formBox}>
          <Link to="/" className={styles.logoRow}>
            <div className={styles.logoOrb}>S</div>
            <span className={styles.logoText}>StockSim</span>
          </Link>

          {/* ─────── STEP 1: registration form ─────── */}
          {step === "form" && (
            <>
              <h2 className={styles.formTitle}>Create account</h2>
              <p className={styles.formSub}>
                Already have one?{" "}
                <Link to="/login" className={styles.formLink}>
                  Sign in
                </Link>
              </p>

              <div className={styles.perksBox}>
                {PERKS.map((p) => (
                  <div key={p} className={styles.perkItem}>
                    <span className={styles.perkCheck}>✓</span>
                    {p}
                  </div>
                ))}
              </div>

              <div className={styles.fields}>
                {[
                  {
                    key: "username",
                    label: "Username",
                    type: "text",
                    ph: "howdy123",
                  },
                  {
                    key: "email",
                    label: "Email",
                    type: "email",
                    ph: "you@gmail.com",
                  },
                  {
                    key: "password",
                    label: "Password",
                    type: "password",
                    ph: "min 8 characters",
                  },
                ].map(({ key, label, type, ph }) => (
                  <div key={key}>
                    <label className={styles.fieldLabel}>
                      {label.toUpperCase()}
                    </label>
                    <input
                      type={type}
                      value={form[key]}
                      placeholder={ph}
                      className={styles.fieldInput}
                      onChange={(e) =>
                        setForm({ ...form, [key]: e.target.value })
                      }
                      onKeyDown={(e) => e.key === "Enter" && submitForm(e)}
                    />
                  </div>
                ))}

                {error && <div className={styles.error}>{error}</div>}

                <button
                  className={styles.btnSubmit}
                  disabled={loading}
                  onClick={submitForm}
                >
                  {loading ? "CREATING ACCOUNT…" : "CREATE FREE ACCOUNT →"}
                </button>

                <div className={styles.terms}>
                  A verification code will be sent to your email.
                </div>
              </div>
            </>
          )}

          {/* ─────── STEP 2: OTP verification ─────── */}
          {step === "verify" && (
            <>
              <div className={styles.verifyIcon}>📬</div>
              <h2 className={styles.formTitle}>Check your email</h2>
              <p className={styles.formSub}>
                We sent a 6-digit code to{" "}
                <strong className={styles.emailHighlight}>{maskedEmail}</strong>
                .
                <br />
                Enter it below to activate your account.
              </p>

              <div className={styles.fields}>
                <OTPInput value={otp} onChange={setOtp} disabled={loading} />

                {error && <div className={styles.error}>{error}</div>}
                {msg && <div className={styles.success}>{msg}</div>}

                <button
                  className={styles.btnSubmit}
                  disabled={loading || otp.length < 6}
                  onClick={submitOTP}
                >
                  {loading ? "VERIFYING…" : "VERIFY & START TRADING →"}
                </button>

                <div className={styles.resendRow}>
                  <span className={styles.resendLabel}>Didn't receive it?</span>
                  <button
                    className={styles.resendBtn}
                    onClick={resend}
                    disabled={resendCountdown > 0}
                  >
                    {resendCountdown > 0
                      ? `Resend in ${resendCountdown}s`
                      : "Resend code"}
                  </button>
                </div>

                <button
                  className={styles.backBtn}
                  onClick={() => {
                    setStep("form");
                    setError("");
                    setOtp("");
                  }}
                >
                  ← Use a different email
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Feature showcase side ── */}
      <div className={styles.right}>
        <div className={styles.rightInner}>
          <div className={styles.rightEyebrow}>WHAT YOU GET</div>
          <h2 className={styles.rightHeading}>
            Trade like a pro.
            <br />
            <span className={styles.rightGradient}>Risk nothing.</span>
          </h2>
          {FEATURES.map(({ icon, title, desc }) => (
            <div key={title} className={styles.featureItem}>
              <div className={styles.featureIcon}>{icon}</div>
              <div>
                <div className={styles.featureTitle}>{title}</div>
                <div className={styles.featureDesc}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
