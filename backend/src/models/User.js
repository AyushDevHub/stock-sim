import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    balance: { type: Number, default: 100000 }, // starting balance for each user
}, { timestamps: true }); // automatically adds createdAt and updatedAt fields

const User = mongoose.model("User", userSchema);

export default User;
