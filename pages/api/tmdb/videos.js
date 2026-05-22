// pages/api/tmdb/videos.js
// Returns TMDB video results (trailers/teasers) for a given media id + type.
// Used by MovieCard to resolve trailer keys on demand.

export default async function handler(req, res) {
    const { id, type = "movie" } = req.query;

    if (!id) return res.status(400).json({ error: "id is required" });

    const mediaType = type === "tv" ? "tv" : "movie";
    const TMDB_KEY = process.env.TMDB_API_KEY;

    if (!TMDB_KEY) return res.status(500).json({ error: "TMDB_API_KEY not set" });

    try {
        const url = `https://api.themoviedb.org/3/${mediaType}/${id}/videos?api_key=${TMDB_KEY}&language=en-US`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`TMDB ${response.status}`);
        const data = await response.json();
        return res.status(200).json(data);
    } catch (err) {
        console.error("TMDB videos error:", err.message);
        return res.status(500).json({ error: "Failed to fetch videos", results: [] });
    }
}
