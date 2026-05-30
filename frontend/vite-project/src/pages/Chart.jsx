import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import CandleChart from "../components/CandleChart/Candlechart.jsx";
import TradePanel from "../components/TradePanel/TradePanel.jsx";
import { usePrices } from "../hooks/UsePrices.js";
import api from "../services/api.js";
import styles from "./Chart.module.css";

const INTERVALS = [
  { key: "1m", label: "1m" },
  { key: "5m", label: "5m" },
  { key: "15m", label: "15m" },
  { key: "1h", label: "1H" },
  { key: "1d", label: "1D" },
  { key: "1wk", label: "1W" },
  { key: "1mo", label: "1M" },
];

export default function Chart() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [interval, setInterval] = useState("1d");
  const [showTrade, setShowTrade] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const { prices } = usePrices();
  const navigate = useNavigate();

  const symbol = searchParams.get("symbol") || (prices[0]?.symbol ?? "TCS");
  const liveStock = prices.find((p) => p.symbol === symbol);
  const up = (liveStock?.change ?? 0) >= 0;

  const selectSymbol = (sym) => {
    setSearchParams({ symbol: sym });
    setQuery("");
    setResults([]);
  };

  // Search debounce
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
    }, 300);
    return () => clearTimeout(id);
  }, [query]);

  return (
    <div className={styles.page}>
      {/* ── Top header bar ── */}
      <div className={styles.topBar}>
        {/* Left: symbol + price */}
        <div className={styles.stockHeader}>
          <div className={styles.symbolBlock}>
            <div className={styles.symbolName}>{liveStock?.name || symbol}</div>
            <div className={styles.symbolSub}>{symbol} · NSE</div>
          </div>
          {liveStock && (
            <>
              <div className={styles.priceBlock}>
                <div className={styles.price}>
                  ₹
                  {liveStock.price?.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <div
                  className={`${styles.change} ${up ? styles.up : styles.down}`}
                >
                  {up ? "▲" : "▼"} {Math.abs(liveStock.change ?? 0).toFixed(2)}{" "}
                  ({Math.abs(liveStock.percentChange ?? 0).toFixed(2)}%)
                </div>
              </div>
              <div className={styles.ohlcBar}>
                {[
                  ["O", liveStock.open],
                  ["H", liveStock.high],
                  ["L", liveStock.low],
                  ["C", liveStock.previousClose],
                ].map(([l, v]) => (
                  <div key={l} className={styles.ohlcItem}>
                    <span className={styles.ohlcL}>{l}</span>
                    <span className={styles.ohlcV}>
                      {v
                        ? `₹${v.toLocaleString("en-IN", {
                            maximumFractionDigits: 0,
                          })}`
                        : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right: search + trade button */}
        <div className={styles.topActions}>
          <div className={styles.searchWrap}>
            <div className={styles.searchBox}>
              <svg
                width="13"
                height="13"
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
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Switch symbol…"
              />
            </div>
            {(results.length > 0 || searching) && (
              <div className={styles.searchDrop}>
                {searching && (
                  <div className={styles.dropLoading}>Searching…</div>
                )}
                {results.map((r) => (
                  <div
                    key={r.symbol}
                    className={styles.dropItem}
                    onClick={() => selectSymbol(r.symbol)}
                  >
                    <span className={styles.dropSym}>{r.symbol}</span>
                    <span className={styles.dropName}>
                      {r.shortname || r.longname}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            className={`${styles.tradeBtn} ${
              up ? styles.tradeBtnUp : styles.tradeBtnDown
            }`}
            onClick={() => setShowTrade((t) => !t)}
          >
            {showTrade ? "Hide Order" : "Trade"}
          </button>
        </div>
      </div>

      {/* ── Interval selector ── */}
      <div className={styles.intervalBar}>
        {INTERVALS.map((iv) => (
          <button
            key={iv.key}
            className={`${styles.ivBtn} ${
              interval === iv.key ? styles.ivActive : ""
            }`}
            onClick={() => setInterval(iv.key)}
          >
            {iv.label}
          </button>
        ))}
        <div className={styles.liveDot}>
          <span className={styles.dot} />
          LIVE
        </div>
      </div>

      {/* ── Main: chart + optional trade panel ── */}
      <div
        className={`${styles.main} ${showTrade ? styles.mainWithPanel : ""}`}
      >
        <div className={styles.chartArea}>
          <CandleChart
            symbol={symbol}
            interval={interval}
            onIntervalChange={setInterval}
          />
        </div>
        {showTrade && (
          <div className={styles.tradePanel}>
            <TradePanel symbol={symbol} price={liveStock?.price} />
          </div>
        )}
      </div>

      {/* ── Symbol quick-switch chips ── */}
      <div className={styles.chipsWrap}>
        <div className={styles.chips}>
          {prices.slice(0, 30).map((p) => (
            <button
              key={p.symbol}
              className={`${styles.chip} ${
                p.symbol === symbol ? styles.chipActive : ""
              }`}
              onClick={() => selectSymbol(p.symbol)}
            >
              {p.symbol}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
