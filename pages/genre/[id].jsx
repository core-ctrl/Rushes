import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import MovieCard from "../../components/MovieCard";
import Navbar from "../../components/Navbar";
import { fetchByGenre } from "../../lib/tmdb";
import { ArrowLeftIcon } from "@hugeicons/core-free-icons";
import AppIcon from "../../components/AppIcon";

export default function GenrePage({ genreId, genreName, initialMovies }) {
  const router = useRouter();
  const [movies, setMovies] = useState(initialMovies);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("popularity.desc");
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // If we change sort, reset and fetch
  useEffect(() => {
    let active = true;
    const fetchSorted = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/movies/by-genre?id=${genreId}&sort=${sortBy}&page=1`);
        const data = await res.json();
        if (active) {
          setMovies(data.results || []);
          setPage(1);
          setHasMore((data.results || []).length > 0);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    };
    // Don't refetch on initial load if sorting hasn't changed
    if (sortBy !== "popularity.desc") {
      fetchSorted();
    }
  }, [sortBy, genreId]);

  const loadMore = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const next = page + 1;
      const res = await fetch(`/api/movies/by-genre?id=${genreId}&sort=${sortBy}&page=${next}`);
      const data = await res.json();
      if (data.results?.length > 0) {
        setMovies((prev) => [...prev, ...data.results]);
        setPage(next);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>{genreName} Movies - Rushes</title>
      </Head>
      <Navbar />

      <main className="min-h-screen bg-black text-white pt-24 pb-20">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
                <button onClick={() => router.back()} className="text-neutral-400 hover:text-white flex items-center gap-2 text-sm font-medium mb-3 transition-colors">
                    <AppIcon icon={ArrowLeftIcon} size={16} /> Back
                </button>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight">{genreName} Movies</h1>
            </div>

            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-1">
              <button
                onClick={() => setSortBy("popularity.desc")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  sortBy === "popularity.desc" ? "bg-white/10 text-white shadow" : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Trending
              </button>
              <button
                onClick={() => setSortBy("primary_release_date.desc")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  sortBy === "primary_release_date.desc" ? "bg-white/10 text-white shadow" : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Latest
              </button>
              <button
                onClick={() => setSortBy("vote_average.desc")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  sortBy === "vote_average.desc" ? "bg-white/10 text-white shadow" : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Top Rated
              </button>
            </div>
          </div>

          {movies.length === 0 && !loading ? (
            <div className="py-20 text-center text-neutral-500">No movies found.</div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 md:gap-6"
            >
              {movies.map((movie) => (
                <MovieCard key={`${movie.id}-${movie.uuid || Math.random()}`} media={movie} mediaType="movie" />
              ))}
            </motion.div>
          )}

          {hasMore && movies.length > 0 && (
            <div className="mt-12 flex justify-center">
              <button
                onClick={loadMore}
                disabled={loading}
                className="rounded-xl border border-white/10 bg-white/5 px-8 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10 disabled:opacity-50"
              >
                {loading ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export async function getServerSideProps(context) {
  const { id, name } = context.query;
  const { fetchByGenre } = await import("../../lib/tmdb");

  const initialMovies = await fetchByGenre(id, 1, "movie", "popularity.desc");

  return {
    props: {
      genreId: id,
      genreName: name || "Genre",
      initialMovies: initialMovies || [],
    },
  };
}
