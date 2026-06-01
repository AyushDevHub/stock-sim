import mongoose from "mongoose";
import User from "../models/User.js";
import Stock from "../models/Stock.js";
import Order from "../models/Order.js";
import Portfolio from "../models/Portfolio.js";
import { getLiveStockData } from "../services/stockService.js";
import { calculateBrokerage } from "../utils/brokerage.js";

const withTransaction = async (fn) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const result = await fn(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/* ─────────────────────────────────────────────
   Helper: build order fields from request body
   ───────────────────────────────────────────── */
function parseOrderFields(body) {
  const {
    symbol,
    quantity,
    orderType = "MARKET",
    validity = "DAY",
    limitPrice,
    stopPrice,
    trailAmount,
    trailPercent,
    bracketTarget,
    bracketStopLoss,
  } = body;

  const validOrderTypes = [
    "MARKET",
    "LIMIT",
    "STOP_LOSS",
    "STOP_LOSS_LIMIT",
    "TRAILING_STOP",
    "TRAILING_STOP_LIMIT",
    "BRACKET",
    "OCO",
  ];
  const validValidity = ["DAY", "GTC", "IOC", "FOK"];

  if (!validOrderTypes.includes(orderType))
    throw Object.assign(new Error(`Invalid orderType: ${orderType}`), {
      status: 400,
    });
  if (!validValidity.includes(validity))
    throw Object.assign(new Error(`Invalid validity: ${validity}`), {
      status: 400,
    });

  // Validate required fields per order type
  if (
    ["LIMIT", "STOP_LOSS_LIMIT", "TRAILING_STOP_LIMIT", "OCO"].includes(
      orderType
    ) &&
    !limitPrice
  )
    throw Object.assign(new Error(`limitPrice required for ${orderType}`), {
      status: 400,
    });
  if (
    [
      "STOP_LOSS",
      "STOP_LOSS_LIMIT",
      "TRAILING_STOP",
      "TRAILING_STOP_LIMIT",
    ].includes(orderType) &&
    !stopPrice &&
    !trailAmount &&
    !trailPercent
  )
    throw Object.assign(
      new Error(
        `stopPrice or trailAmount/trailPercent required for ${orderType}`
      ),
      { status: 400 }
    );
  if (orderType === "BRACKET" && (!bracketTarget || !bracketStopLoss))
    throw Object.assign(
      new Error("bracketTarget and bracketStopLoss required for BRACKET"),
      { status: 400 }
    );

  return {
    upperSymbol: symbol?.toUpperCase(),
    qty: parseInt(quantity),
    orderType,
    validity,
    limitPrice: limitPrice ? parseFloat(limitPrice) : undefined,
    stopPrice: stopPrice ? parseFloat(stopPrice) : undefined,
    trailAmount: trailAmount ? parseFloat(trailAmount) : undefined,
    trailPercent: trailPercent ? parseFloat(trailPercent) : undefined,
    bracketTarget: bracketTarget ? parseFloat(bracketTarget) : undefined,
    bracketStopLoss: bracketStopLoss ? parseFloat(bracketStopLoss) : undefined,
  };
}

/* ─────────────────────────────────────────────
   Determine execution price & initial status
   Market orders execute immediately at live price.
   Limit/Stop orders are OPEN (pending fill) unless
   the price condition is already met.
   ───────────────────────────────────────────── */
function resolveExecution(orderType, side, livePrice, fields) {
  const { limitPrice, stopPrice, trailAmount, trailPercent } = fields;

  switch (orderType) {
    case "MARKET":
      return { execPrice: livePrice, status: "EXECUTED" };

    case "LIMIT":
      // Buy limit: fill if live ≤ limit; Sell limit: fill if live ≥ limit
      if (
        (side === "buy" && livePrice <= limitPrice) ||
        (side === "sell" && livePrice >= limitPrice)
      )
        return { execPrice: limitPrice, status: "EXECUTED" };
      return { execPrice: null, status: "OPEN" };

    case "STOP_LOSS":
      // Buy stop: fill if live ≥ stopPrice; Sell stop: fill if live ≤ stopPrice
      if (
        (side === "buy" && livePrice >= stopPrice) ||
        (side === "sell" && livePrice <= stopPrice)
      )
        return { execPrice: livePrice, status: "EXECUTED" };
      return { execPrice: null, status: "OPEN" };

    case "STOP_LOSS_LIMIT":
      if (
        (side === "buy" && livePrice >= stopPrice) ||
        (side === "sell" && livePrice <= stopPrice)
      )
        return { execPrice: limitPrice, status: "EXECUTED" };
      return { execPrice: null, status: "OPEN" };

    case "TRAILING_STOP": {
      // Compute effective stop from current price
      const trail = trailAmount ?? livePrice * (trailPercent / 100);
      const effectiveStop =
        side === "sell" ? livePrice - trail : livePrice + trail;
      if (
        (side === "sell" && livePrice <= effectiveStop) ||
        (side === "buy" && livePrice >= effectiveStop)
      )
        return { execPrice: livePrice, status: "EXECUTED" };
      return { execPrice: null, status: "OPEN", computedStop: effectiveStop };
    }

    case "TRAILING_STOP_LIMIT": {
      const trail = trailAmount ?? livePrice * (trailPercent / 100);
      const effectiveStop =
        side === "sell" ? livePrice - trail : livePrice + trail;
      if (
        (side === "sell" && livePrice <= effectiveStop) ||
        (side === "buy" && livePrice >= effectiveStop)
      )
        return { execPrice: limitPrice, status: "EXECUTED" };
      return { execPrice: null, status: "OPEN", computedStop: effectiveStop };
    }

    case "BRACKET":
      // Entry leg always at market; target + SL legs added separately
      return { execPrice: livePrice, status: "EXECUTED" };

    case "OCO":
      // The first condition met wins; for now place as OPEN
      return { execPrice: null, status: "OPEN" };

    default:
      return { execPrice: livePrice, status: "EXECUTED" };
  }
}

/* ─── Shared order document builder ─── */
function buildOrderDoc(
  userId,
  side,
  upperSymbol,
  qty,
  execPrice,
  tradeValue,
  brokerageBreakdown,
  fields,
  execResult
) {
  const {
    orderType,
    validity,
    limitPrice,
    stopPrice,
    trailAmount,
    trailPercent,
    bracketTarget,
    bracketStopLoss,
  } = fields;
  return {
    userId,
    stock: upperSymbol,
    quantity: qty,
    price: execPrice,
    limitPrice,
    stopPrice,
    trailAmount,
    trailPercent,
    bracketTarget,
    bracketStopLoss,
    total: execPrice ? tradeValue : null,
    brokerage: brokerageBreakdown.total,
    brokerageBreakdown,
    type: side,
    orderType,
    validity,
    status: execResult.status,
    executedAt: execResult.status === "EXECUTED" ? new Date() : null,
  };
}

/* ─────────────────────────────────────────────
   BUY STOCK
   ───────────────────────────────────────────── */
export const buyStock = async (req, res) => {
  try {
    const fields = parseOrderFields(req.body);
    const { upperSymbol, qty, orderType, validity } = fields;

    if (!upperSymbol || !qty || qty <= 0)
      return res
        .status(400)
        .json({ message: "Valid symbol and quantity are required" });

    const stockRecord = await Stock.findOne({ symbol: upperSymbol });
    if (!stockRecord)
      return res
        .status(404)
        .json({ message: `Stock ${upperSymbol} not found in registry` });

    const liveData = await getLiveStockData(upperSymbol);
    const { price: livePrice, name, change, percentChange } = liveData;

    const execResult = resolveExecution(orderType, "buy", livePrice, fields);
    const execPrice = execResult.execPrice ?? (fields.limitPrice || livePrice);
    const tradeValue = execPrice * qty;
    const brokerageBreakdown = calculateBrokerage(tradeValue, "buy", orderType);
    const totalCost = tradeValue + brokerageBreakdown.total;

    // FOK: cancel if not immediately filled
    if (validity === "FOK" && execResult.status !== "EXECUTED")
      return res
        .status(200)
        .json({
          message: "FOK order cancelled – could not fill immediately",
          status: "CANCELLED",
        });

    const data = await withTransaction(async (session) => {
      const user = await User.findById(req.user._id).session(session);

      // Only deduct balance if order executes now
      if (execResult.status === "EXECUTED") {
        if (user.balance < totalCost)
          throw Object.assign(new Error("Insufficient balance"), {
            status: 400,
            meta: { required: totalCost, available: user.balance },
          });
        user.balance -= totalCost;
        await user.save({ session });

        const portfolio = await Portfolio.findOne({
          userId: user._id,
          stock: upperSymbol,
        }).session(session);
        if (portfolio) {
          portfolio.quantity += qty;
          await portfolio.save({ session });
        } else
          await Portfolio.create(
            [{ userId: user._id, stock: upperSymbol, quantity: qty }],
            { session }
          );
      }

      const orderDoc = buildOrderDoc(
        user._id,
        "buy",
        upperSymbol,
        qty,
        execResult.status === "EXECUTED" ? execPrice : null,
        tradeValue,
        brokerageBreakdown,
        fields,
        execResult
      );
      const [order] = await Order.create([orderDoc], { session });

      return { order, balance: user.balance };
    });

    res.status(201).json({
      message:
        execResult.status === "EXECUTED"
          ? "Order executed"
          : `Order placed – status: ${execResult.status}`,
      order: {
        id: data.order._id,
        symbol: data.order.stock,
        quantity: data.order.quantity,
        price: data.order.price,
        total: data.order.total,
        type: data.order.type,
        orderType: data.order.orderType,
        validity: data.order.validity,
        status: data.order.status,
        brokerage: data.order.brokerageBreakdown,
        createdAt: data.order.createdAt,
      },
      stock: { name, change, percentChange },
      balance: data.balance,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || "Error buying stock",
      ...(error.meta && error.meta),
    });
  }
};

/* ─────────────────────────────────────────────
   SELL STOCK
   ───────────────────────────────────────────── */
export const sellStock = async (req, res) => {
  try {
    const fields = parseOrderFields(req.body);
    const { upperSymbol, qty, orderType, validity } = fields;

    if (!upperSymbol || !qty || qty <= 0)
      return res
        .status(400)
        .json({ message: "Valid symbol and quantity are required" });

    const liveData = await getLiveStockData(upperSymbol);
    const { price: livePrice, name, change, percentChange } = liveData;

    const execResult = resolveExecution(orderType, "sell", livePrice, fields);
    const execPrice = execResult.execPrice ?? (fields.limitPrice || livePrice);
    const tradeValue = execPrice * qty;
    const brokerageBreakdown = calculateBrokerage(
      tradeValue,
      "sell",
      orderType
    );
    const netProceeds = tradeValue - brokerageBreakdown.total;

    if (validity === "FOK" && execResult.status !== "EXECUTED")
      return res
        .status(200)
        .json({
          message: "FOK order cancelled – could not fill immediately",
          status: "CANCELLED",
        });

    const data = await withTransaction(async (session) => {
      const user = await User.findById(req.user._id).session(session);

      const portfolio = await Portfolio.findOne({
        userId: user._id,
        stock: upperSymbol,
      }).session(session);
      if (!portfolio || portfolio.quantity < qty)
        throw Object.assign(new Error("Not enough stock to sell"), {
          status: 400,
        });

      if (execResult.status === "EXECUTED") {
        portfolio.quantity -= qty;
        if (portfolio.quantity === 0) await portfolio.deleteOne({ session });
        else await portfolio.save({ session });

        user.balance += netProceeds;
        await user.save({ session });
      }

      const orderDoc = buildOrderDoc(
        user._id,
        "sell",
        upperSymbol,
        qty,
        execResult.status === "EXECUTED" ? execPrice : null,
        tradeValue,
        brokerageBreakdown,
        fields,
        execResult
      );
      const [order] = await Order.create([orderDoc], { session });
      return { order, balance: user.balance };
    });

    res.json({
      message:
        execResult.status === "EXECUTED"
          ? "Order executed"
          : `Order placed – status: ${execResult.status}`,
      order: {
        id: data.order._id,
        symbol: data.order.stock,
        quantity: data.order.quantity,
        price: data.order.price,
        total: data.order.total,
        type: data.order.type,
        orderType: data.order.orderType,
        validity: data.order.validity,
        status: data.order.status,
        brokerage: data.order.brokerageBreakdown,
        createdAt: data.order.createdAt,
      },
      stock: { name, change, percentChange },
      balance: data.balance,
    });
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ message: error.message || "Error selling stock" });
  }
};
