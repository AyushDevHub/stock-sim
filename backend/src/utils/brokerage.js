/**
 * Brokerage calculator modelled after Zerodha/AngelOne (NSE equity)
 * All values in INR.
 *
 * Reference rates (as of 2025):
 *  – Zerodha:   ₹0 delivery, ₹20 or 0.03% (lower) for intraday/F&O
 *  – AngelOne:  ₹0 delivery, ₹20 per order flat for intraday
 *
 * For the simulator we apply realistic rates for intraday-style trades.
 */

const BROKERAGE_RATE = 0.0003;       // 0.03% (capped at ₹20 per order)
const BROKERAGE_CAP  = 20;           // ₹20 cap per leg

const STT_BUY_RATE   = 0.001;        // 0.1% on buy (delivery)
const STT_SELL_RATE  = 0.001;        // 0.1% on sell (delivery)

const NSE_TXN_CHARGE = 0.0000322;    // 0.00322% NSE exchange txn charge
const SEBI_CHARGE    = 0.000001;     // ₹10 / crore = 0.000001 per rupee
const STAMP_DUTY_BUY = 0.00015;      // 0.015% on buy side only
const GST_RATE       = 0.18;         // 18% GST on (brokerage + txn + SEBI)

/**
 * @param {number} tradeValue  – quantity × price
 * @param {'buy'|'sell'} side
 * @param {'MARKET'|'LIMIT'|...} orderType
 * @returns {{ brokerage, stt, exchangeTxnCharge, sebiCharges, stampDuty, gst, total }}
 */
export function calculateBrokerage(tradeValue, side, orderType = "MARKET") {
  const tv = tradeValue;

  // Flat ₹0 brokerage for pure delivery in real brokers;
  // simulator keeps it fair for all order types.
  const brokerage = Math.min(tv * BROKERAGE_RATE, BROKERAGE_CAP);

  const stt = side === "buy"
    ? parseFloat((tv * STT_BUY_RATE).toFixed(2))
    : parseFloat((tv * STT_SELL_RATE).toFixed(2));

  const exchangeTxnCharge = parseFloat((tv * NSE_TXN_CHARGE).toFixed(4));
  const sebiCharges       = parseFloat((tv * SEBI_CHARGE).toFixed(4));
  const stampDuty         = side === "buy"
    ? parseFloat((tv * STAMP_DUTY_BUY).toFixed(4))
    : 0;

  const gstBase = brokerage + exchangeTxnCharge + sebiCharges;
  const gst     = parseFloat((gstBase * GST_RATE).toFixed(4));

  const total = parseFloat(
    (brokerage + stt + exchangeTxnCharge + sebiCharges + stampDuty + gst).toFixed(2)
  );

  return {
    brokerage:          parseFloat(brokerage.toFixed(2)),
    stt,
    exchangeTxnCharge,
    sebiCharges,
    stampDuty,
    gst,
    total,
  };
}
