// File: backend/db.js

import mongoose from "mongoose";
import "dotenv/config";

const connectDB = async () => {
  try {
    // Use the environment variable for the connection string
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connection established.");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connectDB; // module.exports ko export default se replace kiya
