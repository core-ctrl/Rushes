import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  CheckCheck,
  Film,
  Image as ImageIcon,
  Mic,
  Paperclip,
  Phone,
  Search,
  Send,
  Smile,
  Video,
  Wifi,
  WifiOff,
  X,
  Square,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useVoiceRecorder } from "../../hooks/useVoiceRecorder";
import axios from "axios";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "../../lib/supabase";
import { useDispatch, useSelector } from "react-redux";
import { startCall as startGlobalCall, cancelCall, setCallerStatus, selectActiveCall } from "../../store/slices/callSlice";
import { TMDB_BLUR_DATA_URL } from "../../lib/imageBlur";
import { toast } from "../ui/Toaster";
import dynamic from "next/dynamic";

const IncomingCallModal = dynamic(() => import('./IncomingCallModal'), { ssr: false });

const REACTIONS = ["❤️", "🔥", "😂", "👏", "🎬"];

function normalizeMessage(message) {
  return {
    ...message,
    _id: message._id || message.id || `${message.senderId}-${message.createdAt}`,
    createdAt: message.createdAt || message.created_at || new Date().toISOString(),
    reactions: message.reactions || [],
  };
}

function blobToBase64(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

function SearchSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-2xl border border-white/8 bg-white/[0.04]">
          <div className="aspect-[2/3] animate-pulse bg-white/10" />
          <div className="space-y-2 p-2">
            <div className="h-3 w-3/4 animate-pulse rounded bg-white/10" />
            <div className="h-2 w-1/2 animate-pulse rounded bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

// CallOverlay removed — replaced by IncomingCallModal + WebRTCCallPanel signaling

export default function ChatPanel({ conversation, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [otherTyping, setOtherTyping] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showMovieSearch, setShowMovieSearch] = useState(false);
  const [movieQuery, setMovieQuery] = useState("");
  const [movieResults, setMovieResults] = useState([]);
  const [movieLoading, setMovieLoading] = useState(false);
  const [movieTouched, setMovieTouched] = useState(false);
  const dispatch = useDispatch();

  // === CALL STATE (incoming invites, handled by WebRTCCallPanel) ===
  const [incomingCall, setIncomingCall] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);
  const channelRef = useRef(null);
  const fileInputRef = useRef(null);
  const callChannelRef = useRef(null);

  const { isRecording, recordingTime, startRecording, stopRecording, cancelRecording } = useVoiceRecorder();

  const { otherUser, id: conversationId } = conversation;
  const currentUserId = currentUser?._id || currentUser?.id;
  const receiverId = otherUser?._id || otherUser?.id;
  const isBlocked = (currentUser?.blockedUsers || []).includes(receiverId);
  const activeCall = useSelector(selectActiveCall);
  const isInCall = activeCall?.roomID != null;
  const [isCalling, setIsCalling] = useState(false);
  const callTimeoutRef = useRef(null);

  const statusLabel = useMemo(() => {
    if (isOnline) return "Online";
    if (lastSeen) return `Last seen ${formatDistanceToNow(new Date(lastSeen), { addSuffix: true })}`;
    return "Offline";
  }, [isOnline, lastSeen]);

  // === ONLINE/OFFLINE STATUS: Read from Supabase presence table ===
  useEffect(() => {
    if (!supabase || !receiverId) return;

    // Initial fetch
    const fetchPresence = async () => {
      try {
        const res = await fetch(`/api/presence/${receiverId}`);
        if (res.ok) {
          const data = await res.json();
          setIsOnline(Boolean(data.isOnline));
          setLastSeen(data.lastSeen);
        }
      } catch {}
    };
    fetchPresence();

    // Poll every 15s for presence updates (Supabase broadcast doesn't cover DB changes)
    const presenceInterval = setInterval(fetchPresence, 15000);

    return () => clearInterval(presenceInterval);
  }, [receiverId]);

  // === START A CALL: Broadcast invite to the other user ===
  const startCallAction = (mode) => {
    if (!channelRef.current) return;

    if (!isOnline) {
      toast({ type: 'error', message: `${otherUser?.displayName || otherUser?.username || 'User'} is offline. They cannot receive calls right now.` });
      return;
    }

    if (isCalling || isInCall) return; // prevent double-call

    const roomID = `mf_${conversationId}_${Date.now()}`;
    setIsCalling(true);
    
    dispatch(startGlobalCall({
      roomID,
      mode,
      otherUser,
      currentUser,
      conversationId,
    }));

    // Send invite on the shared conversation channel
    channelRef.current.send({
      type: 'broadcast',
      event: 'call_invite',
      payload: {
        roomID,
        callMode: mode,
        callerId: currentUserId,
        callerName: currentUser?.displayName || currentUser?.username || 'Someone',
        callerAvatar: currentUser?.avatar,
        conversationId,
      },
    });

    toast({ type: 'info', message: `Calling ${otherUser?.displayName || otherUser?.username}...` });

    // Auto-cancel if no answer in 30s
    callTimeoutRef.current = setTimeout(() => {
      setIsCalling(false);
      dispatch(cancelCall());
      toast({ type: 'info', message: 'No answer.' });
      channelRef.current?.send({
        type: 'broadcast',
        event: 'call_cancelled',
        payload: { roomID },
      });
    }, 30000);
  };

  // === ACCEPT INCOMING CALL ===
  const acceptCall = () => {
    if (!incomingCall) return;
    
    dispatch(startGlobalCall({
      roomID: incomingCall.roomID,
      mode: incomingCall.callMode,
      otherUser,
      currentUser,
      conversationId,
    }));

    // Tell the caller we accepted so they can transition away from "Calling..."
    channelRef.current?.send({
      type: 'broadcast',
      event: 'call_accepted',
      payload: { roomID: incomingCall.roomID, acceptedBy: currentUserId },
    });
    
    setIncomingCall(null);
  };

  // === DECLINE INCOMING CALL ===
  const declineCall = () => {
    if (!incomingCall || !channelRef.current) return;

    // Notify the caller that we declined
    channelRef.current.send({
      type: 'broadcast',
      event: 'call_declined',
      payload: { declinedBy: currentUserId },
    });

    setIncomingCall(null);
  };

  // === CLEANUP CALL TIMEOUT on unmount ===
  useEffect(() => {
    return () => {
      if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
    };
  }, []);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/messages/${conversationId}`);
      setMessages((data.messages || []).map(normalizeMessage));
    } catch {
      toast({ type: "error", message: "Could not load this conversation." });
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  const subscribeToMessages = useCallback(() => {
    if (!supabase) return null;
    try {
      const channel = supabase.channel(`chat:${conversationId}`);
      return channel
        .on("broadcast", { event: "new_message" }, ({ payload }) => {
          if (String(payload.senderId) !== String(currentUserId)) {
            setMessages((prev) => [...prev, normalizeMessage(payload)]);
          }
        })
        .on("broadcast", { event: "typing_start" }, ({ payload }) => {
          if (String(payload.userId) !== String(currentUserId)) setOtherTyping(true);
        })
        .on("broadcast", { event: "typing_stop" }, ({ payload }) => {
          if (String(payload.userId) !== String(currentUserId)) setOtherTyping(false);
        })
        .on("broadcast", { event: "read_receipt" }, ({ payload }) => {
          if (String(payload.userId) !== String(currentUserId)) {
            setMessages((prev) => prev.map((msg) => (String(msg.senderId) === String(currentUserId) ? { ...msg, status: "read" } : msg)));
          }
        })
        .on("broadcast", { event: "call_invite" }, ({ payload }) => {
          if (String(payload.callerId) !== String(currentUserId)) {
            setIncomingCall(payload);
          }
        })
        .on("broadcast", { event: "call_declined" }, () => {
          // Clear caller's call state immediately
          clearTimeout(callTimeoutRef.current);
          setIsCalling(false);
          dispatch(cancelCall());
          toast({ type: "info", message: `${otherUser?.displayName || otherUser?.username || "User"} declined the call.` });
        })
        .on("broadcast", { event: "call_accepted" }, ({ payload }) => {
          // Callee accepted — clear the auto-cancel timeout, caller is now in call
          clearTimeout(callTimeoutRef.current);
          setIsCalling(false);
          dispatch(setCallerStatus('accepted'));
        })
        .on("broadcast", { event: "call_cancelled" }, () => {
          setIncomingCall(null);
        })
        .on("broadcast", { event: "message_deleted" }, ({ payload }) => {
          setMessages((prev) => prev.filter(msg => msg._id !== payload.messageId));
        })
        .on("broadcast", { event: "chat_deleted" }, () => {
          setMessages([]);
        })
        .subscribe();
    } catch {
      return null;
    }
  }, [conversationId, currentUserId, otherUser?.displayName, otherUser?.username]);

  useEffect(() => {
    loadMessages();
    const channel = subscribeToMessages();
    channelRef.current = channel;
    return () => {
      if (channel && supabase) supabase.removeChannel(channel);
    };
  }, [loadMessages, subscribeToMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, otherTyping]);

  useEffect(() => {
    if (!channelRef.current) return;
    channelRef.current.send({
      type: "broadcast",
      event: "read_receipt",
      payload: { userId: currentUserId, conversationId },
    });
  }, [conversationId, currentUserId, messages.length]);

  useEffect(() => {
    if (!showMovieSearch) return;
    if (!movieQuery.trim()) {
      setMovieResults([]);
      setMovieLoading(false);
      return;
    }

    setMovieTouched(true);
    setMovieLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const { data } = await axios.get(`/api/search/autocomplete?q=${encodeURIComponent(movieQuery.trim())}`);
        setMovieResults((data.suggestions || []).slice(0, 8));
      } catch {
        setMovieResults([]);
      } finally {
        setMovieLoading(false);
      }
    }, 260);

    return () => window.clearTimeout(timer);
  }, [movieQuery, showMovieSearch]);

  const sendTypingEvent = (event) => {
    channelRef.current?.send({
      type: "broadcast",
      event,
      payload: { userId: currentUserId },
    });
  };

  const handleTyping = (value) => {
    setInput(value);
    sendTypingEvent("typing_start");
    window.clearTimeout(typingTimeout.current);
    typingTimeout.current = window.setTimeout(() => sendTypingEvent("typing_stop"), 1100);
  };

  const sendMessage = async ({ content = input.trim(), movieCard = null, voiceUrl = null } = {}) => {
    const attachmentText = attachments.length ? `\n${attachments.map((file) => `Attachment: ${file.name}`).join("\n")}` : "";
    const text = `${content || ""}${attachmentText}`.trim();
    if (!text && !movieCard && !voiceUrl) return;

    const optimistic = normalizeMessage({
      _id: `tmp-${Date.now()}`,
      senderId: currentUserId,
      receiverId,
      content: voiceUrl ? "Voice message" : text,
      movieCard,
      voiceUrl,
      createdAt: new Date().toISOString(),
      status: "sent",
      pending: true,
    });

    setMessages((prev) => [...prev, optimistic]);
    setInput("");
    setAttachments([]);
    setShowEmoji(false);
    setShowMovieSearch(false);

    try {
      const { data } = await axios.post(`/api/messages/${conversationId}`, {
        receiverId,
        content: optimistic.content,
        movieCard,
        voiceUrl,
      });

      const saved = normalizeMessage(data.message);
      await channelRef.current?.send({ type: "broadcast", event: "new_message", payload: saved });
      setMessages((prev) => prev.map((msg) => (msg._id === optimistic._id ? saved : msg)));
    } catch {
      setMessages((prev) => prev.map((msg) => (msg._id === optimistic._id ? { ...msg, failed: true, pending: false } : msg)));
      toast({ type: "error", message: "Message failed to send." });
    }
  };

  const shareMovie = (movie) => {
    sendMessage({
      content: "",
      movieCard: {
        tmdbId: movie.id,
        title: movie.title,
        poster: movie.poster,
        mediaType: movie.type,
        year: movie.year,
        rating: movie.rating,
      },
    });
  };

  const reactToMessage = (messageId, reaction) => {
    setMessages((prev) => prev.map((msg) => {
      if (msg._id !== messageId) return msg;
      const exists = msg.reactions?.find((entry) => entry.userId === currentUserId && entry.reaction === reaction);
      return {
        ...msg,
        reactions: exists
          ? msg.reactions.filter((entry) => !(entry.userId === currentUserId && entry.reaction === reaction))
          : [...(msg.reactions || []), { userId: currentUserId, reaction }],
      };
    }));
  };

  const isMine = (msg) => String(msg.senderId) === String(currentUserId);

  const deleteChat = async () => {
    if (!window.confirm("Are you sure you want to delete all messages in this chat? This cannot be undone.")) return;
    try {
      await axios.delete(`/api/messages/${conversationId}`);
      setMessages([]);
      channelRef.current?.send({
        type: "broadcast",
        event: "chat_deleted",
        payload: { conversationId },
      });
      toast({ type: "success", message: "Chat deleted." });
    } catch {
      toast({ type: "error", message: "Failed to delete chat." });
    }
  };

  const deleteMessage = async (messageId) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      await axios.patch(`/api/messages/${conversationId}`, { action: "delete", messageId });
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
      channelRef.current?.send({
        type: "broadcast",
        event: "message_deleted",
        payload: { messageId },
      });
    } catch {
      toast({ type: "error", message: "Failed to delete message." });
    }
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(229,9,20,0.12),transparent_34%),linear-gradient(180deg,#070707,#030303)]">
      <div className="flex flex-shrink-0 items-center gap-3 border-b border-white/8 bg-black/45 p-3 backdrop-blur-2xl md:p-4">
        <div className="relative">
          <img src={otherUser?.avatar || "/avatar.svg"} className="h-11 w-11 rounded-full border border-white/10 object-cover" alt="" />
          <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-black ${otherUser ? (isOnline ? "bg-emerald-400" : "bg-neutral-500") : "bg-red-500"}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col">
            <span className="font-bold text-white">{otherUser?.displayName || otherUser?.username || "Unknown"}</span>
            <span className="text-xs font-semibold text-neutral-400">
              {otherUser ? statusLabel : "Account Deleted"}
            </span>
          </div>
          
          {otherUser && (
            <button
              onClick={async () => {
                try {
                  const isFollowing = currentUser?.following?.includes(receiverId);
                  const action = isFollowing ? 'unfollow' : 'follow';
                  await axios.post('/api/users/follow', { targetUserId: receiverId, action });
                  toast({ type: 'success', message: `${action === 'follow' ? 'Followed' : 'Unfollowed'} ${otherUser.username}` });
                } catch {
                  toast({ type: 'error', message: 'Follow action failed' });
                }
              }}
              className="ml-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-white hover:bg-white/10"
            >
              {currentUser?.following?.includes(receiverId) ? 'Following' : 'Follow'}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isCalling ? (
            <div className="flex items-center gap-2 rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-3 py-1.5">
              <motion.div
                className="h-2 w-2 rounded-full bg-yellow-400"
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="text-xs font-semibold text-yellow-400">Calling...</span>
              <button
                onClick={() => {
                  clearTimeout(callTimeoutRef.current);
                  setIsCalling(false);
                  dispatch(cancelCall());
                  channelRef.current?.send({ type: 'broadcast', event: 'call_cancelled', payload: {} });
                }}
                className="ml-1 rounded-full p-0.5 text-yellow-400/60 hover:text-yellow-400"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : isInCall ? (
            <div className="flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 px-3 py-1.5">
              <motion.div
                className="h-2 w-2 rounded-full bg-green-400"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className="text-xs font-semibold text-green-400">On a call</span>
            </div>
          ) : (
            <>
              <button
                onClick={() => startCallAction('voice')}
                disabled={!isOnline}
                className="rounded-xl p-2 text-neutral-400 transition-all hover:bg-green-500/10 hover:text-green-400 disabled:opacity-40"
                aria-label="Start voice call"
              >
                <Phone className="h-5 w-5" />
              </button>
              <button
                onClick={() => startCallAction('video')}
                disabled={!isOnline}
                className="rounded-xl p-2 text-neutral-400 transition-all hover:bg-blue-500/10 hover:text-blue-400 disabled:opacity-40"
                aria-label="Start video call"
              >
                <Video className="h-5 w-5" />
              </button>
            </>
          )}
          <button onClick={deleteChat} className="chat-icon-button transition hover:text-red-400" aria-label="Delete chat">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-5 md:px-5" data-lenis-prevent>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className={`flex ${index % 2 ? "justify-end" : "justify-start"}`}>
                <div className="h-12 w-48 animate-pulse rounded-2xl bg-white/8" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-red-300">
              <Film className="h-7 w-7" />
            </div>
            <p className="text-sm font-semibold text-neutral-300">Start with a title worth talking about</p>
            <p className="mt-1 max-w-xs text-xs text-neutral-600">Share a movie, drop a reaction, or send a quick voice note.</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const mine = isMine(msg);
            const prevMsg = messages[index - 1];
            const nextMsg = messages[index + 1];
            
            const isFirstInGroup = !prevMsg || String(prevMsg.senderId) !== String(msg.senderId) || (new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() > 5 * 60 * 1000);
            const isLastInGroup = !nextMsg || String(nextMsg.senderId) !== String(msg.senderId) || (new Date(nextMsg.createdAt).getTime() - new Date(msg.createdAt).getTime() > 5 * 60 * 1000);
            const marginClass = index === 0 ? "" : (isFirstInGroup ? "mt-4" : "mt-1");

            return (
              <motion.div
                key={msg._id}
                layout
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`group flex items-end gap-2 ${mine ? "justify-end" : "justify-start"} ${marginClass}`}
              >
                {!mine ? (
                  <div className="w-7 flex-shrink-0">
                    {isLastInGroup ? (
                      <img src={otherUser?.avatar || "/avatar.svg"} alt="" className="h-7 w-7 rounded-full object-cover" />
                    ) : null}
                  </div>
                ) : null}
                <div className={`flex max-w-[82%] flex-col ${mine ? "items-end" : "items-start"} md:max-w-[68%]`}>
                  {msg.movieCard ? (
                    <div className={`overflow-hidden rounded-[22px] border shadow-2xl ${mine ? "border-red-400/30 bg-red-500/10" : "border-white/10 bg-white/[0.06]"}`}>
                      {msg.movieCard.poster ? (
                        <Image
                          src={`https://image.tmdb.org/t/p/w300${msg.movieCard.poster}`}
                          className="aspect-[16/10] w-full object-cover"
                          alt={msg.movieCard.title || "Shared poster"}
                          width={320}
                          height={200}
                          placeholder="blur"
                          blurDataURL={TMDB_BLUR_DATA_URL}
                        />
                      ) : null}
                      <div className="p-3">
                        <p className="line-clamp-1 text-sm font-black text-white">{msg.movieCard.title}</p>
                        <div className="mt-1 flex items-center gap-2">
                          {msg.movieCard.year ? <span className="text-xs text-neutral-400">{msg.movieCard.year}</span> : null}
                          {msg.movieCard.rating ? <span className="text-xs text-amber-300">★ {msg.movieCard.rating}</span> : null}
                        </div>
                        <button
                          onClick={() => window.location.assign(`/${msg.movieCard.mediaType === "tv" ? "series" : "movies"}/${msg.movieCard.tmdbId}`)}
                          className="mt-3 w-full rounded-xl bg-white px-3 py-2 text-xs font-black text-black transition hover:bg-neutral-200"
                        >
                          Open title
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={`relative rounded-[22px] px-4 py-3 text-sm leading-relaxed shadow-xl 
                      ${mine 
                        ? `bg-gradient-to-br from-red-600 to-red-500 text-white ${!isLastInGroup ? 'rounded-br-[8px]' : ''} ${!isFirstInGroup ? 'rounded-tr-[8px]' : ''}` 
                        : `border border-white/10 bg-white/[0.07] text-neutral-100 backdrop-blur-xl ${!isLastInGroup ? 'rounded-bl-[8px]' : ''} ${!isFirstInGroup ? 'rounded-tl-[8px]' : ''}`} 
                      ${msg.failed ? "border border-red-400/50 opacity-75" : ""}`}
                    >
                      {msg.voiceUrl ? (
                        <div className="flex flex-col gap-2">
                          <span className="text-xs font-semibold opacity-70">Voice Message</span>
                          <audio src={msg.voiceUrl} controls className="h-8 max-w-[200px]" />
                        </div>
                      ) : (
                        <span className="whitespace-pre-wrap">{msg.content}</span>
                      )}
                    </div>
                  )}

                  {isLastInGroup && (
                    <div className={`mt-1 flex items-center gap-2 text-[10px] ${mine ? "text-red-200/80" : "text-neutral-600"}`}>
                      <span>{formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}</span>
                      {mine ? msg.status === "read" ? <CheckCheck className="h-3 w-3 text-sky-300" /> : <Check className="h-3 w-3" /> : null}
                      {msg.pending ? <span>Sending</span> : null}
                      {msg.failed ? <span className="text-red-300">Failed</span> : null}
                    </div>
                  )}

                  {msg.reactions?.length ? (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {msg.reactions.map((entry, index) => (
                        <span key={`${entry.userId}-${entry.reaction}-${index}`} className="rounded-full border border-white/10 bg-black/40 px-1.5 py-0.5 text-xs">
                          {entry.reaction}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className={`mt-1 hidden gap-1 rounded-full border border-white/8 bg-black/60 p-1 backdrop-blur-xl group-hover:flex ${mine ? "flex-row-reverse" : ""}`}>
                    {REACTIONS.map((reaction) => (
                      <button
                        key={reaction}
                        onClick={() => reactToMessage(msg._id, reaction)}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-sm transition hover:bg-white/10"
                      >
                        {reaction}
                      </button>
                    ))}
                    {mine && (
                      <button
                        onClick={() => deleteMessage(msg._id)}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-sm text-red-400 transition hover:bg-white/10"
                        title="Delete Message"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}

        {otherTyping ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-xl">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-neutral-300" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.12 }} />
                ))}
              </div>
            </div>
          </motion.div>
        ) : null}

        <div ref={bottomRef} />
      </div>

      <AnimatePresence>
        {showMovieSearch ? (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-[80px] left-4 z-50 w-72 overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/95 shadow-2xl backdrop-blur-2xl md:w-80"
          >
            <div className="p-3">
              <div className="mb-2 flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-2">
                <Search className="h-4 w-4 text-neutral-500" />
                <input
                  autoFocus
                  value={movieQuery}
                  onChange={(event) => setMovieQuery(event.target.value)}
                  placeholder="Search to share..."
                  className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-neutral-500"
                />
                <button onClick={() => setShowMovieSearch(false)} className="text-neutral-500 transition hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto" data-lenis-prevent>
                {movieLoading ? <SearchSkeleton /> : null}
                {!movieLoading && movieResults.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    {movieResults.map((movie) => (
                      <button
                        key={`${movie.type}-${movie.id}`}
                        onClick={() => shareMovie(movie)}
                        className="flex items-center gap-3 rounded-xl p-1.5 transition hover:bg-white/10"
                      >
                        <Image
                          src={movie.poster ? `https://image.tmdb.org/t/p/w92${movie.poster}` : "/fallback.jpg"}
                          className="h-10 w-8 rounded-md object-cover"
                          alt={movie.title || "Movie poster"}
                          width={32}
                          height={40}
                          placeholder="blur"
                          blurDataURL={TMDB_BLUR_DATA_URL}
                        />
                        <div className="flex-1 text-left">
                          <p className="line-clamp-1 text-sm font-semibold text-white">{movie.title}</p>
                          <p className="text-[10px] uppercase text-neutral-400">{movie.type} {movie.year ? `• ${movie.year}` : ""}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : null}
                {!movieLoading && movieTouched && movieQuery.trim() && movieResults.length === 0 ? (
                  <div className="p-4 text-center text-xs text-neutral-500">
                    No titles found.
                  </div>
                ) : null}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="flex-shrink-0 border-t border-white/8 bg-black/35 p-3 backdrop-blur-2xl md:p-4">
        {isBlocked ? (
          <div className="text-center py-3">
            <p className="text-sm text-neutral-500">You have blocked this user. Unblock them to send messages.</p>
          </div>
        ) : (
        <>
        {attachments.length ? (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachments.map((file) => (
              <span key={`${file.name}-${file.size}`} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs text-neutral-300">
                <ImageIcon className="h-3 w-3" />
                {file.name}
                <button onClick={() => setAttachments((current) => current.filter((entry) => entry !== file))} className="text-neutral-500 hover:text-white">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        ) : null}

        <div className="relative flex items-end gap-2 rounded-[24px] border border-white/10 bg-white/[0.06] p-2 shadow-[0_22px_70px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
          <button
            onClick={() => setShowMovieSearch((value) => !value)}
            className={`chat-icon-button ${showMovieSearch ? "bg-red-600 text-white" : ""}`}
            aria-label="Share movie"
          >
            <Film className="h-4 w-4" />
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="chat-icon-button" aria-label="Attach file">
            <Paperclip className="h-4 w-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(event) => setAttachments(Array.from(event.target.files || []).slice(0, 4))}
          />
          <div className="relative flex-1">
            {isRecording ? (
              <div className="flex min-h-[42px] items-center gap-3 px-3">
                <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
                <span className="font-mono text-sm font-semibold text-red-400">
                  {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, "0")}
                </span>
                <div className="flex-1" />
                <button onClick={cancelRecording} className="text-xs font-semibold uppercase text-neutral-500 hover:text-white">
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <textarea
                  value={input}
                  onChange={(event) => handleTyping(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Message..."
                  rows={1}
                  className="max-h-28 min-h-[42px] w-full resize-none bg-transparent px-2 py-2.5 text-sm text-white outline-none placeholder:text-neutral-600"
                />
                <AnimatePresence>
                  {showEmoji ? (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      className="absolute bottom-full left-0 mb-3 flex gap-1 rounded-2xl border border-white/10 bg-black/80 p-2 shadow-2xl backdrop-blur-2xl"
                    >
                      {REACTIONS.map((reaction) => (
                        <button key={reaction} onClick={() => setInput((value) => `${value}${reaction}`)} className="flex h-9 w-9 items-center justify-center rounded-xl transition hover:bg-white/10">
                          {reaction}
                        </button>
                      ))}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </>
            )}
          </div>
          <button onClick={() => setShowEmoji((value) => !value)} className="chat-icon-button" aria-label="Open emoji picker">
            <Smile className="h-4 w-4" />
          </button>
          <button
            onClick={async () => {
              if (isRecording) {
                const blob = await stopRecording();
                if (blob) {
                  const voiceUrl = await blobToBase64(blob);
                  sendMessage({ voiceUrl });
                }
              } else {
                startRecording();
              }
            }}
            className={`chat-icon-button transition-colors ${isRecording ? "bg-red-500 text-white" : ""}`}
            aria-label="Send voice message"
          >
            {isRecording ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-4 w-4" />}
          </button>
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() && attachments.length === 0}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white shadow-glow-red transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        </>
        )}
      </div>

      <IncomingCallModal
        callData={incomingCall}
        onAccept={acceptCall}
        onDecline={declineCall}
      />
    </div>
  );
}
