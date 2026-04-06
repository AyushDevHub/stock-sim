import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api.js";

export default function Register() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
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
    <div
      style={{
        minHeight: "100vh",
        background: "#060810",
        display: "flex",
        fontFamily: "'JetBrains Mono',monospace",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Glow */}
      <div
        style={{
          position: "absolute",
          top: "-10%",
          right: "-10%",
          width: "50vw",
          height: "50vw",
          borderRadius: "50%",
          background:
            "radial-gradient(circle,rgba(0,214,143,0.08) 0%,transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-10%",
          left: "-10%",
          width: "40vw",
          height: "40vw",
          borderRadius: "50%",
          background:
            "radial-gradient(circle,rgba(99,102,241,0.1) 0%,transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Form side */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "clamp(32px,5vw,48px) clamp(20px,4vw,48px)",
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
        }}
      >
        <div style={{ width: "100%", maxWidth: 400 }}>
          <div
            onClick={() => navigate("/")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 32,
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "linear-gradient(135deg,#6366f1,#00b4d8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 16px rgba(99,102,241,0.4)",
              }}
            >
              <span
                style={{
                  fontSize: "0.65rem",
                  fontWeight: 900,
                  color: "#fff",
                  fontFamily: "'Clash Display',sans-serif",
                }}
              >
                S
              </span>
            </div>
            <span
              style={{
                fontFamily: "'Clash Display',sans-serif",
                fontWeight: 800,
                fontSize: "1rem",
                color: "#f0f6fa",
              }}
            >
              StockSim
            </span>
          </div>

          <h2
            style={{
              fontFamily: "'Clash Display',sans-serif",
              fontWeight: 800,
              fontSize: "clamp(1.4rem,3vw,1.8rem)",
              color: "#f0f6fa",
              margin: "0 0 6px",
            }}
          >
            Create account
          </h2>
          <p
            style={{
              fontSize: "0.72rem",
              color: "#4a6370",
              margin: "0 0 28px",
            }}
          >
            Already have one?{" "}
            <Link
              to="/login"
              style={{
                color: "#6366f1",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Sign in
            </Link>
          </p>

          {/* Perks */}
          <div
            style={{
              background: "rgba(0,214,143,0.05)",
              border: "1px solid rgba(0,214,143,0.15)",
              borderRadius: 10,
              padding: "12px 16px",
              marginBottom: 24,
            }}
          >
            {[
              "₹1,00,000 virtual capital to start",
              "Real-time NSE stock prices",
              "Full candlestick charts",
              "Zero risk, 100% free",
            ].map((item) => (
              <div
                key={item}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 6,
                  fontSize: "0.7rem",
                  color: "#c8d8de",
                }}
              >
                <span style={{ color: "#00d68f", fontSize: "0.75rem" }}>✓</span>{" "}
                {item}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              {
                key: "username",
                label: "Username",
                type: "text",
                placeholder: "howdy123",
              },
              {
                key: "email",
                label: "Email",
                type: "email",
                placeholder: "you@example.com",
              },
              {
                key: "password",
                label: "Password",
                type: "password",
                placeholder: "min 8 characters",
              },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label
                  style={{
                    fontSize: "0.62rem",
                    color: "#4a6370",
                    letterSpacing: "0.1em",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  {label.toUpperCase()}
                </label>
                <input
                  type={type}
                  value={form[key]}
                  placeholder={placeholder}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && submit(e)}
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 10,
                    padding: "12px 14px",
                    color: "#f0f6fa",
                    outline: "none",
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: "0.85rem",
                    transition: "border-color 0.2s",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) =>
                    (e.target.style.borderColor = "rgba(0,214,143,0.4)")
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor = "rgba(255,255,255,0.08)")
                  }
                />
              </div>
            ))}

            {error && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "rgba(255,71,87,0.1)",
                  border: "1px solid rgba(255,71,87,0.2)",
                  borderRadius: 8,
                  fontSize: "0.72rem",
                  color: "#ff4757",
                }}
              >
                {error}
              </div>
            )}

            <button
              onClick={submit}
              disabled={loading}
              style={{
                padding: "13px",
                marginTop: 4,
                background: loading
                  ? "rgba(0,214,143,0.3)"
                  : "linear-gradient(135deg,#00d68f,#00b4d8)",
                border: "none",
                borderRadius: 10,
                color: loading ? "#4a6370" : "#060810",
                fontSize: "0.8rem",
                letterSpacing: "0.08em",
                cursor: loading ? "wait" : "pointer",
                fontFamily: "'JetBrains Mono',monospace",
                fontWeight: 800,
                boxShadow: "0 0 24px rgba(0,214,143,0.25)",
                transition: "all 0.2s",
              }}
            >
              {loading ? "CREATING ACCOUNT..." : "CREATE FREE ACCOUNT →"}
            </button>

            <div
              style={{
                textAlign: "center",
                fontSize: "0.62rem",
                color: "#2a3a44",
              }}
            >
              By creating an account you agree to our Terms of Service
            </div>
          </div>
        </div>
      </div>

      {/* Right side — visual */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px clamp(32px,5vw,72px)",
          position: "relative",
          zIndex: 1,
          borderLeft: "1px solid rgba(255,255,255,0.05)",
        }}
        className="register-right"
      >
        <div style={{ maxWidth: 380, width: "100%" }}>
          <div
            style={{
              fontSize: "0.6rem",
              color: "#00d68f",
              letterSpacing: "0.18em",
              marginBottom: 14,
            }}
          >
            WHAT YOU GET
          </div>
          <h2
            style={{
              fontFamily: "'Clash Display',sans-serif",
              fontWeight: 800,
              fontSize: "clamp(1.5rem,3vw,2.2rem)",
              color: "#f0f6fa",
              margin: "0 0 40px",
              lineHeight: 1.15,
            }}
          >
            Trade like a pro.
            <br />
            <span
              style={{
                background: "linear-gradient(135deg,#00d68f,#00b4d8)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Risk nothing.
            </span>
          </h2>

          {[
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
          ].map(({ icon, title, desc }) => (
            <div
              key={title}
              style={{ display: "flex", gap: 14, marginBottom: 20 }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "rgba(0,214,143,0.08)",
                  border: "1px solid rgba(0,214,143,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1rem",
                  flexShrink: 0,
                }}
              >
                {icon}
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "'Clash Display',sans-serif",
                    fontWeight: 700,
                    fontSize: "0.88rem",
                    color: "#f0f6fa",
                    marginBottom: 3,
                  }}
                >
                  {title}
                </div>
                <div
                  style={{
                    fontSize: "0.68rem",
                    color: "#4a6370",
                    lineHeight: 1.6,
                  }}
                >
                  {desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .register-right { display: none !important; }
        }
      `}</style>
    </div>
  );
}
