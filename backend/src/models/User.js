import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    balance: { type: Number, default: 100000 },

    // Email verification
    emailVerified: { type: Boolean, default: false },
    emailOTP: { type: String, select: false }, // 6-digit code
    emailOTPExpiry: { type: Date, select: false }, // 15 min window
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
