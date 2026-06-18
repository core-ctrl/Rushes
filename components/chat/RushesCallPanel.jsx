import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, Minimize2, Mic, MicOff, Video, VideoOff, PhoneOff, Phone, Monitor, AlertCircle } from 'lucide-react';
import { io } from 'socket.io-client';

const BACKEND_URL = process.env.NEXT_PUBLIC_RUSHES_CALL_URL || 'https://rushes-call.onrender.com';

/**
 * RushesCallPanel - Native Mediasoup SFU-powered call panel.
 * Replaces ZegoCallPanel completely. Connects to rushes-call.onrender.com
 */
export default function RushesCallPanel({
  roomID,
  mode = 'audio',
  otherUser,
  currentUser,
  onClose,
  isMinimized,
  onMinimize,
  onMaximize,
}) {
  const [status, setStatus] = useState('connecting'); // connecting | connected | error
  const [error, setError] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(mode !== 'video');
  const [remoteStreams, setRemoteStreams] = useState({}); // { peerId: MediaStream }
  const [rtpCapabilities, setRtpCapabilities] = useState(null);

  const socketRef = useRef(null);
  const deviceRef = useRef(null);
  const sendTransportRef = useRef(null);
  const recvTransportRef = useRef(null);
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const tokenRef = useRef(null);

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const createTransport = useCallback((direction) => {
    return new Promise((resolve, reject) => {
      socketRef.current.emit('webrtc:create-transport', { direction }, (data) => {
        if (data?.error || !data?.id) return reject(new Error('Failed to create transport'));
        resolve(data);
      });
    });
  }, []);

  const consumeProducer = useCallback(async (producerId, peerId) => {
    if (!deviceRef.current || !recvTransportRef.current) return;

    const params = await new Promise((resolve, reject) => {
      socketRef.current.emit('webrtc:consume', {
        producerId,
        rtpCapabilities: deviceRef.current.rtpCapabilities,
      }, (data) => {
        if (!data || data.error) return reject(new Error('Cannot consume'));
        resolve(data);
      });
    });

    const consumer = await recvTransportRef.current.consume({
      id: params.id,
      producerId: params.producerId,
      kind: params.kind,
      rtpParameters: params.rtpParameters,
    });

    // Tell server to resume (we start paused per server logic)
    socketRef.current.emit('webrtc:consumer-resume', { consumerId: consumer.id });

    setRemoteStreams(prev => {
      const stream = prev[peerId] ? prev[peerId] : new MediaStream();
      stream.addTrack(consumer.track);
      return { ...prev, [peerId]: stream };
    });
  }, []);

  // ─── Main Connection Logic ────────────────────────────────────────────────

  useEffect(() => {
    if (!roomID || !currentUser) return;
    let cancelled = false;

    const connect = async () => {
      try {
        // 1. Fetch JWT from our own Next.js backend (secret never exposed to client)
        const tokenRes = await fetch('/api/calls/rushes-token', { method: 'POST' });
        if (!tokenRes.ok) throw new Error('Failed to authenticate with call service');
        const { token } = await tokenRes.json();
        tokenRef.current = token;

        if (cancelled) return;

        // 2. Connect socket with JWT in handshake
        const socket = io(BACKEND_URL, {
          auth: { token },
          transports: ['websocket'],
        });
        socketRef.current = socket;

        socket.on('connect_error', (err) => {
          if (!cancelled) setError(`Connection failed: ${err.message}`);
          setStatus('error');
        });

        await new Promise((resolve, reject) => {
          socket.on('connect', resolve);
          socket.on('connect_error', reject);
        });

        if (cancelled) { socket.disconnect(); return; }

        // 3. Join the room — server returns rtpCapabilities + existingProducers
        const joinData = await new Promise((resolve, reject) => {
          socket.emit('webrtc:join-room', { roomId: roomID }, (data) => {
            if (!data || data.error) return reject(new Error(data?.message || 'Failed to join room'));
            resolve(data);
          });
        });

        if (cancelled) { socket.disconnect(); return; }

        // 4. Load mediasoup-client Device with router capabilities
        const { Device } = await import('mediasoup-client');
        const device = new Device();
        await device.load({ routerRtpCapabilities: joinData.rtpCapabilities });
        deviceRef.current = device;
        setRtpCapabilities(device.rtpCapabilities);

        // 5. Create Send Transport
        const sendParams = await createTransport('send');
        const sendTransport = device.createSendTransport(sendParams);
        sendTransportRef.current = sendTransport;

        sendTransport.on('connect', ({ dtlsParameters }, callback, errback) => {
          socket.emit('webrtc:connect-transport', {
            transportId: sendTransport.id,
            dtlsParameters,
          }, (res) => {
            if (res?.error) return errback(new Error(res.error));
            callback();
          });
        });

        sendTransport.on('produce', ({ kind, rtpParameters }, callback, errback) => {
          socket.emit('webrtc:produce', {
            transportId: sendTransport.id,
            kind,
            rtpParameters,
          }, (res) => {
            if (!res || res.error) return errback(new Error(res?.error || 'Produce failed'));
            callback({ id: res.id });
          });
        });

        // 6. Create Recv Transport
        const recvParams = await createTransport('recv');
        const recvTransport = device.createRecvTransport(recvParams);
        recvTransportRef.current = recvTransport;

        recvTransport.on('connect', ({ dtlsParameters }, callback, errback) => {
          socket.emit('webrtc:connect-transport', {
            transportId: recvTransport.id,
            dtlsParameters,
          }, (res) => {
            if (res?.error) return errback(new Error(res.error));
            callback();
          });
        });

        // 7. Get local media and produce
        const constraints = {
          audio: true,
          video: mode === 'video' ? { width: 640, height: 480, facingMode: 'user' } : false,
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        localStreamRef.current = stream;

        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) await sendTransport.produce({ track: audioTrack });

        if (mode === 'video') {
          const videoTrack = stream.getVideoTracks()[0];
          if (videoTrack) await sendTransport.produce({ track: videoTrack });
        }

        // 8. Consume existing producers
        if (joinData.existingProducers) {
          for (const { producerId, peerId } of joinData.existingProducers) {
            await consumeProducer(producerId, peerId);
          }
        }

        // 9. Listen for new producers
        socket.on('webrtc:new-producer', async ({ producerId, peerId }) => {
          await consumeProducer(producerId, peerId);
        });

        // 10. Listen for peers leaving
        socket.on('webrtc:user-left', ({ peerId }) => {
          setRemoteStreams(prev => {
            const updated = { ...prev };
            delete updated[peerId];
            return updated;
          });
        });
        socket.on('webrtc:peer-left', ({ peerId }) => {
          setRemoteStreams(prev => {
            const updated = { ...prev };
            delete updated[peerId];
            return updated;
          });
        });

        if (!cancelled) setStatus('connected');

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
      // Cleanup local media
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      // Close transports
      try { sendTransportRef.current?.close(); } catch {}
      try { recvTransportRef.current?.close(); } catch {}
      // Leave room
      if (socketRef.current?.connected && roomID) {
        socketRef.current.emit('webrtc:leave-room', { roomId: roomID });
        socketRef.current.disconnect();
      }
    };
  }, [roomID, currentUser, mode]);

  // ─── Controls ────────────────────────────────────────────────────────────

  const toggleMic = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsMuted(!track.enabled);
    }
  };

  const toggleCam = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsCamOff(!track.enabled);
    }
  };

  const handleLeave = () => {
    onClose?.();
  };

  if (!roomID) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={isMinimized
          ? "fixed bottom-24 right-4 z-[100] w-72 h-48 bg-neutral-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
          : "fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl"
        }
        drag={isMinimized}
        dragConstraints={{ left: -1000, right: 0, top: -1000, bottom: 0 }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        {/* ── Header ── */}
        <div className={`absolute top-0 left-0 right-0 z-20 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent ${isMinimized ? 'p-2' : 'p-4'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${mode === 'video' ? 'bg-blue-600/30' : 'bg-green-600/30'}`}>
              {mode === 'video' ? <Video className="w-4 h-4 text-blue-400" /> : <Phone className="w-4 h-4 text-green-400" />}
            </div>
            <div>
              <p className={`text-white font-semibold leading-tight ${isMinimized ? 'text-xs' : 'text-sm'}`}>
                {mode === 'video' ? 'Video Call' : 'Voice Call'}
                {!isMinimized && ` with @${otherUser?.username || 'User'}`}
              </p>
              {!isMinimized && (
                <p className={`text-xs mt-0.5 ${status === 'connected' ? 'text-green-400' : status === 'error' ? 'text-red-400' : 'text-yellow-400'}`}>
                  {status === 'connected' ? '● Connected' : status === 'error' ? '● Error' : '● Connecting...'}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isMinimized ? (
              <button onClick={onMaximize} className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-all">
                <Maximize2 className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={onMinimize} className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-all">
                <Minimize2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* ── Error State ── */}
        {status === 'error' && (
          <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400" />
            <p className="text-white font-semibold">Call Failed</p>
            <p className="text-neutral-400 text-sm">{error}</p>
            <button onClick={handleLeave} className="px-6 py-2 rounded-xl bg-white/10 text-white text-sm hover:bg-white/20 transition-colors">
              Close
            </button>
          </div>
        )}

        {/* ── Connecting State ── */}
        {status === 'connecting' && !error && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-center">
              <img
                src={otherUser?.avatar || '/avatar.svg'}
                alt=""
                className="w-24 h-24 rounded-full object-cover border-4 border-white/10 mx-auto mb-4 animate-pulse"
              />
              <p className="text-white font-bold text-lg mb-1">Calling @{otherUser?.username || 'User'}...</p>
              <div className="flex justify-center gap-1 mt-3">
                {[0, 1, 2].map(i => (
                  <motion.span
                    key={i}
                    className="w-2 h-2 rounded-full bg-white"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Connected: Video Grid ── */}
        {status === 'connected' && !isMinimized && (
          <div className="w-full h-full flex flex-col bg-neutral-950">
            {/* Video area */}
            <div className="flex-1 relative flex items-center justify-center gap-4 p-6 flex-wrap">
              {/* Local */}
              {mode === 'video' && (
                <div className="relative rounded-2xl overflow-hidden bg-neutral-900 border border-white/10 shadow-xl"
                  style={{ width: Object.keys(remoteStreams).length === 0 ? '80%' : '45%', aspectRatio: '16/9' }}>
                  <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
                  {isCamOff && (
                    <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
                      <img src={currentUser?.avatar || '/avatar.svg'} className="w-16 h-16 rounded-full object-cover" alt="You" />
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg">You</div>
                  {isMuted && <div className="absolute top-2 right-2 bg-red-600 rounded-full p-1"><MicOff className="w-3 h-3 text-white" /></div>}
                </div>
              )}

              {/* Remote streams */}
              {Object.entries(remoteStreams).map(([peerId, stream]) => (
                <div key={peerId}
                  className="relative rounded-2xl overflow-hidden bg-neutral-900 border border-white/10 shadow-xl"
                  style={{ width: mode === 'video' ? '45%' : '60%', aspectRatio: '16/9' }}>
                  <video
                    ref={el => { if (el && stream) el.srcObject = stream; }}
                    autoPlay playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg">
                    @{otherUser?.username || 'User'}
                  </div>
                </div>
              ))}

              {/* Audio-only view */}
              {mode === 'audio' && Object.keys(remoteStreams).length === 0 && (
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <img src={otherUser?.avatar || '/avatar.svg'} className="w-32 h-32 rounded-full object-cover border-4 border-white/10" alt={otherUser?.username} />
                    <motion.div
                      className="absolute inset-0 rounded-full border-4 border-green-500/40"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                  <p className="text-white font-bold text-xl">@{otherUser?.username}</p>
                  <p className="text-green-400 text-sm">● Connected</p>
                </div>
              )}

              {/* Hidden audio elements for remote streams in audio mode */}
              {mode === 'audio' && Object.entries(remoteStreams).map(([peerId, stream]) => (
                <audio key={peerId} ref={el => { if (el) el.srcObject = stream; }} autoPlay />
              ))}
            </div>

            {/* ── Control Bar ── */}
            <div className="p-4 border-t border-white/5 flex items-center justify-center gap-4">
              <button
                onClick={toggleMic}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-red-600 hover:bg-red-500' : 'bg-white/10 hover:bg-white/20'}`}
              >
                {isMuted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
              </button>

              {mode === 'video' && (
                <button
                  onClick={toggleCam}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isCamOff ? 'bg-red-600 hover:bg-red-500' : 'bg-white/10 hover:bg-white/20'}`}
                >
                  {isCamOff ? <VideoOff className="w-5 h-5 text-white" /> : <Video className="w-5 h-5 text-white" />}
                </button>
              )}

              <button
                onClick={handleLeave}
                className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center transition-all shadow-lg shadow-red-600/30"
              >
                <PhoneOff className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        )}

        {/* Minimized view control bar */}
        {isMinimized && status === 'connected' && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2 z-20">
            <button onClick={toggleMic} className={`w-8 h-8 rounded-full flex items-center justify-center ${isMuted ? 'bg-red-600' : 'bg-white/20'}`}>
              {isMuted ? <MicOff className="w-3.5 h-3.5 text-white" /> : <Mic className="w-3.5 h-3.5 text-white" />}
            </button>
            <button onClick={handleLeave} className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
              <PhoneOff className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
