import mongoose from "mongoose";
import dotenv from "dotenv";
import { Stock } from "../models/index.js";

dotenv.config();

const stocks = [
  { symbol: "TCS", name: "Tata Consultancy Services", price: 3500 },
  { symbol: "RELIANCE", name: "Reliance Industries", price: 2800 },
  { symbol: "INFY", name: "Infosys", price: 1500 },
  { symbol: "HDFCBANK", name: "HDFC Bank", price: 1600 },
  { symbol: "ICICIBANK", name: "ICICI Bank", price: 950 },
];

await mongoose.connect(process.env.MONGO_URI);
await Stock.deleteMany();
await Stock.insertMany(stocks);
console.log("Stocks seeded successfully");
mongoose.connection.close();
