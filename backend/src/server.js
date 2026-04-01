import app from './app.js';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

// Connect to MongoDB
dotenv.config();
connectDB();


const PORT = process.env.PORT || 3000;
console.log("MongoDB Connected");


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});