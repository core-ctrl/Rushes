import { useState, useEffect } from "react";
import axios from "axios";
import AppIcon from "../AppIcon";
import { Search01Icon, PlusSignIcon, Tick01Icon } from "@hugeicons/core-free-icons";

export default function ListBuilder({ listId, existingMovies = [], onAddMovie }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch recommendations whenever existingMovies changes (or initially)
  useEffect(() => {
    // Only fetch recommendations if search is empty
    if (searchQuery.length > 0) return;

    let endpoint = "/api/trending";
    if (existingMovies && existingMovies.length > 0) {
      const lastMovie = existingMovies[existingMovies.length - 1];
      const tmdbId = lastMovie.tmdbId || lastMovie.mediaId || lastMovie.id;
      const mediaType = lastMovie.mediaType || lastMovie.media_type || "movie";
      if (tmdbId) {
        endpoint = `/api/recommendations/smart?tmdbId=${tmdbId}&mediaType=${mediaType}`;
      }
    }

    setLoading(true);
    axios.get(endpoint)
      .then(res => {
         const existingIds = new Set(existingMovies.map(m => String(m.tmdbId || m.mediaId || m.id)));
         const recs = (res.data.results || []).filter(item => !existingIds.has(String(item.id)));
         setRecommendations(recs);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [existingMovies, searchQuery]);

  // Fetch search results when typing
  useEffect(() => {
    if (searchQuery.length > 2) {
      const delay = setTimeout(() => {
        setLoading(true);
        axios.get(`/api/search?q=${encodeURIComponent(searchQuery)}`)
          .then(res => setSearchResults(res.data.results || []))
          .catch(console.error)
          .finally(() => setLoading(false));
      }, 500);
      return () => clearTimeout(delay);
    } else if (searchQuery.length <= 2) {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const renderList = (items) => {
    if (loading && items.length === 0) {
       return <div className="py-10 text-center text-neutral-500 animate-pulse">Loading suggestions...</div>;
    }
    if (!loading && items.length === 0) {
       return <div className="py-10 text-center text-neutral-500">No results found.</div>;
    }

    return (
      <div className="flex flex-col max-h-[400px] overflow-y-auto custom-scrollbar pr-2 pb-4 mt-6">
        {items.map(item => {
          const tmdbId = item.id || item.tmdbId;
          if (!tmdbId) return null;
          
          const isAdded = existingMovies.some(m => String(m.tmdbId || m.mediaId || m.id) === String(tmdbId));
          const title = item.title || item.name;
          const posterPath = item.poster_path || item.posterPath;
          
          return (
            <div key={tmdbId} className="group flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors">
              <div className="flex items-center gap-4 flex-1 overflow-hidden">
                <div className="w-12 h-12 flex-shrink-0 bg-[#282828] rounded flex items-center justify-center overflow-hidden">
                  {posterPath ? (
                    <img src={`https://image.tmdb.org/t/p/w92${posterPath}`} alt={title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[8px] leading-tight text-neutral-500 font-bold uppercase p-1 text-center truncate">{title}</span>
                  )}
                </div>
                
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-bold text-white text-base truncate">{title}</span>
                  <span className="text-sm text-neutral-400 capitalize">{item.media_type || item.mediaType || 'Movie'}</span>
                </div>
              </div>

              <div className="pl-4 flex-shrink-0">
                {isAdded ? (
                  <button disabled className="px-4 py-1.5 rounded-full bg-transparent border border-green-500/50 text-green-400 font-bold text-xs flex items-center gap-1 opacity-70 cursor-not-allowed">
                    <AppIcon icon={Tick01Icon} size={14} /> Added
                  </button>
                ) : (
                  <button 
                    onClick={() => onAddMovie({
                      tmdbId,
                      mediaType: item.media_type || item.mediaType || 'movie',
                      title,
                      posterPath
                    })}
                    className="px-5 py-1.5 rounded-full bg-transparent border border-[#727272] hover:border-white hover:scale-105 text-white font-bold text-sm transition-all"
                  >
                    Add
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const isSearching = searchQuery.length > 2;

  return (
    <div className="mt-12 pt-8 border-t border-white/10">
      <h3 className="text-2xl font-bold mb-6">Let's find something for your list</h3>
      
      <div className="max-w-md relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
          <AppIcon icon={Search01Icon} size={20} />
        </div>
        <input 
          type="text"
          placeholder="Search for movies or series..."
          className="w-full bg-[#2a2a2a] hover:bg-[#333333] transition-colors border-none rounded-md pl-10 pr-4 py-3 text-white focus:outline-none focus:bg-[#333333] focus:ring-1 focus:ring-white/20 text-sm font-medium h-full placeholder:text-[#b3b3b3]"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="min-h-[200px]">
        {isSearching ? renderList(searchResults) : renderList(recommendations)}
      </div>
    </div>
  );
}
