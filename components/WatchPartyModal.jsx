import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PlayCircle, Users, Radio, Lock } from 'lucide-react';
import useSWR from 'swr';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import AuthModal from './AuthModal';

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function WatchPartyModal({ 
  isOpen, 
  onClose, 
  mediaTitle, 
  mediaId, 
  onHostOwn,
  onJoinPrivate
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const { data, error } = useSWR(isOpen ? '/api/watch-together/active' : null, fetcher);
  const [authModalOpen, setAuthModalOpen] = React.useState(false);
  
  if (!isOpen) return null;

  const allRooms = data?.rooms || [];
  const isLoading = !data && !error;
  
  // Filter rooms for this exact movie
  const movieRooms = allRooms.filter(room => room.mediaId == mediaId);

  const handleJoinClick = (room) => {
    if (!session?.user) {
      setAuthModalOpen(true);
      return;
    }
    if (room.privacy === 'followers' || room.privacy === 'custom' || room.privacy === 'private') {
      onJoinPrivate(room);
    } else {
      router.push(`/watch-party/${room.roomId || room._id}?title=${encodeURIComponent(room.title)}&mediaId=${room.mediaId || ''}&mediaType=${room.mediaType || 'movie'}`);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[#111] backdrop-blur-2xl border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden relative flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="text-[#e50914] w-5 h-5" />
                Active Watch Parties
              </h2>
              <p className="text-sm text-gray-400 mt-1">For "{mediaTitle}"</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-8 h-8 border-4 border-[#e50914] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : movieRooms.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Radio className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                <h3 className="text-lg font-bold text-white mb-2">No rooms available currently</h3>
                <p className="text-sm text-gray-400 max-w-sm mx-auto">Be the first to start a watch party for this movie and invite others to join!</p>
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {movieRooms.map(room => (
                  <div key={room._id || room.roomId} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                    <div>
                      <h4 className="font-bold text-white mb-1 flex items-center gap-2">
                        {room.hostUsername}'s Party
                        {(room.privacy === 'followers' || room.privacy === 'custom' || room.privacy === 'private') && (
                          <Lock className="w-3.5 h-3.5 text-[#e50914]" />
                        )}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" /> {room.members || 1} / {room.maxMembers || 50}
                        </span>
                        <span className="uppercase text-[10px] tracking-wider px-2 py-0.5 rounded-full bg-white/10 font-bold">
                          {room.privacy || 'Public'}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleJoinClick(room)}
                      className="bg-white text-black hover:bg-gray-200 px-5 py-2 rounded-lg text-sm font-bold transition-colors shadow-lg"
                    >
                      Join
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-white/10 bg-black/40">
            <button 
              onClick={() => {
                if (!session?.user) {
                  setAuthModalOpen(true);
                } else {
                  onHostOwn();
                }
              }}
              className="w-full bg-[#e50914] hover:bg-[#b81d24] text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(229,9,20,0.3)] flex justify-center items-center gap-2"
            >
              <PlayCircle className="w-5 h-5" />
              Host your own Party
            </button>
          </div>
        </motion.div>
      </div>

      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </AnimatePresence>
  );
}
