import mongoose from "mongoose";
import dotenv from "dotenv";
import Stock from "../models/Stock.js";

dotenv.config();

// Full NSE stock list — Nifty 50 + Nifty Next 50 + popular extras
const STOCKS = [
  // ── Nifty 50 ──
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
  { symbol: "MM", name: "Mahindra & Mahindra", exchange: "NSE" },
  { symbol: "BAJAJ-AUTO", name: "Bajaj Auto", exchange: "NSE" },
  { symbol: "SHREECEM", name: "Shree Cement", exchange: "NSE" },
  // ── Nifty Next 50 ──
  { symbol: "AMBUJACEM", name: "Ambuja Cements", exchange: "NSE" },
  { symbol: "BANKBARODA", name: "Bank of Baroda", exchange: "NSE" },
  { symbol: "BERGEPAINT", name: "Berger Paints", exchange: "NSE" },
  { symbol: "BIOCON", name: "Biocon", exchange: "NSE" },
  { symbol: "BOSCHLTD", name: "Bosch", exchange: "NSE" },
  { symbol: "CHOLAFIN", name: "Cholamandalam Investment", exchange: "NSE" },
  { symbol: "COLPAL", name: "Colgate-Palmolive India", exchange: "NSE" },
  { symbol: "CUMMINSIND", name: "Cummins India", exchange: "NSE" },
  { symbol: "DABUR", name: "Dabur India", exchange: "NSE" },
  { symbol: "GODREJCP", name: "Godrej Consumer Products", exchange: "NSE" },
  { symbol: "GODREJPROP", name: "Godrej Properties", exchange: "NSE" },
  { symbol: "GUJGASLTD", name: "Gujarat Gas", exchange: "NSE" },
  { symbol: "HAL", name: "Hindustan Aeronautics", exchange: "NSE" },
  { symbol: "HAVELLS", name: "Havells India", exchange: "NSE" },
  { symbol: "ICICIPRULI", name: "ICICI Prudential Life", exchange: "NSE" },
  { symbol: "INDIANB", name: "Indian Bank", exchange: "NSE" },
  { symbol: "INDUSTOWER", name: "Indus Towers", exchange: "NSE" },
  { symbol: "LUPIN", name: "Lupin", exchange: "NSE" },
  { symbol: "MOTHERSON", name: "Samvardhana Motherson", exchange: "NSE" },
  { symbol: "MUTHOOTFIN", name: "Muthoot Finance", exchange: "NSE" },
  { symbol: "PAGEIND", name: "Page Industries", exchange: "NSE" },
  { symbol: "PEL", name: "Piramal Enterprises", exchange: "NSE" },
  { symbol: "PETRONET", name: "Petronet LNG", exchange: "NSE" },
  { symbol: "PIDILITIND", name: "Pidilite Industries", exchange: "NSE" },
  { symbol: "PNBHOUSING", name: "PNB Housing Finance", exchange: "NSE" },
  { symbol: "RECLTD", name: "REC Limited", exchange: "NSE" },
  { symbol: "SIEMENS", name: "Siemens India", exchange: "NSE" },
  { symbol: "TORNTPHARM", name: "Torrent Pharmaceuticals", exchange: "NSE" },
  { symbol: "TORNTPOWER", name: "Torrent Power", exchange: "NSE" },
  { symbol: "TRENT", name: "Trent", exchange: "NSE" },
  { symbol: "UBL", name: "United Breweries", exchange: "NSE" },
  { symbol: "VEDL", name: "Vedanta", exchange: "NSE" },
  { symbol: "VOLTAS", name: "Voltas", exchange: "NSE" },
  // ── Popular extras ──
  { symbol: "IRCTC", name: "Indian Railway Catering", exchange: "NSE" },
  { symbol: "ZOMATO", name: "Zomato", exchange: "NSE" },
  { symbol: "NYKAA", name: "FSN E-Commerce (Nykaa)", exchange: "NSE" },
  { symbol: "MRF", name: "MRF", exchange: "NSE" },
  { symbol: "DMART", name: "Avenue Supermarts (DMart)", exchange: "NSE" },
  { symbol: "POLYCAB", name: "Polycab India", exchange: "NSE" },
  { symbol: "LTIM", name: "LTIMindtree", exchange: "NSE" },
  { symbol: "PERSISTENT", name: "Persistent Systems", exchange: "NSE" },
  { symbol: "MPHASIS", name: "Mphasis", exchange: "NSE" },
  { symbol: "COFORGE", name: "Coforge", exchange: "NSE" },
  { symbol: "ZEEL", name: "Zee Entertainment", exchange: "NSE" },
  { symbol: "PVR", name: "PVR INOX", exchange: "NSE" },
  { symbol: "TATAPOWER", name: "Tata Power", exchange: "NSE" },
  { symbol: "ADANIGREEN", name: "Adani Green Energy", exchange: "NSE" },
  { symbol: "ADANITRANS", name: "Adani Transmission", exchange: "NSE" },
  { symbol: "BANDHANBNK", name: "Bandhan Bank", exchange: "NSE" },
  { symbol: "FEDERALBNK", name: "Federal Bank", exchange: "NSE" },
  { symbol: "IDFCFIRSTB", name: "IDFC First Bank", exchange: "NSE" },
  { symbol: "RBLBANK", name: "RBL Bank", exchange: "NSE" },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // Use upsert so this is safe to run multiple times
    // New stocks get inserted, existing ones are untouched
    let added = 0;
    for (const stock of STOCKS) {
      const result = await Stock.updateOne(
        { symbol: stock.symbol },
        { $setOnInsert: stock },
        { upsert: true }
      );
      if (result.upsertedCount > 0) added++;
    }

    const total = await Stock.countDocuments();
    console.log(
      `✅ Seed complete — ${added} new stocks added, ${total} total in DB`
    );
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
}

seed();
