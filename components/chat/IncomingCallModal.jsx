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
        className="fixed inset-0 z-[200] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Blurred cinematic backdrop */}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 50% 40%, ${accentBg}, transparent 65%), rgba(0,0,0,0.92)`,
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          }}
        />

        {/* Noise texture overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Pulsing rings behind avatar */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={`absolute rounded-full border-2 ${ringColor}`}
              initial={{ width: 140, height: 140, opacity: 0.7 }}
              animate={{
                width: [140, 260 + i * 70],
                height: [140, 260 + i * 70],
                opacity: [0.7, 0],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                delay: i * 0.65,
                ease: 'easeOut',
              }}
            />
          ))}
        </div>

        {/* Card */}
        <motion.div
          initial={{ scale: 0.85, y: 40, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.85, y: 40, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          className="relative z-10 flex flex-col items-center text-center px-10 py-10 rounded-3xl"
          style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: `0 40px 120px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 80px ${accentBg}`,
          }}
        >
          {/* Call type badge */}
          <motion.div
            className={`mb-6 flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-widest ${accentBorder}`}
            style={{ color: accentColor, background: accentBg }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            {isVideo ? <Video className="w-3 h-3" /> : <Phone className="w-3 h-3" />}
            Incoming {isVideo ? 'Video' : 'Voice'} Call
          </motion.div>

          {/* Avatar */}
          <motion.div
            className="relative mb-5"
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* Glow ring */}
            <div
              className="absolute -inset-1 rounded-full"
              style={{
                background: `radial-gradient(circle, ${accentColor}50 0%, transparent 70%)`,
                filter: 'blur(8px)',
              }}
            />
            <img
              src={callerAvatar || '/avatar.svg'}
              alt={callerName}
              className="relative w-28 h-28 rounded-full object-cover border-2 border-white/20 shadow-2xl"
            />
            {/* Live dot */}
            <motion.div
              className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-black ${isVideo ? 'bg-blue-500' : 'bg-green-500'}`}
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
          </motion.div>

          {/* Caller name */}
          <motion.p
            className="text-white font-black text-2xl mb-1 tracking-tight"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {callerName || 'Someone'}
          </motion.p>
          <p className="text-neutral-400 text-sm mb-1 font-medium">is calling you...</p>

          {/* Timer bar */}
          <div className="w-32 h-1 rounded-full bg-white/10 mt-3 mb-8 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${isVideo ? 'bg-blue-500' : 'bg-green-500'}`}
              initial={{ width: '100%' }}
              animate={{ width: `${(timeLeft / 30) * 100}%` }}
              transition={{ duration: 0.9, ease: 'linear' }}
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-end gap-10">
            {/* Decline */}
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={onDecline}
              className="flex flex-col items-center gap-2.5"
            >
              <div className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center shadow-lg shadow-red-600/40 transition-colors">
                <PhoneOff className="w-7 h-7 text-white" />
              </div>
              <span className="text-neutral-500 text-xs font-semibold">Decline</span>
            </motion.button>

            {/* Accept */}
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={onAccept}
              className="flex flex-col items-center gap-2.5"
            >
              <motion.div
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-colors ${acceptBg}`}
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Phone className="w-7 h-7 text-white" />
              </motion.div>
              <span className="text-neutral-400 text-xs font-semibold">Accept</span>
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
