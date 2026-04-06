import mongoose from "mongoose";
import dotenv from "dotenv";
import Stock from "../models/Stock.js";

dotenv.config();

const stocks = [
  // Nifty 50 core
  { symbol: "RELIANCE", name: "Reliance Industries", exchange: "NSE" },
  { symbol: "TCS", name: "Tata Consultancy Services", exchange: "NSE" },
  { symbol: "HDFCBANK", name: "HDFC Bank", exchange: "NSE" },
  { symbol: "INFY", name: "Infosys", exchange: "NSE" },
  { symbol: "ICICIBANK", name: "ICICI Bank", exchange: "NSE" },
  { symbol: "HINDUNILVR", name: "Hindustan Unilever", exchange: "NSE" },
  { symbol: "ITC", name: "ITC Limited", exchange: "NSE" },
  { symbol: "SBIN", name: "State Bank of India", exchange: "NSE" },
  { symbol: "BHARTIARTL", name: "Bharti Airtel", exchange: "NSE" },
  { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank", exchange: "NSE" },
  { symbol: "LT", name: "Larsen & Toubro", exchange: "NSE" },
  { symbol: "AXISBANK", name: "Axis Bank", exchange: "NSE" },
  { symbol: "MARUTI", name: "Maruti Suzuki", exchange: "NSE" },
  { symbol: "ASIANPAINT", name: "Asian Paints", exchange: "NSE" },
  { symbol: "BAJFINANCE", name: "Bajaj Finance", exchange: "NSE" },
  { symbol: "WIPRO", name: "Wipro", exchange: "NSE" },
  { symbol: "HCLTECH", name: "HCL Technologies", exchange: "NSE" },
  { symbol: "ULTRACEMCO", name: "UltraTech Cement", exchange: "NSE" },
  { symbol: "TITAN", name: "Titan Company", exchange: "NSE" },
  { symbol: "SUNPHARMA", name: "Sun Pharmaceutical", exchange: "NSE" },
  { symbol: "TECHM", name: "Tech Mahindra", exchange: "NSE" },
  { symbol: "NESTLEIND", name: "Nestle India", exchange: "NSE" },
  { symbol: "ONGC", name: "Oil & Natural Gas Corp", exchange: "NSE" },
  { symbol: "NTPC", name: "NTPC", exchange: "NSE" },
  { symbol: "POWERGRID", name: "Power Grid Corp", exchange: "NSE" },
  { symbol: "M&M", name: "Mahindra & Mahindra", exchange: "NSE" },
  { symbol: "TATAMOTORS", name: "Tata Motors", exchange: "NSE" },
  { symbol: "TATASTEEL", name: "Tata Steel", exchange: "NSE" },
  { symbol: "ADANIENT", name: "Adani Enterprises", exchange: "NSE" },
  { symbol: "ADANIPORTS", name: "Adani Ports & SEZ", exchange: "NSE" },
  { symbol: "BAJAJFINSV", name: "Bajaj Finserv", exchange: "NSE" },
  { symbol: "DIVISLAB", name: "Divi's Laboratories", exchange: "NSE" },
  { symbol: "DRREDDY", name: "Dr. Reddy's Laboratories", exchange: "NSE" },
  { symbol: "EICHERMOT", name: "Eicher Motors", exchange: "NSE" },
  { symbol: "GRASIM", name: "Grasim Industries", exchange: "NSE" },
  { symbol: "HEROMOTOCO", name: "Hero MotoCorp", exchange: "NSE" },
  { symbol: "HINDALCO", name: "Hindalco Industries", exchange: "NSE" },
  { symbol: "INDUSINDBK", name: "IndusInd Bank", exchange: "NSE" },
  { symbol: "JSWSTEEL", name: "JSW Steel", exchange: "NSE" },
  { symbol: "CIPLA", name: "Cipla", exchange: "NSE" },
  { symbol: "COALINDIA", name: "Coal India", exchange: "NSE" },
  { symbol: "BPCL", name: "Bharat Petroleum Corp", exchange: "NSE" },
  { symbol: "IOC", name: "Indian Oil Corporation", exchange: "NSE" },
  { symbol: "TATACONSUM", name: "Tata Consumer Products", exchange: "NSE" },
  { symbol: "APOLLOHOSP", name: "Apollo Hospitals", exchange: "NSE" },
  { symbol: "BRITANNIA", name: "Britannia Industries", exchange: "NSE" },
  { symbol: "SBILIFE", name: "SBI Life Insurance", exchange: "NSE" },
  { symbol: "HDFCLIFE", name: "HDFC Life Insurance", exchange: "NSE" },
  // Bonus popular
  { symbol: "IRCTC", name: "Indian Railway Catering", exchange: "NSE" },
  { symbol: "ZOMATO", name: "Zomato", exchange: "NSE" },
  { symbol: "PAYTM", name: "One97 Communications (Paytm)", exchange: "NSE" },
  { symbol: "NYKAA", name: "FSN E-Commerce (Nykaa)", exchange: "NSE" },
  { symbol: "MRF", name: "MRF", exchange: "NSE" },
  { symbol: "PIDILITIND", name: "Pidilite Industries", exchange: "NSE" },
  { symbol: "HAVELLS", name: "Havells India", exchange: "NSE" },
  { symbol: "DMART", name: "Avenue Supermarts (DMart)", exchange: "NSE" },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const count = await Stock.countDocuments();

    if (count === 0) {
      await Stock.insertMany(stocks);
      console.log(`✅ Seeded ${stocks.length} stocks`);
    } else {
      console.log("⚡ Stocks already exist, skipping seed");
    }

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
