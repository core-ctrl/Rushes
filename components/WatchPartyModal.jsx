import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Lock, PlayCircle, ShieldAlert, X } from 'lucide-react';
import { toast } from '@/components/ui/Toaster';

export default function WatchPartyModal({ 
  isOpen, 
  onClose, 
  mediaTitle, 
  mediaId, 
  mediaType, 
  streamingUrl 
}) {
  const [privacy, setPrivacy] = useState('public');
  const [customRoomId, setCustomRoomId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/watch-together/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: mediaTitle,
          mediaId,
          mediaType,
          streamingUrl,
          privacy,
          customRoomId: customRoomId.trim() || undefined
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create room');
      
      if (data.roomUrl) {
        toast({ type: 'success', message: 'Room created! Redirecting...' });
        // Automatically copy to clipboard if possible
        try {
           await navigator.clipboard.writeText(window.location.origin + data.roomUrl);
        } catch(e) {}
        
        window.location.href = data.roomUrl;
      }
    } catch (err) {
      toast({ type: 'error', message: err.message });
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-black/40 backdrop-blur-2xl border border-white/20 rounded-2xl w-full max-w-lg shadow-[0_8px_32px_rgba(0,0,0,0.8)] overflow-hidden relative"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <PlayCircle className="text-purple-500 w-6 h-6" />
              Create Watch Party
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Warning / Instruction */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex gap-3 text-yellow-200 text-sm">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-yellow-500" />
              <div>
                <p className="font-bold text-yellow-500 mb-1">Important Note</p>
                <p>Watch Together syncs video playback between participants. <strong>Every participant must have their own active subscription</strong> to the streaming service (e.g. Netflix, Prime) to watch.</p>
              </div>
            </div>

            {/* Privacy Options */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-3">Room Privacy</label>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setPrivacy('public')} 
                  className={`p-4 rounded-xl border text-left flex flex-col gap-2 transition-all ${privacy === 'public' ? 'bg-purple-500/10 border-purple-500' : 'bg-black/40 border-white/10 hover:bg-white/5'}`}
                >
                  <Globe className={`w-5 h-5 ${privacy === 'public' ? 'text-purple-500' : 'text-gray-400'}`} />
                  <div>
                    <div className={`font-bold text-sm ${privacy === 'public' ? 'text-white' : 'text-gray-300'}`}>Public</div>
                    <div className="text-xs text-gray-500 mt-1">Listed on the live dashboard</div>
                  </div>
                </button>
                <button 
                  onClick={() => setPrivacy('private')} 
                  className={`p-4 rounded-xl border text-left flex flex-col gap-2 transition-all ${privacy === 'private' ? 'bg-purple-500/10 border-purple-500' : 'bg-black/40 border-white/10 hover:bg-white/5'}`}
                >
                  <Lock className={`w-5 h-5 ${privacy === 'private' ? 'text-purple-500' : 'text-gray-400'}`} />
                  <div>
                    <div className={`font-bold text-sm ${privacy === 'private' ? 'text-white' : 'text-gray-300'}`}>Private</div>
                    <div className="text-xs text-gray-500 mt-1">Invite link only</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Custom Room ID */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-1">Custom Room ID (Optional)</label>
              <p className="text-xs text-gray-500 mb-2">Create a custom link to easily share with friends.</p>
              <div className="flex bg-white/5 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden focus-within:border-purple-500 transition-colors shadow-inner">
                <span className="px-3 py-3 text-sm text-gray-400 bg-black/40 border-r border-white/10">rushes.com/wp/</span>
                <input 
                  type="text"
                  value={customRoomId}
                  onChange={(e) => setCustomRoomId(e.target.value.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase())}
                  placeholder="e.g. marvel-night"
                  className="w-full bg-transparent px-3 py-3 text-white text-sm outline-none placeholder:text-gray-600"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 pt-0">
            <button 
              onClick={handleCreate}
              disabled={isSubmitting}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : 'Start Watch Party'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
