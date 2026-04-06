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
    desc: "Every buy and sell logged. Track your P&L and portfolio value in real time.",
  },
];

export default function Landing() {
  const [query, setQuery] = useState("");
  const [stocks, setStocks] = useState([]);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const scrollRef = useRef(null);
  const animRef = useRef(null);
  const pauseRef = useRef(false);
  const navigate = useNavigate();

  // fetch prices
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/prices");
        const incoming = data.prices || [];
        setStocks((prev) => {
          // If same length and same prices, return SAME reference → no re-render
          if (
            prev.length === incoming.length &&
            prev.every(
              (s, i) =>
                s.price === incoming[i].price && s.symbol === incoming[i].symbol
            )
          ) {
            return prev;
          }
          return incoming;
        });
      } catch {
        setStocks((prev) => prev); // never reset to [] on error
      }
    };
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, []);

  // RAF infinite scroll
 
  const posRef = useRef(0); // ← add this at the top of your component

  useLayoutEffect(() => {
    if (!scrollRef.current || stocks.length === 0) return;

    const el = scrollRef.current;
    const CARD_WIDTH = 188;
    const GAP = 14;
    const SPEED = 40;
    const singleWidth = stocks.length * CARD_WIDTH + (stocks.length - 1) * GAP;

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
  }, [stocks]);

  // search debounce
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

  const loopStocks = useMemo(() => {
    return [...stocks, ...stocks, ...stocks];
  }, [stocks]);

  return (
    <div className={styles.page}>
      {/* Glow orbs */}
      <div
        className={styles.glowOrb}
        style={{
          left: "5%",
          top: "5%",
          width: "500px",
          height: "500px",
          background:
            "radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%)",
        }}
      />
      <div
        className={styles.glowOrb}
        style={{
          left: "55%",
          top: "3%",
          width: "400px",
          height: "400px",
          background:
            "radial-gradient(circle,rgba(0,214,143,0.07) 0%,transparent 70%)",
        }}
      />
      <div
        className={styles.glowOrb}
        style={{
          left: "70%",
          top: "45%",
          width: "350px",
          height: "350px",
          background:
            "radial-gradient(circle,rgba(255,184,0,0.05) 0%,transparent 70%)",
        }}
      />
      <div className={styles.grid} />

      <LandingNav />

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.badge}>
          <span className={styles.badgeDot} />
          PAPER TRADING · REAL NSE/BSE DATA
        </div>

        <h1 className={styles.headline}>
          <span className={styles.headlinePlain}>
            Get the edge on the
            <br />
          </span>
          <span className={styles.headlineGradient}>market with precision</span>
        </h1>

        <p className={styles.subtext}>
          Practice with ₹1,00,000 virtual capital. Real-time NSE prices,
          candlestick charts, full order history. Zero risk.
        </p>

        <div className={styles.stats}>
          {[
            ["₹1L", "Starting Capital"],
            ["50+", "NSE Stocks"],
            ["Real", "Live Prices"],
            ["Free", "No Credit Card"],
          ].map(([v, l]) => (
            <div key={l}>
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
              stroke="#4a6370"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              className={styles.searchInput}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && navigate("/login")}
              placeholder="Search symbol or company..."
            />
            <div className={styles.searchKbd}>⌘K</div>
          </div>

          {(results.length > 0 || searching) && (
            <div className={styles.dropdown}>
              {searching && (
                <div className={styles.dropdownLoading}>Searching...</div>
              )}
              {results.map((r) => (
                <div
                  key={r.symbol}
                  className={styles.dropdownItem}
                  onClick={() => navigate("/login")}
                >
                  <div>
                    <div className={styles.dropdownSymbol}>{r.symbol}</div>
                    <div className={styles.dropdownName}>
                      {r.shortname || r.longname}
                    </div>
                  </div>
                  <span className={styles.dropdownBadge}>
                    {r.exchDisp || "NSE"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.ctas}>
          <button
            className={styles.btnPrimary}
            onClick={() => navigate("/register")}
          >
            START TRADING FREE →
          </button>
          <button
            className={styles.btnSecondary}
            onClick={() => navigate("/login")}
          >
            SIGN IN
          </button>
        </div>
      </section>

      {/* TICKER */}
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
                  onClick={() => navigate("/login")}
                >
                  <StockCard stock={s} colorIndex={i} />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* FEATURES */}
      <section className={styles.features}>
        <div className={styles.featuresHeader}>
          <div className={styles.featuresEyebrow}>WHY STOCKSIM</div>
          <h2 className={styles.featuresTitle}>Everything a trader needs</h2>
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

      {/* FOOTER CTA */}
      <section className={styles.footerCta}>
        <div className={styles.footerCard}>
          <div className={styles.footerTitle}>Ready to start trading?</div>
          <div className={styles.footerSub}>
            Join thousands of students learning to trade with real market data
            and zero risk.
          </div>
          <button
            className={styles.btnPrimary}
            onClick={() => navigate("/register")}
          >
            CREATE FREE ACCOUNT →
          </button>
        </div>
      </section>
    </div>
  );
}
