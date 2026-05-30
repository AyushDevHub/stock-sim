import express from "express";

import { protect } from "../middlewares/authMiddleware.js";

import {
  listScenarios,
  getScenario,
  simulateScenario,
  completeScenario,
  getUserProgress,
} from "../controllers/scenarioController.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| PUBLIC ROUTES
|--------------------------------------------------------------------------
*/

router.get("/", listScenarios);

router.get("/:id", getScenario);

router.post("/:id/simulate", simulateScenario);

/*
|--------------------------------------------------------------------------
| PROTECTED ROUTES
|--------------------------------------------------------------------------
*/

router.get("/progress/me", protect, getUserProgress);

router.post("/:id/complete", protect, completeScenario);

export default router;
