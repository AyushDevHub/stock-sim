import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import styles from "./ScenarioArena.module.css";

export default function ScenarioArena() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, login } = useAuth();

  const [scenario, setScenario] = useState(null);
  const [prices, setPrices] = useState({}); // { symbol: number }
  const [cash, setCash] = useState(100000);
  const [holdings, setHoldings] = useState({}); // { symbol: { qty, avgPrice } }
  const [orders, setOrders] = useState([]);
  const [activeEvent, setActiveEvent] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState(null);
  const [qty, setQty] = useState({});
  const [sentiment, setSentiment] = useState(50); // fear/greed 0-100
  const [alertMsg, setAlertMsg] = useState(null);

  const tickRef = useRef(null);
  const elapsedRef = useRef(0);
  const pricesRef = useRef({});
  const cashRef = useRef(100000);
  const holdingsRef = useRef({});
  const ordersRef = useRef([]);

  // Seed stocks used in the scenario
  const STOCKS = ["RELIANCE", "TCS", "INFY", "HDFCBANK", "WIPRO"];
  const BASE_PRICES = {
    RELIANCE: 2850,
    TCS: 3920,
    INFY: 1740,
    HDFCBANK: 1650,
    WIPRO: 540,
  };

  useEffect(() => {
    console.log("Loading scenario:", id);

    const loadScenario = async () => {
      try {
        const { data } = await api.get(`/scenarios/${id}`);

        console.log("Scenario loaded:", data);

        if (!data?.scenario) {
          console.error("No scenario returned");
          return;
        }

        setScenario(data.scenario);

        const initPrices = {};

        STOCKS.forEach((symbol) => {
          initPrices[symbol] = BASE_PRICES[symbol];
        });

        setPrices(initPrices);
        pricesRef.current = initPrices;

        const startCash = data.scenario.startingCash ?? 100000;

        setCash(startCash);
        cashRef.current = startCash;
      } catch (error) {
        console.error("Failed to load scenario");

        console.log("Status:", error.response?.status);
        console.log("Response:", error.response?.data);
        console.log(error);
      }
    };

    loadScenario();
  }, [id]);

  const generateTick = useCallback(() => {
    if (!scenario) return;
    elapsedRef.current += 1;
    const t = elapsedRef.current;

    // Check for event at this tick
    const event = scenario.events?.find((ev) => Math.abs(ev.time - t) < 1);
    if (event) {
      setActiveEvent(event);
      setTimeout(() => setActiveEvent(null), 5000);
      // Adjust sentiment
      setSentiment((prev) =>
        Math.max(0, Math.min(100, prev + (event.impact > 0 ? 15 : -18)))
      );
    }

    // Update prices
    const newPrices = { ...pricesRef.current };
    STOCKS.forEach((sym) => {
      const old = newPrices[sym];
      const noise =
        (Math.random() - 0.5) * 2 * scenario.volatility * old * 0.015;
      const trend = scenario.marketTrend * old * 0.002;
      const shock =
        event &&
        (event.sector === "all" || sym.includes(event.sector?.toUpperCase?.()))
          ? (event.impact / 100) * old
          : 0;
      newPrices[sym] = Math.max(1, old + noise + trend + shock);
    });

    pricesRef.current = newPrices;
    setPrices({ ...newPrices });
    setElapsed(t);

    if (t >= scenario.duration) {
      endScenario();
    }
  }, [scenario]);

  useEffect(() => {
    if (running) {
      tickRef.current = setInterval(generateTick, 1000);
    }
    return () => clearInterval(tickRef.current);
  }, [running, generateTick]);

  const startScenario = () => setRunning(true);

  const endScenario = async () => {
    clearInterval(tickRef.current);
    setRunning(false);
    setFinished(true);

    // Calculate final portfolio value
    const portfolioValue = Object.entries(holdingsRef.current).reduce(
      (sum, [sym, h]) => {
        return sum + h.qty * (pricesRef.current[sym] ?? 0);
      },
      0
    );
    const finalValue = cashRef.current + portfolioValue;

    // Stats
    const sells = ordersRef.current.filter((o) => o.type === "sell");
    const wins = sells.filter((o) => {
      const buyAvg = holdingsRef.current[o.symbol]?.avgPrice ?? o.price;
      return o.price > buyAvg;
    }).length;
    const winRate =
      sells.length > 0 ? Math.round((wins / sells.length) * 100) : 0;

    try {
      const { data } = await api.post(`/scenarios/${id}/complete`, {
        finalPortfolioValue: finalValue,
        tradeCount: ordersRef.current.length,
        winRate,
      });
      setResult({ ...data, finalValue, portfolioValue, winRate });
    } catch (e) {
      setResult({ finalValue, portfolioValue, winRate, score: 0, xpEarned: 0 });
    }
  };

  const trade = (symbol, type) => {
    const q = parseInt(qty[symbol] ?? 1);
    if (!q || q <= 0) return;
    const price = pricesRef.current[symbol];
    const total = price * q;

    if (type === "buy") {
      if (cashRef.current < total) {
        showAlert("Insufficient cash!", "error");
        return;
      }
      cashRef.current -= total;
      holdingsRef.current = {
        ...holdingsRef.current,
        [symbol]: {
          qty: (holdingsRef.current[symbol]?.qty ?? 0) + q,
          avgPrice: price,
        },
      };
    } else {
      const held = holdingsRef.current[symbol]?.qty ?? 0;
      if (held < q) {
        showAlert("Not enough shares!", "error");
        return;
      }
      cashRef.current += total;
      const newQty = held - q;
      if (newQty === 0) {
        const updated = { ...holdingsRef.current };
        delete updated[symbol];
        holdingsRef.current = updated;
      } else {
        holdingsRef.current[symbol].qty = newQty;
      }
    }

    const order = {
      symbol,
      type,
      qty: q,
      price,
      total,
      time: elapsedRef.current,
    };
    ordersRef.current = [...ordersRef.current, order];
    setOrders([...ordersRef.current]);
    setCash(cashRef.current);
    setHoldings({ ...holdingsRef.current });
    showAlert(
      `${type.toUpperCase()} ${q} × ${symbol} @ ₹${price.toFixed(0)}`,
      "success"
    );
  };

  const showAlert = (msg, type) => {
    setAlertMsg({ msg, type });
    setTimeout(() => setAlertMsg(null), 2500);
  };

  const portfolioValue = Object.entries(holdings).reduce(
    (sum, [sym, h]) => sum + h.qty * (prices[sym] ?? 0),
    0
  );
  const totalAssets = cash + portfolioValue;
  const startingCash = scenario?.startingCash ?? 100000;
  const returnPct = ((totalAssets - startingCash) / startingCash) * 100;
  const progress = scenario
    ? Math.min(100, (elapsed / scenario.duration) * 100)
    : 0;
  const timeLeft = scenario ? scenario.duration - elapsed : 0;

  const sentimentLabel =
    sentiment > 70
      ? "EXTREME GREED"
      : sentiment > 55
      ? "GREED"
      : sentiment > 45
      ? "NEUTRAL"
      : sentiment > 30
      ? "FEAR"
      : "EXTREME FEAR";
  const sentimentColor =
    sentiment > 55 ? "#00d68f" : sentiment > 45 ? "#ffb800" : "#ff4757";

  if (!scenario) return <div className={styles.loading}>Loading scenario…</div>;

  if (finished && result) {
    return (
      <div className={styles.results}>
        <div className={styles.resultsCard}>
          <div className={styles.resultsBadge}>
            {returnPct >= 0 ? "🏆" : "💀"}
          </div>
          <h2 className={styles.resultsTitle}>Scenario Complete</h2>
          <div className={styles.resultsName}>{scenario.name}</div>

          <div className={styles.resultsGrid}>
            <div className={styles.resultStat}>
              <div
                className={`${styles.rVal} ${
                  returnPct >= 0 ? styles.green : styles.red
                }`}
              >
                {returnPct >= 0 ? "+" : ""}
                {returnPct.toFixed(2)}%
              </div>
              <div className={styles.rLbl}>RETURN</div>
            </div>
            <div className={styles.resultStat}>
              <div className={styles.rVal}>
                ₹{Math.round(result.finalValue).toLocaleString("en-IN")}
              </div>
              <div className={styles.rLbl}>FINAL VALUE</div>
            </div>
            <div className={styles.resultStat}>
              <div className={styles.rVal}>{result.score ?? 0}</div>
              <div className={styles.rLbl}>SCORE</div>
            </div>
            <div className={styles.resultStat}>
              <div className={`${styles.rVal} ${styles.indigo}`}>
                +{result.xpEarned ?? 0} XP
              </div>
              <div className={styles.rLbl}>XP EARNED</div>
            </div>
            <div className={styles.resultStat}>
              <div className={styles.rVal}>{result.winRate ?? 0}%</div>
              <div className={styles.rLbl}>WIN RATE</div>
            </div>
            <div className={styles.resultStat}>
              <div className={styles.rVal}>{orders.length}</div>
              <div className={styles.rLbl}>TRADES</div>
            </div>
          </div>

          {result.newAchievements?.length > 0 && (
            <div className={styles.achievements}>
              <div className={styles.achTitle}>🏅 Achievements Unlocked</div>
              {result.newAchievements.map((a) => (
                <div key={a.id} className={styles.ach}>
                  <span className={styles.achName}>{a.name}</span>
                  <span className={styles.achXP}>+{a.xpReward} XP</span>
                </div>
              ))}
            </div>
          )}

          <div className={styles.resultsBtns}>
            <button
              className={styles.retryBtn}
              onClick={() => window.location.reload()}
            >
              RETRY
            </button>
            <button
              className={styles.backBtn}
              onClick={() => navigate("/scenarios")}
            >
              BACK TO SCENARIOS
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${styles.arena} ${
        activeEvent && activeEvent.impact < -8 ? styles.redFlash : ""
      }`}
    >
      {/* Alert toast */}
      {alertMsg && (
        <div
          className={`${styles.toast} ${
            alertMsg.type === "success" ? styles.toastGreen : styles.toastRed
          }`}
        >
          {alertMsg.msg}
        </div>
      )}

      {/* Breaking News overlay */}
      {activeEvent && (
        <div
          className={`${styles.newsOverlay} ${
            activeEvent.impact < 0 ? styles.newsRed : styles.newsGreen
          }`}
        >
          <div className={styles.newsBreaking}>⚡ BREAKING NEWS</div>
          <div className={styles.newsTitle}>{activeEvent.title}</div>
          <div className={styles.newsDesc}>{activeEvent.description}</div>
          <div
            className={`${styles.newsImpact} ${
              activeEvent.impact < 0 ? styles.red : styles.green
            }`}
          >
            Market Impact: {activeEvent.impact > 0 ? "+" : ""}
            {activeEvent.impact}%
          </div>
        </div>
      )}

      {/* Top HUD */}
      <div className={styles.hud}>
        <div className={styles.hudLeft}>
          <span className={styles.scenarioName}>{scenario.name}</span>
          <div className={styles.timerBar}>
            <div className={styles.timerTrack}>
              <div
                className={styles.timerFill}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className={styles.timerNum}>{timeLeft}s</span>
          </div>
        </div>

        <div className={styles.hudCenter}>
          <div className={styles.hudStat}>
            <div
              className={`${styles.hudVal} ${
                returnPct >= 0 ? styles.green : styles.red
              }`}
            >
              {returnPct >= 0 ? "+" : ""}
              {returnPct.toFixed(2)}%
            </div>
            <div className={styles.hudLbl}>RETURN</div>
          </div>
          <div className={styles.hudStat}>
            <div className={styles.hudVal}>
              ₹{Math.round(totalAssets).toLocaleString("en-IN")}
            </div>
            <div className={styles.hudLbl}>TOTAL ASSETS</div>
          </div>
          <div className={styles.hudStat}>
            <div className={styles.hudVal}>
              ₹{Math.round(cash).toLocaleString("en-IN")}
            </div>
            <div className={styles.hudLbl}>CASH</div>
          </div>
        </div>

        <div className={styles.hudRight}>
          <div className={styles.sentimentMeter}>
            <div className={styles.sentLbl}>MARKET SENTIMENT</div>
            <div className={styles.sentBar}>
              <div
                className={styles.sentFill}
                style={{ width: `${sentiment}%`, background: sentimentColor }}
              />
            </div>
            <div className={styles.sentLabel} style={{ color: sentimentColor }}>
              {sentimentLabel}
            </div>
          </div>

          {!running && !finished && (
            <button className={styles.launchBtn} onClick={startScenario}>
              ▶ START
            </button>
          )}
          {running && (
            <div className={styles.livePill}>
              <span className={styles.liveDot} /> LIVE
            </div>
          )}
        </div>
      </div>

      {/* Main: stock grid + order log */}
      <div className={styles.main}>
        <div className={styles.stockGrid}>
          {STOCKS.map((sym) => {
            const price = prices[sym] ?? BASE_PRICES[sym];
            const base = BASE_PRICES[sym];
            const change = price - base;
            const changePct = ((change / base) * 100).toFixed(2);
            const held = holdings[sym]?.qty ?? 0;
            const up = change >= 0;

            return (
              <div
                key={sym}
                className={`${styles.stockCard} ${
                  up ? styles.stockUp : styles.stockDown
                }`}
              >
                <div className={styles.stockTop}>
                  <span className={styles.stockSym}>{sym}</span>
                  <span
                    className={`${styles.stockChange} ${
                      up ? styles.green : styles.red
                    }`}
                  >
                    {up ? "▲" : "▼"} {Math.abs(changePct)}%
                  </span>
                </div>
                <div className={styles.stockPrice}>
                  ₹{price.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </div>
                {held > 0 && (
                  <div className={styles.stockHeld}>{held} held</div>
                )}
                <div className={styles.stockActions}>
                  <input
                    type="number"
                    min="1"
                    value={qty[sym] ?? ""}
                    placeholder="qty"
                    onChange={(e) =>
                      setQty((prev) => ({ ...prev, [sym]: e.target.value }))
                    }
                    className={styles.qtyInput}
                  />
                  <button
                    className={styles.buyBtn}
                    onClick={() => running && trade(sym, "buy")}
                    disabled={!running}
                  >
                    BUY
                  </button>
                  <button
                    className={styles.sellBtn}
                    onClick={() => running && trade(sym, "sell")}
                    disabled={!running || !held}
                  >
                    SELL
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order log */}
        <div className={styles.orderLog}>
          <div className={styles.orderLogTitle}>ORDER LOG</div>
          {orders.length === 0 ? (
            <div className={styles.orderEmpty}>No trades yet</div>
          ) : (
            [...orders]
              .reverse()
              .slice(0, 20)
              .map((o, i) => (
                <div key={i} className={styles.orderRow}>
                  <span
                    className={`${styles.orderType} ${
                      o.type === "buy" ? styles.green : styles.red
                    }`}
                  >
                    {o.type.toUpperCase()}
                  </span>
                  <span className={styles.orderSym}>{o.symbol}</span>
                  <span className={styles.orderDetail}>
                    {o.qty} × ₹{Math.round(o.price)}
                  </span>
                  <span className={styles.orderTime}>T+{o.time}s</span>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}
