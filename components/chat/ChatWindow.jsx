import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Film, MessageCircle } from 'lucide-react';
import Image from 'next/image';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import { formatDistanceToNow } from 'date-fns';
import { TMDB_BLUR_DATA_URL } from '../../lib/imageBlur';
import { supabase } from '../../lib/supabase';
import api from '../../lib/axios';

function normalizeMessage(message) {
  return {
    ...message,
    _id: message._id || message.id || `${message.senderId}-${message.createdAt}`,
    createdAt: message.createdAt || message.created_at || new Date().toISOString(),
  };
}

export default function ChatWindow({ otherUser, onClose, conversationId }) {
    const user = useSelector(selectUser);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(false);
    const [lastSeen, setLastSeen] = useState(null);
    const bottomRef = useRef(null);
    const channelRef = useRef(null);

    const currentUserId = user?.id || user?._id;
    const otherUserId = otherUser?.id || otherUser?._id;

    if (!user || !otherUser || !conversationId) return null;

    // Fetch real presence from Supabase
    useEffect(() => {
        if (!otherUserId) return;
        const fetchPresence = async () => {
            try {
                const res = await fetch(`/api/presence/${otherUserId}`);
                if (res.ok) {
                    const data = await res.json();
                    setIsOnline(Boolean(data.isOnline));
                    setLastSeen(data.lastSeen);
                }
            } catch {}
        };
        fetchPresence();
        const interval = setInterval(fetchPresence, 15000);
        return () => clearInterval(interval);
    }, [otherUserId]);

    const [isTyping, setIsTyping] = useState(false);
    const [typingTimer, setTypingTimer] = useState(null);
    const [otherUserTyping, setOtherUserTyping] = useState(false);

    useEffect(() => {
        // Fetch messages
        api.get(`/api/messages/${conversationId}`)
            .then(({ data }) => {
                setMessages((data.messages || []).map(normalizeMessage));
                setLoading(false);
            });
            
        // Explicitly patch mark read to ensure badges clear on backend
        api.patch(`/api/messages/${conversationId}`, { action: 'markRead' }).catch(() => {});

        if (supabase) {
            const channel = supabase.channel(`chat:${conversationId}`);
            
            channel
                .on("broadcast", { event: "new_message" }, ({ payload }) => {
                    if (String(payload.senderId) !== String(currentUserId)) {
                        setMessages((prev) => [...prev, normalizeMessage(payload)]);
                    }
                })
                .on("broadcast", { event: "read_receipt" }, ({ payload }) => {
                    if (String(payload.userId) !== String(currentUserId)) {
                        setMessages((prev) => prev.map((msg) => (String(msg.senderId) === String(currentUserId) ? { ...msg, status: "read" } : msg)));
                    }
                })
                .on("broadcast", { event: "typing" }, ({ payload }) => {
                    if (String(payload.userId) !== String(currentUserId)) {
                        setOtherUserTyping(payload.isTyping);
                    }
                })
                .subscribe();

            channelRef.current = channel;
        }

        return () => {
            if (channelRef.current && supabase) supabase.removeChannel(channelRef.current);
        };
    }, [conversationId, currentUserId]);

    useEffect(() => {
        if (!channelRef.current) return;
        channelRef.current.send({
            type: "broadcast",
            event: "read_receipt",
            payload: { userId: currentUserId, conversationId },
        });
    }, [conversationId, currentUserId, messages.length]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, otherUserTyping]);

    const handleInput = (e) => {
        setInput(e.target.value);
        if (channelRef.current) {
            if (!isTyping) {
                setIsTyping(true);
                channelRef.current.send({ type: "broadcast", event: "typing", payload: { userId: currentUserId, isTyping: true } });
            }
            if (typingTimer) clearTimeout(typingTimer);
            setTypingTimer(setTimeout(() => {
                setIsTyping(false);
                channelRef.current.send({ type: "broadcast", event: "typing", payload: { userId: currentUserId, isTyping: false } });
            }, 3000));
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        const content = input.trim();
        if (!content) return;
        setInput('');
        
        if (isTyping && channelRef.current) {
            setIsTyping(false);
            if (typingTimer) clearTimeout(typingTimer);
            channelRef.current.send({ type: "broadcast", event: "typing", payload: { userId: currentUserId, isTyping: false } });
        }

        const optimistic = normalizeMessage({
            _id: `tmp-${Date.now()}`,
            senderId: currentUserId,
            receiverId: otherUser.id || otherUser._id,
            content: content,
            movieCard: null,
            createdAt: new Date().toISOString(),
            status: "sent",
            pending: true,
        });

        setMessages((prev) => [...prev, optimistic]);

        try {
            const { data } = await api.post(`/api/messages/${conversationId}`, {
                receiverId: otherUser.id || otherUser._id,
                content: content,
                movieCard: null,
            });

            const saved = normalizeMessage(data.message);
            await channelRef.current?.send({ type: "broadcast", event: "new_message", payload: saved });
            setMessages((prev) => prev.map((msg) => (msg._id === optimistic._id ? saved : msg)));
        } catch {
            setMessages((prev) => prev.map((msg) => (msg._id === optimistic._id ? { ...msg, failed: true, pending: false } : msg)));
        }
    };

    const isOwnMessage = (msg) => String(msg.senderId) === String(currentUserId);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 md:inset-auto md:bottom-20 md:right-6 w-full md:w-80 h-full md:h-[500px] bg-neutral-950 md:border-2 border-white/10 md:rounded-3xl shadow-2xl flex flex-col z-50 overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center gap-3 p-5 border-b border-white/5 bg-neutral-900/50 backdrop-blur-sm">
                <div className="relative">
                    <img
                        src={otherUser?.avatar || '/avatar.svg'}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-400/50"
                        alt="avatar"
                    />
                    <motion.div
                        className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-neutral-950 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-neutral-500'}`}
                        animate={isOnline ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 2 }}
                    />
                </div>
                <div>
                    <p className="font-semibold text-white text-sm">@{otherUser?.username || 'User'}</p>
                    <p className={`text-xs ${isOnline ? 'text-emerald-400' : 'text-neutral-500'}`}>
                        {isOnline ? '🟢 Online' : '⚫ Offline'}
                    </p>
                </div>
                <div className="ml-auto">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={onClose}
                        className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                    >
                        <X className="w-4 h-4" />
                    </motion.button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto bg-gradient-to-b from-neutral-900/30 to-neutral-950/50">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <motion.div
                            className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-neutral-500 text-sm text-center">
                        <MessageCircle className="w-12 h-12 mb-3 opacity-50" />
                        <p>No messages yet</p>
                        <p className="text-xs">Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const mine = isOwnMessage(msg);
                        const prevMsg = messages[index - 1];
                        const nextMsg = messages[index + 1];
                        
                        const isFirstInGroup = !prevMsg || String(prevMsg.senderId) !== String(msg.senderId) || (new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() > 5 * 60 * 1000);
                        const isLastInGroup = !nextMsg || String(nextMsg.senderId) !== String(msg.senderId) || (new Date(nextMsg.createdAt).getTime() - new Date(msg.createdAt).getTime() > 5 * 60 * 1000);
                        const marginClass = index === 0 ? "" : (isFirstInGroup ? "mt-4" : "mt-1");

                        return (
                            <motion.div
                                key={msg._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${mine ? 'justify-end' : 'justify-start'} ${marginClass}`}
                            >
                                {msg.movieCard ? (
                                    <motion.div
                                        layout
                                        className={`max-w-[220px] rounded-2xl overflow-hidden border-2 shadow-xl ${mine
                                            ? 'border-red-500/30 bg-gradient-to-br from-red-500/5'
                                            : 'border-white/20 bg-neutral-800/80'
                                            }`}
                                    >
                                        <Image
                                            src={`https://image.tmdb.org/t/p/w300${msg.movieCard.poster}`}
                                            className="w-full h-32 object-cover"
                                            alt={msg.movieCard.title || 'Movie'}
                                            width={200}
                                            height={300}
                                            placeholder="blur"
                                            blurDataURL={TMDB_BLUR_DATA_URL}
                                        />
                                        <div className="p-3 bg-gradient-to-t from-neutral-900/80">
                                            <p className="font-semibold text-sm line-clamp-1 text-white mb-1">
                                                {msg.movieCard.title}
                                            </p>
                                            <p className="text-xs text-red-400 font-medium">
                                                {msg.movieCard.whereToWatch || 'Watch now'}
                                            </p>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        layout
                                        className={`max-w-[70%] px-4 py-3 rounded-2xl text-sm shadow-lg ${mine
                                            ? `bg-gradient-to-r from-red-600 to-red-500 text-white ml-4 shadow-glow-red ${!isLastInGroup ? 'rounded-br-sm' : ''} ${!isFirstInGroup ? 'rounded-tr-sm' : ''}`
                                            : `bg-neutral-800/80 text-neutral-100 mr-4 border border-white/10 ${!isLastInGroup ? 'rounded-bl-sm' : ''} ${!isFirstInGroup ? 'rounded-tl-sm' : ''}`
                                            } ${msg.failed ? 'border border-red-400/50 opacity-75' : ''}`}
                                    >
                                        {msg.content}
                                        {isLastInGroup && (
                                            <div className={`text-xs mt-1 opacity-75 flex gap-1 items-center ${mine ? 'text-red-200/80 justify-end' : 'text-neutral-400'}`}>
                                                <span>{formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}</span>
                                                {msg.pending && <span>• Sending</span>}
                                                {msg.failed && <span className="text-red-300">• Failed</span>}
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </motion.div>
                        );
                    })
                )}
                {otherUserTyping && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start mt-2">
                        <div className="bg-neutral-800/80 text-neutral-400 px-4 py-3 rounded-2xl rounded-bl-sm text-sm flex gap-1 items-center w-fit">
                            <motion.span animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 bg-neutral-400 rounded-full" />
                            <motion.span animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-neutral-400 rounded-full" />
                            <motion.span animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-neutral-400 rounded-full" />
                        </div>
                    </motion.div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-4 border-t border-white/5 bg-neutral-900/50">
                <div className="flex items-center gap-2">
                    <input
                        value={input}
                        onChange={handleInput}
                        placeholder="Type a message..."
                        className="flex-1 bg-neutral-800/50 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all placeholder-neutral-500"
                    />
                    <motion.button
                        type="submit"
                        disabled={!input.trim()}
                        whileTap={{ scale: 0.95 }}
                        className="w-11 h-11 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 disabled:opacity-50 rounded-2xl flex items-center justify-center shadow-glow-red transition-all disabled:cursor-not-allowed"
                    >
                        <Send className="w-5 h-5" />
                    </motion.button>
                </div>
                <p className="text-xs text-neutral-500 mt-2 text-center">
                    💡 Tap movie poster in MovieFinder to share here
                </p>
            </form>
        </motion.div>
    );
}
