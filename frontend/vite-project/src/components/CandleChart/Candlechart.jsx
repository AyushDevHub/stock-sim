import { useEffect, useRef } from "react";
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
} from "lightweight-charts";
import api from "../../services/api.js";
import styles from "./CandleChart.module.css";

const INTERVALS = ["1m", "5m", "15m", "1h", "1d", "1wk", "1mo"];

export default function CandleChart({ symbol, interval, onIntervalChange }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const candleRef = useRef(null);
  const volumeRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: { background: { color: "#0d1117" }, textColor: "#4a6370" },
      grid: {
        vertLines: { color: "#111827" },
        horzLines: { color: "#111827" },
      },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.06)" },
      timeScale: {
        borderColor: "rgba(255,255,255,0.06)",
        timeVisible: true,
        secondsVisible: false,
      },
      width: containerRef.current.clientWidth,
      height: 420,
    });

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
    chart
      .priceScale("volume")
      .applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

    chartRef.current = chart;
    candleRef.current = candleSeries;
    volumeRef.current = volumeSeries;

    const ro = new ResizeObserver(() => {
      if (containerRef.current)
        chart.applyOptions({ width: containerRef.current.clientWidth });
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
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <div className={styles.symbolInfo}>
          {symbol || "—"}
          <span className={styles.exchange}>NSE</span>
        </div>
        <div className={styles.intervals}>
          {INTERVALS.map((iv) => (
            <button
              key={iv}
              className={`${styles.ivBtn} ${
                interval === iv ? styles.ivActive : ""
              }`}
              onClick={() => onIntervalChange(iv)}
            >
              {iv}
            </button>
          ))}
        </div>
      </div>
      <div ref={containerRef} className={styles.container} />
    </div>
  );
}
