import express from "express";
import { buyStock, sellStock } from "../controllers/tradeController.js";
import protect from "../middlewares/authMiddleware.js";
import Order from "../models/Order.js";

const router = express.Router();

router.post("/buy", protect, buyStock);
router.post("/sell", protect, sellStock);

// Order history for portfolio page
router.get("/orders", protect, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .select("-__v");
    res.json({ orders });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
