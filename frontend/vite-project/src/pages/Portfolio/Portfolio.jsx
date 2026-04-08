import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api.js";
import { usePrices } from "../../hooks/usePrices.js";
import { useAuth } from "../../context/AuthContext.jsx";
import PortfolioSummary from "../../components/Portfolio/PortfolioSummary/PortfolioSummary.jsx";
import HoldingsTable from "../../components/Portfolio/HoldingsTable/HoldingsTable.jsx";
import OrderHistory from "../../components/Portfolio/OrderHistory/OrderHistory.jsx";
import styles from "./Portfolio.module.css";

const TABS = [
  { key: "holdings", label: "HOLDINGS" },
  { key: "orders", label: "ORDER HISTORY" },
];

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

  // Enrich holdings with live price data
  const enriched = holdings.map((h) => {
    const live = prices.find((p) => p.symbol === h.stock);
    const current = live?.price ?? 0;
    const dayChange = live?.change ?? null;
    const dayChangePct = live?.percentChange ?? null;
    return {
      ...h,
      currentPrice: current,
      value: current * h.quantity,
      name: live?.name || h.stock,
      dayChange,
      dayChangePct,
    };
  });

  const totalValue = enriched.reduce((s, h) => s + h.value, 0);
  const totalInvested = 0; // avgPrice not stored yet — future feature

  return (
    <div className={styles.page}>
      <div className={styles.grid} />
      <div
        className={styles.glow}
        style={{
          right: "-5%",
          top: "0",
          width: "500px",
          height: "500px",
          background:
            "radial-gradient(circle,rgba(99,102,241,0.06) 0%,transparent 70%)",
        }}
      />
      <div
        className={styles.glow}
        style={{
          left: "10%",
          bottom: "10%",
          width: "400px",
          height: "400px",
          background:
            "radial-gradient(circle,rgba(0,214,143,0.04) 0%,transparent 70%)",
        }}
      />

      <div className={styles.inner}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleBlock}>
            <h1 className={styles.pageTitle}>Portfolio</h1>
            <p className={styles.pageSub}>
              Your holdings and complete trade history
            </p>
          </div>
          <div className={styles.headerActions}>
            <button
              className={styles.tradeBtn}
              onClick={() => navigate("/trade")}
            >
              + New Trade
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <PortfolioSummary
          balance={user?.balance ?? 0}
          totalValue={totalValue}
          totalInvested={totalInvested}
          holdingsCount={enriched.length}
        />

        {/* Tabs */}
        <div className={styles.tabs}>
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`${styles.tab} ${
                tab === t.key ? styles.tabActive : ""
              }`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              {t.key === "holdings" && enriched.length > 0 && (
                <span className={styles.sectionCount}>{enriched.length}</span>
              )}
              {t.key === "orders" && orders.length > 0 && (
                <span className={styles.sectionCount}>{orders.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "holdings" && (
          <>
            <div className={styles.sectionHeader}>
              <div>
                <span className={styles.sectionTitle}>Current Holdings</span>
              </div>
            </div>
            <HoldingsTable holdings={enriched} loading={loading} />
          </>
        )}

        {tab === "orders" && (
          <>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>Order History</span>
            </div>
            <OrderHistory orders={orders} loading={loading} />
          </>
        )}
      </div>
    </div>
  );
}
