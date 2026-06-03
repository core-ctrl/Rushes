import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, Minimize2, Phone, Video, X } from 'lucide-react';
import axios from 'axios';

export default function ZegoCallPanel({ roomID, mode, otherUser, currentUser, onClose, isMinimized, onMinimize, onMaximize, isWatchTogether, movieTitle }) {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const zpRef = useRef(null);
  const currentUserId = currentUser?.id || currentUser?._id;

  useEffect(() => {
    if (!roomID || !currentUserId || !containerRef.current) return;

    let cancelled = false;

    const initCall = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get token from server (secret stays server-side)
        const { data } = await axios.post('/api/calls/token', { roomID });

        if (cancelled) return;

        // Dynamically import ZEGOCLOUD (client-only)
        const { ZegoUIKitPrebuilt } = await import('@zegocloud/zego-uikit-prebuilt');

        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          data.appID,
          data.serverSecret,
          data.roomID,
          String(data.userID),
          data.userName
        );

        const zp = ZegoUIKitPrebuilt.create(kitToken);
        zpRef.current = zp;

        zp.joinRoom({
          container: containerRef.current,
          scenario: {
            mode: isWatchTogether 
              ? ZegoUIKitPrebuilt.GroupCall 
              : (mode === 'video' ? ZegoUIKitPrebuilt.VideoConference : ZegoUIKitPrebuilt.OneONoneCall),
          },
          turnOnMicrophoneWhenJoining: isWatchTogether ? false : true,
          turnOnCameraWhenJoining: mode === 'video',
          showMyCameraToggleButton: mode === 'video',
          showAudioVideoSettingsButton: true,
          showScreenSharingButton: isWatchTogether ? true : mode === 'video',
          showTextChat: false,
          showUserList: false,
          maxUsers: isWatchTogether ? 10 : 2,
          layout: 'Auto',
          showLayoutButton: false,
          showPreJoinView: false,
          onLeaveRoom: () => {
            onClose?.();
          },
        });

        setLoading(false);
      } catch (err) {
        console.error('Call init error:', err);
        if (!cancelled) {
          const errMsg = err.response?.data?.error || err.message || 'Failed to start call. Please try again.';
          setError(`Error: ${errMsg}`);
          setLoading(false);
        }
      }
    };

    initCall();

    return () => {
      cancelled = true;
      if (zpRef.current) {
        try { zpRef.current.destroy(); } catch {}
        zpRef.current = null;
      }
    };
  }, [roomID, currentUserId, mode, isWatchTogether]);

  if (!roomID) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={isMinimized
          ? "fixed bottom-24 right-4 z-[100] w-72 h-48 bg-neutral-900 rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
          : (isWatchTogether ? "fixed top-20 left-0 bottom-0 right-0 lg:right-80 z-[40] bg-black" : "fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl")
        }
        drag={isMinimized}
        dragConstraints={{ left: -1000, right: 0, top: -1000, bottom: 0 }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        {/* Header */}
        <div className={`absolute top-0 left-0 right-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent ${isMinimized ? 'p-2' : 'p-4'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isWatchTogether ? 'bg-red-600/20' : (mode === 'video' ? 'bg-blue-600/20' : 'bg-green-600/20')}`}>
              {isWatchTogether ? <Video className="w-5 h-5 text-red-400" /> : (mode === 'video' ? <Video className="w-5 h-5 text-blue-400" /> : <Phone className="w-5 h-5 text-green-400" />)}
            </div>
            <div>
              <p className={`text-white font-semibold ${isMinimized ? 'text-xs' : 'text-sm'}`}>
                {isWatchTogether ? 'Watch Party' : (mode === 'video' ? 'Video Call' : 'Voice Call')} {isMinimized ? '' : (isWatchTogether ? ` - ${movieTitle}` : `with @${otherUser?.username || 'User'}`)}
              </p>
              {!isMinimized && (
                <p className="text-neutral-500 text-xs">
                  {loading ? 'Connecting...' : 'Connected'}
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
            <button
              onClick={onClose}
              className={`rounded-lg text-red-400 hover:text-white hover:bg-red-500 transition-all ${isMinimized ? 'p-1.5 bg-red-500/20' : 'p-2'}`}
            >
              <X className={isMinimized ? "w-4 h-4" : "w-5 h-5"} />
            </button>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-xl bg-white/10 text-white text-sm hover:bg-white/20 transition-colors"
            >
              Close
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <img
                src={otherUser?.avatar || '/avatar.svg'}
                alt=""
                className="w-24 h-24 rounded-full object-cover border-4 border-white/10 mx-auto mb-4"
              />
              <p className="text-white font-bold text-lg mb-1">
                Calling @{otherUser?.username || 'User'}...
              </p>
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

        {/* ZEGO container */}
        <div
          ref={containerRef}
          className="w-full h-full"
          style={{ display: loading || error ? 'none' : 'block' }}
        />
      </motion.div>
    </AnimatePresence>
  );
}
