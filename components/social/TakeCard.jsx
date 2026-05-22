import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, AlertTriangle, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import FriendActivity from './FriendActivity';
import { formatDistanceToNow } from 'date-fns';
import { TMDB_BLUR_DATA_URL } from '../../lib/imageBlur';
import { UserIcon } from '@hugeicons/core-free-icons';
import AppIcon from '../AppIcon';

const MOOD_EMOJIS = {
    loved: '❤️',
    mid: '😐',
    skip: '👎',
    underrated: '💎',
    overhyped: '📢'
};

function renderContent(content) {
    if (!content) return null;
    
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlRegex);
    
    return parts.map((part, i) => {
        if (part.match(urlRegex)) {
            return (
                <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-red-400 hover:text-red-300 transition-colors underline break-all">
                    {part}
                </a>
            );
        }
        
        const mentionParts = part.split(/(@[a-zA-Z0-9_]+)/g);
        return mentionParts.map((mPart, j) => {
            if (mPart.startsWith('@')) {
                const username = mPart.slice(1);
                return (
                    <Link key={`${i}-${j}`} href={`/u/${username}`} className="text-red-400 hover:text-red-300 font-medium transition-colors">
                        {mPart}
                    </Link>
                );
            }
            return <span key={`${i}-${j}`}>{mPart}</span>;
        });
    });
}

export default function TakeCard({ take, index }) {
    const [likes, setLikes] = useState(take.likes || []);
    const [spoilerRevealed, setSpoilerRevealed] = useState(false);
    const [activity, setActivity] = useState([]);
    const user = useSelector(selectUser);
    const isLiked = likes.includes(user?._id);
    const isOwn = user?._id === (take.userId || take.user_id);

    const takeId = take.id || take._id;
    const tmdbId = take.tmdbId || take.tmdb_id;
    const movieTitle = take.movieTitle || take.movie_title;
    const movieBanner = take.movieBackdrop || take.movie_backdrop || take.moviePoster || take.movie_poster;
    const createdAt = take.createdAt || take.created_at;

    const toggleLike = async () => {
        try {
            const response = await axios.post('/api/takes/like', {
                takeId: takeId,
                action: isLiked ? 'unlike' : 'like'
            });
            setLikes(response.data.likes);
        } catch (error) {
            console.error('Like error:', error);
        }
    };

    const loadActivity = async () => {
        if (!tmdbId) return;
        try {
            const { data } = await axios.post('/api/social/friend-activity', {
                tmdbIds: [tmdbId]
            });
            setActivity(data.activity[tmdbId] || []);
        } catch (error) {
            console.error('Activity error:', error);
        }
    };

    return (
        <motion.article
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group bg-neutral-900/80 hover:bg-neutral-900 border border-white/5 hover:border-white/10 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300"
        >
            {/* Header - Movie Banner */}
            {movieTitle && (
                <div className="relative h-28 overflow-hidden bg-gradient-to-br from-neutral-900 to-neutral-800">
                    <Image
                        src={`https://image.tmdb.org/t/p/w500${movieBanner}`}
                        alt={movieTitle}
                        width={780}
                        height={440}
                        className="w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-500 opacity-70 group-hover:opacity-90"
                        placeholder="blur"
                        blurDataURL={TMDB_BLUR_DATA_URL}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent/50 to-transparent" />

                    {/* Movie info overlay */}
                    <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="font-bold text-white text-base line-clamp-1 drop-shadow-lg mb-1">
                            {movieTitle}
                        </h3>
                        <div className="flex items-center gap-3 text-sm opacity-90">
                            {take.rating && (
                                <span className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-2 py-0.5 rounded-full text-amber-300 font-mono text-xs">
                                    ★ {take.rating}
                                </span>
                            )}
                            {take.mood && (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-white font-medium text-xs">
                                    {MOOD_EMOJIS[take.mood] || '⭐'}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="p-5">
                {/* User header */}
                <div className="flex items-center gap-3 mb-4">
                    {take.avatar ? (
                        <img
                            src={take.avatar}
                            alt={`@${take.username}`}
                            className="w-9 h-9 rounded-full object-cover ring-2 ring-neutral-700/50 shadow-lg"
                        />
                    ) : (
                        <div className="w-9 h-9 rounded-full bg-neutral-800 flex items-center justify-center ring-2 ring-neutral-700/50 shadow-lg">
                            <AppIcon icon={UserIcon} size={18} className="text-neutral-500" />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-white truncate">@{take.username}</p>
                        <p className="text-xs text-neutral-500">
                            {createdAt ? formatDistanceToNow(new Date(createdAt), { addSuffix: true }) : 'Just now'}
                        </p>
                    </div>
                </div>

                {/* Friend activity */}
                {!isOwn && (
                    <FriendActivity activity={activity} />
                )}

                {/* Take content */}
                <div className="mb-4">
                    {take.spoiler && !spoilerRevealed ? (
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSpoilerRevealed(true)}
                            className="group/spoiler flex items-center gap-2 w-full p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/30 backdrop-blur-sm text-left transition-all hover:from-amber-500/20"
                        >
                            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                            <span className="text-sm font-medium text-neutral-200">
                                🔒 Spoiler hidden — tap to reveal
                            </span>
                        </motion.button>
                    ) : (
                        <p className="text-sm leading-relaxed text-neutral-100 whitespace-pre-wrap max-h-24 overflow-hidden">
                            {renderContent(take.content) || 'Quick take!'}
                        </p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 pt-1 border-t border-white/5">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={toggleLike}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 group/like ${isLiked
                            ? 'bg-red-600/20 text-red-300 border border-red-500/30 hover:bg-red-600/30 shadow-glow-red'
                            : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5 border border-transparent group-hover/like:border-neutral-500/30'
                            }`}
                    >
                        <Heart className={`w-4.5 h-4.5 transition-transform ${isLiked ? 'fill-red-400 scale-110' : ''}`} />
                        <span>{likes.length || 0}</span>
                    </motion.button>

                    <Link href={`/take/${takeId}`} className="text-xs text-neutral-500 ml-auto flex items-center gap-1 hover:text-white transition-colors">
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Reply</span>
                    </Link>
                </div>
            </div>
        </motion.article>
    );
}
