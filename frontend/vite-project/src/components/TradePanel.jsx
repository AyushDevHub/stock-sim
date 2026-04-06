import { useState } from "react";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

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
        text: `${side.toUpperCase()} order placed @ ₹${data.order.price}`,
      });
      // update balance in context
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

  return (
    <div
      style={{
        background: "#0d1417",
        border: "1px solid #1a2428",
        borderRadius: "4px",
        padding: "20px",
      }}
    >
      <div
        style={{
          fontSize: "0.65rem",
          color: "#4a6370",
          letterSpacing: "0.12em",
          marginBottom: 16,
        }}
      >
        ORDER PANEL
      </div>

      {/* Side toggle */}
      <div
        style={{
          display: "flex",
          marginBottom: 16,
          border: "1px solid #1a2428",
          borderRadius: "3px",
          overflow: "hidden",
        }}
      >
        {["buy", "sell"].map((s) => (
          <button
            key={s}
            onClick={() => setSide(s)}
            style={{
              flex: 1,
              padding: "8px",
              fontSize: "0.7rem",
              letterSpacing: "0.1em",
              background:
                side === s
                  ? s === "buy"
                    ? "rgba(0,214,143,0.15)"
                    : "rgba(255,71,87,0.15)"
                  : "transparent",
              color:
                side === s ? (s === "buy" ? "#00d68f" : "#ff4757") : "#4a6370",
              border: "none",
              cursor: "pointer",
              fontFamily: "IBM Plex Mono, monospace",
              transition: "all 0.15s",
            }}
          >
            {s.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Symbol */}
      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            fontSize: "0.6rem",
            color: "#4a6370",
            marginBottom: 4,
            letterSpacing: "0.1em",
          }}
        >
          SYMBOL
        </div>
        <div style={{ fontSize: "0.85rem", color: "#ffb800", fontWeight: 600 }}>
          {symbol || "—"}
        </div>
      </div>

      {/* Price */}
      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            fontSize: "0.6rem",
            color: "#4a6370",
            marginBottom: 4,
            letterSpacing: "0.1em",
          }}
        >
          MARKET PRICE
        </div>
        <div style={{ fontSize: "0.85rem", color: "#c8d8de" }}>
          {price
            ? `₹${price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
            : "—"}
        </div>
      </div>

      {/* Qty */}
      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            fontSize: "0.6rem",
            color: "#4a6370",
            marginBottom: 4,
            letterSpacing: "0.1em",
          }}
        >
          QUANTITY
        </div>
        <input
          type="number"
          min="1"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          placeholder="0"
          style={{
            width: "100%",
            background: "#080c0e",
            border: "1px solid #1a2428",
            borderRadius: "3px",
            padding: "8px 10px",
            color: "#c8d8de",
            fontFamily: "IBM Plex Mono, monospace",
            fontSize: "0.85rem",
            outline: "none",
          }}
        />
      </div>

      {/* Total */}
      {total && (
        <div
          style={{
            marginBottom: 16,
            padding: "8px 10px",
            background: "#080c0e",
            border: "1px solid #1a2428",
            borderRadius: "3px",
          }}
        >
          <div
            style={{
              fontSize: "0.6rem",
              color: "#4a6370",
              letterSpacing: "0.1em",
            }}
          >
            ESTIMATED TOTAL
          </div>
          <div style={{ fontSize: "0.9rem", color: "#ffb800", marginTop: 2 }}>
            ₹{Number(total).toLocaleString("en-IN")}
          </div>
        </div>
      )}

      {/* Balance */}
      <div style={{ marginBottom: 16, fontSize: "0.65rem", color: "#4a6370" }}>
        BALANCE:{" "}
        <span style={{ color: "#00d68f" }}>
          ₹{Number(user?.balance || 0).toLocaleString("en-IN")}
        </span>
      </div>

      <button
        onClick={submit}
        disabled={loading || !symbol}
        style={{
          width: "100%",
          padding: "10px",
          fontSize: "0.75rem",
          letterSpacing: "0.12em",
          background:
            side === "buy" ? "rgba(0,214,143,0.15)" : "rgba(255,71,87,0.15)",
          border: `1px solid ${side === "buy" ? "#00d68f" : "#ff4757"}`,
          color: side === "buy" ? "#00d68f" : "#ff4757",
          borderRadius: "3px",
          cursor: loading ? "wait" : "pointer",
          fontFamily: "IBM Plex Mono, monospace",
          transition: "all 0.15s",
          opacity: !symbol || loading ? 0.4 : 1,
        }}
      >
        {loading ? "PLACING..." : `PLACE ${side.toUpperCase()} ORDER`}
      </button>

      {msg && (
        <div
          style={{
            marginTop: 12,
            padding: "8px 10px",
            borderRadius: "3px",
            fontSize: "0.7rem",
            background:
              msg.type === "success"
                ? "rgba(0,214,143,0.1)"
                : "rgba(255,71,87,0.1)",
            border: `1px solid ${
              msg.type === "success" ? "#00d68f33" : "#ff475733"
            }`,
            color: msg.type === "success" ? "#00d68f" : "#ff4757",
          }}
        >
          {msg.text}
        </div>
      )}
    </div>
  );
}
