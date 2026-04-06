import { useState } from "react";
import api from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import styles from "./TradePanel.module.css";

export default function TradePanel({ symbol, price }) {
  const { user, login } = useAuth();
  const [qty, setQty] = useState("");
  const [side, setSide] = useState("buy");
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const total = price && qty ? (price * Number(qty)).toFixed(2) : null;

  const submit = async () => {
    if (!qty || Number(qty) <= 0)
      return setMsg({ type: "error", text: "Enter valid quantity" });
    setLoading(true);
    setMsg(null);
    try {
      const { data } = await api.post(`/trade/${side}`, {
        symbol,
        quantity: Number(qty),
      });
      setMsg({
        type: "success",
        text: `${side.toUpperCase()} @ ₹${data.order.price}`,
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

      {/* Side toggle */}
      <div className={styles.toggle}>
        <button
          className={`${styles.toggleBtn} ${
            side === "buy" ? styles.toggleBuy : ""
          }`}
          onClick={() => setSide("buy")}
        >
          BUY
        </button>
        <button
          className={`${styles.toggleBtn} ${
            side === "sell" ? styles.toggleSell : ""
          }`}
          onClick={() => setSide("sell")}
        >
          SELL
        </button>
      </div>

      {/* Symbol */}
      <div className={styles.field}>
        <div className={styles.label}>SYMBOL</div>
        <div className={`${styles.value} ${styles.valueAmber}`}>{symbol}</div>
      </div>

      {/* Price */}
      <div className={styles.field}>
        <div className={styles.label}>MARKET PRICE</div>
        <div className={styles.value}>
          {price
            ? `₹${price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
            : "—"}
        </div>
      </div>

      {/* Quantity */}
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

      {/* Total */}
      {total && (
        <div className={styles.totalBox}>
          <div className={styles.label}>ESTIMATED TOTAL</div>
          <div className={styles.totalAmt}>
            ₹{Number(total).toLocaleString("en-IN")}
          </div>
        </div>
      )}

      <div className={styles.balance}>
        BALANCE:{" "}
        <span className={styles.balanceAmt}>
          ₹{Number(user?.balance || 0).toLocaleString("en-IN")}
        </span>
      </div>

      <button
        onClick={submit}
        disabled={loading}
        className={`${side === "buy" ? styles.btnBuy : styles.btnSell} ${
          loading ? styles.btnDisabled : ""
        }`}
      >
        {loading ? "PLACING..." : `PLACE ${side.toUpperCase()} ORDER`}
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
