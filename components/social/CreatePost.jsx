import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Film, BarChart2, Smile, Globe, Users, Lock, X, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function CreatePost({ onPostCreated }) {
  const { data: session } = useSession();
  const [content, setContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [postType, setPostType] = useState('text'); // text, poll, media
  const [visibility, setVisibility] = useState('public');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Movie search state
  const [showMovieSearch, setShowMovieSearch] = useState(false);
  const [movieQuery, setMovieQuery] = useState('');
  const [movieResults, setMovieResults] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [searchingMovies, setSearchingMovies] = useState(false);
  const movieSearchTimer = useRef(null);
  // Poll state
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollDays, setPollDays] = useState(1);
  
  // Media state
  const [mediaUrls, setMediaUrls] = useState([]);
  const fileInputRef = useRef(null);

  const handleExpand = () => setIsExpanded(true);
  const handleCollapse = () => {
    if (!content && mediaUrls.length === 0 && pollOptions.every(o => !o) && !selectedMovie) {
      setIsExpanded(false);
      setPostType('text');
      setShowMovieSearch(false);
    }
  };

  const searchMovies = async (q) => {
    if (movieSearchTimer.current) clearTimeout(movieSearchTimer.current);
    if (!q.trim()) {
      setMovieResults([]);
      setSearchingMovies(false);
      return;
    }
    setSearchingMovies(true);
    movieSearchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${process.env.NEXT_PUBLIC_TMDB_KEY}&query=${encodeURIComponent(q)}`);
        const data = await res.json();
        setMovieResults(data.results?.filter((r) => r.media_type !== 'person').slice(0, 5) || []);
      } catch (error) {
        console.error('Movie search error:', error);
        setMovieResults([]);
      } finally {
        setSearchingMovies(false);
      }
    }, 300);
  };

  const handlePollOptionChange = (index, value) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
    
    // Auto-add option if typing in last one
    if (index === newOptions.length - 1 && value && newOptions.length < 6) {
      setPollOptions([...newOptions, '']);
    }
  };

  const removePollOption = (index) => {
    if (pollOptions.length <= 2) return;
    const newOptions = [...pollOptions];
    newOptions.splice(index, 1);
    setPollOptions(newOptions);
  };

  const handleSubmit = async () => {
    if (!content.trim() && postType === 'text' && !selectedMovie) return;
    
    setIsSubmitting(true);
    
    try {
      const payload = {
        content,
        postType,
        visibility,
        isSpoiler
      };
      
      if (selectedMovie) {
        payload.tmdbRef = {
          id: selectedMovie.id,
          mediaType: selectedMovie.media_type,
          title: selectedMovie.title || selectedMovie.name,
          poster: selectedMovie.poster_path
        };
      }
      
      if (postType === 'poll') {
        const validOptions = pollOptions.filter(o => o.trim() !== '');
        if (validOptions.length < 2) throw new Error('Poll needs at least 2 options');
        
        payload.poll = {
          question: content || 'Poll',
          options: validOptions,
          expiresAt: new Date(Date.now() + pollDays * 24 * 60 * 60 * 1000).toISOString()
        };
      }
      
      // Simulate API call for now (frontend wiring)
      const res = await fetch('/api/posts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const data = await res.json();
        setContent('');
        setPollOptions(['', '']);
        setMediaUrls([]);
        setPostType('text');
        setSelectedMovie(null);
        setShowMovieSearch(false);
        setIsExpanded(false);
        if (onPostCreated) onPostCreated(data.post);
      }
    } catch (err) {
      console.error(err);
      // Show toast error
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-3xl p-5 mb-6 focus-within:ring-1 focus-within:ring-white/20 transition-all">
      <div className="flex gap-4">
        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-gray-800">
          <img src={session?.user?.avatar || '/default-avatar.png'} alt="Avatar" className="w-full h-full object-cover" />
        </div>
        
        <div className="flex-1">
          <textarea 
            placeholder={postType === 'poll' ? "Ask a question..." : "What's your take?"}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={handleExpand}
            onBlur={handleCollapse}
            className={`w-full bg-transparent border-none outline-none text-white placeholder-gray-500 resize-none transition-all ${isExpanded ? 'min-h-[100px]' : 'min-h-[40px] pt-2'}`}
            maxLength={2800}
          />
          
          <AnimatePresence>
            {isExpanded && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                {/* Poll Creator */}
                {postType === 'poll' && (
                  <div className="mt-4 p-4 border border-white/10 rounded-2xl bg-white/5 space-y-3">
                    {pollOptions.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input 
                          type="text"
                          value={opt}
                          onChange={(e) => handlePollOptionChange(i, e.target.value)}
                          placeholder={`Option ${i + 1}${i > 1 ? ' (optional)' : ''}`}
                          className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-[#e50914]"
                          maxLength={100}
                        />
                        {pollOptions.length > 2 && i < pollOptions.length - (pollOptions[pollOptions.length-1] === '' ? 1 : 0) && (
                          <button onClick={() => removePollOption(i)} className="p-2 text-gray-500 hover:text-red-500">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-2 border-t border-white/10">
                      <span className="text-sm text-gray-400">Poll length:</span>
                      <select 
                        value={pollDays} 
                        onChange={(e) => setPollDays(parseInt(e.target.value))}
                        className="bg-black border border-white/10 rounded-lg px-3 py-1 text-sm text-white outline-none"
                      >
                        <option value={1}>1 Day</option>
                        <option value={3}>3 Days</option>
                        <option value={7}>7 Days</option>
                      </select>
                    </div>
                  </div>
                )}
                
                {/* Movie Search UI */}
                {showMovieSearch && !selectedMovie && (
                  <div className="mt-4 p-4 border border-white/10 rounded-2xl bg-white/5 space-y-3">
                    <input
                      autoFocus
                      value={movieQuery}
                      onChange={(e) => {
                        setMovieQuery(e.target.value);
                        searchMovies(e.target.value);
                      }}
                      placeholder="Search a movie or TV show..."
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-[#e50914]"
                    />
                    {searchingMovies && <div className="text-xs text-gray-500">Searching...</div>}
                    {movieResults.length > 0 && (
                      <div className="space-y-1 mt-2">
                        {movieResults.map(movie => (
                          <div 
                            key={movie.id} 
                            onClick={() => { setSelectedMovie(movie); setShowMovieSearch(false); setMovieResults([]); setMovieQuery(''); }}
                            className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-xl cursor-pointer transition-colors"
                          >
                            {movie.poster_path ? (
                              <img src={`/tmdb-proxy/w92${movie.poster_path}`} className="w-8 h-12 rounded object-cover" />
                            ) : (
                              <div className="w-8 h-12 bg-gray-800 rounded flex items-center justify-center"><Film className="w-4 h-4 text-gray-500" /></div>
                            )}
                            <div>
                              <p className="text-sm font-bold">{movie.title || movie.name}</p>
                              <p className="text-xs text-gray-400 capitalize">{movie.media_type}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Selected Movie Preview */}
                {selectedMovie && (
                  <div className="mt-4 p-3 border border-[#e50914]/30 bg-[#e50914]/10 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {selectedMovie.poster_path && <img src={`/tmdb-proxy/w92${selectedMovie.poster_path}`} className="w-10 h-14 rounded object-cover" />}
                      <div>
                        <p className="text-sm font-bold text-white">{selectedMovie.title || selectedMovie.name}</p>
                        <p className="text-xs text-gray-400 capitalize">Attached {selectedMovie.media_type}</p>
                      </div>
                    </div>
                    <button onClick={() => setSelectedMovie(null)} className="p-2 hover:bg-black/40 rounded-full transition-colors text-gray-400 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
                
                <div className="border-t border-white/10 mt-4 pt-3 flex justify-between items-center">
                  <div className="flex gap-1 text-[#e50914]">
                    <button 
                      onClick={() => setPostType('text')} 
                      className={`p-2 rounded-full transition-colors ${postType === 'text' ? 'bg-[#e50914]/20' : 'hover:bg-white/10 text-gray-400 hover:text-[#e50914]'}`}
                      title="Media"
                    >
                      <ImageIcon className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setShowMovieSearch(!showMovieSearch)}
                      className={`p-2 rounded-full transition-colors ${showMovieSearch || selectedMovie ? 'bg-[#e50914]/20 text-[#e50914]' : 'hover:bg-white/10 text-gray-400 hover:text-[#e50914]'}`}
                      title="Attach Movie"
                    >
                      <Film className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setPostType(postType === 'poll' ? 'text' : 'poll')}
                      className={`p-2 rounded-full transition-colors ${postType === 'poll' ? 'bg-[#e50914]/20' : 'hover:bg-white/10 text-gray-400 hover:text-[#e50914]'}`}
                      title="Create Poll"
                    >
                      <BarChart2 className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">{content.length}/2800</span>
                    <button 
                      onClick={handleSubmit}
                      disabled={isSubmitting || (!content.trim() && postType === 'text' && !selectedMovie)}
                      className="bg-[#e50914] hover:bg-[#b81d24] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-1.5 px-5 rounded-full transition-colors flex items-center gap-2"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
