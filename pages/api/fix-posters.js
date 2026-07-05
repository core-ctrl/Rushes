import { connectDB } from "../../lib/mongodb";
import User from "../../models/User";
import axios from "axios";

export default async function handler(req, res) {
  try {
    await connectDB();
    const allUsers = await User.find({});
    
    let totalFixed = 0;

    for (const user of allUsers) {
      let modified = false;
      if (user.wishlist) {
        for (let i = 0; i < user.wishlist.length; i++) {
          const item = user.wishlist[i];
          if (!item.posterPath && item.mediaId) {
            console.log(`Fixing poster for: ${item.title} (${item.mediaId})`);
            try {
              const tmdbRes = await axios.get(`https://api.themoviedb.org/3/${item.mediaType || 'movie'}/${item.mediaId}?api_key=${process.env.TMDB_API_KEY}`);
              user.wishlist[i].posterPath = tmdbRes.data.poster_path;
              modified = true;
              totalFixed++;
            } catch (e) {
              console.error(`Failed to fetch for ${item.title}:`, e.message);
            }
          }
        }
      }
      if (modified) {
        user.markModified('wishlist');
        await user.save();
      }
    }

    res.status(200).json({ message: "Done", totalFixed });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
