import { useRef, useEffect } from "react";

export default function PriceRow({ stock, onSelect }) {
  const ref = useRef(null);
  const prevDir = useRef("flat");

  useEffect(() => {
    if (!ref.current || stock.direction === "flat") return;
    if (stock.direction === prevDir.current) return;
    prevDir.current = stock.direction;
    ref.current.classList.remove("flash-up", "flash-down");
    void ref.current.offsetWidth;
    ref.current.classList.add(
      stock.direction === "up" ? "flash-up" : "flash-down"
    );
  }, [stock.price, stock.direction]);

  const isUp = stock.change >= 0;

  return (
    <tr
      ref={ref}
      onClick={() => onSelect(stock.symbol)}
      style={{
        borderBottom: "1px solid #1a2428",
        cursor: "pointer",
        transition: "background 0.15s",
      }}
      className="hover:bg-[#0d1417]"
    >
      <td style={{ padding: "10px 16px" }}>
        <div style={{ fontWeight: 600, fontSize: "0.8rem", color: "#c8d8de" }}>
          {stock.symbol}
        </div>
        <div style={{ fontSize: "0.65rem", color: "#4a6370", marginTop: 2 }}>
          {stock.name?.slice(0, 28)}
        </div>
      </td>
      <td
        style={{
          padding: "10px 16px",
          textAlign: "right",
          fontSize: "0.85rem",
          fontWeight: 600,
          color: "#c8d8de",
        }}
      >
        ₹
        {stock.price?.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </td>
      <td
        style={{
          padding: "10px 16px",
          textAlign: "right",
          fontSize: "0.75rem",
          color: isUp ? "#00d68f" : "#ff4757",
        }}
      >
        {isUp ? "▲" : "▼"} {Math.abs(stock.change).toFixed(2)}
      </td>
      <td
        style={{
          padding: "10px 16px",
          textAlign: "right",
          fontSize: "0.75rem",
          color: isUp ? "#00d68f" : "#ff4757",
        }}
      >
        {isUp ? "+" : ""}
        {stock.percentChange?.toFixed(2)}%
      </td>
      <td
        style={{
          padding: "10px 16px",
          textAlign: "right",
          fontSize: "0.7rem",
          color: "#4a6370",
        }}
      >
        {stock.volume?.toLocaleString("en-IN")}
      </td>
      <td style={{ padding: "10px 16px", textAlign: "center" }}>
        <span
          style={{
            fontSize: "0.6rem",
            padding: "2px 6px",
            borderRadius: "2px",
            background:
              stock.marketState === "REGULAR"
                ? "rgba(0,214,143,0.12)"
                : "rgba(74,99,112,0.2)",
            color: stock.marketState === "REGULAR" ? "#00d68f" : "#4a6370",
            letterSpacing: "0.08em",
          }}
        >
          {stock.marketState || "—"}
        </span>
      </td>
    </tr>
  );
}
