import { useState } from "react";
import { usePrices } from "../hooks/usePrices.js";
import TradePanel from "../components/TradePanel.jsx";
import PriceRow from "../components/PriceRow.jsx";

export default function Trade() {
  const { prices, loading } = usePrices();
  const [selected, setSelected] = useState(null);

  const stock = prices.find((p) => p.symbol === selected);

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontFamily: "Syne, sans-serif",
            fontSize: "1.1rem",
            fontWeight: 700,
            color: "#c8d8de",
          }}
        >
          Trade
        </div>
        <div style={{ fontSize: "0.65rem", color: "#4a6370", marginTop: 2 }}>
          Select a stock to place an order
        </div>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}
      >
        {/* Stock list */}
        <div
          style={{
            background: "#0d1417",
            border: "1px solid #1a2428",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "10px 16px",
              borderBottom: "1px solid #1a2428",
              fontSize: "0.6rem",
              color: "#4a6370",
              letterSpacing: "0.12em",
            }}
          >
            SELECT STOCK
          </div>
          {loading ? (
            <div
              style={{
                padding: 32,
                textAlign: "center",
                fontSize: "0.7rem",
                color: "#4a6370",
              }}
            >
              Loading...
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1a2428" }}>
                  {[
                    "SYMBOL / NAME",
                    "PRICE",
                    "CHANGE",
                    "CHANGE %",
                    "VOLUME",
                    "STATUS",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "8px 16px",
                        fontSize: "0.6rem",
                        color: "#4a6370",
                        letterSpacing: "0.1em",
                        textAlign: h === "SYMBOL / NAME" ? "left" : "right",
                        fontWeight: 400,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {prices.map((s) => (
                  <tr
                    key={s.symbol}
                    onClick={() => setSelected(s.symbol)}
                    style={{
                      borderBottom: "1px solid #1a2428",
                      cursor: "pointer",
                      background:
                        selected === s.symbol
                          ? "rgba(255,184,0,0.06)"
                          : "transparent",
                      outline:
                        selected === s.symbol ? "1px solid #ffb80033" : "none",
                    }}
                  >
                    <td style={{ padding: "10px 16px" }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "0.8rem",
                          color: selected === s.symbol ? "#ffb800" : "#c8d8de",
                        }}
                      >
                        {s.symbol}
                      </div>
                      <div
                        style={{
                          fontSize: "0.65rem",
                          color: "#4a6370",
                          marginTop: 2,
                        }}
                      >
                        {s.name?.slice(0, 28)}
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
                      {s.price?.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td
                      style={{
                        padding: "10px 16px",
                        textAlign: "right",
                        fontSize: "0.75rem",
                        color: s.change >= 0 ? "#00d68f" : "#ff4757",
                      }}
                    >
                      {s.change >= 0 ? "▲" : "▼"}{" "}
                      {Math.abs(s.change).toFixed(2)}
                    </td>
                    <td
                      style={{
                        padding: "10px 16px",
                        textAlign: "right",
                        fontSize: "0.75rem",
                        color: s.change >= 0 ? "#00d68f" : "#ff4757",
                      }}
                    >
                      {s.change >= 0 ? "+" : ""}
                      {s.percentChange?.toFixed(2)}%
                    </td>
                    <td
                      style={{
                        padding: "10px 16px",
                        textAlign: "right",
                        fontSize: "0.7rem",
                        color: "#4a6370",
                      }}
                    >
                      {s.volume?.toLocaleString("en-IN")}
                    </td>
                    <td style={{ padding: "10px 16px", textAlign: "center" }}>
                      <span
                        style={{
                          fontSize: "0.6rem",
                          padding: "2px 6px",
                          borderRadius: "2px",
                          background:
                            s.marketState === "REGULAR"
                              ? "rgba(0,214,143,0.12)"
                              : "rgba(74,99,112,0.2)",
                          color:
                            s.marketState === "REGULAR" ? "#00d68f" : "#4a6370",
                          letterSpacing: "0.08em",
                        }}
                      >
                        {s.marketState || "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Trade panel */}
        <div>
          {selected ? (
            <TradePanel symbol={selected} price={stock?.price} />
          ) : (
            <div
              style={{
                background: "#0d1417",
                border: "1px solid #1a2428",
                borderRadius: "4px",
                padding: 32,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "0.7rem", color: "#4a6370" }}>
                ← Select a stock to trade
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
