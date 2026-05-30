import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api.js";
import { usePrices } from "../../hooks/UsePrices.js";
import { useAuth } from "../../context/AuthContext.jsx";
import styles from "./Portfolio.module.css";

const COLORS = [
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
];

function HoldingCard({ h, idx, onClick }) {
  const up = (h.pnl ?? 0) >= 0;
  const pct =
    h.avgPrice > 0 ? ((h.currentPrice - h.avgPrice) / h.avgPrice) * 100 : 0;
  return (
    <div className={styles.holdCard} onClick={onClick}>
      <div className={styles.holdTop}>
        <div
          className={styles.holdLogo}
          style={{
            background: `linear-gradient(135deg,${
              COLORS[idx % COLORS.length]
            },${COLORS[idx % COLORS.length]}99)`,
          }}
        >
          {h.stock.slice(0, 2)}
        </div>
        <div className={styles.holdInfo}>
          <div className={styles.holdSym}>{h.stock}</div>
          <div className={styles.holdName}>
            {h.name?.split(" ").slice(0, 3).join(" ")}
          </div>
        </div>
        <div
          className={`${styles.holdPnlPill} ${
            up ? styles.pillUp : styles.pillDown
          }`}
        >
          {up ? "▲" : "▼"} {Math.abs(pct).toFixed(2)}%
        </div>
      </div>
      <div className={styles.holdStats}>
        <div className={styles.holdStat}>
          <div className={styles.holdStatLabel}>Current Value</div>
          <div className={styles.holdStatVal}>
            ₹{Math.round(h.value).toLocaleString("en-IN")}
          </div>
        </div>
        <div className={styles.holdStat}>
          <div className={styles.holdStatLabel}>Qty</div>
          <div className={styles.holdStatVal}>{h.quantity}</div>
        </div>
        <div className={styles.holdStat}>
          <div className={styles.holdStatLabel}>Avg Buy</div>
          <div className={styles.holdStatVal}>
            {h.avgPrice > 0
              ? `₹${h.avgPrice.toLocaleString("en-IN", {
                  maximumFractionDigits: 0,
                })}`
              : "—"}
          </div>
        </div>
      </div>
      <div className={`${styles.holdPnl} ${up ? styles.up : styles.down}`}>
        P&L: {up ? "+" : ""}₹
        {Math.abs(Math.round(h.pnl ?? 0)).toLocaleString("en-IN")}
      </div>
    </div>
  );
}

function OrderRow({ o, idx }) {
  const up = o.type === "buy";
  return (
    <div className={styles.orderRow}>
      <div
        className={`${styles.orderType} ${up ? styles.buyTag : styles.sellTag}`}
      >
        {o.type.toUpperCase()}
      </div>
      <div className={styles.orderSym}>{o.stock}</div>
      <div className={styles.orderQty}>{o.quantity} shares</div>
      <div className={styles.orderPrice}>
        ₹{(o.price ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
      </div>
      <div className={styles.orderTotal}>
        ₹{Math.round((o.price ?? 0) * o.quantity).toLocaleString("en-IN")}
      </div>
      <div className={styles.orderDate}>
        {new Date(o.createdAt).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "2-digit",
        })}
      </div>
    </div>
  );
}

export default function Portfolio() {
  const [holdings, setHoldings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("holdings");
  const { prices } = usePrices();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get("/portfolio"),
      api.get("/trade/orders").catch(() => ({ data: { orders: [] } })),
    ])
      .then(([ph, po]) => {
        setHoldings(ph.data.portfolio || []);
        setOrders(po.data.orders || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const enriched = holdings.map((h) => {
    const live = prices.find((p) => p.symbol === h.stock);
    const cur = live?.price ?? 0;
    return {
      ...h,
      currentPrice: cur,
      value: cur * h.quantity,
      name: live?.name || h.stock,
      pnl: h.avgPrice > 0 ? (cur - h.avgPrice) * h.quantity : 0,
    };
  });

  const balance = user?.balance ?? 0;
  const portfolioValue = enriched.reduce((s, h) => s + h.value, 0);
  const invested = enriched.reduce(
    (s, h) => s + (h.avgPrice ?? 0) * h.quantity,
    0
  );
  const totalPnL = enriched.reduce((s, h) => s + (h.pnl ?? 0), 0);
  const pnlPct = invested > 0 ? (totalPnL / invested) * 100 : 0;
  const isUp = totalPnL >= 0;

  const sells = orders.filter((o) => o.type === "sell");
  const buys = orders.filter((o) => o.type === "buy");
  const bMap = {};
  buys.forEach((b) => {
    if (!bMap[b.stock]) bMap[b.stock] = [];
    bMap[b.stock].push(b.price);
  });
  let wins = 0;
  sells.forEach((s) => {
    const bp = bMap[s.stock]?.shift() ?? s.price;
    if (s.price > bp) wins++;
  });
  const winRate =
    sells.length > 0 ? Math.round((wins / sells.length) * 100) : null;

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Portfolio</h1>
          <div className={styles.headerRight}>
            <button className={styles.btn} onClick={() => navigate("/trade")}>
              + New Trade
            </button>
          </div>
        </div>

        {/* Bento top row */}
        <div className={styles.bento}>
          {/* Hero: total assets */}
          <div className={styles.heroCard}>
            <div className={styles.heroLabel}>Total Assets</div>
            <div className={styles.heroVal}>
              ₹{Math.round(balance + portfolioValue).toLocaleString("en-IN")}
            </div>
            <div
              className={`${styles.heroPnl} ${isUp ? styles.up : styles.down}`}
            >
              {invested > 0
                ? `${isUp ? "▲ +" : "▼ "}₹${Math.abs(
                    Math.round(totalPnL)
                  ).toLocaleString("en-IN")} (${
                    isUp ? "+" : ""
                  }${pnlPct.toFixed(2)}%) all time`
                : "No open positions"}
            </div>
            <div className={styles.heroStats}>
              <div className={styles.heroStat}>
                <div className={styles.hsl}>Cash</div>
                <div className={styles.hsv}>
                  ₹{Math.round(balance).toLocaleString("en-IN")}
                </div>
              </div>
              <div className={styles.heroStat}>
                <div className={styles.hsl}>Invested</div>
                <div className={styles.hsv}>
                  {invested > 0
                    ? `₹${Math.round(invested).toLocaleString("en-IN")}`
                    : "—"}
                </div>
              </div>
              <div className={styles.heroStat}>
                <div className={styles.hsl}>Positions</div>
                <div className={styles.hsv}>{enriched.length}</div>
              </div>
            </div>
          </div>

          {/* Stat cards */}
          <div className={styles.statsCol}>
            <div className={styles.statCard}>
              <div className={styles.scLabel}>Unrealised P&L</div>
              <div
                className={`${styles.scVal} ${
                  invested > 0 ? (isUp ? styles.up : styles.down) : ""
                }`}
              >
                {invested > 0
                  ? `${isUp ? "+" : ""}₹${Math.abs(
                      Math.round(totalPnL)
                    ).toLocaleString("en-IN")}`
                  : "—"}
              </div>
              <div className={styles.scSub}>
                {invested > 0
                  ? `${isUp ? "+" : ""}${pnlPct.toFixed(2)}%`
                  : "Add holdings"}
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.scLabel}>Win Rate</div>
              <div
                className={`${styles.scVal} ${
                  winRate !== null
                    ? winRate >= 55
                      ? styles.up
                      : styles.down
                    : ""
                }`}
              >
                {winRate !== null ? `${winRate}%` : "—"}
              </div>
              <div className={styles.scSub}>
                {sells.length > 0
                  ? `${wins}W / ${sells.length - wins}L of ${
                      sells.length
                    } trades`
                  : "No closed trades yet"}
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.scLabel}>Total Orders</div>
              <div className={styles.scVal}>{orders.length || "—"}</div>
              <div className={styles.scSub}>
                {buys.length} buys · {sells.length} sells
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${
              tab === "holdings" ? styles.tabActive : ""
            }`}
            onClick={() => setTab("holdings")}
          >
            Holdings{" "}
            {enriched.length > 0 && (
              <span className={styles.badge}>{enriched.length}</span>
            )}
          </button>
          <button
            className={`${styles.tab} ${
              tab === "orders" ? styles.tabActive : ""
            }`}
            onClick={() => setTab("orders")}
          >
            Order History{" "}
            {orders.length > 0 && (
              <span className={styles.badge}>{orders.length}</span>
            )}
          </button>
        </div>

        {/* Holdings grid */}
        {tab === "holdings" &&
          (loading ? (
            <div className={styles.loadingText}>Loading holdings…</div>
          ) : enriched.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📭</div>
              <div className={styles.emptyTitle}>No holdings yet</div>
              <div className={styles.emptySub}>
                Start trading to build your portfolio
              </div>
              <button className={styles.btn} onClick={() => navigate("/trade")}>
                Go to Trade →
              </button>
            </div>
          ) : (
            <div className={styles.holdingsGrid}>
              {enriched.map((h, i) => (
                <HoldingCard
                  key={h.stock}
                  h={h}
                  idx={i}
                  onClick={() => navigate(`/chart?symbol=${h.stock}`)}
                />
              ))}
            </div>
          ))}

        {/* Orders list */}
        {tab === "orders" &&
          (loading ? (
            <div className={styles.loadingText}>Loading orders…</div>
          ) : orders.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📋</div>
              <div className={styles.emptyTitle}>No orders yet</div>
              <div className={styles.emptySub}>
                Place a trade to see your order history here
              </div>
              <button className={styles.btn} onClick={() => navigate("/trade")}>
                Start Trading →
              </button>
            </div>
          ) : (
            <div className={styles.ordersCard}>
              <div className={styles.orderHead}>
                <span>Type</span>
                <span>Symbol</span>
                <span>Qty</span>
                <span>Price</span>
                <span>Total</span>
                <span>Date</span>
              </div>
              {[...orders].reverse().map((o, i) => (
                <OrderRow key={i} o={o} idx={i} />
              ))}
            </div>
          ))}
      </div>
    </div>
  );
}
