// components/SmartSearch.jsx
import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Cancel01Icon,
  FireIcon,
  PlayIcon,
  Search01Icon,
  Tv01Icon,
} from "@hugeicons/core-free-icons";
import axios from "axios";
import AppIcon from "./AppIcon";
import { TMDB_BLUR_DATA_URL } from "../lib/imageBlur";

const GENRES = [
  { id: 28, name: "Action" },
  { id: 35, name: "Comedy" },
  { id: 27, name: "Horror" },
  { id: 878, name: "Sci-Fi" },
  { id: 10749, name: "Romance" },
  { id: 53, name: "Thriller" },
  { id: 16, name: "Animation" },
  { id: 9648, name: "Mystery" }
];

function debounce(fn, delay) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

export default function SmartSearch({ fullscreen = false, onClose }) {
    const router = useRouter();
    const inputRef = useRef(null);
    const [query, setQuery] = useState("");
    const [sugg, setSugg] = useState([]);
    const [loading, setLoading] = useState(false);
    const [focused, setFocused] = useState(false);

    const fetchSugg = useCallback(
        debounce(async (q) => {
            if (!q || q.length < 2) { setSugg([]); return; }
            setLoading(true);
            try {
                const { data } = await axios.get(`/api/search/autocomplete?q=${encodeURIComponent(q)}`);
                setSugg(data.suggestions || []);
            } catch { }
            finally { setLoading(false); }
        }, 280),
        []
    );

    const handleChange = (e) => { setQuery(e.target.value); fetchSugg(e.target.value); };

    const handleSearch = (q = query) => {
        if (!q.trim()) return;
        router.push(`/search?q=${encodeURIComponent(q.trim())}`);
        setQuery(""); setSugg([]); setFocused(false);
        onClose?.();
    };

    const handleKey = (e) => {
        if (e.key === "Enter") handleSearch();
        if (e.key === "Escape") { setFocused(false); onClose?.(); }
    };

    const showDrop = focused && (sugg.length > 0 || !query);

    return (
        <div className={`relative ${fullscreen ? "w-full" : ""}`}>
            <div className={`flex items-center gap-2 transition-all ${fullscreen
                    ? "glass-strong rounded-2xl px-5 py-4 border border-white/10 focus-within:border-red-500/40"
                    : "glass rounded-full px-3 py-1.5 border border-white/10 focus-within:border-red-500/30"
                }`}>
                {loading
                    ? <div className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    : <AppIcon icon={Search01Icon} size={14} className="text-neutral-500 flex-shrink-0" />
                }
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleChange}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setTimeout(() => setFocused(false), 200)}
                    onKeyDown={handleKey}
                    placeholder={fullscreen ? "Search movies, series, anime... try 'funny anime' or 'sad drama'" : "Search..."}
                    className={`bg-transparent outline-none text-white placeholder:text-neutral-600 ${fullscreen ? "flex-1 text-lg" : "text-sm w-28 focus:w-44 transition-all duration-300"
                        }`}
                />
                {query && (
                    <button onClick={() => { setQuery(""); setSugg([]); }} className="text-neutral-600 hover:text-white transition-colors">
                        <AppIcon icon={Cancel01Icon} size={11} />
                    </button>
                )}
            </div>

            <AnimatePresence>
                {showDrop && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute top-full mt-2 left-0 right-0 glass-strong rounded-2xl border border-white/10 overflow-hidden shadow-2xl z-[200] min-w-[300px]"
                    >
                        {sugg.length > 0 ? (
                            <div className="py-2">
                                <p className="text-xs text-neutral-600 px-4 py-2 uppercase tracking-wider font-semibold">Results</p>
                                {sugg.map((s) => (
                                    <button key={s.id} onClick={() => handleSearch(s.title)}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left">
                                        {s.poster ? (
                                            <Image
                                                src={`https://image.tmdb.org/t/p/w92${s.poster}`}
                                                alt={s.title}
                                                width={200}
                                                height={300}
                                                className="w-8 h-12 object-cover rounded-md flex-shrink-0"
                                            />
                                        ) : (
                                            <div className="w-8 h-12 bg-white/5 rounded-md flex items-center justify-center flex-shrink-0">
                                                {s.type === "movie" ? <AppIcon icon={PlayIcon} size={10} /> : <AppIcon icon={Tv01Icon} size={10} />}
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <p className="text-white text-sm font-medium truncate">{s.title}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-neutral-600 text-xs">{s.year}</span>
                                                {s.rating > 0 && <span className="text-yellow-500 text-xs">★ {s.rating}</span>}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="py-2">
                                <p className="text-xs text-neutral-600 px-4 py-2 uppercase tracking-wider font-semibold flex items-center gap-2">
                                    <AppIcon icon={FireIcon} className="text-red-500" size={10} /> Browse Genres
                                </p>
                                <div className="grid grid-cols-2 gap-2 px-4 pb-3">
                                {GENRES.map((g) => (
                                    <button key={g.id} onClick={() => { setFocused(false); router.push(`/genre/${g.id}?name=${encodeURIComponent(g.name)}`); onClose?.(); }}
                                        className="w-full flex items-center justify-center px-4 py-2 hover:bg-white/10 bg-white/5 border border-white/5 rounded-xl transition-all text-center">
                                        <span className="text-neutral-200 text-sm font-medium">{g.name}</span>
                                    </button>
                                ))}
                                </div>
                            </div>
                        )}
                        {query.length >= 2 && (
                            <button onClick={() => handleSearch()}
                                className="w-full flex items-center gap-3 px-4 py-3 border-t border-white/5 hover:bg-white/5 transition-colors">
                                <AppIcon icon={Search01Icon} size={10} className="text-red-500 flex-shrink-0" />
                                <span className="text-sm text-neutral-300">Search <strong className="text-white">"{query}"</strong></span>
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
