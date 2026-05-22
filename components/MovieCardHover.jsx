import { useEffect, useState } from "react";
import Image from "next/image";
import {
    getMovieDetails,
    getSeriesDetails,
    getMovieProviders,
    getSeriesProviders,
} from "../utils/tmdb";
import { TMDB_BLUR_DATA_URL } from "../lib/imageBlur";

export default function MovieCardHover({
    item,
    position = "center",
    wishlist = [],
    addToWishlist,
    openAuth,
    onPlayTrailer,
}) {
    const [details, setDetails] = useState(null);
    const [providers, setProviders] = useState([]);
    const [trailerKey, setTrailerKey] = useState(null);

    const isMovie = item.media_type === "movie" || item.title;
    const isInList = wishlist.some((m) => m.id === item.id);

    /* ───────── LOAD DATA ONLY ON HOVER ───────── */
    useEffect(() => {
        let mounted = true;

        async function load() {
            try {
                const d = isMovie
                    ? await getMovieDetails(item.id)
                    : await getSeriesDetails(item.id);

                if (!mounted) return;
                setDetails(d);

                const prov = isMovie
                    ? await getMovieProviders(item.id)
                    : await getSeriesProviders(item.id);

                const region =
                    prov?.results?.IN ||
                    prov?.results?.US ||
                    prov?.results?.GB ||
                    null;

                const flat =
                    region?.flatrate ||
                    region?.rent ||
                    region?.buy ||
                    [];

                setProviders(flat.slice(0, 4));

                const vid = d?.videos?.results?.find(
                    (v) =>
                        (v.type === "Trailer" || v.type === "Teaser") &&
                        v.site === "YouTube"
                );
                setTrailerKey(vid?.key || null);
            } catch { }
        }

        load();
        return () => (mounted = false);
    }, [item.id, isMovie]);

    const playTrailer = async () => {
        if (trailerKey) {
            onPlayTrailer(
                trailerKey,
                item.title || item.name,
                item.id,
                item.media_type || (isMovie ? "movie" : "tv")
            );
            return;
        }
        // Fetch if not preloaded
        try {
            const mediaType = item.media_type || (isMovie ? "movie" : "tv");
            const res = await fetch(`/api/trailer?id=${item.id}&media_type=${mediaType}`);
            const data = await res.json();
            const key = data.trailer?.key || null;
            if (key) {
                onPlayTrailer(key, item.title || item.name, item.id, mediaType);
            } else {
                alert("Trailer not available");
            }
        } catch {
            alert("Failed to load trailer");
        }
    };

    const handleWishlist = (e) => {
        e.stopPropagation();
        if (!wishlist && openAuth) return openAuth();
        addToWishlist(item);
    };

    /* ───────── POSITION LOGIC ───────── */
    const positionClass =
        position === "left"
            ? "left-0"
            : position === "right"
                ? "right-0"
                : "left-1/2 -translate-x-1/2";

    const bgUrl = item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : (item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "/fallback.jpg");
    const isPosterFallback = !item.backdrop_path && item.poster_path;

    return (
        <div
            className={`
        absolute z-[9999]
        w-[380px]
        ${positionClass}
        -top-6
        bg-black/80
        backdrop-blur-3xl
        rounded-2xl
        overflow-hidden
        shadow-[0_24px_80px_rgba(0,0,0,0.8)]
        border border-white/10
        animate-netflixHover
        pointer-events-auto
        flex flex-col
      `}
        >
            {/* BACKDROP */}
            <div className={`relative w-full ${isPosterFallback ? "aspect-[2/3] max-h-[300px]" : "aspect-video"}`}>
                <Image
                    src={bgUrl}
                    alt={item.title || item.name}
                    width={780}
                    height={isPosterFallback ? 1170 : 440}
                    className="w-full h-full object-cover"
                    placeholder="blur"
                    blurDataURL={TMDB_BLUR_DATA_URL}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                {/* PLAY */}
                <button
                    onClick={playTrailer}
                    className="
            absolute bottom-4 left-4
            bg-white text-black
            px-5 py-2 rounded-xl
            font-extrabold text-sm
            flex items-center gap-2
            hover:bg-neutral-200 transition-colors
            shadow-[0_0_20px_rgba(255,255,255,0.3)]
          "
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                    Play
                </button>

                {/* WISHLIST */}
                <button
                    onClick={handleWishlist}
                    className={`
            absolute bottom-4 right-4
            w-10 h-10 rounded-full
            flex items-center justify-center
            text-lg transition-all border
            ${isInList ? "bg-red-600 text-white border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.5)]" : "bg-black/60 text-white border-white/20 backdrop-blur-md hover:bg-white/10 hover:border-white/40"}
          `}
                >
                    {isInList ? "❤️" : "🤍"}
                </button>
            </div>

            {/* INFO */}
            <div className="p-4">
                <h3 className="text-lg font-bold text-white">
                    {item.title || item.name}
                </h3>

                <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                    {details?.release_date?.slice(0, 4)}
                    {details?.vote_average > 0 && (
                        <span className="text-yellow-400">
                            ⭐ {details.vote_average.toFixed(1)}
                        </span>
                    )}
                    {details?.runtime > 0 && <span>{details.runtime} min</span>}
                    {details?.adult && (
                        <span className="text-red-500 font-semibold">18+</span>
                    )}
                </div>

                <p className="mt-2 text-sm text-gray-300 line-clamp-3">
                    {details?.overview || item.overview}
                </p>

                {/* PROVIDERS */}
                {providers.length > 0 && (
                    <div className="flex gap-2 mt-3">
                        {providers.map((p) => (
                            <Image
                                key={p.provider_id}
                                src={`https://image.tmdb.org/t/p/w45${p.logo_path}`}
                                width={100}
                                height={100}
                                className="w-7 h-7 rounded"
                                alt="Provider logo"
                                placeholder="blur"
                                blurDataURL={TMDB_BLUR_DATA_URL}
                            />
                        ))}
                    </div>
                )}
            </div>

            <style>{`
  @keyframes netflixHover {
    0% { opacity: 0; transform: translateY(14px) scale(0.92); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }
  .animate-netflixHover {
    animation: netflixHover 0.28s cubic-bezier(0.18, 0.89, 0.32, 1.28);
  }
`}</style>
        </div>
    );
}

