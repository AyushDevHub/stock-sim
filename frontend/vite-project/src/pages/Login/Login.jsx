import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import styles from "./Login.module.css";

function OTPInput({ value, onChange, disabled }) {
  const inputs = useRef([]);
  const digits = value.split("").concat(Array(6).fill("")).slice(0, 6);

  const handleKey = (i, e) => {
    if (e.key === "Backspace") {
      const next = [...digits];
      if (next[i]) {
        next[i] = "";
        onChange(next.join(""));
      } else if (i > 0) inputs.current[i - 1]?.focus();
      return;
    }
    if (!/^\d$/.test(e.key)) return;
    const next = [...digits];
    next[i] = e.key;
    onChange(next.join(""));
    if (i < 5) inputs.current[i + 1]?.focus();
  };

  const handlePaste = (e) => {
    const p = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(p);
    inputs.current[Math.min(p.length, 5)]?.focus();
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

export default function Login() {
  const [step, setStep] = useState("form");
  const [form, setForm] = useState({ email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const { login } = useAuth();
  const navigate = useNavigate();
  const pendingEmail = useRef("");

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  const submitLogin = async (e) => {
    e?.preventDefault();
    setError("");
    setMsg("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form);
      login(data.user, data.token);
      navigate("/dashboard");
    } catch (err) {
      const d = err.response?.data;
      if (err.response?.status === 403 && d?.requiresVerification) {
        pendingEmail.current = d.email || form.email;
        await api
          .post("/auth/resend-otp", { email: pendingEmail.current })
          .catch(() => {});
        setStep("verify");
        setCountdown(60);
        setMsg("Verification code sent to your email.");
      } else {
        setError(d?.message || "Invalid email or password");
      }
    } finally {
      setLoading(false);
    }
  };

  const submitOTP = async () => {
    if (otp.length < 6) return setError("Enter all 6 digits");
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/verify-otp", {
        email: pendingEmail.current,
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

  const resend = async () => {
    if (countdown > 0) return;
    setError("");
    setMsg("");
    try {
      await api.post("/auth/resend-otp", { email: pendingEmail.current });
      setMsg("New code sent — check your inbox");
      setOtp("");
      setCountdown(60);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend");
    }
  };

  const maskedEmail = pendingEmail.current
    ? pendingEmail.current.replace(/(.{2}).+(@.+)/, "$1****$2")
    : "";

  return (
    <div className={styles.page}>
      <div className={styles.glow1} />
      <div className={styles.glow2} />

      {/* ── Left panel ── */}
      <div className={styles.left}>
        <Link to="/" className={styles.logoRow}>
          <div className={styles.logoOrb}>S</div>
          <span className={styles.logoText}>StockSim</span>
        </Link>

        <div className={styles.leftContent}>
          <div className={styles.eyebrow}>PAPER TRADING TERMINAL</div>
          <h1 className={styles.heading}>
            Welcome back,
            <br />
            <span className={styles.headingGradient}>trader.</span>
          </h1>
          <p className={styles.subtext}>
            Your portfolio is waiting. Real NSE data, real experience, zero
            risk.
          </p>
        </div>

        <div className={styles.statsRow}>
          {[
            ["₹1L", "Free capital"],
            ["10s", "Price updates"],
            ["100%", "Risk free"],
          ].map(([v, l]) => (
            <div key={l} className={styles.statItem}>
              <div className={styles.statVal}>{v}</div>
              <div className={styles.statLabel}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.divider} />

      {/* ── Right panel ── */}
      <div className={styles.right}>
        <div className={styles.formBox}>
          {/* Mobile logo */}
          <Link to="/" className={styles.mobileLogoRow}>
            <div className={styles.logoOrb}>S</div>
            <span className={styles.logoText}>StockSim</span>
          </Link>

          {/* ─── LOGIN FORM ─── */}
          {step === "form" && (
            <>
              <h2 className={styles.formTitle}>Sign in</h2>
              <p className={styles.formSub}>
                Don't have an account?{" "}
                <Link to="/register" className={styles.formLink}>
                  Create one free
                </Link>
              </p>

              <div className={styles.fields}>
                <div>
                  <label className={styles.fieldLabel}>EMAIL</label>
                  <input
                    type="email"
                    value={form.email}
                    placeholder="you@gmail.com"
                    className={styles.fieldInput}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    onKeyDown={(e) => e.key === "Enter" && submitLogin(e)}
                  />
                </div>
                <div>
                  <label className={styles.fieldLabel}>PASSWORD</label>
                  <input
                    type="password"
                    value={form.password}
                    placeholder="••••••••"
                    className={styles.fieldInput}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    onKeyDown={(e) => e.key === "Enter" && submitLogin(e)}
                  />
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <button
                  className={styles.btnSubmit}
                  disabled={loading}
                  onClick={submitLogin}
                >
                  {loading ? "Signing in…" : "Sign In →"}
                </button>

                <div className={styles.terms}>
                  By signing in you agree to our Terms of Service
                </div>
              </div>
            </>
          )}

          {/* ─── OTP STEP ─── */}
          {step === "verify" && (
            <>
              <div className={styles.verifyIcon}>📬</div>
              <h2 className={styles.formTitle}>Verify your email</h2>
              <p className={styles.formSub}>
                We sent a 6-digit code to{" "}
                <strong className={styles.emailHighlight}>{maskedEmail}</strong>
                .
                <br />
                Enter it below to sign in.
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
                  {loading ? "Verifying…" : "Verify & Sign In →"}
                </button>

                <div className={styles.resendRow}>
                  <span className={styles.resendLabel}>Didn't receive it?</span>
                  <button
                    className={styles.resendBtn}
                    onClick={resend}
                    disabled={countdown > 0}
                  >
                    {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
                  </button>
                </div>

                <button
                  className={styles.backBtn}
                  onClick={() => {
                    setStep("form");
                    setError("");
                    setOtp("");
                    setMsg("");
                  }}
                >
                  ← Back to sign in
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
