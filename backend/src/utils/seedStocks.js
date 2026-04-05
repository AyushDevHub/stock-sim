import mongoose from "mongoose";
import dotenv from "dotenv";
import Stock from "../models/Stock.js";

dotenv.config();

const stocks = [
  { symbol: "TCS", name: "Tata Consultancy Services", exchange: "NSE" },
  { symbol: "RELIANCE", name: "Reliance Industries", exchange: "NSE" },
  { symbol: "INFY", name: "Infosys", exchange: "NSE" },
  { symbol: "HDFCBANK", name: "HDFC Bank", exchange: "NSE" },
  { symbol: "ICICIBANK", name: "ICICI Bank", exchange: "NSE" },
  { symbol: "SBIN", name: "State Bank of India", exchange: "NSE" },
  { symbol: "BHARTIARTL", name: "Bharti Airtel", exchange: "NSE" },
  { symbol: "ITC", name: "ITC Limited", exchange: "NSE" },
  { symbol: "LT", name: "Larsen & Toubro", exchange: "NSE" },
  { symbol: "MARUTI", name: "Maruti Suzuki", exchange: "NSE" },
];

await mongoose.connect(process.env.MONGO_URI);
await Stock.deleteMany();
await Stock.insertMany(stocks);
console.log(`Seeded ${stocks.length} stocks`);
mongoose.connection.close();
