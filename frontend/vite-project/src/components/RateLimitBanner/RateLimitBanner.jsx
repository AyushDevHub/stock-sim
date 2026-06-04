import { useState, useEffect } from "react";
import styles from "./RateLimitBanner.module.css";

const pad = (n) => String(n).padStart(2, "0");

const formatCountdown = (ms) => {
  if (ms <= 0) return "00:00";
  const totalSec = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  if (hours > 0) return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(minutes)}:${pad(seconds)}`;
};

const formatResumeTime = (ts) =>
  new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

/**
 * RateLimitBanner
 * Props:
 *   rateLimit : { retryAfterMs, retryAt, message } | null
 *   onClear   : () => void  — called when banner auto-dismisses
 */
export default function RateLimitBanner({ rateLimit, onClear }) {
  const [remaining, setRemaining] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [resumeTime, setResumeTime] = useState("");

  // Reset dismissed + start state on every new rate-limit event
  useEffect(() => {
    if (rateLimit) {
      setDismissed(false);
      setRemaining(Math.max(0, rateLimit.retryAt - Date.now()));
      setResumeTime(formatResumeTime(rateLimit.retryAt));
    }
  }, [rateLimit]);

  // Countdown ticker — auto-dismisses 2 s after hitting zero
  useEffect(() => {
    if (!rateLimit || dismissed) return;

    const tick = () => {
      const left = Math.max(0, rateLimit.retryAt - Date.now());
      setRemaining(left);
      if (left === 0) {
        setTimeout(() => {
          setDismissed(true);
          onClear?.();
        }, 2000);
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [rateLimit, dismissed, onClear]);

  if (!rateLimit || dismissed) return null;

  const isOver = remaining <= 0;

  return (
    <div className={`${styles.overlay} ${isOver ? styles.resolved : ""}`}>
      <div className={styles.popup}>
        {/* Icon */}
        <div className={styles.iconWrap}>
          {isOver ? (
            <svg viewBox="0 0 24 24" fill="none" className={styles.icon}>
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M7 12.5l3.5 3.5 6-7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" className={styles.icon}>
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M12 6v6l4 2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          )}
        </div>

        {/* Close */}
        <button
          className={styles.closeBtn}
          onClick={() => {
            setDismissed(true);
            onClear?.();
          }}
          aria-label="Dismiss"
        >
          ✕
        </button>

        <h3 className={styles.title}>
          {isOver ? "✅ Prices Resuming" : "⏳ Price Feed Paused"}
        </h3>

        {isOver ? (
          <p className={styles.body}>
            Rate limit lifted — live prices will update shortly.
          </p>
        ) : (
          <>
            <p className={styles.body}>
              Yahoo Finance has rate-limited this server.
              <br />
              Existing prices are still displayed — no data lost.
            </p>

            {/* Digital countdown clock */}
            <div className={styles.countdown}>
              <span className={styles.countdownLabel}>Yahoo API resets in</span>
              <span className={styles.countdownValue}>
                {formatCountdown(remaining)}
              </span>
              <span className={styles.countdownSub}>
                resumes at {resumeTime}
              </span>
            </div>

            {/* Progress bar */}
            <div className={styles.progressTrack}>
              <div
                className={styles.progressBar}
                style={{
                  width: `${Math.max(
                    0,
                    100 - (remaining / rateLimit.retryAfterMs) * 100
                  )}%`,
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
