import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { Film, Users, Send, Copy, Check, ExternalLink, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import { supabase } from '../../lib/supabase';
import { toast } from '../../components/ui/Toaster';
import axios from 'axios';

export default function WatchTogetherRoom() {
  const router = useRouter();
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
  const bottomRef = useRef(null);
  const channelRef = useRef(null);
  const zegoContainerRef = useRef(null);
  const zpRef = useRef(null);

  // Initialize ZEGOCLOUD for Watch Together (voice chat while watching)
  useEffect(() => {
    if (!roomId || !user || !zegoContainerRef.current) return;
    let cancelled = false;

    const initZego = async () => {
      try {
        const { data } = await axios.post('/api/watch-together/token', { roomID: `wt_${roomId}` });
        if (cancelled) return;

        const { ZegoUIKitPrebuilt } = await import('@zegocloud/zego-uikit-prebuilt');

        const zp = ZegoUIKitPrebuilt.create(data.appID, data.token);
        zpRef.current = zp;

        zp.joinRoom({
          container: zegoContainerRef.current,
          scenario: {
            mode: ZegoUIKitPrebuilt.GroupCall,
          },
          turnOnMicrophoneWhenJoining: true,
          turnOnCameraWhenJoining: false,
          showMyCameraToggleButton: true,
          showMyMicrophoneToggleButton: true,
          showAudioVideoSettingsButton: false,
          showScreenSharingButton: true,
          showTextChat: false,
          showUserList: false,
          maxUsers: 10,
          layout: 'Auto',
          showLayoutButton: false,
          showPreJoinView: false,
          onLeaveRoom: () => {
            router.push('/');
          },
        });

        setZegoReady(true);
      } catch (err) {
        console.error('Watch Together init error:', err);
        toast({ type: 'error', message: 'Failed to connect to Watch Together room.' });
      }
    };

    initZego();

    return () => {
      cancelled = true;
      if (zpRef.current) {
        try { zpRef.current.destroy(); } catch {}
        zpRef.current = null;
      }
    };
  }, [roomId, user]);

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
              <button
                onClick={copyInvite}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-neutral-400 text-xs hover:bg-white/5 transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                Invite
              </button>
            </div>
          </div>

          {/* ZEGOCLOUD video/voice panel */}
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
            <div ref={zegoContainerRef} className="w-full h-full" />
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
    </>
  );
}
