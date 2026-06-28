import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Video, PhoneOff } from 'lucide-react';

export default function IncomingCallModal({ callerName, callerAvatar, mode, onAccept, onDecline }) {
  const [timeLeft, setTimeLeft] = useState(30);
  const timerRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    setTimeLeft(30);

    // Auto-decline countdown
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onDecline?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Try ringtone
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
  }, []);

  const callMode = mode;
  const isVideo = callMode === 'video';
  const accentColor = isVideo ? '#3b82f6' : '#22c55e';
  const accentBg = isVideo ? 'rgba(59,130,246,0.15)' : 'rgba(34,197,94,0.15)';
  const accentBorder = isVideo ? 'border-blue-500/30' : 'border-green-500/30';
  const acceptBg = isVideo ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/40' : 'bg-green-600 hover:bg-green-500 shadow-green-600/40';
  const ringColor = isVideo ? 'border-blue-500/40' : 'border-green-500/40';

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[200] flex flex-col items-center justify-start pt-20 pb-10 px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Subtle dark backdrop blur */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

        {/* Clean, professional card */}
        <motion.div
          initial={{ y: -40, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -20, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 w-full max-w-sm flex flex-col items-center bg-[#1c1c1e]/90 backdrop-blur-xl border border-white/10 shadow-2xl rounded-[2.5rem] px-8 py-10"
        >
          {/* Subtle Call type indicator */}
          <div className="mb-6 flex items-center gap-2 text-neutral-400 text-sm font-medium">
            {isVideo ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
            Rushes {isVideo ? 'Video' : 'Audio'} Call
          </div>

          {/* Avatar */}
          <div className="relative mb-6">
            <img
              src={callerAvatar || '/avatar.svg'}
              alt={callerName}
              className="w-28 h-28 rounded-full object-cover shadow-lg border border-white/5 bg-neutral-800"
            />
          </div>

          {/* Caller name */}
          <p className="text-white font-semibold text-3xl tracking-tight mb-2 text-center">
            {callerName || 'Someone'}
          </p>
          <p className="text-neutral-400 text-base mb-10 text-center">
            Incoming...
          </p>

          {/* Timer bar at top of buttons */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 rounded-full bg-white/10 mt-3 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-white/30"
              initial={{ width: '100%' }}
              animate={{ width: `${(timeLeft / 30) * 100}%` }}
              transition={{ duration: 0.9, ease: 'linear' }}
            />
          </div>

          {/* Action buttons */}
          <div className="w-full flex items-center justify-between px-4 mt-2">
            {/* Decline */}
            <button
              onClick={onDecline}
              className="flex flex-col items-center gap-3 group"
            >
              <div className="w-[72px] h-[72px] rounded-full bg-[#ff3b30] flex items-center justify-center transition-transform active:scale-95 shadow-lg shadow-red-500/20">
                <PhoneOff className="w-8 h-8 text-white fill-white" />
              </div>
              <span className="text-white text-sm font-medium opacity-80">Decline</span>
            </button>

            {/* Accept */}
            <button
              onClick={onAccept}
              className="flex flex-col items-center gap-3 group"
            >
              <div className="w-[72px] h-[72px] rounded-full bg-[#34c759] flex items-center justify-center transition-transform active:scale-95 shadow-lg shadow-green-500/20">
                <Phone className="w-8 h-8 text-white fill-white" />
              </div>
              <span className="text-white text-sm font-medium opacity-80">Accept</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
