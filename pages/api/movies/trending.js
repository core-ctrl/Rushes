import axios from 'axios';
import { getCached } from '../../../lib/redis';

export default async function handler(req, res) {
  try {
    const movies = await getCached(
      'trending:movies:IN',
      async () => {
        const { data } = await axios.get(
          `https://api.themoviedb.org/3/trending/movie/week?api_key=${process.env.TMDB_API_KEY}&region=IN&language=en-IN`
        );
        return data.results?.slice(0, 20) || [];
      },
      1800 // 30 minutes
    );
    res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=86400');
    res.json({ movies });
  } catch (error) {
    console.error('Movies trending error:', error.message);
    res.status(500).json({ movies: [], error: 'Failed to fetch trending movies' });
  }
}
