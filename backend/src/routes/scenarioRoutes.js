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
| STATIC ROUTES FIRST (must be before /:id)
|--------------------------------------------------------------------------
*/

router.get("/progress", protect, getUserProgress);

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

router.post("/:id/complete", protect, completeScenario);

export default router;
