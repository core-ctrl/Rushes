import React from 'react';
import Head from 'next/head';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { Film, Users, PlayCircle, Radio } from 'lucide-react';

import useSWR from 'swr';

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function LiveWatchParties() {
  const { data, error } = useSWR('/api/watch-together/active', fetcher);
  const rooms = data?.rooms || [];
  const isLoading = !data && !error;

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Head><title>Live Watch Parties | Rushes</title></Head>
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-20 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Radio className="w-8 h-8 text-red-500 animate-pulse" /> Live Watch Parties
            </h1>
            <p className="text-gray-400 mt-2">Join a public room and watch together with the community.</p>
          </div>
          <Link href="/watch-party/create" className="bg-[#e50914] hover:bg-[#b81d24] text-white px-6 py-3 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(229,9,20,0.3)]">
            Host a Party
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center text-gray-400 mt-20">
            <Radio className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h2 className="text-xl font-bold text-white mb-2">No Active Parties</h2>
            <p>Be the first to host a watch party!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map(room => (
              <div key={room.roomId || room._id} className="bg-gray-900 border border-white/10 rounded-2xl overflow-hidden group hover:border-white/20 transition-all">
                <div className="h-32 bg-gray-800 relative">
                  {/* Dummy background image or placeholder */}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent z-10" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-20">
                    <Film className="w-16 h-16" />
                  </div>
                  <div className="absolute top-3 right-3 z-20 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> Live
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-white mb-1 truncate">{room.title}</h3>
                  <p className="text-sm text-gray-400 mb-4">Hosted by @{room.hostUsername}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-white/5 px-2 py-1 rounded-md">
                      <Users className="w-3.5 h-3.5" />
                      {room.members} / {room.maxMembers}
                    </div>
                    <Link href={`/watch-party/${room.roomId || room._id}?title=${encodeURIComponent(room.title)}&mediaId=${room.mediaId || ''}&mediaType=${room.mediaType || 'movie'}`} className="flex items-center gap-2 text-sm font-bold text-[#e50914] group-hover:text-red-400 transition-colors">
                      Join Room <PlayCircle className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
