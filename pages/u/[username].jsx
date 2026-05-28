import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { Users, Heart, Film, Star } from 'lucide-react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import TakeCard from '../../components/social/TakeCard';


export default function UserProfile() {
    const router = useRouter();
    const { username } = router.query;
    const currentUser = useSelector(selectUser);
    const [profile, setProfile] = useState(null);
    const [takes, setTakes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [following, setFollowing] = useState(false);

    useEffect(() => {
        if (!username) return;

        const fetchProfile = async () => {
            setLoading(true);
            try {
                const { data: profileData } = await axios.get(`/api/users/${username}/profile`);
                setProfile(profileData.user);

                if (currentUser) {
                    setFollowing(currentUser.following?.includes(profileData.user._id) || false);
                }

                // Fetch user's takes (use feed API with filter, or add new API later)
                const { data } = await axios.get('/api/takes/feed');
                setTakes(data.takes.filter(t => t.username === username));
            } catch (error) {
                console.error('Profile error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [username, currentUser]);

    const handleFollow = async () => {
        if (!currentUser || !profile) return;

        try {
            const action = following ? 'unfollow' : 'follow';
            await axios.post('/api/users/follow', {
                targetUserId: profile._id,
                action
            });
            setFollowing(!following);
        } catch (error) {
            console.error('Follow error:', error);
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
                        className="text-center mb-12"
                    >
                        <div className="relative inline-block mb-6">
                            <img
                                src={profile.avatar || '/avatar.svg'}
                                className="w-32 h-32 rounded-full object-cover border-4 border-white/20 shadow-2xl mx-auto"
                            />
                            <div className="absolute inset-0 w-32 h-32 bg-gradient-to-br from-red-500/10 via-transparent to-purple-500/10 rounded-full opacity-60" />
                        </div>
                        <h1 className="text-4xl font-black bg-gradient-to-r from-white to-neutral-300 bg-clip-text text-transparent mb-2">
                            @{profile.username}
                        </h1>
                        {profile.bio && (
                            <p className="text-xl text-neutral-400 mb-8 max-w-2xl mx-auto">
                                {profile.bio}
                            </p>
                        )}
                        <div className="flex items-center justify-center gap-8 text-sm mb-8">
                            <div className="flex items-center gap-2 text-neutral-400">
                                <Users className="w-5 h-5" />
                                <span className="font-semibold text-white">{profile.followersCount || 0}</span>
                                followers
                            </div>
                            <div className="w-px h-6 bg-neutral-600" />
                            <div className="flex items-center gap-2 text-neutral-400">
                                <Heart className="w-5 h-5" />
                                <span className="font-semibold text-white">{profile.tasteProfile?.totalWatched || 0}</span>
                                watched
                            </div>
                        </div>

                        {!isOwnProfile && (
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={handleFollow}
                                className={`px-8 py-4 rounded-2xl font-semibold text-lg shadow-lg transition-all ${following
                                    ? 'bg-neutral-800 text-neutral-200 border-2 border-neutral-600/50 hover:border-neutral-500 hover:bg-neutral-700'
                                    : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white shadow-glow-red'
                                    }`}
                            >
                                {following ? 'Following' : 'Follow'}
                            </motion.button>
                        )}
                    </motion.div>



                    {/* Content */}
                    <div className="space-y-6">
                        {takes.length === 0 ? (
                            <motion.div
                                className="text-center py-24 rounded-3xl border border-dashed border-neutral-700 bg-neutral-900/50"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                <Film className="w-20 h-20 text-neutral-600 mx-auto mb-6" />
                                <h3 className="text-2xl font-bold text-neutral-400 mb-3">
                                    No takes yet
                                </h3>
                                <p className="text-neutral-500 max-w-md mx-auto">
                                    {isOwnProfile ? 'Share your first movie take!' : `@${profile.username} hasn't shared any takes yet.`}
                                </p>
                            </motion.div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {takes.map((take, index) => (
                                    <TakeCard key={take.id} take={take} index={index} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
