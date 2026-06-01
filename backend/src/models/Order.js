import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    stock: {
      type: String,
      required: true,
    },
    quantity: Number,
    price: Number, // execution price
    limitPrice: Number, // for limit / stop-limit orders
    stopPrice: Number, // for stop-loss / trailing stop
    trailAmount: Number, // absolute trail amount (trailing stop)
    trailPercent: Number, // percent trail amount
    total: Number,
    brokerage: Number, // brokerage charged
    brokerageBreakdown: {
      brokerage: { type: Number, default: 0 },
      stt: { type: Number, default: 0 },
      exchangeTxnCharge: { type: Number, default: 0 },
      sebiCharges: { type: Number, default: 0 },
      stampDuty: { type: Number, default: 0 },
      gst: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    type: {
      type: String,
      enum: ["buy", "sell"],
    },
    // Order type
    orderType: {
      type: String,
      enum: [
        "MARKET", // execute immediately at market price
        "LIMIT", // execute only at limitPrice or better
        "STOP_LOSS", // trigger at stopPrice, execute at market
        "STOP_LOSS_LIMIT", // trigger at stopPrice, execute at limitPrice
        "TRAILING_STOP", // trail by trailAmount/trailPercent
        "TRAILING_STOP_LIMIT", // trailing stop + limit floor
        "BRACKET", // entry + target + stop-loss in one
        "OCO", // one-cancels-other (target + stop paired)
      ],
      default: "MARKET",
    },
    // Validity
    validity: {
      type: String,
      enum: ["DAY", "GTC", "IOC", "FOK"], // IOC = Immediate or Cancel, FOK = Fill or Kill
      default: "DAY",
    },
    // Bracket / OCO linked orders
    bracketTarget: Number, // target price for bracket
    bracketStopLoss: Number, // stop price for bracket
    ocoLinkedOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },

    // Lifecycle
    status: {
      type: String,
      enum: ["PENDING", "OPEN", "EXECUTED", "CANCELLED", "REJECTED", "EXPIRED"],
      default: "EXECUTED",
    },
    rejectedReason: String,
    executedAt: Date,
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
