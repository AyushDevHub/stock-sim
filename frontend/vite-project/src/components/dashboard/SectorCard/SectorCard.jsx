import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./SectorCard.module.css";

const SECTORS = [
  {
    key: "IT",
    name: "Technology",
    icon: "💻",
    color: "#6366f1",
    symbols: ["TCS", "INFY", "WIPRO", "HCLTECH", "TECHM"],
  },
  {
    key: "BANKING",
    name: "Banking",
    icon: "🏦",
    color: "#f59e0b",
    symbols: ["HDFCBANK", "ICICIBANK", "SBIN", "AXISBANK", "KOTAKBANK"],
  },
  {
    key: "ENERGY",
    name: "Energy",
    icon: "⚡",
    color: "#f97316",
    symbols: ["RELIANCE", "ONGC", "BPCL", "IOC", "NTPC"],
  },
  {
    key: "PHARMA",
    name: "Healthcare",
    icon: "💊",
    color: "#10b981",
    symbols: ["SUNPHARMA", "DRREDDY", "CIPLA", "DIVISLAB", "APOLLOHOSP"],
  },
  {
    key: "AUTO",
    name: "Automobile",
    icon: "🚗",
    color: "#06b6d4",
    symbols: ["MARUTI", "TATAMOTORS", "HEROMOTOCO", "EICHERMOT", "M&M"],
  },
  {
    key: "FMCG",
    name: "FMCG",
    icon: "🛒",
    color: "#ec4899",
    symbols: ["HINDUNILVR", "ITC", "NESTLEIND", "BRITANNIA", "TATACONSUM"],
  },
];

const TABS = ["Stock Sector", "Stock Index", "Nifty 50"];

function avg(prices, symbols) {
  const hits = prices.filter((p) => symbols.includes(p.symbol));
  if (!hits.length) return { avgChange: 0, count: hits.length };
  const avgChange =
    hits.reduce((s, p) => s + (p.percentChange ?? 0), 0) / hits.length;
  return { avgChange, count: hits.length };
}

export default function SectorCard({ prices = [], loading }) {
  const [tab, setTab] = useState("Stock Sector");
  const navigate = useNavigate();

  return (
    <div className={styles.section}>
      <div className={styles.tabs}>
        {TABS.map((t) => (
          <button
            key={t}
            className={`${styles.tab} ${tab === t ? styles.tabActive : ""}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={styles.skeleton}
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))
          : SECTORS.map((sector) => {
              const { avgChange, count } = avg(prices, sector.symbols);
              const up = avgChange >= 0;
              return (
                <div
                  key={sector.key}
                  className={styles.card}
                  style={{ "--card-color": sector.color }}
                  onClick={() => navigate(`/dashboard?sector=${sector.key}`)}
                >
                  <div className={styles.cardTop}>
                    <div
                      className={styles.iconWrap}
                      style={{
                        background: `${sector.color}18`,
                        border: `1px solid ${sector.color}30`,
                      }}
                    >
                      {sector.icon}
                    </div>
                  </div>
                  <div className={styles.cardName}>{sector.name}</div>
                  <div className={styles.stockCount}>
                    {count} Stocks tracked
                  </div>
                  <div className={styles.cardValue}>
                    {count > 0
                      ? `₹${(
                          prices.find((p) => p.symbol === sector.symbols[0])
                            ?.price ?? 0
                        ).toLocaleString("en-IN", {
                          maximumFractionDigits: 0,
                        })}`
                      : "—"}
                  </div>
                  <div
                    className={`${styles.cardChange} ${
                      up ? styles.up : styles.down
                    }`}
                  >
                    {up ? "▲" : "▼"} {up ? "+" : ""}
                    {avgChange.toFixed(2)}%
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}
