import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config({ path: '.env.local' });

// Setup schema
const userSchema = new mongoose.Schema({
  wishlist: [{
    mediaId: String,
    mediaType: String,
    title: String,
    posterPath: String
  }]
}, { strict: false });
const User = mongoose.models.User || mongoose.model('User', userSchema);

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB.');

  const allUsers = await User.find({});
  
  for (const user of allUsers) {
    let modified = false;
    if (user.wishlist) {
      for (let i = 0; i < user.wishlist.length; i++) {
        const item = user.wishlist[i];
        if (!item.posterPath && item.mediaId) {
          console.log(`Fixing poster for: ${item.title} (${item.mediaId})`);
          try {
            const res = await axios.get(`https://api.themoviedb.org/3/${item.mediaType || 'movie'}/${item.mediaId}?api_key=${process.env.TMDB_API_KEY}`);
            user.wishlist[i].posterPath = res.data.poster_path;
            modified = true;
          } catch (e) {
            console.error(`Failed to fetch for ${item.title}:`, e.message);
          }
        }
      }
    }
    if (modified) {
      user.markModified('wishlist');
      await user.save();
      console.log(`Updated user ${user._id}`);
    }
  }

  console.log('Done.');
  process.exit(0);
}

run();
