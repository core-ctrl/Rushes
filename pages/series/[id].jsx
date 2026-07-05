import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import MediaDetailLayout from "../../components/MediaDetailLayout";
import { readStoredPreferences } from "../../lib/userPreferences";

export default function SeriesDetailPage({ addToWishlist, wishlist = [] }) {
  const router = useRouter();
  const { id } = router.query;

  const [show, setShow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regionCode, setRegionCode] = useState("IN");
  const [trailerKey, setTrailerKey] = useState(null);
  const [trailerLoading, setTrailerLoading] = useState(false);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);

  useEffect(() => {
    if (!id) return undefined;
    const stored = readStoredPreferences();
    const nextRegion = stored.regions?.[0] || "IN";
    setRegionCode(nextRegion);
    fetch(`/api/media/tv/${id}?region=${nextRegion}`)
      .then((r) => r.json())
      .then((data) => {
        setShow(data);
        // Strictly filter for Trailer + YouTube only
        const key =
          data.videos?.results?.find(
            (v) => v.type === "Trailer" && v.site === "YouTube"
          )?.key || null;
        setTrailerKey(key);
        
        // Auto-play trailer if requested
        if (router.query.playTrailer === 'true') {
          if (key) {
            setIsTrailerOpen(true);
          } else {
            // If no immediate key, we handle fetching it like handlePlayTrailer does
            fetch(`/api/trailer?id=${id}&media_type=tv`)
              .then(res => res.json())
              .then(td => {
                 if (td.trailer?.key) {
                   setTrailerKey(td.trailer.key);
                   setIsTrailerOpen(true);
                 }
              }).catch(() => {});
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, router.query.playTrailer]);

  if (loading)
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (!show || show.error)
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
        <p className="text-2xl">Series not found</p>
        <Link href="/" className="text-red-500 hover:underline">← Go Home</Link>
      </div>
    );

  const handlePlayTrailer = async () => {
    if (trailerKey) {
      setIsTrailerOpen(true);
      return;
    }
    setTrailerLoading(true);
    try {
      const res = await fetch(`/api/trailer?id=${show.id}&media_type=tv`);
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

  const isInList = wishlist.some((m) => m.id === show.id);
  const creator = show.created_by?.[0];

  return (
    <MediaDetailLayout
      media={show}
      mediaType="tv"
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
