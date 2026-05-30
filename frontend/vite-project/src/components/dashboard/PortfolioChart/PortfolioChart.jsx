import { useState, useRef, useMemo } from "react";
import styles from "./PortfolioChart.module.css";

// Seeded pseudo-random so the curve is the SAME every render for a given balance
// (no Math.random() on every call)
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateCurve(balance) {
  const rand = seededRandom(Math.floor(balance));
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
  let val = balance * 0.72;

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    val = val * (1 + (rand() * 0.1 - 0.025));
    pts.push({
      label: months[d.getMonth()],
      year: d.getFullYear().toString().slice(2),
      value: Math.round(val),
      active: i === 0,
    });
  }
  pts[pts.length - 1].value = balance;
  return pts;
}

function buildPath(points, W, H) {
  const vals = points.map((p) => p.value);
  const minV = Math.min(...vals) * 0.97;
  const maxV = Math.max(...vals) * 1.02;
  const range = maxV - minV || 1;

  const xs = points.map((_, i) => (i / (points.length - 1)) * W);
  const ys = points.map(
    (p) => H - ((p.value - minV) / range) * (H * 0.85) - H * 0.05
  );

  let d = `M ${xs[0]} ${ys[0]}`;
  for (let i = 1; i < points.length; i++) {
    const cpx = (xs[i - 1] + xs[i]) / 2;
    d += ` C ${cpx} ${ys[i - 1]}, ${cpx} ${ys[i]}, ${xs[i]} ${ys[i]}`;
  }

  const areaD = `${d} L ${xs[xs.length - 1]} ${H} L ${xs[0]} ${H} Z`;
  return { d, areaD, xs, ys, minV, maxV };
}

export default function PortfolioChart({ balance = 100000 }) {
  const [tooltip, setTooltip] = useState(null);
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const svgRef = useRef(null);
  const W = 900,
    H = 160;

  // Stable — only recomputes when balance changes
  const points = useMemo(() => generateCurve(balance), [balance]);
  const { d, areaD, xs, ys } = useMemo(() => buildPath(points, W, H), [points]);

  const startVal = points[0].value;
  const gain = balance - startVal;
  const gainPct = ((gain / startVal) * 100).toFixed(1);
  const isUp = gain >= 0;

  const handleMouseMove = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * W;
    let closest = 0,
      minDist = Infinity;
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
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.headerLabel}>Portfolio Value</div>
          <div className={styles.headerValue}>
            ₹{balance.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div
          className={`${styles.badge} ${
            isUp ? styles.badgeUp : styles.badgeDown
          }`}
        >
          {isUp ? "▲" : "▼"} {isUp ? "+" : ""}
          {gainPct}%
        </div>
      </div>

      {/* Chart */}
      <div
        className={styles.chartWrap}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          setTooltip(null);
          setHoveredIdx(null);
        }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className={styles.svg}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="pgFill" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={isUp ? "#22c55e" : "#ef4444"}
                stopOpacity="0.18"
              />
              <stop
                offset="100%"
                stopColor={isUp ? "#22c55e" : "#ef4444"}
                stopOpacity="0"
              />
            </linearGradient>
          </defs>

          {/* Subtle grid */}
          {[0.3, 0.6, 0.9].map((f) => (
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

          {/* Area */}
          <path d={areaD} fill="url(#pgFill)" />

          {/* Line */}
          <path
            d={d}
            fill="none"
            stroke={isUp ? "#22c55e" : "#ef4444"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Hover */}
          {hoveredIdx !== null && (
            <>
              <line
                x1={xs[hoveredIdx]}
                y1="0"
                x2={xs[hoveredIdx]}
                y2={H}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <circle
                cx={xs[hoveredIdx]}
                cy={ys[hoveredIdx]}
                r="4"
                fill={isUp ? "#22c55e" : "#ef4444"}
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="1.5"
              />
            </>
          )}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            className={styles.tooltip}
            style={{
              left: `clamp(8px, ${tooltip.x}%, calc(100% - 130px))`,
              top: "8px",
            }}
          >
            <div className={styles.ttValue}>
              ₹
              {tooltip.value.toLocaleString("en-IN", {
                maximumFractionDigits: 0,
              })}
            </div>
            <div className={styles.ttLabel}>{tooltip.label}</div>
          </div>
        )}
      </div>

      {/* X-axis labels */}
      <div className={styles.xAxis}>
        {points
          .filter((_, i) => i % 2 === 0)
          .map((p, i) => (
            <span key={i} className={styles.xLabel}>
              {p.label}
            </span>
          ))}
      </div>
    </div>
  );
}
