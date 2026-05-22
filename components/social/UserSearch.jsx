import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UserPlus, UserCheck, User } from 'lucide-react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import debounce from 'lodash.debounce';

export default function UserSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [following, setFollowing] = useState({});
    const user = useSelector(selectUser);

    const searchUsers = useCallback(debounce(async (q) => {
        if (q.length < 1) {
            setResults([]);
            return;
        }
        setLoading(true);
        try {
            const { data } = await axios.get(`/api/users/search?q=${encodeURIComponent(q)}`);
            console.log('UserSearch results:', data.users);
            setResults(data.users || []);
        } catch (error) {
            console.error('Search error:', error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, 300), []);

    const handleFollow = async (userId) => {
        try {
            const action = following[userId] ? 'unfollow' : 'follow';
            await axios.post('/api/users/follow', { targetUserId: userId, action });
            setFollowing(prev => ({ ...prev, [userId]: action === 'follow' }));
        } catch (error) {
            console.error('Follow error:', error);
        }
    };

    useEffect(() => {
        searchUsers(query);
    }, [query, searchUsers]);

    return (
        <div className="relative w-full max-w-md">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                    type="text"
                    placeholder="Search people by username..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all"
                />
            </div>

            <AnimatePresence>
                {(results.length > 0 || loading) && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        className="absolute top-full mt-2 w-full bg-neutral-900/95 border border-white/10 rounded-2xl backdrop-blur-xl shadow-2xl z-50 overflow-hidden"
                    >
                        {loading && (
                            <div className="p-4 text-center text-sm text-neutral-500">
                                Searching...
                            </div>
                        )}
                        {results.map((u) => {
                            const isCurrentUser = user?._id === u._id;
                            const isFollowing = following[u._id];
                            return (
                                <motion.div
                                    key={u._id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-3 p-4 hover:bg-white/5 transition-all cursor-pointer"
                                    onClick={() => !isCurrentUser && handleFollow(u._id)}
                                >
                                    <img
                                        src={u.avatar || '/default-avatar.png'}
                                        alt={`@${u.username}`}
                                        className="w-10 h-10 rounded-full object-cover ring-1 ring-white/20"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm text-white truncate">@{u.username}</p>
                                        <p className="text-xs text-neutral-400 truncate">
                                            {u.bio || `${(u.tasteProfile?.totalWatched || 0)} movies watched`}
                                        </p>
                                    </div>
                                    {!isCurrentUser && (
                                        <motion.button
                                            whileTap={{ scale: 0.98 }}
                                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isFollowing
                                                ? 'bg-neutral-700/50 text-neutral-300 hover:bg-neutral-600/50 border border-neutral-500/50'
                                                : 'bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-500 hover:to-red-600 shadow-glow-red'
                                                }`}
                                        >
                                            {isFollowing ? (
                                                <>
                                                    <UserCheck className="w-3 h-3" />
                                                    Following
                                                </>
                                            ) : (
                                                <>
                                                    <UserPlus className="w-3 h-3" />
                                                    Follow
                                                </>
                                            )}
                                        </motion.button>
                                    )}
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
