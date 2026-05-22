import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please set MONGODB_URI in your .env.local file");
}

let cached = global._mongooseCache;

if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) {
    console.log("Using existing MongoDB connection ✅");
    return cached.conn;
  }

  if (!cached.promise) {
    console.log("Connecting to MongoDB...");

    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log("MongoDB connected successfully ✅");
  } catch (error) {
    console.error("MongoDB connection failed ❌", error);
    throw error;
  }

  return cached.conn;
}

export default connectDB;
