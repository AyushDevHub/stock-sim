import express from "express";
import {
  registerUser,
  loginUser,
  verifyEmailOTP,
  resendOTP,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/verify-otp", verifyEmailOTP);
router.post("/resend-otp", resendOTP);

export default router;
