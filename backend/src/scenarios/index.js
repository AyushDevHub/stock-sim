/**
 * index.js — Scenario Registry
 * All scenarios imported and exported from a single place.
 * scenarioRegistry is used by the scenario controller.
 */

import { bullMarketScenario } from "./bullMarket.js";
import { bearCrashScenario } from "./bearCrash.js";
import { recessionScenario } from "./recession.js";
import { newsReactionScenario } from "./newsReaction.js";
import { intradayScenario } from "./intraday.js";

export const scenarioRegistry = {
  [bullMarketScenario.id]: bullMarketScenario,
  [bearCrashScenario.id]: bearCrashScenario,
  [recessionScenario.id]: recessionScenario,
  [newsReactionScenario.id]: newsReactionScenario,
  [intradayScenario.id]: intradayScenario,
};

export const getAllScenarios = () => Object.values(scenarioRegistry);
export const getScenarioById = (id) => scenarioRegistry[id] ?? null;

export {
  bullMarketScenario,
  bearCrashScenario,
  recessionScenario,
  newsReactionScenario,
  intradayScenario,
};
