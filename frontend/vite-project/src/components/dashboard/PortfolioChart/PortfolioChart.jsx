import { useState, useRef, useEffect } from "react";
import styles from "./PortfolioChart.module.css";

// Generate mock portfolio curve from real balance
function generateCurve(balance) {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const now = new Date();
  const pts = [];
  let val = balance * 0.55;
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    val = val * (1 + (Math.random() * 0.12 - 0.03));
    pts.push({
      label: months[d.getMonth()],
      value: Math.round(val),
      year: d.getFullYear().toString().slice(2),
      active: i === 0,
    });
  }
  // last point = current balance
  pts[pts.length - 1].value = balance;
  return pts;
}

// Build SVG path from data points
function buildPath(points, w, h, minV, maxV) {
  const range = maxV - minV || 1;
  const xs = points.map((_, i) => (i / (points.length - 1)) * w);
  const ys = points.map((p) => h - ((p.value - minV) / range) * h);

  // Smooth curve using cubic bezier
  let d = `M ${xs[0]} ${ys[0]}`;
  for (let i = 1; i < points.length; i++) {
    const cpx = (xs[i - 1] + xs[i]) / 2;
    d += ` C ${cpx} ${ys[i - 1]}, ${cpx} ${ys[i]}, ${xs[i]} ${ys[i]}`;
  }
  return { d, xs, ys };
}

const LOGO_COLORS = [
  "#6366f1",
  "#e53935",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
];

export default function PortfolioChart({
  balance = 100000,
  holdings = [],
  bestStock,
}) {
  const [tooltip, setTooltip] = useState(null);
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const svgRef = useRef(null);
  const W = 800,
    H = 140;

  const points = generateCurve(balance);
  const values = points.map((p) => p.value);
  const minV = Math.min(...values) * 0.95;
  const maxV = Math.max(...values) * 1.02;
  const { d, xs, ys } = buildPath(points, W, H, minV, maxV);

  // area fill path
  const areaD = `${d} L ${xs[xs.length - 1]} ${H} L ${xs[0]} ${H} Z`;

  const profit = balance - points[0].value;
  const profitPct = ((profit / points[0].value) * 100).toFixed(1);

  const best = bestStock || {
    symbol: "TCS",
    name: "Tata Consultancy Services",
  };

  const handleMouseMove = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * W;
    let closest = 0;
    let minDist = Infinity;
    xs.forEach((x, i) => {
      const dist = Math.abs(x - mx);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    });
    setHoveredIdx(closest);
    setTooltip({
      x: (xs[closest] / W) * 100,
      y: (ys[closest] / H) * 100,
      value: points[closest].value,
      label: `${points[closest].label} '${points[closest].year}`,
    });
  };

  return (
    <div className={styles.card}>
      <div className={styles.topRow}>
        {/* Portfolio value */}
        <div className={styles.leftBlock}>
          <div className={styles.label}>PORTFOLIO VALUE</div>
          <div className={styles.portfolioValue}>
            ₹{balance.toLocaleString("en-IN")}
          </div>
          <div className={styles.profitRow}>
            <span>Your balance is</span>
            <span className={styles.profitAmt}>
              ₹{Number(balance).toLocaleString("en-IN")}
            </span>
            <span className={styles.profitBadge}>
              {profitPct > 0 ? "+" : ""}
              {profitPct}%
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className={styles.statsRow}>
          <div className={styles.statBlock}>
            <div className={styles.statLabel}>AVG. MONTHLY GROWTH</div>
            <div className={styles.statValue}>
              ~{(parseFloat(profitPct) / 12).toFixed(1)}%
            </div>
            <div className={styles.statSub}>
              ~₹{Math.round(profit / 12).toLocaleString("en-IN")}
            </div>
          </div>
          <div className={styles.statBlock}>
            <div className={styles.statLabel}>BEST STOCK</div>
            <div className={styles.bestStock}>
              <div
                className={styles.bestLogoWrap}
                style={{
                  background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                }}
              >
                {best.symbol.slice(0, 2)}
              </div>
              <div>
                <div className={styles.bestName}>{best.symbol}</div>
                <div className={styles.bestSymbol}>
                  {best.name?.split(" ").slice(0, 2).join(" ")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div
        className={styles.chartArea}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          setTooltip(null);
          setHoveredIdx(null);
        }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className={styles.chartSvg}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="50%" stopColor="#00b4d8" />
              <stop offset="100%" stopColor="#00d68f" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((f) => (
            <line
              key={f}
              x1="0"
              y1={H * f}
              x2={W}
              y2={H * f}
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="1"
            />
          ))}

          {/* Area fill */}
          <path d={areaD} fill="url(#chartGrad)" />

          {/* Line */}
          <path
            d={d}
            fill="none"
            stroke="url(#lineGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Hover vertical line */}
          {hoveredIdx !== null && (
            <>
              <line
                x1={xs[hoveredIdx]}
                y1="0"
                x2={xs[hoveredIdx]}
                y2={H}
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <circle
                cx={xs[hoveredIdx]}
                cy={ys[hoveredIdx]}
                r="5"
                fill="#6366f1"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="2"
              />
              <circle
                cx={xs[hoveredIdx]}
                cy={ys[hoveredIdx]}
                r="10"
                fill="rgba(99,102,241,0.15)"
              />
            </>
          )}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            className={styles.tooltip}
            style={{
              left: `clamp(10px, ${tooltip.x}%, calc(100% - 140px))`,
              top: `${Math.max(0, tooltip.y - 20)}%`,
              transform: "translateY(-100%)",
            }}
          >
            <div className={styles.tooltipValue}>
              ₹{tooltip.value.toLocaleString("en-IN")}
            </div>
            <div className={styles.tooltipLabel}>Value | {tooltip.label}</div>
          </div>
        )}
      </div>

      {/* X-axis */}
      <div className={styles.xLabels}>
        {points.map((p, i) => (
          <span
            key={i}
            className={`${styles.xLabel} ${
              hoveredIdx === i || p.active ? styles.xLabelActive : ""
            }`}
          >
            {p.label.slice(0, 3)} '{p.year}
          </span>
        ))}
      </div>
    </div>
  );
}
