import mongoose from "mongoose";

// Stock model is now just a symbol registry.
// Live prices are fetched from the NSE/BSE API at trade time.
const stockSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: { type: String, required: true },
    exchange: { type: String, enum: ["NSE", "BSE"], default: "NSE" },
  },
  { timestamps: true }
);

const Stock = mongoose.model("Stock", stockSchema);
export default Stock;
