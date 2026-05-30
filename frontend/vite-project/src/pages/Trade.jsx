import { useState } from "react";
import { usePrices } from "../hooks/UsePrices.js";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import styles from "./Trade.module.css";

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

export default function Trade() {
  const { prices, loading } = usePrices();
  const { user, login } = useAuth();
  const [selected, setSelected] = useState(null);
  const [side, setSide] = useState("buy");
  const [qty, setQty] = useState("");
  const [query, setQuery] = useState("");
  const [msg, setMsg] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [mobilePanel, setMobilePanel] = useState(false);

  const stock = prices.find((p) => p.symbol === selected);
  const total = stock?.price && qty ? stock.price * Number(qty) : null;
  const up = (stock?.change ?? 0) >= 0;

  const filtered = prices.filter(
    (s) =>
      !query ||
      s.symbol.includes(query.toUpperCase()) ||
      s.name?.toUpperCase().includes(query.toUpperCase())
  );

  const handleSelect = (sym) => {
    setSelected(sym);
    setQty("");
    setMsg(null);
    setMobilePanel(true);
  };

  const submit = async () => {
    if (!qty || Number(qty) <= 0)
      return setMsg({ type: "error", text: "Enter a valid quantity" });
    setSubmitting(true);
    setMsg(null);
    try {
      const { data } = await api.post(`/trade/${side}`, {
        symbol: selected,
        quantity: Number(qty),
      });
      setMsg({
        type: "success",
        text: `✓ ${
          side === "buy" ? "Bought" : "Sold"
        } ${qty} × ${selected} @ ₹${data.order.price}`,
      });
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      const updated = { ...stored, balance: data.balance };
      localStorage.setItem("user", JSON.stringify(updated));
      login(updated, localStorage.getItem("token"));
      setQty("");
    } catch (e) {
      setMsg({
        type: "error",
        text: e.response?.data?.message || "Order failed. Try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        {/* Page header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Trade</h1>
            <p className={styles.pageSub}>
              Search and place orders on NSE stocks
            </p>
          </div>
          {user && (
            <div className={styles.balanceChip}>
              <span className={styles.balLabel}>Balance</span>
              <span className={styles.balVal}>
                ₹
                {Number(user.balance ?? 0).toLocaleString("en-IN", {
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
          )}
        </div>

        <div className={styles.layout}>
          {/* ── Stock list ── */}
          <div
            className={`${styles.stocksPanel} ${
              mobilePanel ? styles.hideOnMobile : ""
            }`}
          >
            <div className={styles.search}>
              <svg
                width="14"
                height="14"
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
                placeholder="Search symbol or company…"
              />
              {query && (
                <button
                  className={styles.clearBtn}
                  onClick={() => setQuery("")}
                >
                  ✕
                </button>
              )}
            </div>

            <div className={styles.stockList}>
              {loading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className={styles.skelRow} />
                  ))
                : filtered.map((s, i) => {
                    const isSelected = selected === s.symbol;
                    const sUp = (s.change ?? 0) >= 0;
                    return (
                      <div
                        key={s.symbol}
                        className={`${styles.stockRow} ${
                          isSelected ? styles.stockSelected : ""
                        }`}
                        onClick={() => handleSelect(s.symbol)}
                      >
                        <div
                          className={styles.sLogo}
                          style={{
                            background: `linear-gradient(135deg,${
                              COLORS[i % COLORS.length]
                            },${COLORS[i % COLORS.length]}99)`,
                          }}
                        >
                          {s.symbol.slice(0, 2)}
                        </div>
                        <div className={styles.sInfo}>
                          <div className={styles.sSym}>{s.symbol}</div>
                          <div className={styles.sName}>
                            {s.name?.slice(0, 28)}
                          </div>
                        </div>
                        <div className={styles.sRight}>
                          <div className={styles.sPrice}>
                            ₹
                            {(s.price ?? 0).toLocaleString("en-IN", {
                              maximumFractionDigits: 0,
                            })}
                          </div>
                          <div
                            className={`${styles.sChg} ${
                              sUp ? styles.up : styles.down
                            }`}
                          >
                            {sUp ? "▲" : "▼"}{" "}
                            {Math.abs(s.percentChange ?? 0).toFixed(2)}%
                          </div>
                        </div>
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#3a5060"
                          strokeWidth="2"
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </div>
                    );
                  })}
            </div>
          </div>

          {/* ── Order Panel ── */}
          <div
            className={`${styles.orderPanel} ${
              mobilePanel && selected ? styles.showOnMobile : ""
            }`}
          >
            {mobilePanel && (
              <button
                className={styles.backBtn}
                onClick={() => setMobilePanel(false)}
              >
                ← Back to stocks
              </button>
            )}

            {!selected ? (
              <div className={styles.emptyPanel}>
                <div className={styles.emptyIcon}>👈</div>
                <div className={styles.emptyTitle}>Select a stock</div>
                <div className={styles.emptySub}>
                  Pick any stock from the list to place an order
                </div>
              </div>
            ) : (
              <div className={styles.orderCard}>
                {/* Stock info */}
                <div className={styles.orderStock}>
                  <div>
                    <div className={styles.orderSym}>{selected}</div>
                    <div className={styles.orderName}>{stock?.name}</div>
                  </div>
                  <div className={styles.orderPriceBlock}>
                    <div className={styles.orderPrice}>
                      ₹
                      {(stock?.price ?? 0).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <div
                      className={`${styles.orderChange} ${
                        up ? styles.up : styles.down
                      }`}
                    >
                      {up ? "▲" : "▼"} {Math.abs(stock?.change ?? 0).toFixed(2)}{" "}
                      ({Math.abs(stock?.percentChange ?? 0).toFixed(2)}%)
                    </div>
                  </div>
                </div>

                {/* OHLC */}
                <div className={styles.ohlc}>
                  {[
                    ["O", stock?.open],
                    ["H", stock?.high],
                    ["L", stock?.low],
                    ["C", stock?.previousClose],
                  ].map(([l, v]) => (
                    <div key={l} className={styles.ohlcItem}>
                      <div className={styles.ohlcLabel}>{l}</div>
                      <div className={styles.ohlcVal}>
                        {v
                          ? `₹${v.toLocaleString("en-IN", {
                              maximumFractionDigits: 0,
                            })}`
                          : "—"}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Buy / Sell toggle */}
                <div className={styles.sideToggle}>
                  <button
                    className={`${styles.sideBtn} ${
                      side === "buy" ? styles.sideBuy : ""
                    }`}
                    onClick={() => {
                      setSide("buy");
                      setMsg(null);
                    }}
                  >
                    Buy
                  </button>
                  <button
                    className={`${styles.sideBtn} ${
                      side === "sell" ? styles.sideSell : ""
                    }`}
                    onClick={() => {
                      setSide("sell");
                      setMsg(null);
                    }}
                  >
                    Sell
                  </button>
                </div>

                {/* Qty */}
                <div className={styles.qtyRow}>
                  <div className={styles.qtyLabel}>Quantity</div>
                  <div className={styles.qtyInput}>
                    <button
                      className={styles.qtyBtn}
                      onClick={() =>
                        setQty((q) =>
                          Math.max(1, (Number(q) || 0) - 1).toString()
                        )
                      }
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                      placeholder="0"
                      className={styles.qtyField}
                    />
                    <button
                      className={styles.qtyBtn}
                      onClick={() =>
                        setQty((q) => (Number(q || 0) + 1).toString())
                      }
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Total */}
                {total !== null && (
                  <div className={styles.totalRow}>
                    <span className={styles.totalLabel}>Estimated Total</span>
                    <span className={styles.totalVal}>
                      ₹
                      {total.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                )}

                {/* Message */}
                {msg && (
                  <div
                    className={`${styles.msg} ${
                      msg.type === "success"
                        ? styles.msgSuccess
                        : styles.msgError
                    }`}
                  >
                    {msg.text}
                  </div>
                )}

                {/* Submit */}
                <button
                  className={`${styles.submitBtn} ${
                    side === "buy" ? styles.submitBuy : styles.submitSell
                  }`}
                  onClick={submit}
                  disabled={submitting || !qty}
                >
                  {submitting
                    ? "Processing…"
                    : side === "buy"
                    ? `Buy ${selected}`
                    : `Sell ${selected}`}
                </button>

                <div className={styles.balLine}>
                  Available:{" "}
                  <span>
                    ₹
                    {Number(user?.balance ?? 0).toLocaleString("en-IN", {
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
