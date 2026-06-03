import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Heart, Film, MoreHorizontal, ShieldAlert, Ban, Flag, Share2 } from 'lucide-react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import TakeCard from '../../components/social/TakeCard';
import VerifiedBadge from '../../components/VerifiedBadge';
import ReportModal from '../../components/ReportModal';
import { toast } from '../../components/ui/Toaster';
import ProfileCardModal from '../../components/ProfileCardModal';
import { MessageCircle } from 'lucide-react';

export default function UserProfile() {
    const router = useRouter();
    const { username } = router.query;
    const currentUser = useSelector(selectUser);
    const [profile, setProfile] = useState(null);
    const [takes, setTakes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [following, setFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [lists, setLists] = useState([]);
    const [activeTab, setActiveTab] = useState('takes');
    const [showShareCard, setShowShareCard] = useState(false);

    const handleShare = () => {
        setShowShareCard(true);
    };

    useEffect(() => {
        if (!username) return;

        const fetchProfile = async () => {
            setLoading(true);
            try {
                const { data: profileData } = await axios.get(`/api/users/${username}/profile`);
                setProfile(profileData.user);

                if (currentUser) {
                    setFollowing(currentUser.following?.includes(profileData.user._id) || false);
                    setIsBlocked(currentUser.blockedUsers?.includes(profileData.user._id) || false);
                }

                const { data } = await axios.get('/api/takes/feed');
                setTakes(data.takes.filter(t => t.username === username));

                const { data: listsData } = await axios.get(`/api/lists?userId=${profileData.user._id}`);
                setLists(listsData.lists || []);
            } catch (error) {
                console.error('Profile error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [username, currentUser]);

    const handleFollow = async () => {
        if (!currentUser || !profile || followLoading) return;

        setFollowLoading(true);
        try {
            const action = following ? 'unfollow' : 'follow';
            await axios.post('/api/users/follow', {
                targetUserId: profile._id,
                action
            });
            setFollowing(!following);
            toast({ type: 'success', message: following ? `Unfollowed @${profile.username}` : `Now following @${profile.username}` });
        } catch (error) {
            toast({ type: 'error', message: error.response?.data?.error || 'Action failed' });
        } finally {
            setFollowLoading(false);
        }
    };

    const handleBlock = async () => {
        if (!currentUser || !profile) return;
        try {
            const action = isBlocked ? 'unblock' : 'block';
            await axios.post('/api/users/block', {
                targetUserId: profile._id,
                action
            });
            setIsBlocked(!isBlocked);
            if (!isBlocked) setFollowing(false);
            setShowMenu(false);
            toast({ type: 'info', message: isBlocked ? `Unblocked @${profile.username}` : `Blocked @${profile.username}` });
        } catch (error) {
            toast({ type: 'error', message: 'Action failed' });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">
                User not found
            </div>
        );
    }

    const isOwnProfile = currentUser?._id === profile._id;

    return (
        <>
            <Head>
                <title>@{profile.username} | MovieFinder</title>
            </Head>
            <div className="min-h-screen bg-gradient-to-br from-neutral-900 to-black pt-24 pb-12">
                <div className="max-w-4xl mx-auto px-4">
                    {/* Profile header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-12 relative"
                    >
                        <div className="absolute top-0 right-0 flex items-center gap-2">
                            <button
                                onClick={handleShare}
                                className="p-2 rounded-xl text-neutral-500 hover:text-white hover:bg-white/10 transition-all"
                                title="Share Profile"
                            >
                                <Share2 className="w-5 h-5" />
                            </button>

                            {!isOwnProfile && currentUser && (
                                <div className="relative z-50">
                                    <button
                                        onClick={() => setShowMenu(!showMenu)}
                                        className="p-2 rounded-xl text-neutral-500 hover:text-white hover:bg-white/10 transition-all"
                                    >
                                        <MoreHorizontal className="w-5 h-5" />
                                    </button>

                                    <AnimatePresence>
                                        {showMenu && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9, y: -4 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.9, y: -4 }}
                                                className="absolute right-0 mt-1 w-56 bg-neutral-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                                            >
                                                <button
                                                    onClick={handleBlock}
                                                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-left hover:bg-white/5 transition-colors text-neutral-300 hover:text-white"
                                                >
                                                    <Ban className="w-4 h-4" />
                                                    {isBlocked ? `Unblock @${profile.username}` : `Block @${profile.username}`}
                                                </button>
                                                <button
                                                    onClick={() => { setShowReportModal(true); setShowMenu(false); }}
                                                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-left hover:bg-white/5 transition-colors text-red-400 hover:text-red-300"
                                                >
                                                    <Flag className="w-4 h-4" />
                                                    Report @{profile.username}
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>

                        <div className="relative inline-block mb-6">
                            <img
                                src={profile.avatar || '/avatar.svg'}
                                alt={`@${profile.username}`}
                                className="w-32 h-32 rounded-full object-cover border-4 border-white/20 shadow-2xl mx-auto"
                            />
                            <div className="absolute inset-0 w-32 h-32 bg-gradient-to-br from-red-500/10 via-transparent to-purple-500/10 rounded-full opacity-60" />
                        </div>

                        <h1 className="text-4xl font-black bg-gradient-to-r from-white to-neutral-300 bg-clip-text text-transparent mb-2 flex items-center justify-center gap-2">
                            @{profile.username}
                            {profile.isVerified && <VerifiedBadge size={22} />}
                            {profile.isAdmin && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-semibold">
                                    <ShieldAlert className="w-3 h-3" /> Admin
                                </span>
                            )}
                        </h1>

                        {profile.bio && (
                            <p className="text-xl text-neutral-400 mb-8 max-w-2xl mx-auto">
                                {profile.bio}
                            </p>
                        )}

                        <div className="flex items-center justify-center gap-8 text-sm mb-8">
                            <div className="flex items-center gap-2 text-neutral-400">
                                <Users className="w-5 h-5" />
                                <span className="font-semibold text-white">{profile.followers?.length || profile.followersCount || 0}</span>
                                followers
                            </div>
                            <div className="w-px h-6 bg-neutral-600" />
                            <div className="flex items-center gap-2 text-neutral-400">
                                <span className="font-semibold text-white">{profile.following?.length || 0}</span>
                                following
                            </div>
                            <div className="w-px h-6 bg-neutral-600" />
                            <div className="flex items-center gap-2 text-neutral-400">
                                <Heart className="w-5 h-5" />
                                <span className="font-semibold text-white">{profile.tasteProfile?.totalWatched || 0}</span>
                                watched
                            </div>
                        </div>

                        {/* OTT Platforms */}
                        {profile.ottPlatforms?.length > 0 && (
                            <div className="flex items-center justify-center gap-2 flex-wrap mb-6">
                                <span className="text-[10px] text-neutral-600 uppercase tracking-wider mr-1">Watches on</span>
                                {profile.ottPlatforms.map(platform => (
                                    <span
                                        key={platform}
                                        className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-neutral-400 capitalize"
                                    >
                                        {platform.replace(/_/g, ' ')}
                                    </span>
                                ))}
                            </div>
                        )}

                        {!isOwnProfile && (
                            <div className="flex items-center justify-center gap-4">
                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleFollow}
                                    disabled={followLoading || isBlocked}
                                    className={`flex-1 max-w-[200px] py-4 rounded-2xl font-semibold text-lg shadow-lg transition-all disabled:opacity-50 ${following
                                        ? 'bg-neutral-800 text-neutral-200 border-2 border-neutral-600/50 hover:border-neutral-500 hover:bg-neutral-700'
                                        : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white shadow-glow-red'
                                        }`}
                                >
                                    {followLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        </span>
                                    ) : isBlocked ? 'Blocked' : following ? 'Following' : 'Follow'}
                                </motion.button>

                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => router.push(`/messages?user=${profile.username}`)}
                                    className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-semibold text-lg bg-white/10 hover:bg-white/20 text-white transition-all border border-white/5 shadow-lg"
                                >
                                    <MessageCircle className="w-5 h-5" />
                                    Message
                                </motion.button>
                            </div>
                        )}
                    </motion.div>

                    {/* Tabs */}
                    <div className="flex items-center justify-center gap-8 mb-8 border-b border-white/10">
                        <button
                            onClick={() => setActiveTab('takes')}
                            className={`pb-4 text-lg font-bold transition-all relative ${activeTab === 'takes' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                        >
                            Takes
                            {activeTab === 'takes' && (
                                <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-1 bg-red-500 rounded-t-full" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('lists')}
                            className={`pb-4 text-lg font-bold transition-all relative ${activeTab === 'lists' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                        >
                            Movie Lists
                            {activeTab === 'lists' && (
                                <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-1 bg-red-500 rounded-t-full" />
                            )}
                        </button>
                    </div>

                    {/* Content */}
                    <div className="space-y-6">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {activeTab === 'takes' ? (
                                    takes.length === 0 ? (
                                        <div className="text-center py-24 rounded-3xl border border-dashed border-neutral-700 bg-neutral-900/50">
                                            <Film className="w-20 h-20 text-neutral-600 mx-auto mb-6" />
                                            <h3 className="text-2xl font-bold text-neutral-400 mb-3">No takes yet</h3>
                                            <p className="text-neutral-500 max-w-md mx-auto">{isOwnProfile ? 'Share your first movie take!' : `@${profile.username} hasn't shared any takes yet.`}</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {takes.map((take, index) => (
                                                <TakeCard key={take.id} take={take} index={index} />
                                            ))}
                                        </div>
                                    )
                                ) : (
                                    lists.length === 0 ? (
                                        <div className="text-center py-24 rounded-3xl border border-dashed border-neutral-700 bg-neutral-900/50">
                                            <Film className="w-20 h-20 text-neutral-600 mx-auto mb-6" />
                                            <h3 className="text-2xl font-bold text-neutral-400 mb-3">No lists yet</h3>
                                            <p className="text-neutral-500 max-w-md mx-auto">{isOwnProfile ? 'Create your first movie list!' : `@${profile.username} hasn't created any public lists.`}</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {lists.map((list) => (
                                                <div key={list._id} className="relative overflow-hidden rounded-3xl border border-white/10 bg-neutral-900 transition-all hover:border-white/20 hover:shadow-2xl">
                                                    <div className="aspect-video w-full bg-neutral-800">
                                                        {list.coverImage ? (
                                                            <img src={`https://image.tmdb.org/t/p/w500${list.coverImage}`} className="h-full w-full object-cover opacity-80" alt="" />
                                                        ) : (
                                                            <div className="flex h-full items-center justify-center text-neutral-600"><Film className="h-8 w-8" /></div>
                                                        )}
                                                    </div>
                                                    <div className="p-5">
                                                        <h3 className="text-xl font-bold text-white mb-2">{list.title}</h3>
                                                        <p className="text-sm text-neutral-400 line-clamp-2 mb-4">{list.description}</p>
                                                        <div className="flex items-center gap-4 text-xs font-semibold text-neutral-500">
                                                            <span>{list.movies?.length || 0} movies</span>
                                                            <span className="capitalize">{list.privacy}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Report Modal */}
            <ReportModal
                open={showReportModal}
                onClose={() => setShowReportModal(false)}
                targetUsername={profile.username}
                targetId={profile._id}
                targetType="user"
            />
            
            <ProfileCardModal 
                open={showShareCard} 
                onClose={() => setShowShareCard(false)} 
                profile={profile}
                takesCount={takes.length}
                listsCount={lists.length}
            />
        </>
    );
}
