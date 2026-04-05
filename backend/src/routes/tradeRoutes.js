import express from "express";
import { buyStock, sellStock } from "../controllers/tradeController.js";
import protect from "../middlewares/authMiddleware.js";

const router = express.Router();
router.post("/buy", protect, buyStock);
router.post("/sell", protect, sellStock);

export default router;
