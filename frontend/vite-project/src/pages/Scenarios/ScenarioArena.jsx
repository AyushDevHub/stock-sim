import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api.js";
import styles from "./ScenarioArena.module.css";

// ─── Constants ────────────────────────────────────────────────────────────────

const STOCKS = ["RELIANCE", "TCS", "INFY", "HDFCBANK", "WIPRO"];

const BASE_PRICES = {
  RELIANCE: 2850,
  TCS: 3920,
  INFY: 1740,
  HDFCBANK: 1650,
  WIPRO: 540,
};

// COVID-specific historically accurate prices (Feb 19 peak → Mar 23 low → Dec recovery)
const COVID_BASE_PRICES = {
  RELIANCE: 1595,
  TCS: 2165,
  INFY: 760,
  HDFCBANK: 1245,
  WIPRO: 229,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getActivePhase(scenario, elapsed) {
  if (!scenario?.phases) return null;
  return (
    scenario.phases.find(
      (p) => elapsed >= p.startTime && elapsed < p.endTime
    ) ?? scenario.phases[scenario.phases.length - 1]
  );
}

function fmtTime(s) {
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function calcPsychTitle(boughtDuringCrash, soldDuringCrash, heldThroughCrash) {
  if (boughtDuringCrash)
    return { title: "Smart Investor", icon: "🧠", color: "#00d68f" };
  if (soldDuringCrash)
    return { title: "Panic Seller", icon: "😱", color: "#ff4757" };
  if (heldThroughCrash)
    return { title: "Survivor", icon: "😤", color: "#ffb800" };
  return { title: "Observer", icon: "👀", color: "#8892a4" };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ScenarioArena() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [scenario, setScenario] = useState(null);
  const [prices, setPrices] = useState({});
  const [tickDir, setTickDir] = useState({}); // { SYM: 'up'|'down' } — cleared after flash
  const [cash, setCash] = useState(100000);
  const [holdings, setHoldings] = useState({});
  const [orders, setOrders] = useState([]);
  const [activeEvent, setActiveEvent] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState(null);
  const [qty, setQty] = useState({});
  const [sentiment, setSentiment] = useState(50);
  const [alertMsg, setAlertMsg] = useState(null);
  const [currentPhase, setCurrentPhase] = useState(null);

  // FOMO / crash mechanics
  const [fomoOverlay, setFomoOverlay] = useState(null); // { message }
  const [crashTimer, setCrashTimer] = useState(null); // seconds remaining
  const [crashActive, setCrashActive] = useState(false);
  const [phaseTransition, setPhaseTransition] = useState(null); // phase object
  const [decisionWindow, setDecisionWindow] = useState(null); // { seconds, event }
  const [decisionTimer, setDecisionTimer] = useState(0);

  // Psychology tracking (COVID-specific)
  const [decisions, setDecisions] = useState([]);
  const boughtDuringCrashRef = useRef(false);
  const soldDuringCrashRef = useRef(false);
  const heldThroughCrashRef = useRef(false);
  const lastCrashCheckRef = useRef(false); // had holdings when crash started

  // Refs for tick access
  const tickRef = useRef(null);
  const crashTimerRef = useRef(null);
  const decisionTimerRef = useRef(null);
  const elapsedRef = useRef(0);
  const pricesRef = useRef({});
  const cashRef = useRef(100000);
  const holdingsRef = useRef({});
  const ordersRef = useRef([]);
  const scenarioRef = useRef(null);
  const firedEventsRef = useRef(new Set());
  const lastPhaseRef = useRef(null);

  const isCovidScenario = id === "covid_crash";

  // ── Load scenario ──────────────────────────────────────────────────────────

  useEffect(() => {
    const loadScenario = async () => {
      try {
        const { data } = await api.get(`/scenarios/${id}`);
        if (!data?.scenario) return;

        const sc = data.scenario;
        setScenario(sc);
        scenarioRef.current = sc;

        const basePrices = isCovidScenario ? COVID_BASE_PRICES : BASE_PRICES;
        const initPrices = {};
        STOCKS.forEach((sym) => {
          initPrices[sym] = basePrices[sym];
        });

        setPrices(initPrices);
        pricesRef.current = initPrices;

        const startCash = sc.startingCash ?? 100000;
        setCash(startCash);
        cashRef.current = startCash;

        if (sc.phases?.length) {
          setCurrentPhase(sc.phases[0]);
          lastPhaseRef.current = sc.phases[0];
        }
      } catch (err) {
        console.error("Failed to load scenario", err);
      }
    };
    loadScenario();
  }, [id]);

  // ── Price tick ────────────────────────────────────────────────────────────

  const generateTick = useCallback(() => {
    const sc = scenarioRef.current;
    if (!sc) return;

    elapsedRef.current += 1;
    const t = elapsedRef.current;

    // Get active phase
    const phase = getActivePhase(sc, t);
    const phaseVolatility = phase?.volatility ?? sc.volatility;
    const phaseTrend = phase?.marketTrend ?? sc.marketTrend;

    // Phase transition detection
    if (phase && phase.id !== lastPhaseRef.current?.id) {
      lastPhaseRef.current = phase;
      setCurrentPhase(phase);
      setPhaseTransition(phase);
      setTimeout(() => setPhaseTransition(null), 4000);

      // Update sentiment on phase change
      setSentiment((prev) =>
        Math.max(5, Math.min(95, prev + (phase.sentimentBias ?? 0)))
      );

      // Mark crash phase — check if user had holdings
      if (phase.id === "crash") {
        setCrashActive(true);
        const hadHoldings = Object.keys(holdingsRef.current).length > 0;
        lastCrashCheckRef.current = hadHoldings;
        if (hadHoldings) heldThroughCrashRef.current = true;
      }

      if (phase.id === "decision_test") {
        setCrashActive(false);
      }
    }

    // Check events
    const event = sc.events?.find(
      (ev) => Math.abs(ev.time - t) < 1 && !firedEventsRef.current.has(ev.time)
    );

    if (event) {
      firedEventsRef.current.add(event.time);
      setActiveEvent(event);
      setTimeout(() => setActiveEvent(null), 6000);

      // FOMO overlay
      if (event.isFOMO && event.fomoMessage) {
        setFomoOverlay({ message: event.fomoMessage });
        setTimeout(() => setFomoOverlay(null), 5000);
      }

      // Crash timer
      if (event.hasTimer && event.timerSeconds) {
        let remaining = event.timerSeconds;
        setCrashTimer(remaining);
        clearInterval(crashTimerRef.current);
        crashTimerRef.current = setInterval(() => {
          remaining -= 1;
          setCrashTimer(remaining);
          if (remaining <= 0) {
            clearInterval(crashTimerRef.current);
            setCrashTimer(null);
          }
        }, 1000);
      }

      // Decision window
      if (event.decisionWindow) {
        let dRemaining = event.decisionWindow;
        setDecisionWindow({ seconds: dRemaining, event });
        setDecisionTimer(dRemaining);
        clearInterval(decisionTimerRef.current);
        decisionTimerRef.current = setInterval(() => {
          dRemaining -= 1;
          setDecisionTimer(dRemaining);
          if (dRemaining <= 0) {
            clearInterval(decisionTimerRef.current);
            setDecisionWindow(null);
          }
        }, 1000);
      }

      // Sentiment impact
      setSentiment((prev) =>
        Math.max(5, Math.min(95, prev + (event.impact > 0 ? 12 : -18)))
      );

      // Record decision context
      if (phase) {
        setDecisions((prev) => [
          ...prev,
          { time: t, phase: phase.id, event: event.title },
        ]);
      }
    }

    // Update prices
    const newPrices = { ...pricesRef.current };
    STOCKS.forEach((sym) => {
      const old = newPrices[sym];
      const noise = (Math.random() - 0.5) * 2 * phaseVolatility * old * 0.015;
      const trend = phaseTrend * old * 0.002;
      const shock =
        event &&
        (event.sector === "all" ||
          sym.toLowerCase().includes(event.sector?.toLowerCase?.()))
          ? (event.impact / 100) * old
          : 0;
      newPrices[sym] = Math.max(1, old + noise + trend + shock);
    });

    // Compute tick direction for flash animation
    const dirs = {};
    STOCKS.forEach((sym) => {
      dirs[sym] = newPrices[sym] >= pricesRef.current[sym] ? "up" : "down";
    });

    pricesRef.current = newPrices;
    setPrices({ ...newPrices });
    setTickDir(dirs);
    setTimeout(() => setTickDir({}), 620);
    setElapsed(t);

    if (t >= sc.duration) endScenario();
  }, []);

  // ── Run ticker ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (running) {
      tickRef.current = setInterval(generateTick, 1000);
    }
    return () => clearInterval(tickRef.current);
  }, [running, generateTick]);

  // ── Cleanup timers on unmount ─────────────────────────────────────────────

  useEffect(() => {
    return () => {
      clearInterval(tickRef.current);
      clearInterval(crashTimerRef.current);
      clearInterval(decisionTimerRef.current);
    };
  }, []);

  // ── Start / End ────────────────────────────────────────────────────────────

  const startScenario = () => setRunning(true);

  const endScenario = useCallback(async () => {
    clearInterval(tickRef.current);
    clearInterval(crashTimerRef.current);
    clearInterval(decisionTimerRef.current);
    setRunning(false);
    setFinished(true);
    setCrashActive(false);
    setCrashTimer(null);

    const portfolioValue = Object.entries(holdingsRef.current).reduce(
      (sum, [sym, h]) => sum + h.qty * (pricesRef.current[sym] ?? 0),
      0
    );
    const finalValue = cashRef.current + portfolioValue;

    const sells = ordersRef.current.filter((o) => o.type === "sell");
    const wins = sells.filter((o) => {
      const buyAvg = holdingsRef.current[o.symbol]?.avgPrice ?? o.price;
      return o.price > buyAvg;
    }).length;
    const winRate =
      sells.length > 0 ? Math.round((wins / sells.length) * 100) : 0;
    const stockCount = new Set(ordersRef.current.map((o) => o.symbol)).size;

    try {
      const { data } = await api.post(`/scenarios/${id}/complete`, {
        finalPortfolioValue: finalValue,
        tradeCount: ordersRef.current.length,
        winRate,
        boughtDuringCrash: boughtDuringCrashRef.current,
        soldDuringCrash: soldDuringCrashRef.current,
        heldThroughCrash: heldThroughCrashRef.current,
        stockCount,
        decisions,
      });
      setResult({ ...data, finalValue, portfolioValue, winRate });
    } catch {
      setResult({ finalValue, portfolioValue, winRate, score: 0, xpEarned: 0 });
    }
  }, [id, decisions]);

  // ── Trade ──────────────────────────────────────────────────────────────────

  const trade = useCallback(
    (symbol, type) => {
      const q = parseInt(qty[symbol] ?? 1);
      if (!q || q <= 0) return;

      const price = pricesRef.current[symbol];
      const total = price * q;
      const phase = lastPhaseRef.current;

      if (type === "buy") {
        if (cashRef.current < total) {
          showAlert("Insufficient cash!", "error");
          return;
        }
        cashRef.current -= total;
        const prev = holdingsRef.current[symbol];
        const prevQty = prev?.qty ?? 0;
        const prevAvg = prev?.avgPrice ?? price;
        holdingsRef.current = {
          ...holdingsRef.current,
          [symbol]: {
            qty: prevQty + q,
            avgPrice: (prevAvg * prevQty + price * q) / (prevQty + q),
          },
        };

        // COVID psychology: mark buy during crash
        if (
          isCovidScenario &&
          (phase?.id === "crash" || phase?.id === "decision_test")
        ) {
          boughtDuringCrashRef.current = true;
          heldThroughCrashRef.current = false; // buying is better than just holding
        }
      } else {
        const held = holdingsRef.current[symbol]?.qty ?? 0;
        if (held < q) {
          showAlert("Not enough shares!", "error");
          return;
        }
        cashRef.current += total;
        const newQty = held - q;
        const updated = { ...holdingsRef.current };
        if (newQty === 0) delete updated[symbol];
        else updated[symbol] = { ...updated[symbol], qty: newQty };
        holdingsRef.current = updated;

        // COVID psychology: mark sell during crash
        if (
          isCovidScenario &&
          (phase?.id === "crash" || phase?.id === "panic_begins")
        ) {
          soldDuringCrashRef.current = true;
          heldThroughCrashRef.current = false;
        }
      }

      const order = {
        symbol,
        type,
        qty: q,
        price,
        total,
        time: elapsedRef.current,
        phase: phase?.id,
      };
      ordersRef.current = [...ordersRef.current, order];
      setOrders([...ordersRef.current]);
      setCash(cashRef.current);
      setHoldings({ ...holdingsRef.current });
      showAlert(
        `${type.toUpperCase()} ${q} × ${symbol} @ ₹${price.toFixed(0)}`,
        "success"
      );
    },
    [qty, isCovidScenario]
  );

  const showAlert = (msg, type) => {
    setAlertMsg({ msg, type });
    setTimeout(() => setAlertMsg(null), 2500);
  };

  // ── Derived values ─────────────────────────────────────────────────────────

  const basePrices = isCovidScenario ? COVID_BASE_PRICES : BASE_PRICES;
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
      : sentiment > 25
      ? "FEAR"
      : "EXTREME FEAR";

  const sentimentColor =
    sentiment > 55
      ? "#00d68f"
      : sentiment > 45
      ? "#ffb800"
      : sentiment > 25
      ? "#ff9800"
      : "#ff4757";

  const psychState = calcPsychTitle(
    boughtDuringCrashRef.current,
    soldDuringCrashRef.current,
    heldThroughCrashRef.current
  );

  // ── Guards ─────────────────────────────────────────────────────────────────

  if (!scenario) {
    return <div className={styles.loading}>Loading scenario…</div>;
  }

  // ── Results screen ─────────────────────────────────────────────────────────

  if (finished && result) {
    const finalReturnPct =
      ((result.finalValue - startingCash) / startingCash) * 100;
    const psych = result.psychTitle
      ? {
          title: result.psychTitle,
          icon: result.psychIcon ?? "🧠",
          color: "#00d68f",
        }
      : psychState;

    return (
      <div className={styles.results}>
        <div className={styles.resultsCard}>
          {/* Badge */}
          <div className={styles.resultsBadge}>{psych.icon}</div>
          <div className={styles.psychTitleBig} style={{ color: psych.color }}>
            {psych.title}
          </div>
          <h2 className={styles.resultsTitle}>Scenario Complete</h2>
          <div className={styles.resultsName}>{scenario.name}</div>

          {/* Stats grid */}
          <div className={styles.resultsGrid}>
            <div className={styles.resultStat}>
              <div
                className={`${styles.rVal} ${
                  finalReturnPct >= 0 ? styles.green : styles.red
                }`}
              >
                {finalReturnPct >= 0 ? "+" : ""}
                {finalReturnPct.toFixed(2)}%
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

          {/* Psychology breakdown — COVID only */}
          {isCovidScenario && result.behaviorBreakdown?.length > 0 && (
            <div className={styles.psychBreakdown}>
              <div className={styles.psychBreakdownTitle}>
                📊 BEHAVIOR ANALYSIS
              </div>
              {result.behaviorBreakdown.map((b, i) => (
                <div
                  key={i}
                  className={`${styles.psychRow} ${styles[`psych_${b.type}`]}`}
                >
                  <div className={styles.psychRowLeft}>
                    <span className={styles.psychRowLabel}>{b.label}</span>
                    <span className={styles.psychRowDetail}>{b.detail}</span>
                  </div>
                  <span
                    className={`${styles.psychRowImpact} ${
                      b.type === "positive"
                        ? styles.green
                        : b.type === "negative"
                        ? styles.red
                        : styles.amber
                    }`}
                  >
                    {b.impact}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Psychology feedback — COVID only */}
          {isCovidScenario && result.psychFeedback?.length > 0 && (
            <div className={styles.psychFeedback}>
              <div className={styles.psychFeedbackTitle}>
                🧠 WHAT THIS MEANS
              </div>
              {result.psychFeedback.map((f, i) => (
                <p key={i} className={styles.psychFeedbackText}>
                  {f}
                </p>
              ))}
            </div>
          )}

          {/* Achievements */}
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

          {/* Historic context — COVID only */}
          {isCovidScenario && scenario.historicContext && (
            <div className={styles.historicContext}>
              <div className={styles.historicTitle}>
                📈 WHAT ACTUALLY HAPPENED
              </div>
              <div className={styles.historicGrid}>
                <div className={styles.historicItem}>
                  <div className={styles.historicLabel}>Peak → Trough</div>
                  <div className={`${styles.historicVal} ${styles.red}`}>
                    {scenario.historicContext.crash.drawdown}
                  </div>
                  <div className={styles.historicNote}>
                    {scenario.historicContext.crash.note}
                  </div>
                </div>
                <div className={styles.historicItem}>
                  <div className={styles.historicLabel}>Bottom → Year End</div>
                  <div className={`${styles.historicVal} ${styles.green}`}>
                    {scenario.historicContext.recovery.gain}
                  </div>
                  <div className={styles.historicNote}>
                    {scenario.historicContext.recovery.note}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Learning objectives */}
          {scenario.learningObjectives?.length > 0 && (
            <div className={styles.learningBox}>
              <div className={styles.learningTitle}>💡 KEY LESSONS</div>
              {scenario.learningObjectives.map((l, i) => (
                <div key={i} className={styles.learningItem}>
                  <span className={styles.learningDot} />
                  <span>{l}</span>
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

  // ── Arena ──────────────────────────────────────────────────────────────────

  return (
    <div
      className={`${styles.arena}
      ${crashActive ? styles.crashMode : ""}
      ${activeEvent?.isCrash ? styles.redFlash : ""}
      ${currentPhase?.id === "recovery" ? styles.recoveryMode : ""}
    `}
    >
      {/* Trade alert toast */}
      {alertMsg && (
        <div
          className={`${styles.toast} ${
            alertMsg.type === "success" ? styles.toastGreen : styles.toastRed
          }`}
        >
          {alertMsg.msg}
        </div>
      )}

      {/* Phase transition banner */}
      {phaseTransition && (
        <div
          className={`${styles.phaseBanner} ${
            styles[`phase_${phaseTransition.id}`]
          }`}
        >
          <div className={styles.phaseBannerName}>{phaseTransition.name}</div>
          <div className={styles.phaseBannerMsg}>
            {phaseTransition.systemMessage}
          </div>
          {phaseTransition.context && (
            <div className={styles.phaseBannerCtx}>
              {phaseTransition.context}
            </div>
          )}
        </div>
      )}

      {/* FOMO overlay */}
      {fomoOverlay && (
        <div className={styles.fomoOverlay}>
          <div className={styles.fomoIcon}>🔥</div>
          <div className={styles.fomoText}>{fomoOverlay.message}</div>
        </div>
      )}

      {/* Breaking news overlay */}
      {activeEvent && (
        <div
          className={`${styles.newsOverlay}
          ${activeEvent.impact < 0 ? styles.newsRed : styles.newsGreen}
          ${activeEvent.isCrash ? styles.newsCrash : ""}
        `}
        >
          {activeEvent.isBreaking && (
            <div className={styles.newsBreaking}>⚡ BREAKING NEWS</div>
          )}
          <div className={styles.newsTitle}>{activeEvent.title}</div>
          <div className={styles.newsDesc}>{activeEvent.description}</div>
          {activeEvent.psychMessage && (
            <div className={styles.newsPsychMsg}>
              {activeEvent.psychMessage}
            </div>
          )}
          {activeEvent.hint && (
            <div className={styles.newsHint}>💡 {activeEvent.hint}</div>
          )}
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

      {/* Crash countdown timer */}
      {crashTimer !== null && (
        <div
          className={`${styles.crashCountdown} ${
            crashTimer <= 5 ? styles.crashCountdownUrgent : ""
          }`}
        >
          <div className={styles.crashCountdownLabel}>⚠️ DECISION WINDOW</div>
          <div className={styles.crashCountdownNum}>{crashTimer}</div>
          <div className={styles.crashCountdownSub}>seconds to act</div>
        </div>
      )}

      {/* Decision window timer */}
      {decisionWindow && !crashTimer && (
        <div className={styles.decisionWindow}>
          <div className={styles.decisionLabel}>REACT NOW</div>
          <div className={styles.decisionTimer}>{decisionTimer}s</div>
        </div>
      )}

      {/* ── HUD ─────────────────────────────────────────────────────────── */}
      <div className={styles.hud}>
        {/* Top row: scenario info + sentiment + start/live */}
        <div className={styles.hudTop}>
          <div className={styles.hudLeft}>
            <span className={styles.scenarioName}>{scenario.name}</span>
            {currentPhase && (
              <span
                className={`${styles.phaseLabel} ${
                  styles[`phaseLabel_${currentPhase.id}`]
                }`}
              >
                {currentPhase.name}
              </span>
            )}
            <div className={styles.timerBar}>
              <div className={styles.timerTrack}>
                <div
                  className={`${styles.timerFill} ${
                    crashActive ? styles.timerFillCrash : ""
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className={styles.timerNum}>{fmtTime(timeLeft)}</span>
            </div>
          </div>

          <div className={styles.hudRight}>
            <div className={styles.sentimentMeter}>
              <div className={styles.sentLbl}>Sentiment</div>
              <div className={styles.sentBar}>
                <div
                  className={styles.sentFill}
                  style={{ width: `${sentiment}%`, background: sentimentColor }}
                />
              </div>
              <div
                className={styles.sentLabel}
                style={{ color: sentimentColor }}
              >
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

        {/* Stats strip — always visible including on mobile */}
        <div className={styles.statsStrip}>
          <div className={styles.statCell}>
            <div
              className={`${styles.statVal} ${
                returnPct >= 0 ? styles.green : styles.red
              }`}
            >
              {returnPct >= 0 ? "+" : ""}
              {returnPct.toFixed(2)}%
            </div>
            <div className={styles.statLbl}>Return</div>
          </div>
          <div className={styles.statCell}>
            <div className={styles.statVal}>
              ₹{Math.round(totalAssets).toLocaleString("en-IN")}
            </div>
            <div className={styles.statLbl}>Total Assets</div>
          </div>
          <div className={styles.statCell}>
            <div className={styles.statVal}>
              ₹{Math.round(cash).toLocaleString("en-IN")}
            </div>
            <div className={styles.statLbl}>Cash</div>
          </div>
          {isCovidScenario && running && (
            <div className={styles.statCell}>
              <div
                className={styles.statVal}
                style={{ color: psychState.color }}
              >
                {psychState.icon} {psychState.title}
              </div>
              <div className={styles.statLbl}>Behavior</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Phase context bar ────────────────────────────────────────────── */}
      {currentPhase && running && (
        <div
          className={`${styles.phaseBar} ${
            styles[`phaseBar_${currentPhase.id}`]
          }`}
        >
          <span className={styles.phaseBarCtx}>{currentPhase.context}</span>
          <span className={styles.phaseBarMsg}>
            {currentPhase.systemMessage}
          </span>
        </div>
      )}

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <div className={styles.main}>
        {/* Stock grid */}
        <div className={styles.stockGrid}>
          {STOCKS.map((sym) => {
            const price = prices[sym] ?? basePrices[sym];
            const base = basePrices[sym];
            const change = price - base;
            const changePct = ((change / base) * 100).toFixed(2);
            const held = holdings[sym]?.qty ?? 0;
            const avgPx = holdings[sym]?.avgPrice ?? 0;
            const unrealizedPnl = held > 0 ? (price - avgPx) * held : 0;
            const up = change >= 0;

            const dir = tickDir[sym]; // "up" | "down" | undefined

            return (
              <div
                key={sym}
                className={`${styles.stockCard} ${
                  crashActive ? styles.stockCrash : ""
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
                <div
                  className={`${styles.stockPrice} ${
                    dir === "up"
                      ? styles.priceFlashUp
                      : dir === "down"
                      ? styles.priceFlashDown
                      : ""
                  }`}
                >
                  ₹{price.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </div>
                {held > 0 && (
                  <div className={styles.stockHeld}>
                    {held} held ·{" "}
                    <span
                      className={unrealizedPnl >= 0 ? styles.green : styles.red}
                    >
                      {unrealizedPnl >= 0 ? "+" : ""}₹
                      {Math.round(unrealizedPnl).toLocaleString("en-IN")}
                    </span>
                  </div>
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
              .slice(0, 25)
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
                  <span
                    className={`${styles.orderPhase} ${
                      o.phase ? styles[`orderPhase_${o.phase}`] : ""
                    }`}
                  >
                    {o.phase ?? ""}
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
