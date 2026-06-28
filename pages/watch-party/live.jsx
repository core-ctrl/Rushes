import React, { useState } from 'react';
import Head from 'next/head';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { Film, Users, PlayCircle, Radio, Plus } from 'lucide-react';
import useSWR from 'swr';
import CreatePartyDrawer from '@/components/watch-party/CreatePartyDrawer';

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function LiveWatchParties() {
  const { data, error } = useSWR('/api/watch-together/active', fetcher);
  const rooms = data?.rooms || [];
  const isLoading = !data && !error;
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
      <Head><title>Watch Party Hub | Rushes</title></Head>
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-24 md:pb-20 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black flex items-center gap-3 tracking-tight">
              <Radio className="w-8 h-8 md:w-10 md:h-10 text-[#e50914] animate-pulse" /> 
              Watch Parties
            </h1>
            <p className="text-gray-400 mt-2 text-sm md:text-base max-w-xl">
              Join a public room and watch together with the community, or start your own custom party.
            </p>
          </div>
          
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="bg-[#e50914] hover:bg-[#b81d24] text-white px-6 py-3.5 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(229,9,20,0.3)] flex items-center justify-center gap-2 shrink-0 w-full md:w-auto"
          >
            <Plus className="w-5 h-5" /> Start a Party
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-4 border-[#e50914] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center bg-gray-900/50 border border-white/5 rounded-3xl py-20 px-4 mt-8">
            <Radio className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2">No Active Parties</h2>
            <p className="text-gray-400 mb-6 max-w-sm mx-auto">It's quiet right now. Be the first to start a watch party and invite others!</p>
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-lg font-bold transition-all"
            >
              Host a Party
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 mt-6">
            {rooms.map(room => (
              <div key={room.roomId || room._id} className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden group hover:border-white/20 transition-all shadow-xl hover:-translate-y-1">
                <div className="h-40 bg-gray-900 relative overflow-hidden">
                  {/* Abstract colorful background for empty poster */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-black z-10" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-30 z-10">
                    <Film className="w-20 h-20" />
                  </div>
                  
                  {/* Live Badge */}
                  <div className="absolute top-3 left-3 z-20 bg-black/60 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-xl">
                    <div className="w-2 h-2 bg-[#e50914] rounded-full animate-pulse" /> Live
                  </div>

                  {/* Room Privacy Badge */}
                  <div className="absolute top-3 right-3 z-20 bg-black/60 backdrop-blur-md border border-white/10 text-gray-300 text-[10px] font-bold px-2.5 py-1.5 rounded-full uppercase tracking-wider">
                    {room.privacy || 'Public'}
                  </div>
                </div>
                
                <div className="p-5 flex flex-col h-[140px]">
                  <h3 className="text-lg font-bold text-white mb-1 truncate leading-tight">{room.title}</h3>
                  <p className="text-sm text-[#e50914] font-medium mb-3 truncate flex items-center gap-1.5">
                    <PlayCircle className="w-4 h-4" /> {room.contentName}
                  </p>
                  
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5">
                      <Users className="w-4 h-4" />
                      {room.members || 1} / {room.maxMembers || 50}
                    </div>
                    
                    <Link 
                      href={`/watch-party/${room.roomId || room._id}?title=${encodeURIComponent(room.title)}&mediaId=${room.mediaId || ''}&mediaType=${room.mediaType || 'movie'}`} 
                      className="bg-white text-black hover:bg-gray-200 px-4 py-1.5 rounded-lg text-sm font-bold transition-colors"
                    >
                      Join
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <CreatePartyDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </div>
  );
}
