import Watchlist from "../models/Watchlist.js";

// ✅ GET WATCHLIST
export const getWatchlist = async (req, res) => {
  try {
    let wl = await Watchlist.findOne({ userId: req.user._id });

    if (!wl) {
      wl = await Watchlist.create({
        userId: req.user._id,
        symbols: [],
      });
    }

    // 🔥 Clean before sending (defensive)
    const cleanSymbols = wl.symbols.filter(
      (s) => typeof s === "string" && s.trim().length > 0
    );

    res.json({ watchlist: cleanSymbols });
  } catch (err) {
    res.status(500).json({ message: "Failed", error: err.message });
  }
};

// ✅ ADD TO WATCHLIST
export const addToWatchlist = async (req, res) => {
  try {
    let { symbol } = req.body;

    // 🔥 VALIDATION + NORMALIZATION
    if (!symbol || typeof symbol !== "string") {
      return res.status(400).json({ message: "Invalid symbol" });
    }

    symbol = symbol.trim().toUpperCase();

    if (!symbol) {
      return res.status(400).json({ message: "Invalid symbol" });
    }

    const wl = await Watchlist.findOneAndUpdate(
      { userId: req.user._id },
      { $addToSet: { symbols: symbol } }, // prevents duplicates
      {
        returnDocument: "after", // ✅ FIXED
        upsert: true,
        runValidators: true,
      }
    );

    res.json({ watchlist: wl.symbols });
  } catch (err) {
    res.status(500).json({ message: "Failed", error: err.message });
  }
};

// ✅ REMOVE FROM WATCHLIST
export const removeFromWatchlist = async (req, res) => {
  try {
    let { symbol } = req.params;

    // 🔥 NORMALIZE
    symbol = symbol?.trim().toUpperCase();

    if (!symbol) {
      return res.status(400).json({ message: "Invalid symbol" });
    }

    const wl = await Watchlist.findOneAndUpdate(
      { userId: req.user._id },
      { $pull: { symbols: symbol } },
      {
        returnDocument: "after", // ✅ FIXED
        runValidators: true,
      }
    );

    res.json({ watchlist: wl.symbols });
  } catch (err) {
    res.status(500).json({ message: "Failed", error: err.message });
  }
};
