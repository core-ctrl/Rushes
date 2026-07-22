import React, { useState } from 'react';
import Head from 'next/head';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { Film, Users, PlayCircle, Radio, Plus, ShieldCheck, AlertTriangle, Lock } from 'lucide-react';
import useSWR from 'swr';
import CreatePartyDrawer from '@/components/watch-party/CreatePartyDrawer';
import PasswordModal from '@/components/watch-party/PasswordModal';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useDispatch } from 'react-redux';
import { openAuthModal } from '@/store/slices/uiSlice';

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function WatchPartyLanding() {
  const router = useRouter();
  const { data: session } = useSession();
  const { data, error } = useSWR('/api/watch-together/active', fetcher);
  const rooms = data?.rooms || [];
  const isLoading = !data && !error;
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('public'); // 'public' or 'private'
  
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedRoomToJoin, setSelectedRoomToJoin] = useState(null);
  const dispatch = useDispatch();

  const handleJoinClick = (e, room) => {
    e.preventDefault();
    if (!session?.user) {
      dispatch(openAuthModal('login'));
      return;
    }
    if (room.privacy === 'followers' || room.privacy === 'custom') {
      setSelectedRoomToJoin(room);
      setIsPasswordModalOpen(true);
    } else {
      router.push(`/watch-party/${room.roomId || room._id}?title=${encodeURIComponent(room.title)}&mediaId=${room.mediaId || ''}&mediaType=${room.mediaType || 'movie'}`);
    }
  };

  const displayedRooms = rooms.filter(room => {
    if (activeTab === 'public') return room.privacy === 'public' || !room.privacy;
    return room.privacy === 'followers' || room.privacy === 'custom' || room.privacy === 'private';
  });

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
      <Head><title>Watch Party Hub | Rushes</title></Head>
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-24 md:pb-20 max-w-6xl">
        
        {/* HERO SECTION */}
        <section className="mb-16">
          <div className="flex flex-col justify-center max-w-4xl">
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-purple-200">
              <Film className="h-3.5 w-3.5" />
              Watch Parties
            </div>

            <h1 className="text-4xl font-black leading-tight text-white md:text-6xl mb-4">
              Ready to watch together in sync?
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-neutral-400 md:text-base">
              Join a synchronized lobby. The room host controls the playback. Send messages and talk in real-time. Start your own party or join a public one below.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => {
                  if (!session?.user) {
                    dispatch(openAuthModal('login'));
                  } else {
                    setIsDrawerOpen(true);
                  }
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#e50914] px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-red-900/40 transition hover:bg-[#b81d24]"
              >
                <Plus className="h-5 w-5" />
                Start your own Party
              </button>
            </div>

            <div className="mt-10 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <ShieldCheck className="mb-3 h-5 w-5 text-purple-300" />
                <h2 className="text-sm font-black text-white">Playback Sync</h2>
                <p className="mt-2 text-xs leading-5 text-neutral-400">
                  Play, pause, and seek are synced automatically across everyone in the room.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <AlertTriangle className="mb-3 h-5 w-5 text-amber-300" />
                <h2 className="text-sm font-black text-white">Shared Player</h2>
                <p className="mt-2 text-xs leading-5 text-neutral-400">
                  Watch official trailer previews or direct custom video feeds together in real-time.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <Users className="mb-3 h-5 w-5 text-sky-300" />
                <h2 className="text-sm font-black text-white">Live Sockets</h2>
                <p className="mt-2 text-xs leading-5 text-neutral-400">
                  Low latency chat keeps you connected while you enjoy the show.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* TABS & ROOM LIST */}
        <div className="border-t border-white/10 pt-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <h2 className="text-2xl md:text-3xl font-black flex items-center gap-3 tracking-tight">
              <Radio className="w-6 h-6 md:w-8 md:h-8 text-[#e50914] animate-pulse" /> 
              Active Lobbies
            </h2>
            
            <div className="flex items-center gap-2 bg-black/50 border border-white/10 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('public')}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-colors ${activeTab === 'public' ? 'bg-[#e50914] text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                Public Rooms
              </button>
              <button
                onClick={() => setActiveTab('private')}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${activeTab === 'private' ? 'bg-[#e50914] text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                <Lock className="w-4 h-4" /> Private Rooms
              </button>
            </div>
          </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-4 border-[#e50914] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : displayedRooms.length === 0 ? (
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
            {displayedRooms.map(room => (
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
                    
                    {room.isLocked ? (
                      <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-lg text-sm font-bold">
                        <Lock className="w-3.5 h-3.5" /> Locked
                      </div>
                    ) : (
                      <button 
                        onClick={(e) => handleJoinClick(e, room)}
                        className="bg-white text-black hover:bg-gray-200 px-4 py-1.5 rounded-lg text-sm font-bold transition-colors"
                      >
                        Join
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </main>

      <CreatePartyDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
      <PasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
        room={selectedRoomToJoin} 
      />
    </div>
  );
}
