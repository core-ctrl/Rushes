import { connectDB } from "./lib/mongodb.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function deleteCollections() {
  await connectDB();
  const listsCollection = mongoose.connection.collection('lists');
  
  // Find lists that start with "luv" or "loove" to delete all the test spam lists
  const result = await listsCollection.deleteMany({
    title: { $in: ["luv", "luvv", "luvvvvvv", "looveeeeeeeeeeeeeeeeeeeeeeeeeec"] }
  });
  
  console.log(`Deleted ${result.deletedCount} collections.`);
  process.exit(0);
}

deleteCollections();
