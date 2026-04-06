import { useEffect, useRef } from "react";
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
} from "lightweight-charts";
import api from "../services/api.js";

const INTERVALS = ["1m", "5m", "15m", "1h", "1d", "1wk", "1mo"];

export default function CandleChart({ symbol, interval, onIntervalChange }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const candleRef = useRef(null);
  const volumeRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: { background: { color: "#080c0e" }, textColor: "#4a6370" },
      grid: {
        vertLines: { color: "#0d1417" },
        horzLines: { color: "#0d1417" },
      },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: "#1a2428" },
      timeScale: {
        borderColor: "#1a2428",
        timeVisible: true,
        secondsVisible: false,
      },
      width: containerRef.current.clientWidth,
      height: 420,
    });

    // v4 API — addSeries with series type
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#00d68f",
      downColor: "#ff4757",
      borderUpColor: "#00d68f",
      borderDownColor: "#ff4757",
      wickUpColor: "#00d68f",
      wickDownColor: "#ff4757",
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });

    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    chartRef.current = chart;
    candleRef.current = candleSeries;
    volumeRef.current = volumeSeries;

    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!symbol || !candleRef.current) return;
    api
      .get(`/chart/${symbol}?interval=${interval}`)
      .then(({ data }) => {
        candleRef.current.setData(data.candles);
        volumeRef.current.setData(data.volumes);
        chartRef.current.timeScale().fitContent();
      })
      .catch(console.error);
  }, [symbol, interval]);

  return (
    <div
      style={{
        background: "#0d1417",
        border: "1px solid #1a2428",
        borderRadius: 4,
        overflow: "hidden",
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          borderBottom: "1px solid #1a2428",
        }}
      >
        <div style={{ fontSize: "0.8rem", color: "#c8d8de", fontWeight: 600 }}>
          {symbol || "—"}
          <span
            style={{ fontSize: "0.65rem", color: "#4a6370", marginLeft: 8 }}
          >
            NSE
          </span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {INTERVALS.map((iv) => (
            <button
              key={iv}
              onClick={() => onIntervalChange(iv)}
              style={{
                padding: "3px 8px",
                fontSize: "0.65rem",
                letterSpacing: "0.06em",
                borderRadius: 2,
                border: "none",
                cursor: "pointer",
                fontFamily: "IBM Plex Mono, monospace",
                background:
                  interval === iv ? "rgba(255,184,0,0.15)" : "transparent",
                color: interval === iv ? "#ffb800" : "#4a6370",
                transition: "all 0.15s",
              }}
            >
              {iv}
            </button>
          ))}
        </div>
      </div>
      <div ref={containerRef} style={{ height: 420 }} />
    </div>
  );
}
