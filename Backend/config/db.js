import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const connectDB = async () => {
  try {
    // Add options object with database name
    const options = {
      dbName: "sotupub_db", // Specify your database name here
    };

    await mongoose.connect(process.env.MONGO_URI, options);
    console.log("MongoDB Connected to sotupub_db");
  } catch (error) {
    console.error("MongoDB Connection Failed", error);
    process.exit(1);
  }
};

export default connectDB;
