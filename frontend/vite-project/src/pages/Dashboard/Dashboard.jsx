import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { usePrices } from "../../hooks/UsePrices.js";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../services/api.js";
import PortfolioChart from "../../components/dashboard/PortfolioChart/PortfolioChart.jsx";
import WatchlistCard from "../../components/dashboard/WatchlistCard/WatchlistCard.jsx";
import SectorCard from "../../components/dashboard/SectorCard/SectorCard.jsx";
import StockTable from "../../components/dashboard/StockTable/StockTable.jsx";
import styles from "./Dashboard.module.css";

const NIFTY50 = [
  "RELIANCE",
  "TCS",
  "HDFCBANK",
  "INFY",
  "ICICIBANK",
  "HINDUNILVR",
  "ITC",
  "SBIN",
  "BHARTIARTL",
  "KOTAKBANK",
  "LT",
  "AXISBANK",
  "MARUTI",
  "ASIANPAINT",
  "BAJFINANCE",
  "WIPRO",
  "HCLTECH",
  "TITAN",
  "SUNPHARMA",
  "TECHM",
  "NESTLEIND",
  "ONGC",
  "NTPC",
  "POWERGRID",
  "TATAMOTORS",
  "TATASTEEL",
  "ADANIENT",
  "BAJAJFINSV",
  "DIVISLAB",
  "DRREDDY",
  "EICHERMOT",
  "GRASIM",
  "HEROMOTOCO",
  "HINDALCO",
  "INDUSINDBK",
  "JSWSTEEL",
  "CIPLA",
  "COALINDIA",
  "BPCL",
  "IOC",
  "TATACONSUM",
  "APOLLOHOSP",
  "BRITANNIA",
  "SBILIFE",
  "HDFCLIFE",
  "MM",
  "SHREECEM",
  "ULTRACEMCO",
  "BAJAJ-AUTO",
  "VEDL",
];
const SENSEX = [
  "RELIANCE",
  "TCS",
  "HDFCBANK",
  "INFY",
  "ICICIBANK",
  "HINDUNILVR",
  "SBIN",
  "BHARTIARTL",
  "KOTAKBANK",
  "AXISBANK",
  "LT",
  "MARUTI",
  "BAJFINANCE",
  "ASIANPAINT",
  "WIPRO",
  "TITAN",
  "NTPC",
  "SUNPHARMA",
  "NESTLEIND",
  "POWERGRID",
  "TATAMOTORS",
  "TATASTEEL",
  "MM",
  "BAJAJFINSV",
  "HCLTECH",
  "ADANIENT",
  "DRREDDY",
  "ONGC",
  "INDUSINDBK",
  "COALINDIA",
];
const BANKNIFTY = [
  "HDFCBANK",
  "ICICIBANK",
  "SBIN",
  "AXISBANK",
  "KOTAKBANK",
  "INDUSINDBK",
  "BANDHANBNK",
  "FEDERALBNK",
  "IDFCFIRSTB",
  "RBLBANK",
  "BANKBARODA",
  "CANARABANK",
];

function avgChange(prices, syms) {
  const hits = syms
    .map((s) => prices.find((p) => p.symbol === s))
    .filter(Boolean);
  if (!hits.length) return 0;
  return hits.reduce((a, p) => a + (p.percentChange ?? 0), 0) / hits.length;
}

function MiniSparkline({ change, width = 80, height = 28 }) {
  const up = change >= 0;
  const pts = useMemo(() => {
    const n = 12;
    const arr = [0];
    let v = 0;
    for (let i = 1; i < n; i++) {
      v += Math.sin(i * 2.3 + change * 0.5) * 0.4 + change * 0.15;
      arr.push(v);
    }
    return arr;
  }, [change]);
  const min = Math.min(...pts),
    max = Math.max(...pts);
  const range = max - min || 1;
  const xs = pts.map((_, i) => (i / (pts.length - 1)) * width);
  const ys = pts.map((v) => height - 4 - ((v - min) / range) * (height - 8));
  let d = `M ${xs[0]} ${ys[0]}`;
  for (let i = 1; i < pts.length; i++) {
    const cpx = (xs[i - 1] + xs[i]) / 2;
    d += ` C ${cpx} ${ys[i - 1]}, ${cpx} ${ys[i]}, ${xs[i]} ${ys[i]}`;
  }
  const color = up ? "#22c55e" : "#ef4444";
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient
          id={`sg${change > 0 ? "u" : "d"}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`${d} L ${xs[xs.length - 1]} ${height} L ${xs[0]} ${height} Z`}
        fill={`url(#sg${change > 0 ? "u" : "d"})`}
      />
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IndexCard({ name, constituents, prices }) {
  const chg = avgChange(prices, constituents);
  const up = chg >= 0;
  return (
    <div className={styles.indexCard}>
      <div className={styles.indexTop}>
        <span className={styles.indexName}>{name}</span>
        <span className={`${styles.indexChg} ${up ? styles.up : styles.down}`}>
          {up ? "▲" : "▼"} {Math.abs(chg).toFixed(2)}%
        </span>
      </div>
      <MiniSparkline change={chg} width={100} height={32} />
    </div>
  );
}

export default function Dashboard() {
  const { prices, loading } = usePrices();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [holdings, setHoldings] = useState([]);

  useEffect(() => {
    api
      .get("/trade/orders")
      .then(({ data }) => setOrders(data.orders ?? []))
      .catch(() => {});
    api
      .get("/portfolio")
      .then(({ data }) => setHoldings(data.portfolio ?? []))
      .catch(() => {});
  }, []);

  const balance = user?.balance ?? 100000;
  const portfolioValue = holdings.reduce(
    (s, h) =>
      s + (prices.find((p) => p.symbol === h.stock)?.price ?? 0) * h.quantity,
    0
  );
  const invested = holdings.reduce(
    (s, h) => s + (h.avgPrice ?? 0) * h.quantity,
    0
  );
  const pnl = portfolioValue - invested;
  const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
  const isUp = pnl >= 0;

  const sells = orders.filter((o) => o.type === "sell");
  const buys = orders.filter((o) => o.type === "buy");
  const buyMap = {};
  buys.forEach((b) => {
    if (!buyMap[b.stock]) buyMap[b.stock] = [];
    buyMap[b.stock].push(b.price);
  });
  let wins = 0;
  sells.forEach((s) => {
    const bp = buyMap[s.stock]?.shift() ?? s.price;
    if (s.price > bp) wins++;
  });

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        {/* ── Top bar ── */}
        <div className={styles.topBar}>
          <div className={styles.topLeft}>
            <span className={styles.greeting}>
              Good{" "}
              {new Date().getHours() < 12
                ? "morning"
                : new Date().getHours() < 17
                ? "afternoon"
                : "evening"}
              {user?.name ? `, ${user.name.split(" ")[0]}` : ""}
            </span>
            <div className={styles.livePill}>
              <span className={styles.liveDot} />
              Live
            </div>
          </div>
          <div className={styles.topRight}>
            <button className={styles.btn} onClick={() => navigate("/trade")}>
              + Trade
            </button>
            <button
              className={styles.btnGhost}
              onClick={() => navigate("/scenarios")}
            >
              🎯 Scenarios
            </button>
            <button
              className={styles.btnGhost}
              onClick={() => navigate("/portfolio")}
            >
              Portfolio
            </button>
          </div>
        </div>

        {/* ── Bento grid ── */}
        <div className={styles.bento}>
          {/* Index sparklines */}
          <div className={styles.bentoIndices}>
            <IndexCard name="Nifty 50" constituents={NIFTY50} prices={prices} />
            <IndexCard name="Sensex" constituents={SENSEX} prices={prices} />
            <IndexCard
              name="Bank Nifty"
              constituents={BANKNIFTY}
              prices={prices}
            />
          </div>

          {/* Summary strip */}
          <div className={styles.bentoSummary}>
            <div className={styles.sumBig}>
              <div className={styles.sumBigLabel}>Total Assets</div>
              <div className={styles.sumBigVal}>
                ₹{Math.round(balance + portfolioValue).toLocaleString("en-IN")}
              </div>
            </div>
            <div className={styles.sumRow}>
              <div className={styles.sumItem}>
                <div className={styles.sumLbl}>Cash</div>
                <div className={styles.sumVal}>
                  ₹{Math.round(balance).toLocaleString("en-IN")}
                </div>
              </div>
              <div className={styles.sumItem}>
                <div className={styles.sumLbl}>Invested</div>
                <div className={styles.sumVal}>
                  {invested > 0
                    ? `₹${Math.round(invested).toLocaleString("en-IN")}`
                    : "—"}
                </div>
              </div>
              <div className={styles.sumItem}>
                <div className={styles.sumLbl}>P&L</div>
                <div
                  className={`${styles.sumVal} ${
                    invested > 0 ? (isUp ? styles.up : styles.down) : ""
                  }`}
                >
                  {invested > 0
                    ? `${isUp ? "+" : ""}₹${Math.abs(
                        Math.round(pnl)
                      ).toLocaleString("en-IN")}`
                    : "—"}
                </div>
              </div>
              <div className={styles.sumItem}>
                <div className={styles.sumLbl}>Win Rate</div>
                <div
                  className={`${styles.sumVal} ${
                    sells.length > 0
                      ? wins / sells.length >= 0.55
                        ? styles.up
                        : styles.down
                      : ""
                  }`}
                >
                  {sells.length > 0
                    ? `${Math.round((wins / sells.length) * 100)}%`
                    : "—"}
                </div>
              </div>
            </div>
          </div>

          {/* Portfolio chart */}
          <div className={styles.bentoChart}>
            <PortfolioChart balance={balance} />
          </div>

          {/* Watchlist */}
          <div className={styles.bentoWatchlist}>
            <WatchlistCard stocks={prices} loading={loading} />
          </div>
        </div>

        {/* Sectors */}
        <SectorCard prices={prices} loading={loading} />

        {/* All stocks */}
        <StockTable stocks={prices} loading={loading} />
      </div>
    </div>
  );
}
