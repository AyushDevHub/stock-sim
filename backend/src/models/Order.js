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
    price: Number,
    total: Number,
    type: {
      type: String,
      enum: ["buy", "sell"],
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
