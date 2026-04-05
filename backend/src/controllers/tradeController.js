import mongoose from "mongoose";
import User from "../models/User.js";
import Stock from "../models/Stock.js";
import Order from "../models/Order.js";
import Portfolio from "../models/Portfolio.js";
import { getLiveStockData } from "../services/stockService.js";

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

export const buyStock = async (req, res) => {
  try {
    const { symbol, quantity } = req.body;
    const qty = parseInt(quantity);
    const upperSymbol = symbol?.toUpperCase();

    if (!upperSymbol || !qty || qty <= 0)
      return res
        .status(400)
        .json({ message: "Valid symbol and quantity are required" });

    // Validate symbol exists in our registry
    const stockRecord = await Stock.findOne({ symbol: upperSymbol });
    if (!stockRecord)
      return res
        .status(404)
        .json({ message: `Stock ${upperSymbol} not found in registry` });

    // Fetch live price from NSE/BSE API
    const liveData = await getLiveStockData(upperSymbol);
    const { price, name, change, percentChange } = liveData;
    const total = price * qty;

    const data = await withTransaction(async (session) => {
      const user = await User.findById(req.user._id).session(session);

      if (user.balance < total)
        throw Object.assign(new Error("Insufficient balance"), {
          status: 400,
          meta: { required: total, available: user.balance },
        });

      user.balance -= total;
      await user.save({ session });

      const [order] = await Order.create(
        [
          {
            userId: user._id,
            stock: upperSymbol,
            quantity: qty,
            price,
            total,
            type: "buy",
          },
        ],
        { session }
      );

      const portfolio = await Portfolio.findOne({
        userId: user._id,
        stock: upperSymbol,
      }).session(session);
      if (portfolio) {
        portfolio.quantity += qty;
        await portfolio.save({ session });
      } else {
        await Portfolio.create(
          [{ userId: user._id, stock: upperSymbol, quantity: qty }],
          { session }
        );
      }

      return { order, balance: user.balance };
    });

    res.status(201).json({
      message: "Stock bought successfully",
      order: {
        id: data.order._id,
        symbol: data.order.stock,
        quantity: data.order.quantity,
        price: data.order.price,
        total: data.order.total,
        type: data.order.type,
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

export const sellStock = async (req, res) => {
  try {
    const { symbol, quantity } = req.body;
    const qty = parseInt(quantity);
    const upperSymbol = symbol?.toUpperCase();

    if (!upperSymbol || !qty || qty <= 0)
      return res
        .status(400)
        .json({ message: "Valid symbol and quantity are required" });

    // Fetch live price from NSE/BSE API
    const liveData = await getLiveStockData(upperSymbol);
    const { price, name, change, percentChange } = liveData;
    const total = price * qty;

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

      portfolio.quantity -= qty;
      if (portfolio.quantity === 0) {
        await portfolio.deleteOne({ session });
      } else {
        await portfolio.save({ session });
      }

      user.balance += total;
      await user.save({ session });

      const [order] = await Order.create(
        [
          {
            userId: user._id,
            stock: upperSymbol,
            quantity: qty,
            price,
            total,
            type: "sell",
          },
        ],
        { session }
      );

      return { order, balance: user.balance };
    });

    res.json({
      message: "Stock sold successfully",
      order: {
        id: data.order._id,
        symbol: data.order.stock,
        quantity: data.order.quantity,
        price: data.order.price,
        total: data.order.total,
        type: data.order.type,
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
