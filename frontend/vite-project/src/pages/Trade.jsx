import { useState, useMemo } from "react";
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

/* ── Order types ── */
const ORDER_TYPES = [
  { value: "MARKET", label: "Market", extra: [] },
  { value: "LIMIT", label: "Limit", extra: ["limitPrice"] },
  { value: "STOP_LOSS", label: "Stop-Loss (SL)", extra: ["stopPrice"] },
  {
    value: "STOP_LOSS_LIMIT",
    label: "SL-Limit",
    extra: ["stopPrice", "limitPrice"],
  },
  { value: "TRAILING_STOP", label: "Trailing Stop", extra: ["trailAmount"] },
  {
    value: "TRAILING_STOP_LIMIT",
    label: "Trail SL-Limit",
    extra: ["trailAmount", "limitPrice"],
  },
  {
    value: "BRACKET",
    label: "Bracket (BO)",
    extra: ["bracketTarget", "bracketStopLoss"],
  },
  { value: "OCO", label: "OCO", extra: ["limitPrice", "stopPrice"] },
];

/* ── Validity ── */
const VALIDITY = [
  { value: "DAY", label: "DAY", tip: "Valid for today's session only" },
  { value: "GTC", label: "GTC", tip: "Good Till Cancelled" },
  { value: "IOC", label: "IOC", tip: "Immediate or Cancel" },
  { value: "FOK", label: "FOK", tip: "Fill or Kill" },
];

/* ── Brokerage estimate (mirrors backend) ── */
function estimateBrokerage(tradeValue, side) {
  if (!tradeValue || tradeValue <= 0) return null;
  const brokerage = Math.min(tradeValue * 0.0003, 20);
  const stt = tradeValue * 0.001;
  const txn = tradeValue * 0.0000322;
  const sebi = tradeValue * 0.000001;
  const stamp = side === "buy" ? tradeValue * 0.00015 : 0;
  const gst = (brokerage + txn + sebi) * 0.18;
  const total = brokerage + stt + txn + sebi + stamp + gst;
  return { brokerage, stt, txn, sebi, stamp, gst, total };
}

function fmtPrice(n, dec = 2) {
  if (n == null) return "—";
  return (
    "₹" +
    Number(n).toLocaleString("en-IN", {
      minimumFractionDigits: dec,
      maximumFractionDigits: dec,
    })
  );
}

export default function Trade() {
  const { prices, loading } = usePrices();
  const { user, login } = useAuth();

  /* stock selection */
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");
  const [mobilePanel, setMobilePanel] = useState(false);

  /* order fields */
  const [side, setSide] = useState("buy");
  const [qty, setQty] = useState("");
  const [orderType, setOrderType] = useState("MARKET");
  const [validity, setValidity] = useState("DAY");
  const [extra, setExtra] = useState({
    limitPrice: "",
    stopPrice: "",
    trailAmount: "",
    trailPercent: "",
    bracketTarget: "",
    bracketStopLoss: "",
  });
  const [showBreakdown, setShowBreakdown] = useState(false);

  /* feedback */
  const [msg, setMsg] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const stock = prices.find((p) => p.symbol === selected);
  const up = (stock?.change ?? 0) >= 0;
  const selectedType = ORDER_TYPES.find((t) => t.value === orderType);
  const extraFields = selectedType?.extra ?? [];

  const setExtraField = (k, v) => setExtra((p) => ({ ...p, [k]: v }));

  /* execution price for estimate */
  const execPrice = useMemo(() => {
    if (
      ["LIMIT", "STOP_LOSS_LIMIT", "TRAILING_STOP_LIMIT", "OCO"].includes(
        orderType
      )
    )
      return parseFloat(extra.limitPrice) || stock?.price;
    return stock?.price;
  }, [orderType, extra.limitPrice, stock?.price]);

  const tradeValue = execPrice && qty ? execPrice * Number(qty) : null;
  const brokEst = estimateBrokerage(tradeValue, side);
  const netValue =
    tradeValue && brokEst
      ? side === "buy"
        ? tradeValue + brokEst.total
        : tradeValue - brokEst.total
      : null;

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
    setOrderType("MARKET");
    setValidity("DAY");
    setExtra({
      limitPrice: "",
      stopPrice: "",
      trailAmount: "",
      trailPercent: "",
      bracketTarget: "",
      bracketStopLoss: "",
    });
    setMobilePanel(true);
  };

  const submit = async () => {
    if (!qty || Number(qty) <= 0)
      return setMsg({ type: "error", text: "Enter a valid quantity" });
    setSubmitting(true);
    setMsg(null);
    try {
      const payload = {
        symbol: selected,
        quantity: Number(qty),
        orderType,
        validity,
      };
      extraFields.forEach((f) => {
        if (extra[f]) payload[f] = Number(extra[f]);
      });

      const { data } = await api.post(`/trade/${side}`, payload);

      const execed = data.order?.status === "EXECUTED" || !data.order?.status;
      setMsg({
        type: "success",
        text: execed
          ? `✓ ${
              side === "buy" ? "Bought" : "Sold"
            } ${qty} × ${selected} @ ${fmtPrice(
              data.order?.price
            )} · Charges: ${fmtPrice(
              data.order?.brokerage?.total ?? data.order?.brokerage
            )}`
          : `Order placed (${data.order?.status}) — ${selectedType?.label}`,
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
        {/* ── Page header ── */}
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
                {/* ── Stock header ── */}
                <div className={styles.orderStock}>
                  <div>
                    <div className={styles.orderSym}>{selected}</div>
                    <div className={styles.orderName}>{stock?.name}</div>
                  </div>
                  <div className={styles.orderPriceBlock}>
                    <div className={styles.orderPrice}>
                      {fmtPrice(stock?.price)}
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

                {/* ── OHLC ── */}
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

                {/* ── Buy / Sell toggle ── */}
                <div className={styles.sideToggle}>
                  {["buy", "sell"].map((s) => (
                    <button
                      key={s}
                      className={`${styles.sideBtn} ${
                        side === s
                          ? s === "buy"
                            ? styles.sideBuy
                            : styles.sideSell
                          : ""
                      }`}
                      onClick={() => {
                        setSide(s);
                        setMsg(null);
                      }}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>

                {/* ── Order Type ── */}
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>ORDER TYPE</label>
                  <select
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value)}
                    className={styles.select}
                  >
                    {ORDER_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* ── Validity ── */}
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>VALIDITY</label>
                  <div className={styles.validityRow}>
                    {VALIDITY.map((v) => (
                      <button
                        key={v.value}
                        title={v.tip}
                        className={`${styles.validBtn} ${
                          validity === v.value ? styles.validActive : ""
                        }`}
                        onClick={() => setValidity(v.value)}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Limit price ── */}
                {extraFields.includes("limitPrice") && (
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>LIMIT PRICE (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.05"
                      placeholder="e.g. 2450.00"
                      value={extra.limitPrice}
                      onChange={(e) =>
                        setExtraField("limitPrice", e.target.value)
                      }
                      className={styles.fieldInput}
                    />
                  </div>
                )}

                {/* ── Stop / trigger price ── */}
                {extraFields.includes("stopPrice") && (
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>
                      STOP / TRIGGER PRICE (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.05"
                      placeholder="e.g. 2380.00"
                      value={extra.stopPrice}
                      onChange={(e) =>
                        setExtraField("stopPrice", e.target.value)
                      }
                      className={styles.fieldInput}
                    />
                  </div>
                )}

                {/* ── Trail amount ── */}
                {extraFields.includes("trailAmount") && (
                  <div className={styles.twoCol}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>TRAIL ₹</label>
                      <input
                        type="number"
                        min="0"
                        step="0.05"
                        placeholder="e.g. 50"
                        value={extra.trailAmount}
                        onChange={(e) =>
                          setExtraField("trailAmount", e.target.value)
                        }
                        className={styles.fieldInput}
                      />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>TRAIL %</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="e.g. 2"
                        value={extra.trailPercent}
                        onChange={(e) =>
                          setExtraField("trailPercent", e.target.value)
                        }
                        className={styles.fieldInput}
                      />
                    </div>
                  </div>
                )}

                {/* ── Bracket target + stop-loss ── */}
                {extraFields.includes("bracketTarget") && (
                  <div className={styles.twoCol}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>TARGET (₹)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.05"
                        placeholder="Target"
                        value={extra.bracketTarget}
                        onChange={(e) =>
                          setExtraField("bracketTarget", e.target.value)
                        }
                        className={styles.fieldInput}
                      />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>STOP-LOSS (₹)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.05"
                        placeholder="Stop"
                        value={extra.bracketStopLoss}
                        onChange={(e) =>
                          setExtraField("bracketStopLoss", e.target.value)
                        }
                        className={styles.fieldInput}
                      />
                    </div>
                  </div>
                )}

                {/* ── Quantity ── */}
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

                {/* ── Estimated total ── */}
                {tradeValue != null && (
                  <div className={styles.totalRow}>
                    <span className={styles.totalLabel}>Est. trade value</span>
                    <span className={styles.totalVal}>
                      {fmtPrice(tradeValue)}
                    </span>
                  </div>
                )}

                {/* ── Brokerage breakdown ── */}
                {brokEst && tradeValue > 0 && (
                  <div className={styles.brokerageBox}>
                    <button
                      className={styles.brokerageToggle}
                      onClick={() => setShowBreakdown((b) => !b)}
                    >
                      <span className={styles.brokLabel}>CHARGES</span>
                      <div className={styles.brokRight}>
                        <span className={styles.brokTotal}>
                          {fmtPrice(brokEst.total)}
                        </span>
                        <span className={styles.chevron}>
                          {showBreakdown ? "▲" : "▼"}
                        </span>
                      </div>
                    </button>
                    {showBreakdown && (
                      <div className={styles.breakdown}>
                        {[
                          ["Brokerage", brokEst.brokerage],
                          ["STT", brokEst.stt],
                          ["Exchange (NSE)", brokEst.txn],
                          ["SEBI charges", brokEst.sebi],
                          ...(side === "buy"
                            ? [["Stamp duty", brokEst.stamp]]
                            : []),
                          ["GST (18%)", brokEst.gst],
                        ].map(([label, val]) => (
                          <div key={label} className={styles.bRow}>
                            <span>{label}</span>
                            <span>{fmtPrice(val, 4)}</span>
                          </div>
                        ))}
                        <div className={styles.bDivider} />
                        <div className={`${styles.bRow} ${styles.bRowNet}`}>
                          <span>
                            {side === "buy" ? "Net payable" : "Net proceeds"}
                          </span>
                          <span>{fmtPrice(netValue)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Message ── */}
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

                {/* ── Submit ── */}
                <button
                  className={`${styles.submitBtn} ${
                    side === "buy" ? styles.submitBuy : styles.submitSell
                  }`}
                  onClick={submit}
                  disabled={submitting || !qty}
                >
                  {submitting
                    ? "Processing…"
                    : `${side === "buy" ? "Buy" : "Sell"} ${selected} · ${
                        selectedType?.label
                      }`}
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
