import { fetchByGenre } from "../../../lib/tmdb";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id, sort = "popularity.desc", page = 1 } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Missing genre ID' });
    }

    const results = await fetchByGenre(id, Number(page), "movie", sort);
    
    // Add aggressive caching
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json({ results });
  } catch (error) {
    console.error('Genre fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch movies' });
  }
}
