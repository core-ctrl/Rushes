import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Repeat2, Share, Bookmark, MoreHorizontal, AlertTriangle, Trash2, Flag, Ban, Edit3, Clock, Image as ImageIcon, Play, Star } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { toast } from '../ui/Toaster';

export default function PostCard({ post, onLike, onComment, onRepost, onSave, onDelete, onReport, onVote, onShare, currentUser }) {
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [isSaved, setIsSaved] = useState(post.isSaved || false);
  const [saveCount, setSaveCount] = useState(post.saveCount || 0);
  const [showMenu, setShowMenu] = useState(false);
  const [showSpoiler, setShowSpoiler] = useState(!post.isSpoiler);
  const [likeAnimation, setLikeAnimation] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLocalDeleted, setIsLocalDeleted] = useState(false);

  const isAuthor = currentUser?.id === post.authorId;

  const handleLike = async (e) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    setLikeAnimation(!isLiked);
    if (!isLiked) setTimeout(() => setLikeAnimation(false), 1000);
    
    try {
      await onLike(post.id);
    } catch (err) {
      // Revert on error
      setIsLiked(isLiked);
      setLikeCount(likeCount);
    }
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    setIsSaved(!isSaved);
    setSaveCount(isSaved ? saveCount - 1 : saveCount + 1);
    
    try {
      await onSave(post.id);
    } catch (err) {
      setIsSaved(isSaved);
      setSaveCount(saveCount);
    }
  };

  const renderMedia = () => {
    if (!post.media || post.media.length === 0) return null;
    
    const count = post.media.length;
    const gridClass = 
      count === 1 ? 'grid-cols-1' :
      count === 2 ? 'grid-cols-2' :
      count === 3 ? 'grid-cols-2' : 'grid-cols-2';

    return (
      <div className={`grid gap-1 mt-3 rounded-2xl overflow-hidden ${gridClass}`}>
        {post.media.slice(0, 4).map((m, i) => (
          <div key={i} className={`relative bg-gray-900 ${count === 3 && i === 0 ? 'row-span-2 col-span-1' : ''} ${count === 1 ? 'aspect-video' : 'aspect-square'}`}>
            {m.type === 'video' ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <video src={m.url} className="object-cover w-full h-full opacity-90" />
                <div className="absolute bg-black/50 rounded-full p-3 pointer-events-none">
                  <Play className="w-8 h-8 text-white fill-white" />
                </div>
              </div>
            ) : (
              <img src={m.url} alt="Post media" className="object-cover w-full h-full hover:scale-105 transition-transform duration-500" />
            )}
          </div>
        ))}
      </div>
    );
  };

  const handleConfirmDelete = async () => {
    setShowDeleteConfirm(false);
    try {
      await fetch(`/api/posts/${post.id}`, { 
        method: 'DELETE', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ softDelete: true })
      });
      setIsLocalDeleted(true);
      toast({ type: 'success', message: 'Post deleted successfully.' });
      if (onDelete) onDelete(post.id, true);
    } catch (err) {
      toast({ type: 'error', message: 'Failed to delete post.' });
    }
  };

  const handleSaveEdit = async () => {
    try {
      await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent })
      });
      setIsEditing(false);
      post.content = editContent; // optimistic local update
      toast({ type: 'success', message: 'Post updated.' });
    } catch (err) {
      toast({ type: 'error', message: 'Failed to update post.' });
    }
  };

  if (isLocalDeleted) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-black/40 backdrop-blur-md border border-white/5 rounded-3xl p-5 mb-4 hover:bg-black/60 transition-colors"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <Link href={`/user/${post.authorCache?.username}`}>
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800">
              <img src={post.authorCache?.avatar || '/default-avatar.png'} alt={post.authorCache?.username} className="w-full h-full object-cover" />
            </div>
          </Link>
          <div>
            <Link href={`/user/${post.authorCache?.username}`} className="font-bold text-white hover:underline flex items-center gap-1">
              {post.authorCache?.displayName || post.authorCache?.username}
              {post.isPro && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
            </Link>
            <div className="flex items-center text-xs text-gray-500 gap-2">
              <span>@{post.authorCache?.username}</span>
              <span>·</span>
              <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
              {post.visibility !== 'public' && (
                <>
                  <span>·</span>
                  <span className="capitalize">{post.visibility}</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Menu */}
        <div className="relative">
          <button 
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
          
          <AnimatePresence>
            {showMenu && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 top-10 w-48 bg-gray-900 border border-white/10 rounded-xl shadow-xl z-10 overflow-hidden"
              >
                {isAuthor ? (
                  <>
                    <button 
                      onClick={() => { setIsEditing(true); setShowMenu(false); }}
                      className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2"
                    >
                      <Edit3 className="w-4 h-4" /> Edit Post
                    </button>
                    <button 
                      onClick={() => { setShowDeleteConfirm(true); setShowMenu(false); }}
                      className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-white/5 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" /> Delete Post
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => { onReport(post.id); setShowMenu(false); }}
                      className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2"
                    >
                      <Flag className="w-4 h-4" /> Report Post
                    </button>
                    <button className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2">
                      <Ban className="w-4 h-4" /> Block @{post.authorCache?.username}
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        {isEditing ? (
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full bg-transparent text-white resize-none outline-none min-h-[80px]"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-2">
              <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-sm rounded-lg hover:bg-white/10 text-gray-300">Cancel</button>
              <button onClick={handleSaveEdit} className="px-3 py-1.5 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium">Save Changes</button>
            </div>
          </div>
        ) : post.isSpoiler && !showSpoiler ? (
          <div className="relative w-full h-32 rounded-xl overflow-hidden cursor-pointer" onClick={() => setShowSpoiler(true)}>
            <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-xl flex flex-col items-center justify-center border border-white/5">
              <AlertTriangle className="w-8 h-8 text-yellow-500 mb-2" />
              <span className="text-white font-medium">Spoiler Content</span>
              <span className="text-xs text-gray-400 mt-1">Click to reveal</span>
            </div>
            {/* Blurred preview behind */}
            <div className="w-full h-full opacity-30 blur-md pointer-events-none p-4">
               {post.content}
            </div>
          </div>
        ) : (
          <div className="text-[15px] leading-relaxed text-gray-100 whitespace-pre-wrap">
            {post.content}
            {post.mood && (
              <span className="inline-block ml-2 px-2 py-0.5 bg-white/5 rounded-full text-xs text-gray-400 border border-white/5">
                Feeling: {post.mood}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Media & Polls (only show if spoiler revealed or not a spoiler) */}
      {(showSpoiler || !post.isSpoiler) && (
        <>
          {renderMedia()}
          {post.postType === 'poll' && post.poll && (
            <div className="mt-3 bg-white/5 border border-white/5 rounded-2xl p-4">
              <h4 className="font-bold mb-3">{post.poll.question}</h4>
              <div className="space-y-2">
                {post.poll.options.map((opt, i) => {
                  const percent = post.poll.totalVotes > 0 ? Math.round((opt.votes.length / post.poll.totalVotes) * 100) : 0;
                  const hasVoted = opt.votes.includes(currentUser?.id);
                  return (
                    <div key={i} onClick={() => onVote && !hasVoted && onVote(post.id, i)} className={`relative h-10 rounded-xl overflow-hidden bg-white/5 flex items-center px-4 transition-colors ${!hasVoted ? 'cursor-pointer hover:bg-white/10' : ''}`}>
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        className={`absolute left-0 top-0 bottom-0 ${hasVoted ? 'bg-[#e50914]/40' : 'bg-white/10'}`}
                      />
                      <div className="relative flex justify-between w-full z-10 font-medium">
                        <span className={hasVoted ? 'text-white' : 'text-gray-300'}>{opt.text}</span>
                        <span className={hasVoted ? 'text-white font-bold' : 'text-gray-400'}>{percent}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 text-xs text-gray-500">
                {post.poll.totalVotes} votes · {post.poll.expiresAt && new Date(post.poll.expiresAt) < new Date() ? 'Final results' : 'Poll active'}
              </div>
            </div>
          )}
        </>
      )}

      {/* Action Bar */}
      <div className="flex items-center justify-between mt-4 text-gray-400 pt-3 border-t border-white/5">
        <button onClick={handleLike} className="group flex items-center gap-2 hover:text-[#e50914] transition-colors relative">
          <div className="p-2 rounded-full group-hover:bg-[#e50914]/10 transition-colors relative">
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-[#e50914] text-[#e50914]' : ''}`} />
            {likeAnimation && (
              <motion.div
                initial={{ scale: 1, opacity: 1 }}
                animate={{ scale: 2, opacity: 0 }}
                className="absolute inset-0 m-auto text-[#e50914]"
              >
                <Heart className="w-5 h-5 fill-[#e50914]" />
              </motion.div>
            )}
          </div>
          <span className={`text-sm ${isLiked ? 'text-[#e50914]' : ''}`}>{likeCount || ''}</span>
        </button>

        <button onClick={() => onComment && onComment(post.id)} className="group flex items-center gap-2 hover:text-blue-400 transition-colors">
          <div className="p-2 rounded-full group-hover:bg-blue-400/10 transition-colors">
            <MessageCircle className="w-5 h-5" />
          </div>
          <span className="text-sm">{post.commentCount || ''}</span>
        </button>

        <button onClick={() => onRepost && onRepost(post.id)} className="group flex items-center gap-2 hover:text-green-400 transition-colors">
          <div className="p-2 rounded-full group-hover:bg-green-400/10 transition-colors">
            <Repeat2 className="w-5 h-5" />
          </div>
          <span className="text-sm">{post.stats?.reposts || ''}</span>
        </button>

        <div className="flex items-center gap-1">
          <button onClick={handleSave} className="group p-2 rounded-full hover:bg-white/10 hover:text-white transition-colors">
            <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-white text-white' : ''}`} />
          </button>
          <button onClick={() => onShare && onShare(post.id)} className="group p-2 rounded-full hover:bg-white/10 hover:text-white transition-colors">
            <Share className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white mb-2">Delete Post?</h3>
              <p className="text-gray-400 mb-6 text-sm">Are you sure you want to delete this post? This will submit a deletion request.</p>
              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => setShowDeleteConfirm(false)} 
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmDelete} 
                  className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
