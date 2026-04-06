import { useRef, useEffect } from "react";
import styles from "./PriceRow.module.css";

export default function PriceRow({ stock, onSelect }) {
  const ref = useRef(null);
  const prevDir = useRef("flat");

  useEffect(() => {
    if (!ref.current || stock.direction === "flat") return;
    if (stock.direction === prevDir.current) return;
    prevDir.current = stock.direction;
    ref.current.classList.remove("flash-up", "flash-down");
    void ref.current.offsetWidth;
    ref.current.classList.add(
      stock.direction === "up" ? "flash-up" : "flash-down"
    );
  }, [stock.price, stock.direction]);

  const up = (stock.change ?? 0) >= 0;

  return (
    <tr ref={ref} className={styles.row} onClick={() => onSelect(stock.symbol)}>
      <td className={styles.symbolCell}>
        <div className={styles.symbolName}>{stock.symbol}</div>
        <div className={styles.companyName}>{stock.name?.slice(0, 28)}</div>
      </td>
      <td className={styles.numCell}>
        ₹
        {stock.price?.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </td>
      <td className={`${styles.changeCell} ${up ? styles.up : styles.down}`}>
        {up ? "▲" : "▼"} {Math.abs(stock.change ?? 0).toFixed(2)}
      </td>
      <td className={`${styles.changeCell} ${up ? styles.up : styles.down}`}>
        {up ? "+" : ""}
        {(stock.percentChange ?? 0).toFixed(2)}%
      </td>
      <td className={styles.volumeCell}>
        {stock.volume?.toLocaleString("en-IN")}
      </td>
      <td className={styles.statusCell}>
        <span
          className={`${styles.badge} ${
            stock.marketState === "REGULAR"
              ? styles.badgeLive
              : styles.badgeClosed
          }`}
        >
          {stock.marketState || "—"}
        </span>
      </td>
    </tr>
  );
}
