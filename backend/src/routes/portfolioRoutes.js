import express from "express";
import protect from "../middlewares/authMiddleware.js";
import { getPortfolio } from "../controllers/portfolioController.js";

const router = express.Router();
router.get("/", protect, getPortfolio);

export default router;
