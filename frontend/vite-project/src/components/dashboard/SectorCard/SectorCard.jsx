import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./SectorCard.module.css";

const SECTORS = [
  {
    key: "IT",
    name: "Technology",
    icon: "💻",
    color: "#6366f1",
    symbols: [
      "TCS",
      "INFY",
      "WIPRO",
      "HCLTECH",
      "TECHM",
      "LTIM",
      "PERSISTENT",
      "MPHASIS",
      "COFORGE",
      "KPITTECH",
      "OFSS",
    ],
  },
  {
    key: "BANKING",
    name: "Banking",
    icon: "🏦",
    color: "#f59e0b",
    symbols: [
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
      "PNB",
      "CANARABANK",
      "UNIONBANK",
    ],
  },
  {
    key: "ENERGY",
    name: "Energy",
    icon: "⚡",
    color: "#f97316",
    symbols: [
      "RELIANCE",
      "ONGC",
      "BPCL",
      "IOC",
      "NTPC",
      "TATAPOWER",
      "ADANIGREEN",
      "ADANIENT",
      "POWERGRID",
      "GAIL",
      "PETRONET",
      "OIL",
    ],
  },
  {
    key: "PHARMA",
    name: "Healthcare",
    icon: "💊",
    color: "#10b981",
    symbols: [
      "SUNPHARMA",
      "DRREDDY",
      "CIPLA",
      "DIVISLAB",
      "APOLLOHOSP",
      "LUPIN",
      "TORNTPHARM",
      "BIOCON",
      "AUROPHARMA",
      "ALKEM",
      "IPCA",
      "LALPATHLAB",
    ],
  },
  {
    key: "AUTO",
    name: "Automobile",
    icon: "🚗",
    color: "#06b6d4",
    symbols: [
      "MARUTI",
      "TATAMOTORS",
      "HEROMOTOCO",
      "EICHERMOT",
      "MM",
      "BAJAJ-AUTO",
      "TVSMOTORS",
      "ASHOKLEY",
      "BOSCHLTD",
      "MOTHERSON",
      "EXIDEIND",
    ],
  },
  {
    key: "FMCG",
    name: "FMCG",
    icon: "🛒",
    color: "#ec4899",
    symbols: [
      "HINDUNILVR",
      "ITC",
      "NESTLEIND",
      "BRITANNIA",
      "TATACONSUM",
      "DABUR",
      "GODREJCP",
      "COLPAL",
      "MARICO",
      "UBL",
      "EMAMILTD",
      "VBL",
    ],
  },
  {
    key: "REALTY",
    name: "Real Estate",
    icon: "🏗️",
    color: "#84cc16",
    symbols: [
      "DLF",
      "GODREJPROP",
      "OBEROIRLTY",
      "BRIGADE",
      "PRESTIGE",
      "SOBHA",
      "PHOENIXLTD",
      "SUNTECK",
      "MAHLIFE",
    ],
  },
  {
    key: "METAL",
    name: "Metals",
    icon: "⚙️",
    color: "#94a3b8",
    symbols: [
      "TATASTEEL",
      "JSWSTEEL",
      "HINDALCO",
      "VEDL",
      "COALINDIA",
      "NMDC",
      "SAIL",
      "HINDZINC",
      "NATIONALUM",
      "WELCORP",
    ],
  },
];

const INDICES = [
  {
    key: "NIFTY50",
    name: "Nifty 50",
    icon: "📊",
    symbols: [
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
    ],
  },
  {
    key: "SENSEX",
    name: "Sensex 30",
    icon: "📈",
    symbols: [
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
      "ULTRACEMCO",
    ],
  },
  {
    key: "BANKNIFTY",
    name: "Bank Nifty",
    icon: "🏦",
    symbols: [
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
      "PNB",
      "CANARABANK",
      "UNIONBANK",
      "INDIANB",
    ],
  },
  {
    key: "NIFTYIT",
    name: "Nifty IT",
    icon: "💻",
    symbols: [
      "TCS",
      "INFY",
      "WIPRO",
      "HCLTECH",
      "TECHM",
      "LTIM",
      "PERSISTENT",
      "MPHASIS",
      "COFORGE",
      "KPITTECH",
      "OFSS",
    ],
  },
  {
    key: "NIFTYMID",
    name: "Nifty Midcap",
    icon: "📉",
    symbols: [
      "GODREJPROP",
      "TRENT",
      "POLYCAB",
      "ZOMATO",
      "NYKAA",
      "IRCTC",
      "DMART",
      "HAL",
      "RECLTD",
      "MUTHOOTFIN",
      "PAGEIND",
      "VOLTAS",
      "CHOLAFIN",
      "HAVELLS",
    ],
  },
];

const NIFTY50_FULL = [
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

const avgChg = (prices, syms) => {
  const h = syms.map((s) => prices.find((p) => p.symbol === s)).filter(Boolean);
  return h.length
    ? h.reduce((a, p) => a + (p.percentChange ?? 0), 0) / h.length
    : 0;
};

function StockList({ symbols, prices }) {
  const navigate = useNavigate();
  return (
    <div className={styles.stockList}>
      {symbols.map((sym) => {
        const s = prices.find((p) => p.symbol === sym);
        const up = (s?.change ?? 0) >= 0;
        return (
          <div
            key={sym}
            className={styles.sRow}
            onClick={() => navigate(`/chart?symbol=${sym}`)}
          >
            <div className={styles.sSymbol}>{sym}</div>
            <div className={styles.sName}>
              {s?.name?.split(" ").slice(0, 3).join(" ") || sym}
            </div>
            <div className={styles.sRight}>
              <div className={styles.sPrice}>
                {s
                  ? `₹${s.price.toLocaleString("en-IN", {
                      maximumFractionDigits: 0,
                    })}`
                  : "—"}
              </div>
              {s && (
                <div
                  className={`${styles.sChange} ${
                    up ? styles.up : styles.down
                  }`}
                >
                  {up ? "▲" : "▼"} {Math.abs(s.percentChange ?? 0).toFixed(2)}%
                </div>
              )}
            </div>
            <button
              className={styles.tradeBtn}
              onClick={(e) => {
                e.stopPropagation();
                navigate("/trade");
              }}
            >
              Trade
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default function SectorCard({ prices = [], loading }) {
  const [tab, setTab] = useState("Sectors");
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();
  const toggle = (k) => setSelected((p) => (p === k ? null : k));

  return (
    <div className={styles.section}>
      <div className={styles.tabRow}>
        {["Sectors", "Indices", "Nifty 50"].map((t) => (
          <button
            key={t}
            className={`${styles.tab} ${tab === t ? styles.tabActive : ""}`}
            onClick={() => {
              setTab(t);
              setSelected(null);
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Sectors" && (
        <div className={styles.grid}>
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className={styles.skel} />
              ))
            : SECTORS.map((sec) => {
                const chg = avgChg(prices, sec.symbols);
                const up = chg >= 0;
                const open = selected === sec.key;
                return (
                  <div key={sec.key} className={open ? styles.openWrap : ""}>
                    <div
                      className={`${styles.card} ${
                        open ? styles.cardOpen : ""
                      }`}
                      style={{ "--c": sec.color }}
                      onClick={() => toggle(sec.key)}
                    >
                      <div className={styles.cardRow}>
                        <div
                          className={styles.iconBox}
                          style={{
                            background: `${sec.color}15`,
                            border: `1px solid ${sec.color}25`,
                          }}
                        >
                          {sec.icon}
                        </div>
                        <div className={styles.cardInfo}>
                          <div className={styles.cardName}>{sec.name}</div>
                          <div className={styles.cardCount}>
                            {sec.symbols.length} stocks
                          </div>
                        </div>
                        <div className={styles.cardRight}>
                          <div
                            className={`${styles.cardChg} ${
                              up ? styles.up : styles.down
                            }`}
                          >
                            {up ? "▲" : "▼"} {Math.abs(chg).toFixed(2)}%
                          </div>
                          <div className={styles.chevron}>
                            {open ? "▲" : "▼"}
                          </div>
                        </div>
                      </div>
                    </div>
                    {open && (
                      <StockList symbols={sec.symbols} prices={prices} />
                    )}
                  </div>
                );
              })}
        </div>
      )}

      {tab === "Indices" && (
        <div className={styles.grid}>
          {INDICES.map((idx) => {
            const chg = avgChg(prices, idx.symbols);
            const up = chg >= 0;
            const open = selected === idx.key;
            return (
              <div key={idx.key} className={open ? styles.openWrap : ""}>
                <div
                  className={`${styles.card} ${open ? styles.cardOpen : ""}`}
                  style={{ "--c": "#6366f1" }}
                  onClick={() => toggle(idx.key)}
                >
                  <div className={styles.cardRow}>
                    <div
                      className={styles.iconBox}
                      style={{
                        background: "rgba(99,102,241,0.1)",
                        border: "1px solid rgba(99,102,241,0.2)",
                      }}
                    >
                      {idx.icon}
                    </div>
                    <div className={styles.cardInfo}>
                      <div className={styles.cardName}>{idx.name}</div>
                      <div className={styles.cardCount}>
                        {idx.symbols.length} constituents
                      </div>
                    </div>
                    <div className={styles.cardRight}>
                      <div
                        className={`${styles.cardChg} ${
                          up ? styles.up : styles.down
                        }`}
                      >
                        {up ? "▲" : "▼"} {Math.abs(chg).toFixed(2)}%
                      </div>
                      <div className={styles.chevron}>{open ? "▲" : "▼"}</div>
                    </div>
                  </div>
                </div>
                {open && <StockList symbols={idx.symbols} prices={prices} />}
              </div>
            );
          })}
        </div>
      )}

      {tab === "Nifty 50" && (
        <div className={styles.niftyWrap}>
          <div className={styles.niftyHead}>
            <span>Symbol</span>
            <span>Name</span>
            <span>Price</span>
            <span>Change</span>
            <span></span>
          </div>
          {NIFTY50_FULL.map((sym) => {
            const s = prices.find((p) => p.symbol === sym);
            const up = (s?.change ?? 0) >= 0;
            return (
              <div
                key={sym}
                className={styles.niftyRow}
                onClick={() => navigate(`/chart?symbol=${sym}`)}
              >
                <div className={styles.nSym}>{sym}</div>
                <div className={styles.nName}>
                  {s?.name?.split(" ").slice(0, 3).join(" ") || "—"}
                </div>
                <div className={styles.nPrice}>
                  {s
                    ? `₹${s.price.toLocaleString("en-IN", {
                        maximumFractionDigits: 0,
                      })}`
                    : "—"}
                </div>
                <div
                  className={`${styles.nChg} ${
                    s ? (up ? styles.up : styles.down) : ""
                  }`}
                >
                  {s
                    ? `${up ? "▲" : "▼"} ${Math.abs(
                        s.percentChange ?? 0
                      ).toFixed(2)}%`
                    : "—"}
                </div>
                <button
                  className={styles.tradeBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/trade");
                  }}
                >
                  Trade
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
