export default async function handler(req, res) {
  const { path } = req.query;
  if (!path) return res.status(400).send("Missing path");

  try {
    const url = `https://image.tmdb.org/t/p/${path}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch image");

    const buffer = Buffer.from(await response.arrayBuffer());
    res.setHeader("Content-Type", response.headers.get("content-type") || "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.send(buffer);
  } catch (error) {
    res.status(500).send("Error proxying image");
  }
}
