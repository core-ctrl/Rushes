import React, { useState, useEffect } from "react";
import Head from "next/head";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { selectUser } from "../../store/slices/authSlice";
import { toggleWatchlist } from "../../store/slices/watchlistSlice";
import AppIcon from "../../components/AppIcon";
import { Cancel01Icon, FavouriteIcon, PlayIcon } from "@hugeicons/core-free-icons";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/router";

function SwipeCard({ movie, onSwipeLeft, onSwipeRight, active }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  
  const handleDragEnd = (event, info) => {
    const offset = info.offset.x;
    if (offset > 100) {
      onSwipeRight(movie);
    } else if (offset < -100) {
      onSwipeLeft(movie);
    }
  };

  if (!active) {
    return (
      <div className="absolute inset-0 bg-neutral-900 rounded-3xl overflow-hidden opacity-50 scale-95 origin-bottom pointer-events-none transition-transform shadow-xl">
        <img src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} alt={movie.title} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.05 }}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ x: x.get() > 0 ? 300 : -300, opacity: 0, transition: { duration: 0.2 } }}
      className="absolute inset-0 bg-neutral-900 rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing shadow-[0_20px_50px_rgba(0,0,0,0.5)] touch-none"
    >
      <img src={`https://image.tmdb.org/t/p/w780${movie.poster_path}`} alt={movie.title || movie.name} className="w-full h-full object-cover pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />
      
      {/* Vibe indicators while dragging */}
      <motion.div style={{ opacity: useTransform(x, [50, 100], [0, 1]) }} className="absolute top-8 left-8 border-4 border-green-500 text-green-500 font-black text-4xl px-4 py-2 rounded-xl rotate-[-15deg] uppercase">
        Want
      </motion.div>
      <motion.div style={{ opacity: useTransform(x, [-50, -100], [0, 1]) }} className="absolute top-8 right-8 border-4 border-red-500 text-red-500 font-black text-4xl px-4 py-2 rounded-xl rotate-[15deg] uppercase">
        Skip
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 p-6 pointer-events-none text-left">
        <h2 className="text-3xl font-bold text-white mb-1 shadow-black drop-shadow-md">{movie.title || movie.name}</h2>
        <p className="text-neutral-300 text-sm mb-3 font-medium">
          {movie.release_date?.split("-")[0] || movie.first_air_date?.split("-")[0]} • ⭐ {movie.vote_average?.toFixed(1)}
        </p>
        <p className="text-sm text-neutral-400 line-clamp-3 mb-20">{movie.overview}</p>
      </div>
    </motion.div>
  );
}

export default function SwipeDiscovery() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const router = useRouter();

  useEffect(() => {
    // Fetch a random page of popular movies to keep it fresh
    const page = Math.floor(Math.random() * 5) + 1;
    axios.get(`/api/movies/trending?page=${page}`)
      .then(res => {
        setMovies(res.data.movies || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSwipeLeft = () => {
    setMovies(prev => prev.slice(1));
  };

  const handleSwipeRight = (movie) => {
    dispatch(toggleWatchlist(movie));
    setMovies(prev => prev.slice(1));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold mb-2">You swiped them all!</h2>
        <p className="text-neutral-400 mb-8">We're finding more movies for you. Check back later.</p>
        <button onClick={() => router.push('/')} className="px-6 py-3 bg-red-600 rounded-full font-bold">Back to Home</button>
      </div>
    );
  }

  const currentMovie = movies[0];

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center overflow-hidden overscroll-none">
      <Head>
        <title>Swipe Discovery — Rushes</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </Head>

      {/* Top Nav */}
      <div className="absolute top-0 left-0 right-0 p-6 z-50 flex items-center justify-between">
        <button onClick={() => router.back()} className="text-white bg-white/10 p-3 rounded-full backdrop-blur-md">
          <AppIcon icon={Cancel01Icon} size={20} />
        </button>
        <h1 className="text-lg font-bold text-white tracking-widest uppercase">Discovery</h1>
        <Link href={`/movies/${currentMovie?.id}`} className="text-white bg-white/10 p-3 rounded-full backdrop-blur-md w-10 h-10 flex items-center justify-center font-bold">
           i
        </Link>
      </div>

      {/* Card Stack */}
      <div className="relative w-full max-w-sm h-[70vh] max-h-[800px] mx-auto mt-10">
        <AnimatePresence>
          {movies.slice(0, 2).reverse().map((movie, index) => {
             const isTop = index === movies.slice(0, 2).length - 1;
             return (
               <SwipeCard 
                 key={movie.id} 
                 movie={movie} 
                 active={isTop}
                 onSwipeLeft={handleSwipeLeft}
                 onSwipeRight={handleSwipeRight}
               />
             );
          })}
        </AnimatePresence>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-6 z-50">
        <button 
          onClick={handleSwipeLeft}
          className="w-16 h-16 bg-neutral-900 border-2 border-red-500 text-red-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:scale-110 active:scale-95 transition-transform"
        >
          <AppIcon icon={Cancel01Icon} size={28} />
        </button>
        <button 
          onClick={() => handleSwipeRight(currentMovie)}
          className="w-16 h-16 bg-neutral-900 border-2 border-green-500 text-green-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:scale-110 active:scale-95 transition-transform"
        >
          <AppIcon icon={FavouriteIcon} size={28} />
        </button>
      </div>
    </div>
  );
}
