const mongoose = require("mongoose");

const uri = process.env.MONGODB_URI;

async function testConnection() {
    try {
        await mongoose.connect(uri);
        console.log("✅ MongoDB Connected Successfully");
        process.exit(0);
    } catch (err) {
        console.error("❌ MongoDB Connection Failed:", err.message);
        process.exit(1);
    }
}

testConnection();
