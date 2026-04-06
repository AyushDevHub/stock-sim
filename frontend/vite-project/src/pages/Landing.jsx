import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api.js";

const LOGO_COLORS = [
  "#6366f1",
  "#e53935",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#3b82f6",
  "#84cc16",
  "#ec4899",
  "#14b8a6",
  "#f43f5e",
  "#a855f7",
  "#eab308",
  "#22c55e",
];

function MiniSparkline({ up }) {
  const pts = up
    ? "0,18 8,13 16,15 24,8 32,11 40,4 48,7 56,1"
    : "0,1 8,5 16,3 24,9 32,7 40,13 48,11 56,18";
  return (
    <svg width="56" height="20" viewBox="0 0 56 20" fill="none">
      <polyline
        points={pts}
        stroke={up ? "#00d68f" : "#ff4757"}
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StockCard({ stock, color, active }) {
  const up = (stock.change ?? 0) >= 0;
  return (
    <div
      style={{
        width: 188,
        padding: "18px 18px 16px",
        borderRadius: 16,
        background: active
          ? `linear-gradient(145deg,${color}18,rgba(0,180,216,0.06))`
          : "rgba(255,255,255,0.03)",
        border: `1px solid ${active ? `${color}55` : "rgba(255,255,255,0.06)"}`,
        backdropFilter: "blur(16px)",
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
        boxShadow: active ? `0 0 40px ${color}18` : "none",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 18,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: `linear-gradient(135deg,${color},${color}88)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.72rem",
              fontWeight: 800,
              color: "#fff",
              fontFamily: "'Clash Display',sans-serif",
              flexShrink: 0,
            }}
          >
            {stock.symbol.slice(0, 2)}
          </div>
          <div style={{ overflow: "hidden" }}>
            <div
              style={{
                fontSize: "0.82rem",
                fontWeight: 700,
                color: "#f0f6fa",
                fontFamily: "'Clash Display',sans-serif",
                whiteSpace: "nowrap",
              }}
            >
              {stock.symbol}
            </div>
            <div
              style={{
                fontSize: "0.6rem",
                color: "#4a6370",
                marginTop: 1,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: 90,
              }}
            >
              {stock.name?.split(" ").slice(0, 2).join(" ")}
            </div>
          </div>
        </div>
        <MiniSparkline up={up} />
      </div>
      <div
        style={{
          fontSize: "1.05rem",
          fontWeight: 700,
          color: "#f0f6fa",
          fontFamily: "'JetBrains Mono',monospace",
          marginBottom: 4,
        }}
      >
        ₹
        {(stock.price ?? 0).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </div>
      <div
        style={{
          fontSize: "0.68rem",
          color: up ? "#00d68f" : "#ff4757",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <span>{up ? "▲" : "▼"}</span>
        <span>{Math.abs(stock.change ?? 0).toFixed(2)}</span>
        <span style={{ opacity: 0.5 }}>·</span>
        <span>
          {up ? "+" : ""}
          {(stock.percentChange ?? 0).toFixed(2)}%
        </span>
      </div>
    </div>
  );
}

function GlowOrb({ x, y, color, size }) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle,${color} 0%,transparent 70%)`,
        pointerEvents: "none",
      }}
    />
  );
}

export default function Landing() {
  const [query, setQuery] = useState("");
  const [stocks, setStocks] = useState([]);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // infinite scroll: duplicate stocks list 3× so it loops seamlessly
  const [offset, setOffset] = useState(0);
  const scrollRef = useRef(null);
  const animRef = useRef(null);
  const pauseRef = useRef(false);

  const navigate = useNavigate();

  // fetch prices
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/prices");
        setStocks(data.prices || []);
      } catch {
        setStocks([]);
      }
    };
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, []);

  // infinite auto-scroll using requestAnimationFrame — no page scroll involved
  useEffect(() => {
    if (!stocks.length || !scrollRef.current) return;

    const CARD_W = 188 + 14; // card width + gap
    const totalW = CARD_W * stocks.length; // width of one copy
    let pos = 0;
    let lastTime = null;
    const SPEED = 40; // px per second

    const tick = (ts) => {
      if (!pauseRef.current) {
        if (lastTime !== null) {
          const dt = (ts - lastTime) / 1000;
          pos += SPEED * dt;
          // reset when first copy fully scrolled
          if (pos >= totalW) pos -= totalW;
          if (scrollRef.current) {
            scrollRef.current.style.transform = `translateX(-${pos}px)`;
          }
        }
        lastTime = ts;
      } else {
        lastTime = null;
      }
      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [stocks]);

  // search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const id = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await api.get(
          `/stocks/search?q=${encodeURIComponent(query)}`
        );
        setResults(data.results?.slice(0, 6) || []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(id);
  }, [query]);

  // tripled list for seamless loop
  const loopStocks = [...stocks, ...stocks, ...stocks];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#060810",
        fontFamily: "'JetBrains Mono',monospace",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Glow orbs */}
      <GlowOrb x="5%" y="5%" color="rgba(99,102,241,0.12)" size="500px" />
      <GlowOrb x="55%" y="3%" color="rgba(0,214,143,0.07)" size="400px" />
      <GlowOrb x="70%" y="45%" color="rgba(255,184,0,0.05)" size="350px" />
      <GlowOrb x="-8%" y="50%" color="rgba(0,180,216,0.07)" size="300px" />

      {/* Grid texture */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          backgroundImage:
            "linear-gradient(rgba(99,102,241,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.025) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* ── NAVBAR ── */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(6,8,16,0.88)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "0 clamp(16px,4vw,48px)",
            height: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexShrink: 0,
              cursor: "pointer",
            }}
            onClick={() => navigate("/")}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "linear-gradient(135deg,#6366f1,#00b4d8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 16px rgba(99,102,241,0.4)",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: "0.7rem",
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
                letterSpacing: "0.04em",
                whiteSpace: "nowrap",
              }}
            >
              StockSim
            </span>
          </div>

          {/* Center nav — hidden on mobile */}
          <div
            style={{
              display: "flex",
              gap: 28,
              flex: 1,
              justifyContent: "center",
            }}
            className="nav-links"
          >
            {["Markets", "Features", "Pricing", "Blog"].map((item) => (
              <span
                key={item}
                style={{
                  fontSize: "0.74rem",
                  color: "#4a6370",
                  cursor: "pointer",
                  letterSpacing: "0.06em",
                  transition: "color 0.2s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => (e.target.style.color = "#f0f6fa")}
                onMouseLeave={(e) => (e.target.style.color = "#4a6370")}
              >
                {item}
              </span>
            ))}
          </div>

          {/* Right CTAs — hidden on mobile */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexShrink: 0,
            }}
            className="nav-ctas"
          >
            <button
              onClick={() => navigate("/login")}
              style={{
                padding: "7px 18px",
                fontSize: "0.72rem",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                color: "#c8d8de",
                cursor: "pointer",
                fontFamily: "'JetBrains Mono',monospace",
                whiteSpace: "nowrap",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = "rgba(255,255,255,0.28)";
                e.target.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = "rgba(255,255,255,0.1)";
                e.target.style.color = "#c8d8de";
              }}
            >
              Login
            </button>
            <button
              onClick={() => navigate("/register")}
              style={{
                padding: "7px 18px",
                fontSize: "0.72rem",
                background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                border: "none",
                borderRadius: 8,
                color: "#fff",
                cursor: "pointer",
                fontFamily: "'JetBrains Mono',monospace",
                fontWeight: 600,
                whiteSpace: "nowrap",
                boxShadow: "0 0 20px rgba(99,102,241,0.3)",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => (e.target.style.opacity = "0.85")}
              onMouseLeave={(e) => (e.target.style.opacity = "1")}
            >
              Start free →
            </button>
          </div>

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMenuOpen((m) => !m)}
            className="hamburger"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 6,
              display: "none",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 22,
                height: 2,
                background: "#c8d8de",
                marginBottom: 5,
                borderRadius: 2,
                transition: "all 0.2s",
              }}
            />
            <div
              style={{
                width: 22,
                height: 2,
                background: "#c8d8de",
                marginBottom: 5,
                borderRadius: 2,
              }}
            />
            <div
              style={{
                width: 16,
                height: 2,
                background: "#c8d8de",
                borderRadius: 2,
              }}
            />
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div
            style={{
              background: "rgba(6,8,16,0.98)",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {["Markets", "Features", "Pricing", "Blog"].map((item) => (
              <span
                key={item}
                style={{
                  fontSize: "0.85rem",
                  color: "#c8d8de",
                  cursor: "pointer",
                  letterSpacing: "0.06em",
                }}
              >
                {item}
              </span>
            ))}
            <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
            <button
              onClick={() => navigate("/login")}
              style={{
                padding: "11px",
                fontSize: "0.8rem",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                color: "#c8d8de",
                cursor: "pointer",
                fontFamily: "'JetBrains Mono',monospace",
              }}
            >
              Login
            </button>
            <button
              onClick={() => navigate("/register")}
              style={{
                padding: "11px",
                fontSize: "0.8rem",
                background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                border: "none",
                borderRadius: 8,
                color: "#fff",
                cursor: "pointer",
                fontFamily: "'JetBrains Mono',monospace",
                fontWeight: 600,
              }}
            >
              Start free trial →
            </button>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          padding:
            "clamp(56px,8vw,100px) clamp(16px,4vw,24px) clamp(48px,6vw,72px)",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: "0.62rem",
            letterSpacing: "0.15em",
            background: "rgba(99,102,241,0.1)",
            border: "1px solid rgba(99,102,241,0.25)",
            borderRadius: 20,
            padding: "5px 14px",
            marginBottom: 24,
            color: "#a5b4fc",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#00d68f",
              display: "inline-block",
              boxShadow: "0 0 8px #00d68f",
            }}
          />
          PAPER TRADING · REAL NSE/BSE DATA
        </div>

        <h1
          style={{
            fontFamily: "'Clash Display',sans-serif",
            fontWeight: 800,
            margin: "0 0 20px",
            fontSize: "clamp(2rem,6vw,4.2rem)",
            lineHeight: 1.1,
            maxWidth: 820,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          <span style={{ color: "#f0f6fa" }}>Get the edge on the</span>
          <br />
          <span
            style={{
              background: "linear-gradient(135deg,#6366f1,#00b4d8,#00d68f)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            market with precision
          </span>
        </h1>

        <p
          style={{
            fontSize: "clamp(0.78rem,2vw,0.92rem)",
            color: "#4a6370",
            lineHeight: 1.8,
            maxWidth: 480,
            margin: "0 auto 36px",
          }}
        >
          Practice with ₹1,00,000 virtual capital. Real-time NSE prices,
          candlestick charts, full order history. Zero risk.
        </p>

        {/* Stats */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "clamp(20px,5vw,56px)",
            marginBottom: 40,
            flexWrap: "wrap",
          }}
        >
          {[
            ["₹1L", "Starting Capital"],
            ["10+", "NSE Stocks"],
            ["Real", "Live Prices"],
            ["Free", "No Credit Card"],
          ].map(([v, l]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div
                style={{
                  fontFamily: "'Clash Display',sans-serif",
                  fontSize: "clamp(1.1rem,3vw,1.5rem)",
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

        {/* Search */}
        <div style={{ position: "relative", maxWidth: 540, margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 50,
              padding: "14px 20px",
              backdropFilter: "blur(16px)",
              boxShadow:
                "0 0 60px rgba(99,102,241,0.08),inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#4a6370"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && navigate("/login")}
              placeholder="Search symbol or company..."
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: "clamp(0.82rem,2vw,0.92rem)",
                color: "#f0f6fa",
                fontFamily: "'JetBrains Mono',monospace",
              }}
            />
            <div
              style={{
                display: "flex",
                gap: 3,
                alignItems: "center",
                background: "rgba(255,255,255,0.05)",
                borderRadius: 6,
                padding: "3px 8px",
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: "0.58rem", color: "#2a3a44" }}>⌘K</span>
            </div>
          </div>

          {(results.length > 0 || searching) && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 10px)",
                left: 0,
                right: 0,
                background: "#0d1117",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 14,
                overflow: "hidden",
                zIndex: 200,
                boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
              }}
            >
              {searching && (
                <div
                  style={{
                    padding: "12px 16px",
                    fontSize: "0.7rem",
                    color: "#4a6370",
                  }}
                >
                  Searching...
                </div>
              )}
              {results.map((r) => (
                <div
                  key={r.symbol}
                  onClick={() => navigate("/login")}
                  style={{
                    padding: "11px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(99,102,241,0.08)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <div>
                    <div
                      style={{
                        fontSize: "0.82rem",
                        color: "#f0f6fa",
                        fontWeight: 600,
                      }}
                    >
                      {r.symbol}
                    </div>
                    <div
                      style={{
                        fontSize: "0.63rem",
                        color: "#4a6370",
                        marginTop: 2,
                      }}
                    >
                      {r.shortname || r.longname}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "0.63rem",
                      color: "#4a6370",
                      background: "rgba(255,255,255,0.05)",
                      padding: "2px 8px",
                      borderRadius: 4,
                    }}
                  >
                    {r.exchDisp || "NSE"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CTA buttons */}
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            marginTop: 28,
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => navigate("/register")}
            style={{
              padding: "clamp(10px,2vw,13px) clamp(24px,4vw,32px)",
              fontSize: "clamp(0.74rem,2vw,0.82rem)",
              background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
              border: "none",
              borderRadius: 10,
              color: "#fff",
              cursor: "pointer",
              fontFamily: "'JetBrains Mono',monospace",
              fontWeight: 700,
              letterSpacing: "0.06em",
              boxShadow: "0 0 32px rgba(99,102,241,0.35)",
            }}
          >
            START TRADING FREE →
          </button>
          <button
            onClick={() => navigate("/login")}
            style={{
              padding: "clamp(10px,2vw,13px) clamp(24px,4vw,32px)",
              fontSize: "clamp(0.74rem,2vw,0.82rem)",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 10,
              color: "#c8d8de",
              cursor: "pointer",
              fontFamily: "'JetBrains Mono',monospace",
              letterSpacing: "0.06em",
            }}
          >
            SIGN IN
          </button>
        </div>
      </div>

      {/* ── INFINITE STOCK TICKER ── */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          paddingBottom: 72,
          overflow: "hidden",
        }}
      >
        {/* Edge fades */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: "10vw",
            minWidth: 40,
            background: "linear-gradient(90deg,#060810,transparent)",
            zIndex: 2,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: "10vw",
            minWidth: 40,
            background: "linear-gradient(-90deg,#060810,transparent)",
            zIndex: 2,
            pointerEvents: "none",
          }}
        />

        {stocks.length === 0 ? (
          /* Skeleton */
          <div style={{ display: "flex", gap: 14, padding: "8px 40px 12px" }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 188,
                  height: 138,
                  borderRadius: 16,
                  flexShrink: 0,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  animation: `pulse 1.8s ease-in-out ${i * 0.15}s infinite`,
                }}
              />
            ))}
          </div>
        ) : (
          <div
            style={{ overflow: "hidden", width: "100%" }}
            onMouseEnter={() => (pauseRef.current = true)}
            onMouseLeave={() => (pauseRef.current = false)}
          >
            <div
              ref={scrollRef}
              style={{
                display: "flex",
                gap: 14,
                willChange: "transform",
                padding: "8px 0 12px",
                width: "max-content",
              }}
            >
              {loopStocks.map((s, i) => (
                <div
                  key={`${s.symbol}-${i}`}
                  onClick={() => navigate("/login")}
                >
                  <StockCard
                    stock={s}
                    color={LOGO_COLORS[i % LOGO_COLORS.length]}
                    active={false}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── FEATURES ── */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          padding: "clamp(40px,6vw,80px) clamp(16px,4vw,48px)",
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        <div
          style={{ textAlign: "center", marginBottom: "clamp(32px,5vw,56px)" }}
        >
          <div
            style={{
              fontSize: "0.62rem",
              color: "#6366f1",
              letterSpacing: "0.18em",
              marginBottom: 12,
            }}
          >
            WHY STOCKSIM
          </div>
          <h2
            style={{
              fontFamily: "'Clash Display',sans-serif",
              fontWeight: 800,
              fontSize: "clamp(1.5rem,4vw,2.4rem)",
              color: "#f0f6fa",
              margin: 0,
            }}
          >
            Everything a trader needs
          </h2>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
            gap: 16,
          }}
        >
          {[
            {
              icon: "📈",
              title: "Live NSE Charts",
              desc: "Candlestick charts with 7 intervals from 1m to monthly. Volume bars, crosshair, full zoom.",
            },
            {
              icon: "⚡",
              title: "Real-Time Prices",
              desc: "Prices update every 10 seconds from Yahoo Finance. Green/red flash on every tick.",
            },
            {
              icon: "🛡️",
              title: "Risk-Free Trading",
              desc: "₹1,00,000 virtual capital. Practice buy/sell orders, manage a real portfolio.",
            },
            {
              icon: "📊",
              title: "Full Order History",
              desc: "Every buy and sell logged. Track P&L and portfolio value in real time.",
            },
          ].map(({ icon, title, desc }) => (
            <div
              key={title}
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 16,
                padding: "clamp(20px,3vw,28px)",
                transition: "all 0.3s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(99,102,241,0.07)";
                e.currentTarget.style.borderColor = "rgba(99,102,241,0.22)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.025)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
              }}
            >
              <div style={{ fontSize: "1.6rem", marginBottom: 14 }}>{icon}</div>
              <div
                style={{
                  fontFamily: "'Clash Display',sans-serif",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  color: "#f0f6fa",
                  marginBottom: 8,
                }}
              >
                {title}
              </div>
              <div
                style={{
                  fontSize: "0.71rem",
                  color: "#4a6370",
                  lineHeight: 1.7,
                }}
              >
                {desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FOOTER CTA ── */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          padding: "clamp(40px,6vw,72px) 24px clamp(56px,8vw,96px)",
        }}
      >
        <div
          style={{
            maxWidth: 560,
            margin: "0 auto",
            background:
              "linear-gradient(145deg,rgba(99,102,241,0.1),rgba(0,180,216,0.06))",
            border: "1px solid rgba(99,102,241,0.2)",
            borderRadius: 20,
            padding: "clamp(32px,5vw,52px) clamp(20px,4vw,48px)",
            boxShadow: "0 0 80px rgba(99,102,241,0.08)",
          }}
        >
          <div
            style={{
              fontFamily: "'Clash Display',sans-serif",
              fontWeight: 800,
              fontSize: "clamp(1.3rem,4vw,2rem)",
              color: "#f0f6fa",
              marginBottom: 12,
            }}
          >
            Ready to start trading?
          </div>
          <div
            style={{
              fontSize: "0.74rem",
              color: "#4a6370",
              marginBottom: 28,
              lineHeight: 1.7,
            }}
          >
            Join thousands of students learning to trade with real market data
            and zero risk.
          </div>
          <button
            onClick={() => navigate("/register")}
            style={{
              padding: "14px 40px",
              fontSize: "0.82rem",
              background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
              border: "none",
              borderRadius: 10,
              color: "#fff",
              cursor: "pointer",
              fontFamily: "'JetBrains Mono',monospace",
              fontWeight: 700,
              letterSpacing: "0.08em",
              boxShadow: "0 0 32px rgba(99,102,241,0.4)",
            }}
          >
            CREATE FREE ACCOUNT →
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:0.6} }
        * { box-sizing: border-box; }
        @media (max-width: 768px) {
          .nav-links  { display: none !important; }
          .nav-ctas   { display: none !important; }
          .hamburger  { display: block !important; }
        }
      `}</style>
    </div>
  );
}
