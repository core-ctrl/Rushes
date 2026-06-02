import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Video, X, PhoneOff } from 'lucide-react';

export default function IncomingCallModal({ callData, onAccept, onDecline }) {
  const [timeLeft, setTimeLeft] = useState(30);
  const timerRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!callData) return;

    // Auto-decline after 30 seconds
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onDecline?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Try to play ringtone (browser may block autoplay)
    try {
      audioRef.current = new Audio('/ringtone.mp3');
      audioRef.current.loop = true;
      audioRef.current.volume = 0.5;
      audioRef.current.play().catch(() => {});
    } catch {}

    return () => {
      clearInterval(timerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [callData]);

  if (!callData) return null;

  const { callerName, callerAvatar, callMode } = callData;
  const isVideo = callMode === 'video';

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[150] flex items-center justify-center bg-black/85 backdrop-blur-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Pulsing rings behind avatar */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={`absolute rounded-full border-2 ${isVideo ? 'border-blue-500/30' : 'border-green-500/30'}`}
              initial={{ width: 120, height: 120, opacity: 0.6 }}
              animate={{
                width: [120, 200 + i * 60],
                height: [120, 200 + i * 60],
                opacity: [0.6, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.6,
                ease: 'easeOut',
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ scale: 0.8, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 30 }}
          className="relative z-10 flex flex-col items-center text-center px-8"
        >
          {/* Avatar */}
          <motion.div
            className="relative mb-6"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <img
              src={callerAvatar || '/avatar.svg'}
              alt=""
              className="w-28 h-28 rounded-full object-cover border-4 border-white/20 shadow-2xl"
            />
            <div className={`absolute -top-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center ${isVideo ? 'bg-blue-600' : 'bg-green-600'} shadow-lg`}>
              {isVideo ? <Video className="w-4 h-4 text-white" /> : <Phone className="w-4 h-4 text-white" />}
            </div>
          </motion.div>

          {/* Caller info */}
          <p className="text-white font-bold text-2xl mb-1">
            {callerName || 'Someone'}
          </p>
          <p className="text-neutral-400 text-sm mb-1">
            Incoming {isVideo ? 'Video' : 'Voice'} Call
          </p>
          <p className="text-neutral-600 text-xs mb-8">
            Auto-declining in {timeLeft}s
          </p>

          {/* Accept / Decline buttons */}
          <div className="flex items-center gap-8">
            {/* Decline */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onDecline}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/30 hover:bg-red-500 transition-colors">
                <PhoneOff className="w-7 h-7 text-white" />
              </div>
              <span className="text-neutral-400 text-xs font-medium">Decline</span>
            </motion.button>

            {/* Accept */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onAccept}
              className="flex flex-col items-center gap-2"
            >
              <motion.div
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-colors ${isVideo ? 'bg-blue-600 shadow-blue-600/30 hover:bg-blue-500' : 'bg-green-600 shadow-green-600/30 hover:bg-green-500'}`}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Phone className="w-7 h-7 text-white" />
              </motion.div>
              <span className="text-neutral-400 text-xs font-medium">Accept</span>
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
