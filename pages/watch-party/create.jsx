import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/Navbar';
import { motion } from 'framer-motion';
import { Users, Lock, Globe, EyeOff, Shield } from 'lucide-react';

export default function CreateWatchParty() {
  const router = useRouter();
  const { data: session } = useSession();
  const [title, setTitle] = useState('');
  const [contentName, setContentName] = useState('');
  const [description, setDescription] = useState('');
  const [maxMembers, setMaxMembers] = useState(50);
  const [privacy, setPrivacy] = useState('public');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !contentName) return;
    setIsSubmitting(true);
    
    // In a real app, send to backend API
    const roomId = 'ROOM-' + Math.floor(100000 + Math.random() * 900000);
    
    sessionStorage.setItem(`room_${roomId}_settings`, JSON.stringify({
      title, contentName, description, maxMembers, privacy, password
    }));
    
    router.push(`/watch-party/${roomId}`);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Head><title>Create Watch Party | Rushes</title></Head>
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-20 max-w-2xl">
        <div className="bg-gray-900 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl">
          <h1 className="text-3xl font-bold text-white mb-2">Create Watch Party</h1>
          <p className="text-gray-400 mb-8">Host a live sync-watching session with friends or the community.</p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
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
              <label className="block text-sm font-bold text-gray-300 mb-2">Content Name <span className="text-red-500">*</span></label>
              <input 
                type="text" required
                value={contentName} onChange={(e) => setContentName(e.target.value)}
                placeholder="What are you watching?"
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#e50914] transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Description (Optional)</label>
              <textarea 
                value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell people what this room is about..."
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#e50914] transition-colors min-h-[100px] resize-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Maximum Members: {maxMembers}</label>
              <input 
                type="range" min="1" max="200"
                value={maxMembers} onChange={(e) => setMaxMembers(parseInt(e.target.value))}
                className="w-full accent-[#e50914]"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1</span>
                <span>200</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-3">Privacy Options</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button type="button" onClick={() => setPrivacy('public')} className={`p-4 rounded-xl border text-left flex flex-col gap-2 transition-all ${privacy === 'public' ? 'bg-[#e50914]/10 border-[#e50914]' : 'bg-black/40 border-white/10 hover:bg-white/5'}`}>
                  <Globe className={`w-6 h-6 ${privacy === 'public' ? 'text-[#e50914]' : 'text-gray-400'}`} />
                  <div>
                    <div className={`font-bold ${privacy === 'public' ? 'text-white' : 'text-gray-300'}`}>Public</div>
                    <div className="text-xs text-gray-500 mt-1">Visible to everyone</div>
                  </div>
                </button>
                <button type="button" onClick={() => setPrivacy('followers')} className={`p-4 rounded-xl border text-left flex flex-col gap-2 transition-all ${privacy === 'followers' ? 'bg-[#e50914]/10 border-[#e50914]' : 'bg-black/40 border-white/10 hover:bg-white/5'}`}>
                  <Shield className={`w-6 h-6 ${privacy === 'followers' ? 'text-[#e50914]' : 'text-gray-400'}`} />
                  <div>
                    <div className={`font-bold ${privacy === 'followers' ? 'text-white' : 'text-gray-300'}`}>Followers Only</div>
                    <div className="text-xs text-gray-500 mt-1">Only followers can join</div>
                  </div>
                </button>
                <button type="button" onClick={() => setPrivacy('private')} className={`p-4 rounded-xl border text-left flex flex-col gap-2 transition-all ${privacy === 'private' ? 'bg-[#e50914]/10 border-[#e50914]' : 'bg-black/40 border-white/10 hover:bg-white/5'}`}>
                  <Lock className={`w-6 h-6 ${privacy === 'private' ? 'text-[#e50914]' : 'text-gray-400'}`} />
                  <div>
                    <div className={`font-bold ${privacy === 'private' ? 'text-white' : 'text-gray-300'}`}>Private</div>
                    <div className="text-xs text-gray-500 mt-1">Invite link or password</div>
                  </div>
                </button>
              </div>
            </div>
            
            {privacy === 'private' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
                <label className="block text-sm font-bold text-gray-300 mb-2 mt-4">Room Password (Optional)</label>
                <input 
                  type="text"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave blank for invite-link only"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#e50914] transition-colors"
                />
              </motion.div>
            )}
            
            <div className="pt-6 border-t border-white/10">
              <button 
                type="submit" disabled={isSubmitting}
                className="w-full bg-[#e50914] hover:bg-[#b81d24] text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(229,9,20,0.3)] transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating Room...' : 'Create Watch Party'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
