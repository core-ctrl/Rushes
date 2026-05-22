// scripts/fix-account.js
// Run with: node scripts/fix-account.js <email>
// Example:  node scripts/fix-account.js test@gmail.com

const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://parupallisaiharshitha_db_user:2WupJnyi90kmh3dT@cluster0.mo2ufsz.mongodb.net/moviefinder?retryWrites=true&w=majority&appName=Cluster0';

const UserSchema = new mongoose.Schema({
  email: String,
  name: String,
  username: String,
  isEmailVerified: Boolean,
  verificationToken: String,
  verificationTokenExpiry: Date,
  password: String,
}, { timestamps: true });

const User = mongoose.models?.User || mongoose.model('User', UserSchema);

async function main() {
  const email = process.argv[2];
  const action = process.argv[3] || 'verify'; // 'verify' or 'delete'

  if (!email) {
    console.log('\n❌ Usage: node scripts/fix-account.js <email> [verify|delete]');
    console.log('   verify  → marks email as verified (default)');
    console.log('   delete  → deletes the account so you can re-register\n');
    process.exit(1);
  }

  console.log(`\n🔌 Connecting to MongoDB...`);
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected!\n');

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  if (!user) {
    console.log(`❌ No account found with email: ${email}`);
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`📋 Found account:`);
  console.log(`   Name     : ${user.name}`);
  console.log(`   Username : @${user.username || '(none)'}`);
  console.log(`   Email    : ${user.email}`);
  console.log(`   Verified : ${user.isEmailVerified ? '✅ YES' : '❌ NO'}`);
  console.log('');

  if (action === 'delete') {
    await User.deleteOne({ _id: user._id });
    console.log('🗑️  Account DELETED. You can now re-register with this email.\n');
  } else {
    // verify
    user.isEmailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();
    console.log('✅ Email VERIFIED! You can now login with your credentials.\n');
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
