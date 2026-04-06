import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api.js";
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

export default function Register() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault?.();
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/register", form);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.glow1} />
      <div className={styles.glow2} />

      {/* Form side */}
      <div className={styles.left}>
        <div className={styles.formBox}>
          <Link to="/" className={styles.logoRow}>
            <div className={styles.logoOrb}>S</div>
            <span className={styles.logoText}>StockSim</span>
          </Link>

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
                ph: "you@example.com",
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
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && submit(e)}
                />
              </div>
            ))}

            {error && <div className={styles.error}>{error}</div>}
            <button
              className={styles.btnSubmit}
              disabled={loading}
              onClick={submit}
            >
              {loading ? "CREATING ACCOUNT..." : "CREATE FREE ACCOUNT →"}
            </button>
            <div className={styles.terms}>
              By creating an account you agree to our Terms of Service
            </div>
          </div>
        </div>
      </div>

      {/* Feature showcase */}
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
