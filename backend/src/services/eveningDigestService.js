import cron from "node-cron";
import User from "../models/User.js";
import Order from "../models/Order.js";
import Portfolio from "../models/Portfolio.js";
import { getAllPrices } from "./pricePollerService.js";
import { sendEmail, verifyEmailConnection } from "./emailService.js";

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

async function buildDigestData(user) {
  const prices = getAllPrices();
  const priceMap = Object.fromEntries(prices.map((p) => [p.symbol, p]));

  const holdings = await Portfolio.find({ userId: user._id }).lean();
  const enrichedHoldings = holdings.map((h) => {
    const live = priceMap[h.stock];
    const curPrice = live?.price ?? 0;
    const value = curPrice * h.quantity;
    return { ...h, curPrice, value };
  });

  const portfolioValue = enrichedHoldings.reduce((s, h) => s + h.value, 0);

  const todayOrders = await Order.find({
    userId: user._id,
    createdAt: { $gte: startOfToday() },
    status: "EXECUTED",
  }).lean();

  const todayBuys = todayOrders.filter((o) => o.type === "buy");
  const todaySells = todayOrders.filter((o) => o.type === "sell");
  const todayInvested = todayBuys.reduce((s, o) => s + (o.total ?? 0), 0);
  const todayProceeds = todaySells.reduce((s, o) => s + (o.total ?? 0), 0);

  const totalBrokerage = todayOrders.reduce((s, o) => {
    return s + (o.brokerageBreakdown?.total ?? o.brokerage ?? 0);
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

function buildText(d) {
  const now = new Date().toLocaleDateString("en-IN");
  return [
    `StockSim Evening Digest — ${now}`,
    `Hello ${d.user.username},`,
    ``,
    `Total Assets: ${fmtShort(d.totalAssets)}`,
    `Cash Balance: ${fmtShort(d.user.balance)}`,
    `Portfolio Value: ${fmtShort(d.portfolioValue)}`,
    `Trades today: ${d.todayOrders.length} (${d.todayBuys.length}B / ${d.todaySells.length}S)`,
    `Total charges: ${fmt(d.totalBrokerage)}`,
  ].join("\n");
}

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
      html: `<p>Hello ${data.user.username}, your portfolio value is ${fmtShort(
        data.portfolioValue
      )}, cash balance ${fmtShort(data.user.balance)}.</p>`,
      text: buildText(data),
    });
    console.log(`[Digest] ✓ Sent to ${user.email}`);
  } catch (err) {
    console.error(`[Digest] ✗ Failed for ${user.email}:`, err.message);
  }
}

export async function runEveningDigest() {
  console.log("[Digest] Starting evening digest run…");
  try {
    const users = await User.find({
      email: { $exists: true, $ne: "" },
      emailVerified: true,
    }).lean();
    console.log(`[Digest] Sending to ${users.length} user(s)`);
    for (let i = 0; i < users.length; i++) {
      await sendDigestToUser(users[i]);
      if (i < users.length - 1) await new Promise((r) => setTimeout(r, 200));
    }
    console.log("[Digest] Evening digest complete");
  } catch (err) {
    console.error("[Digest] Fatal error:", err.message);
  }
}

export function initDigestScheduler() {
  verifyEmailConnection().then((ok) => {
    if (!ok) {
      console.log(
        "[Digest] Scheduler NOT started — set BREVO_API_KEY in Render env to enable"
      );
      return;
    }
    const schedule = process.env.DIGEST_CRON || "0 13 * * *";
    cron.schedule(
      schedule,
      () => {
        console.log("[Digest] Cron triggered — running evening digest");
        runEveningDigest();
      },
      { timezone: "UTC" }
    );
    console.log(`[Digest] Scheduler started — will send daily at 6:30 PM IST`);
  });
}
