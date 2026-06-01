import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, AlertTriangle, MessageCircle, MoreHorizontal, Flag, Trash2, Edit2, Send } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';

import { formatDistanceToNow } from 'date-fns';
import { TMDB_BLUR_DATA_URL } from '../../lib/imageBlur';
import { UserIcon } from '@hugeicons/core-free-icons';
import AppIcon from '../AppIcon';
import VerifiedBadge from '../VerifiedBadge';
import ReportModal from '../ReportModal';
import { toast } from '../ui/Toaster';

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
                <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all">
                    {part}
                </a>
            );
        }
        const mentionParts = part.split(/(@[a-zA-Z0-9_]+)/g);
        return mentionParts.map((mPart, j) => {
            if (mPart.startsWith('@')) {
                return (
                    <Link key={`${i}-${j}`} href={`/u/${mPart.slice(1)}`} className="text-blue-400 hover:underline font-medium">
                        {mPart}
                    </Link>
                );
            }
            return <span key={`${i}-${j}`}>{mPart}</span>;
        });
    });
}

export default function TakeCard({ take, index, onTakeDeleted }) {
    const [likes, setLikes] = useState(take.likes || []);
    const [spoilerRevealed, setSpoilerRevealed] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(take.content);
    const [isSaving, setIsSaving] = useState(false);
    const [currentTake, setCurrentTake] = useState(take);

    // Comment state
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [postingComment, setPostingComment] = useState(false);
    const [replyCount, setReplyCount] = useState(take.replyCount || 0);

    const user = useSelector(selectUser);
    const isLiked = likes.includes(user?._id);
    const isOwn = user?._id === currentTake.userId;

    const takeId = currentTake.id || currentTake._id;
    const isLongContent = (currentTake.content?.length || 0) > 280;
    
    const createdAt = new Date(currentTake.createdAt);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - createdAt.getTime()) / 60000);
    const canEdit = isOwn && diffMins <= 15;

    const toggleLike = async () => {
        const previousLikes = [...likes];
        if (isLiked) {
            setLikes(likes.filter(id => id !== user?._id));
        } else {
            setLikes([...likes, user?._id]);
        }
        try {
            const response = await axios.post('/api/takes/like', {
                takeId: takeId,
                action: isLiked ? 'unlike' : 'like'
            });
            setLikes(response.data.likes);
        } catch (error) {
            setLikes(previousLikes);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this Take? This action cannot be undone.')) return;
        try {
            await axios.delete(`/api/takes/${takeId}`);
            toast({ type: 'success', message: 'Take deleted successfully' });
            if (onTakeDeleted) onTakeDeleted(takeId);
        } catch (err) {
            toast({ type: 'error', message: 'Failed to delete take' });
        }
    };

    const handleSaveEdit = async () => {
        if (!editContent.trim()) return;
        setIsSaving(true);
        try {
            const res = await axios.put(`/api/takes/${takeId}`, { content: editContent });
            setCurrentTake(res.data.take);
            setIsEditing(false);
            toast({ type: 'success', message: 'Take updated' });
        } catch (err) {
            toast({ type: 'error', message: err.response?.data?.error || 'Failed to edit' });
        } finally {
            setIsSaving(false);
        }
    };

    const toggleComments = async () => {
        const newState = !showComments;
        setShowComments(newState);
        if (newState && comments.length === 0) {
            setLoadingComments(true);
            try {
                const { data } = await axios.get(`/api/takes/${takeId}/comments`);
                setComments(data.comments || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingComments(false);
            }
        }
    };

    const handlePostComment = async () => {
        if (!commentText.trim() || postingComment) return;
        setPostingComment(true);
        try {
            const { data } = await axios.post(`/api/takes/${takeId}/comments`, { content: commentText });
            setComments(prev => [...prev, data.comment]);
            setCommentText('');
            setReplyCount(prev => prev + 1);
        } catch (err) {
            toast({ type: 'error', message: 'Failed to post reply' });
        } finally {
            setPostingComment(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            await axios.delete(`/api/takes/${takeId}/comments`, { data: { commentId } });
            setComments(prev => prev.filter(c => (c.id || c._id) !== commentId));
            setReplyCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            toast({ type: 'error', message: 'Failed to delete reply' });
        }
    };

    return (
        <>
        <article className="p-4 hover:bg-white/[0.02] transition-colors flex gap-3 sm:gap-4 relative group">
            {/* Left: Avatar */}
            <div className="flex-shrink-0 pt-1">
                {currentTake.avatar ? (
                    <img src={currentTake.avatar} alt={`@${currentTake.username}`} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover" />
                ) : (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-neutral-800 flex items-center justify-center">
                        <AppIcon icon={UserIcon} size={20} className="text-neutral-500" />
                    </div>
                )}
            </div>

            {/* Right: Content */}
            <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 min-w-0 flex-wrap sm:flex-nowrap">
                        <Link href={`/u/${currentTake.username}`} className="font-bold text-white hover:underline truncate">
                            {currentTake.displayName || currentTake.username}
                        </Link>
                        {currentTake.isVerified && <VerifiedBadge size={14} />}
                        <span className="text-neutral-500 truncate text-sm">@{currentTake.username}</span>
                        <span className="text-neutral-500 text-sm hidden sm:inline">·</span>
                        <span className="text-neutral-500 text-sm hover:underline shrink-0">
                            {formatDistanceToNow(new Date(currentTake.createdAt), { addSuffix: true })}
                        </span>
                    </div>
                    
                    {/* 3-dot menu */}
                    <div className="relative shrink-0 ml-2">
                        <button onClick={() => setShowMenu(!showMenu)} className="p-1.5 rounded-full text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                        <AnimatePresence>
                            {showMenu && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="absolute right-0 top-8 w-48 bg-black border border-neutral-800 rounded-xl shadow-2xl overflow-hidden z-50"
                                >
                                    {isOwn ? (
                                        <>
                                            <button 
                                                disabled={!canEdit}
                                                onClick={() => { setIsEditing(true); setShowMenu(false); }}
                                                className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-left hover:bg-white/5 transition-colors text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Edit2 className="w-4 h-4" /> {canEdit ? "Edit Take" : "Edit window expired"}
                                            </button>
                                            <button onClick={() => { handleDelete(); setShowMenu(false); }} className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-left hover:bg-white/5 transition-colors text-red-500">
                                                <Trash2 className="w-4 h-4" /> Delete Take
                                            </button>
                                        </>
                                    ) : (
                                        user && (
                                            <button onClick={() => { setShowReport(true); setShowMenu(false); }} className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-left hover:bg-white/5 transition-colors text-red-500">
                                                <Flag className="w-4 h-4" /> Report Take
                                            </button>
                                        )
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Body Text */}
                <div className="mb-2.5">
                    {currentTake.spoiler && !spoilerRevealed && !isEditing ? (
                        <button onClick={() => setSpoilerRevealed(true)} className="w-full text-left py-2 px-3 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center gap-2 hover:bg-neutral-800 transition-colors text-sm text-neutral-400">
                            <AlertTriangle className="w-4 h-4 text-amber-500" /> Spoiler warning! Tap to reveal.
                        </button>
                    ) : isEditing ? (
                        <div className="bg-neutral-900 rounded-xl overflow-hidden border border-neutral-700 focus-within:border-red-500">
                            <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full bg-transparent text-white p-3 text-[15px] resize-none outline-none min-h-[100px]"
                                maxLength={280}
                            />
                            <div className="bg-neutral-800/50 p-2 flex justify-end gap-2 border-t border-neutral-800">
                                <button onClick={() => setIsEditing(false)} className="px-4 py-1.5 rounded-full text-sm font-bold text-white hover:bg-white/10 transition-colors">Cancel</button>
                                <button onClick={handleSaveEdit} disabled={isSaving || !editContent.trim()} className="px-4 py-1.5 rounded-full text-sm font-bold bg-white text-black hover:bg-neutral-200 transition-colors disabled:opacity-50">
                                    {isSaving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="relative">
                            <p className={`text-[15px] leading-snug text-neutral-100 whitespace-pre-wrap ${isLongContent && !expanded ? 'max-h-24 overflow-hidden' : ''}`}>
                                {renderContent(currentTake.content)}
                            </p>
                            {isLongContent && !expanded && (
                                <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black to-transparent" />
                            )}
                            {isLongContent && (
                                <button onClick={() => setExpanded(!expanded)} className="text-sm text-red-500 hover:underline mt-1">
                                    {expanded ? 'Show less' : 'Show more'}
                                </button>
                            )}
                        </div>
                    )}
                    {currentTake.isEdited && !isEditing && (
                        <p className="text-[11px] text-neutral-500 mt-1">*edited</p>
                    )}
                </div>

                {/* Movie Attachment (Quoted Movie) */}
                {currentTake.movieTitle && !isEditing && (
                    <Link href={currentTake.mediaType === 'tv' ? `/series/${currentTake.tmdbId}` : `/movies/${currentTake.tmdbId}`}>
                        <div className="mb-3 flex items-stretch border border-neutral-800 rounded-xl overflow-hidden hover:bg-white/[0.03] transition-colors max-w-lg cursor-pointer">
                            {currentTake.moviePoster && (
                                <div className="w-20 sm:w-24 shrink-0 bg-neutral-900 relative">
                                    <Image src={`https://image.tmdb.org/t/p/w200${currentTake.moviePoster}`} alt={currentTake.movieTitle} fill className="object-cover" />
                                </div>
                            )}
                            <div className="p-3 flex-1 min-w-0 flex flex-col justify-center">
                                <h4 className="font-bold text-white text-sm truncate">{currentTake.movieTitle}</h4>
                                <div className="flex items-center gap-2 text-xs text-neutral-400 mt-1">
                                    {currentTake.rating && <span className="text-amber-400 font-mono">★ {currentTake.rating}</span>}
                                    {currentTake.mood && <span>{MOOD_EMOJIS[currentTake.mood] || ''} Mood</span>}
                                </div>
                            </div>
                        </div>
                    </Link>
                )}

                {/* Action Buttons */}
                {!isEditing && (
                    <div className="flex items-center gap-6 mt-1 text-neutral-500">
                        <button onClick={toggleComments} className="group flex items-center gap-1.5 transition-colors">
                            <div className={`p-2 rounded-full transition-colors ${showComments ? 'text-blue-500 bg-blue-500/10' : 'group-hover:bg-blue-500/10 group-hover:text-blue-500'}`}>
                                <MessageCircle className="w-[18px] h-[18px]" />
                            </div>
                            <span className={`text-sm ${showComments ? 'text-blue-500' : 'group-hover:text-blue-500'}`}>{replyCount}</span>
                        </button>

                        <button onClick={toggleLike} className="group flex items-center gap-1.5 transition-colors">
                            <div className={`p-2 rounded-full transition-colors ${isLiked ? 'text-red-500' : 'group-hover:bg-red-500/10 group-hover:text-red-500'}`}>
                                <Heart className={`w-[18px] h-[18px] ${isLiked ? 'fill-current' : ''}`} />
                            </div>
                            <span className={`text-sm ${isLiked ? 'text-red-500' : 'group-hover:text-red-500'}`}>{likes.length || 0}</span>
                        </button>
                    </div>
                )}

                {/* Inline Comments Section */}
                <AnimatePresence>
                    {showComments && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 border-t border-white/5 pt-3 overflow-hidden"
                        >
                            {/* Comment input */}
                            {user && (
                                <div className="flex items-center gap-2 mb-3">
                                    <img src={user.avatar || '/avatar.svg'} className="w-7 h-7 rounded-full object-cover shrink-0" />
                                    <div className="flex-1 flex items-center bg-neutral-900 rounded-full border border-neutral-800 focus-within:border-blue-500 transition-colors">
                                        <input
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                                            placeholder="Post your reply"
                                            maxLength={280}
                                            className="flex-1 bg-transparent text-white text-sm px-3 py-2 outline-none placeholder-neutral-600"
                                        />
                                        <button
                                            onClick={handlePostComment}
                                            disabled={!commentText.trim() || postingComment}
                                            className="p-2 text-blue-500 hover:text-blue-400 disabled:opacity-30 transition-colors"
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Loading */}
                            {loadingComments && (
                                <div className="flex items-center gap-2 py-3 text-neutral-500 text-xs">
                                    <div className="w-3 h-3 border border-neutral-600 border-t-transparent rounded-full animate-spin" />
                                    Loading replies...
                                </div>
                            )}

                            {/* Comments list */}
                            {!loadingComments && comments.length === 0 && (
                                <p className="text-xs text-neutral-600 py-2">No replies yet. Be the first!</p>
                            )}

                            {comments.map((comment) => {
                                const cId = comment.id || comment._id;
                                const isOwnComment = user?._id === comment.authorId;
                                return (
                                    <div key={cId} className="flex gap-2 py-2 group/comment">
                                        <img
                                            src={comment.authorCache?.avatar || '/avatar.svg'}
                                            className="w-6 h-6 rounded-full object-cover mt-0.5 shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-bold text-white text-xs">{comment.authorCache?.displayName || 'User'}</span>
                                                <span className="text-neutral-500 text-xs">@{comment.authorCache?.username || 'user'}</span>
                                                <span className="text-neutral-600 text-xs">·</span>
                                                <span className="text-neutral-600 text-xs">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
                                                {isOwnComment && (
                                                    <button
                                                        onClick={() => handleDeleteComment(cId)}
                                                        className="ml-auto opacity-0 group-hover/comment:opacity-100 p-1 rounded text-neutral-600 hover:text-red-500 transition-all"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-sm text-neutral-200 whitespace-pre-wrap mt-0.5">{comment.content}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </article>

        <ReportModal
            open={showReport}
            onClose={() => setShowReport(false)}
            targetUsername={currentTake.username}
            targetId={takeId}
            targetType="take"
        />
        </>
    );
}
