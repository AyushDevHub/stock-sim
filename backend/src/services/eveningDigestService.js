/**
 * eveningDigestService.js
 *
 * Sends a portfolio summary email to every user at 6:30 PM IST every day.
 * IST = UTC+5:30  →  6:30 PM IST = 13:00 UTC
 * Cron: "0 13 * * *"
 *
 * Each email contains:
 *   • Portfolio holdings + current value + unrealised P&L
 *   • Available cash balance
 *   • Today's trades (buy/sell list)
 *   • Today's total brokerage breakdown
 *   • Quick performance summary
 */

import cron from "node-cron";
import User from "../models/User.js";
import Order from "../models/Order.js";
import Portfolio from "../models/Portfolio.js";
import { getAllPrices } from "./pricePollerService.js";
import { sendEmail, verifyEmailConnection } from "./emailService.js";

// ── helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) =>
  `₹${Number(n ?? 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const fmtShort = (n) => `₹${Math.round(n ?? 0).toLocaleString("en-IN")}`;

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// ── per-user digest data ──────────────────────────────────────────────────────

async function buildDigestData(user) {
  const prices = getAllPrices(); // in-memory price cache
  const priceMap = Object.fromEntries(prices.map((p) => [p.symbol, p]));

  // Holdings
  const holdings = await Portfolio.find({ userId: user._id }).lean();

  const enrichedHoldings = holdings.map((h) => {
    const live = priceMap[h.stock];
    const curPrice = live?.price ?? 0;
    const value = curPrice * h.quantity;
    return { ...h, curPrice, value };
  });

  const portfolioValue = enrichedHoldings.reduce((s, h) => s + h.value, 0);

  // Today's orders
  const todayOrders = await Order.find({
    userId: user._id,
    createdAt: { $gte: startOfToday() },
    status: "EXECUTED",
  }).lean();

  const todayBuys = todayOrders.filter((o) => o.type === "buy");
  const todaySells = todayOrders.filter((o) => o.type === "sell");

  const todayInvested = todayBuys.reduce((s, o) => s + (o.total ?? 0), 0);
  const todayProceeds = todaySells.reduce((s, o) => s + (o.total ?? 0), 0);

  // Brokerage
  const totalBrokerage = todayOrders.reduce((s, o) => {
    const b = o.brokerageBreakdown?.total ?? o.brokerage ?? 0;
    return s + b;
  }, 0);

  const brokerageBreakdown = todayOrders.reduce((acc, o) => {
    const bd = o.brokerageBreakdown || {};
    return {
      brokerage: (acc.brokerage || 0) + (bd.brokerage || 0),
      stt: (acc.stt || 0) + (bd.stt || 0),
      exchangeTxnCharge:
        (acc.exchangeTxnCharge || 0) + (bd.exchangeTxnCharge || 0),
      sebiCharges: (acc.sebiCharges || 0) + (bd.sebiCharges || 0),
      stampDuty: (acc.stampDuty || 0) + (bd.stampDuty || 0),
      gst: (acc.gst || 0) + (bd.gst || 0),
    };
  }, {});

  return {
    user,
    holdings: enrichedHoldings,
    portfolioValue,
    totalAssets: user.balance + portfolioValue,
    todayOrders,
    todayBuys,
    todaySells,
    todayInvested,
    todayProceeds,
    totalBrokerage,
    brokerageBreakdown,
  };
}

// ── HTML email template ────────────────────────────────────────────────────────

function buildHtml(d) {
  const now = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const upPnl = d.portfolioValue >= 0;

  const holdingRows =
    d.holdings.length > 0
      ? d.holdings
          .map(
            (h) => `
        <tr>
          <td style="padding:10px 12px;font-weight:600;color:#e8edf5;font-family:monospace">${
            h.stock
          }</td>
          <td style="padding:10px 12px;text-align:right;color:#b0bec8">${
            h.quantity
          }</td>
          <td style="padding:10px 12px;text-align:right;color:#e8edf5;font-family:monospace">${fmt(
            h.curPrice
          )}</td>
          <td style="padding:10px 12px;text-align:right;color:#e8edf5;font-family:monospace;font-weight:600">${fmtShort(
            h.value
          )}</td>
        </tr>`
          )
          .join("")
      : `<tr><td colspan="4" style="padding:20px;text-align:center;color:#5a7080">No open positions</td></tr>`;

  const orderRows =
    d.todayOrders.length > 0
      ? d.todayOrders
          .map((o) => {
            const isBuy = o.type === "buy";
            const typeColor = isBuy ? "#22c55e" : "#ef4444";
            return `
        <tr>
          <td style="padding:9px 12px;font-weight:600;color:#e8edf5;font-family:monospace">${
            o.stock
          }</td>
          <td style="padding:9px 12px">
            <span style="font-size:12px;font-weight:700;background:${
              isBuy ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)"
            };color:${typeColor};padding:2px 8px;border-radius:4px">${o.type.toUpperCase()}</span>
          </td>
          <td style="padding:9px 12px;text-align:right;color:#b0bec8">${
            o.quantity
          }</td>
          <td style="padding:9px 12px;text-align:right;font-family:monospace;color:#e8edf5">${fmt(
            o.price
          )}</td>
          <td style="padding:9px 12px;text-align:right;font-family:monospace;color:#e8edf5;font-weight:600">${fmtShort(
            o.total
          )}</td>
          <td style="padding:9px 12px;text-align:right;font-family:monospace;color:#f59e0b;font-size:12px">${fmt(
            o.brokerageBreakdown?.total ?? o.brokerage ?? 0
          )}</td>
        </tr>`;
          })
          .join("")
      : `<tr><td colspan="6" style="padding:20px;text-align:center;color:#5a7080">No trades today</td></tr>`;

  const bdRows = Object.entries({
    Brokerage: d.brokerageBreakdown.brokerage || 0,
    "STT (Securities Tax)": d.brokerageBreakdown.stt || 0,
    "Exchange Txn Charge": d.brokerageBreakdown.exchangeTxnCharge || 0,
    "SEBI Charges": d.brokerageBreakdown.sebiCharges || 0,
    "Stamp Duty": d.brokerageBreakdown.stampDuty || 0,
    GST: d.brokerageBreakdown.gst || 0,
  })
    .map(
      ([label, val]) => `
    <tr>
      <td style="padding:7px 0;color:#b0bec8;font-size:13px">${label}</td>
      <td style="padding:7px 0;text-align:right;font-family:monospace;color:#e8edf5;font-size:13px">${fmt(
        val
      )}</td>
    </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>StockSim Evening Digest</title>
</head>
<body style="margin:0;padding:0;background:#0b0f18;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e8edf5">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b0f18;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a2332,#0f1923);border-radius:16px 16px 0 0;padding:28px 28px 24px">
            <table width="100%">
              <tr>
                <td>
                  <div style="display:inline-flex;align-items:center;gap:10px">
                    <span style="width:32px;height:32px;background:#6366f1;border-radius:8px;display:inline-block;text-align:center;line-height:32px;font-weight:900;font-size:14px;color:#fff">S</span>
                    <span style="font-size:18px;font-weight:800;color:#e8edf5;letter-spacing:-0.02em">StockSim</span>
                  </div>
                  <div style="margin-top:6px;font-size:12px;color:#5a7080;letter-spacing:0.08em;text-transform:uppercase">Evening Portfolio Digest</div>
                </td>
                <td align="right" style="color:#5a7080;font-size:13px">${now}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- GREETING -->
        <tr>
          <td style="background:#131924;padding:24px 28px 0">
            <div style="font-size:20px;font-weight:700;color:#e8edf5">Good evening, ${
              d.user.username
            } 👋</div>
            <div style="font-size:14px;color:#5a7080;margin-top:4px">Here's your portfolio summary for today.</div>
          </td>
        </tr>

        <!-- HERO STATS -->
        <tr>
          <td style="background:#131924;padding:20px 28px">
            <table width="100%" cellspacing="0" cellpadding="0" style="border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.07)">
              <tr>
                <td style="padding:18px 20px;background:#1a2332;border-right:1px solid rgba(255,255,255,0.07)">
                  <div style="font-size:11px;color:#5a7080;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px">Total Assets</div>
                  <div style="font-size:22px;font-weight:800;color:#e8edf5;font-family:monospace">${fmtShort(
                    d.totalAssets
                  )}</div>
                </td>
                <td style="padding:18px 20px;background:#1a2332;border-right:1px solid rgba(255,255,255,0.07)">
                  <div style="font-size:11px;color:#5a7080;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px">Cash Balance</div>
                  <div style="font-size:22px;font-weight:800;color:#e8edf5;font-family:monospace">${fmtShort(
                    d.user.balance
                  )}</div>
                </td>
                <td style="padding:18px 20px;background:#1a2332">
                  <div style="font-size:11px;color:#5a7080;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px">Portfolio Value</div>
                  <div style="font-size:22px;font-weight:800;font-family:monospace;color:${
                    d.portfolioValue > 0 ? "#22c55e" : "#5a7080"
                  }">${fmtShort(d.portfolioValue)}</div>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 20px;background:#0f1923;border-right:1px solid rgba(255,255,255,0.07)">
                  <div style="font-size:11px;color:#5a7080;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px">Today Invested</div>
                  <div style="font-size:16px;font-weight:700;color:#e8edf5;font-family:monospace">${fmtShort(
                    d.todayInvested
                  )}</div>
                </td>
                <td style="padding:14px 20px;background:#0f1923;border-right:1px solid rgba(255,255,255,0.07)">
                  <div style="font-size:11px;color:#5a7080;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px">Today's Trades</div>
                  <div style="font-size:16px;font-weight:700;color:#e8edf5">${
                    d.todayOrders.length
                  } order${
    d.todayOrders.length !== 1 ? "s" : ""
  } &nbsp;<span style="font-size:13px;color:#5a7080">(${
    d.todayBuys.length
  }B / ${d.todaySells.length}S)</span></div>
                </td>
                <td style="padding:14px 20px;background:#0f1923">
                  <div style="font-size:11px;color:#5a7080;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px">Total Charges</div>
                  <div style="font-size:16px;font-weight:700;color:#f59e0b;font-family:monospace">${fmt(
                    d.totalBrokerage
                  )}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- HOLDINGS -->
        <tr>
          <td style="background:#131924;padding:0 28px 20px">
            <div style="font-size:14px;font-weight:700;color:#e8edf5;margin-bottom:10px;padding-top:4px">📊 Open Holdings</div>
            <table width="100%" cellspacing="0" cellpadding="0" style="border:1px solid rgba(255,255,255,0.07);border-radius:10px;overflow:hidden">
              <thead>
                <tr style="background:#1a2332">
                  <th style="padding:10px 12px;text-align:left;font-size:11px;color:#5a7080;font-weight:600;text-transform:uppercase;letter-spacing:0.06em">Symbol</th>
                  <th style="padding:10px 12px;text-align:right;font-size:11px;color:#5a7080;font-weight:600;text-transform:uppercase;letter-spacing:0.06em">Qty</th>
                  <th style="padding:10px 12px;text-align:right;font-size:11px;color:#5a7080;font-weight:600;text-transform:uppercase;letter-spacing:0.06em">CMP</th>
                  <th style="padding:10px 12px;text-align:right;font-size:11px;color:#5a7080;font-weight:600;text-transform:uppercase;letter-spacing:0.06em">Value</th>
                </tr>
              </thead>
              <tbody>${holdingRows}</tbody>
            </table>
          </td>
        </tr>

        <!-- TODAY'S ORDERS -->
        <tr>
          <td style="background:#131924;padding:0 28px 20px">
            <div style="font-size:14px;font-weight:700;color:#e8edf5;margin-bottom:10px">📋 Today's Orders</div>
            <table width="100%" cellspacing="0" cellpadding="0" style="border:1px solid rgba(255,255,255,0.07);border-radius:10px;overflow:hidden">
              <thead>
                <tr style="background:#1a2332">
                  <th style="padding:9px 12px;text-align:left;font-size:11px;color:#5a7080;font-weight:600;text-transform:uppercase;letter-spacing:0.06em">Stock</th>
                  <th style="padding:9px 12px;text-align:left;font-size:11px;color:#5a7080;font-weight:600;text-transform:uppercase;letter-spacing:0.06em">Type</th>
                  <th style="padding:9px 12px;text-align:right;font-size:11px;color:#5a7080;font-weight:600;text-transform:uppercase;letter-spacing:0.06em">Qty</th>
                  <th style="padding:9px 12px;text-align:right;font-size:11px;color:#5a7080;font-weight:600;text-transform:uppercase;letter-spacing:0.06em">Price</th>
                  <th style="padding:9px 12px;text-align:right;font-size:11px;color:#5a7080;font-weight:600;text-transform:uppercase;letter-spacing:0.06em">Total</th>
                  <th style="padding:9px 12px;text-align:right;font-size:11px;color:#f59e0b;font-weight:600;text-transform:uppercase;letter-spacing:0.06em">Charges</th>
                </tr>
              </thead>
              <tbody>${orderRows}</tbody>
            </table>
          </td>
        </tr>

        <!-- BROKERAGE BREAKDOWN -->
        ${
          d.totalBrokerage > 0
            ? `
        <tr>
          <td style="background:#131924;padding:0 28px 20px">
            <div style="font-size:14px;font-weight:700;color:#e8edf5;margin-bottom:10px">💸 Today's Charge Breakdown</div>
            <table width="100%" cellspacing="0" cellpadding="0" style="background:#1a2332;border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:16px 20px">
              <tbody>${bdRows}
                <tr style="border-top:1px solid rgba(255,255,255,0.1)">
                  <td style="padding:10px 0 4px;font-weight:700;color:#e8edf5;font-size:14px">Total Charges</td>
                  <td style="padding:10px 0 4px;text-align:right;font-weight:800;color:#f59e0b;font-family:monospace;font-size:14px">${fmt(
                    d.totalBrokerage
                  )}</td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>`
            : ""
        }

        <!-- FOOTER -->
        <tr>
          <td style="background:#0f1923;border-radius:0 0 16px 16px;padding:20px 28px;border-top:1px solid rgba(255,255,255,0.05)">
            <div style="font-size:12px;color:#5a7080;text-align:center;line-height:1.6">
              This is an automated daily digest from <strong style="color:#6366f1">StockSim</strong> — a virtual paper trading simulator.<br/>
              All trades are simulated. No real money is involved.<br/>
              <span style="font-size:11px;opacity:0.6">Sent daily at 6:30 PM IST</span>
            </div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;
}

// ── plain text fallback ───────────────────────────────────────────────────────

function buildText(d) {
  const now = new Date().toLocaleDateString("en-IN");
  const lines = [
    `StockSim Evening Digest — ${now}`,
    `Hello ${d.user.username},`,
    ``,
    `PORTFOLIO SUMMARY`,
    `─────────────────`,
    `Total Assets:    ${fmtShort(d.totalAssets)}`,
    `Cash Balance:    ${fmtShort(d.user.balance)}`,
    `Portfolio Value: ${fmtShort(d.portfolioValue)}`,
    ``,
    `TODAY'S ACTIVITY`,
    `────────────────`,
    `Trades today:    ${d.todayOrders.length} (${d.todayBuys.length} buys / ${d.todaySells.length} sells)`,
    `Invested today:  ${fmtShort(d.todayInvested)}`,
    `Total charges:   ${fmt(d.totalBrokerage)}`,
    ``,
    `HOLDINGS`,
    `────────`,
  ];

  if (d.holdings.length === 0) {
    lines.push("No open positions");
  } else {
    d.holdings.forEach((h) =>
      lines.push(
        `${h.stock.padEnd(12)} ${h.quantity} qty  @ ${fmt(
          h.curPrice
        )}  = ${fmtShort(h.value)}`
      )
    );
  }

  if (d.totalBrokerage > 0) {
    lines.push("", "CHARGE BREAKDOWN", "────────────────");
    const bd = d.brokerageBreakdown;
    lines.push(`Brokerage:         ${fmt(bd.brokerage || 0)}`);
    lines.push(`STT:               ${fmt(bd.stt || 0)}`);
    lines.push(`Exchange Charge:   ${fmt(bd.exchangeTxnCharge || 0)}`);
    lines.push(`SEBI Charges:      ${fmt(bd.sebiCharges || 0)}`);
    lines.push(`Stamp Duty:        ${fmt(bd.stampDuty || 0)}`);
    lines.push(`GST:               ${fmt(bd.gst || 0)}`);
    lines.push(`TOTAL:             ${fmt(d.totalBrokerage)}`);
  }

  lines.push(
    "",
    "─────────────────────────────────────",
    "StockSim — Virtual Paper Trading Simulator"
  );
  return lines.join("\n");
}

// ── send digest to one user ───────────────────────────────────────────────────

export async function sendDigestToUser(user) {
  try {
    const data = await buildDigestData(user);
    const date = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });

    await sendEmail({
      to: user.email,
      subject: `📊 StockSim Evening Digest — ${date} | Balance: ${fmtShort(
        user.balance
      )}`,
      html: buildHtml(data),
      text: buildText(data),
    });

    console.log(`[Digest] ✓ Sent to ${user.email}`);
  } catch (err) {
    console.error(`[Digest] ✗ Failed for ${user.email}:`, err.message);
  }
}

// ── run digest for all users ──────────────────────────────────────────────────

export async function runEveningDigest() {
  console.log("[Digest] Starting evening digest run…");
  try {
    // Only send to users who verified their email — filters out fake addresses
    const users = await User.find({
      email: { $exists: true, $ne: "" },
      emailVerified: true,
    }).lean();
    console.log(`[Digest] Sending to ${users.length} user(s)`);
    // Stagger sends by 200ms each to avoid SMTP rate limits
    for (let i = 0; i < users.length; i++) {
      await sendDigestToUser(users[i]);
      if (i < users.length - 1) await new Promise((r) => setTimeout(r, 200));
    }
    console.log("[Digest] Evening digest complete");
  } catch (err) {
    console.error("[Digest] Fatal error:", err.message);
  }
}

// ── scheduler ────────────────────────────────────────────────────────────────

/**
 * Call this once from server.js.
 * Schedule: every day at 6:30 PM IST (13:00 UTC).
 *
 * To test immediately without waiting: call runEveningDigest() directly.
 */
export function initDigestScheduler() {
  // Verify SMTP first — if not configured, skip scheduling
  verifyEmailConnection().then((ok) => {
    if (!ok) {
      console.log("[Digest] Scheduler NOT started (email not configured)");
      console.log("[Digest] Add EMAIL_USER and EMAIL_PASS to .env to enable");
      return;
    }

    // Cron: second minute hour * * *
    // "0 13 * * *" = every day at 13:00 UTC = 6:30 PM IST
    const schedule = process.env.DIGEST_CRON || "0 13 * * *";

    cron.schedule(
      schedule,
      () => {
        console.log("[Digest] Cron triggered — running evening digest");
        runEveningDigest();
      },
      { timezone: "UTC" }
    );

    console.log(
      `[Digest] Scheduler started — will send at ${schedule} UTC (6:30 PM IST)`
    );
  });
}
