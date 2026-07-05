// components/MovieCard.jsx
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import { useRouter } from "next/router";
import Image from "next/image";
import { toggleWatchlist, selectInWatchlist } from "../store/slices/watchlistSlice";
import { openAuthModal } from "../store/slices/uiSlice";
import { selectUser } from "../store/slices/authSlice";
import { getContentStatus, getWhereToWatch } from "../lib/decisionEngine";
import FriendActivity from "./social/FriendActivity";
import ShareButton from "./ShareButton";
import { TMDB_BLUR_DATA_URL } from "../lib/imageBlur";
import { toast } from "./ui/Toaster";
import AppIcon from "./AppIcon";
import { Layers01Icon } from "@hugeicons/core-free-icons";
import SaveToListModal from "./lists/SaveToListModal";

export default function MovieCard({ item, friendActivity = [] }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const isInList = useSelector(selectInWatchlist(item?.id));
  const [hovered, setHovered] = useState(false);
  const [isSaveToListModalOpen, setIsSaveToListModalOpen] = useState(false);
  const [popPos, setPopPos] = useState("center");
  const cardRef = useRef(null);
  const hoverTimer = useRef(null);

  if (!item) return null;

  const isMovie = item.media_type === "movie" || item.title;
  const href = isMovie ? `/movies/${item.id}` : `/series/${item.id}`;
  const poster = item.poster_path ? `/tmdb-proxy/w500${item.poster_path}` : "/fallback.jpg";
  const title = item.title || item.name;
  const year = (item.release_date || item.first_air_date || "").slice(0, 4);
  const rating = item.vote_average?.toFixed(1);
  const status = item.contentStatus || getContentStatus(item);
  const normalizeReason = (value) => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (Array.isArray(value)) {
      const firstString = value.find((entry) => typeof entry === "string");
      if (firstString) return firstString;
      return normalizeReason(value[0]);
    }
    if (typeof value === "object") {
      return value.reason || value.label || value.key || "";
    }
    return String(value);
  };
  const whyRecommended = normalizeReason(item.whyRecommended || item.reasons?.[0]) || status.reason;
  const whereToWatch = item.whereToWatch || getWhereToWatch({ ...item, contentStatus: status });
  const runtime = item.runtimeLabel || (item.runtime ? `${item.runtime}m` : "");
  const statusClass = {
    ott: "bg-emerald-500/20 text-emerald-200 border-emerald-400/30",
    theaters: "bg-amber-500/20 text-amber-200 border-amber-400/30",
    coming_soon: "bg-sky-500/20 text-sky-200 border-sky-400/30",
    unknown: "bg-white/10 text-neutral-300 border-white/15",
  }[status.key] || "bg-white/10 text-neutral-300 border-white/15";

  const handleEnter = () => {
    hoverTimer.current = setTimeout(() => {
      if (cardRef.current) {
        const { left, right } = cardRef.current.getBoundingClientRect();
        if (left < 200) setPopPos("left");
        else if (window.innerWidth - right < 200) setPopPos("right");
        else setPopPos("center");
      }
      setHovered(true);
    }, 180);
  };

  const handleLeave = () => { clearTimeout(hoverTimer.current); setHovered(false); };

  const handleTouch = (e) => {
    // If not hovered, prevent navigation and show hover state
    if (!hovered) {
      e.preventDefault();
      handleEnter();
    }
  };

  const handleWishlist = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { dispatch(openAuthModal("login")); return; }
    dispatch(toggleWatchlist(item));
  };

  const [trailerLoading, setTrailerLoading] = useState(false);

  const handleTrailer = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (trailerLoading) return;
    setTrailerLoading(true);

    const mediaType = item.media_type || (isMovie ? "movie" : "tv");
    try {
      const response = await fetch(`/api/trailer?id=${item.id}&media_type=${mediaType}`);
      const data = await response.json();
      const key = data.trailer?.key || item.trailerKey || null;
      if (key) {
        window.dispatchEvent(new CustomEvent("rushes:play-trailer", {
          detail: { key, title, id: item.id, type: mediaType },
        }));
      } else {
        toast({ type: "error", message: "Trailer unavailable, redirecting to movie page..." });
        router.push(href);
      }
    } catch {
      toast({ type: "error", message: "Trailer unavailable, redirecting to movie page..." });
      router.push(href);
    } finally {
      setTrailerLoading(false);
    }
  };

  const popX = popPos === "left" ? "0%" : popPos === "right" ? "-65%" : "-50%";

  return (
    <div ref={cardRef} className="relative overflow-visible"
      onMouseEnter={handleEnter} onMouseLeave={handleLeave}>

      <Link href={href} onClick={handleTouch}>
        <motion.div
          layoutId={`poster-${item.id}`}
          className="poster-card w-full aspect-[2/3] rounded-card overflow-hidden"
          whileHover={{ scale: 1.03 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <Image
            src={poster}
            alt={title}
            width={200}
            height={300}
            className="w-full h-full object-cover"
          />
          <div className={`absolute left-2 top-2 rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-wide ${statusClass}`}>
            {status.label}
          </div>
          <motion.div
            className="absolute inset-0 flex flex-col justify-end p-3"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)" }}
            initial={{ opacity: 0 }} whileHover={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
          >
            <p className="text-white text-xs font-bold line-clamp-2">{title}</p>
            <div className="flex items-center gap-2 mt-1">
              {rating > 0 && <span className="text-yellow-400 text-xs">★ {rating}</span>}
              {runtime && <span className="text-neutral-300 text-xs">{runtime}</span>}
              {year && <span className="text-neutral-400 text-xs">{year}</span>}
            </div>
            <p className="mt-1 line-clamp-1 text-[11px] font-medium text-neutral-300">{whereToWatch}</p>

            {/* Friend Activity */}
            <FriendActivity activity={friendActivity} />
          </motion.div>
        </motion.div>
      </Link>

      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={() => router.push(href)}
            className="absolute inset-0 rounded-2xl overflow-hidden z-20 pointer-events-auto cursor-pointer shadow-[0_24px_70px_rgba(0,0,0,0.75)]"
          >
            {/* Blurred gradient background using movie backdrop color */}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to top, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.7) 50%, transparent 100%)`,
              }}
            />

            {/* Top badges */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
              {/* Trailer button */}
              <button
                onClick={(e) => { e.stopPropagation(); handleTrailer(e); }}
                disabled={trailerLoading}
                className="flex items-center gap-1.5 bg-white text-black px-3 py-1.5 rounded-full text-xs font-bold hover:bg-neutral-200 transition-colors disabled:opacity-70 disabled:cursor-wait"
              >
                {trailerLoading ? (
                  <svg className="w-3 h-3 animate-spin text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
                {trailerLoading ? 'Loading...' : 'Trailer'}
              </button>

              <div className="flex items-center gap-2">
                {/* Save to List button */}
                <button
                  onClick={(e) => { e.stopPropagation(); setIsSaveToListModalOpen(true); }}
                  className="w-8 h-8 rounded-full bg-black/50 text-neutral-400 hover:text-white hover:bg-black/80 backdrop-blur-sm flex items-center justify-center transition-all"
                  title="Save to Curated List"
                >
                  <AppIcon icon={Layers01Icon} size={16} />
                </button>

                {/* Heart/wishlist button */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleWishlist(e); }}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isInList
                    ? 'bg-red-500 text-white'
                    : 'bg-black/50 text-neutral-400 hover:text-red-400 backdrop-blur-sm'
                }`}
              >
                <svg className="w-4 h-4" fill={isInList ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                </svg>
              </button>
              </div>
            </div>

            {/* Bottom info */}
            <div className="absolute bottom-0 left-0 right-0 max-h-[78%] overflow-y-auto p-4 z-10" data-lenis-prevent>
              {/* Title */}
              <h3 className="font-black text-white text-sm mb-1 line-clamp-1">
                {title}
              </h3>

              {/* Year + Rating + Type */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-neutral-300">
                  {year}
                </span>
                <span className="flex items-center gap-0.5 text-xs text-amber-400 font-bold">
                  ★ {rating}
                </span>
                <span className="text-xs bg-white/10 text-neutral-300 px-1.5 py-0.5 rounded">
                  {isMovie ? 'Movie' : 'Series'}
                </span>
              </div>

              {/* Availability status badge */}
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold mb-2 ${
                status.label === 'ON OTT' ? 'bg-emerald-600/80' :
                status.label === 'IN THEATERS' ? 'bg-amber-600/80' :
                'bg-neutral-700/80'
              }`}>
                {status.label === 'ON OTT' && '🎬'}
                {status.label === 'IN THEATERS' && '🎟️'}
                {status.label === 'DISCOVER' && '🔍'}
                {!['ON OTT', 'IN THEATERS', 'DISCOVER'].includes(status.label) && status.label}
              </div>

              {/* Availability message */}
              {whereToWatch && (
                <p className="text-xs text-neutral-400 flex items-center gap-1">
                  <span>🎯</span>
                  {whereToWatch}
                </p>
              )}

              {/* Genres */}
              {item.genres && (
                <p className="text-xs text-neutral-400 mt-1">
                  {Array.isArray(item.genres) ? item.genres.map(g => g.name || g).join(' · ') : item.genres}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <SaveToListModal
        isOpen={isSaveToListModalOpen}
        onClose={() => setIsSaveToListModalOpen(false)}
        media={item}
        mediaType={item.media_type || (isMovie ? 'movie' : 'tv')}
      />
    </div>
  );
}
