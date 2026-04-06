import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
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
          left: "-10%",
          width: "50vw",
          height: "50vw",
          borderRadius: "50%",
          background:
            "radial-gradient(circle,rgba(99,102,241,0.1) 0%,transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-10%",
          right: "-10%",
          width: "40vw",
          height: "40vw",
          borderRadius: "50%",
          background:
            "radial-gradient(circle,rgba(0,180,216,0.07) 0%,transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Left panel — desktop only */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "48px clamp(32px,5vw,72px)",
          position: "relative",
          zIndex: 1,
        }}
        className="login-left"
      >
        <div
          onClick={() => navigate("/")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 48,
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "linear-gradient(135deg,#6366f1,#00b4d8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 20px rgba(99,102,241,0.4)",
            }}
          >
            <span
              style={{
                fontSize: "0.75rem",
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
              fontSize: "1.1rem",
              color: "#f0f6fa",
            }}
          >
            StockSim
          </span>
        </div>

        <div style={{ maxWidth: 420 }}>
          <div
            style={{
              fontSize: "0.6rem",
              color: "#6366f1",
              letterSpacing: "0.18em",
              marginBottom: 12,
            }}
          >
            PAPER TRADING TERMINAL
          </div>
          <h1
            style={{
              fontFamily: "'Clash Display',sans-serif",
              fontWeight: 800,
              fontSize: "clamp(1.8rem,3vw,2.6rem)",
              color: "#f0f6fa",
              margin: "0 0 16px",
              lineHeight: 1.1,
            }}
          >
            Welcome
            <br />
            <span
              style={{
                background: "linear-gradient(135deg,#6366f1,#00b4d8,#00d68f)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              back, trader.
            </span>
          </h1>
          <p
            style={{
              fontSize: "0.78rem",
              color: "#4a6370",
              lineHeight: 1.8,
              margin: 0,
            }}
          >
            Your portfolio is waiting. Real NSE data, real experience, zero
            risk.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 32, marginTop: 48 }}>
          {[
            ["₹1L", "Free capital"],
            ["10s", "Price updates"],
            ["100%", "Risk free"],
          ].map(([v, l]) => (
            <div key={l}>
              <div
                style={{
                  fontFamily: "'Clash Display',sans-serif",
                  fontSize: "1.2rem",
                  fontWeight: 800,
                  color: "#f0f6fa",
                }}
              >
                {v}
              </div>
              <div
                style={{
                  fontSize: "0.6rem",
                  color: "#4a6370",
                  marginTop: 2,
                  letterSpacing: "0.1em",
                }}
              >
                {l}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          width: 1,
          background: "rgba(255,255,255,0.05)",
          flexShrink: 0,
        }}
        className="login-divider"
      />

      {/* Right panel — form */}
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
          <div style={{ marginBottom: 32 }}>
            {/* Mobile logo */}
            <div
              onClick={() => navigate("/")}
              style={{
                display: "none",
                alignItems: "center",
                gap: 8,
                marginBottom: 24,
                cursor: "pointer",
              }}
              className="mobile-logo"
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
              Sign in
            </h2>
            <p style={{ fontSize: "0.72rem", color: "#4a6370", margin: 0 }}>
              Don't have an account?{" "}
              <Link
                to="/register"
                style={{
                  color: "#6366f1",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                Create one free
              </Link>
            </p>
          </div>

          {/* Form */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
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
                placeholder: "••••••••",
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
                    (e.target.style.borderColor = "rgba(99,102,241,0.5)")
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
                  ? "rgba(99,102,241,0.4)"
                  : "linear-gradient(135deg,#6366f1,#8b5cf6)",
                border: "none",
                borderRadius: 10,
                color: "#fff",
                fontSize: "0.8rem",
                letterSpacing: "0.08em",
                cursor: loading ? "wait" : "pointer",
                fontFamily: "'JetBrains Mono',monospace",
                fontWeight: 700,
                boxShadow: "0 0 24px rgba(99,102,241,0.3)",
                transition: "all 0.2s",
              }}
            >
              {loading ? "SIGNING IN..." : "SIGN IN →"}
            </button>

            <div
              style={{
                textAlign: "center",
                fontSize: "0.65rem",
                color: "#2a3a44",
                marginTop: 4,
              }}
            >
              By signing in you agree to our Terms of Service
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .login-left    { display: none !important; }
          .login-divider { display: none !important; }
          .mobile-logo   { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
