import { fetchVideos, fetchDetails } from "../../lib/tmdb";
import yts from "yt-search";

export default async function handler(req, res) {
  const { id, media_type } = req.query;
  if (!id) return res.status(400).json({ error: "Missing id" });

  try {
    const videos = await fetchVideos(id, media_type || "movie");
    let trailer = videos.length > 0 ? videos[0] : null;

    if (!trailer) {
      // Fallback to YouTube Search if TMDB has no official trailer
      const details = await fetchDetails(id, media_type || "movie");
      const title = details.title || details.name;
      const year = (details.release_date || details.first_air_date || "").slice(0, 4);
      
      if (title) {
        const query = `${title} ${year} official trailer OR official teaser`;
        try {
          const r = await yts(query);
          if (r && r.videos && r.videos.length > 0) {
            const topResult = r.videos[0];
            trailer = {
              key: topResult.videoId,
              name: topResult.title,
              site: "YouTube",
              type: "Trailer"
            };
          }
        } catch (searchErr) {
          console.error("YouTube search fallback failed:", searchErr);
        }
      }
    }

    return res.status(200).json({ trailer, videos });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch videos" });
  }
}
