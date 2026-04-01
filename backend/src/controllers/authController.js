import bcrypt from 'bcrypt';
import User from "../models/User.js";

export const registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: "User registered successfully", user: newUser });
    } catch (error) {
        res.status(500).json({ message: "Error registering user", error });
    }
};

// For simplicity, the login function just checks credentials and returns a success message.

export const loginUser = async (req, res) => {
    try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
    return res.status(400).json({ message: "Invalid username" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
    return res.status(400).json({ message: "Invalid password" });
    }

    res.json({
    message: "Login successful",
    userId: user._id
    });

    } catch (error) {
    res.status(500).json({ message: error.message });
    }
};
