import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Loader2, KeyRound } from 'lucide-react';
import { useRouter } from 'next/router';

export default function PasswordModal({ isOpen, onClose, room }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  if (!room) return null;

  const handleJoin = async (e) => {
    e.preventDefault();
    setError('');
    setIsVerifying(true);
    
    try {
      const res = await axios.post('/api/watch-together/verify-password', { 
        roomId: room.roomId || room._id, 
        password 
      });
      
      const inviteToken = res.data.inviteToken;
      setIsVerifying(false);
      
      router.push(`/watch-party/${room.roomId || room._id}?title=${encodeURIComponent(room.title)}&mediaId=${room.mediaId || ''}&inviteToken=${encodeURIComponent(inviteToken)}`);
      
    } catch (err) {
      setError(err.response?.data?.error || 'Incorrect password. Please try again.');
      setIsVerifying(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[300]"
          />
          
          <div className="fixed inset-0 flex items-center justify-center z-[301] p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] pointer-events-auto"
            >
              <div className="p-5 flex items-center justify-between border-b border-white/10 bg-black/40">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-[#e50914]" /> Password Required
                </h3>
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-[#e50914]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#e50914]/20">
                    <KeyRound className="w-8 h-8 text-[#e50914]" />
                  </div>
                  <h4 className="font-bold text-white text-lg">{room.title}</h4>
                  <p className="text-sm text-gray-400 mt-1">This room is private. Enter the password to join.</p>
                </div>
                
                <form onSubmit={handleJoin} className="space-y-4">
                  <div>
                    <input
                      type="text" // Using text so they can see what they type for ease, or use 'password'
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter room password"
                      className={`w-full bg-black/50 border ${error ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-center font-mono text-white outline-none focus:border-[#e50914] transition-colors`}
                      autoFocus
                    />
                    {error && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-xs text-center mt-2 font-medium">
                        {error}
                      </motion.p>
                    )}
                  </div>
                  
                  <button 
                    type="submit"
                    disabled={!password || isVerifying}
                    className="w-full bg-[#e50914] hover:bg-[#b81d24] text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(229,9,20,0.3)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Unlock & Join Room'}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
