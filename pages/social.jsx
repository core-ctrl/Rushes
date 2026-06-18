import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useSession } from 'next-auth/react';
import useSWRInfinite from 'swr/infinite';
import { Sparkles, Users, Flame, Bookmark } from 'lucide-react';
import Navbar from '@/components/Navbar';
import PostCard from '@/components/social/PostCard';
import CreatePost from '@/components/social/CreatePost';
import TrendingSidebar from '@/components/social/TrendingSidebar';

const fetcher = url => fetch(url).then(res => res.json());
const getKey = (pageIndex, previousPageData, tab) => {
  if (previousPageData && !previousPageData.nextCursor) return null;
  return `/api/posts/feed?type=${tab}&limit=10${previousPageData ? `&cursor=${previousPageData.nextCursor}` : ''}`;
};

export default function SocialFeed() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('foryou');
  
  const { data, size, setSize, isValidating, mutate } = useSWRInfinite(
    (index, prev) => getKey(index, prev, activeTab),
    fetcher
  );

  const posts = data ? data.map(page => page.posts).flat() : [];
  const isLoadingInitialData = !data && isValidating;
  const isLoadingMore = isLoadingInitialData || (size > 0 && data && typeof data[size - 1] === "undefined");
  const isEmpty = data?.[0]?.posts.length === 0;
  const isReachingEnd = isEmpty || (data && data[data.length - 1]?.hasMore === false);

  // Intersection observer for infinite scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop + 500 >= document.documentElement.offsetHeight) {
        if (!isReachingEnd && !isLoadingMore) {
          setSize(size + 1);
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isReachingEnd, isLoadingMore, setSize, size]);

  const handlePostCreated = (newPost) => {
    if (activeTab === 'foryou' || activeTab === 'following') {
      mutate((currentData) => {
        if (!currentData || !currentData[0]) return currentData;
        const newData = [...currentData];
        newData[0] = { 
          ...newData[0], 
          posts: [newPost, ...newData[0].posts] 
        };
        return newData;
      }, { revalidate: false }); // Update locally for instant feedback
    }
  };

  const handleLike = async (id) => {
    await fetch(`/api/posts/${id}/like`, { method: 'POST' });
  };

  const handleSave = async (id) => {
    await fetch(`/api/posts/${id}/save`, { method: 'POST' });
  };

  const handleDelete = async (id, isLocalHandled = false) => {
    if (isLocalHandled) {
      // The PostCard already showed the confirmation, called the API, and showed the toast.
      // We just need to refresh the list or rely on local state hiding the post.
      return;
    }
    if (confirm('Delete this post?')) {
      await fetch(`/api/posts/${id}`, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ softDelete: true })
      });
      mutate();
    }
  };

  const handleComment = async (id) => {
    const text = window.prompt("Write a comment:");
    if (!text) return;
    try {
      await fetch(`/api/posts/${id}/comments`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text })
      });
      mutate();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRepost = async (id) => {
    if (confirm('Repost this to your followers?')) {
      try {
        await fetch('/api/posts/create', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postType: 'repost', parentPostId: id })
        });
        mutate();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleShare = (id) => {
    const url = `${window.location.origin}/post/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      alert('Link copied to clipboard!');
    });
  };

  const handleVote = async (id, optionIndex) => {
    try {
      await fetch(`/api/posts/${id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionIndex })
      });
      mutate();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-[#e50914] selection:text-white">
      <Head>
        <title>Rushes | Social</title>
      </Head>
      
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-20 md:pb-8">
        <div className="flex justify-center gap-8 relative">
          
          {/* Left Sidebar (Desktop Nav) */}
          <div className="hidden md:flex flex-col w-64 shrink-0 sticky top-24 h-[calc(100vh-120px)]">
            <nav className="space-y-2 font-bold text-lg">
              <button 
                onClick={() => setActiveTab('foryou')}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-colors ${activeTab === 'foryou' ? 'bg-[#e50914]/10 text-[#e50914]' : 'hover:bg-white/5'}`}
              >
                <Sparkles className="w-6 h-6" /> For You
              </button>
              <button 
                onClick={() => setActiveTab('following')}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-colors ${activeTab === 'following' ? 'bg-[#e50914]/10 text-[#e50914]' : 'hover:bg-white/5'}`}
              >
                <Users className="w-6 h-6" /> Following
              </button>
              <button 
                onClick={() => setActiveTab('trending')}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-colors ${activeTab === 'trending' ? 'bg-[#e50914]/10 text-[#e50914]' : 'hover:bg-white/5'}`}
              >
                <Flame className="w-6 h-6" /> Trending
              </button>
              <button 
                onClick={() => setActiveTab('bookmarks')}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-colors ${activeTab === 'bookmarks' ? 'bg-[#e50914]/10 text-[#e50914]' : 'hover:bg-white/5'}`}
              >
                <Bookmark className="w-6 h-6" /> Bookmarks
              </button>
            </nav>
            
            <button className="mt-8 bg-[#e50914] hover:bg-[#b81d24] text-white font-bold py-4 rounded-full shadow-[0_0_20px_rgba(229,9,20,0.3)] transition-all transform hover:scale-105 active:scale-95">
              Post a Take
            </button>
          </div>

          {/* Main Feed Column */}
          <div className="w-full max-w-[600px] shrink-0 border-x border-white/5 min-h-screen">
            {/* Mobile Tab Bar */}
            <div className="md:hidden flex border-b border-white/5 mb-4 backdrop-blur-md sticky top-16 z-20 bg-black/60">
              {['foryou', 'following', 'trending'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-4 text-sm font-bold capitalize relative ${activeTab === tab ? 'text-white' : 'text-gray-500'}`}
                >
                  {tab === 'foryou' ? 'For You' : tab}
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#e50914] rounded-t-full" />
                  )}
                </button>
              ))}
            </div>

            <div className="px-0 sm:px-4">
              {session && <CreatePost onPostCreated={handlePostCreated} />}
              
              <div className="space-y-0 sm:space-y-4 pb-20">
                {posts.map(post => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    currentUser={session?.user}
                    onLike={handleLike}
                    onComment={handleComment}
                    onRepost={handleRepost}
                    onSave={handleSave}
                    onDelete={handleDelete}
                    onVote={handleVote}
                    onShare={handleShare}
                  />
                ))}
                
                {isLoadingMore && (
                  <div className="py-8 flex justify-center">
                    <div className="w-8 h-8 border-4 border-gray-800 border-t-[#e50914] rounded-full animate-spin" />
                  </div>
                )}
                
                {isEmpty && !isLoadingInitialData && (
                  <div className="py-20 text-center text-gray-500">
                    <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="font-bold text-xl text-white mb-2">Nothing to see here</h3>
                    <p>Follow more users or adjust your filters.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <TrendingSidebar />
          
        </div>
      </main>
    </div>
  );
}
