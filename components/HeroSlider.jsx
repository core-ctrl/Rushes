// components/HeroSlider.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import {
    FavouriteIcon,
    InformationCircleIcon,
    NextIcon,
    PauseIcon,
    PlayIcon,
    PlusSignIcon,
    VolumeHighIcon,
    VolumeMute02Icon,
} from "@hugeicons/core-free-icons";
import AppIcon from "./AppIcon";
import useAdaptiveVideoQuality from "../hooks/useAdaptiveVideoQuality";
import { TMDB_BLUR_DATA_URL } from "../lib/imageBlur";

const ROTATE_MS = 9000;
const SKIP_SECS = 60;
const SCALE = 1.125;
const SATURATION = 2.0;

export default function HeroSlider({ slides = [], onPlayTrailer, wishlist = [], addToWishlist, openAuth }) {
    if (!slides || slides.length === 0) return null;

    const [index, setIndex] = useState(0);
    const [muted, setMuted] = useState(true);
    const [volume, setVolume] = useState(28);
    const [showInfo, setShowInfo] = useState(true);
    const [showVideo, setShowVideo] = useState(false);
    const [zoom, setZoom] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [parallax, setParallax] = useState({ x: 0, y: 0 });
    const [dominant, setDominant] = useState([200, 30, 30]);

    const startX = useRef(null);
    const sectionRef = useRef(null);
    const ytContainer = useRef(null);
    const ytPlayer = useRef(null);
    const rotateTimer = useRef(null);
    const interacting = useRef(false);
    const ytApiLoaded = useRef(false);

    const { vqParam, ytQuality } = useAdaptiveVideoQuality();

    const slide = slides[index];
    const isInList = Array.isArray(wishlist) && slide ? wishlist.some((m) => m.id === slide.id) : false;
    const bgImage = slide?.backdrop_path || slide?.poster_path || "/fallback.jpg";
    const [fetchedKey, setFetchedKey] = useState(null);

    // Eagerly fetch YouTube fallback if TMDB doesn't provide a trailer key
    useEffect(() => {
        if (slide?.trailerKey) {
            setFetchedKey(slide.trailerKey);
        } else if (slide) {
            setFetchedKey(null);
            const mediaType = slide.media_type || (slide.title ? "movie" : "tv");
            fetch(`/api/trailer?id=${slide.id}&media_type=${mediaType}`)
                .then(r => r.json())
                .then(d => {
                    if (d.trailer?.key) {
                        setFetchedKey(d.trailer.key);
                    }
                }).catch(() => {});
        }
    }, [slide]);

    const videoKey = fetchedKey;
    const bgUrl = (p) => p?.startsWith("http") ? p : `https://image.tmdb.org/t/p/original${p}`;

    // ── Dominant colour ────────────────────────────────────────────
    useEffect(() => {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.src = bgUrl(bgImage);
        img.onload = () => {
            try {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                canvas.width = canvas.height = 80;
                ctx.drawImage(img, 0, 0, 80, 80);
                const data = ctx.getImageData(0, 0, 80, 80).data;
                let r = 0, g = 0, b = 0, count = 0;
                for (let i = 0; i < data.length; i += 24) {
                    r += data[i]; g += data[i + 1]; b += data[i + 2]; count++;
                }
                if (count > 0) setDominant([Math.round(r / count), Math.round(g / count), Math.round(b / count)]);
            } catch (e) { }
        };
    }, [bgImage]);

    // ── YouTube API loader ─────────────────────────────────────────
    const ensureYTApi = useCallback(() => {
        if (typeof window === "undefined") return Promise.resolve();
        if (window.YT?.Player) return Promise.resolve();
        return new Promise((resolve) => {
            if (!ytApiLoaded.current) {
                ytApiLoaded.current = true;
                if (!document.getElementById("yt-api")) {
                    const tag = document.createElement("script");
                    tag.src = "https://www.youtube.com/iframe_api";
                    tag.id = "yt-api";
                    document.body.appendChild(tag);
                }
            }
            const check = setInterval(() => {
                if (window.YT?.Player) { clearInterval(check); resolve(); }
            }, 100);
        });
    }, []);

    // ── Create / update inline player ─────────────────────────────
    const createPlayer = useCallback(async (videoId) => {
        if (!videoId) return;
        await ensureYTApi();

        if (ytPlayer.current) {
            try {
                ytPlayer.current.loadVideoById(videoId);
                ytPlayer.current.setVolume(volume);
                muted ? ytPlayer.current.mute() : ytPlayer.current.unMute();
            } catch (e) { }
            return;
        }

        const id = `ytp-${Date.now()}`;
        if (!ytContainer.current) return;
        ytContainer.current.innerHTML = `<div id="${id}"></div>`;

        ytPlayer.current = new window.YT.Player(id, {
            videoId,
            playerVars: {
                autoplay: 1,
                controls: 0,
                modestbranding: 1,
                rel: 0,
                loop: 1,
                playlist: videoId,
                playsinline: 1,
                vq: vqParam || 'hd2160',
                iv_load_policy: 3,
                showinfo: 0,
                fs: 0,
                disablekb: 1,
                cc_load_policy: 0,
                origin: typeof window !== 'undefined' ? window.location.origin : '',
            },
            events: {
                onReady: (e) => {
                    try {
                        e.target.setVolume(volume);
                        muted ? e.target.mute() : e.target.unMute();
                        // Request highest quality first — 4K > 1440p > 1080p
                        const preferred = ytQuality || 'hd2160';
                        e.target.setPlaybackQuality(preferred);
                    } catch (err) { }
                },
                onStateChange: (e) => {
                    if (e.data === window.YT.PlayerState.PLAYING) {
                        setIsPlaying(true);
                        // Attempt to enforce quality after playback starts
                        try {
                            const preferred = ytQuality || 'hd2160';
                            const avail = e.target.getAvailableQualityLevels?.() || [];
                            if (avail.includes(preferred)) {
                                e.target.setPlaybackQuality(preferred);
                            } else if (avail.length > 0) {
                                e.target.setPlaybackQuality(avail[0]);
                            }
                        } catch (err) { }
                        if (!muted) {
                            let v = volume;
                            const fade = setInterval(() => {
                                v = Math.min(100, v + 4);
                                try { ytPlayer.current.setVolume(v); } catch (err) { }
                                if (v >= volume) clearInterval(fade);
                            }, 120);
                        }
                    } else {
                        setIsPlaying(false);
                    }
                },
            },
        });
    }, [ensureYTApi, muted, volume, vqParam, ytQuality]);

    useEffect(() => {
        if (!videoKey) {
            if (ytContainer.current) ytContainer.current.innerHTML = "";
            if (ytPlayer.current) { try { ytPlayer.current.destroy(); } catch (e) { } ytPlayer.current = null; }
            return;
        }
        if (showVideo) createPlayer(videoKey);
    }, [videoKey, showVideo, createPlayer]);

    useEffect(() => {
        if (!ytPlayer.current) return;
        try { muted ? ytPlayer.current.mute() : ytPlayer.current.unMute(); ytPlayer.current.setVolume(volume); } catch (e) { }
    }, [muted, volume]);

    // ── Parallax ───────────────────────────────────────────────────
    useEffect(() => {
        const fn = (e) => {
            if (!sectionRef.current) return;
            const rect = sectionRef.current.getBoundingClientRect();
            setParallax({ x: (e.clientX - rect.left) / rect.width - 0.5, y: (e.clientY - rect.top) / rect.height - 0.5 });
        };
        window.addEventListener("mousemove", fn);
        return () => window.removeEventListener("mousemove", fn);
    }, []);

    // ── Slide timings ──────────────────────────────────────────────
    useEffect(() => {
        setShowInfo(true); setShowVideo(false); setZoom(false);
        const t1 = setTimeout(() => setShowInfo(false), 3000);
        const t2 = setTimeout(() => setShowVideo(true), 4200);
        const t3 = setTimeout(() => setZoom(true), 900);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, [index]);

    // ── Auto-rotate ────────────────────────────────────────────────
    useEffect(() => {
        if (isHovering || interacting.current || isPlaying) { clearTimeout(rotateTimer.current); return; }
        rotateTimer.current = setTimeout(() => setIndex((i) => (i + 1) % slides.length), ROTATE_MS);
        return () => clearTimeout(rotateTimer.current);
    }, [index, isHovering, isPlaying, slides.length]);

    // ── Swipe ──────────────────────────────────────────────────────
    const onTouchStart = (e) => (startX.current = e.touches[0].clientX);
    const onTouchEnd = (e) => {
        if (!startX.current) return;
        const d = startX.current - e.changedTouches[0].clientX;
        if (d > 50) setIndex((i) => (i + 1) % slides.length);
        if (d < -50) setIndex((i) => (i - 1 + slides.length) % slides.length);
    };

    // ── Controls ───────────────────────────────────────────────────
    const handlePlayClick = async () => {
        interacting.current = true;
        setShowVideo(true);
        await ensureYTApi();
        createPlayer(videoKey);
        setTimeout(() => { try { ytPlayer.current.playVideo(); } catch (e) { } }, 300);
    };

    const handlePlayPause = () => {
        if (!ytPlayer.current) return;
        try {
            const s = ytPlayer.current.getPlayerState();
            s === window.YT.PlayerState.PLAYING ? ytPlayer.current.pauseVideo() : ytPlayer.current.playVideo();
        } catch (e) { }
    };

    const handleSkipIntro = () => {
        if (!ytPlayer.current) return;
        try { ytPlayer.current.seekTo((ytPlayer.current.getCurrentTime() || 0) + SKIP_SECS, true); } catch (e) { }
    };

    // ── Hero trailer button — correct signature: (key, title, id, type)
    const handleHeroTrailer = async () => {
        if (videoKey) {
            onPlayTrailer(
                videoKey,
                slide.title || slide.name,
                slide.id,
                slide.media_type || (slide.title ? "movie" : "tv")
            );
            return;
        }
        // Fallback alert
        alert("Trailer not available on TMDB or YouTube");
    };

    const handleWishlist = (e) => {
        e?.stopPropagation?.();
        if (!addToWishlist) { openAuth?.(); return; }
        addToWishlist(slide);
    };

    // ── Colour helpers ─────────────────────────────────────────────
    function saturate([r, g, b], f) {
        r /= 255; g /= 255; b /= 255;
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
        const l = (mx + mn) / 2;
        let s = mx === mn ? 0 : l > 0.5 ? (mx - mn) / (2 - mx - mn) : (mx - mn) / (mx + mn);
        s = Math.min(1, s * f);
        let h = 0;
        if (mx === r) h = (g - b) / (mx - mn);
        else if (mx === g) h = 2 + (b - r) / (mx - mn);
        else h = 4 + (r - g) / (mx - mn);
        h = (h * 60 + 360) % 360;
        const hsl2rgb = (h, s, l) => {
            const c = (1 - Math.abs(2 * l - 1)) * s;
            const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
            const m = l - c / 2;
            let rr, gg, bb;
            if (h < 60) [rr, gg, bb] = [c, x, 0];
            else if (h < 120) [rr, gg, bb] = [x, c, 0];
            else if (h < 180) [rr, gg, bb] = [0, c, x];
            else if (h < 240) [rr, gg, bb] = [0, x, c];
            else if (h < 300) [rr, gg, bb] = [x, 0, c];
            else[rr, gg, bb] = [c, 0, x];
            return [Math.round((rr + m) * 255), Math.round((gg + m) * 255), Math.round((bb + m) * 255)];
        };
        return hsl2rgb(h, s, l);
    }

    const sat = saturate(dominant, SATURATION);
    const accent = `rgba(${sat[0]},${sat[1]},${sat[2]},0.86)`;
    const accentLt = `rgba(${sat[0]},${sat[1]},${sat[2]},0.22)`;
    const accentTxt = (sat[0] * 0.299 + sat[1] * 0.587 + sat[2] * 0.114) > 186 ? "#000" : "#fff";

    const trimOverview = (t) => {
        if (!t || t.length < 200) return t;
        const s = t.slice(0, 220);
        const i = Math.max(s.lastIndexOf(". "), s.lastIndexOf("! "), s.lastIndexOf("? "));
        return i > 60 ? s.slice(0, i + 1) : s.slice(0, 180).replace(/\s+\S*$/, "") + "…";
    };

    // ── JSX ────────────────────────────────────────────────────────
    return (
        <section
            ref={sectionRef}
            className="relative top-0 w-full h-[100dvh] overflow-hidden bg-black select-none touch-pan-y"
            onTouchStart={(e) => { interacting.current = true; onTouchStart(e); }}
            onTouchEnd={(e) => { onTouchEnd(e); interacting.current = false; }}
            onMouseEnter={() => { setIsHovering(true); interacting.current = true; }}
            onMouseLeave={() => { setIsHovering(false); interacting.current = false; }}
            aria-roledescription="carousel"
        >
            {/* Film grain */}
            <div aria-hidden className="pointer-events-none absolute inset-0 z-50"
                style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22160%22 height=%22100%22><filter id=%22n%22><feTurbulence baseFrequency=%220.9%22 numOctaves=%221%22 stitchTiles=%22stitch%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22 opacity=%220.03%22/></svg>')", mixBlendMode: "overlay" }}
            />

            {/* Dust particles */}
            <div className="pointer-events-none z-40 absolute inset-0">
                {[{ l: "18%", t: "22%", d: "0s" }, { l: "40%", t: "55%", d: "0.6s" }, { l: "78%", t: "35%", d: "1.1s" }].map((p, i) => (
                    <div key={i} className="absolute w-px h-px bg-white/8 rounded-full animate-dust" style={{ left: p.l, top: p.t, animationDelay: p.d }} />
                ))}
            </div>

            {/* Cinematic bars */}
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/85 to-transparent z-30" />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/85 to-transparent z-30" />

            {/* Background image */}
            <Image
                src={bgUrl(bgImage)}
                alt={slide?.title || slide?.name || "hero"}
                width={780}
                height={440}
                className={`absolute inset-0 w-full h-full object-cover transition-transform duration-[2200ms] will-change-transform ${zoom ? `scale-[${SCALE}]` : "scale-[1.03]"}`}
                style={{
                    transform: `perspective(1200px) translateX(${parallax.x * -16}px) translateY(${parallax.y * -10}px) rotateY(${parallax.x * 3}deg) rotateX(${parallax.y * -2.8}deg)`,
                    transitionTimingFunction: "cubic-bezier(.2,.9,.2,1)",
                }}
                placeholder="blur"
                blurDataURL={TMDB_BLUR_DATA_URL}
            />

            {/* YouTube inline player */}
            <div
                ref={ytContainer}
                className="absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-[800ms] [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:absolute [&_iframe]:top-0 [&_iframe]:left-0 [&_iframe]:border-0"
                style={{ opacity: showVideo ? 1 : 0, transform: `translateX(${parallax.x * -5}px) translateY(${parallax.y * -3}px)` }}
                aria-hidden={!showVideo}
            />

            {/* YouTube UI overlay masks — hide branding without scaling */}
            {showVideo && (
                <div className="absolute inset-0 z-[5] pointer-events-none" aria-hidden>
                    {/* Top mask — hides title bar, share button */}
                    <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black via-black/70 to-transparent" />
                    {/* Bottom mask — hides progress bar, YT logo */}
                    <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black via-black/70 to-transparent" />
                    {/* Bottom-right mask — hides watermark logo */}
                    <div className="absolute bottom-0 right-0 w-28 h-16 bg-gradient-to-tl from-black/90 to-transparent" />
                    {/* Top-right mask — hides settings/share */}
                    <div className="absolute top-0 right-0 w-36 h-16 bg-gradient-to-bl from-black/80 to-transparent" />
                </div>
            )}

            {/* Glass info card */}
            <div className="absolute inset-0 z-40 flex items-end md:items-center px-4 md:px-12 pb-16 md:pb-16 pointer-events-none">
                <div
                    className={`max-w-4xl w-full transition-all duration-700 ${showInfo ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                    style={{
                        transform: `translateX(${parallax.x * 8}px) translateY(${parallax.y * 6}px) rotateY(${parallax.x * -2}deg) rotateX(${parallax.y * 2}deg)`,
                        pointerEvents: "auto",
                    }}
                >
                    {/* Title */}
                    <div className="relative mb-3 md:mb-4">
                        <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold text-white leading-tight drop-shadow-lg" style={{ position: "relative", zIndex: 3 }}>
                            {slide?.title || slide?.name}
                        </h1>
                        <div aria-hidden style={{ position: "absolute", left: 0, top: "6px", width: "80%", height: "36px", filter: "blur(28px)", background: `linear-gradient(90deg,${accent},${accentLt})`, opacity: 0.22, zIndex: 2, borderRadius: 8, pointerEvents: "none" }} />
                    </div>

                    {/* Overview */}
                    <p className="text-gray-200 text-sm md:text-lg mb-4 md:mb-5 line-clamp-3 md:line-clamp-none" style={{ maxWidth: "65ch" }}>{trimOverview(slide?.overview)}</p>

                    {/* Card */}
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: showInfo ? 1 : 0, y: showInfo ? 0 : 10 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="p-3 rounded-xl md:rounded-2xl mb-4 md:mb-5 flex flex-wrap gap-2 items-center"
                        style={{ background: "rgba(20,20,20,0.4)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(24px)", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
                        <motion.button 
                            whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.15)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleWishlist}
                            className="inline-flex items-center gap-1.5 md:gap-2 rounded-lg md:rounded-xl border border-white/10 bg-white/5 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-semibold text-white transition-colors">
                            {isInList ? <AppIcon icon={FavouriteIcon} size={14} className="fill-current" /> : <AppIcon icon={PlusSignIcon} size={14} />}
                            {isInList ? "In My List" : "Add to List"}
                        </motion.button>
                        {(slide?.genres || []).slice(0, 3).map((g, i) => (
                            <span key={i} className="text-[10px] md:text-xs px-2.5 md:px-3 py-1 md:py-1.5 rounded-full bg-white/5 border border-white/5 text-white/90">
                                {typeof g === "string" ? g : g.name}
                            </span>
                        ))}
                    </motion.div>

                    {/* Buttons row */}
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: showInfo ? 1 : 0, y: showInfo ? 0 : 10 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="flex flex-wrap items-center gap-2 md:gap-3">
                        {/* Play Trailer — correct signature */}
                        <motion.button
                            whileHover={{ scale: 1.05, filter: "brightness(1.2)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleHeroTrailer}
                            className="flex items-center gap-1.5 md:gap-2 rounded-lg md:rounded-xl px-4 md:px-6 py-2.5 md:py-3 text-sm md:text-lg font-bold shadow-[0_0_30px_rgba(0,0,0,0.5)]"
                            style={{ background: `linear-gradient(135deg, ${accent}, rgba(255,255,255,0.1))`, color: accentTxt }}
                        >
                            <AppIcon icon={PlayIcon} size={16} className="fill-current md:w-[18px] md:h-[18px]" />
                            Play Trailer
                        </motion.button>

                        <motion.button 
                            whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.15)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowInfo((s) => !s)}
                            className="inline-flex items-center gap-1.5 md:gap-2 rounded-lg md:rounded-xl border border-white/10 bg-black/40 backdrop-blur-md px-4 py-2.5 md:py-3 text-sm md:font-semibold text-white transition-colors">
                            <AppIcon icon={InformationCircleIcon} size={16} />
                            <span className="hidden sm:inline">Info</span>
                        </motion.button>

                        <motion.button 
                            whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSkipIntro}
                            className="inline-flex items-center gap-1.5 md:gap-2 rounded-lg md:rounded-xl border border-white/5 bg-black/60 backdrop-blur-md px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm text-white transition-colors">
                            <AppIcon icon={NextIcon} size={14} />
                            <span className="hidden sm:inline">Skip</span>
                        </motion.button>

                        <div className="md:ml-auto w-full md:w-auto mt-2 md:mt-0 flex items-center justify-between md:justify-start gap-3">
                            <motion.button 
                                whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.1)" }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setMuted((m) => !m)}
                                className="flex items-center justify-center rounded-lg md:rounded-xl border border-white/10 bg-black/50 backdrop-blur-md h-9 w-9 md:h-10 md:w-10 text-white transition-colors">
                                {muted ? <AppIcon icon={VolumeMute02Icon} size={16} /> : <AppIcon icon={VolumeHighIcon} size={16} />}
                            </motion.button>
                            <div className="relative flex items-center w-full sm:w-28 md:w-36 group h-6">
                                <div className="absolute w-full h-1.5 bg-white/20 rounded-full overflow-hidden pointer-events-none">
                                    <div className="h-full" style={{ width: `${volume}%`, backgroundColor: accent }} />
                                </div>
                                <input
                                    aria-label="Volume"
                                    type="range" min="0" max="100"
                                    value={volume}
                                    onChange={(e) => {
                                        const v = Number(e.target.value);
                                        setVolume(v); setMuted(v === 0);
                                        try { if (ytPlayer.current) ytPlayer.current.setVolume(v); } catch (e) { }
                                    }}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div 
                                    className="absolute h-3.5 w-3.5 rounded-full shadow-lg transition-transform group-hover:scale-125 pointer-events-none" 
                                    style={{ left: `calc(${volume}% - 7px)`, backgroundColor: accent }}
                                />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Playback controls (bg video) */}
            {videoKey && showVideo && (
                <div className="absolute bottom-6 left-6 z-50 flex items-center gap-3">
                    <button onClick={handlePlayPause} className="rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-white hover:bg-black/80 transition-colors">
                        {isPlaying ? <AppIcon icon={PauseIcon} size={18} /> : <AppIcon icon={PlayIcon} size={18} className="fill-current" />}
                    </button>
                    <button onClick={() => setMuted((m) => !m)} className="rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-white hover:bg-black/80 transition-colors">
                        {muted ? <AppIcon icon={VolumeMute02Icon} size={18} /> : <AppIcon icon={VolumeHighIcon} size={18} />}
                    </button>
                </div>
            )}

            {/* Persistent Slide Navigation Arrows */}
            {slides.length > 1 && (
                <>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIndex((i) => (i - 1 + slides.length) % slides.length); }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-black/40 border border-white/10 text-white hover:bg-black/60 transition-all opacity-0 md:opacity-100 hover:scale-110"
                        style={{ backdropFilter: "blur(8px)" }}
                        aria-label="Previous slide"
                    >
                        <AppIcon icon={NextIcon} size={24} className="rotate-180" />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIndex((i) => (i + 1) % slides.length); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-black/40 border border-white/10 text-white hover:bg-black/60 transition-all opacity-0 md:opacity-100 hover:scale-110"
                        style={{ backdropFilter: "blur(8px)" }}
                        aria-label="Next slide"
                    >
                        <AppIcon icon={NextIcon} size={24} />
                    </button>
                </>
            )}

            {/* Slide dots */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[90] flex items-center gap-3">
                {slides.map((s, i) => {
                    const active = i === index;
                    return (
                        <button
                            key={i}
                            onClick={() => setIndex(i)}
                            aria-label={`Slide ${i + 1}: ${s?.title || s?.name || ""}`}
                            className={`relative rounded-full transition-all duration-300 focus:outline-none ${active
                                ? "w-3 h-3 bg-white scale-125 shadow-[0_0_12px_rgba(255,255,255,0.85)]"
                                : "w-3 h-3 bg-gray-500/60"
                                }`}
                        >
                            {active && <span className="absolute inset-0 rounded-full bg-white/30 animate-ping" aria-hidden />}
                        </button>
                    );
                })}
            </div>

            <style>{`
        @keyframes dust {
          0%   { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
          10%  { opacity: 0.7; }
          100% { transform: translateY(-60px) translateX(30px) scale(1.2); opacity: 0; }
        }
        .animate-dust { width:2px; height:2px; border-radius:999px; animation: dust 6s linear infinite; }
      `}</style>
        </section>
    );
}
