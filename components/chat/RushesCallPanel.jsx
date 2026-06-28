import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Maximize2, Minimize2, Mic, MicOff, Video, VideoOff,
  PhoneOff, Phone, Volume2, VolumeX, Wifi, WifiOff, AlertCircle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

// Free STUN/TURN servers for NAT traversal
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject'
  },
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject'
  },
  {
    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject'
  },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
];

function useCallTimer(active) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!active) { setSeconds(0); return; }
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [active]);
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

/**
 * RushesCallPanel — Premium P2P WebRTC call UI.
 * Connects to the signaling server on Render, then establishes
 * a direct peer-to-peer connection for audio/video.
 */
export default function RushesCallPanel({
  roomID, mode = 'audio', otherUser, currentUser,
  onClose, isMinimized, onMinimize, onMaximize,
}) {
  const [status, setStatus] = useState('connecting'); // connecting | ringing | connected | error
  const [error, setError] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(mode !== 'video');
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState({}); // { peerId: MediaStream }
  const [hasRemote, setHasRemote] = useState(false);

  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const remotePeerIdRef = useRef(null);
  const makingOfferRef = useRef(false);
  const isSettingRemoteRef = useRef(false);

  const callTimer = useCallTimer(status === 'connected');

  // Apply speaker mute to remote audio
  useEffect(() => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = isSpeakerMuted;
    }
  }, [isSpeakerMuted]);

  // ─── Create RTCPeerConnection ──────────────────────────────────────────────

  const createPeerConnection = useCallback((channel, peerId) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    remotePeerIdRef.current = peerId;

    // Send ICE candidates to remote peer via signaling server
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        channel.send({
          type: 'broadcast',
          event: 'webrtc_ice_candidate',
          payload: {
            targetId: peerId,
            senderId: currentUser?.id || currentUser?._id,
            candidate: candidate.toJSON(),
          }
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      if (state === 'connected' || state === 'completed') {
        setStatus('connected');
      } else if (state === 'failed') {
        setError('Connection failed. The other user may be behind a strict firewall.');
        setStatus('error');
      } else if (state === 'disconnected') {
        // Brief disconnection — ICE may recover
        setTimeout(() => {
          if (pc.iceConnectionState === 'disconnected') {
            setError('Connection lost.');
            setStatus('error');
          }
        }, 60000);
      }
    };

    // Receive remote tracks
    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) {
        setRemoteStreams((prev) => ({ ...prev, [peerId]: stream }));
        setHasRemote(true);
      }
    };

    return pc;
  }, []);

  // ─── Main Connection Logic ────────────────────────────────────────────────

  useEffect(() => {
    if (!roomID || !currentUser) return;
    let cancelled = false;

    const connect = async () => {
      try {
        // 1. Get local media (audio, and video if video call) FIRST to avoid missing offers during permission prompt
        const constraints = {
          audio: true,
          video: mode === 'video' ? { width: 1280, height: 720, facingMode: 'user' } : false,
        };
        const localStream = await navigator.mediaDevices.getUserMedia(constraints);
        localStreamRef.current = localStream;
        if (localVideoRef.current) localVideoRef.current.srcObject = localStream;

        if (cancelled) {
          localStream.getTracks().forEach((t) => t.stop());
          return;
        }

        // 2. Set up Supabase Realtime Channel
        const currentUserId = currentUser.id || currentUser._id;
        const channel = supabase.channel(`webrtc:${roomID}`);
        socketRef.current = channel; // Reusing socketRef for channel to avoid huge refactors in cleanup

        // 3. Helper: set up a peer connection with a specific remote peer
        const setupPeerConnection = (peerId) => {
          const pc = createPeerConnection(channel, peerId);
          peerConnectionRef.current = pc;

          // Add local tracks to the peer connection
          localStream.getTracks().forEach((track) => {
            pc.addTrack(track, localStream);
          });

          return pc;
        };

        // Handle incoming offer from remote peer
        channel.on('broadcast', { event: 'webrtc_offer' }, async ({ payload }) => {
          if (cancelled) return;
          const { senderId, targetId, sdp } = payload;
          if (targetId !== currentUserId) return;

          let pc = peerConnectionRef.current;
          if (!pc || pc.connectionState === 'closed') {
            pc = setupPeerConnection(senderId);
          }

          try {
            isSettingRemoteRef.current = true;
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            isSettingRemoteRef.current = false;
            
            // Process queued ICE candidates
            if (pc.iceQueue) {
              for (const cand of pc.iceQueue) {
                await pc.addIceCandidate(new RTCIceCandidate(cand));
              }
              pc.iceQueue = [];
            }

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            channel.send({
              type: 'broadcast',
              event: 'webrtc_answer',
              payload: {
                targetId: senderId,
                senderId: currentUserId,
                sdp: pc.localDescription.toJSON(),
              }
            });
          } catch (err) {
            isSettingRemoteRef.current = false;
            console.error('Error handling offer:', err);
          }
        });

        // Handle incoming answer from remote peer
        channel.on('broadcast', { event: 'webrtc_answer' }, async ({ payload }) => {
          if (cancelled) return;
          const { senderId, targetId, sdp } = payload;
          if (targetId !== currentUserId) return;
          const pc = peerConnectionRef.current;
          if (!pc) return;

          try {
            isSettingRemoteRef.current = true;
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            isSettingRemoteRef.current = false;
            
            // Process queued ICE candidates
            if (pc.iceQueue) {
              for (const cand of pc.iceQueue) {
                await pc.addIceCandidate(new RTCIceCandidate(cand));
              }
              pc.iceQueue = [];
            }
          } catch (err) {
            isSettingRemoteRef.current = false;
            console.error('Error handling answer:', err);
          }
        });

        // Handle incoming ICE candidates
        channel.on('broadcast', { event: 'webrtc_ice_candidate' }, async ({ payload }) => {
          if (cancelled) return;
          const { senderId, targetId, candidate } = payload;
          if (targetId !== currentUserId) return;
          const pc = peerConnectionRef.current;
          if (!pc) return;

          try {
            if (candidate) {
              if (pc.remoteDescription) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
              } else {
                // Queue candidate until remote description is set
                if (!pc.iceQueue) pc.iceQueue = [];
                pc.iceQueue.push(candidate);
              }
            }
          } catch (err) {
            if (!isSettingRemoteRef.current) {
              console.warn('ICE candidate error:', err.message);
            }
          }
        });

        // Handle new peer joining (we become the initiator)
        channel.on('broadcast', { event: 'webrtc_user_joined' }, async ({ payload }) => {
          if (cancelled) return;
          const { userId } = payload;
          if (userId === currentUserId) return;

          const pc = setupPeerConnection(userId);

          try {
            makingOfferRef.current = true;
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            channel.send({
              type: 'broadcast',
              event: 'webrtc_offer',
              payload: {
                targetId: userId,
                senderId: currentUserId,
                sdp: pc.localDescription.toJSON(),
              }
            });
            makingOfferRef.current = false;
          } catch (err) {
            makingOfferRef.current = false;
            console.error('Error creating offer:', err);
          }
        });

        // Handle peer leaving
        const handlePeerLeft = ({ payload }) => {
          const id = payload?.userId || payload?.peerId;
          if (!id) return;
          setRemoteStreams((prev) => {
            const updated = { ...prev };
            delete updated[id];
            if (Object.keys(updated).length === 0) setHasRemote(false);
            return updated;
          });

          if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
          }
        };
        channel.on('broadcast', { event: 'webrtc_user_left' }, handlePeerLeft);

        // 4. Subscribe to the channel now that listeners are active
        await new Promise((resolve, reject) => {
          channel.subscribe(async (status, err) => {
            if (status === 'SUBSCRIBED') {
              resolve();
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              reject(new Error(err?.message || 'Failed to connect to signaling channel'));
            }
          });
        });

        if (cancelled) { supabase.removeChannel(channel); return; }
        setStatus('ringing');

        // 5. Announce that we joined (now that we are subscribed and have media)
        channel.send({
          type: 'broadcast',
          event: 'webrtc_user_joined',
          payload: { userId: currentUserId }
        });

      } catch (err) {
        console.error('RushesCallPanel error:', err);
        if (!cancelled) {
          setError(err.message || 'Failed to connect to call');
          setStatus('error');
        }
      }
    };

    connect();

    return () => {
      cancelled = true;
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.send({
          type: 'broadcast',
          event: 'webrtc_user_left',
          payload: { userId: currentUser?.id || currentUser?._id }
        });
        supabase.removeChannel(socketRef.current);
      }
    };
  }, [roomID, currentUser, mode, createPeerConnection]);

  // ─── Controls ────────────────────────────────────────────────────────────

  const toggleMic = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setIsMuted(!track.enabled); }
  };

  const toggleCam = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setIsCamOff(!track.enabled); }
  };

  const toggleSpeaker = () => setIsSpeakerMuted((s) => !s);

  const handleLeave = () => onClose?.();

  if (!roomID) return null;

  // ─── Minimized floating pill ──────────────────────────────────────────────
  if (isMinimized) {
    return (
      <motion.div
        drag
        dragMomentum={false}
        dragConstraints={{ left: -1200, right: 0, top: -800, bottom: 0 }}
        className="fixed bottom-28 right-4 z-[100] w-64 cursor-grab active:cursor-grabbing"
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        style={{ borderRadius: 20 }}
      >
        <div
          className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
          style={{
            background: 'linear-gradient(145deg, rgba(15,15,15,0.97), rgba(8,8,8,0.97))',
            boxShadow: status === 'connected'
              ? '0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06), 0 0 40px rgba(34,197,94,0.08)'
              : '0 20px 60px rgba(0,0,0,0.7)',
          }}
        >
          {/* Top row: avatar + name + status */}
          <button
            onClick={onMaximize}
            className="flex w-full items-center gap-3 p-3 text-left hover:bg-white/5 transition-colors"
          >
            <div className="relative flex-shrink-0">
              <img
                src={otherUser?.avatar || '/avatar.svg'}
                alt=""
                className="h-10 w-10 rounded-full object-cover border border-white/10"
              />
              <span
                className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#0f0f0f] ${
                  status === 'connected' ? 'bg-green-400' : 'bg-yellow-400'
                }`}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">
                {otherUser?.username || 'User'}
              </p>
              <p className={`text-xs font-semibold ${
                status === 'connected' ? 'text-green-400' : 'text-yellow-400'
              }`}>
                {status === 'connected' ? `● ${callTimer}` : status === 'ringing' ? '● Ringing...' : '● Connecting...'}
              </p>
            </div>
            <Maximize2 className="h-4 w-4 flex-shrink-0 text-neutral-500" />
          </button>

          {/* Controls row */}
          <div className="flex items-center justify-center gap-2 border-t border-white/5 px-3 py-2.5">
            <button
              onClick={toggleMic}
              className={`flex h-9 w-9 items-center justify-center rounded-full transition-all ${
                isMuted ? 'bg-red-600 text-white' : 'bg-white/10 text-neutral-300 hover:bg-white/20'
              }`}
            >
              {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
            {mode === 'video' && (
              <button
                onClick={toggleCam}
                className={`flex h-9 w-9 items-center justify-center rounded-full transition-all ${
                  isCamOff ? 'bg-red-600 text-white' : 'bg-white/10 text-neutral-300 hover:bg-white/20'
                }`}
              >
                {isCamOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
              </button>
            )}
            <button
              onClick={handleLeave}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-red-600/30 hover:bg-red-500 transition-all"
            >
              <PhoneOff className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Always-rendered audio elements (work even when minimized) */}
        {Object.entries(remoteStreams).map(([peerId, stream]) => (
          <audio
            key={peerId}
            ref={(el) => {
              if (el) { el.srcObject = stream; el.muted = isSpeakerMuted; remoteAudioRef.current = el; }
            }}
            autoPlay
          />
        ))}
      </motion.div>
    );
  }

  // ─── Full-screen panel ─────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex flex-col overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #050505 0%, #0a0a0a 100%)' }}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
      >
        {/* Ambient glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: mode === 'video'
              ? 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(59,130,246,0.08) 0%, transparent 70%)'
              : 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(34,197,94,0.07) 0%, transparent 70%)',
          }}
        />

        {/* ── Header ── */}
        <div className="relative z-10 flex flex-shrink-0 items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full ${
                mode === 'video' ? 'bg-blue-600/20' : 'bg-green-600/20'
              }`}
            >
              {mode === 'video'
                ? <Video className="h-4 w-4 text-blue-400" />
                : <Phone className="h-4 w-4 text-green-400" />}
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                {mode === 'video' ? 'Video Call' : 'Voice Call'}
                {otherUser?.username && (
                  <span className="ml-1 font-normal text-neutral-400">
                    with @{otherUser.username}
                  </span>
                )}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <motion.span
                  className={`h-1.5 w-1.5 rounded-full ${
                    status === 'connected' ? 'bg-green-400' :
                    status === 'error' ? 'bg-red-400' : 'bg-yellow-400'
                  }`}
                  animate={{ opacity: status === 'connected' ? 1 : [1, 0.3, 1] }}
                  transition={{ duration: 1.2, repeat: status !== 'connected' ? Infinity : 0 }}
                />
                <span className={`text-xs font-semibold ${
                  status === 'connected' ? 'text-green-400' :
                  status === 'error' ? 'text-red-400' : 'text-yellow-400'
                }`}>
                  {status === 'connected'
                    ? callTimer
                    : status === 'ringing' ? 'Ringing...'
                    : status === 'error' ? 'Error'
                    : 'Connecting...'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onMinimize}
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 transition-all hover:bg-white/10 hover:text-white"
          >
            <Minimize2 className="h-5 w-5" />
          </button>
        </div>

        {/* ── Error State ── */}
        {status === 'error' && (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-600/10 border border-red-500/20">
              <AlertCircle className="h-10 w-10 text-red-400" />
            </div>
            <div>
              <p className="text-xl font-black text-white mb-2">Call Failed</p>
              <p className="text-neutral-400 text-sm max-w-xs">{error}</p>
            </div>
            <button
              onClick={handleLeave}
              className="rounded-2xl border border-white/10 bg-white/8 px-8 py-3 text-sm font-bold text-white transition-colors hover:bg-white/15"
            >
              Close
            </button>
          </div>
        )}

        {/* ── Connecting / Ringing State ── */}
        {(status === 'connecting' || status === 'ringing') && !error && (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 relative">
            {/* Avatar with pulse rings */}
            <div className="relative flex items-center justify-center">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full border border-white/10"
                  initial={{ width: 120, height: 120, opacity: 0.6 }}
                  animate={{ width: [120, 180 + i * 50], height: [120, 180 + i * 50], opacity: [0.6, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.55, ease: 'easeOut' }}
                />
              ))}
              <img
                src={otherUser?.avatar || '/avatar.svg'}
                alt=""
                className="relative h-28 w-28 rounded-full border-2 border-white/15 object-cover shadow-2xl"
              />
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-white mb-1">@{otherUser?.username || 'User'}</p>
              <div className="flex items-center justify-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="h-2 w-2 rounded-full bg-neutral-400"
                    animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
              <p className="mt-2 text-sm text-neutral-500">
                {status === 'ringing' ? 'Ringing...' : 'Connecting...'}
              </p>
            </div>
            {/* Cancel Button */}
            <div className="absolute bottom-10">
              <button
                onClick={handleLeave}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-xl shadow-red-600/30 hover:bg-red-500 hover:scale-105 transition-all"
              >
                <PhoneOff className="h-6 w-6" />
              </button>
            </div>
          </div>
        )}

        {/* ── Connected State ── */}
        {status === 'connected' && (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Media area */}
            <div className="flex flex-1 items-center justify-center gap-4 p-5 flex-wrap">

              {/* Video mode: local tile */}
              {mode === 'video' && (
                <motion.div
                  layout
                  className="relative overflow-hidden rounded-3xl border border-white/8 bg-neutral-900 shadow-2xl"
                  style={{
                    width: Object.keys(remoteStreams).length === 0 ? '72%' : '46%',
                    aspectRatio: '16/9',
                    boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
                  }}
                >
                  <video ref={localVideoRef} autoPlay muted playsInline className="h-full w-full object-cover scale-x-[-1]" />
                  {isCamOff && (
                    <div className="absolute inset-0 flex items-center justify-center bg-neutral-950">
                      <img src={currentUser?.avatar || '/avatar.svg'} className="h-16 w-16 rounded-full object-cover opacity-60" alt="You" />
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-xl bg-black/60 px-2.5 py-1 backdrop-blur-sm">
                    {isMuted && <MicOff className="h-3 w-3 text-red-400" />}
                    <span className="text-xs font-semibold text-white">You</span>
                  </div>
                </motion.div>
              )}

              {/* Remote video streams */}
              {mode === 'video' && Object.entries(remoteStreams).map(([peerId, stream]) => (
                <motion.div
                  key={peerId}
                  layout
                  className="relative overflow-hidden rounded-3xl border border-white/8 bg-neutral-900 shadow-2xl"
                  style={{
                    width: '46%',
                    aspectRatio: '16/9',
                    boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
                  }}
                >
                  <video
                    ref={(el) => { if (el && stream) el.srcObject = stream; }}
                    autoPlay playsInline
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute bottom-3 left-3 rounded-xl bg-black/60 px-2.5 py-1 backdrop-blur-sm">
                    <span className="text-xs font-semibold text-white">@{otherUser?.username || 'User'}</span>
                  </div>
                </motion.div>
              ))}

              {/* Audio-only: avatar + animated rings */}
              {mode === 'audio' && (
                <div className="flex flex-col items-center gap-6">
                  <div className="relative flex items-center justify-center">
                    {/* Animated rings when remote is connected */}
                    {hasRemote && [0, 1].map((i) => (
                      <motion.div
                        key={i}
                        className="absolute rounded-full border-2 border-green-500/20"
                        animate={{ scale: [1, 1.5 + i * 0.3], opacity: [0.5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.7, ease: 'easeOut' }}
                        style={{ width: 150, height: 150 }}
                      />
                    ))}
                    <img
                      src={otherUser?.avatar || '/avatar.svg'}
                      className="relative h-36 w-36 rounded-full border-4 border-white/10 object-cover shadow-2xl"
                      alt={otherUser?.username}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-black text-white mb-1">@{otherUser?.username || 'User'}</p>
                    <p className={`text-sm font-semibold ${hasRemote ? 'text-green-400' : 'text-yellow-400'}`}>
                      {hasRemote ? `● Connected · ${callTimer}` : '● Waiting for other party...'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ── Control Bar ── */}
            <div className="flex-shrink-0 flex items-center justify-center pb-8 pt-4">
              <motion.div
                className="flex items-center gap-3 rounded-full border border-white/8 px-6 py-3"
                style={{
                  background: 'rgba(15,15,15,0.85)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
                }}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring', damping: 20 }}
              >
                {/* Mic */}
                <ControlButton
                  onClick={toggleMic}
                  active={isMuted}
                  activeColor="red"
                  label={isMuted ? 'Unmute' : 'Mute'}
                  icon={isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                />

                {/* Camera (video mode only) */}
                {mode === 'video' && (
                  <ControlButton
                    onClick={toggleCam}
                    active={isCamOff}
                    activeColor="red"
                    label={isCamOff ? 'Start Cam' : 'Stop Cam'}
                    icon={isCamOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                  />
                )}

                {/* Speaker */}
                <ControlButton
                  onClick={toggleSpeaker}
                  active={isSpeakerMuted}
                  activeColor="red"
                  label={isSpeakerMuted ? 'Unmute Speaker' : 'Mute Speaker'}
                  icon={isSpeakerMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                />

                {/* Minimize */}
                <ControlButton
                  onClick={onMinimize}
                  active={false}
                  label="Minimize"
                  icon={<Minimize2 className="h-5 w-5" />}
                />

                {/* End call */}
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={handleLeave}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-red-600/30 transition-colors hover:bg-red-500"
                  title="End call"
                >
                  <PhoneOff className="h-6 w-6" />
                </motion.button>
              </motion.div>
            </div>
          </div>
        )}

        {/* ── Always-rendered audio elements (outside isMinimized gate) ── */}
        {Object.entries(remoteStreams).map(([peerId, stream]) => (
          <audio
            key={peerId}
            ref={(el) => {
              if (el) { el.srcObject = stream; el.muted = isSpeakerMuted; remoteAudioRef.current = el; }
            }}
            autoPlay
            className="hidden"
          />
        ))}
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Control Button helper ─────────────────────────────────────────────────

function ControlButton({ onClick, active, activeColor = 'red', label, icon }) {
  const bg = active
    ? activeColor === 'red' ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'
    : 'bg-white/10 hover:bg-white/20';
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      title={label}
      className={`flex h-12 w-12 items-center justify-center rounded-full text-white transition-all ${bg}`}
    >
      {icon}
    </motion.button>
  );
}
