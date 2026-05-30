/**
 * priceEngine.js
 * Generates simulated price movements driven by scenario parameters.
 * Formula: newPrice = oldPrice + randomVolatility + trendForce + eventImpact
 */

/**
 * Generate a single price tick
 * @param {number} currentPrice - Current stock price
 * @param {object} params - Scenario parameters
 * @param {number} params.volatility  - 0 (calm) to 1 (chaos)
 * @param {number} params.marketTrend - -1 (full bear) to +1 (full bull)
 * @param {number} [params.eventImpact=0] - One-time shock % (e.g. -15 = crash)
 * @returns {number} New price
 */
export function generatePriceTick(
  currentPrice,
  { volatility, marketTrend, eventImpact = 0 }
) {
  const randomNoise =
    (Math.random() - 0.5) * 2 * volatility * currentPrice * 0.02;
  const trend = marketTrend * currentPrice * 0.003;
  const shock = (eventImpact / 100) * currentPrice;

  const newPrice = currentPrice + randomNoise + trend + shock;
  // Never go below ₹1
  return Math.max(newPrice, 1);
}

/**
 * Simulate a full price series for a scenario
 * @param {number} startPrice   - Initial price
 * @param {object} scenario     - Full scenario config
 * @param {number} ticksPerSec  - Simulation speed
 * @returns {number[]} Array of prices over time
 */
export function simulatePriceSeries(startPrice, scenario, ticksPerSec = 1) {
  const totalTicks = scenario.duration * ticksPerSec;
  const prices = [startPrice];

  // Build a tick → eventImpact map
  const eventMap = {};
  for (const ev of scenario.events ?? []) {
    const tick = ev.time * ticksPerSec;
    eventMap[tick] = (eventMap[tick] ?? 0) + ev.impact;
  }

  for (let t = 1; t <= totalTicks; t++) {
    const prev = prices[t - 1];
    const eventImpact = eventMap[t] ?? 0;
    prices.push(
      generatePriceTick(prev, {
        volatility: scenario.volatility,
        marketTrend: scenario.marketTrend,
        eventImpact,
      })
    );
  }

  return prices;
}

/**
 * Apply a single scenario event to a live price
 * Used during real-time scenario streaming
 */
export function applyEvent(currentPrice, eventImpact) {
  return currentPrice * (1 + eventImpact / 100);
}

/**
 * Calculate portfolio value change % across a simulated series
 */
export function calcSeriesReturn(prices) {
  if (!prices || prices.length < 2) return 0;
  return ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100;
}
