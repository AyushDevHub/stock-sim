import express from "express";
import authRoutes from "./routes/authRoutes.js";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is live 🚀");
});
app.use("/auth", authRoutes);

export default app;
