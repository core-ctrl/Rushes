const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function checkAdmin() {
  await mongoose.connect('mongodb+srv://parupallisaiharshitha_db_user:2WupJnyi90kmh3dT@cluster0.mo2ufsz.mongodb.net/moviefinder?retryWrites=true&w=majority&appName=Cluster0');
  
  const admin = await mongoose.connection.db.collection('users').findOne({ email: 'admin@rushes.dev' });
  const hash = await bcrypt.hash('Rushes@Console2026!', 12);
  
  if (admin) {
    console.log("admin@rushes.dev exists. Updating password...");
    await mongoose.connection.db.collection('users').updateOne(
      { email: 'admin@rushes.dev' },
      { $set: { password: hash, isAdmin: true } }
    );
  } else {
    console.log("admin@rushes.dev does NOT exist. Creating...");
    await mongoose.connection.db.collection('users').insertOne({
      email: 'admin@rushes.dev',
      password: hash,
      isAdmin: true,
      name: 'Rushes Control',
      username: 'admin_control',
      isVerified: true
    });
  }
  console.log("admin@rushes.dev is ready with password 'Rushes@Console2026!'");
  process.exit(0);
}

checkAdmin();
