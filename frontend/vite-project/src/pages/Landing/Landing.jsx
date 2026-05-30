import { useState, useEffect, useRef, useMemo, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api.js";
import { LandingNav } from "../../components/Navbar/Navbar.jsx";
import StockCard, {
  StockCardSkeleton,
} from "../../components/StockCard/StockCard.jsx";
import styles from "./Landing.module.css";

const FEATURES = [
  {
    icon: "📈",
    title: "Live NSE Charts",
    desc: "Candlestick charts with multiple timeframes. Volume bars, zoom, crosshair — all in-browser.",
  },
  {
    icon: "⚡",
    title: "Real-Time Prices",
    desc: "Prices stream live from Yahoo Finance. Watch green and red ticks update every second.",
  },
  {
    icon: "🛡️",
    title: "Risk-Free Trading",
    desc: "₹1,00,000 virtual capital to start. Practice buy/sell without losing real money.",
  },
  {
    icon: "📊",
    title: "Full Order History",
    desc: "Every trade logged with timestamp, P&L, and portfolio value tracked over time.",
  },
];

export default function Landing() {
  const [query, setQuery] = useState("");
  const [stocks, setStocks] = useState([]);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(null); // symbol selected
  const scrollRef = useRef(null);
  const posRef = useRef(0);
  const pauseRef = useRef(false);
  const navigate = useNavigate();

  // ── Fetch ticker prices once ─────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/prices");
        const incoming = data.prices || [];
        setStocks((prev) => {
          if (
            prev.length === incoming.length &&
            prev.every(
              (s, i) =>
                s.price === incoming[i].price && s.symbol === incoming[i].symbol
            )
          )
            return prev;
          return incoming;
        });
      } catch {
        /* ignore */
      }
    };
    load();
    // Only poll once — landing page doesn't need live prices in the ticker
  }, []);

  // ── RAF infinite ticker ───────────────────────────────────────────────────
  const loopStocks = useMemo(() => [...stocks, ...stocks, ...stocks], [stocks]);

  useLayoutEffect(() => {
    if (!scrollRef.current || stocks.length === 0) return;
    const el = scrollRef.current;
    const CARD_WIDTH = 188;
    const GAP = 14;
    const SPEED = 38; // px/s
    const singleWidth = stocks.length * (CARD_WIDTH + GAP);

    let lastTime = null;
    let rafId = null;

    const tick = (now) => {
      if (lastTime === null) lastTime = now;
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      if (!pauseRef.current) {
        posRef.current += SPEED * dt;
        if (posRef.current >= singleWidth) posRef.current -= singleWidth;
        el.style.transform = `translate3d(-${posRef.current}px, 0, 0)`;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [stocks]); // restarts when stocks first loads — pos is preserved

  // ── Search debounce ───────────────────────────────────────────────────────
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

  const handleResultClick = (symbol) => {
    setShowLoginPrompt(symbol);
    setResults([]);
    setQuery("");
  };

  return (
    <div className={styles.page}>
      <LandingNav />

      {/* HERO ── */}
      <section className={styles.hero} id="home">
        <div className={styles.badge}>
          <span className={styles.badgeDot} />
          PAPER TRADING · REAL NSE/BSE DATA
        </div>

        <h1 className={styles.headline}>
          Learn to trade the market —<br />
          <span className={styles.headlineAccent}>
            without losing real money
          </span>
        </h1>

        <p className={styles.subtext}>
          Practice with ₹1,00,000 virtual capital. Live NSE prices, candlestick
          charts, full order history. The safest way to become a confident
          investor.
        </p>

        <div className={styles.stats}>
          {[
            ["₹1L", "Starting Capital"],
            ["50+", "NSE Stocks"],
            ["Live", "Real Prices"],
            ["Free", "No Credit Card"],
          ].map(([v, l]) => (
            <div key={l} className={styles.statItem}>
              <div className={styles.statVal}>{v}</div>
              <div className={styles.statLabel}>{l}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className={styles.searchWrap}>
          <div className={styles.searchBar}>
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#5a7080"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              className={styles.searchInput}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowLoginPrompt(null);
              }}
              onKeyDown={(e) => e.key === "Escape" && setQuery("")}
              placeholder="Search a stock — RELIANCE, TCS, INFY…"
            />
          </div>

          {/* Search results */}
          {(results.length > 0 || searching) && (
            <div className={styles.dropdown}>
              {searching && (
                <div className={styles.dropLoading}>Searching…</div>
              )}
              {results.map((r) => (
                <div
                  key={r.symbol}
                  className={styles.dropItem}
                  onClick={() => handleResultClick(r.symbol)}
                >
                  <div>
                    <div className={styles.dropSymbol}>{r.symbol}</div>
                    <div className={styles.dropName}>
                      {r.shortname || r.longname}
                    </div>
                  </div>
                  <span className={styles.dropExch}>{r.exchDisp || "NSE"}</span>
                </div>
              ))}
            </div>
          )}

          {/* Login prompt after selecting a stock */}
          {showLoginPrompt && (
            <div className={styles.loginPrompt}>
              <span className={styles.promptText}>
                Create a free account to trade{" "}
                <strong>{showLoginPrompt}</strong>
              </span>
              <div className={styles.promptBtns}>
                <button
                  className={styles.promptRegister}
                  onClick={() => navigate("/register")}
                >
                  Create Account
                </button>
                <button
                  className={styles.promptLogin}
                  onClick={() => navigate("/login")}
                >
                  Sign In
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={styles.ctas}>
          <button
            className={styles.btnPrimary}
            onClick={() => navigate("/register")}
          >
            Start Trading Free →
          </button>
          <button
            className={styles.btnSecondary}
            onClick={() => navigate("/login")}
          >
            Sign In
          </button>
        </div>
      </section>

      {/* TICKER ── */}
      <section className={styles.tickerSection}>
        <div className={styles.fadeLeft} />
        <div className={styles.fadeRight} />
        {stocks.length === 0 ? (
          <div className={styles.skeletonRow}>
            {Array.from({ length: 7 }).map((_, i) => (
              <StockCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div
            className={styles.tickerViewport}
            onMouseEnter={() => (pauseRef.current = true)}
            onMouseLeave={() => (pauseRef.current = false)}
          >
            <div ref={scrollRef} className={styles.tickerStrip}>
              {loopStocks.map((s, i) => (
                <div
                  key={`${s.symbol}-${i}`}
                  onClick={() => handleResultClick(s.symbol)}
                  style={{ cursor: "pointer" }}
                >
                  <StockCard stock={s} colorIndex={i} />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* FEATURES ── */}
      <section className={styles.features} id="features">
        <div className={styles.featuresHeader}>
          <div className={styles.eyebrow}>WHY STOCKSIM</div>
          <h2 className={styles.featuresTitle}>
            Everything you need to learn trading
          </h2>
          <p className={styles.featuresSub}>
            Built for students, freshers, and anyone who wants to understand the
            stock market before putting real money in.
          </p>
        </div>
        <div className={styles.featuresGrid}>
          {FEATURES.map(({ icon, title, desc }) => (
            <div key={title} className={styles.featureCard}>
              <div className={styles.featureIcon}>{icon}</div>
              <div className={styles.featureTitle}>{title}</div>
              <div className={styles.featureDesc}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS ── */}
      <section className={styles.howSection} id="how">
        <div className={styles.featuresHeader}>
          <div className={styles.eyebrow}>HOW IT WORKS</div>
          <h2 className={styles.featuresTitle}>Three steps to start trading</h2>
        </div>
        <div className={styles.steps}>
          {[
            {
              n: "1",
              t: "Create a free account",
              d: "Sign up in 30 seconds. No payment, no KYC, no hassle.",
            },
            {
              n: "2",
              t: "Get ₹1 lakh virtual cash",
              d: "Your account starts with ₹1,00,000. Use it to buy and sell real NSE stocks.",
            },
            {
              n: "3",
              t: "Trade and learn",
              d: "Watch your portfolio grow. Track P&L. Learn what works — risk free.",
            },
          ].map(({ n, t, d }) => (
            <div key={n} className={styles.step}>
              <div className={styles.stepNum}>{n}</div>
              <div className={styles.stepTitle}>{t}</div>
              <div className={styles.stepDesc}>{d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER CTA ── */}
      <section className={styles.footerCta} id="pricing">
        <div className={styles.footerCard}>
          <div className={styles.footerTitle}>Ready to start?</div>
          <div className={styles.footerSub}>
            Join thousands of students learning to trade with real market data
            and zero risk.
          </div>
          <button
            className={styles.btnPrimary}
            onClick={() => navigate("/register")}
          >
            Create Free Account →
          </button>
        </div>
      </section>
    </div>
  );
}
