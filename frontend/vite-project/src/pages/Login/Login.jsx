import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import styles from "./Login.module.css";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault?.();
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/login", form);
      login(data.user, data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.glow1} />
      <div className={styles.glow2} />

      {/* Left panel */}
      <div className={styles.left}>
        <Link to="/" className={styles.logoRow}>
          <div className={styles.logoOrb}>S</div>
          <span className={styles.logoText}>StockSim</span>
        </Link>
        <div>
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
            <div key={l}>
              <div className={styles.statVal}>{v}</div>
              <div className={styles.statLabel}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.divider} />

      {/* Right panel — form */}
      <div className={styles.right}>
        <div className={styles.formBox}>
          {/* Mobile logo */}
          <Link to="/" className={styles.mobileLogoRow}>
            <div className={styles.logoOrb}>S</div>
            <span className={styles.logoText}>StockSim</span>
          </Link>

          <h2 className={styles.formTitle}>Sign in</h2>
          <p className={styles.formSub}>
            Don't have an account?{" "}
            <Link to="/register" className={styles.formLink}>
              Create one free
            </Link>
          </p>

          <div className={styles.fields}>
            {[
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
                ph: "••••••••",
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
              {loading ? "SIGNING IN..." : "SIGN IN →"}
            </button>
            <div className={styles.terms}>
              By signing in you agree to our Terms of Service
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
