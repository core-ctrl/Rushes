import { motion } from 'framer-motion';

export default function FriendActivity({ activity }) {
    if (!activity || activity.length === 0) return null;

    const displayFriends = activity.slice(0, 3);
    const remaining = activity.length - 3;

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex items-center gap-1.5 mt-2 mb-1"
        >
            <div className="flex -space-x-1">
                {displayFriends.map((friend, i) => (
                    <motion.img
                        key={i}
                        src={friend.avatar || '/default-avatar.png'}
                        alt={`@${friend.username}`}
                        className="w-6 h-6 rounded-full object-cover border-2 border-neutral-900/50 shadow-md"
                        whileHover={{ scale: 1.2 }}
                    />
                ))}
            </div>
            <span className="text-xs text-neutral-400 leading-tight">
                Liked by{' '}
                <span className="font-semibold text-neutral-200">@{displayFriends[0].username}</span>
                {activity.length > 1 && (
                    <>
                        {remaining > 0 ? ` and ${remaining + 1} others` : ` and ${activity.length - 1} other${activity.length > 2 ? 's' : ''}`}
                    </>
                )}
            </span>
        </motion.div>
    );
}
