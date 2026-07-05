import React, { useEffect, useState } from 'react';
import { TrendingUp, Film, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function TrendingSidebar() {
  const router = useRouter();
  const [trendingTakes, setTrendingTakes] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Fetch Trending Takes
    fetch('/api/posts/trending?limit=5')
      .then(res => res.json())
      .then(data => {
        setTrendingTakes(data.posts || []);
      })
      .catch(err => console.error(err));

    // Fetch Popular Movies from TMDB
    if (process.env.NEXT_PUBLIC_TMDB_KEY) {
      fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${process.env.NEXT_PUBLIC_TMDB_KEY}`)
        .then(res => res.json())
        .then(data => {
          setPopularMovies(data.results?.slice(0, 3) || []);
        })
        .catch(err => console.error(err));
    }
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="w-full max-w-[320px] space-y-6 sticky top-24 hidden lg:block">
      {/* Search Input placeholder */}
      <form onSubmit={handleSearch} className="relative">
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search movies, people, tags..." 
          className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 px-5 pl-10 text-sm text-white outline-none focus:border-white/30 focus:bg-white/10 transition-colors"
        />
        <Search className="w-4 h-4 text-gray-400 absolute left-4 top-3" />
      </form>
      
      {/* Trending Posts */}
      <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-3xl p-5">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#e50914]" /> Trending Takes
        </h3>
        <div className="space-y-4">
          {trendingTakes.length > 0 ? trendingTakes.map((post) => (
            <Link href={`/post/${post.id}`} key={post.id} className="block group cursor-pointer">
              <div className="text-xs text-gray-500 mb-1">@{post.authorCache?.username}</div>
              <div className="font-bold text-gray-200 group-hover:text-white line-clamp-2 leading-tight">
                {post.content || (post.tmdbRef ? `Attached ${post.tmdbRef.title}` : 'Media Post')}
              </div>
              <div className="text-xs text-gray-500 mt-1">{post.likeCount} likes · {post.commentCount} replies</div>
            </Link>
          )) : (
            <div className="text-sm text-gray-500">No trending takes yet.</div>
          )}
        </div>
        <Link href="/social?tab=trending" className="block mt-4 text-[#e50914] text-sm hover:underline">
          Show more
        </Link>
      </div>
      
      {/* Popular Movies */}
      <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-3xl p-5">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Film className="w-5 h-5 text-blue-500" /> Popular This Week
        </h3>
        <div className="space-y-3">
          {popularMovies.length > 0 ? popularMovies.map((movie) => (
            <Link href={`/movie/${movie.id}`} key={movie.id} className="flex items-center gap-3 group cursor-pointer hover:bg-white/5 p-2 rounded-xl transition-colors -mx-2">
              <div className="w-12 h-16 bg-gray-800 rounded-lg overflow-hidden shrink-0">
                {movie.poster_path && (
                  <img 
                    src={`/tmdb-proxy/w92${movie.poster_path}`} 
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div>
                <div className="font-bold text-gray-200 group-hover:text-white line-clamp-1">{movie.title}</div>
                <div className="text-xs text-gray-400">
                  {movie.release_date?.split('-')[0]} · {movie.media_type === 'tv' ? 'TV Show' : 'Movie'}
                </div>
                <div className="text-xs text-yellow-500 mt-1 flex items-center gap-1">
                  ★ {movie.vote_average?.toFixed(1)}/10
                </div>
              </div>
            </Link>
          )) : (
            <div className="text-sm text-gray-500">Loading popular movies...</div>
          )}
        </div>
      </div>
      
      {/* Footer links */}
      <div className="text-xs text-gray-500 flex flex-wrap gap-x-3 gap-y-1 px-2">
        <Link href="/about" className="hover:underline">About</Link>
        <Link href="/terms" className="hover:underline">Terms of Service</Link>
        <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
        <Link href="/guidelines" className="hover:underline">Community Guidelines</Link>
        <span>© 2026 Rushes</span>
      </div>
    </div>
  );
}
