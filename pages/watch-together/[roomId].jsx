import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, Users, Send, Copy, Check, ExternalLink, Mic, MicOff, Video, VideoOff, AlertTriangle, MonitorPlay, X, Chrome, Settings, Power, RefreshCw } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import { startWatchParty } from '../../store/slices/callSlice';
import { supabase } from '../../lib/supabase';
import { toast } from '../../components/ui/Toaster';
import axios from 'axios';

export default function WatchTogetherRoom() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { roomId } = router.query;
  const user = useSelector(selectUser);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [participants, setParticipants] = useState([]);
  const [copied, setCopied] = useState(false);
  const [movieTitle, setMovieTitle] = useState('');
  const [streamingUrl, setStreamingUrl] = useState('');
  const [zegoReady, setZegoReady] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const bottomRef = useRef(null);
  const channelRef = useRef(null);
  const zegoContainerRef = useRef(null);
  const zpRef = useRef(null);

  // Initialize Global Watch Together (voice/video runs globally via _app.js)
  useEffect(() => {
    if (!roomId || !user) return;
    
    // Start the global watch party
    dispatch(startWatchParty({
      roomID: `wt_${roomId}`,
      movieTitle: movieTitle || 'Movie',
      currentUser: user
    }));
    
    setZegoReady(true);
    
  }, [roomId, user, movieTitle, dispatch]);

  // Supabase chat channel
  useEffect(() => {
    if (!roomId || !supabase || !user) return;

    const params = new URLSearchParams(window.location.search);
    setMovieTitle(params.get('title') || 'Watch Together');
    setStreamingUrl(params.get('url') || '');

    const channel = supabase.channel(`watch-together-chat:${roomId}`);

    channel
      .on('broadcast', { event: 'chat_message' }, ({ payload }) => {
        setMessages(prev => [...prev, payload]);
      })
      .on('broadcast', { event: 'user_joined' }, ({ payload }) => {
        setParticipants(prev => {
          if (prev.find(p => p.id === payload.id)) return prev;
          return [...prev, payload];
        });
        setMessages(prev => [...prev, {
          type: 'system',
          content: `${payload.username} joined the room`,
          timestamp: new Date().toISOString(),
        }]);
      })
      .on('broadcast', { event: 'user_left' }, ({ payload }) => {
        setParticipants(prev => prev.filter(p => p.id !== payload.id));
      })
      .subscribe(() => {
        channel.send({
          type: 'broadcast',
          event: 'user_joined',
          payload: { id: user._id || user.id, username: user.username, avatar: user.avatar },
        });
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'user_left',
          payload: { id: user._id || user.id, username: user.username },
        });
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [roomId, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Show hardware acceleration guide if they haven't dismissed it before
    if (typeof window !== 'undefined') {
      const hidden = localStorage.getItem('hideHAguide');
      if (!hidden) {
        setShowGuide(true);
      }
    }
  }, []);

  const dismissGuide = () => {
    localStorage.setItem('hideHAguide', 'true');
    setShowGuide(false);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !channelRef.current) return;

    const msg = {
      type: 'user',
      userId: user._id || user.id,
      username: user.username,
      avatar: user.avatar,
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    channelRef.current.send({ type: 'broadcast', event: 'chat_message', payload: msg });
    setMessages(prev => [...prev, msg]);
    setInput('');
  };

  const copyInvite = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast({ type: 'success', message: 'Invite link copied!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFullscreen = () => {
    // Left empty. Fullscreen logic is handled by ZEGOCLOUD's internal UI if needed,
    // or we can just leave this as a UI stub.
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">
        <div className="text-center">
          <Film className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Sign in to join</h2>
          <p className="text-neutral-500">You need to be logged in to join a Watch Together room.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Watch Together — {movieTitle} | MovieFinder</title>
      </Head>
      <div className="min-h-screen bg-neutral-950 pt-20 flex flex-col lg:flex-row">

        {/* Left: Video/Voice area */}
        <div className="flex-1 flex flex-col">
          {/* Header bar */}
          <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-white/5 bg-black/50">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-red-600/20 flex items-center justify-center flex-shrink-0">
                <Film className="w-4 h-4 text-red-400" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-white truncate">{movieTitle}</h1>
                <p className="text-[10px] text-neutral-500 flex items-center gap-1">
                  <Users className="w-3 h-3" /> {participants.length + 1} in room
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {streamingUrl && (
                <a
                  href={streamingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-500 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" /> Open on OTT
                </a>
              )}
              
              <div className="flex gap-2 border-l border-white/10 pl-2 ml-1">
                <a href="https://www.netflix.com" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-500 transition-colors">Netflix</a>
                <a href="https://www.primevideo.com" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-bold hover:bg-blue-400 transition-colors hidden sm:flex">Prime Video</a>
                <a href="https://www.disneyplus.com" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-colors hidden sm:flex">Disney+</a>
              </div>
              <button
                onClick={toggleFullscreen}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-neutral-400 text-xs hover:bg-white/5 transition-colors"
                title="Watch in Fullscreen"
              >
                <MonitorPlay className="w-3 h-3" />
                <span className="hidden sm:inline">Fullscreen</span>
              </button>
              <button
                onClick={copyInvite}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-neutral-400 text-xs hover:bg-white/5 transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                <span className="hidden sm:inline">Invite</span>
              </button>
            </div>
          </div>

          {/* ZEGOCLOUD video/voice panel (Rendered Globally via GlobalCallOverlay) */}
          <div className="flex-1 relative bg-black min-h-[300px]">
            {!zegoReady && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="text-4xl mb-3">🍿</div>
                  <p className="text-sm text-neutral-400">Setting up the room...</p>
                  <div className="flex justify-center gap-1 mt-3">
                    {[0, 1, 2].map(i => (
                      <motion.span
                        key={i}
                        className="w-2 h-2 rounded-full bg-red-400"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div className="w-full h-full" />
          </div>

          {/* Anti-piracy */}
          <p className="text-center text-[10px] text-neutral-700 py-2 bg-black/50 border-t border-white/5">
            🔒 MovieFinder only links to official streaming platforms. No pirated content is hosted or streamed.
          </p>
        </div>

        {/* Right: Chat sidebar */}
        <div className="w-full lg:w-80 flex flex-col border-l border-white/5 bg-neutral-900/50 max-h-screen lg:max-h-[calc(100vh-80px)]">
          {/* Participants */}
          <div className="px-4 py-3 border-b border-white/5">
            <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2">In Room</p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <img
                src={user.avatar || '/avatar.svg'}
                alt="You"
                title="You"
                className="w-7 h-7 rounded-full border-2 border-red-500/50 object-cover"
              />
              {participants.map(p => (
                <img
                  key={p.id}
                  src={p.avatar || '/avatar.svg'}
                  alt={p.username}
                  title={`@${p.username}`}
                  className="w-7 h-7 rounded-full border-2 border-neutral-700 object-cover"
                />
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <p className="text-xs text-neutral-600">Chat while watching 🎬</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                {msg.type === 'system' ? (
                  <p className="text-center text-[10px] text-neutral-600 py-1">{msg.content}</p>
                ) : (
                  <div className="flex items-start gap-2">
                    <img src={msg.avatar || '/avatar.svg'} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-neutral-500">@{msg.username}</p>
                      <p className="text-xs text-neutral-200 bg-white/5 px-2.5 py-1.5 rounded-xl rounded-tl-sm inline-block">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Chat input */}
          <form onSubmit={sendMessage} className="p-3 border-t border-white/5">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Chat..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500/50 placeholder:text-neutral-600"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center hover:bg-red-500 disabled:opacity-30 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Hardware Acceleration Guide Modal */}
      <AnimatePresence>
        {showGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-neutral-900 border border-white/10 rounded-2xl p-6 sm:p-8 max-w-lg w-full relative shadow-2xl"
            >
              <button
                onClick={dismissGuide}
                className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6 text-red-500">
                <AlertTriangle className="w-8 h-8" />
                <h2 className="text-xl font-black text-white">Streaming OTT? Fix the Black Screen</h2>
              </div>

              <div className="space-y-6 text-sm text-neutral-300">
                <p className="text-neutral-400">
                  If you try to screen share Netflix, Prime, or Hulu directly, your friends will only see a black screen due to copyright protection (DRM). <strong>Here's how to bypass it in 30 seconds:</strong>
                </p>

                {/* Step by step visual guide */}
                <div className="space-y-3">
                  <div className="flex gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center flex-shrink-0 text-white font-black shadow-inner">1</div>
                    <div>
                      <h4 className="text-white font-bold mb-1 flex items-center gap-2"><Chrome className="w-4 h-4 text-neutral-400" /> Open Browser Settings</h4>
                      <p className="text-xs text-neutral-400 leading-relaxed">Open settings in Chrome, Edge, or Brave. In the search bar at the top, type <strong>"Graphics Acceleration"</strong> (or "Hardware Acceleration").</p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center flex-shrink-0 text-white font-black shadow-inner">2</div>
                    <div>
                      <h4 className="text-white font-bold mb-1 flex items-center gap-2"><Power className="w-4 h-4 text-red-400" /> Turn it OFF</h4>
                      <p className="text-xs text-neutral-400 leading-relaxed">Find the toggle that says <strong>"Use graphics acceleration when available"</strong> and turn it <strong className="text-red-400">OFF</strong>.</p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center flex-shrink-0 text-white font-black shadow-inner">3</div>
                    <div>
                      <h4 className="text-white font-bold mb-1 flex items-center gap-2"><RefreshCw className="w-4 h-4 text-emerald-400" /> Relaunch & Stream</h4>
                      <p className="text-xs text-neutral-400 leading-relaxed">Click the <strong>Relaunch</strong> button that appears. Now you can screen share Netflix perfectly!</p>
                    </div>
                  </div>
                </div>
                
                <p className="text-[11px] text-neutral-500 italic text-center px-4">
                  (Or, skip this entirely! Everyone can just click "Open on OTT" at the top to watch in separate tabs while talking here)
                </p>
              </div>

              <div className="mt-8">
                <button
                  onClick={dismissGuide}
                  className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl transition-colors shadow-lg shadow-red-900/20"
                >
                  I'm ready to watch!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
