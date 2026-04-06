import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api.js";
import { usePrices } from "../hooks/usePrices.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Portfolio() {
  const [holdings, setHoldings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState("holdings");
  const [loading, setLoading] = useState(true);
  const { prices } = usePrices();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [ph, po] = await Promise.all([
          api.get("/portfolio"),
          api.get("/trade/orders").catch(() => ({ data: { orders: [] } })),
        ]);
        setHoldings(ph.data.portfolio || []);
        setOrders(po.data.orders || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // enrich holdings with live price + P&L
  const enriched = holdings.map((h) => {
    const live = prices.find((p) => p.symbol === h.stock);
    const current = live?.price ?? 0;
    const value = current * h.quantity;
    return { ...h, currentPrice: current, value, name: live?.name };
  });

  const totalValue = enriched.reduce((s, h) => s + h.value, 0);
  const totalInvested = enriched.reduce(
    (s, h) => s + (h.avgPrice ?? 0) * h.quantity,
    0
  );

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
          Portfolio
        </div>
        <div style={{ fontSize: "0.65rem", color: "#4a6370", marginTop: 2 }}>
          Holdings and order history
        </div>
      </div>

      {/* Summary */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 12,
          marginBottom: 20,
        }}
      >
        {[
          {
            label: "CASH BALANCE",
            value: `₹${Number(user?.balance || 0).toLocaleString("en-IN")}`,
            color: "#00d68f",
          },
          {
            label: "PORTFOLIO VALUE",
            value: `₹${totalValue.toLocaleString("en-IN", {
              maximumFractionDigits: 0,
            })}`,
            color: "#ffb800",
          },
          { label: "TOTAL HOLDINGS", value: enriched.length, color: "#00b4d8" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            style={{
              background: "#0d1417",
              border: "1px solid #1a2428",
              borderRadius: "4px",
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

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 0,
          marginBottom: 16,
          borderBottom: "1px solid #1a2428",
        }}
      >
        {["holdings", "orders"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "8px 20px",
              fontSize: "0.7rem",
              letterSpacing: "0.1em",
              background: "transparent",
              border: "none",
              borderBottom:
                tab === t ? "2px solid #ffb800" : "2px solid transparent",
              color: tab === t ? "#ffb800" : "#4a6370",
              cursor: "pointer",
              fontFamily: "IBM Plex Mono, monospace",
              transition: "all 0.15s",
            }}
          >
            {t.toUpperCase()}
          </button>
        ))}
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
      ) : tab === "holdings" ? (
        enriched.length === 0 ? (
          <div
            style={{
              background: "#0d1417",
              border: "1px solid #1a2428",
              borderRadius: "4px",
              padding: 48,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "0.75rem",
                color: "#4a6370",
                marginBottom: 12,
              }}
            >
              No holdings yet
            </div>
            <button
              onClick={() => navigate("/trade")}
              style={{
                padding: "8px 20px",
                background: "rgba(0,214,143,0.1)",
                border: "1px solid #00d68f",
                color: "#00d68f",
                fontSize: "0.7rem",
                borderRadius: "3px",
                cursor: "pointer",
                fontFamily: "IBM Plex Mono, monospace",
                letterSpacing: "0.1em",
              }}
            >
              START TRADING
            </button>
          </div>
        ) : (
          <div
            style={{
              background: "#0d1417",
              border: "1px solid #1a2428",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1a2428" }}>
                  {["STOCK", "QTY", "CURRENT PRICE", "MARKET VALUE", ""].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          padding: "8px 16px",
                          fontSize: "0.6rem",
                          color: "#4a6370",
                          letterSpacing: "0.1em",
                          textAlign: h === "STOCK" ? "left" : "right",
                          fontWeight: 400,
                        }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {enriched.map((h) => (
                  <tr
                    key={h.stock}
                    style={{ borderBottom: "1px solid #1a2428" }}
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "0.8rem",
                          color: "#c8d8de",
                        }}
                      >
                        {h.stock}
                      </div>
                      <div
                        style={{
                          fontSize: "0.65rem",
                          color: "#4a6370",
                          marginTop: 2,
                        }}
                      >
                        {h.name?.slice(0, 30)}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        textAlign: "right",
                        fontSize: "0.8rem",
                        color: "#c8d8de",
                      }}
                    >
                      {h.quantity}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        textAlign: "right",
                        fontSize: "0.8rem",
                        color: "#c8d8de",
                      }}
                    >
                      ₹
                      {h.currentPrice.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        textAlign: "right",
                        fontSize: "0.8rem",
                        color: "#ffb800",
                      }}
                    >
                      ₹
                      {h.value.toLocaleString("en-IN", {
                        maximumFractionDigits: 0,
                      })}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <button
                        onClick={() => navigate(`/chart?symbol=${h.stock}`)}
                        style={{
                          padding: "3px 10px",
                          fontSize: "0.65rem",
                          background: "transparent",
                          border: "1px solid #1a2428",
                          color: "#4a6370",
                          borderRadius: "2px",
                          cursor: "pointer",
                          fontFamily: "IBM Plex Mono, monospace",
                        }}
                      >
                        CHART
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : // Orders tab
      orders.length === 0 ? (
        <div
          style={{
            background: "#0d1417",
            border: "1px solid #1a2428",
            borderRadius: "4px",
            padding: 48,
            textAlign: "center",
            fontSize: "0.75rem",
            color: "#4a6370",
          }}
        >
          No orders yet
        </div>
      ) : (
        <div
          style={{
            background: "#0d1417",
            border: "1px solid #1a2428",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1a2428" }}>
                {["DATE", "SYMBOL", "TYPE", "QTY", "PRICE", "TOTAL"].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        padding: "8px 16px",
                        fontSize: "0.6rem",
                        color: "#4a6370",
                        letterSpacing: "0.1em",
                        textAlign:
                          h === "DATE" || h === "SYMBOL" ? "left" : "right",
                        fontWeight: 400,
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr
                  key={o._id || o.id}
                  style={{ borderBottom: "1px solid #1a2428" }}
                >
                  <td
                    style={{
                      padding: "10px 16px",
                      fontSize: "0.7rem",
                      color: "#4a6370",
                    }}
                  >
                    {new Date(o.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td
                    style={{
                      padding: "10px 16px",
                      fontSize: "0.8rem",
                      color: "#c8d8de",
                      fontWeight: 600,
                    }}
                  >
                    {o.stock}
                  </td>
                  <td style={{ padding: "10px 16px", textAlign: "right" }}>
                    <span
                      style={{
                        fontSize: "0.65rem",
                        padding: "2px 8px",
                        borderRadius: "2px",
                        background:
                          o.type === "buy"
                            ? "rgba(0,214,143,0.12)"
                            : "rgba(255,71,87,0.12)",
                        color: o.type === "buy" ? "#00d68f" : "#ff4757",
                        letterSpacing: "0.08em",
                      }}
                    >
                      {o.type.toUpperCase()}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "10px 16px",
                      textAlign: "right",
                      fontSize: "0.8rem",
                      color: "#c8d8de",
                    }}
                  >
                    {o.quantity}
                  </td>
                  <td
                    style={{
                      padding: "10px 16px",
                      textAlign: "right",
                      fontSize: "0.8rem",
                      color: "#c8d8de",
                    }}
                  >
                    ₹
                    {o.price?.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td
                    style={{
                      padding: "10px 16px",
                      textAlign: "right",
                      fontSize: "0.8rem",
                      color: "#ffb800",
                    }}
                  >
                    ₹
                    {o.total?.toLocaleString("en-IN", {
                      maximumFractionDigits: 0,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
