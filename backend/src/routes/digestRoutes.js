import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  runEveningDigest,
  sendDigestToUser,
} from "../services/eveningDigestService.js";
import User from "../models/User.js";

const router = express.Router();

/**
 * POST /digest/test
 * Sends the evening digest ONLY to the currently logged-in user.
 * Use this to test your email without blasting all users.
 */
router.post("/test", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).lean();
    if (!user?.email)
      return res.status(400).json({ message: "No email on your account" });

    await sendDigestToUser(user);
    res.json({ message: `✓ Digest sent to ${user.email}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * POST /digest/run-all
 * Triggers the full evening digest for ALL users immediately.
 * Only use in development/admin context.
 */
router.post("/run-all", protect, async (req, res) => {
  runEveningDigest().catch(console.error); // fire-and-forget
  res.json({
    message: "Evening digest started for all users (running in background)",
  });
});

export default router;
