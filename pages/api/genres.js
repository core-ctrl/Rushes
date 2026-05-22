import axios from "axios";
import { getCached } from "../../lib/redis";

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const TMDB_API_KEY = process.env.TMDB_API_KEY;

        const genres = await getCached('tmdb:genres', async () => {
            const [moviesRes, tvRes] = await Promise.all([
                axios.get(`https://api.themoviedb.org/3/genre/movie/list?api_key=${TMDB_API_KEY}&language=en-US`),
                axios.get(`https://api.themoviedb.org/3/genre/tv/list?api_key=${TMDB_API_KEY}&language=en-US`)
            ]);

            const map = new Map();
            moviesRes.data.genres.forEach(g => map.set(g.id, { ...g, type: 'movie' }));
            tvRes.data.genres.forEach(g => {
                if (!map.has(g.id)) map.set(g.id, { ...g, type: 'tv' });
                else map.set(g.id, { ...g, type: 'both' });
            });

            return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
        }, 86400 * 7); // Cache genres for 7 days

        res.setHeader('Cache-Control', 'public, s-maxage=604800, stale-while-revalidate=86400');
        res.status(200).json({ genres });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
