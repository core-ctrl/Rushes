import React from 'react';
import { TrendingUp, Film, UserPlus } from 'lucide-react';
import Link from 'next/link';

export default function TrendingSidebar({ trendingPosts = [], trendingMovies = [] }) {
  return (
    <div className="w-full max-w-[320px] space-y-6 sticky top-24 hidden lg:block">
      {/* Search Input placeholder */}
      <div className="relative">
        <input 
          type="text" 
          placeholder="Search movies, people, tags..." 
          className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 px-5 text-sm text-white outline-none focus:border-white/30 focus:bg-white/10 transition-colors"
        />
      </div>
      
      {/* Trending Posts */}
      <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-3xl p-5">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#e50914]" /> Trending Takes
        </h3>
        <div className="space-y-4">
          {[1,2,3,4,5].map((i) => (
            <div key={i} className="group cursor-pointer">
              <div className="text-xs text-gray-500 mb-1">Trending in Movies</div>
              <div className="font-bold text-gray-200 group-hover:text-white line-clamp-2 leading-tight">
                "Dune: Part Two is an absolute masterpiece of modern cinema. The scale, the sound design, the cinematography..."
              </div>
              <div className="text-xs text-gray-500 mt-1">4.2K likes · 892 replies</div>
            </div>
          ))}
        </div>
        <Link href="/trending" className="block mt-4 text-[#e50914] text-sm hover:underline">
          Show more
        </Link>
      </div>
      
      {/* Popular Movies */}
      <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-3xl p-5">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Film className="w-5 h-5 text-blue-500" /> Popular This Week
        </h3>
        <div className="space-y-3">
          {[1,2,3].map((i) => (
            <div key={i} className="flex items-center gap-3 group cursor-pointer hover:bg-white/5 p-2 rounded-xl transition-colors -mx-2">
              <div className="w-12 h-16 bg-gray-800 rounded-lg overflow-hidden shrink-0">
                {/* Poster img here */}
              </div>
              <div>
                <div className="font-bold text-gray-200 group-hover:text-white">Movie Title {i}</div>
                <div className="text-xs text-gray-400">2024 · Sci-Fi</div>
                <div className="text-xs text-yellow-500 mt-1">★ 8.5/10</div>
              </div>
            </div>
          ))}
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
