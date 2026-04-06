import { useNavigate } from "react-router-dom";
import { usePrices } from "../hooks/usePrices.js";
import PriceRow from "../components/PriceRow.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Dashboard() {
  const { prices, loading } = usePrices();
  const { user } = useAuth();
  const navigate = useNavigate();

  const gainers = [...prices]
    .sort((a, b) => b.percentChange - a.percentChange)
    .slice(0, 3);
  const losers = [...prices]
    .sort((a, b) => a.percentChange - b.percentChange)
    .slice(0, 3);

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontFamily: "Syne, sans-serif",
            fontSize: "1.1rem",
            fontWeight: 700,
            color: "#c8d8de",
          }}
        >
          Market Overview
        </div>
        <div style={{ fontSize: "0.65rem", color: "#4a6370", marginTop: 2 }}>
          Live NSE prices · Updates every 10s
          <span style={{ marginLeft: 12, color: "#00d68f" }}>● LIVE</span>
        </div>
      </div>

      {/* Summary cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 12,
          marginBottom: 24,
        }}
      >
        {[
          {
            label: "BALANCE",
            value: `₹${Number(user?.balance || 0).toLocaleString("en-IN")}`,
            color: "#00d68f",
          },
          { label: "STOCKS", value: prices.length, color: "#ffb800" },
          {
            label: "ADVANCING",
            value: prices.filter((p) => p.change > 0).length,
            color: "#00d68f",
          },
          {
            label: "DECLINING",
            value: prices.filter((p) => p.change < 0).length,
            color: "#ff4757",
          },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            style={{
              background: "#0d1417",
              border: "1px solid #1a2428",
              borderRadius: 4,
              padding: "16px 20px",
            }}
          >
            <div
              style={{
                fontSize: "0.6rem",
                color: "#4a6370",
                letterSpacing: "0.12em",
                marginBottom: 8,
              }}
            >
              {label}
            </div>
            <div style={{ fontSize: "1.2rem", fontWeight: 600, color }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Gainers / Losers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 24,
        }}
      >
        {[
          { title: "TOP GAINERS", data: gainers, color: "#00d68f" },
          { title: "TOP LOSERS", data: losers, color: "#ff4757" },
        ].map(({ title, data, color }) => (
          <div
            key={title}
            style={{
              background: "#0d1417",
              border: "1px solid #1a2428",
              borderRadius: 4,
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
              {title}
            </div>
            {data.map((s) => (
              <div
                key={s.symbol}
                onClick={() => navigate(`/chart?symbol=${s.symbol}`)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "6px 0",
                  borderBottom: "1px solid #1a242855",
                  cursor: "pointer",
                }}
              >
                <span style={{ fontSize: "0.75rem", color: "#c8d8de" }}>
                  {s.symbol}
                </span>
                <span style={{ fontSize: "0.75rem", color }}>
                  {s.percentChange >= 0 ? "+" : ""}
                  {s.percentChange?.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Full table */}
      <div
        style={{
          background: "#0d1417",
          border: "1px solid #1a2428",
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid #1a2428",
            fontSize: "0.6rem",
            color: "#4a6370",
            letterSpacing: "0.12em",
          }}
        >
          ALL STOCKS — click any row to view chart
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
            Loading prices...
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
                <PriceRow
                  key={s.symbol}
                  stock={s}
                  onSelect={(sym) => navigate(`/chart?symbol=${sym}`)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
