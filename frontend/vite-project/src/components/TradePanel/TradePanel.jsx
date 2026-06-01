import { useState, useMemo } from "react";
import api from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import styles from "./TradePanel.module.css";

/* ── Order types & their required extra fields ── */
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

const VALIDITY = [
  { value: "DAY", label: "DAY", tip: "Valid for today's session only" },
  {
    value: "GTC",
    label: "GTC",
    tip: "Good Till Cancelled – stays open until filled or cancelled",
  },
  {
    value: "IOC",
    label: "IOC",
    tip: "Immediate or Cancel – execute instantly, cancel remainder",
  },
  {
    value: "FOK",
    label: "FOK",
    tip: "Fill or Kill – fill entire quantity instantly or cancel",
  },
];

/* ── Indian brokerage estimate (matches backend) ── */
function estimateBrokerage(tradeValue, side) {
  if (!tradeValue || tradeValue <= 0) return null;
  const brokerage = Math.min(tradeValue * 0.0003, 20);
  const stt = tradeValue * (side === "buy" ? 0.001 : 0.001);
  const txn = tradeValue * 0.0000322;
  const sebi = tradeValue * 0.000001;
  const stamp = side === "buy" ? tradeValue * 0.00015 : 0;
  const gst = (brokerage + txn + sebi) * 0.18;
  const total = brokerage + stt + txn + sebi + stamp + gst;
  return { brokerage, stt, txn, sebi, stamp, gst, total };
}

function fmt(n) {
  if (n == null) return "—";
  return (
    "₹" +
    Number(n).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export default function TradePanel({ symbol, price }) {
  const { user, login } = useAuth();
  const [qty, setQty] = useState("");
  const [side, setSide] = useState("buy");
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
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const selectedType = ORDER_TYPES.find((t) => t.value === orderType);
  const extraFields = selectedType?.extra ?? [];

  /* execution price used for estimate */
  const execPrice = useMemo(() => {
    if (
      orderType === "LIMIT" ||
      orderType === "STOP_LOSS_LIMIT" ||
      orderType === "TRAILING_STOP_LIMIT" ||
      orderType === "OCO"
    )
      return parseFloat(extra.limitPrice) || price;
    return price;
  }, [orderType, extra.limitPrice, price]);

  const tradeValue = execPrice && qty ? execPrice * Number(qty) : null;
  const brokEst = estimateBrokerage(tradeValue, side);

  const netValue =
    tradeValue && brokEst
      ? side === "buy"
        ? tradeValue + brokEst.total
        : tradeValue - brokEst.total
      : null;

  const setExtraField = (key, val) => setExtra((p) => ({ ...p, [key]: val }));

  const submit = async () => {
    if (!qty || Number(qty) <= 0)
      return setMsg({ type: "error", text: "Enter valid quantity" });
    setLoading(true);
    setMsg(null);
    try {
      const payload = { symbol, quantity: Number(qty), orderType, validity };
      extraFields.forEach((f) => {
        if (extra[f]) payload[f] = Number(extra[f]);
      });

      const { data } = await api.post(`/trade/${side}`, payload);
      setMsg({
        type: "success",
        text: data.order?.price
          ? `${side.toUpperCase()} @ ${fmt(data.order.price)} · Charges: ${fmt(
              data.order.brokerage?.total
            )}`
          : `Order placed (${data.order?.status ?? "OPEN"})`,
      });
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      const updated = { ...stored, balance: data.balance };
      localStorage.setItem("user", JSON.stringify(updated));
      login(updated, localStorage.getItem("token"));
      setQty("");
    } catch (e) {
      setMsg({
        type: "error",
        text: e.response?.data?.message || "Order failed",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!symbol)
    return <div className={styles.empty}>← Select a stock to trade</div>;

  return (
    <div className={styles.panel}>
      <div className={styles.sectionTitle}>ORDER PANEL</div>

      {/* ── BUY / SELL toggle ── */}
      <div className={styles.toggle}>
        {["buy", "sell"].map((s) => (
          <button
            key={s}
            className={`${styles.toggleBtn} ${
              side === s
                ? s === "buy"
                  ? styles.toggleBuy
                  : styles.toggleSell
                : ""
            }`}
            onClick={() => setSide(s)}
          >
            {s.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ── Symbol & price ── */}
      <div className={styles.row2}>
        <div className={styles.field}>
          <div className={styles.label}>SYMBOL</div>
          <div className={`${styles.value} ${styles.valueAmber}`}>{symbol}</div>
        </div>
        <div className={styles.field}>
          <div className={styles.label}>MARKET PRICE</div>
          <div className={styles.value}>{price ? fmt(price) : "—"}</div>
        </div>
      </div>

      {/* ── Order type ── */}
      <div className={styles.field}>
        <div className={styles.label}>ORDER TYPE</div>
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
      <div className={styles.field}>
        <div className={styles.label}>VALIDITY</div>
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

      {/* ── Quantity ── */}
      <div className={styles.field}>
        <div className={styles.label}>QUANTITY</div>
        <input
          type="number"
          min="1"
          value={qty}
          placeholder="0"
          onChange={(e) => setQty(e.target.value)}
          className={styles.input}
        />
      </div>

      {/* ── Dynamic extra fields ── */}
      {extraFields.includes("limitPrice") && (
        <div className={styles.field}>
          <div className={styles.label}>LIMIT PRICE (₹)</div>
          <input
            type="number"
            min="0"
            step="0.05"
            placeholder="e.g. 2450.00"
            value={extra.limitPrice}
            onChange={(e) => setExtraField("limitPrice", e.target.value)}
            className={styles.input}
          />
        </div>
      )}
      {extraFields.includes("stopPrice") && (
        <div className={styles.field}>
          <div className={styles.label}>STOP / TRIGGER PRICE (₹)</div>
          <input
            type="number"
            min="0"
            step="0.05"
            placeholder="e.g. 2380.00"
            value={extra.stopPrice}
            onChange={(e) => setExtraField("stopPrice", e.target.value)}
            className={styles.input}
          />
        </div>
      )}
      {extraFields.includes("trailAmount") && (
        <div className={styles.row2}>
          <div className={styles.field}>
            <div className={styles.label}>TRAIL ₹</div>
            <input
              type="number"
              min="0"
              step="0.05"
              placeholder="e.g. 50"
              value={extra.trailAmount}
              onChange={(e) => setExtraField("trailAmount", e.target.value)}
              className={styles.input}
            />
          </div>
          <div className={styles.field}>
            <div className={styles.label}>TRAIL %</div>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 2"
              value={extra.trailPercent}
              onChange={(e) => setExtraField("trailPercent", e.target.value)}
              className={styles.input}
            />
          </div>
        </div>
      )}
      {extraFields.includes("bracketTarget") && (
        <div className={styles.row2}>
          <div className={styles.field}>
            <div className={styles.label}>TARGET PRICE (₹)</div>
            <input
              type="number"
              min="0"
              step="0.05"
              placeholder="Target"
              value={extra.bracketTarget}
              onChange={(e) => setExtraField("bracketTarget", e.target.value)}
              className={styles.input}
            />
          </div>
          <div className={styles.field}>
            <div className={styles.label}>STOP-LOSS (₹)</div>
            <input
              type="number"
              min="0"
              step="0.05"
              placeholder="Stop"
              value={extra.bracketStopLoss}
              onChange={(e) => setExtraField("bracketStopLoss", e.target.value)}
              className={styles.input}
            />
          </div>
        </div>
      )}

      {/* ── Brokerage preview ── */}
      {brokEst && tradeValue > 0 && (
        <div className={styles.brokerageBox}>
          <button
            className={styles.brokerageToggle}
            onClick={() => setShowBreakdown((b) => !b)}
          >
            <span>CHARGES</span>
            <span className={styles.brokerageTotal}>{fmt(brokEst.total)}</span>
            <span className={styles.chevron}>{showBreakdown ? "▲" : "▼"}</span>
          </button>
          {showBreakdown && (
            <div className={styles.breakdown}>
              <Row label="Brokerage" val={brokEst.brokerage} />
              <Row label="STT" val={brokEst.stt} />
              <Row label="Exchange (NSE)" val={brokEst.txn} />
              <Row label="SEBI charges" val={brokEst.sebi} />
              {side === "buy" && <Row label="Stamp duty" val={brokEst.stamp} />}
              <Row label="GST (18%)" val={brokEst.gst} />
              <div className={styles.breakdownDivider} />
              <Row label="Net payable" val={netValue} highlight />
            </div>
          )}
        </div>
      )}

      {/* ── Balance ── */}
      <div className={styles.balance}>
        BALANCE:{" "}
        <span className={styles.balanceAmt}>{fmt(user?.balance ?? 0)}</span>
      </div>

      {/* ── CTA ── */}
      <button
        onClick={submit}
        disabled={loading}
        className={`${side === "buy" ? styles.btnBuy : styles.btnSell} ${
          loading ? styles.btnDisabled : ""
        }`}
      >
        {loading
          ? "PLACING…"
          : `PLACE ${side.toUpperCase()} · ${selectedType?.label ?? orderType}`}
      </button>

      {msg && (
        <div
          className={
            msg.type === "success" ? styles.msgSuccess : styles.msgError
          }
        >
          {msg.text}
        </div>
      )}
    </div>
  );
}

function Row({ label, val, highlight }) {
  return (
    <div
      className={`${styles.breakdownRow} ${
        highlight ? styles.breakdownHighlight : ""
      }`}
    >
      <span>{label}</span>
      <span>{typeof val === "number" ? fmt(val) : val}</span>
    </div>
  );
}
