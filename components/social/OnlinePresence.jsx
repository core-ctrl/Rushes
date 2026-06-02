import { useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';

export default function OnlinePresence() {
    const user = useSelector(selectUser);

    useEffect(() => {
        const userId = user?.id || user?._id;
        if (!userId) return;

        const updatePresence = async (isOnline) => {
            try {
                const { error } = await supabase
                    .from('presence')
                    .upsert({
                        user_id: userId,
                        username: user.username || user.name,
                        avatar: user.avatar,
                        is_online: isOnline,
                        last_seen: new Date().toISOString()
                    });

                if (error) console.error('Presence update error:', error);
            } catch (error) {
                console.error('Presence error:', error);
            }
        };

        // Set online
        updatePresence(true);

        // Heartbeat every 30s
        const interval = setInterval(() => updatePresence(true), 30000);

        // Set offline on unload
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                updatePresence(false);
            }
        };

        const handleBeforeUnload = () => {
            updatePresence(false);
        };

        window.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('pagehide', handleBeforeUnload);

        return () => {
            clearInterval(interval);
            updatePresence(false);
            window.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('pagehide', handleBeforeUnload);
        };
    }, [user?.id, user?._id]);

    return null; // Invisible component
}
