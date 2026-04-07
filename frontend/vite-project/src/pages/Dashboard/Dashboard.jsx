import { useNavigate } from "react-router-dom";
import { usePrices } from "../../hooks/usePrices.js";
import { useAuth } from "../../context/AuthContext.jsx";
import PortfolioChart from "../../components/dashboard/PortfolioChart/PortfolioChart.jsx";
import WatchlistCard from "../../components/dashboard/WatchlistCard/WatchlistCard.jsx";
import SectorCard from "../../components/dashboard/SectorCard/SectorCard.jsx";
import StockTable from "../../components/dashboard/StockTable/StockTable.jsx";
import styles from "./Dashboard.module.css";

export default function Dashboard() {
  const { prices, loading } = usePrices();
  const { user } = useAuth();
  const navigate = useNavigate();

  // best performer from prices
  const bestStock = [...prices].sort(
    (a, b) => (b.percentChange ?? 0) - (a.percentChange ?? 0)
  )[0];

  return (
    <div className={styles.page}>
      <div className={styles.grid} />
      <div
        className={styles.glow}
        style={{
          left: "55%",
          top: "0",
          width: "600px",
          height: "600px",
          background:
            "radial-gradient(circle,rgba(99,102,241,0.06) 0%,transparent 70%)",
        }}
      />
      <div
        className={styles.glow}
        style={{
          left: "-5%",
          top: "40%",
          width: "400px",
          height: "400px",
          background:
            "radial-gradient(circle,rgba(0,214,143,0.04) 0%,transparent 70%)",
        }}
      />

      <div className={styles.inner}>
        {/* ── Top bar ── */}
        <div className={styles.topBar}>
          <div>
            <h1 className={styles.pageTitle}>Dashboard</h1>
            <p className={styles.pageSub}>
              Overview of your investment · {prices.length} stocks tracked
            </p>
          </div>
          <div className={styles.topRight}>
            <div className={styles.livePill}>
              <span className={styles.liveDot} />
              LIVE · 10s
            </div>
            <button
              className={styles.exportBtn}
              onClick={() => navigate("/portfolio")}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              View Portfolio
            </button>
          </div>
        </div>

        {/* ── Portfolio chart + Watchlist ── */}
        <div className={styles.mainGrid}>
          <PortfolioChart
            balance={user?.balance ?? 100000}
            bestStock={bestStock}
          />
          <WatchlistCard stocks={prices} loading={loading} />
        </div>

        {/* ── Sector cards ── */}
        <SectorCard prices={prices} loading={loading} />

        {/* ── Full stock table ── */}
        <StockTable stocks={prices} loading={loading} />
      </div>
    </div>
  );
}
