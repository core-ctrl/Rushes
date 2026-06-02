import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Plus, Users } from 'lucide-react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { selectUser } from '../store/slices/authSlice';
import CreateTake from '../components/social/CreateTake';
import TakeCard from '../components/social/TakeCard';
import UserSearch from '../components/social/UserSearch';
import NotificationBell from '../components/chat/NotificationBell';
import ErrorBoundary from '../components/ErrorBoundary';
import SEOMeta from '../components/SEOMeta';

export default function SocialFeed() {
    const user = useSelector(selectUser);
    const [takes, setTakes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const [showComposer, setShowComposer] = useState(false);
    const [feedType, setFeedType] = useState('foryou'); // 'foryou' or 'following'

    useEffect(() => {
        loadTakes();
    }, [refreshKey, feedType]);

    const loadTakes = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`/api/takes/feed?type=${feedType}`);
            setTakes(data.takes);
        } catch (error) {
            console.error('Load takes error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTakeCreated = () => {
        setRefreshKey(prev => prev + 1);
        setShowComposer(false);
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-neutral-900 to-black pt-24 pb-12">
                <SEOMeta
                    title="Social Feed"
                    description="Follow friends and see what movies they're taking about on Rushes."
                    url="/social"
                    noindex
                />
                <div className="max-w-4xl mx-auto px-4 text-center py-24">
                    <Users className="w-24 h-24 text-neutral-600 mx-auto mb-8 opacity-50" />
                    <h1 className="text-4xl font-black bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent mb-4">
                        Social Feed
                    </h1>
                    <p className="text-xl text-neutral-500 mb-8 max-w-md mx-auto">
                        Follow friends and see what movies they're taking about
                    </p>
                    <div className="space-x-4">
                        <a href="/login" className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-glow-red transition-all inline-block">
                            Sign In
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black pt-16 pb-24 text-white md:pt-20">
            <SEOMeta
                title="Social Feed"
                description="See what your friends are watching and share your movie takes on Rushes."
                url="/social"
                noindex
            />

            <div className="mx-auto grid max-w-6xl grid-cols-1 px-0 lg:grid-cols-[minmax(0,640px)_320px] lg:gap-6 lg:px-6 xl:grid-cols-[minmax(0,680px)_340px]">
                <main className="min-w-0 border-x border-white/10 bg-black">
                    <div className="sticky top-16 z-30 border-b border-white/10 bg-black/85 backdrop-blur-xl md:top-20">
                        <div className="flex h-14 items-center gap-3 px-4">
                            <h1 className="text-xl font-black text-white">Home</h1>
                            <div className="ml-auto flex items-center gap-2 lg:hidden">
                                <ErrorBoundary>
                                    <NotificationBell />
                                </ErrorBoundary>
                            </div>
                        </div>
                        <div className="grid grid-cols-2">
                            <button
                                onClick={() => setFeedType('foryou')}
                                className={`relative h-12 text-sm font-bold transition-colors hover:bg-white/5 ${feedType === 'foryou' ? 'text-white' : 'text-neutral-500'}`}
                            >
                                For You
                                {feedType === 'foryou' && (
                                    <motion.div layoutId="feedTab" className="absolute bottom-0 left-1/2 h-1 w-14 -translate-x-1/2 rounded-t-full bg-red-500" />
                                )}
                            </button>
                            <button
                                onClick={() => setFeedType('following')}
                                className={`relative h-12 text-sm font-bold transition-colors hover:bg-white/5 ${feedType === 'following' ? 'text-white' : 'text-neutral-500'}`}
                            >
                                Following
                                {feedType === 'following' && (
                                    <motion.div layoutId="feedTab" className="absolute bottom-0 left-1/2 h-1 w-14 -translate-x-1/2 rounded-t-full bg-red-500" />
                                )}
                            </button>
                        </div>
                    </div>

                    <ErrorBoundary>
                        <div className="hidden md:block">
                            <CreateTake onCreated={handleTakeCreated} />
                        </div>
                    </ErrorBoundary>

                    {/* Mobile composer button */}
                    <button
                        onClick={() => setShowComposer(true)}
                        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-2xl shadow-red-950/60 transition-colors hover:bg-red-500 md:hidden"
                        aria-label="Create take"
                        title="Create take"
                    >
                        <Plus className="h-6 w-6" />
                    </button>

                    <AnimatePresence>
                        {showComposer && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm md:hidden"
                                onClick={() => setShowComposer(false)}
                            >
                                <motion.div
                                    initial={{ y: '100%' }}
                                    animate={{ y: 0 }}
                                    exit={{ y: '100%' }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                    className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-black pb-8 shadow-[0_-8px_40px_-15px_rgba(0,0,0,0.8)]"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="mx-auto my-3 h-1.5 w-12 rounded-full bg-white/20" />
                                    <CreateTake onCreated={handleTakeCreated} />
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Feed */}
                    {loading ? (
                        <div className="divide-y divide-white/10">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="flex animate-pulse gap-3 p-4">
                                    <div className="h-11 w-11 rounded-full bg-neutral-900" />
                                    <div className="flex-1 space-y-3">
                                        <div className="h-4 w-2/3 rounded bg-neutral-900" />
                                        <div className="h-4 w-11/12 rounded bg-neutral-900" />
                                        <div className="h-4 w-3/5 rounded bg-neutral-900" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : takes.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="border-b border-white/10 px-6 py-24 text-center"
                        >
                            <Heart className="w-20 h-20 text-neutral-600 mx-auto mb-6 opacity-50" />
                            <h3 className="text-2xl font-bold text-neutral-400 mb-2">
                                No takes yet
                            </h3>
                            <p className="text-neutral-500 max-w-md mx-auto">
                                Follow some friends or be the first to share a movie take!
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            layout
                            className="flex flex-col"
                        >
                            {takes.map((take, index) => (
                                <div key={take.id || take._id} className={index !== takes.length - 1 ? "border-b border-white/10" : ""}>
                                    <TakeCard take={take} index={index} onTakeDeleted={() => setRefreshKey(prev => prev + 1)} />
                                </div>
                            ))}
                        </motion.div>
                    )}
                </main>

                <aside className="hidden lg:block">
                    <div className="sticky top-24 space-y-4">
                        <div className="rounded-lg border border-white/10 bg-neutral-950 p-3">
                            <UserSearch />
                        </div>
                        <div className="rounded-lg border border-white/10 bg-neutral-950 p-3">
                            <div className="mb-2 flex items-center justify-between">
                                <p className="text-sm font-bold text-white">Notifications</p>
                                <ErrorBoundary>
                                    <NotificationBell />
                                </ErrorBoundary>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
