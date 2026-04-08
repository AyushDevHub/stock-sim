import mongoose from "mongoose";

const watchlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);


watchlistSchema.index({ userId: 1, symbol: 1 }, { returnDocument: "after" });

const Watchlist = mongoose.model("Watchlist", watchlistSchema);
export default Watchlist;
