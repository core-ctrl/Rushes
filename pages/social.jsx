import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Users, Heart } from 'lucide-react';
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
        <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-black to-neutral-950 pt-20 pb-12">
            <SEOMeta
                title="Social Feed"
                description="See what your friends are watching and share your movie takes on Rushes."
                url="/social"
                noindex
            />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header & Tabs */}
                <div className="sticky top-[72px] z-30 bg-black/80 backdrop-blur-md border-b border-white/10 mb-6 px-4 pt-4 sm:px-6 lg:px-8 -mx-4 sm:-mx-6 lg:-mx-8">
                    <div className="flex items-center gap-4 mb-4">
                        <h1 className="text-2xl font-black text-white">Home</h1>
                        <div className="ml-auto flex items-center gap-3">
                            <ErrorBoundary>
                                <NotificationBell />
                            </ErrorBoundary>
                            <UserSearch />
                        </div>
                    </div>
                    <div className="flex">
                        <button
                            onClick={() => setFeedType('foryou')}
                            className={`flex-1 pb-4 text-sm font-bold relative transition-colors hover:bg-white/5 ${feedType === 'foryou' ? 'text-white' : 'text-neutral-500'}`}
                        >
                            For You
                            {feedType === 'foryou' && (
                                <motion.div layoutId="feedTab" className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-red-500 rounded-t-full" />
                            )}
                        </button>
                        <button
                            onClick={() => setFeedType('following')}
                            className={`flex-1 pb-4 text-sm font-bold relative transition-colors hover:bg-white/5 ${feedType === 'following' ? 'text-white' : 'text-neutral-500'}`}
                        >
                            Following
                            {feedType === 'following' && (
                                <motion.div layoutId="feedTab" className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-red-500 rounded-t-full" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Create Take */}
                <ErrorBoundary>
                    <div className="hidden md:block">
                        <CreateTake onCreated={handleTakeCreated} />
                    </div>
                </ErrorBoundary>

                {/* Mobile composer button */}
                <button
                    onClick={() => setShowComposer(true)}
                    className="fixed bottom-20 right-4 z-40 md:hidden w-14 h-14 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center shadow-2xl shadow-red-900/50 transition-colors"
                >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
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
                                className="absolute bottom-0 left-0 right-0 bg-neutral-900/60 backdrop-blur-2xl border-t border-white/10 rounded-t-[32px] p-4 pb-8 shadow-[0_-8px_40px_-15px_rgba(0,0,0,0.8)]"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6 shadow-inner" />
                                <CreateTake onCreated={handleTakeCreated} />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Feed */}
                <div className="space-y-6">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="animate-pulse">
                                    <div className="h-32 bg-neutral-800 rounded-2xl mb-4" />
                                    <div className="h-32 space-y-3">
                                        <div className="h-5 bg-neutral-800 rounded w-3/4" />
                                        <div className="h-4 bg-neutral-800 rounded w-1/2" />
                                        <div className="h-10 bg-neutral-800 rounded-full w-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : takes.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-24"
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
                            className="flex flex-col gap-0 border-x border-white/5 bg-black rounded-xl overflow-hidden"
                        >
                            {takes.map((take, index) => (
                                <div key={take.id} className={index !== takes.length - 1 ? "border-b border-white/10" : ""}>
                                    <TakeCard take={take} index={index} onTakeDeleted={() => setRefreshKey(prev => prev + 1)} />
                                </div>
                            ))}
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
