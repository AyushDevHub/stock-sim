import { useState, useEffect } from "react";
import styles from "./RateLimitBanner.module.css";

/**
 * Formats a duration in milliseconds into a human-readable string.
 * e.g. 90000 → "1 minute 30 seconds"
 */
const formatDuration = (ms) => {
  if (ms <= 0) return "a moment";
  const totalSec = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours} hour${hours > 1 ? "s" : ""}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? "s" : ""}`);
  if (seconds > 0 && hours === 0)
    parts.push(`${seconds} second${seconds > 1 ? "s" : ""}`);
  return parts.join(" ") || "a moment";
};

/**
 * RateLimitBanner
 * Shows a dismissible popup when Yahoo Finance rate limits are hit.
 * Props:
 *   rateLimit: { retryAfterMs: number, retryAt: number, message: string } | null
 */
export default function RateLimitBanner({ rateLimit }) {
  const [remaining, setRemaining] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  // Reset dismissed state whenever a new rate limit event arrives
  useEffect(() => {
    if (rateLimit) {
      setDismissed(false);
      setRemaining(Math.max(0, rateLimit.retryAt - Date.now()));
    }
  }, [rateLimit]);

  // Countdown ticker
  useEffect(() => {
    if (!rateLimit || dismissed) return;

    const tick = () => {
      const left = Math.max(0, rateLimit.retryAt - Date.now());
      setRemaining(left);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [rateLimit, dismissed]);

  if (!rateLimit || dismissed) return null;

  const isOver = remaining <= 0;

  return (
    <div className={`${styles.overlay} ${isOver ? styles.resolved : ""}`}>
      <div className={styles.popup}>
        {/* Icon */}
        <div className={styles.iconWrap}>
          <svg viewBox="0 0 24 24" fill="none" className={styles.icon}>
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M12 7v5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="12" cy="16" r="1" fill="currentColor" />
          </svg>
        </div>

        <button
          className={styles.closeBtn}
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
        >
          ✕
        </button>

        <h3 className={styles.title}>
          {isOver ? "✅ Price Updates Resuming" : "⏳ Price Feed Paused"}
        </h3>

        {isOver ? (
          <p className={styles.body}>
            The rate limit has lifted. Live prices will refresh shortly.
          </p>
        ) : (
          <>
            <p className={styles.body}>
              Yahoo Finance has temporarily rate-limited the server.
              <br />
              Live prices are paused — your existing data is still valid.
            </p>

            <div className={styles.countdown}>
              <span className={styles.countdownLabel}>Try again in</span>
              <span className={styles.countdownValue}>
                {formatDuration(remaining)}
              </span>
            </div>

            <p className={styles.retryAt}>
              Resumes at&nbsp;
              <strong>
                {new Date(rateLimit.retryAt).toLocaleTimeString()}
              </strong>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
