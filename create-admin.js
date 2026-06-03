const mongoose = require('mongoose');
const User = require('./models/User').default || require('./models/User');

async function createAdmin() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rushes');
  console.log('Connected to DB');

  let admin = await User.findOne({ email: 'admin@rushes.com' });
  if (!admin) {
    admin = new User({
      name: 'Super Admin',
      username: 'admin',
      email: 'admin@rushes.com',
      password: 'password123',
      isAdmin: true,
      hasCompletedOnboarding: true,
    });
    await admin.save();
    console.log('Created new admin user');
  } else {
    admin.isAdmin = true;
    admin.password = 'password123';
    await admin.save();
    console.log('Updated existing admin user');
  }
  
  console.log(`
================================
ADMIN CREDENTIALS
Email: admin@rushes.com
Password: password123
================================
  `);
  process.exit(0);
}

createAdmin().catch(console.error);
