import app from "./app.js";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

// Load env FIRST
dotenv.config();

const PORT = process.env.PORT || 3000;

// Start server only after DB connects
const startServer = async () => {
  try {
    await connectDB(); // wait for DB
    console.log("MongoDB Connected ✅");

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT} 🚀`);
    });
  } catch (error) {
    console.error("Server failed to start ❌", error.message);
    process.exit(1);
  }
};

startServer();
