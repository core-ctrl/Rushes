const fs = require('fs');
const mongoose = require('mongoose');

// Read .env.local manually
try {
    const envFile = fs.readFileSync('.env.local', 'utf8');
    const match = envFile.match(/^MONGODB_URI=(.+)$/m);
    if (!match) {
        console.error("MONGODB_URI not found in .env.local");
        process.exit(1);
    }
    const uri = match[1].trim().replace(/^['"]|['"]$/g, '');

    async function test() {
        console.log("Connecting to MongoDB Atlas...");
        try {
            await mongoose.connect(uri);
            console.log("✅ MongoDB Connected Successfully");
            process.exit(0);
        } catch (e) {
            console.error("❌ MongoDB Connection Failed:", e.message);
            process.exit(1);
        }
    }
    test();
} catch (err) {
    console.error("Failed to read .env.local:", err.message);
    process.exit(1);
}
