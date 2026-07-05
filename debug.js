import { connectDB } from "./lib/mongodb.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function check() {
  await connectDB();
  const lists = await mongoose.connection.collection('lists').find({}).toArray();
  const users = await mongoose.connection.collection('users').find({}).toArray();
  
  console.log("=== LISTS ===");
  lists.forEach(l => console.log(`Title: ${l.title}, userId: ${l.userId}, Type of userId: ${typeof l.userId}`));
  
  console.log("\n=== USERS ===");
  users.forEach(u => console.log(`Name: ${u.name}, _id: ${u._id}, Type of _id: ${typeof u._id}, Email: ${u.email}`));
  
  process.exit(0);
}

check();
