import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Eye, EyeOff, Image as ImageIcon, Loader2, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import api from '../../lib/axios';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import { TMDB_BLUR_DATA_URL } from '../../lib/imageBlur';
import { toast } from '../ui/Toaster';

export default function CreateTake({ onCreated }) {
  const currentUser = useSelector(selectUser);
  const [content, setContent] = useState('');
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [rating, setRating] = useState(0);
  const [mood, setMood] = useState('');
  const [privacy, setPrivacy] = useState('public');
  const [spoiler, setSpoiler] = useState(false);
  const [movieQuery, setMovieQuery] = useState('');
  const [movieResults, setMovieResults] = useState([]);
  const [showMovieSearch, setShowMovieSearch] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionResults, setMentionResults] = useState([]);
  const [showMentions, setShowMentions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchingMovies, setSearchingMovies] = useState(false);
  
  // Media Upload State
  const [mediaUrl, setMediaUrl] = useState(null);
  const [mediaType, setMediaType] = useState('none');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const fileInputRef = useRef(null);

  const textareaRef = useRef(null);
  const movieSearchTimer = useRef(null);
  const mentionSearchTimer = useRef(null);

  if (!currentUser) return null;

  const extractMentions = (text) => {
    const matches = text.match(/@([a-zA-Z0-9_]+)/g) || [];
    return matches.map((m) => m.slice(1));
  };

  const handleContentChange = (e) => {
    const val = e.target.value;
    setContent(val);

    const words = val.split(' ');
    const lastWord = words[words.length - 1];
    if (lastWord.startsWith('@') && lastWord.length > 1) {
      const query = lastWord.slice(1);
      setMentionQuery(query);
      setShowMentions(true);
      if (mentionSearchTimer.current) clearTimeout(mentionSearchTimer.current);
      mentionSearchTimer.current = setTimeout(async () => {
        try {
          const { data } = await api.get(`/api/users/search?q=${encodeURIComponent(query)}`);
          setMentionResults(data.users?.slice(0, 5) || []);
        } catch {
          setMentionResults([]);
        }
      }, 300);
    } else {
      setShowMentions(false);
      setMentionResults([]);
    }
  };

  const insertMention = (username) => {
    const words = content.split(' ');
    words[words.length - 1] = `@${username} `;
    setContent(words.join(' '));
    setShowMentions(false);
    textareaRef.current?.focus();
  };

  const searchMovies = (q) => {
    if (movieSearchTimer.current) clearTimeout(movieSearchTimer.current);
    if (!q.trim()) {
      setMovieResults([]);
      setSearchingMovies(false);
      return;
    }
    setSearchingMovies(true);
    movieSearchTimer.current = setTimeout(async () => {
      try {
        const { data } = await axios.get(
          `https://api.themoviedb.org/3/search/multi?api_key=${process.env.NEXT_PUBLIC_TMDB_KEY}&query=${encodeURIComponent(q)}`
        );
        setMovieResults(data.results?.filter((r) => r.media_type !== 'person').slice(0, 5) || []);
      } catch (error) {
        console.error('Movie search error:', error);
        setMovieResults([]);
      } finally {
        setSearchingMovies(false);
      }
    }, 300);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (e.g. 10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({ type: 'error', message: 'File is too large. Max 10MB.' });
      return;
    }

    setUploadingMedia(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64data = reader.result;
        const fileType = file.type.startsWith('video/') ? 'video' : 'image';
        
        const { data } = await api.post('/api/takes/upload', {
          file: base64data,
          fileType
        });
        
        setMediaUrl(data.url);
        setMediaType(data.type);
      };
    } catch (err) {
      console.error(err);
      toast({ type: 'error', message: 'Failed to upload media.' });
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && !selectedMovie) return;
    setSubmitting(true);
    try {
      await api.post('/api/takes/create', {
        content,
        tmdbId: selectedMovie?.id,
        tmdbMediaType: selectedMovie?.media_type,
        movieTitle: selectedMovie?.title || selectedMovie?.name,
        moviePoster: selectedMovie?.poster_path,
        movieBackdrop: selectedMovie?.backdrop_path,
        rating,
        mood,
        spoiler,
        privacy,
        mentions: extractMentions(content),
        mediaUrl,
        attachmentType: mediaType,
      });
      setContent('');
      setSelectedMovie(null);
      setMediaUrl(null);
      setMediaType('none');
      setRating(0);
      setMood('');
      setPrivacy('public');
      setSpoiler(false);
      setMovieQuery('');
      setMovieResults([]);
      onCreated?.();
    } catch (e) {
      console.error(e);
      toast({ type: 'error', message: 'Failed to post your take. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const MOODS = [
    { key: 'loved', label: '❤️ Loved it' },
    { key: 'mid', label: '😐 Mid' },
    { key: 'skip', label: '👎 Skip it' },
    { key: 'underrated', label: '💎 Underrated' },
    { key: 'overhyped', label: '📢 Overhyped' },
  ];

  const charLimit = 280;
  const remaining = charLimit - content.length;

  return (
    <div className="border-b border-white/10 bg-black p-4">
      <div className="flex gap-3">
        <img
          src={currentUser?.avatar || '/avatar.svg'}
          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
        />

        <div className="flex-1">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              placeholder="What's your take? Tag @someone, attach a movie..."
              maxLength={charLimit}
              rows={3}
              className="w-full bg-transparent text-white placeholder-neutral-600 text-sm resize-none focus:outline-none leading-relaxed"
            />

            <AnimatePresence>
              {showMentions && mentionResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute top-full left-0 w-56 bg-neutral-800 border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50"
                >
                  {mentionResults.map((user) => (
                    <button
                      key={user._id}
                      type="button"
                      onClick={() => insertMention(user.username)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors text-left"
                    >
                      <img src={user.avatar || '/avatar.svg'} className="w-6 h-6 rounded-full object-cover" />
                      <div>
                        <p className="text-xs font-medium">{user.displayName}</p>
                        <p className="text-xs text-neutral-400">@{user.username}</p>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Media Preview */}
          {mediaUrl && (
            <div className="relative mb-3 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900 max-w-sm inline-block">
              {mediaType === 'video' ? (
                <video src={mediaUrl} controls className="w-full h-auto max-h-[300px] object-contain" />
              ) : (
                <img src={mediaUrl} alt="Upload preview" className="w-full h-auto max-h-[300px] object-contain" />
              )}
              <button
                type="button"
                onClick={() => { setMediaUrl(null); setMediaType('none'); }}
                className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white p-1 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {selectedMovie && (
            <div className="flex items-center gap-2 bg-neutral-800 rounded-xl p-2 mb-3">
              <img
                src={`https://image.tmdb.org/t/p/w92${selectedMovie.poster_path}`}
                className="w-8 h-12 rounded object-cover"
                alt={selectedMovie.title || selectedMovie.name}
              />
              <div className="flex-1">
                <p className="text-xs font-medium">{selectedMovie.title || selectedMovie.name}</p>
                <p className="text-xs text-neutral-400 capitalize">{selectedMovie.media_type}</p>
              </div>
              <button type="button" onClick={() => setSelectedMovie(null)} className="text-neutral-500 hover:text-white text-xs px-2">
                ✕
              </button>
            </div>
          )}

          {showMovieSearch && (
            <div className="mb-3">
              <input
                autoFocus
                value={movieQuery}
                onChange={(e) => {
                  setMovieQuery(e.target.value);
                  searchMovies(e.target.value);
                }}
                placeholder="Search a movie or series..."
                className="w-full bg-neutral-800 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-500"
              />
              {searchingMovies && (
                <div className="mt-1 flex items-center gap-2 px-3 py-2 text-xs text-neutral-400">
                  <div className="w-3 h-3 border border-neutral-500 border-t-transparent rounded-full animate-spin" />
                  Searching...
                </div>
              )}
              {movieResults.length > 0 && (
                <div className="mt-1 bg-neutral-800 border border-white/10 rounded-xl overflow-hidden">
                  {movieResults.map((movie) => (
                    <div
                      key={movie.id}
                      onClick={() => {
                        setSelectedMovie(movie);
                        setShowMovieSearch(false);
                        setMovieResults([]);
                        setMovieQuery('');
                      }}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <img src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`} className="w-6 h-9 rounded object-cover" alt={movie.title || movie.name} />
                      <div>
                        <p className="text-xs font-medium">{movie.title || movie.name}</p>
                        <p className="text-xs text-neutral-500 capitalize">{movie.media_type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedMovie && (
            <div className="flex items-center gap-1 mb-3">
              {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(rating === n ? 0 : n)}
                  className={`text-base transition-colors ${n <= rating ? 'text-amber-400' : 'text-neutral-700 hover:text-amber-300'}`}
                >
                  ★
                </button>
              ))}
              {rating > 0 && <span className="text-xs text-neutral-400 ml-1">{rating}/10</span>}
            </div>
          )}

          {selectedMovie && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {MOODS.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setMood(mood === m.key ? '' : m.key)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${mood === m.key ? 'bg-red-600 text-white' : 'bg-white/5 text-neutral-400 hover:bg-white/10'}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowMovieSearch(!showMovieSearch)}
                className={`p-2 rounded-lg text-xs transition-colors ${showMovieSearch ? 'bg-red-600/20 text-red-400' : 'text-neutral-500 hover:text-white hover:bg-white/5'}`}
                title="Attach a movie"
              >
                🎬
              </button>

              <button
                type="button"
                onClick={() => setSpoiler(!spoiler)}
                className={`px-2 py-1 rounded-lg text-xs transition-colors ${spoiler ? 'bg-amber-600/20 text-amber-400' : 'text-neutral-500 hover:text-white hover:bg-white/5'}`}
              >
                {spoiler ? '⚠️ Spoiler' : '👁️ Spoiler?'}
              </button>

              <button
                type="button"
                onClick={() => setPrivacy(privacy === 'public' ? 'followers' : 'public')}
                className={`px-2 py-1 rounded-lg text-xs transition-colors ${privacy === 'followers' ? 'bg-blue-600/20 text-blue-400' : 'text-neutral-500 hover:text-white hover:bg-white/5'}`}
                title={privacy === 'public' ? 'Public — everyone can see' : 'Followers only'}
              >
                {privacy === 'public' ? '🌍 Public' : '🔒 Followers'}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className={`text-xs ${remaining < 20 ? 'text-red-400' : 'text-neutral-600'}`}>
                {remaining}
              </span>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={(!content.trim() && !selectedMovie) || submitting || remaining < 0}
                className="bg-red-600 hover:bg-red-500 disabled:opacity-40 px-5 py-1.5 rounded-full text-sm font-bold transition-colors"
              >
                {submitting ? '...' : 'Rush it'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
