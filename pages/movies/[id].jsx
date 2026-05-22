import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import MediaDetailLayout from "../../components/MediaDetailLayout";
import { SkeletonHero } from "../../components/SkeletonCard";

export default function MovieDetailPage({ addToWishlist, wishlist = [] }) {
  const router = useRouter();
  const { id } = router.query;

  // All hooks at top — before any return
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regionCode, setRegionCode] = useState("IN");
  const [trailerKey, setTrailerKey] = useState(null);
  const [trailerLoading, setTrailerLoading] = useState(false);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);

  useEffect(() => {
    if (!id) return;

    let region = "IN";
    try {
      const { readStoredPreferences } = require("../../lib/userPreferences");
      const stored = readStoredPreferences();
      region = stored.regions?.[0] || "IN";
    } catch (e) { }

    setRegionCode(region);

    fetch(`/api/media/movie/${id}?region=${region}`)
      .then((r) => r.json())
      .then((data) => {
        setMovie(data);
        // Strictly filter for Trailer + YouTube only
        const key =
          data.videos?.results?.find(
            (v) => v.type === "Trailer" && v.site === "YouTube"
          )?.key || null;
        setTrailerKey(key);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  // early returns AFTER all hooks
  if (loading) return (
    <div className="min-h-screen bg-black pt-20">
      <SkeletonHero />
    </div>
  );

  if (!movie || movie.error) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black text-white">
      <p className="text-2xl">Movie not found</p>
      <Link href="/" className="text-red-500 hover:underline">Go Home</Link>
    </div>
  );

  const handlePlayTrailer = async () => {
    if (trailerKey) {
      setIsTrailerOpen(true);
      return;
    }
    setTrailerLoading(true);
    try {
      const res = await fetch(`/api/trailer?id=${movie.id}&media_type=movie`);
      const data = await res.json();
      const key = data.trailer?.key || null;
      if (key) {
        setTrailerKey(key);
        setIsTrailerOpen(true);
      } else {
        alert("Trailer not available");
      }
    } catch {
      alert("Failed to load trailer.");
    } finally {
      setTrailerLoading(false);
    }
  };

  const isInList = wishlist.some((item) => item.id === movie.id);
  const director = movie.credits?.crew?.find((p) => p.job === "Director");
  const ogImage = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
    : undefined;
  const regionalRelease = movie.releaseDates?.find(
    (e) => e.iso_3166_1 === regionCode
  );

  // THEATER TAG LOGIC: Use release date + watch providers
  const flatrate = movie.providers?.flatrate || [];
  const hasOTTProviders = flatrate.length > 0;
  const releaseDate = movie.release_date;
  const isRecentRelease = (() => {
    if (!releaseDate) return false;
    const release = new Date(releaseDate);
    if (Number.isNaN(release.getTime())) return false;
    const daysSinceRelease =
      (Date.now() - release.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceRelease >= -7 && daysSinceRelease <= 45;
  })();

  const inTheaters = !hasOTTProviders && isRecentRelease;
  const isStreaming = hasOTTProviders;
  const availabilityStatus = isStreaming
    ? "STREAMING"
    : inTheaters
      ? "IN THEATERS"
      : "UNKNOWN";

  return (
    <MediaDetailLayout
      media={movie}
      mediaType="movie"
      regionCode={regionCode}
      trailerKey={trailerKey}
      trailerLoading={trailerLoading}
      isTrailerOpen={isTrailerOpen}
      setIsTrailerOpen={setIsTrailerOpen}
      handlePlayTrailer={handlePlayTrailer}
      isInList={isInList}
      addToWishlist={addToWishlist}
    />
  );
}
