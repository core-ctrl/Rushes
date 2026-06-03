import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCall } from '../contexts/CallContext';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Maximize2 } from 'lucide-react';
import { useRouter } from 'next/router';

export default function MiniCallOverlay() {
  const { isInCall, isCallPage, callDetails, isMuted, isVideoOff, toggleMute, toggleVideo, leaveCall } = useCall();
  const router = useRouter();

  if (!isInCall || isCallPage) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        drag
        dragConstraints={{ left: 0, right: 0, top: -500, bottom: 0 }}
        className="fixed bottom-6 right-6 z-[9999] bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 w-64 flex flex-col items-center cursor-move"
      >
        <div className="w-full flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              {callDetails?.type === 'voice' ? 'Voice Call' : 'Video Call'}
            </span>
          </div>
          <button 
            onClick={() => router.push(`/room/${callDetails?.roomId}`)}
            className="p-1.5 text-gray-400 hover:text-white bg-white/5 rounded-lg transition-colors cursor-pointer"
            title="Return to Call"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-center w-full gap-4">
          <button
            onClick={toggleMute}
            className={`p-3 rounded-full transition-colors cursor-pointer ${isMuted ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'}`}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {callDetails?.type !== 'voice' && (
            <button
              onClick={toggleVideo}
              className={`p-3 rounded-full transition-colors cursor-pointer ${isVideoOff ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'}`}
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
          )}

          <button
            onClick={leaveCall}
            className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer"
            title="End Call"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
