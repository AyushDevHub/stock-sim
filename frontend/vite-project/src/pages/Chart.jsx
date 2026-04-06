import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import CandleChart from "../components/CandleChart.jsx";
import TradePanel from "../components/TradePanel.jsx";
import { usePrices } from "../hooks/usePrices.js";

export default function Chart() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [interval, setInterval] = useState("1d");
  const { prices } = usePrices();

  const symbol = searchParams.get("symbol") || (prices[0]?.symbol ?? "TCS");
  const liveStock = prices.find((p) => p.symbol === symbol);

  const selectSymbol = (sym) => setSearchParams({ symbol: sym });

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }}
      >
        {/* Left — chart + stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Price header */}
          {liveStock && (
            <div
              style={{
                background: "#0d1417",
                border: "1px solid #1a2428",
                borderRadius: "4px",
                padding: "14px 20px",
                display: "flex",
                alignItems: "center",
                gap: 32,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "Syne, sans-serif",
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: "#c8d8de",
                  }}
                >
                  {liveStock.name}
                </div>
                <div
                  style={{
                    fontSize: "0.65rem",
                    color: "#4a6370",
                    marginTop: 2,
                  }}
                >
                  {symbol} · NSE
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "1.4rem",
                    fontWeight: 600,
                    color: "#c8d8de",
                    fontFamily: "IBM Plex Mono",
                  }}
                >
                  ₹
                  {liveStock.price?.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: liveStock.change >= 0 ? "#00d68f" : "#ff4757",
                  }}
                >
                  {liveStock.change >= 0 ? "▲" : "▼"}{" "}
                  {Math.abs(liveStock.change).toFixed(2)} (
                  {liveStock.percentChange?.toFixed(2)}%)
                </div>
              </div>
              {[
                { label: "OPEN", value: liveStock.open },
                { label: "HIGH", value: liveStock.high },
                { label: "LOW", value: liveStock.low },
                { label: "PREV", value: liveStock.previousClose },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div
                    style={{
                      fontSize: "0.6rem",
                      color: "#4a6370",
                      letterSpacing: "0.1em",
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "#c8d8de",
                      marginTop: 2,
                    }}
                  >
                    ₹
                    {value?.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    }) ?? "—"}
                  </div>
                </div>
              ))}
              <div
                style={{
                  marginLeft: "auto",
                  fontSize: "0.65rem",
                  color: "#4a6370",
                }}
              >
                <span style={{ color: "#00d68f" }}>●</span> LIVE · 10s
              </div>
            </div>
          )}

          {/* Chart */}
          <CandleChart
            symbol={symbol}
            interval={interval}
            onIntervalChange={setInterval}
          />

          {/* Symbol selector */}
          <div
            style={{
              background: "#0d1417",
              border: "1px solid #1a2428",
              borderRadius: "4px",
              padding: 16,
            }}
          >
            <div
              style={{
                fontSize: "0.6rem",
                color: "#4a6370",
                letterSpacing: "0.12em",
                marginBottom: 12,
              }}
            >
              SWITCH SYMBOL
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {prices.map((p) => (
                <button
                  key={p.symbol}
                  onClick={() => selectSymbol(p.symbol)}
                  style={{
                    padding: "4px 10px",
                    fontSize: "0.7rem",
                    borderRadius: "2px",
                    border: "1px solid",
                    cursor: "pointer",
                    fontFamily: "IBM Plex Mono, monospace",
                    background:
                      p.symbol === symbol
                        ? "rgba(255,184,0,0.12)"
                        : "transparent",
                    borderColor: p.symbol === symbol ? "#ffb800" : "#1a2428",
                    color: p.symbol === symbol ? "#ffb800" : "#4a6370",
                    transition: "all 0.15s",
                  }}
                >
                  {p.symbol}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right — trade panel */}
        <div>
          <TradePanel symbol={symbol} price={liveStock?.price} />
        </div>
      </div>
    </div>
  );
}
