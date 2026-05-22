import axios from 'axios';
import { getCached } from '../../../lib/redis';

export default async function handler(req, res) {
  try {
    const series = await getCached(
      'trending:series:IN',
      async () => {
        const { data } = await axios.get(
          `https://api.themoviedb.org/3/trending/tv/week?api_key=${process.env.TMDB_API_KEY}&region=IN&language=en-IN`
        );
        return data.results?.slice(0, 20) || [];
      },
      1800 // 30 minutes
    );
    res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=86400');
    res.json({ series });
  } catch (error) {
    console.error('Series trending error:', error.message);
    res.status(500).json({ series: [], error: 'Failed to fetch trending series' });
  }
}
