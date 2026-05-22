import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/router';
import { selectWatchlist, toggleWatchlist } from '../../store/slices/watchlistSlice';
import { toast } from '../ui/Toaster';

export default function HoverCard({ item, index, showTopBadge = false, onPlayTrailer, landscape = false }) {
  const [hovered, setHovered] = useState(false);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, x: 50, y: 50 });
  const hoverTimeoutRef = useRef(null);
  const dispatch = useDispatch();
  const router = useRouter();
  const watchlist = useSelector(selectWatchlist);

  const isTV = item.media_type === 'tv' || !!item.first_air_date;
  const isInList = watchlist?.some(w => w.id === item.id);

  const poster = item.poster_path
    ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
    : null;
  const backdrop = item.backdrop_path
    ? `https://image.tmdb.org/t/p/w500${item.backdrop_path}`
    : poster;

  const year = (item.release_date || item.first_air_date || '').slice(0, 4);
  const rating = item.vote_average?.toFixed(1);
  const runtime = item.runtime ? `${item.runtime}min` : null;

  // Availability logic
  const flatrate = item.providers?.flatrate || item.availability?.flatrate || [];
  const hasOTT = flatrate.length > 0;
  const providerNames = flatrate.slice(0, 2).map(p => p.provider_name || p).join(', ');

  const releaseDate = item.release_date || item.first_air_date;
  const daysSinceRelease = releaseDate
    ? (Date.now() - new Date(releaseDate).getTime()) / (1000 * 60 * 60 * 24)
    : null;
  const isInTheaters = !hasOTT && daysSinceRelease !== null && daysSinceRelease >= -7 && daysSinceRelease <= 45;

  const statusLabel = hasOTT ? 'ON OTT' : isInTheaters ? 'IN THEATERS' : 'DISCOVER';
  const availabilityText = hasOTT
    ? `Available on ${providerNames || 'streaming'}`
    : isInTheaters
    ? 'Now in theaters near you'
    : 'Availability not confirmed yet';

  const statusStyle = {
    'ON OTT': 'border-emerald-500 text-emerald-400',
    'IN THEATERS': 'border-amber-500 text-amber-400',
    'DISCOVER': 'border-neutral-500 text-neutral-400',
  }[statusLabel];

  const provider = hasOTT ? flatrate[0].provider_name || flatrate[0] : null;

  const handleTrailer = async (e) => {
    e.stopPropagation();
    const mediaType = item.media_type || (isTV ? 'tv' : 'movie');
    const title = item.title || item.name;

    if (item.trailerKey && onPlayTrailer) {
      onPlayTrailer(item.trailerKey, title, item.id, mediaType);
      return;
    }

    try {
      const response = await fetch(`/api/trailer?id=${item.id}&media_type=${mediaType}`);
      const data = await response.json();
      const key = data.trailer?.key || null;
      if (key && onPlayTrailer) {
        onPlayTrailer(key, title, item.id, mediaType);
        return;
      }
      if (key) {
        router.push(`/${isTV ? 'series' : 'movies'}/${item.id}`);
        return;
      }
      toast({ type: "error", message: "Trailer is not available yet." });
    } catch {
      toast({ type: "error", message: "Could not load trailer right now." });
    }
  };

  const handleWishlist = (e) => {
    e.stopPropagation();
    dispatch(toggleWatchlist({ ...item, media_type: item.media_type || (isTV ? 'tv' : 'movie') }));
  };

  const handleClick = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768 && !hovered) {
      setHovered(true);
      return;
    }
    const type = item.media_type === 'tv' || isTV ? 'series' : 'movies';
    router.push(`/${type}/${item.id}`);
  };

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => setHovered(true), 250); // slight delay to prevent flashing
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHovered(false);
    setTilt({ rotateX: 0, rotateY: 0, x: 50, y: 50 });
  };

  const handleMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * 100;
    const py = ((event.clientY - rect.top) / rect.height) * 100;
    setTilt({
      rotateX: (py - 50) / -10,
      rotateY: (px - 50) / 10,
      x: px,
      y: py,
    });
  };

  return (
    <div
      className={`group relative flex-shrink-0 cursor-pointer ${landscape ? 'w-[240px] md:w-[280px]' : 'w-[140px] md:w-[160px]'}`}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{ zIndex: hovered ? 50 : 1, perspective: '1200px' }}
    >
      {/* --- NORMAL STATE --- */}
      <motion.div
        className="flex flex-col gap-2 w-full h-full relative rounded-2xl"
        animate={{
          rotateX: hovered ? tilt.rotateX : 0,
          rotateY: hovered ? tilt.rotateY : 0,
          y: hovered ? -4 : 0,
        }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className={`w-full ${landscape ? 'aspect-video' : 'aspect-[2/3]'} rounded-xl overflow-hidden bg-neutral-800 relative`}>
          {landscape ? (
            backdrop || poster ? (
              <img
                src={backdrop || poster}
                alt={item.title || item.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  if (backdrop && poster) e.target.src = poster;
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-neutral-800 text-xs text-neutral-600">
                No image
              </div>
            )
          ) : (
            poster || backdrop ? (
              <img
                src={poster || backdrop}
                alt={item.title || item.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  if (poster && backdrop) e.target.src = backdrop;
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-neutral-800 text-xs text-neutral-600">
                No image
              </div>
            )
          )}
          <div
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background: `radial-gradient(circle at ${tilt.x}% ${tilt.y}%, rgba(255,255,255,0.22), transparent 26%)`,
            }}
          />

          {/* Top Left: Rating Pill */}
          {rating && rating > 0 && (
            <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded-full flex items-center gap-1 text-[10px] font-bold text-white shadow-sm border border-white/10">
              <span className="text-emerald-400">{rating} ★</span>
            </div>
          )}

          {/* Top Right: Rank Badge */}
          {showTopBadge && index < 10 && (
            <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-black px-1.5 py-0.5 rounded border border-white/10 backdrop-blur-sm">
              #{index + 1}
            </div>
          )}

          {/* Bottom Left: Runtime */}
          {runtime && (
            <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] font-bold text-white shadow-sm border border-white/10">
              {runtime}
            </div>
          )}
        </div>

        {/* Below Poster Info */}
        <div className="px-0.5 flex flex-col items-start">
          <h3 className="font-bold text-white text-sm line-clamp-1 w-full">
            {item.title || item.name}
          </h3>
          {provider && (
            <span className="mt-1 bg-white/10 text-neutral-300 text-[10px] px-2 py-0.5 rounded-full border border-white/5 line-clamp-1">
              {provider}
            </span>
          )}
        </div>
      </motion.div>

      {/* --- HOVER STATE (Expanding Landscape Popup) --- */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            // Absolute positioning centered horizontally on the base card, overflowing the bounds
            className="absolute top-[-20px] left-1/2 z-50 w-[300px] max-w-[calc(100vw-32px)] -translate-x-1/2 origin-top overflow-hidden rounded-2xl border border-white/10 shadow-[0_35px_90px_rgba(0,0,0,0.82)]"
            style={{
              // Fallback dark gradient roughly matching reference vibe
              background: 'linear-gradient(145deg, rgba(28,28,34,0.96), rgba(70,20,38,0.92), rgba(3,7,18,0.98))',
              backdropFilter: 'blur(24px)',
              transformStyle: 'preserve-3d',
              boxShadow: `0 30px 90px rgba(0,0,0,0.85), 0 0 50px rgba(229,9,20,0.16)`,
            }}
          >
            {/* Top Half: Backdrop */}
            <div className="w-full aspect-[16/9] relative bg-neutral-900">
              {backdrop && (
                <img src={backdrop} alt={item.title || item.name} className="w-full h-full object-cover" />
              )}
              {/* Bottom gradient to blend into info section */}
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

              {/* Action Buttons precisely positioned over the backdrop bottom */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10">
                <button
                  onClick={handleTrailer}
                  className="flex items-center gap-1.5 bg-white text-black px-3 py-1.5 rounded-lg text-xs font-black shadow-lg hover:bg-neutral-200 active:scale-95 transition-all"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Trailer
                </button>
                <button
                  onClick={handleWishlist}
                  className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all ${
                    isInList
                      ? 'bg-red-500/90 text-white'
                      : 'bg-black/50 backdrop-blur-md text-white border border-white/20 hover:bg-white/20'
                  }`}
                >
                  <svg className="w-4 h-4" fill={isInList ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={isInList ? 0 : 2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Bottom Half: Info Section */}
            <div className="px-4 pb-4 pt-3 flex max-h-64 flex-col gap-2 overflow-y-auto relative z-10" data-lenis-prevent>
              <h3 className="text-lg font-black text-white line-clamp-1 leading-tight tracking-tight">
                {item.title || item.name}
              </h3>

              <div className="flex items-center gap-2 flex-wrap">
                {year && <span className="text-xs text-neutral-300">{year}</span>}
                {rating && rating > 0 && (
                  <span className="flex items-center gap-0.5 text-xs text-amber-400 font-bold">
                    ★ {rating}
                  </span>
                )}
                <span className="text-[11px] bg-white/10 text-neutral-300 px-2 py-0.5 rounded-md border border-white/5">
                  {isTV ? 'Series' : 'Movie'}
                </span>
              </div>

              <div className="mt-1">
                <span className={`inline-flex items-center border px-2.5 py-0.5 rounded text-[10px] font-black tracking-wider bg-black/20 ${statusStyle}`}>
                  {statusLabel}
                </span>
              </div>

              <p className="text-[11px] text-neutral-300 flex items-start gap-1.5 leading-relaxed mt-0.5">
                <span className="flex-shrink-0 opacity-80 mt-0.5">
                  {hasOTT ? '•' : isInTheaters ? '•' : '•'}
                </span>
                <span className="line-clamp-2">{availabilityText}</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
