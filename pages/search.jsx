import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import Image from "next/image";
import { Search02Icon, UserIcon, FilmIcon, TvIcon } from "@hugeicons/core-free-icons";
import AppIcon from "../components/AppIcon";



const GENRES = [
    { id: "", name: "All Genres" },
    { id: 28, name: "Action" },
    { id: 35, name: "Comedy" },
    { id: 18, name: "Drama" },
    { id: 27, name: "Horror" },
    { id: 10749, name: "Romance" },
    { id: 878, name: "Sci-Fi" },
    { id: 53, name: "Thriller" },
    { id: 16, name: "Anime" }
];



function MovieResult({ movie }) {
    const isTV = movie.media_type === "tv" || !!movie.first_air_date;
    const linkPath = isTV ? `/series/${movie.id}` : `/movies/${movie.id}`;
    return (
        <Link href={linkPath}>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors cursor-pointer"
            >
                <div className="w-16 h-24 rounded-lg bg-neutral-800 overflow-hidden flex-shrink-0">
                    {movie.poster_path && (
                        <Image
                            src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                            alt={movie.title}
                            width={64}
                            height={96}
                            className="object-cover"
                        />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{movie.title || movie.name}</p>
                    <p className="text-sm text-neutral-500">
                        {movie.release_date?.split("-")[0] || movie.first_air_date?.split("-")[0] || "Unknown"}
                    </p>
                    <p className="text-xs text-neutral-600 mt-1 line-clamp-2">{movie.overview}</p>
                </div>
            </motion.div>
        </Link>
    );
}

export default function SearchPage() {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [selectedGenre, setSelectedGenre] = useState("");
    const [debounceTimer, setDebounceTimer] = useState(null);

    const searchAll = useCallback(async (q) => {
        if (!q || q.length < 1) {
            setResults([]);
            return;
        }
        setLoading(true);
        try {
            const res = await axios.get(`/api/search/advanced?q=${encodeURIComponent(q)}`);
            // filter out people, only keep movie/tv
            const mediaOnly = (res.data.results || []).filter(item => item.media_type === "movie" || item.media_type === "tv");
            setResults(mediaOnly);
        } catch (err) {
            console.error("Search failed:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (debounceTimer) clearTimeout(debounceTimer);

        const timer = setTimeout(() => {
            searchAll(query);
        }, 300);

        setDebounceTimer(timer);
        return () => {
            if (debounceTimer) clearTimeout(debounceTimer);
        };
    }, [query, searchAll]);

    const displayedResults = selectedGenre ? results.filter(m => m.genre_ids?.includes(Number(selectedGenre))) : results;
    const hasResults = displayedResults.length > 0;

    return (
        <>
            <Head>
                <title>Search — MovieFinder</title>
            </Head>

            <div className="min-h-screen bg-neutral-950 px-4 pt-24 pb-20">
                <div className="max-w-2xl mx-auto">
                    {/* Search Input & Genre */}
                    <div className="relative mb-6 flex items-center gap-3">
                        <div className="relative flex-1">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
                                <AppIcon icon={Search02Icon} size={16} />
                            </span>
                            <input
                                type="text"
                                placeholder="Search movies, series, anime..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="w-full bg-neutral-900 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-neutral-600 focus:outline-none focus:border-accent transition-colors"
                                autoFocus
                            />
                        </div>
                        
                        <select
                            value={selectedGenre}
                            onChange={(e) => setSelectedGenre(e.target.value)}
                            className="bg-neutral-900 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-accent transition-colors cursor-pointer appearance-none min-w-[140px]"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
                        >
                            {GENRES.map(g => (
                                <option key={g.name} value={g.id}>{g.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Results */}
                    <AnimatePresence mode="wait">
                        {loading ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex justify-center py-12"
                            >
                                <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                            </motion.div>
                        ) : !query ? (
                            <motion.div
                                key="empty-query"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-center py-12"
                            >
                                <div className="text-4xl mb-3">🔍</div>
                                <p className="text-neutral-500">Start typing to search</p>
                            </motion.div>
                        ) : !hasResults ? (
                            <motion.div
                                key="no-results"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-center py-12"
                            >
                                <div className="text-4xl mb-3">😕</div>
                                <p className="text-neutral-500">No results found</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="results"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-2"
                            >
                                {displayedResults.map((item) => (
                                    <MovieResult key={item.id} movie={{ ...item, poster_path: item.poster_path }} />
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </>
    );
}
