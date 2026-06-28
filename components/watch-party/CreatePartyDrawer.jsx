import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, Shield, Lock, Search, Users, Loader2 } from 'lucide-react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import axios from 'axios';

export default function CreatePartyDrawer({ isOpen, onClose }) {
  const router = useRouter();
  const { data: session } = useSession();
  
  const [title, setTitle] = useState('');
  const [contentName, setContentName] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState('public');
  const [maxMembers, setMaxMembers] = useState(50);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      return;
    }
    
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await axios.get(`/api/social/search-users?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(res.data.users || []);
      } catch (err) {
        console.error('Failed to search users', err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const toggleUserSelection = (user) => {
    if (selectedUsers.some(u => (u._id || u.id) === (user._id || user.id))) {
      setSelectedUsers(selectedUsers.filter(u => (u._id || u.id) !== (user._id || user.id)));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !contentName) return;
    
    setIsSubmitting(true);
    const roomId = 'ROOM-' + Math.floor(100000 + Math.random() * 900000);
    
    const settings = {
      title,
      contentName,
      description,
      maxMembers,
      privacy,
      allowedUsers: privacy === 'custom' ? selectedUsers.map(u => u._id || u.id) : []
    };
    
    sessionStorage.setItem(`room_${roomId}_settings`, JSON.stringify(settings));
    
    // Create the room entry on the backend (you would typically have a POST endpoint here)
    try {
      await axios.post('/api/watch-together/create', { roomId, ...settings }).catch(() => {});
    } catch (err) {
      console.error("Failed to register room on backend", err);
    }
    
    router.push(`/watch-party/${roomId}`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full md:w-[450px] bg-[#0a0a0a] border-l border-white/10 z-[201] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0 bg-black/40">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-[#e50914]" /> Start Watch Party
              </h2>
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 scrollbar-hide">
              <form id="create-party-form" onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Room Title <span className="text-red-500">*</span></label>
                  <input 
                    type="text" required
                    value={title} onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Marvel Movie Night"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#e50914] transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">What are you watching? <span className="text-red-500">*</span></label>
                  <input 
                    type="text" required
                    value={contentName} onChange={(e) => setContentName(e.target.value)}
                    placeholder="e.g. Avengers: Endgame"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#e50914] transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-3">Privacy Options</label>
                  <div className="flex flex-col gap-3">
                    <button type="button" onClick={() => setPrivacy('public')} className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all ${privacy === 'public' ? 'bg-[#e50914]/10 border-[#e50914]' : 'bg-black/40 border-white/10 hover:bg-white/5'}`}>
                      <Globe className={`w-5 h-5 mt-0.5 ${privacy === 'public' ? 'text-[#e50914]' : 'text-gray-400'}`} />
                      <div>
                        <div className={`font-bold ${privacy === 'public' ? 'text-white' : 'text-gray-300'}`}>Public</div>
                        <div className="text-xs text-gray-500 mt-1">Visible to everyone in the Hub</div>
                      </div>
                    </button>
                    
                    <button type="button" onClick={() => setPrivacy('followers')} className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all ${privacy === 'followers' ? 'bg-[#e50914]/10 border-[#e50914]' : 'bg-black/40 border-white/10 hover:bg-white/5'}`}>
                      <Shield className={`w-5 h-5 mt-0.5 ${privacy === 'followers' ? 'text-[#e50914]' : 'text-gray-400'}`} />
                      <div>
                        <div className={`font-bold ${privacy === 'followers' ? 'text-white' : 'text-gray-300'}`}>Followers Only</div>
                        <div className="text-xs text-gray-500 mt-1">Only your followers can join</div>
                      </div>
                    </button>

                    <button type="button" onClick={() => setPrivacy('custom')} className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all ${privacy === 'custom' ? 'bg-[#e50914]/10 border-[#e50914]' : 'bg-black/40 border-white/10 hover:bg-white/5'}`}>
                      <Lock className={`w-5 h-5 mt-0.5 ${privacy === 'custom' ? 'text-[#e50914]' : 'text-gray-400'}`} />
                      <div>
                        <div className={`font-bold ${privacy === 'custom' ? 'text-white' : 'text-gray-300'}`}>Custom (Selective)</div>
                        <div className="text-xs text-gray-500 mt-1">Handpick exactly who can join</div>
                      </div>
                    </button>
                  </div>
                </div>
                
                {/* Custom Selective UI */}
                <AnimatePresence>
                  {privacy === 'custom' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }} 
                      animate={{ opacity: 1, height: 'auto' }} 
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden bg-white/5 border border-white/10 rounded-xl p-4"
                    >
                      <label className="block text-sm font-bold text-gray-300 mb-2">Invite Users</label>
                      <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search username..."
                          className="w-full bg-black/50 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white outline-none focus:border-[#e50914]"
                        />
                        {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />}
                      </div>

                      {/* Selected Users Chips */}
                      {selectedUsers.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {selectedUsers.map(u => (
                            <div key={u._id || u.id} className="flex items-center gap-1.5 bg-[#e50914]/20 text-[#e50914] text-xs font-bold px-2.5 py-1.5 rounded-full border border-[#e50914]/30">
                              <img src={u.avatar || '/avatar.svg'} className="w-4 h-4 rounded-full" alt="" />
                              <span>@{u.username}</span>
                              <button type="button" onClick={() => toggleUserSelection(u)} className="hover:text-red-400 ml-1">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Search Results */}
                      {searchResults.length > 0 && (
                        <div className="max-h-40 overflow-y-auto space-y-1 bg-black/40 rounded-lg border border-white/5 p-1">
                          {searchResults.map(user => {
                            const isSelected = selectedUsers.some(u => (u._id || u.id) === (user._id || user.id));
                            return (
                              <button
                                key={user._id || user.id}
                                type="button"
                                onClick={() => toggleUserSelection(user)}
                                className={`w-full flex items-center justify-between p-2 rounded-md hover:bg-white/10 transition-colors ${isSelected ? 'bg-white/5' : ''}`}
                              >
                                <div className="flex items-center gap-2">
                                  <img src={user.avatar || '/avatar.svg'} className="w-6 h-6 rounded-full" alt="" />
                                  <span className="text-sm font-medium text-white">@{user.username}</span>
                                </div>
                                {isSelected && <div className="w-2 h-2 rounded-full bg-[#e50914]" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

              </form>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-white/10 bg-black/20 shrink-0 pb-safe">
              <button 
                type="submit" form="create-party-form"
                disabled={isSubmitting || !title || !contentName || (privacy === 'custom' && selectedUsers.length === 0)}
                className="w-full bg-[#e50914] hover:bg-[#b81d24] text-white font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(229,9,20,0.3)] transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Users className="w-5 h-5" />}
                {isSubmitting ? 'Starting Party...' : 'Start Watch Party'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
