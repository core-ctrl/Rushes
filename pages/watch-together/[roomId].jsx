import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Check, Chrome, Copy, ExternalLink, Film, MonitorPlay, PlayCircle, Power, RefreshCw, Send, ShieldCheck, Users, X } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import { selectActiveWatchParty, startWatchParty } from '../../store/slices/callSlice';
import { supabase } from '../../lib/supabase';
import { toast } from '../../components/ui/Toaster';

export default function WatchTogetherRoom() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { roomId } = router.query;
  const user = useSelector(selectUser);
  const activeWatchParty = useSelector(selectActiveWatchParty);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [participants, setParticipants] = useState([]);
  const [copied, setCopied] = useState(false);
  const [movieTitle, setMovieTitle] = useState('');
  const [streamingUrl, setStreamingUrl] = useState('');
  const [zegoReady, setZegoReady] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const bottomRef = useRef(null);
  const channelRef = useRef(null);

  useEffect(() => {
    if (!router.isReady) return;
    const params = new URLSearchParams(window.location.search);
    setMovieTitle(params.get('title') || 'Watch Together');
    setStreamingUrl(params.get('url') || '');
  }, [router.isReady]);

  useEffect(() => {
    if (!roomId || !activeWatchParty) return;
    if (activeWatchParty.roomID === `wt_${roomId}`) {
      setHasStarted(true);
      setZegoReady(true);
    }
  }, [roomId, activeWatchParty]);

  // Supabase chat channel
  useEffect(() => {
    if (!roomId || !supabase || !user || !hasStarted) return;

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
  }, [roomId, user, hasStarted]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const dismissGuide = () => {
    setShowGuide(false);
  };

  const startRoom = () => {
    if (!roomId || !user) return;

    dispatch(startWatchParty({
      roomID: `wt_${roomId}`,
      movieTitle: movieTitle || 'Watch Together',
      currentUser: user,
      streamingUrl,
    }));

    setHasStarted(true);
    setZegoReady(true);
    toast({ type: 'success', message: 'Watch Together room started.' });
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

  if (!hasStarted) {
    return (
      <>
        <Head>
          <title>Watch Together Setup - {movieTitle || 'MovieFinder'}</title>
        </Head>
        <main className="min-h-screen bg-neutral-950 pt-20 text-white">
          <section className="mx-auto grid min-h-[calc(100vh-80px)] max-w-6xl grid-cols-1 gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-6">
            <div className="flex flex-col justify-center">
              <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-red-200">
                <Film className="h-3.5 w-3.5" />
                Watch Together
              </div>

              <h1 className="max-w-3xl text-4xl font-black leading-tight text-white md:text-6xl">
                Set up the room before the call starts.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-neutral-400 md:text-base">
                Read the quick rules, open the title on the official platform, then start the room when everyone is ready.
              </p>

              <div className="mt-8 grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <ShieldCheck className="mb-3 h-5 w-5 text-emerald-300" />
                  <h2 className="text-sm font-black text-white">Official only</h2>
                  <p className="mt-2 text-xs leading-5 text-neutral-400">
                    MovieFinder does not host movies or pirated streams. Use your own legal OTT access.
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <AlertTriangle className="mb-3 h-5 w-5 text-amber-300" />
                  <h2 className="text-sm font-black text-white">DRM protected</h2>
                  <p className="mt-2 text-xs leading-5 text-neutral-400">
                    Netflix, Prime, Disney and similar apps may block screen sharing. Do not bypass DRM.
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <Users className="mb-3 h-5 w-5 text-sky-300" />
                  <h2 className="text-sm font-black text-white">Watch in sync</h2>
                  <p className="mt-2 text-xs leading-5 text-neutral-400">
                    Everyone can open the same OTT title in their own tab while using this room for voice and chat.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={startRoom}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-red-950/40 transition hover:bg-red-500"
                >
                  <PlayCircle className="h-5 w-5" />
                  Start watching
                </button>
                {streamingUrl && (
                  <a
                    href={streamingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-white transition hover:bg-white/[0.08]"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open official OTT
                  </a>
                )}
                <button
                  onClick={copyInvite}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-white transition hover:bg-white/[0.08]"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied' : 'Copy invite'}
                </button>
              </div>
            </div>

            <aside className="self-center rounded-lg border border-white/10 bg-black/40 p-5">
              <div className="mb-5 rounded-lg border border-white/10 bg-neutral-900/80 p-4">
                <p className="text-xs uppercase tracking-wide text-neutral-500">Room title</p>
                <h2 className="mt-1 line-clamp-2 text-xl font-black text-white">{movieTitle || 'Watch Together'}</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-black text-white">
                    <MonitorPlay className="h-4 w-4 text-red-300" />
                    Screen sharing note
                  </h3>
                  <p className="mt-2 text-xs leading-5 text-neutral-400">
                    If protected video shows a black screen, that is expected DRM behavior. Use the OTT open button and watch separately while chatting here.
                  </p>
                </div>

                <div>
                  <h3 className="flex items-center gap-2 text-sm font-black text-white">
                    <Chrome className="h-4 w-4 text-sky-300" />
                    Browser performance
                  </h3>
                  <p className="mt-2 text-xs leading-5 text-neutral-400">
                    For lag or blank capture on non-protected content, browser graphics acceleration can sometimes affect sharing quality.
                  </p>
                  <button
                    onClick={() => setShowGuide(true)}
                    className="mt-3 rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-neutral-200 transition hover:bg-white/10"
                  >
                    Browser tips
                  </button>
                </div>
              </div>
            </aside>
          </section>
        </main>

        <AnimatePresence>
          {showGuide && (
            <BrowserGuideModal onClose={dismissGuide} />
          )}
        </AnimatePresence>
      </>
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
          <BrowserGuideModal onClose={dismissGuide} />
        )}
      </AnimatePresence>
    </>
  );
}

function BrowserGuideModal({ onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-lg rounded-lg border border-white/10 bg-neutral-900 p-6 shadow-2xl sm:p-8"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Close browser tips"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 flex items-center gap-3 text-red-400">
          <AlertTriangle className="h-7 w-7" />
          <h2 className="text-xl font-black text-white">Browser and OTT notes</h2>
        </div>

        <div className="space-y-4 text-sm text-neutral-300">
          <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-4">
            <h3 className="font-black text-amber-100">Protected playback may block screen sharing</h3>
            <p className="mt-2 text-xs leading-5 text-amber-100/80">
              DRM-protected services can show a black screen in screen share. Do not bypass DRM or share pirated streams. The safest flow is for everyone to open the title on the official OTT platform.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex gap-4 rounded-lg border border-white/5 bg-white/5 p-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-white">
                <Chrome className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-bold text-white">If sharing non-protected content has issues</h4>
                <p className="mt-1 text-xs leading-5 text-neutral-400">
                  Open Chrome, Edge, or Brave settings and search for graphics acceleration or hardware acceleration.
                </p>
              </div>
            </div>

            <div className="flex gap-4 rounded-lg border border-white/5 bg-white/5 p-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-white">
                <Power className="h-4 w-4 text-red-300" />
              </div>
              <div>
                <h4 className="font-bold text-white">Try toggling acceleration</h4>
                <p className="mt-1 text-xs leading-5 text-neutral-400">
                  Turning it off can help with browser capture glitches, lag, or blank windows for normal shareable content.
                </p>
              </div>
            </div>

            <div className="flex gap-4 rounded-lg border border-white/5 bg-white/5 p-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-white">
                <RefreshCw className="h-4 w-4 text-emerald-300" />
              </div>
              <div>
                <h4 className="font-bold text-white">Relaunch the browser</h4>
                <p className="mt-1 text-xs leading-5 text-neutral-400">
                  Browser setting changes usually need a relaunch. After that, return here and start the room.
                </p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-lg bg-red-600 py-3 text-sm font-black text-white transition-colors hover:bg-red-500"
        >
          Got it
        </button>
      </motion.div>
    </motion.div>
  );
}
