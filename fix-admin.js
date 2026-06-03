const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function fix() {
  await mongoose.connect('mongodb://localhost:27017/rushes');
  const hash = await bcrypt.hash('password123', 12);
  await mongoose.connection.db.collection('users').updateOne(
    { email: 'admin@rushes.com' },
    { $set: { password: hash, isAdmin: true } }
  );
  console.log('Fixed password in DB!');
  process.exit(0);
}

fix();
